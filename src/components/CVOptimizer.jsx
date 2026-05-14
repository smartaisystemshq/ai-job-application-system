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

export default function CVOptimizer() {
  const [cv, setCv] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOptimize = async () => {
    if (!cv.trim() || !jobDescription.trim()) {
      setError('Please fill in both your CV and the job description.');
      return;
    }
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch('/api/optimize-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv: cv.trim(), jobDescription: jobDescription.trim() }),
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
    setCv('');
    setJobDescription('');
    setResult('');
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>CV Optimizer</h1>
        <p>Paste your CV and the job description — AI tailors your CV to maximise ATS score and recruiter impact</p>
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="form-group">
          <label className="label">Your CV</label>
          <textarea
            className="textarea"
            rows={18}
            placeholder="Paste your full CV here..."
            value={cv}
            onChange={e => setCv(e.target.value)}
            style={{ minHeight: 320 }}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            {cv.length > 0 && `${cv.split(/\s+/).filter(Boolean).length} words`}
          </div>
        </div>
        <div className="form-group">
          <label className="label">Job Description</label>
          <textarea
            className="textarea"
            rows={18}
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            style={{ minHeight: 320 }}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            {jobDescription.length > 0 && `${jobDescription.split(/\s+/).filter(Boolean).length} words`}
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
          onClick={handleOptimize}
          disabled={loading || !cv.trim() || !jobDescription.trim()}
          style={{ minWidth: 160 }}
        >
          {loading ? (
            <><span className="spinner"></span> Optimizing...</>
          ) : (
            '✦ Optimize CV'
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
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Analyzing job requirements and tailoring your CV...</p>
        </div>
      )}

      {result && !loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>
              <span style={{ color: 'var(--accent)', marginRight: 8 }}>✦</span>
              Optimized CV
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
