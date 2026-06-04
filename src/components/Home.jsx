import React from 'react';

const FEATURE_CARDS = [
  {
    emoji: '📄',
    title: 'Optimize CV',
    desc: 'Tailor your CV to any job description with AI-powered keyword matching and ATS optimization.',
  },
  {
    emoji: '✉️',
    title: 'Cover Letter',
    desc: 'Generate compelling, role-specific cover letters in under 2 minutes.',
  },
  {
    emoji: '💬',
    title: 'Interview Prep',
    desc: 'Get tailored interview questions and model answers for any role.',
  },
  {
    emoji: '🛠️',
    title: 'Build CV',
    desc: 'Create a professional CV from scratch with AI guidance and modern templates.',
  },
];

export default function Home() {
  return (
    <div className="page">
      <div className="page-header scroll-reveal">
        <h1>AI Job Application System</h1>
        <p>Your complete AI-powered toolkit for landing the right job — CV optimization, cover letters, interview prep, and more.</p>
      </div>

      <div
        className="scroll-reveal"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {FEATURE_CARDS.map(({ emoji, title, desc }) => (
          <div key={title} className="card">
            <div style={{ fontSize: 28, marginBottom: 12 }}>{emoji}</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div
        className="card scroll-reveal"
        style={{
          maxWidth: 580,
          background: 'rgba(29,158,117,0.05)',
          borderColor: 'rgba(29,158,117,0.2)',
        }}
      >
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--accent)' }}>Powered by Claude AI</strong> — select a tool from the navigation above to get started. Upload your CV, paste a job description, and let the AI do the heavy lifting.
        </p>
      </div>
    </div>
  );
}
