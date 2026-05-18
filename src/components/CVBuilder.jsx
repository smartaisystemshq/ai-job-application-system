import React, { useState, useEffect, useRef } from 'react';
import DownloadButtons from '../utils/DownloadButtons';
import ScoreCard, { calculateAttractivenessScore } from './ScoreCard';

const LS_KEY = 'jas.cvb';

const BLANK = {
  step: 1,
  personal: { name: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', targetRole: '' },
  experience: [],
  education: [],
  skills: [],
  summary: '',
};

function load() {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) return { ...BLANK, ...JSON.parse(s) };
  } catch {}
  return BLANK;
}

function newExp() { return { id: Date.now(), jobTitle: '', company: '', startDate: '', endDate: '', isCurrent: false, description: '', bullets: '' }; }
function newEdu() { return { id: Date.now() + 1, degree: '', institution: '', year: '', field: '' }; }

// ── Step Indicator ──────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['Personal', 'Experience', 'Education', 'Skills', 'Summary'];
  return (
    <div className="step-indicator">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <React.Fragment key={n}>
            <div className="step-item">
              <div className={`step-circle${done ? ' done' : active ? ' active' : ''}`}>
                {done ? '✓' : n}
              </div>
              <span className="step-label">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-line${done ? ' done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`copy-btn ${copied ? 'copied' : ''}`}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? '✓ Copied to Clipboard' : '⎘ Copy CV'}
    </button>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: 13, marginTop: 10 }}>
      {msg}
    </div>
  );
}

