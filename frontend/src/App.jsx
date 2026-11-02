import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ListChecks, Download, UserCheck, Sparkles, MessageSquareQuote } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const loadConversationalDemo = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      setResult({
        transcript:
          "Nishant: In this sprint, I optimized the FastAPI backend and Whisper transcription pipeline for parallel audio chunking.\n\n" +
          "Shivam: I completed the responsive React dashboard and verified the upload state transitions.\n\n" +
          "Saksham: On the database side, I resolved connection timeouts by implementing Supabase connection pooling and Redis token caching.\n\n" +
          "Nishant: Let's agree to freeze the API contracts by Wednesday at 6 PM so we can run full regression tests on Thursday.",
        analysis: {
          executive_summary:
            "The engineering team met to review backend latency optimizations and UI status indicators. Nishant built parallel audio chunking for the Whisper pipeline, Shivam finalized the React interface, and Saksham stabilized database connections with Supabase pooling and Redis. The team agreed on a Wednesday 6 PM API freeze.",
          who_said_what: [
            {
              speaker: "Nishant",
              key_points: [
                "Implemented parallel audio chunking to significantly lower Whisper API latency.",
                "Proposed freezing all API contracts by Wednesday 6 PM for integration testing."
              ],
              commitments_or_stance: "Finishing the FFmpeg segmentation utility in FastAPI."
            },
            {
              speaker: "Shivam",
              key_points: [
                "Finalized the React dashboard components and file upload dropzones.",
                "Verified upload state transitions and error feedback."
              ],
              commitments_or_stance: "Integrating upload stage indicators with backend endpoints."
            },
            {
              speaker: "Saksham",
              key_points: [
                "Diagnosed MySQL connection pool drops under concurrent workloads.",
                "Migrated query pooling to Supabase and added Redis token caching."
              ],
              commitments_or_stance: "Monitoring caching layer performance."
            }
          ],
          key_decisions: [
            "Use parallel audio chunking to keep transcription latency under 4 seconds.",
            "Freeze all API contracts on Wednesday at 6:00 PM.",
            "Perform end-to-end regression testing on Thursday."
          ],
          action_items: [
            { task: "Deploy FastAPI chunking endpoint", owner: "Nishant", priority: "High" },
            { task: "Connect upload stage indicators in React", owner: "Shivam", priority: "Medium" },
            { task: "Benchmark Redis cache hit rates", owner: "Saksham", priority: "Low" }
          ],
          overall_sentiment: "Constructive, technically aligned, and focused on delivery."
        }
      });
      setLoading(false);
    }, 300);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/summarize', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to process audio');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Error communicating with backend.');
    } finally {
      setLoading(false);
    }
  };

  const exportMarkdown = () => {
    if (!result) return;
    const { executive_summary, who_said_what, key_decisions, action_items, overall_sentiment } = result.analysis;
    let md = `# Meeting Intelligence Report\n\n`;
    md += `## Executive Summary\n${executive_summary}\n\n**Sentiment:** ${overall_sentiment}\n\n`;
    md += `## Who Said What (Speaker Breakdown)\n`;
    who_said_what.forEach(s => {
      md += `### ${s.speaker}\n`;
      s.key_points.forEach(p => md += `- ${p}\n`);
      md += `*Commitment/Stance:* ${s.commitments_or_stance}\n\n`;
    });
    md += `## Key Decisions\n`;
    key_decisions.forEach(d => md += `- ${d}\n`);
    md += `\n## Action Items\n`;
    action_items.forEach(a => md += `- [${a.priority}] ${a.task} (Owner: ${a.owner})\n`);
    md += `\n## Full Transcript\n${result.transcript}`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Breakdown_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '40px auto', padding: '0 20px', color: '#f8fafc' }}>
      <header style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', marginBottom: '6px' }}>
          AI Meeting Summarizer
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Speaker Attribution &bull; "Who Said What" &bull; FastAPI &bull; Whisper &bull; Gemini
        </p>
      </header>

      {/* Upload Box */}
      <form
        onSubmit={handleUpload}
        className="upload-box"
        style={{
          border: '2px dashed #334155',
          borderRadius: '12px',
          padding: '28px 20px',
          textAlign: 'center',
          background: '#1e293b',
          marginBottom: '24px',
        }}
      >
        <input
          type="file"
          accept=".mp3,.wav,.m4a,.mp4,.mpeg,.ogg"
          id="audio-upload"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
              setError('');
            }
          }}
          style={{ display: 'none' }}
        />
        <label
          htmlFor="audio-upload"
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #334155',
            }}
          >
            <Upload color="#38bdf8" />
          </div>
          <span style={{ fontWeight: '600', fontSize: '15px', color: '#f1f5f9' }}>
            {file ? file.name : 'Click to select meeting audio'}
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Supports natural conversation recordings (MP3, WAV, M4A, OGG)
          </span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '18px' }}>
          <button
            type="submit"
            disabled={loading || !file}
            style={{
              backgroundColor: loading || !file ? '#475569' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: loading || !file ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {loading && <Loader2 className="animate-spin" />}
            {loading ? 'Analyzing Conversation...' : 'Summarize Audio'}
          </button>

          <button
            type="button"
            onClick={loadConversationalDemo}
            style={{
              backgroundColor: '#334155',
              color: '#e2e8f0',
              border: '1px solid #475569',
              padding: '9px 16px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles color="#38bdf8" /> Load Natural Meeting Demo
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#450a0a',
            border: '1px solid #991b1b',
            color: '#fca5a5',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          <AlertCircle color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Dashboard */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={exportMarkdown}
              style={{
                padding: '8px 14px',
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              <Download color="#38bdf8" /> Export Report (.md)
            </button>
          </div>

          {/* Overview */}
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff',
              }}
            >
              <FileText color="#38bdf8" /> Meeting Overview
            </h2>
            <p style={{ lineHeight: '1.6', color: '#cbd5e1', margin: 0, fontSize: '14px' }}>
              {result.analysis.executive_summary}
            </p>
            <div
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid #334155',
              }}
            >
              <strong style={{ color: '#e2e8f0' }}>Meeting Tone:</strong> {result.analysis.overall_sentiment}
            </div>
          </div>

          {/* Who Said What */}
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff',
              }}
            >
              <MessageSquareQuote color="#f59e0b" /> Who Said What (Speaker Breakdown)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.analysis.who_said_what.map((person, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div
                      style={{
                        padding: '2px 8px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <UserCheck /> {person.speaker}
                    </div>
                  </div>

                  <ul style={{ paddingLeft: '18px', margin: '0 0 8px 0', lineHeight: '1.6', color: '#cbd5e1', fontSize: '13px' }}>
                    {person.key_points.map((pt, ptIdx) => (
                      <li key={ptIdx}>{pt}</li>
                    ))}
                  </ul>

                  {person.commitments_or_stance && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px dashed #334155', paddingTop: '6px' }}>
                      <strong style={{ color: '#e2e8f0', fontStyle: 'normal' }}>Stance / Commitment:</strong> {person.commitments_or_stance}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Decisions */}
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff',
              }}
            >
              <ListChecks color="#2dd4bf" /> Key Decisions & Consensus
            </h2>
            <ul style={{ paddingLeft: '18px', margin: 0, lineHeight: '1.6', color: '#cbd5e1', fontSize: '13px' }}>
              {result.analysis.key_decisions.map((dec, i) => (
                <li key={i}>{dec}</li>
              ))}
            </ul>
          </div>

          {/* Action Items */}
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff',
              }}
            >
              <CheckCircle2 color="#4ade80" /> Action Items
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    <th style={{ padding: '8px 10px' }}>Task</th>
                    <th style={{ padding: '8px 10px' }}>Owner</th>
                    <th style={{ padding: '8px 10px' }}>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.action_items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #283548' }}>
                      <td style={{ padding: '10px', color: '#e2e8f0' }}>{item.task}</td>
                      <td style={{ padding: '10px', fontWeight: '600', color: '#38bdf8' }}>{item.owner}</td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor:
                              item.priority.toLowerCase() === 'high'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : item.priority.toLowerCase() === 'medium'
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(100, 116, 139, 0.2)',
                            color:
                              item.priority.toLowerCase() === 'high'
                                ? '#f87171'
                                : item.priority.toLowerCase() === 'medium'
                                  ? '#fbbf24'
                                  : '#94a3b8',
                          }}
                        >
                          {item.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw Transcript */}
          <details
            style={{
              background: '#111827',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#94a3b8', fontSize: '13px' }}>
              View Raw Transcript
            </summary>
            <p
              style={{
                marginTop: '12px',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#cbd5e1',
                whiteSpace: 'pre-wrap',
              }}
            >
              {result.transcript}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}