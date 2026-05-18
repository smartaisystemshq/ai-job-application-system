import React, { useState, useEffect, useRef } from 'react';
import FileUploadField from './FileUploadField';
import DownloadButtons from '../utils/DownloadButtons';
import ScoreCard, { calculateAttractivenessScore } from './ScoreCard';

const LS = { cv: 'jas.cvo.cv', jd: 'jas.cvo.jd', result: 'jas.cvo.result' };

// ── Template definitions ──────────────────────────────────────────

function TemplatePreviewMinimal() {
  return (
    <div style={{ background: '#fff', padding: '10px 10px 8px', borderRadius: 6, minHeight: 90 }}>
      <div style={{ height: 7, background: '#111', borderRadius: 2, marginBottom: 3, width: '58%' }} />
      <div style={{ height: 1, background: '#ccc', marginBottom: 4 }} />
      <div style={{ height: 2.5, background: '#888', borderRadius: 1, marginBottom: 10, width: '75%' }} />
      <div style={{ height: 3, background: '#222', borderRadius: 2, marginBottom: 4, width: '38%' }} />
      {[72, 88, 65].map((w, i) => <div key={i} style={{ height: 2, background: '#bbb', borderRadius: 1, marginBottom: 3, width: `${w}%` }} />)}
    </div>
  );
}

function TemplatePreviewModern() {
  return (
    <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', minHeight: 90 }}>
      <div style={{ background: '#1D9E75', height: 10, width: '100%' }} />
      <div style={{ padding: '7px 9px' }}>
        <div style={{ height: 7, background: '#111', borderRadius: 2, marginBottom: 3, width: '60%' }} />
        <div style={{ height: 2, background: '#999', borderRadius: 1, marginBottom: 8, width: '78%' }} />
        <div style={{ height: 3, background: '#1D9E75', borderRadius: 2, marginBottom: 2, width: '40%' }} />
        <div style={{ height: 0.5, background: '#1D9E75', marginBottom: 5 }} />
        {[76, 90, 62].map((w, i) => <div key={i} style={{ height: 2, background: '#bbb', borderRadius: 1, marginBottom: 3, width: `${w}%` }} />)}
      </div>
    </div>
  );
}

function TemplatePreviewClassic() {
  return (
    <div style={{ background: '#fff', padding: '10px 9px 8px', borderRadius: 6, minHeight: 90 }}>
      <div style={{ height: 7, background: '#111', borderRadius: 2, margin: '0 auto 3px', width: '52%' }} />
      <div style={{ height: 1.5, background: '#333', marginBottom: 1.5 }} />
      <div style={{ height: 0.5, background: '#999', marginBottom: 5 }} />
      <div style={{ height: 2, background: '#777', borderRadius: 1, margin: '0 auto 9px', width: '68%' }} />
      <div style={{ height: 0.5, background: '#bbb', marginBottom: 4 }} />
      {[80, 94, 70].map((w, i) => <div key={i} style={{ height: 2, background: '#ccc', borderRadius: 1, marginBottom: 3, width: `${w}%` }} />)}
    </div>
  );
}

function TemplatePreviewExecutive() {
  return (
    <div style={{ background: '#fff', padding: '10px 9px 8px', borderRadius: 6, minHeight: 90 }}>
      <div style={{ height: 7, background: '#111', borderRadius: 2, marginBottom: 4, width: '68%', fontWeight: 800 }} />
      <div style={{ height: 2, background: '#1D9E75', marginBottom: 7 }} />
      <div style={{ height: 2, background: '#888', borderRadius: 1, marginBottom: 10, width: '72%' }} />
      <div style={{ height: 3, background: '#333', borderRadius: 2, marginBottom: 4, width: '36%' }} />
      {[86, 72, 90].map((w, i) => <div key={i} style={{ height: 2, background: '#bbb', borderRadius: 1, marginBottom: 3, width: `${w}%` }} />)}
    </div>
  );
}

function TemplatePreviewTech() {
  return (
    <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', minHeight: 90 }}>
      <div style={{ background: '#1a1a1a', width: '36%', padding: '8px 7px' }}>
        <div style={{ height: 5, background: '#1D9E75', borderRadius: 2, marginBottom: 5, width: '82%' }} />
        <div style={{ height: 0.5, background: '#1D9E75', marginBottom: 6, opacity: 0.6 }} />
        {[70, 58, 74, 62].map((w, i) => <div key={i} style={{ height: 1.8, background: '#555', borderRadius: 1, marginBottom: 3, width: `${w}%` }} />)}
      </div>
      <div style={{ background: '#fff', flex: 1, padding: '8px 8px' }}>
        <div style={{ height: 5, background: '#222', borderRadius: 2, marginBottom: 5, width: '62%' }} />
        <div style={{ height: 1.5, background: '#1D9E75', marginBottom: 5 }} />
        {[90, 72, 86].map((w, i) => <div key={i} style={{ height: 2, background: '#bbb', borderRadius: 1, marginBottom: 3, width: `${w}%` }} />)}
      </div>
    </div>
  );
}

