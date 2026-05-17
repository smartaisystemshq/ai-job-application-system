import React, { useState, useEffect } from 'react';

const LS = { jd: 'jas.ip.jd', rawResult: 'jas.ip.rawResult' };

function parseQuestions(raw) {
  const questions = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  const blocks = raw.split(/\n(?=\d{1,2}[.)]\s|\*\*\d{1,2}[.)]\*\*|\bQuestion\s+\d)/i).filter(Boolean);

  if (blocks.length >= 4) {
    for (const block of blocks) {
      const lines = block.trim().split('\n').filter(Boolean);
      if (lines.length === 0) continue;
      const firstLine = lines[0]
        .replace(/^\*?\*?\d+[.)]\*?\*?\s*/, '')
        .replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
      const rest = lines.slice(1).join('\n')
        .replace(/^\*?(answer framework|framework|how to answer|suggested approach)[:\s]*/i, '').trim();
      if (firstLine) questions.push({ question: firstLine, framework: rest });
    }
  }

  if (questions.length > 0) return questions;
  return [{ question: 'Interview Questions & Frameworks', framework: raw }];
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
      {copied ? '✓ Copied' : '⎘ Copy All'}
    </button>
  );
}

export default function InterviewPrep() {
  const [jobDescription, setJobDescription] = useState(() => localStorage.getItem(LS.jd) || '');
  const [rawResult, setRawResult] = useState(() => localStorage.getItem(LS.rawResult) || '');
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem(LS.rawResult);
    return saved ? parseQuestions(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { localStorage.setItem(LS.jd, jobDescription); }, [jobDescription]);
  useEffect(() => { if (rawResult) localStorage.setItem(LS.rawResult, rawResult); }, [rawResult]);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) { setError('Please paste a job description first.'); return; }
    setLoading(true); setError(''); setRawResult(''); setQuestions([]);
    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jobDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');
      setRawResult(data.result);
      setQuestions(parseQuestions(data.result));
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJobDescription(''); setRawResult(''); setQuestions([]); setError('');
    Object.values(LS).forEach(k => localStorage.removeItem(k));
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Interview Prep</h1>
        <p>Paste the job description and get the 8 most likely interview questions with answer frameworks</p>
      </div>

      <div className="section-desc">
        <strong>How it works:</strong> Paste the job description and Claude generates the 8 most likely interview questions with specific answer frameworks — not generic tips, but role-tailored guidance on what interviewers are actually testing for.
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">Job Description</label>
          <textarea
            className="textarea"
            rows={10}
            placeholder="Paste the full job description here — include responsibilities, requirements, and any 'nice to have' skills..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading || !jobDescription.trim()}
          style={{ minWidth: 180 }}
        >
          {loading ? <><span className="spinner"></span> Generating...</> : '◈ Generate Questions'}
        </button>
        {(jobDescription || rawResult) && (
          <button className="btn btn-secondary" onClick={handleClear} disabled={loading}>Clear</button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
          <div className="spinner-lg"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Analyzing the role and building your interview prep...</p>
        </div>
      )}

      {questions.length > 0 && !loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>
              <span style={{ color: 'var(--accent)', marginRight: 8 }}>◈</span>
              {questions.length} Interview Questions
            </h2>
            <CopyButton text={rawResult} />
          </div>

          {questions.map((q, i) => (
            <div key={i} className="question-item">
              <div className="question-number">Question {i + 1}</div>
              <div className="question-text">{q.question}</div>
              {q.framework && <div className="question-framework">{q.framework}</div>}
            </div>
          ))}

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            Practise answering each question out loud and prepare 1-2 specific examples (STAR method works well).
          </p>
        </div>
      )}
    </div>
  );
}
