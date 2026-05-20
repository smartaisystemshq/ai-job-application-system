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

function FallbackModal({ onClose, name, email, message }) {
  const [copied, setCopied] = useState(false);
  const fullText = `To: ${CONTACT_EMAIL}\nSubject: AI Job Application System — Support\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

  const copyEmail = async () => {
    await navigator.clipboard.writeText(CONTACT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: 32, maxWidth: 520, width: '100%',
        boxShadow: 'var(--shadow)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Send us your message</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Your email client didn't open automatically. Copy the address below and send your message manually.
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', background: 'rgba(29,158,117,0.07)',
          border: '1px solid rgba(29,158,117,0.2)', borderRadius: 10, marginBottom: 20,
        }}>
          <span style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, flex: 1 }}>{CONTACT_EMAIL}</span>
          <button
            onClick={copyEmail}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12 }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
          <pre style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>{fullText}</pre>
        </div>
        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Close</button>
      </div>
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
    const subject = encodeURIComponent('AI Job Application System — Support');
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );
    const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    setSent(true);
    setTimeout(() => setSent(false), 6000);
  };

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

        <div className="card" style={{ maxWidth: 560 }}>
          {/* Visible email address — always shown */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: 'rgba(29,158,117,0.07)',
            border: '1px solid rgba(29,158,117,0.2)',
            borderRadius: 10,
            marginBottom: 20,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Contact us at </span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Have a question or feature request? Fill in the form — it will open your email client with the message pre-filled. If it doesn't open, a fallback will show the pre-written message so you can copy and send manually.
          </p>

          {sent && (
            <div style={{ padding: '12px 16px', background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 14, marginBottom: 16 }}>
              Your email client should have opened. If not, use the dialog that appears to copy the message.
            </div>
          )}

          <form onSubmit={handleContact}>
            <div className="form-group">
              <label className="label">Name</label>
              <input className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Your Email</label>
              <input className="input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Message</label>
              <textarea className="textarea" rows={5} placeholder="Your question or feedback..." value={message} onChange={e => setMessage(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!name || !email || !message}>
              Open Email Client →
            </button>
          </form>

          {/* Permanent direct-email fallback — always visible */}
          <div style={{
            marginTop: 24,
            padding: '14px 16px',
            background: 'rgba(29,158,117,0.06)',
            border: '1px solid rgba(29,158,117,0.18)',
            borderRadius: 10,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              Or email us directly:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700, textDecoration: 'none', display: 'block', marginBottom: 4 }}
            >
              {CONTACT_EMAIL}
            </a>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', userSelect: 'all' }}>
              {CONTACT_EMAIL}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
