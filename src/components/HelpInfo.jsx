import React, { useState } from 'react';

const CONTACT_EMAIL = 'smartaisystemshq@gmail.com';

const FAQS = [
  {
    q: 'How do I use the CV Optimizer?',
    a: 'Paste your existing CV and the full job description into the two text fields (or upload a PDF/DOCX), then click "Optimize CV". Claude rewrites your CV to align keywords, improve ATS compatibility, and lead with the most relevant experience for that specific role.',
  },
  {
    q: 'What AI model powers this tool?',
    a: 'All AI features run on Claude Sonnet by Anthropic — one of the most capable and nuanced AI models available, purpose-built for professional writing, analysis, and contextual reasoning.',
  },
  {
    q: 'Is my data saved anywhere?',
    a: "Your data is stored only in your own browser's localStorage — it never leaves your device and is never sent to our servers. PDFs and DOCX files are processed temporarily for text extraction only. You can clear all data at any time using the \"Clear All\" button in each section.",
  },
  {
    q: 'How do I get the best results from the CV Optimizer?',
    a: 'Use the complete, unedited job description — not a summary. Paste your full CV including all work history and skills. The more detail you give Claude, the more targeted the output. After optimising, personalise the result before submitting.',
  },
  {
    q: 'How long should a cover letter be?',
    a: 'The Cover Letter Generator targets under 300 words — roughly 3 short paragraphs. Research consistently shows that recruiters spend under 30 seconds on a cover letter, so brevity and specificity always beat length.',
  },
  {
    q: 'Can I use this for any industry or role level?',
    a: 'Yes. Claude adapts to any sector — tech, finance, healthcare, creative, legal, public sector — and any level from graduate to executive. The more specific and detailed the job description, the more tailored the AI output will be.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
}

export default function HelpInfo() {
  return (
    <div className="page">
      <div className="page-header scroll-reveal">
        <h1>Help & Info</h1>
        <p>Answers to common questions and a way to reach the team</p>
      </div>

      {/* FAQ */}
      <div style={{ marginBottom: 40 }} className="scroll-reveal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 3, height: 20, background: 'var(--accent)', borderRadius: 2 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Frequently Asked Questions</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="scroll-reveal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 3, height: 20, background: 'var(--accent)', borderRadius: 2 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Get in Touch</h2>
        </div>

        <div className="card" style={{ maxWidth: 520 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 16,
            padding: '20px 22px',
            background: 'rgba(29,158,117,0.06)',
            border: '1px solid rgba(29,158,117,0.2)',
            borderRadius: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(29,158,117,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 2,
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
                Got questions? Reach out.
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Send me an email — I reply personally and usually within 24 hours.
              </p>
              <p style={{
                fontSize: 15, fontWeight: 700, color: 'var(--accent)',
                letterSpacing: '0.01em', userSelect: 'all',
                fontFamily: 'inherit',
              }}>
                {CONTACT_EMAIL}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
