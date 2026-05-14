import React, { useState } from 'react';

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
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!cv.trim() || !jobDescription.trim()) {
      setError('Please fill in both your CV and the job description.');
      return;
    }
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv: cv.trim(), jobDescription: jobDescription.trim() }),
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
    setCv('');
    setJobDescription('');
    setResult('');
    setError('');
  };

  const resultWordCount = wordCount(result);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Cover Letter Generator</h1>
        <p>Generate a concise, human-sounding cover letter under 250 words — no fluff, no clichés</p>
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="form-group">
          <label className="label">Your CV</label>
          <textarea
            className="textarea"
            rows={16}
            placeholder="Paste your CV to give context about your background..."
            value={cv}
            onChange={e => setCv(e.target.value)}
            style={{ minHeight: 300 }}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            {cv.length > 0 && `${wordCount(cv)} words`}
          </div>
        </div>
        <div className="form-group">
          <label className="label">Job Description</label>
          <textarea
            className="textarea"
            rows={16}
            placeholder="Paste the job description — the letter will reference specific requirements..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            style={{ minHeight: 300 }}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            {jobDescription.length > 0 && `${wordCount(jobDescription)} words`}
          </div>
        </div>
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
          disabled={loading || !cv.trim() || !jobDescription.trim()}
          style={{ minWidth: 200 }}
        >
          {loading ? (
            <><span className="spinner"></span> Generating...</>
          ) : (
            '✉ Generate Cover Letter'
          )}
        </button>
        {(cv || jobDescription || result) && (
          <button className="btn btn-secondary" onClick={handleClear} disabled={loading}>
            Clear All
          </button>
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
              <span style={{ color: 'var(--accent)', marginRight: 8 }}>✉</span>
              Cover Letter
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: 12,
                color: resultWordCount > 250 ? '#f87171' : 'var(--accent)',
                fontWeight: 500,
              }}>
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
