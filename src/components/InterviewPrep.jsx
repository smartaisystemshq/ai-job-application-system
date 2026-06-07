import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';
import FileUploadField from './FileUploadField';
import { stripMarkdown } from '../utils/downloadUtils';
import LockedContent from './LockedContent';

const LS = { jd: 'jas.ip.jd', rawResult: 'jas.ip.rawResult' };

function parseQuestions(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  // Split on lines that start with a number (1. or 1) or **1. etc.)
  const blocks = raw.split(/\n(?=\*{0,2}\d{1,2}[.)]\s)/).filter(Boolean);

  if (blocks.length >= 4) {
    const questions = [];
    for (const block of blocks) {
      const lines = block.trim().split('\n').filter(Boolean);
      if (lines.length === 0) continue;

      const questionText = lines[0]
        .replace(/^\*{1,2}/, '')           // leading **
        .replace(/\*{1,2}$/, '')           // trailing **
        .replace(/^\d{1,2}[.)]\s+/, '')    // leading number
        .replace(/^\*{1,2}/, '')           // any ** after number removal
        .trim();

      const rest = lines.slice(1).join('\n')
        .replace(/^\s*\*{0,2}(answer framework|framework|how to answer|suggested approach|antwort-leitfaden|hinweis|tipps?)\*{0,2}[:\s]*/i, '')
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
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
      {copied ? t[lang].copy_done : `⎘ ${t[lang].copy_all}`}
    </button>
  );
}

function MiniChatbot({ currentDocument, onUpdate }) {
  const { lang } = useLang();
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
      onUpdate(data.result);
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
        <span>{t[lang].adjust_with_ai}</span>
        <span className="mini-chatbot-hint">{t[lang].adjust_placeholder_interview}</span>
      </div>
      <div className="mini-chatbot-row">
        <input
          className="input mini-chatbot-input"
          placeholder={t[lang].adjust_suggestions_interview.map(s => `"${s}"`).join(', ') + '...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleAdjust()}
          disabled={loading}
        />
        <button className="btn btn-primary btn-sm" onClick={handleAdjust} disabled={loading || !input.trim()} style={{ flexShrink: 0 }}>
          {loading ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'white' }}></span> {t[lang].adjust_applying}</> : t[lang].adjust_apply}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{error}</p>}
    </div>
  );
}

export default function InterviewPrep({ unlocked, onUnlock }) {
  const { lang } = useLang();
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
          language: lang,
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
    <div>
      {/* ── Section A: Hero ── */}
      <div className="tool-hero scroll-reveal">
        <div className="tool-hero-badge">
          <span>◎</span><span>{t[lang].interview_badge}</span>
        </div>
        <h1 className="tool-hero-h1">
          {t[lang].interview_headline_pre} <span className="tool-kw">{t[lang].interview_headline_highlight}</span> {t[lang].interview_headline_post}
        </h1>
        <p className="tool-hero-sub">
          {t[lang].interview_sub}
        </p>
      </div>

      {/* ── Section B: How it works ── */}
      <div className="tool-steps-wrap scroll-reveal">
        <div className="tool-step"><div className="tool-step-num">1</div><span className="tool-step-text">{t[lang].interview_step1}</span></div>
        <span className="tool-step-arrow">→</span>
        <div className="tool-step"><div className="tool-step-num">2</div><span className="tool-step-text">{t[lang].interview_step2}</span></div>
        <span className="tool-step-arrow">→</span>
        <div className="tool-step"><div className="tool-step-num">3</div><span className="tool-step-text">{t[lang].interview_step3}</span></div>
      </div>

      {/* ── Section C: Divider ── */}
      <div className="tool-divider" />

      {/* ── Section D: Input area (single, max-width 480px) ── */}
      <div className="tool-section" style={{ padding: '0 40px 32px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="input-card scroll-reveal">
            <FileUploadField
              label={t[lang].interview_upload_jd}
              value={jobDescription}
              onChange={setJobDescription}
              onFileSelect={handleJdFileSelect}
              onFileRemove={handleJdFileRemove}
              file={jdFile}
              placeholder={t[lang].interview_upload_jd_hint}
              rows={10}
            />
          </div>
        </div>

        {error && (
          <div style={{ maxWidth: 480, margin: '12px auto 0', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Section E: Generate button ── */}
      <div className="tool-section" style={{ padding: '0 40px 32px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button
            className="tool-generate-btn"
            onClick={handleGenerate}
            disabled={loading || newQuestionsLoading || !canSubmit}
          >
            {loading ? <><span className="spinner"></span> {t[lang].generating}</> : <>✦ {t[lang].interview_generate_btn}</>}
          </button>
          {(jobDescription || jdFile || rawResult) && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button className="btn btn-ghost" onClick={handleClear} disabled={loading || newQuestionsLoading} style={{ fontSize: 13 }}>
                {t[lang].clear_all}
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
            <div className="spinner-lg" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t[lang].writing_questions}</p>
          </div>
        )}
      </div>

      {/* ── Section F: Tip ── */}
      <div className="tool-section" style={{ padding: '0 40px 60px' }}>
        <div className="tool-tip-box">
          <span>💡</span>
          <span><strong style={{ color: '#1D9E75' }}>Tip:</strong> {t[lang].interview_tip}</span>
        </div>
      </div>

      {/* ── Section G: Result ── */}
      {questions.length > 0 && !loading && (
        <div className="tool-section" style={{ padding: '0 40px 80px', marginTop: 40 }}>
          <div ref={resultRef}>
            <LockedContent unlocked={unlocked} onUnlock={onUnlock}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '12px 16px', background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent)' }}>◈</span>
                  {questions.length} {t[lang].interview_result_label}
                </h2>
                <CopyButton text={rawResult} />
              </div>

              {questions.map((q, i) => (
                <div key={i} className="question-item scroll-reveal" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="question-number">{t[lang].interview_question_num} {i + 1}</div>
                  <div className="question-text">{q.question}</div>
                  {q.framework && <div className="question-framework">{q.framework}</div>}
                </div>
              ))}

              <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                {t[lang].interview_practice_note}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleNewQuestions}
                  disabled={newQuestionsLoading || loading || !canSubmit}
                  style={{ minWidth: 240, padding: '11px 28px' }}
                >
                  {newQuestionsLoading
                    ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'currentColor' }}></span> {t[lang].generating}</>
                    : t[lang].interview_new_btn}
                </button>
              </div>

              <MiniChatbot currentDocument={rawResult} onUpdate={handleAdjustUpdate} />
            </LockedContent>
          </div>
        </div>
      )}
    </div>
  );
}
