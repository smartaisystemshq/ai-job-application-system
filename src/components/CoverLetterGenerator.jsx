import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';
import FileUploadField from './FileUploadField';
import DownloadButtons from '../utils/DownloadButtons';
import DocumentPreview from '../utils/DocumentPreview';
import ScoreCard, { calculateAttractivenessScore } from './ScoreCard';
import { stripMarkdown } from '../utils/downloadUtils';
import { TemplateSelector } from './TemplateSelector';
import LockedContent from './LockedContent';

const LS = {
  filename: 'sas_cover_filename',
  result: 'jas.cl.result',
  cvPdf: 'sas_cover_cv_pdf',
  cvIsPdf: 'sas_cover_cv_ispdf',
  jdFilename: 'sas_cover_jd_filename',
  jdPdf: 'sas_cover_jd_pdf',
  jdIsPdf: 'sas_cover_jd_ispdf',
};

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
      {copied ? t[lang].copy_done : t[lang].copy_btn}
    </button>
  );
}

function wordCount(text) {
  if (!text.trim()) return 0;
  // Skip the sender header block — count only letter body words
  const blocks = text.split(/\n\n+/).filter(b => b.trim());
  const body = (blocks.length > 1 ? blocks.slice(1) : blocks).join(' ').trim();
  return body ? body.split(/\s+/).filter(w => w).length : 0;
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
        body: JSON.stringify({ documentText: currentDocument, instruction: input.trim(), documentType: 'cover-letter' }),
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
        <span>{t[lang].adjust_with_ai}</span>
        <span className="mini-chatbot-hint">{t[lang].adjust_placeholder_cover}</span>
      </div>
      <div className="mini-chatbot-row">
        <input
          className="input mini-chatbot-input"
          placeholder={t[lang].adjust_suggestions_cover.map(s => `"${s}"`).join(', ') + '...'}
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

export default function CoverLetterGenerator({ unlocked, onUnlock, cvText: cv, setCvText: setCv, jdText: jobDescription, setJdText: setJobDescription }) {
  const { lang } = useLang();
  const [cvFile, setCvFile] = useState(null);
  const [cvPdfBase64, setCvPdfBase64] = useState('');

  const [jdFile, setJdFile] = useState(null);
  const [jdPdfBase64, setJdPdfBase64] = useState('');

  const [result, setResult] = useState(() => localStorage.getItem(LS.result) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');

  const jdRef = useRef(null);
  const generateRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    const savedCvFilename = localStorage.getItem(LS.filename);
    const cvIsPdf = localStorage.getItem(LS.cvIsPdf) === 'true';
    if (savedCvFilename) {
      if (cvIsPdf) {
        const savedPdf = localStorage.getItem(LS.cvPdf);
        if (savedPdf) { setCvFile({ name: savedCvFilename, type: 'pdf' }); setCvPdfBase64(savedPdf); }
      } else if (cv) {
        setCvFile({ name: savedCvFilename, type: 'docx' });
      }
    }
    const savedJdFilename = localStorage.getItem(LS.jdFilename);
    const jdIsPdf = localStorage.getItem(LS.jdIsPdf) === 'true';
    if (savedJdFilename) {
      if (jdIsPdf) {
        const savedJdPdf = localStorage.getItem(LS.jdPdf);
        if (savedJdPdf) { setJdFile({ name: savedJdFilename, type: 'pdf' }); setJdPdfBase64(savedJdPdf); }
      } else if (jobDescription) {
        setJdFile({ name: savedJdFilename, type: 'docx' });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (result) localStorage.setItem(LS.result, result); }, [result]);
  useEffect(() => {
    if (cvFile?.name) localStorage.setItem(LS.filename, cvFile.name);
    else localStorage.removeItem(LS.filename);
  }, [cvFile]);
  useEffect(() => {
    if (cvPdfBase64) { localStorage.setItem(LS.cvPdf, cvPdfBase64); localStorage.setItem(LS.cvIsPdf, 'true'); }
    else { localStorage.removeItem(LS.cvPdf); localStorage.removeItem(LS.cvIsPdf); }
  }, [cvPdfBase64]);
  useEffect(() => {
    if (jdFile?.name) localStorage.setItem(LS.jdFilename, jdFile.name);
    else localStorage.removeItem(LS.jdFilename);
  }, [jdFile]);
  useEffect(() => {
    if (jdPdfBase64) { localStorage.setItem(LS.jdPdf, jdPdfBase64); localStorage.setItem(LS.jdIsPdf, 'true'); }
    else { localStorage.removeItem(LS.jdPdf); localStorage.removeItem(LS.jdIsPdf); }
  }, [jdPdfBase64]);

  const handleCvFileSelect = (fileInfo, content) => {
    setCvFile(fileInfo);
    if (fileInfo.type === 'pdf') { setCvPdfBase64(content); setCv(''); }
    else { setCv(content); setCvPdfBase64(''); }
    setTimeout(() => jdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  };
  const handleCvFileRemove = () => { setCvFile(null); setCvPdfBase64(''); setCv(''); };

  const handleJdFileSelect = (fileInfo, content) => {
    setJdFile(fileInfo);
    if (fileInfo.type === 'pdf') { setJdPdfBase64(content); setJobDescription(''); }
    else { setJobDescription(content); setJdPdfBase64(''); }
    setTimeout(() => generateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  };
  const handleJdFileRemove = () => { setJdFile(null); setJdPdfBase64(''); setJobDescription(''); };

  const canSubmit = (cv.trim() || cvPdfBase64) && (jobDescription.trim() || jdPdfBase64);

  const handleGenerate = async () => {
    if (!canSubmit) { setError('Please provide both your CV and the job description.'); return; }
    setLoading(true); setError(''); setResult(''); setScore(null);
    try {
      const res = await fetch('/api/generate-cover-letter', {
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
      if (!res.ok) throw new Error(data.error || 'Failed to generate cover letter');
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

  const resultWordCount = wordCount(result);

  return (
    <div>
      {/* ── Section A: Hero ── */}
      <div className="tool-hero scroll-reveal">
        <div className="tool-hero-badge">
          <span>✉</span><span>{t[lang].cover_badge}</span>
        </div>
        <h1 className="tool-hero-h1">
          {t[lang].cover_headline_pre} <span className="tool-kw">{t[lang].cover_headline_highlight}</span> {t[lang].cover_headline_post}
        </h1>
        <p className="tool-hero-sub">
          {t[lang].cover_sub}
        </p>
      </div>

      {/* ── Section B: How it works ── */}
      <div className="tool-steps-wrap scroll-reveal">
        <div className="tool-step"><div className="tool-step-num">1</div><span className="tool-step-text">{t[lang].cover_step1}</span></div>
        <span className="tool-step-arrow">→</span>
        <div className="tool-step"><div className="tool-step-num">2</div><span className="tool-step-text">{t[lang].cover_step2}</span></div>
        <span className="tool-step-arrow">→</span>
        <div className="tool-step"><div className="tool-step-num">3</div><span className="tool-step-text">{t[lang].cover_step3}</span></div>
      </div>

      {/* ── Section C: Divider ── */}
      <div className="tool-divider" />

      {/* ── Section D: Input area ── */}
      <div className="tool-section" style={{ padding: '0 40px 32px' }}>
        <div className="two-col scroll-reveal" style={{ marginBottom: 20 }}>
          <div className="input-card">
            <FileUploadField
              label={t[lang].cover_upload_cv}
              value={cv}
              onChange={setCv}
              onFileSelect={handleCvFileSelect}
              onFileRemove={handleCvFileRemove}
              file={cvFile}
              placeholder={t[lang].cover_upload_cv_hint}
              rows={14}
            />
          </div>
          <div className="input-card" ref={jdRef}>
            <FileUploadField
              label={t[lang].cover_upload_jd}
              value={jobDescription}
              onChange={setJobDescription}
              onFileSelect={handleJdFileSelect}
              onFileRemove={handleJdFileRemove}
              file={jdFile}
              placeholder={t[lang].cover_upload_jd_hint}
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
            onClick={handleGenerate}
            disabled={loading || !canSubmit}
          >
            {loading ? <><span className="spinner"></span> {t[lang].generating}</> : <>✦ {t[lang].cover_generate_btn}</>}
          </button>
          {(cv || cvFile || jobDescription || jdFile || result) && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button className="btn btn-ghost" onClick={handleClear} disabled={loading} style={{ fontSize: 13 }}>
                {t[lang].clear_all}
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
            <div className="spinner-lg" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t[lang].writing_cover}</p>
          </div>
        )}
      </div>

      {/* ── Section F: Tip ── */}
      <div className="tool-section" style={{ padding: '0 40px 60px' }}>
        <div className="tool-tip-box">
          <span>💡</span>
          <span><strong style={{ color: '#1D9E75' }}>Tip:</strong> {t[lang].cover_tip}</span>
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
                  <span style={{ color: 'var(--accent)' }}>✉</span>{t[lang].cover_result_label}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>
                    · {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} {t[lang].template_word}
                  </span>
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: resultWordCount > 300 ? '#f87171' : 'var(--accent)',
                    background: resultWordCount > 300 ? 'rgba(239,68,68,0.1)' : 'var(--accent-dim)',
                    padding: '3px 8px', borderRadius: 100,
                  }}>
                    {resultWordCount} {t[lang].cover_words}
                  </span>
                  <DownloadButtons text={result} filename="cover-letter" isLetter={true} template={selectedTemplate} />
                  <CopyButton text={result} />
                </div>
              </div>

              <DocumentPreview text={result} type="letter" template={selectedTemplate} />

              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                {t[lang].cover_review_note}
              </p>

              {score !== null && <ScoreCard score={score} />}

              <MiniChatbot currentDocument={result} onUpdate={handleAdjustUpdate} />
            </LockedContent>

            <div className="tool-tip-box" style={{ marginTop: 20, marginBottom: 16 }}>
              <span>💡</span>
              <span><strong style={{ color: '#1D9E75' }}>Tip:</strong> {t[lang].cover_result_tip}</span>
            </div>

            <TemplateSelector selectedTemplate={selectedTemplate} onSelect={setSelectedTemplate} />
          </div>
        </div>
      )}
    </div>
  );
}
