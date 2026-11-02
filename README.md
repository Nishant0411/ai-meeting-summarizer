# AI Meeting Summarizer & Speaker Attribution Engine

An end-to-end full-stack platform designed to process conversational meeting audio, attribute arguments to individual speakers ('Who Said What'), extract consensus decisions, and generate prioritized follow-up deliverables.

## Tech Stack
- **Backend:** FastAPI, Pydantic v2, Uvicorn
- **AI Pipeline:** OpenAI Whisper Large V3 (via Groq Cloud), Google Gemini 3.8 Flash
- **Frontend:** React, Vite, Lucide Icons

## Features
- Automatic speaker attribution from natural dialogue
- Key decision & consensus extraction
- Prioritized action items table
- One-click Markdown (.md) meeting report export
