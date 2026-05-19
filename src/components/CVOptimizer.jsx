import React, { useState, useEffect, useRef } from 'react';
import FileUploadField from './FileUploadField';
import DownloadButtons from '../utils/DownloadButtons';
import DocumentPreview from '../utils/DocumentPreview';
import ScoreCard, { calculateAttractivenessScore, KeywordMatch } from './ScoreCard';
import { stripMarkdown } from '../utils/downloadUtils';

const LS = { cv: 'jas.cvo.cv', jd: 'jas.cvo.jd', result: 'jas.cvo.result' };

// ── Template mini-preview cards ───────────────────────────────────────────────

const SCALE = 0.26
const DOC_W = 580

function MiniDocFrame({ children }) {
  return (
    <div style={{ height: 88, overflow: 'hidden', borderRadius: 6, position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: DOC_W, background: '#fff',
        transform: `scale(${SCALE})`, transformOrigin: 'top left',
        fontFamily: "'Inter', sans-serif", padding: '30px 36px 0',
      }}>
        {children}
      </div>
    </div>
  )
}

function TemplatePreviewMinimal() {
  return (
    <MiniDocFrame>
      <div style={{ fontSize: 46, fontWeight: 700, color: '#111', marginBottom: 8, lineHeight: 1 }}>JOHN SMITH</div>
      <div style={{ fontSize: 22, color: '#666', marginBottom: 14 }}>john@email.com | London | linkedin.com/in/john</div>
      <div style={{ height: 2, background: '#ccc', marginBottom: 18 }} />
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 6 }}>WORK EXPERIENCE</div>
      <div style={{ height: 1.5, background: '#888', marginBottom: 12 }} />
      <div style={{ fontSize: 22, color: '#333', marginBottom: 8 }}>Software Engineer | TechCorp | 2021 – 2023</div>
      {['Led payment system handling £2M/month revenue', 'Reduced deployment time 70% via CI/CD pipelines'].map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
          <span style={{ color: '#555', fontSize: 22, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 22, color: '#333' }}>{t}</span>
        </div>
      ))}
    </MiniDocFrame>
  )
}

function TemplatePreviewModern() {
  const G = '#1D9E75'
  return (
    <MiniDocFrame>
      <div style={{ height: 14, background: G, marginLeft: -36, marginRight: -36, marginTop: -30, marginBottom: 20 }} />
      <div style={{ fontSize: 46, fontWeight: 700, color: '#111', marginBottom: 8, lineHeight: 1 }}>JOHN SMITH</div>
      <div style={{ height: 4, background: G, marginBottom: 10 }} />
      <div style={{ fontSize: 22, color: '#666', marginBottom: 16 }}>john@email.com | London</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: G, marginBottom: 5 }}>WORK EXPERIENCE</div>
      <div style={{ height: 2.5, background: G, marginBottom: 12 }} />
      {['Led payment system handling £2M/month', 'Reduced deployment time 70%'].map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
          <span style={{ color: G, fontSize: 22, flexShrink: 0 }}>▸</span>
          <span style={{ fontSize: 22, color: '#333' }}>{t}</span>
        </div>
      ))}
    </MiniDocFrame>
  )
}

function TemplatePreviewClassic() {
  return (
    <MiniDocFrame>
      <div style={{ fontFamily: "'Times New Roman', serif" }}>
        <div style={{ fontSize: 44, fontWeight: 700, color: '#111', marginBottom: 6, textAlign: 'center', lineHeight: 1 }}>JOHN SMITH</div>
        <div style={{ height: 3, background: '#333', marginBottom: 2 }} />
        <div style={{ height: 1, background: '#999', marginBottom: 10 }} />
        <div style={{ fontSize: 22, color: '#555', marginBottom: 14, textAlign: 'center' }}>john@email.com | +44 7000 | London</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 5 }}>PROFESSIONAL EXPERIENCE</div>
        <div style={{ height: 1.5, background: '#666', marginBottom: 12 }} />
        {['Managed team of 8 analysts across 3 regions', 'Delivered £4M project on time and under budget'].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
            <span style={{ color: '#555', fontSize: 22, flexShrink: 0 }}>•</span>
            <span style={{ fontSize: 22, color: '#333', fontFamily: "'Times New Roman', serif" }}>{t}</span>
          </div>
        ))}
      </div>
    </MiniDocFrame>
  )
}

function TemplatePreviewExecutive() {
  const G = '#1D9E75'
  return (
    <MiniDocFrame>
      <div style={{ fontSize: 40, fontWeight: 800, color: '#111', marginBottom: 8, letterSpacing: 6, lineHeight: 1 }}>JOHN SMITH</div>
      <div style={{ height: 4, background: G, marginBottom: 12 }} />
      <div style={{ fontSize: 22, color: '#666', marginBottom: 18 }}>john@email.com | London | linkedin.com/in/john</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 5, letterSpacing: 1 }}>PROFESSIONAL EXPERIENCE</div>
      <div style={{ height: 1.5, background: '#bbb', marginBottom: 12 }} />
      {['Drove £40M revenue growth as VP Commercial', 'Led 120-person team across 6 markets globally'].map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
          <span style={{ color: '#777', fontSize: 22, flexShrink: 0 }}>—</span>
          <span style={{ fontSize: 22, color: '#333' }}>{t}</span>
        </div>
      ))}
    </MiniDocFrame>
  )
}

