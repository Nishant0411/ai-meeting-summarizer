import os
import json
import shutil
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI(title="AI Meeting Summarizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Pydantic models for "Who Said What" and Conversational Extraction
class SpeakerContribution(BaseModel):
    speaker: str = Field(description="Name of speaker if mentioned/implied (e.g. 'Nishant', 'Shivam') or 'Speaker 1', 'Speaker 2'")
    key_points: List[str] = Field(description="Concise points this person raised, explained, or argued")
    commitments_or_stance: str = Field(description="What they agreed to do, their opinion, or what they are looking into")

class ActionItem(BaseModel):
    task: str = Field(description="Deliverable or task deduced from the discussion")
    owner: str = Field(description="Person responsible based on the conversation")
    priority: str = Field(description="High, Medium, or Low")

class MeetingAnalysis(BaseModel):
    executive_summary: str = Field(description="2-3 sentence overview of what the meeting was about")
    who_said_what: List[SpeakerContribution] = Field(description="Detailed breakdown of each person's contributions")
    key_decisions: List[str] = Field(description="Agreed conclusions or decisions reached by the group")
    action_items: List[ActionItem] = Field(description="Deduced next steps from the natural conversation")
    overall_sentiment: str = Field(description="Tone and alignment of the meeting")

class MeetingResponse(BaseModel):
    transcript: str
    analysis: MeetingAnalysis

@app.get("/")
def health():
    return {"status": "backend running successfully"}

@app.post("/api/summarize", response_model=MeetingResponse)
async def summarize_audio(file: UploadFile = File(...)):
    valid_exts = (".mp3", ".wav", ".m4a", ".mp4", ".mpeg", ".ogg")
    if not file.filename.lower().endswith(valid_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Please upload {', '.join(valid_exts)}"
        )

    temp_path = f"temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Transcribe conversational audio via Whisper Large V3
        with open(temp_path, "rb") as audio:
            whisper_res = groq_client.audio.transcriptions.create(
                file=(file.filename, audio.read()),
                model="whisper-large-v3",
                response_format="text"
            )

        transcript = whisper_res if isinstance(whisper_res, str) else getattr(whisper_res, "text", str(whisper_res))

        if not transcript.strip():
            raise HTTPException(status_code=400, detail="No speech detected in the audio file.")

        # 2. Extract "Who Said What" from natural conversational dialogue
        prompt = f"""
        You are an expert executive meeting analyst. The following is a raw audio transcript of a team meeting where people speak naturally, debate, and exchange ideas.

        Perform a conversational breakdown:
        1. Executive Summary: 2-3 sentences summarizing the purpose and outcome of the discussion.
        2. Who Said What:
           - Identify distinct speakers. If names are mentioned or addressed in the audio (e.g., 'Hey Nishant...', 'Shivam, what do you think?'), use their real names. Otherwise, label them as Speaker 1, Speaker 2, etc.
           - For each speaker, summarize what they said, proposed, or raised.
           - Note their commitments, stance, or what they agreed to investigate.
        3. Key Decisions: Core consensus or final conclusions agreed upon by the team.
        4. Action Items: Deduced follow-ups (who is handling what based on the conversation).
        5. Overall Sentiment.

        Raw Transcript:
        {transcript}
        """

        analysis_data = None

        # Try Gemini models
        for g_model in ["gemini-3.8-flash", "gemini-flash-latest"]:
            try:
                gemini_res = gemini_client.models.generate_content(
                    model=g_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=MeetingAnalysis,
                    ),
                )
                raw_text = gemini_res.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]

                analysis_data = json.loads(raw_text.strip())
                break
            except Exception as e:
                print(f"[Notice] {g_model} unavailable, trying fallback... ({e})")
                time.sleep(1)

        # Failover to Groq text models if Gemini has a temporary spike
        if not analysis_data:
            for q_model in ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"]:
                try:
                    groq_chat = groq_client.chat.completions.create(
                        model=q_model,
                        messages=[
                            {
                                "role": "system",
                                "content": (
                                    "You are an executive meeting assistant. Return ONLY valid JSON with this exact schema:\n"
                                    "{\n"
                                    '  "executive_summary": "string",\n'
                                    '  "who_said_what": [{"speaker": "string", "key_points": ["string"], "commitments_or_stance": "string"}],\n'
                                    '  "key_decisions": ["string"],\n'
                                    '  "action_items": [{"task": "string", "owner": "string", "priority": "High|Medium|Low"}],\n'
                                    '  "overall_sentiment": "string"\n'
                                    "}"
                                ),
                            },
                            {"role": "user", "content": prompt},
                        ],
                        response_format={"type": "json_object"},
                    )
                    analysis_data = json.loads(groq_chat.choices[0].message.content)
                    break
                except Exception:
                    continue

        if not analysis_data:
            raise HTTPException(status_code=500, detail="Unable to process transcript. Please try again.")

        return MeetingResponse(
            transcript=transcript,
            analysis=analysis_data
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)