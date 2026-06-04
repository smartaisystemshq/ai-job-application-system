import React, { useState, useEffect, useRef } from 'react';
import FileUploadField from './FileUploadField';
import DownloadButtons from '../utils/DownloadButtons';
import DocumentPreview from '../utils/DocumentPreview';
import ScoreCard, { calculateAttractivenessScore, KeywordMatch } from './ScoreCard';
import { stripMarkdown } from '../utils/downloadUtils';
import { TEMPLATES, TemplateSelector } from './TemplateSelector';
import LockedContent from './LockedContent';

const LS = { cv: 'jas.cvo.cv', jd: 'jas.cvo.jd', result: 'jas.cvo.result' };

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
      {copied ? '✓ Copied' : '⎘ Copy'}
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
        body: JSON.stringify({ documentText: currentDocument, instruction: input.trim(), documentType: 'cv' }),
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
        <span className="mini-chatbot-hint">Type a request — Claude updates the CV above</span>
      </div>
      <div className="mini-chatbot-row">
        <input
          className="input mini-chatbot-input"
          placeholder={`"Make it shorter", "Add more Python keywords", "Formal tone", "Stronger opening"...`}
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

export default function CVOptimizer({ unlocked, onUnlock }) {
  const [cv, setCv] = useState(() => localStorage.getItem(LS.cv) || '');
  const [cvFile, setCvFile] = useState(null);
  const [cvPdfBase64, setCvPdfBase64] = useState('');

  const [jobDescription, setJobDescription] = useState(() => localStorage.getItem(LS.jd) || '');
  const [jdFile, setJdFile] = useState(null);
  const [jdPdfBase64, setJdPdfBase64] = useState('');

  const [result, setResult] = useState(() => localStorage.getItem(LS.result) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');
  const [score, setScore] = useState(null);

  const jdRef = useRef(null);
  const generateRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => { localStorage.setItem(LS.cv, cv); }, [cv]);
  useEffect(() => { localStorage.setItem(LS.jd, jobDescription); }, [jobDescription]);
  useEffect(() => { if (result) localStorage.setItem(LS.result, result); }, [result]);

  const handleCvFileSelect = (fileInfo, content) => {
    setCvFile(fileInfo);
    if (fileInfo.type === 'pdf') { setCvPdfBase64(content); setCv(''); }
    else { setCv(content); setCvPdfBase64(''); }
    // Auto-scroll to JD field after CV is loaded
    setTimeout(() => jdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  };
  const handleCvFileRemove = () => { setCvFile(null); setCvPdfBase64(''); setCv(''); };

  const handleJdFileSelect = (fileInfo, content) => {
    setJdFile(fileInfo);
    if (fileInfo.type === 'pdf') { setJdPdfBase64(content); setJobDescription(''); }
    else { setJobDescription(content); setJdPdfBase64(''); }
    // Auto-scroll to generate button after JD is loaded
    setTimeout(() => generateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  };
  const handleJdFileRemove = () => { setJdFile(null); setJdPdfBase64(''); setJobDescription(''); };

  const canSubmit = (cv.trim() || cvPdfBase64) && (jobDescription.trim() || jdPdfBase64);

  const handleOptimize = async () => {
    if (!canSubmit) { setError('Please provide both your CV and the job description.'); return; }
    setLoading(true); setError(''); setResult(''); setScore(null);
    try {
      const res = await fetch('/api/optimize-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: jobDescription.trim() || undefined,
          cv: cv.trim() || undefined,
          cvPdf: cvPdfBase64 || undefined,
          jdPdf: jdPdfBase64 || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to optimize CV');
      const clean = stripMarkdown(data.result);
      setResult(clean);
      setScore(calculateAttractivenessScore(clean, jobDescription));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCv(''); setCvFile(null); setCvPdfBase64('');
    setJobDescription(''); setJdFile(null); setJdPdfBase64('');
    setResult(''); setError(''); setScore(null);
    Object.values(LS).forEach(k => localStorage.removeItem(k));
  };

  const handleAdjustUpdate = (newResult) => {
    setResult(newResult);
    setScore(calculateAttractivenessScore(newResult, jobDescription));
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  return (
    <div>
      {/* ── Section A: Hero ── */}
      <div className="tool-hero scroll-reveal">
        <div className="tool-hero-badge">
          <span>✦</span><span>CV OPTIMIZER</span>
        </div>
        <h1 className="tool-hero-h1">
          Tailor your <span className="tool-kw">CV</span> to any job in seconds
        </h1>
        <p className="tool-hero-sub">
          Upload your CV and the job description — AI rewrites your CV with the exact keywords recruiters and ATS systems look for. You get an interview-ready version in under a minute.
        </p>
        <p className="tool-ats-note">
          ATS = the software companies use to filter CVs before a human ever sees them. Our AI makes sure yours gets through.
        </p>
      </div>

      {/* ── Section B: How it works ── */}
      <div className="tool-steps-wrap scroll-reveal">
        <div className="tool-step"><div className="tool-step-num">1</div><span className="tool-step-text">Upload CV</span></div>
        <span className="tool-step-arrow">→</span>
        <div className="tool-step"><div className="tool-step-num">2</div><span className="tool-step-text">Paste job description</span></div>
        <span className="tool-step-arrow">→</span>
        <div className="tool-step"><div className="tool-step-num">3</div><span className="tool-step-text">Get tailored CV</span></div>
      </div>

      {/* ── Section C: Divider ── */}
      <div className="tool-divider" />

      {/* ── Section D: Input area ── */}
      <div className="tool-section" style={{ padding: '0 40px 32px' }}>
        <TemplateSelector selectedTemplate={selectedTemplate} onSelect={setSelectedTemplate} />

        <div className="two-col scroll-reveal" style={{ marginBottom: 20 }}>
          <div className="input-card">
            <FileUploadField
              label="Your CV"
              value={cv}
              onChange={setCv}
              onFileSelect={handleCvFileSelect}
              onFileRemove={handleCvFileRemove}
              file={cvFile}
              placeholder="Paste your full CV here..."
              rows={14}
            />
          </div>
          <div className="input-card" ref={jdRef}>
            <FileUploadField
              label="Job Description"
              value={jobDescription}
              onChange={setJobDescription}
              onFileSelect={handleJdFileSelect}
              onFileRemove={handleJdFileRemove}
              file={jdFile}
              placeholder="Paste the full job description here..."
              rows={14}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Section E: Generate button ── */}
      <div className="tool-section" style={{ padding: '0 40px 32px' }}>
        <div ref={generateRef}>
          <button
            className="tool-generate-btn"
            onClick={handleOptimize}
            disabled={loading || !canSubmit}
          >
            {loading ? <><span className="spinner"></span> Optimizing…</> : '✦ Optimize CV'}
          </button>
          {(cv || cvFile || jobDescription || jdFile || result) && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button className="btn btn-ghost" onClick={handleClear} disabled={loading} style={{ fontSize: 13 }}>
                Clear All
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
            <div className="spinner-lg" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Analyzing job requirements and tailoring your CV…</p>
          </div>
        )}
      </div>

      {/* ── Section F: Tip ── */}
      <div className="tool-section" style={{ padding: '0 40px 60px' }}>
        <div className="tool-tip-box">
          <span>💡</span>
          <span><strong style={{ color: '#1D9E75' }}>Tip:</strong> Templates appear after optimization — pick what suits your industry. Want to adjust? Use the AI chat below the result.</span>
        </div>
      </div>

      {/* ── Section G: Result ── */}
      {result && !loading && (
        <div className="tool-section" style={{ padding: '0 40px 80px', marginTop: 40 }}>
          <div ref={resultRef}>
            <LockedContent unlocked={unlocked} onUnlock={onUnlock}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12, flexWrap: 'wrap', gap: 8,
              }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent)' }}>✦</span>Optimized CV
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>
                    · {TEMPLATES.find(t => t.id === selectedTemplate)?.name} template
                  </span>
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <DownloadButtons text={result} filename="optimized-cv" template={selectedTemplate} />
                  <CopyButton text={result} />
                </div>
              </div>

              <DocumentPreview text={result} template={selectedTemplate} />

              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                Review and personalise before submitting your application.
              </p>

              {score !== null && <ScoreCard score={score} />}

              <KeywordMatch cvText={result} jdText={jobDescription} />

              <MiniChatbot currentDocument={result} onUpdate={handleAdjustUpdate} />
            </LockedContent>
          </div>
        </div>
      )}
    </div>
  );
}
