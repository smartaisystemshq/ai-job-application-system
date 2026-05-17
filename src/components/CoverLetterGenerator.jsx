import React, { useState } from 'react';
import FileUploadField from './FileUploadField';

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

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function CoverLetterGenerator() {
  const [cv, setCv] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [cvPdfBase64, setCvPdfBase64] = useState('');

  const [jobDescription, setJobDescription] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [jdPdfBase64, setJdPdfBase64] = useState('');

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCvFileSelect = (fileInfo, content) => {
    setCvFile(fileInfo);
    if (fileInfo.type === 'pdf') {
      setCvPdfBase64(content);
      setCv('');
    } else {
      setCv(content);
      setCvPdfBase64('');
    }
  };

  const handleCvFileRemove = () => {
    setCvFile(null); setCvPdfBase64(''); setCv('');
  };

  const handleJdFileSelect = (fileInfo, content) => {
    setJdFile(fileInfo);
    if (fileInfo.type === 'pdf') {
      setJdPdfBase64(content);
      setJobDescription('');
    } else {
      setJobDescription(content);
      setJdPdfBase64('');
    }
  };

  const handleJdFileRemove = () => {
    setJdFile(null); setJdPdfBase64(''); setJobDescription('');
  };

  const canSubmit = (cv.trim() || cvPdfBase64) && (jobDescription.trim() || jdPdfBase64);

  const handleGenerate = async () => {
    if (!canSubmit) {
      setError('Please provide both your CV and the job description.');
      return;
    }
    setLoading(true);
    setError('');
    setResult('');
    try {
      const body = {
        jobDescription: jobDescription.trim() || undefined,
        cv: cv.trim() || undefined,
        cvPdf: cvPdfBase64 || undefined,
        jdPdf: jdPdfBase64 || undefined,
      };
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate cover letter');
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
  };

  const resultWordCount = wordCount(result);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Cover Letter Generator</h1>
        <p>Generate a concise, human-sounding cover letter under 250 words — no fluff, no clichés</p>
      </div>

      <div className="section-desc">
        <strong>How it works:</strong> Upload or paste your CV and the job description. Claude writes a compelling, specific cover letter that sounds like a real person — referencing the company's actual requirements with evidence from your background.
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        <FileUploadField
          label="Your CV"
          value={cv}
          onChange={setCv}
          onFileSelect={handleCvFileSelect}
          onFileRemove={handleCvFileRemove}
          file={cvFile}
          placeholder="Paste your CV to give context about your background..."
          rows={14}
        />
        <FileUploadField
          label="Job Description"
          value={jobDescription}
          onChange={setJobDescription}
          onFileSelect={handleJdFileSelect}
          onFileRemove={handleJdFileRemove}
          file={jdFile}
          placeholder="Paste the job description — the letter will reference specific requirements..."
          rows={14}
        />
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-sm)',
          color: '#f87171',
          fontSize: 14,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading || !canSubmit}
          style={{ minWidth: 200 }}
        >
          {loading ? <><span className="spinner"></span> Generating...</> : '✉ Generate Cover Letter'}
        </button>
        {(cv || cvFile || jobDescription || jdFile || result) && (
          <button className="btn btn-secondary" onClick={handleClear} disabled={loading}>Clear All</button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
          <div className="spinner-lg"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Writing your cover letter...</p>
        </div>
      )}

      {result && !loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>
              <span style={{ color: 'var(--accent)', marginRight: 8 }}>✉</span>Cover Letter
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: resultWordCount > 250 ? '#f87171' : 'var(--accent)', fontWeight: 500 }}>
                {resultWordCount} words
              </span>
              <CopyButton text={result} />
            </div>
          </div>
          <div className="result-box">{result}</div>
          <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            Personalise with specific details (contact names, hiring manager) before sending.
          </p>
        </div>
      )}
    </div>
  );
}