const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Single column, clean spacing, timeless black typography.',
    Preview: TemplatePreviewMinimal,
    content: `[Full Name]
[email@example.com] | [+44 000 000 0000] | [City, Country]
linkedin.com/in/yourname

PROFESSIONAL SUMMARY

[Replace with 2-3 sentences about your background, key strengths, and what you bring to this specific role.]

WORK EXPERIENCE

[Job Title] | [Company] | [Month Year] – [Month Year]
• [Achievement or responsibility — lead with action verb, quantify where possible]
• [Achievement or responsibility]
• [Achievement or responsibility]

[Previous Job Title] | [Company] | [Month Year] – [Month Year]
• [Achievement]
• [Achievement]

EDUCATION

[Degree in Subject] | [University/Institution] | [Year]

SKILLS

[Technical Skill 1], [Technical Skill 2], [Soft Skill 1], [Tool 1], [Tool 2]`,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Green accents, bold dividers, structured contemporary layout.',
    Preview: TemplatePreviewModern,
    content: `[FULL NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[email@example.com] • [+44 000 000 0000] • [Location] • linkedin.com/in/yourname

PROFILE

[2-3 sentence professional profile. Who you are, what you do, what sets you apart from other candidates.]

EXPERIENCE

[COMPANY NAME]                                    [Month Year – Present]
[Job Title]
▸ [Impact-focused achievement with numbers or percentage improvement]
▸ [Achievement that shows scope of responsibility or team size]
▸ [Technical or strategic skill applied in real context]

[PREVIOUS COMPANY]                                [Month Year – Month Year]
[Job Title]
▸ [Achievement]
▸ [Achievement]

SKILLS

Technical ▸ [Skill 1] • [Skill 2] • [Skill 3]
Tools ▸ [Tool 1] • [Tool 2] • [Tool 3]
Soft Skills ▸ [Skill 1] • [Skill 2]

EDUCATION

[Degree] | [Institution] | [Year]`,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional centred layout, formal structure, universally accepted.',
    Preview: TemplatePreviewClassic,
    content: `                          [FULL NAME]
              ──────────────────────────────────────────────
              [Address]  |  [Phone]  |  [Email]

PROFESSIONAL PROFILE
──────────────────────────────────────────────────────────────
[A concise professional overview demonstrating your suitability for the role.
2-3 sentences covering experience, key strengths, and career objectives.]

PROFESSIONAL EXPERIENCE
──────────────────────────────────────────────────────────────

[Job Title]                                             [Year – Year]
[Company Name], [Location]

•  [Key responsibility or achievement — provide context and measurable outcome]
•  [Second key contribution demonstrating relevant competency]
•  [Third achievement]

[Previous Job Title]                                    [Year – Year]
[Company Name], [Location]

•  [Achievement]
•  [Achievement]

EDUCATION
──────────────────────────────────────────────────────────────

[Qualification / Degree]                                       [Year]
[Institution Name], [Location]

CORE COMPETENCIES
──────────────────────────────────────────────────────────────

[Competency 1]  |  [Competency 2]  |  [Competency 3]  |  [Competency 4]

REFERENCES
──────────────────────────────────────────────────────────────

Available upon request.`,
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Uppercase name, green accent line, polished senior-level presence.',
    Preview: TemplatePreviewExecutive,
    content: `JOHN SMITH
──────────────────────────────────────────────────────────────
john.smith@email.com  |  +44 000 000 0000  |  London, UK  |  linkedin.com/in/johnsmith

EXECUTIVE SUMMARY

[Senior-level professional overview. 2-3 sentences that immediately communicate seniority, domain expertise, and the scale of impact you deliver. Reference the industry and level you're targeting.]

PROFESSIONAL EXPERIENCE

[Job Title]                                                    [Year – Present]
[Company Name], [Location]

• [C-suite or senior-level achievement — strategic impact, P&L responsibility, or organisation-wide change]
• [Achievement demonstrating leadership of teams or major initiatives]
• [Revenue, cost, or performance outcome with clear numbers]

[Previous Job Title]                                           [Year – Year]
[Company Name], [Location]

• [Achievement]
• [Achievement]

EDUCATION

[Degree / Executive Programme]  |  [Institution]  |  [Year]

SKILLS & EXPERTISE

[Leadership skill]  |  [Domain expertise]  |  [Strategic skill]  |  [Technical skill]`,
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Two-column layout — dark sidebar for skills, white panel for experience.',
    Preview: TemplatePreviewTech,
    content: `[Full Name]
[email@example.com] | [github.com/username] | [Location]
linkedin.com/in/yourname

SKILLS

[Programming Language 1], [Programming Language 2]
[Framework 1], [Framework 2], [Framework 3]
[Cloud / DevOps tool 1], [Cloud tool 2]
[Database 1], [Database 2]
[Methodology: Agile, TDD, CI/CD]

PROFESSIONAL SUMMARY

[2-3 sentences: your technical focus, years of experience, and what kind of engineering problems you solve best.]

WORK EXPERIENCE

[Job Title] | [Company] | [Month Year] – [Month Year]
• [Technical achievement — what you built, language/stack used, and measurable outcome]
• [Performance improvement or scale: e.g. reduced latency by 40%, handled 1M requests/day]
• [Leadership or collaboration: mentored 3 engineers, led migration of legacy system]

[Previous Job Title] | [Company] | [Month Year] – [Month Year]
• [Technical achievement]
• [Impact metric]

EDUCATION

[Degree in Computer Science / Software Engineering]  |  [University]  |  [Year]`,
  },
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
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/adjust-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: currentDocument, instruction: input.trim(), documentType: 'cv' }),
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
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAdjust}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0 }}
        >
          {loading ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'white' }}></span> Applying…</> : 'Apply →'}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{error}</p>}
      {loading && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Applying your adjustment…</p>}
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');
  const [score, setScore] = useState(null);

  const resultRef = useRef(null);

  useEffect(() => { localStorage.setItem(LS.cv, cv); }, [cv]);
  useEffect(() => { localStorage.setItem(LS.jd, jobDescription); }, [jobDescription]);
  useEffect(() => { if (result) localStorage.setItem(LS.result, result); }, [result]);

  const handleCvFileSelect = (fileInfo, content) => {
    setCvFile(fileInfo);
    if (fileInfo.type === 'pdf') { setCvPdfBase64(content); setCv(''); }
    else { setCv(content); setCvPdfBase64(''); }
  };
  const handleCvFileRemove = () => { setCvFile(null); setCvPdfBase64(''); setCv(''); };

  const handleJdFileSelect = (fileInfo, content) => {
    setJdFile(fileInfo);
    if (fileInfo.type === 'pdf') { setJdPdfBase64(content); setJobDescription(''); }
    else { setJobDescription(content); setJdPdfBase64(''); }
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
      setResult(data.result);
      setScore(calculateAttractivenessScore(data.result, jobDescription));
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

  const useTemplate = (tmpl) => {
    setCv(tmpl.content);
    setSelectedTemplate(tmpl.id);
    setCvFile(null); setCvPdfBase64('');
    setShowTemplates(false);
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

      {/* Templates */}
      <div style={{ marginBottom: 20 }} className="scroll-reveal">
        <button
          className="btn btn-ghost"
          onClick={() => setShowTemplates(v => !v)}
          style={{ fontSize: 13, padding: '8px 14px', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/>
            <rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>
          </svg>
          {showTemplates ? 'Hide Templates' : '5 CV Templates — start from a professionally designed layout'}
        </button>

        {showTemplates && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginTop: 14 }}>
            {TEMPLATES.map(tmpl => {
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  className={`template-card card${isSelected ? ' selected' : ''}`}
                  style={{ padding: 14 }}
                >
                  <div className="template-preview-visual">
                    <tmpl.Preview />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{tmpl.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>{tmpl.description}</div>
                  <button
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%' }}
                    onClick={() => useTemplate(tmpl)}
                  >
                    {isSelected ? '✓ In Use' : 'Use Template'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="two-col scroll-reveal" style={{ marginBottom: 20 }}>
        <FileUploadField
          label="Your CV"
          value={cv}
          onChange={setCv}
          onFileSelect={handleCvFileSelect}
          onFileRemove={handleCvFileRemove}
          file={cvFile}
          placeholder="Paste your full CV here..."
          rows={16}
        />
        <FileUploadField
          label="Job Description"
          value={jobDescription}
          onChange={setJobDescription}
          onFileSelect={handleJdFileSelect}
          onFileRemove={handleJdFileRemove}
          file={jdFile}
          placeholder="Paste the full job description here..."
          rows={16}
        />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 28, alignItems: 'center' }} className="scroll-reveal">
        <button className="btn btn-primary" onClick={handleOptimize} disabled={loading || !canSubmit} style={{ minWidth: 160 }}>
          {loading ? <><span className="spinner"></span> Optimizing...</> : '✦ Optimize CV'}
        </button>
        {selectedTemplate !== 'minimal' && (
          <span style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(29,158,117,0.2)' }}>
            Template: {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
          </span>
        )}
        {(cv || cvFile || jobDescription || jdFile || result) && (
          <button className="btn btn-secondary" onClick={handleClear} disabled={loading}>Clear All</button>
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
          {/* Result header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 0, flexWrap: 'wrap', gap: 8,
            padding: '12px 16px',
            background: 'rgba(29,158,117,0.06)',
            border: '1px solid rgba(29,158,117,0.2)',
            borderBottom: 'none',
            borderRadius: '14px 14px 0 0',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>✦</span>Optimized CV
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>
                · {TEMPLATES.find(t => t.id === selectedTemplate)?.name} template
              </span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <DownloadButtons text={result} filename="optimized-cv" template={selectedTemplate} />
              <CopyButton text={result} />
            </div>
          </div>

          <div className="result-box-wrapper" style={{ borderRadius: '0 0 16px 16px' }}>
            <div className="result-box" style={{ borderRadius: '0 0 15px 15px', maxHeight: 480 }}>{result}</div>
          </div>

          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Review and personalise the output before submitting your application.
          </p>

          {score !== null && <ScoreCard score={score} />}

          <MiniChatbot currentDocument={result} onUpdate={handleAdjustUpdate} />
        </div>
      )}
    </div>
  );
}
