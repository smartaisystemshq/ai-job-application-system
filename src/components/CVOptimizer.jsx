import React, { useState, useEffect } from 'react';
import FileUploadField from './FileUploadField';

const LS = { cv: 'jas.cvo.cv', jd: 'jas.cvo.jd', result: 'jas.cvo.result' };

const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Single column, clean whitespace, timeless.',
    preview: '[Full Name]\n[email] | [phone] | [location]\nlinkedin.com/in/yourname\n\nPROFESSIONAL SUMMARY\n[2-3 sentences about your background]\n\nWORK EXPERIENCE\n[Job Title] | [Company] | [Year – Year]\n• Achievement with metric\n• Achievement with metric\n\nEDUCATION\n[Degree] | [University] | [Year]\n\nSKILLS\n[Skill 1], [Skill 2], [Skill 3]',
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
    description: 'Bold dividers, structured blocks, contemporary.',
    preview: '[FULL NAME]\n━━━━━━━━━━━━━━━━━━━━━━━━\n[email] • [phone] • [location]\n\n▌ PROFILE\n[Summary text]\n\n▌ EXPERIENCE\n[COMPANY]              [Year – Now]\n[Job Title]\n▸ Impact-led achievement\n▸ Quantified result',
    content: `[FULL NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[email@example.com] • [+44 000 000 0000] • [Location] • linkedin.com/in/yourname

▌ PROFILE

[2-3 sentence professional profile. Who you are, what you do, what sets you apart from other candidates.]

▌ EXPERIENCE

[COMPANY NAME]                                    [Month Year – Present]
[Job Title]
▸ [Impact-focused achievement with numbers or percentage improvement]
▸ [Achievement that shows scope of responsibility or team size]
▸ [Technical or strategic skill applied in real context]

[PREVIOUS COMPANY]                                [Month Year – Month Year]
[Job Title]
▸ [Achievement]
▸ [Achievement]

▌ SKILLS & TOOLS

Technical ▸ [Skill 1] • [Skill 2] • [Skill 3]
Tools ▸ [Tool 1] • [Tool 2] • [Tool 3]
Soft Skills ▸ [Skill 1] • [Skill 2]

▌ EDUCATION

[Degree] | [Institution] | [Year]`,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional layout, formal tone, universally readable.',
    preview: '              [FULL NAME]\n    ──────────────────────────\n    [Address] | [Phone] | [Email]\n\nPROFESSIONAL EXPERIENCE\n──────────────────────────\n[Job Title]              [Year]\n[Company, Location]\n•  Responsibility / achievement',
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

•  [Key responsibility or achievement — provide context and measurable outcome where possible]
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
    setLoading(true); setError(''); setResult('');
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
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCv(''); setCvFile(null); setCvPdfBase64('');
    setJobDescription(''); setJdFile(null); setJdPdfBase64('');
    setResult(''); setError('');
    Object.values(LS).forEach(k => localStorage.removeItem(k));
  };

  const useTemplate = (content) => {
    setCv(content);
    setCvFile(null); setCvPdfBase64('');
    setShowTemplates(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>CV Optimizer</h1>
        <p>Paste or upload your CV and job description — Claude tailors your CV to maximise ATS score and recruiter impact</p>
      </div>

      <div className="section-desc">
        <strong>How it works:</strong> Provide your CV and the target job description (text or PDF/DOCX). Claude rewrites your CV with keyword alignment, quantified achievements, and ATS-friendly formatting tailored to the specific role.
      </div>

      {/* Templates */}
      <div style={{ marginBottom: 20 }}>
        <button
          className="btn btn-ghost"
          onClick={() => setShowTemplates(v => !v)}
          style={{ fontSize: 13, padding: '8px 14px', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/>
            <rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>
          </svg>
          {showTemplates ? 'Hide Templates' : 'CV Templates — start from a structured layout'}
        </button>

        {showTemplates && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 14 }}>
            {TEMPLATES.map(tmpl => (
              <div key={tmpl.id} className="template-card card">
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>{tmpl.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tmpl.description}</div>
                </div>
                <div className="template-preview">{tmpl.preview}</div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 12, width: '100%' }}
                  onClick={() => useTemplate(tmpl.content)}
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
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

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <button className="btn btn-primary" onClick={handleOptimize} disabled={loading || !canSubmit} style={{ minWidth: 160 }}>
          {loading ? <><span className="spinner"></span> Optimizing...</> : '✦ Optimize CV'}
        </button>
        {(cv || cvFile || jobDescription || jdFile || result) && (
          <button className="btn btn-secondary" onClick={handleClear} disabled={loading}>Clear All</button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
          <div className="spinner-lg"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Analyzing job requirements and tailoring your CV...</p>
        </div>
      )}

      {result && !loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>
              <span style={{ color: 'var(--accent)', marginRight: 8 }}>✦</span>Optimized CV
            </h2>
            <CopyButton text={result} />
          </div>
          <div className="result-box">{result}</div>
          <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            Review and personalise the output before submitting your application.
          </p>
        </div>
      )}
    </div>
  );
}