// ── Mini Chatbot ────────────────────────────────────────────────
function MiniChatbot({ currentDocument, onUpdate }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdjust = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/adjust-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: currentDocument,
          instruction: input.trim(),
          documentType: 'cv',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adjustment failed');
      onUpdate(data.result);
      setInput('');
    } catch (err) {
      setError(err.message || 'Failed to apply adjustment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mini-chatbot">
      <div className="mini-chatbot-label">
        <span className="mini-chatbot-icon">✦</span>
        <span>Adjust with AI</span>
        <span className="mini-chatbot-hint">Type a request — Claude updates the CV above</span>
      </div>
      <div className="mini-chatbot-row">
        <input
          className="input mini-chatbot-input"
          placeholder={`"Make it shorter", "Stronger opening", "More formal tone", "Add keywords for software engineering"...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleAdjust()}
          disabled={loading}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAdjust}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0 }}
        >
          {loading
            ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'white' }}></span> Applying…</>
            : 'Apply →'}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{error}</p>}
      {loading && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Applying your adjustment…</p>}
    </div>
  );
}

// ── CV Text Generator ───────────────────────────────────────────
function buildCVText({ personal, experience, education, skills, summary }) {
  const { name, email, phone, location, linkedin, portfolio } = personal;
  const lines = [];
  lines.push((name || 'YOUR NAME').toUpperCase());
  const contact = [email, phone, location].filter(Boolean).join(' | ');
  if (contact) lines.push(contact);
  if (linkedin) lines.push(linkedin);
  if (portfolio) lines.push(portfolio);
  lines.push('');

  if (summary) {
    lines.push('─'.repeat(58));
    lines.push('');
    lines.push('PROFESSIONAL SUMMARY');
    lines.push('');
    lines.push(summary);
    lines.push('');
  }

  if (experience.length > 0) {
    lines.push('─'.repeat(58));
    lines.push('');
    lines.push('WORK EXPERIENCE');
    lines.push('');
    experience.forEach(exp => {
      const dates = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate].filter(Boolean).join(' – ');
      const header = [exp.jobTitle || 'Job Title', exp.company || 'Company', dates].filter(Boolean).join(' | ');
      lines.push(header);
      if (exp.bullets) {
        exp.bullets.split('\n').filter(l => l.trim()).forEach(l => lines.push(l.trim()));
      }
      lines.push('');
    });
  }

  if (education.length > 0) {
    lines.push('─'.repeat(58));
    lines.push('');
    lines.push('EDUCATION');
    lines.push('');
    education.forEach(edu => {
      const deg = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
      lines.push([deg || 'Degree', edu.institution || 'Institution', edu.year].filter(Boolean).join(' | '));
    });
    lines.push('');
  }

  if (skills.length > 0) {
    lines.push('─'.repeat(58));
    lines.push('');
    lines.push('SKILLS');
    lines.push('');
    lines.push(skills.join(', '));
  }

  return lines.join('\n');
}

// ── Main Component ──────────────────────────────────────────────
export default function CVBuilder() {
  const [state, setState] = useState(load);
  const [skillInput, setSkillInput] = useState('');
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [bulletLoading, setBulletLoading] = useState(null);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  // Adjusted CV text from chatbot (separate from raw buildCVText output)
  const [adjustedCvText, setAdjustedCvText] = useState(null);
  const [cvScore, setCvScore] = useState(null);

  const previewRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  // Clear adjustedCvText when user goes back from preview
  useEffect(() => {
    if (state.step !== 6) setAdjustedCvText(null);
  }, [state.step]);

  const set = (key, val) => setState(s => ({ ...s, [key]: val }));
  const setP = (key, val) => setState(s => ({ ...s, personal: { ...s.personal, [key]: val } }));
  const setStep = (n) => {
    setState(s => ({ ...s, step: n }));
    setApiError('');
    setSuggestedSkills([]);
    if (n === 6) {
      const text = adjustedCvText ?? buildCVText(state);
      setCvScore(calculateAttractivenessScore(text));
    }
  };

  const addExp = () => set('experience', [...state.experience, newExp()]);
  const updExp = (id, key, val) => set('experience', state.experience.map(e => e.id === id ? { ...e, [key]: val } : e));
  const delExp = (id) => set('experience', state.experience.filter(e => e.id !== id));

  const addEdu = () => set('education', [...state.education, newEdu()]);
  const updEdu = (id, key, val) => set('education', state.education.map(e => e.id === id ? { ...e, [key]: val } : e));
  const delEdu = (id) => set('education', state.education.filter(e => e.id !== id));

  const addSkill = (sk) => {
    const t = sk.trim();
    if (!t || state.skills.includes(t)) return;
    set('skills', [...state.skills, t]);
  };
  const removeSkill = (sk) => set('skills', state.skills.filter(s => s !== sk));

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
      setSkillInput('');
    }
  };

  const generateBullets = async (expId) => {
    const exp = state.experience.find(e => e.id === expId);
    if (!exp?.description.trim()) { setApiError('Add a description first so Claude has something to work with.'); return; }
    setBulletLoading(expId); setApiError('');
    try {
      const res = await fetch('/api/cv-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-bullets', data: { jobTitle: exp.jobTitle, company: exp.company, description: exp.description, targetRole: state.personal.targetRole } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updExp(expId, 'bullets', data.result);
    } catch (err) {
      setApiError(err.message || 'Failed to generate bullet points.');
    } finally {
      setBulletLoading(null);
    }
  };

  const suggestSkills = async () => {
    if (!state.personal.targetRole.trim()) { setApiError('Add a target role in Step 1 first.'); return; }
    setSkillsLoading(true); setApiError(''); setSuggestedSkills([]);
    try {
      const res = await fetch('/api/cv-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest-skills', data: { targetRole: state.personal.targetRole, existingSkills: state.skills } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const suggestions = data.result.split(',').map(s => s.trim()).filter(Boolean);
      setSuggestedSkills(suggestions);
    } catch (err) {
      setApiError(err.message || 'Failed to suggest skills.');
    } finally {
      setSkillsLoading(false);
    }
  };

  const generateSummary = async () => {
    setSummaryLoading(true); setApiError('');
    try {
      const res = await fetch('/api/cv-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-summary', data: { name: state.personal.name, targetRole: state.personal.targetRole, experience: state.experience, education: state.education, skills: state.skills } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set('summary', data.result);
    } catch (err) {
      setApiError(err.message || 'Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const startOver = () => {
    setState(BLANK);
    localStorage.removeItem(LS_KEY);
    setSuggestedSkills([]);
    setAdjustedCvText(null);
  };

  const baseCvText = buildCVText(state);
  const displayCvText = adjustedCvText ?? baseCvText;

  // ── Step renders ──────────────────────────────────────────────

  const renderStep1 = () => (
    <div>
      <h2 className="step-title">Personal Information</h2>
      <p className="step-subtitle">Basic contact details and your target role (used to guide AI suggestions in later steps).</p>
      <div className="two-col" style={{ marginTop: 20 }}>
        <div className="form-group">
          <label className="label">Full Name *</label>
          <input className="input" placeholder="Jane Smith" value={state.personal.name} onChange={e => setP('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Target Role *</label>
          <input className="input" placeholder="e.g. Senior Product Manager" value={state.personal.targetRole} onChange={e => setP('targetRole', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="jane@example.com" value={state.personal.email} onChange={e => setP('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Phone</label>
          <input className="input" placeholder="+44 7000 000000" value={state.personal.phone} onChange={e => setP('phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Location</label>
          <input className="input" placeholder="London, UK" value={state.personal.location} onChange={e => setP('location', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">
            LinkedIn URL
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder="linkedin.com/in/janesmith" value={state.personal.linkedin} onChange={e => setP('linkedin', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">
            Portfolio / Website
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder="janesmith.com or github.com/janesmith" value={state.personal.portfolio} onChange={e => setP('portfolio', e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 className="step-title">Work Experience</h2>
      <p className="step-subtitle">Add each role you want to include. Claude can generate strong bullet points from a short description.</p>

      {state.experience.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', marginTop: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>💼</div>
          <p>No experience entries yet. Click "Add Role" to start.</p>
        </div>
      )}

      {state.experience.map((exp, idx) => (
        <div key={exp.id} className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Role {idx + 1}</span>
            <button className="btn btn-danger btn-sm" onClick={() => delExp(exp.id)}>Remove</button>
          </div>
          <div className="two-col">
            <div className="form-group">
              <label className="label">Job Title</label>
              <input className="input" placeholder="Software Engineer" value={exp.jobTitle} onChange={e => updExp(exp.id, 'jobTitle', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Company</label>
              <input className="input" placeholder="Acme Ltd" value={exp.company} onChange={e => updExp(exp.id, 'company', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">From <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(e.g. Jan 2022)</span></label>
              <input className="input" placeholder="Jan 2022" value={exp.startDate} onChange={e => updExp(exp.id, 'startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">To <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(e.g. Dec 2023 or "Present")</span></label>
              <input className="input" placeholder={exp.isCurrent ? 'Present' : 'Dec 2023'} value={exp.isCurrent ? 'Present' : exp.endDate} onChange={e => updExp(exp.id, 'endDate', e.target.value)} disabled={exp.isCurrent} />
              <label style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={exp.isCurrent} onChange={e => updExp(exp.id, 'isCurrent', e.target.checked)} />
                Current role
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Brief Description</label>
            <textarea className="textarea" rows={3} placeholder="Briefly describe what you did — Claude will turn this into strong CV bullet points..." value={exp.description} onChange={e => updExp(exp.id, 'description', e.target.value)} />
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => generateBullets(exp.id)}
            disabled={bulletLoading === exp.id}
            style={{ marginBottom: exp.bullets ? 12 : 0 }}
          >
            {bulletLoading === exp.id
              ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'currentColor' }}></span> Generating...</>
              : '✦ AI: Generate Bullet Points'}
          </button>
          {exp.bullets && (
            <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
              <label className="label">Bullet Points (editable)</label>
              <textarea className="textarea" rows={5} value={exp.bullets} onChange={e => updExp(exp.id, 'bullets', e.target.value)} />
            </div>
          )}
        </div>
      ))}

      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={addExp}>
        + Add Role
      </button>
      <ErrBox msg={apiError} />
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 className="step-title">Education</h2>
      <p className="step-subtitle">Add your degrees, diplomas, or certifications.</p>

      {state.education.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', marginTop: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>🎓</div>
          <p>No education entries yet. Click "Add Education" to start.</p>
        </div>
      )}

      {state.education.map((edu, idx) => (
        <div key={edu.id} className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Entry {idx + 1}</span>
            <button className="btn btn-danger btn-sm" onClick={() => delEdu(edu.id)}>Remove</button>
          </div>
          <div className="two-col">
            <div className="form-group">
              <label className="label">Degree / Qualification</label>
              <input className="input" placeholder="BSc Computer Science" value={edu.degree} onChange={e => updEdu(edu.id, 'degree', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Field of Study</label>
              <input className="input" placeholder="(optional)" value={edu.field} onChange={e => updEdu(edu.id, 'field', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Institution</label>
              <input className="input" placeholder="University of Manchester" value={edu.institution} onChange={e => updEdu(edu.id, 'institution', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Year</label>
              <input className="input" placeholder="2020" value={edu.year} onChange={e => updEdu(edu.id, 'year', e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={addEdu}>
        + Add Education
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h2 className="step-title">Skills</h2>
      <p className="step-subtitle">Add your key skills. Type and press Enter (or comma) to add each one. Use the AI button to get suggestions — click each one to add it.</p>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Type a skill and press Enter..."
          value={skillInput}
          onChange={e => setSkillInput(e.target.value)}
          onKeyDown={handleSkillKeyDown}
          style={{ flex: 1 }}
        />
        <button className="btn btn-secondary" onClick={() => { addSkill(skillInput); setSkillInput(''); }} disabled={!skillInput.trim()}>
          Add
        </button>
      </div>

      {state.skills.length > 0 && (
        <div className="skill-tags" style={{ marginBottom: 20 }}>
          {state.skills.map(sk => (
            <span key={sk} className="skill-tag">
              {sk}
              <button className="skill-remove" onClick={() => removeSkill(sk)} title="Remove">✕</button>
            </span>
          ))}
        </div>
      )}

      <button
        className="btn btn-secondary"
        onClick={suggestSkills}
        disabled={skillsLoading}
        style={{ marginBottom: 16 }}
      >
        {skillsLoading
          ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'currentColor' }}></span> Suggesting...</>
          : '✦ AI: Suggest Skills for ' + (state.personal.targetRole || 'My Role')}
      </button>

      {suggestedSkills.length > 0 && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            Click to add — unselected suggestions disappear when you move on:
          </p>
          <div className="skill-tags">
            {suggestedSkills.filter(s => !state.skills.includes(s)).map(sk => (
              <button
                key={sk}
                className="skill-tag suggested"
                onClick={() => {
                  addSkill(sk);
                  setSuggestedSkills(prev => prev.filter(s => s !== sk));
                }}
              >
                + {sk}
              </button>
            ))}
          </div>
          {suggestedSkills.filter(s => !state.skills.includes(s)).length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--accent)' }}>All suggestions added ✓</p>
          )}
        </div>
      )}

      <ErrBox msg={apiError} />
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h2 className="step-title">Professional Summary</h2>
      <p className="step-subtitle">Generate a 3-4 sentence summary from your profile, or write your own.</p>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, marginBottom: 16 }}>
        <button
          className="btn btn-primary"
          onClick={generateSummary}
          disabled={summaryLoading}
        >
          {summaryLoading
            ? <><span className="spinner"></span> Generating...</>
            : '✦ AI: Generate Summary'}
        </button>
      </div>

      <div className="form-group">
        <label className="label">Summary (editable)</label>
        <textarea
          className="textarea"
          rows={6}
          placeholder="Write or generate your professional summary here..."
          value={state.summary}
          onChange={e => set('summary', e.target.value)}
        />
      </div>

      <ErrBox msg={apiError} />
    </div>
  );

  const renderPreview = () => (
    <div ref={previewRef}>
      {/* Result header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 0, flexWrap: 'wrap', gap: 8,
        padding: '12px 16px',
        background: 'rgba(29,158,117,0.06)',
        border: '1px solid rgba(29,158,117,0.2)',
        borderBottom: 'none',
        borderRadius: '14px 14px 0 0',
      }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>Your CV</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Download as PDF or Word, or copy the text.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <DownloadButtons
            text={displayCvText}
            filename={`${(state.personal.name || 'my-cv').toLowerCase().replace(/\s+/g, '-')}`}
          />
          <CopyButton text={displayCvText} />
        </div>
      </div>

      <div className="result-box-wrapper" style={{ borderRadius: '0 0 16px 16px' }}>
        <div className="result-box" style={{ borderRadius: '0 0 15px 15px', minHeight: 400, maxHeight: 560 }}>{displayCvText}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={() => setStep(5)}>← Back to Summary</button>
        <button className="btn btn-ghost" onClick={startOver} style={{ marginLeft: 'auto', color: 'var(--danger)' }}>
          Start Over
        </button>
      </div>

      {cvScore !== null && <ScoreCard score={cvScore} />}

      <MiniChatbot
        currentDocument={displayCvText}
        onUpdate={(newText) => {
          setAdjustedCvText(newText);
          setCvScore(calculateAttractivenessScore(newText));
          setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        }}
      />
    </div>
  );

  return (
    <div className="page">
      <div className="page-header scroll-reveal">
        <h1>CV Builder</h1>
        <p>Build a professional CV from scratch in 5 guided steps — with AI assistance at every stage</p>
      </div>

      <div className="section-desc scroll-reveal">
        <strong>No existing CV?</strong> This wizard guides you step by step: add your personal info, work history, education, and skills. Claude generates bullet points, suggests skills, and writes your summary — then shows a clean formatted CV you can download as PDF or Word.
      </div>

      {state.step <= 5 && <StepIndicator step={state.step} />}

      <div className="card" style={{ minHeight: 300 }}>
        {state.step === 1 && renderStep1()}
        {state.step === 2 && renderStep2()}
        {state.step === 3 && renderStep3()}
        {state.step === 4 && renderStep4()}
        {state.step === 5 && renderStep5()}
        {state.step === 6 && renderPreview()}
      </div>

      {state.step <= 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setStep(state.step - 1)}
            disabled={state.step === 1}
          >
            ← Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setStep(state.step < 5 ? state.step + 1 : 6)}
          >
            {state.step === 5 ? 'Preview CV →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
