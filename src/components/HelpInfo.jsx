import React, { useState } from 'react';

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
    a: 'Your data is stored only in your own browser\'s localStorage — it never leaves your device and is never sent to our servers. PDFs and DOCX files are processed temporarily for text extraction only. You can clear all data at any time using the "Clear All" button in each section.',
  },
  {
    q: 'How do I get the best results from the CV Optimizer?',
    a: 'Use the complete, unedited job description — not a summary. Paste your full CV including all work history and skills. The more detail you give Claude, the more targeted the output. After optimising, personalise the result before submitting.',
  },
  {
    q: 'How long should a cover letter be?',
    a: 'The Cover Letter Generator targets under 250 words — roughly 3 short paragraphs. Research consistently shows that recruiters spend under 30 seconds on a cover letter, so brevity and specificity always beat length.',
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleContact = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact from ${name} — AI Job Application System`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    window.location.href = `mailto:smartaisystemshq@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Help & Info</h1>
        <p>Answers to common questions and a way to reach the team</p>
      </div>

      {/* FAQ */}
      <div style={{ marginBottom: 40 }}>
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
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 3, height: 20, background: 'var(--accent)', borderRadius: 2 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Get in Touch</h2>
        </div>
        <div className="card" style={{ maxWidth: 560 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Have a question or feature request? Fill in the form below — this will open your email client with the message pre-filled.
          </p>

          {sent && (
            <div style={{ padding: '12px 16px', background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 14, marginBottom: 16 }}>
              Your email client should have opened. We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleContact}>
            <div className="form-group">
              <label className="label">Name</label>
              <input className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Message</label>
              <textarea className="textarea" rows={5} placeholder="Your question or feedback..." value={message} onChange={e => setMessage(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!name || !email || !message}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