function TemplatePreviewTech() {
  const G = '#1D9E75'
  const DARK = '#1a1a1a'
  return (
    <div style={{ height: 88, overflow: 'hidden', borderRadius: 6, display: 'flex' }}>
      <div style={{ background: DARK, width: '36%', padding: '10px 9px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 3 }}>JOHN SMITH</div>
        <div style={{ height: 1, background: G, marginBottom: 5 }} />
        <div style={{ fontSize: 7, color: '#aaa', marginBottom: 4 }}>john@email.com</div>
        <div style={{ fontSize: 8, fontWeight: 700, color: G, marginBottom: 2 }}>SKILLS</div>
        <div style={{ height: 0.5, background: G, opacity: 0.5, marginBottom: 3 }} />
        {['Python, TypeScript', 'AWS, Docker', 'PostgreSQL', 'Agile / TDD'].map((s, i) => (
          <div key={i} style={{ fontSize: 7, color: '#ccc', marginBottom: 2 }}>• {s}</div>
        ))}
      </div>
      <div style={{ background: '#fff', flex: 1, padding: '10px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#111', marginBottom: 3 }}>WORK EXPERIENCE</div>
        <div style={{ height: 0.8, background: G, marginBottom: 5 }} />
        <div style={{ fontSize: 7.5, color: '#333', marginBottom: 4 }}>Senior Engineer | FinTech | 2021–2023</div>
        {['Built fraud detection saving £800K/yr', 'Led 5 engineers across 3 services'].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
            <span style={{ color: G, fontSize: 8, flexShrink: 0 }}>▸</span>
            <span style={{ fontSize: 7.5, color: '#333' }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const TEMPLATES = [
  { id: 'minimal',   name: 'Minimal',   description: 'Single column · clean black typography · timeless', Preview: TemplatePreviewMinimal },
  { id: 'modern',    name: 'Modern',    description: 'Green accents · bold dividers · contemporary',       Preview: TemplatePreviewModern  },
  { id: 'classic',   name: 'Classic',   description: 'Centred name · serif feel · universally accepted',  Preview: TemplatePreviewClassic },
  { id: 'executive', name: 'Executive', description: 'Uppercase name · premium spacing · senior roles',   Preview: TemplatePreviewExecutive },
  { id: 'tech',      name: 'Tech',      description: 'Dark sidebar for skills · white panel for XP',      Preview: TemplatePreviewTech    },
];

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

export default function CVOptimizer() {
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
    <div className="page">
      <div className="page-header scroll-reveal">
        <h1>CV Optimizer</h1>
        <p>Paste or upload your CV and job description — Claude tailors your CV to maximise ATS score and recruiter impact</p>
      </div>

      <div className="section-desc scroll-reveal">
        <strong>How it works:</strong> Provide your CV and the target job description (text or PDF/DOCX). Claude rewrites your CV with keyword alignment, quantified achievements, and ATS-friendly formatting tailored to the specific role.
      </div>

      {/* Template selector — ABOVE inputs */}
      <div className="scroll-reveal" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
          Select Template
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }} className="template-row">
          {TEMPLATES.map(tmpl => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`template-card-h${isSelected ? ' selected' : ''}`}
              >
                <tmpl.Preview />
                <div style={{ padding: '8px 2px 0' }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 1 }}>{tmpl.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{tmpl.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input section */}
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

      {/* Generate button — directly below inputs */}
      <div ref={generateRef} className="scroll-reveal" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={handleOptimize}
          disabled={loading || !canSubmit}
          style={{ minWidth: 200, padding: '13px 32px', fontSize: 15 }}
        >
          {loading ? <><span className="spinner"></span> Optimizing...</> : '✦ Optimize CV'}
        </button>
        {(cv || cvFile || jobDescription || jdFile || result) && (
          <button className="btn btn-ghost" onClick={handleClear} disabled={loading} style={{ fontSize: 13 }}>
            Clear All
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
          <div className="spinner-lg"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Analyzing job requirements and tailoring your CV…</p>
        </div>
      )}

      {result && !loading && (
        <div ref={resultRef}>
          {/* Result toolbar */}
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

          {/* WYSIWYG document preview */}
          <DocumentPreview text={result} template={selectedTemplate} />

          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Review and personalise before submitting your application.
          </p>

          {score !== null && <ScoreCard score={score} />}

          <KeywordMatch cvText={result} jdText={jobDescription} />

          <MiniChatbot currentDocument={result} onUpdate={handleAdjustUpdate} />
        </div>
      )}
    </div>
  );
}
