import React, { useState } from 'react';

const FAQS = [
  {
    q: 'What is the AI Job Application System?',
    a: 'A web app that uses AI to help you land more job interviews. It optimizes your CV for each job, writes personalized cover letters, prepares you for interviews, and helps you build a CV from scratch — all in minutes.',
  },
  {
    q: 'How does the CV Optimizer work?',
    a: 'You upload your CV and paste the job description. Our AI rewrites your CV summary and bullet points using the exact keywords recruiters and ATS systems look for. You get a tailored version ready to send in under a minute.',
  },
  {
    q: 'What is ATS and why does it matter?',
    a: "ATS stands for Applicant Tracking System — software companies use to automatically filter CVs before a human ever reads them. Most CVs get rejected by ATS before reaching a recruiter. Our AI makes sure yours gets through by matching your CV to the job description.",
  },
  {
    q: 'Will my cover letter sound like it was written by AI?',
    a: "No — that's the point. Our AI is specifically instructed to write in a natural, human tone without clichés. The result sounds like you actually wrote it. You can also adjust it with the built-in AI chat.",
  },
  {
    q: 'Is my data safe?',
    a: 'Your CV and job descriptions are sent to the AI for processing and are not stored permanently. We don\'t sell or share your data. The app saves your inputs locally in your browser for convenience.',
  },
  {
    q: 'How do I get access after purchasing?',
    a: "After purchasing on Gumroad, you receive a unique access code. Enter it in the 'Unlock Access' field in the top navigation. Your access is saved in your browser — enter the code again on a new device.",
  },
  {
    q: 'Can I use it on my phone?',
    a: 'Yes — the app works on mobile. For the best experience we recommend using it on a desktop or laptop, especially for uploading and editing your CV.',
  },
  {
    q: 'What file formats does it support?',
    a: 'You can upload your CV as a PDF or Word (.docx) file. Job descriptions can be uploaded as PDF or Word, or pasted directly as text.',
  },
  {
    q: 'How many times can I use it after purchasing?',
    a: "Unlimited. It's a one-time payment — use every tool as many times as you want across all your job applications.",
  },
  {
    q: "I have a question that isn't answered here. How do I contact you?",
    a: 'Send us an email at smartaisystemshq@gmail.com — we reply personally and usually within 24 hours.',
  },
];

function TikTokIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', margin: '0 auto', color: '#e2ede8', marginBottom: 10 }}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', margin: '0 auto', color: '#e2ede8', marginBottom: 10 }}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (i) => setOpenIdx(prev => prev === i ? null : i);

  return (
    <div style={{ flex: 1, overflowX: 'hidden' }}>

      {/* Section A: Hero */}
      <div className="tool-hero">
        <div className="tool-hero-badge">? FAQ</div>
        <h1 className="tool-hero-h1">
          Got <span className="tool-kw">questions?</span> We've got answers.
        </h1>
        <p className="tool-hero-sub" style={{ maxWidth: 480, marginBottom: 0 }}>
          Everything you need to know about the AI Job Application System.
        </p>
      </div>

      {/* Section B: Divider */}
      <div className="tool-divider" style={{ marginTop: 28 }} />

      {/* Section C: FAQ Accordion */}
      <div className="tool-section" style={{ padding: '0 40px 60px' }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{
            background: openIdx === i ? 'rgba(29,158,117,0.03)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${openIdx === i ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 12,
            marginBottom: 10,
            overflow: 'hidden',
            transition: 'all 0.25s',
          }}>
            <button
              onClick={() => toggle(i)}
              style={{
                width: '100%',
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e2ede8', textAlign: 'left' }}>{faq.q}</span>
              <span style={{ fontSize: 18, color: '#1D9E75', flexShrink: 0, lineHeight: 1, transition: 'transform 0.2s' }}>
                {openIdx === i ? '−' : '+'}
              </span>
            </button>
            {openIdx === i && (
              <div style={{
                padding: '0 22px 18px',
                fontSize: 13,
                color: 'rgba(226,237,232,0.55)',
                lineHeight: 1.7,
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Section D: Divider */}
      <div className="tool-divider" style={{ marginBottom: 56 }} />

      {/* Section E: Contact */}
      <div className="tool-section" style={{ padding: '0 40px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(29,158,117,0.55)', marginBottom: 20, textTransform: 'uppercase', fontWeight: 600 }}>
          STILL HAVE QUESTIONS?
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10, color: '#e2ede8' }}>
          We reply <span className="tool-kw">personally.</span>
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(226,237,232,0.45)', marginBottom: 24, lineHeight: 1.7, maxWidth: 440, margin: '0 auto 24px' }}>
          Have a question, issue, or feedback? Send us an email — a real person reads and replies to every message.
        </p>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '3px solid #1D9E75',
          borderRadius: 10,
          padding: '16px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#1D9E75', fontSize: 16, lineHeight: 1 }}>✉</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#e2ede8', letterSpacing: '0.2px', userSelect: 'all' }}>
              smartaisystemshq@gmail.com
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(226,237,232,0.35)', marginTop: 12 }}>
          We typically reply within 24 hours.
        </div>
      </div>

      {/* Section F: Divider */}
      <div className="tool-divider" style={{ marginTop: 48, marginBottom: 48 }} />

      {/* Section G: Social Media */}
      <div className="tool-section" style={{ padding: '0 40px 100px', textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(29,158,117,0.55)', marginBottom: 20, textTransform: 'uppercase', fontWeight: 600 }}>
          FOLLOW FOR MORE TIPS
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: '#e2ede8' }}>
          Stay in the <span className="tool-kw">loop.</span>
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(226,237,232,0.45)', marginBottom: 32, lineHeight: 1.7 }}>
          Follow us for free job application tips, AI tricks, and product updates.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>

          {/* TikTok */}
          <a
            href="https://www.tiktok.com/@smart.ai.systems"
            target="_blank"
            rel="noopener noreferrer"
            className="faq-social-card"
          >
            <TikTokIcon />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2ede8', marginBottom: 4 }}>TikTok</div>
            <div style={{ fontSize: 12, color: 'rgba(29,158,117,0.8)' }}>@smart.ai.systems</div>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/smartaisystemshq"
            target="_blank"
            rel="noopener noreferrer"
            className="faq-social-card"
          >
            <InstagramIcon />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2ede8', marginBottom: 4 }}>Instagram</div>
            <div style={{ fontSize: 12, color: 'rgba(29,158,117,0.8)' }}>@smartaisystemshq</div>
          </a>

        </div>
      </div>

    </div>
  );
}
