import React, { useState, useEffect } from 'react';

export function calculateAttractivenessScore(resultText, jobDescription = '') {
  let score = 6.5;
  const text = resultText.toLowerCase();
  const wordCount = resultText.split(/\s+/).filter(Boolean).length;

  // Quantified metrics
  const metrics = (resultText.match(/\d+%|\$[\d,]+|£[\d,]+|€[\d,]+|\d+[kKmM]\b|\d{5,}|\d+\s*(million|billion|thousand)/gi) || []).length;
  score += Math.min(0.8, metrics * 0.13);

  // Strong action verbs
  const verbs = ['led','managed','developed','created','implemented','launched','delivered','reduced','increased','automated','designed','improved','achieved','spearheaded','architected','negotiated','built','optimis','optimiz','streamlined','transformed','generated','secured','drove'];
  const verbMatches = verbs.filter(v => text.includes(v)).length;
  score += Math.min(0.6, verbMatches * 0.06);

  // Content length
  if (wordCount > 150) score += 0.2;
  if (wordCount > 320) score += 0.2;

  // Keyword overlap with JD
  if (jobDescription && jobDescription.trim()) {
    const jdWords = new Set(jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 4));
    const cvWords = new Set(text.split(/\W+/).filter(w => w.length > 4));
    if (jdWords.size > 0) {
      const overlap = [...jdWords].filter(w => cvWords.has(w)).length;
      const ratio = overlap / Math.min(jdWords.size, 60);
      score += Math.min(1.1, ratio * 2.4);
    }
  } else {
    score += 0.45;
  }

  return Math.min(9.5, Math.max(6.5, parseFloat(score.toFixed(1))));
}

function getScoreLabel(score) {
  if (score >= 9.0) return 'Very Likely to Get a Callback';
  if (score >= 8.5) return 'Excellent Fit';
  if (score >= 8.0) return 'Very Strong Match';
  if (score >= 7.5) return 'Strong Application';
  if (score >= 7.0) return 'Good Candidate';
  return 'Decent Foundation';
}

function getScoreColor(score) {
  if (score >= 8.0) return '#1D9E75';
  if (score >= 7.0) return '#f59e0b';
  return '#ef4444';
}

export default function ScoreCard({ score }) {
  const [animScore, setAnimScore] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!visible) return;
    let current = 0;
    const target = score;
    const steps = 50;
    const increment = target / steps;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimScore(target);
        clearInterval(interval);
      } else {
        setAnimScore(parseFloat(current.toFixed(1)));
      }
    }, 18);
    return () => clearInterval(interval);
  }, [score, visible]);

  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = (animScore / 10) * circumference;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(29,158,117,0.06) 0%, rgba(29,158,117,0.02) 100%)',
        border: '1px solid rgba(29,158,117,0.25)',
        borderRadius: 16,
        padding: '20px 24px',
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        boxShadow: '0 4px 24px rgba(29,158,117,0.08)',
      }}
    >
      {/* Circular Progress */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="110" height="110" viewBox="0 0 110 110" style={{ display: 'block' }}>
          {/* Track */}
          <circle
            cx="55" cy="55" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="55" cy="55" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            style={{ transition: 'stroke-dasharray 0.05s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{animScore.toFixed(1)}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>/10</span>
        </div>
      </div>

      {/* Score details */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>
          Attractiveness Score
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color, marginBottom: 6 }}>{label}</div>

        {/* Score bar */}
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            height: '100%',
            width: `${(animScore / 10) * 100}%`,
            background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #1D9E75 80%)`,
            borderRadius: 3,
            transition: 'width 0.05s linear',
          }} />
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Based on keyword alignment, quantified achievements &amp; content quality
        </div>
      </div>
    </div>
  );
}
