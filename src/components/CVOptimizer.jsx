import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';
import FileUploadField from './FileUploadField';
import DownloadButtons from '../utils/DownloadButtons';
import DocumentPreview from '../utils/DocumentPreview';
import ScoreCard, { calculateAttractivenessScore, KeywordMatch } from './ScoreCard';
import { stripMarkdown } from '../utils/downloadUtils';
import { TEMPLATES, TemplateSelector } from './TemplateSelector';
import LockedContent from './LockedContent';

const LS = {
  filename: 'sas_cv_filename',
  result: 'jas.cvo.result',
  cvPdf: 'sas_cv_pdf',
  cvIsPdf: 'sas_cv_ispdf',
  jdFilename: 'sas_cv_jd_filename',
  jdPdf: 'sas_cv_jd_pdf',
  jdIsPdf: 'sas_cv_jd_ispdf',
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
        <span>{t[lang].adjust_with_ai}</span>
        <span className="mini-chatbot-hint">{t[lang].adjust_placeholder}</span>
      </div>
      <div className="mini-chatbot-row">
        <input
          className="input mini-chatbot-input"
          placeholder={t[lang].adjust_suggestions_cv.map(s => `"${s}"`).join(', ') + '...'}
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

export default function CVOptimizer({ unlocked, onUnlock, cvText: cv, setCvText: setCv, jdText: jobDescription, setJdText: setJobDescription }) {
  const { lang } = useLang();
  const [cvFile, setCvFile] = useState(null);
  const [cvPdfBase64, setCvPdfBase64] = useState('');

  const [jdFile, setJdFile] = useState(null);
  const [jdPdfBase64, setJdPdfBase64] = useState('');

  const [result, setResult] = useState(() => localStorage.getItem(LS.result) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');
  const [showPhotoPlaceholder, setShowPhotoPlaceholder] = useState(false);
  const [cvPhoto, setCvPhoto] = useState(() => localStorage.getItem('sas_cv_photo') || null);

  const [score, setScore] = useState(() => {
    const r = localStorage.getItem(LS.result);
    const jd = localStorage.getItem('sas_jd_text') || localStorage.getItem('sas_cv_jd') || '';
    return r ? calculateAttractivenessScore(r, jd) : null;
  });

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
  useEffect(() => {
    if (cvPhoto) localStorage.setItem('sas_cv_photo', cvPhoto);
    else localStorage.removeItem('sas_cv_photo');
  }, [cvPhoto]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(lang === 'DE' ? 'Foto ist zu groß. Maximal 5MB.' : 'Photo is too large. Maximum 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setCvPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

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
    setCvPhoto(null);
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
          <span>✦</span><span>{t[lang].cv_optimizer_badge}</span>
        </div>
        <h1 className="tool-hero-h1">
          {t[lang].cv_headline_pre} <span className="tool-kw">{t[lang].cv_headline_highlight}</span> {t[lang].cv_headline_post}
        </h1>
        <p className="tool-hero-sub">
          {t[lang].cv_sub}
        </p>
        <p className="tool-ats-note">
          {t[lang].cv_ats_info}
        </p>
      </div>

      {/* ── Section B: How it works ── */}
      <div className="tool-steps-wrap scroll-reveal">
        <div className="tool-step"><div className="tool-step-num">1</div><span className="tool-step-text">{t[lang].cv_step1}</span></div>
        <span className="tool-step-arrow">→</span>
        <div className="tool-step"><div className="tool-step-num">2</div><span className="tool-step-text">{t[lang].cv_step2}</span></div>
        <span className="tool-step-arrow">→</span>
        <div className="tool-step"><div className="tool-step-num">3</div><span className="tool-step-text">{t[lang].cv_step3}</span></div>
      </div>

      {/* ── Section C: Divider ── */}
      <div className="tool-divider" />

      {/* ── Section D: Input area ── */}
      <div className="tool-section" style={{ padding: '0 40px 32px' }}>
        <div className="two-col scroll-reveal" style={{ marginBottom: 20 }}>
          <div className="input-card">
            <FileUploadField
              label={t[lang].cv_upload_cv}
              value={cv}
              onChange={setCv}
              onFileSelect={handleCvFileSelect}
              onFileRemove={handleCvFileRemove}
              file={cvFile}
              placeholder={t[lang].cv_upload_cv_hint}
              rows={14}
            />
            <div style={{
              marginTop: '16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(29,158,117,0.12)',
              borderRadius: '12px',
              padding: '16px 20px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2ede8', marginBottom: '4px' }}>
                {t[lang].cv_photo_section_title}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(226,237,232,0.45)', marginBottom: '12px', lineHeight: '1.6' }}>
                {t[lang].cv_photo_section_desc}
              </div>
              {!cvPhoto ? (
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(29,158,117,0.25)', borderRadius: '8px',
                  fontSize: '12px', color: 'rgba(226,237,232,0.5)', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(29,158,117,0.25)'}
                >
                  {t[lang].cv_photo_add}
                  <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }}
                    onChange={handlePhotoUpload} />
                </label>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={cvPhoto} alt="CV Photo"
                    style={{ width: '46px', height: '59px', borderRadius: '6px', objectFit: 'cover',
                    border: '1px solid rgba(29,158,117,0.3)' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#1D9E75', fontWeight: 600 }}>
                      ✓ {t[lang].cv_photo_ready}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(226,237,232,0.4)', marginTop: '2px' }}>
                      {t[lang].cv_photo_hint}
                    </div>
                    <button onClick={() => setCvPhoto(null)}
                      style={{ fontSize: '11px', color: 'rgba(226,237,232,0.35)', background: 'none',
                      border: 'none', cursor: 'pointer', marginTop: '2px', padding: 0 }}>
                      {t[lang].cv_photo_remove}
                    </button>
                  </div>
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'rgba(226,237,232,0.3)', marginTop: '10px' }}>
                {t[lang].cv_photo_size_hint}
              </div>
            </div>
          </div>
          <div className="input-card" ref={jdRef}>
            <FileUploadField
              label={t[lang].cv_upload_jd}
              value={jobDescription}
              onChange={setJobDescription}
              onFileSelect={handleJdFileSelect}
              onFileRemove={handleJdFileRemove}
              file={jdFile}
              placeholder={t[lang].cv_upload_jd_hint}
              rows={14}
            />
          </div>
        </div>

        <div style={{
          marginBottom: error ? 16 : 0,
          background: 'transparent',
          border: 'none',
          borderLeft: '2px solid rgba(29,158,117,0.3)',
          borderRadius: 0,
          padding: '8px 0 8px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span style={{ color: '#1D9E75', fontSize: 11, flexShrink: 0, marginTop: 1 }}>·</span>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1D9E75', display: 'block', marginBottom: 2 }}>{t[lang].cv_privacy_label}</span>
            <span style={{ fontSize: 11, color: 'rgba(226,237,232,0.4)', lineHeight: 1.6 }}>{t[lang].cv_privacy_note}</span>
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
            {loading ? <><span className="spinner"></span> {t[lang].generating}</> : <>✦ {t[lang].cv_generate_btn}</>}
          </button>
          {(cv || cvFile || jobDescription || jdFile || result) && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button className="btn btn-ghost" onClick={handleClear} disabled={loading} style={{ fontSize: 13 }}>
                {t[lang].cv_clear_all}
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
            <div className="spinner-lg" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t[lang].writing_cv}</p>
          </div>
        )}
      </div>

      {/* ── Section F: Tip ── */}
      <div className="tool-section" style={{ padding: '0 40px 60px' }}>
        <div className="tool-tip-box">
          <span><strong style={{ color: '#1D9E75' }}>Tip:</strong> {t[lang].cv_tip}</span>
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
                  <span style={{ color: 'var(--accent)' }}>✦</span>{t[lang].cv_result_label}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>
                    · {TEMPLATES.find(tmpl => tmpl.id === selectedTemplate)?.name} {t[lang].template_word}
                  </span>
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <DownloadButtons text={result} filename="optimized-cv" template={selectedTemplate} photo={cvPhoto} />
                  <CopyButton text={result} />
                </div>
              </div>

              <DocumentPreview text={result} template={selectedTemplate} photo={cvPhoto} showPlaceholder={showPhotoPlaceholder && !cvPhoto} />

              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                {t[lang].cv_review_note}
              </p>

              {score !== null && <ScoreCard score={score} />}

              <KeywordMatch cvText={result} jdText={jobDescription} />

              <MiniChatbot currentDocument={result} onUpdate={handleAdjustUpdate} />
            </LockedContent>

            <div className="tool-tip-box" style={{ marginTop: 20, marginBottom: 16 }}>
              <span><strong style={{ color: '#1D9E75' }}>Tip:</strong> {t[lang].cv_result_tip}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowPhotoPlaceholder(p => !p)}
                style={{ fontSize: 12 }}
              >
                {showPhotoPlaceholder
                  ? (lang === 'DE' ? 'Foto-Platzhalter ausblenden' : 'Hide photo placeholder')
                  : (lang === 'DE' ? 'Foto-Platzhalter anzeigen' : 'Show photo placeholder')}
              </button>
            </div>
            <TemplateSelector selectedTemplate={selectedTemplate} onSelect={setSelectedTemplate} />
          </div>
        </div>
      )}
    </div>
  );
}
