import React, { useState, useEffect, useRef } from 'react';
import FileUploadField from './FileUploadField';
import { stripMarkdown } from '../utils/downloadUtils';

const LS = { jd: 'jas.ip.jd', rawResult: 'jas.ip.rawResult' };

function parseQuestions(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  const blocks = raw.split(/\n(?=\d{1,2}[.)]\s)/).filter(Boolean);

  if (blocks.length >= 4) {
    const questions = [];
    for (const block of blocks) {
      const lines = block.trim().split('\n').filter(Boolean);
      if (lines.length === 0) continue;

      const questionText = lines[0]
        .replace(/^\d{1,2}[.)]\s+/, '')
        .replace(/^\*\*/, '').replace(/\*\*$/, '')
        .trim();

      const rest = lines.slice(1).join('\n')
        .replace(/^\s*\*?\*?(answer framework|framework|how to answer|suggested approach|antwort-leitfaden|hinweis|tipps?)[:\s]*/i, '')
        .trim();

      if (questionText) {
        questions.push({ question: questionText, framework: rest });
      }
    }
    if (questions.length > 0) return questions;
  }

  return [{ question: 'Interview Questions', framework: raw }];
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

function MiniChatbot({ currentDocument, onUpdate }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdjust = async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/adjust-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: currentDocument, instruction: input.trim(), documentType: 'interview-questions' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adjustment failed');
      onUpdate(stripMarkdown(data.result));
      setInput('');
    } catch (err) {
      setError(err.message || 'Failed to apply adjustment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mini-chatbot">
      <div className="mini-chatbot-label">
        <span className="mini-chatbot-icon">✦</span>
        <span>Adjust with AI</span>
        <span className="mini-chatbot-hint">Type a request — Claude updates the questions above</span>
      </div>
      <div className="mini-chatbot-row">
        <input
          className="input mini-chatbot-input"
          placeholder={`"Make the frameworks shorter", "Add STAR examples", "Focus on leadership questions", "Translate to German"...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleAdjust()}
          disabled={loading}
        />
        <button className="btn btn-primary btn-sm" onClick={handleAdjust} disabled={loading || !input.trim()} style={{ flexShrink: 0 }}>
          {loading ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'white' }}></span> Applying…</> : 'Apply →'}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{error}</p>}
    </div>
  );
}

export default function InterviewPrep() {
  const [jobDescription, setJobDescription] = useState(() => localStorage.getItem(LS.jd) || '');
  const [jdFile, setJdFile] = useState(null);
  const [jdPdfBase64, setJdPdfBase64] = useState('');

  const [rawResult, setRawResult] = useState(() => localStorage.getItem(LS.rawResult) || '');
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem(LS.rawResult);
    return saved ? parseQuestions(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [newQuestionsLoading, setNewQuestionsLoading] = useState(false);
  const [error, setError] = useState('');

  const resultRef = useRef(null);

  useEffect(() => { localStorage.setItem(LS.jd, jobDescription); }, [jobDescription]);
  useEffect(() => { if (rawResult) localStorage.setItem(LS.rawResult, rawResult); }, [rawResult]);

  const handleJdFileSelect = (fileInfo, content) => {
    setJdFile(fileInfo);
    if (fileInfo.type === 'pdf') { setJdPdfBase64(content); setJobDescription(''); }
    else { setJobDescription(content); setJdPdfBase64(''); }
  };
  const handleJdFileRemove = () => { setJdFile(null); setJdPdfBase64(''); setJobDescription(''); };

  const canSubmit = jobDescription.trim() || jdPdfBase64;

  const fetchQuestions = async (isNew = false) => {
    if (!canSubmit) { setError('Please paste or upload a job description first.'); return; }
    if (isNew) {
      setNewQuestionsLoading(true);
    } else {
      setLoading(true); setRawResult(''); setQuestions([]);
    }
    setError('');
    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: jobDescription.trim() || undefined,
          jdPdf: jdPdfBase64 || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');
      setRawResult(data.result);
      setQuestions(parseQuestions(data.result));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setNewQuestionsLoading(false);
    }
  };

  const handleGenerate = () => fetchQuestions(false);
  const handleNewQuestions = () => fetchQuestions(true);

  const handleClear = () => {
    setJobDescription('');
    setJdFile(null);
    setJdPdfBase64('');
    setRawResult('');
    setQuestions([]);
    setError('');
    Object.values(LS).forEach(k => localStorage.removeItem(k));
  };

  const handleAdjustUpdate = (newRaw) => {
    setRawResult(newRaw);
    setQuestions(parseQuestions(newRaw));
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  return (
    <div className="page">
      <div className="page-header scroll-reveal">
        <h1>Interview Prep</h1>
        <p>Paste or upload the job description and get the 8 most likely interview questions with answer frameworks</p>
      </div>

      <div className="section-desc scroll-reveal">
        <strong>How it works:</strong> Provide the job description and Claude generates the 8 most likely interview questions with specific answer frameworks — not generic tips, but role-tailored guidance on what interviewers are actually testing for. Language matches the job description automatically.
      </div>

      <div className="card scroll-reveal" style={{ marginBottom: 20 }}>
        <FileUploadField
          label="Job Description"
          value={jobDescription}
          onChange={setJobDescription}
          onFileSelect={handleJdFileSelect}
          onFileRemove={handleJdFileRemove}
          file={jdFile}
          placeholder="Paste the full job description here — include responsibilities, requirements, and any 'nice to have' skills..."
          rows={10}
        />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }} className="scroll-reveal">
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading || newQuestionsLoading || !canSubmit}
          style={{ minWidth: 180 }}
        >
          {loading ? <><span className="spinner"></span> Generating...</> : '◈ Generate Questions'}
        </button>
        {(jobDescription || jdFile || rawResult) && (
          <button className="btn btn-secondary" onClick={handleClear} disabled={loading || newQuestionsLoading}>Clear</button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
          <div className="spinner-lg"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Analyzing the role and building your interview prep...</p>
        </div>
      )}

      {questions.length > 0 && !loading && (
        <div ref={resultRef}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '12px 16px', background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>◈</span>
              {questions.length} Interview Questions
            </h2>
            <CopyButton text={rawResult} />
          </div>

          {questions.map((q, i) => (
            <div key={i} className="question-item scroll-reveal" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="question-number">Question {i + 1}</div>
              <div className="question-text">{q.question}</div>
              {q.framework && <div className="question-framework">{q.framework}</div>}
            </div>
          ))}

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            Practise answering each question out loud and prepare 1-2 specific examples (STAR method works well).
          </p>

          {/* New Interview Questions button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={handleNewQuestions}
              disabled={newQuestionsLoading || loading || !canSubmit}
              style={{ minWidth: 240, padding: '11px 28px' }}
            >
              {newQuestionsLoading
                ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'currentColor' }}></span> Generating new questions…</>
                : '↺ New Interview Questions'}
            </button>
          </div>

          <MiniChatbot currentDocument={rawResult} onUpdate={handleAdjustUpdate} />
        </div>
      )}
    </div>
  );
}
