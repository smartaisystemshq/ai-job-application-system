import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';
import DownloadButtons from '../utils/DownloadButtons';
import DocumentPreview from '../utils/DocumentPreview';
import ScoreCard, { calculateAttractivenessScore } from './ScoreCard';
import { stripMarkdown } from '../utils/downloadUtils';
import { TemplateSelector } from './TemplateSelector';
import LockedContent from './LockedContent';

const LS_KEY = 'jas.cvb';

const BLANK = {
  step: 1,
  personal: { name: '', email: '', phone: '', street: '', city: '', postalCode: '', country: '', linkedin: '', portfolio: '', targetRole: '' },
  experience: [],
  education: [],
  skills: [],
  summary: '',
};

function load() {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      return { ...BLANK, ...parsed, personal: { ...BLANK.personal, ...(parsed.personal || {}) } };
    }
  } catch {}
  return BLANK;
}

function newExp() { return { id: Date.now(), jobTitle: '', company: '', startDate: '', endDate: '', isCurrent: false, description: '', bullets: '' }; }
function newEdu() { return { id: Date.now() + 1, institution: '', degree: '', field: '', startYear: '', endYear: '' }; }

// ── Step Progress Bar ────────────────────────────────────────────
function StepProgressBar({ step }) {
  const { lang } = useLang();
  const STEP_NAMES = [
    t[lang].builder_step1,
    t[lang].builder_step2,
    t[lang].builder_step3,
    t[lang].builder_step4,
    t[lang].builder_step5,
  ];
  const progress = (step / 5) * 100;
  return (
    <div className="tool-section" style={{ padding: '0 40px 40px' }}>
      <div style={{ position: 'relative', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 16 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          borderRadius: 3, background: '#1D9E75',
          width: `${progress}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {STEP_NAMES.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 12 : 11,
                fontWeight: 700,
                flexShrink: 0,
                ...(done
                  ? { background: '#1D9E75', color: 'white', border: 'none' }
                  : active
                  ? { background: 'rgba(29,158,117,0.15)', border: '2px solid #1D9E75', color: '#1D9E75' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(226,237,232,0.35)' }
                ),
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{
                fontSize: 11,
                color: (done || active) ? '#e2ede8' : 'rgba(226,237,232,0.35)',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step header ──────────────────────────────────────────────────
function StepHeader({ step }) {
  const { lang } = useLang();
  const titleKeys = ['builder_s1_title', 'builder_s2_title', 'builder_s3_title', 'builder_s4_title', 'builder_s5_title'];
  const descKeys  = ['builder_s1_desc',  'builder_s2_desc',  'builder_s3_desc',  'builder_s4_desc',  'builder_s5_desc'];
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2ede8', marginBottom: 6, lineHeight: 1.3 }}>
        {t[lang][titleKeys[step - 1]]}
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(226,237,232,0.45)', lineHeight: 1.6 }}>
        {t[lang][descKeys[step - 1]]}
      </p>
    </div>
  );
}

// ── Tip box ──────────────────────────────────────────────────────
function TipBox({ step }) {
  const { lang } = useLang();
  const tipKeys = ['builder_tip1', 'builder_tip2', 'builder_tip3', 'builder_tip4', 'builder_tip5'];
  const tipLabel = lang === 'DE' ? 'Tipp:' : 'Tip:';
  return (
    <div className="tool-tip-box" style={{ marginBottom: 24 }}>
      <span>💡</span>
      <span>
        <strong style={{ color: '#1D9E75' }}>{tipLabel}</strong>{' '}{t[lang][tipKeys[step - 1]]}
      </span>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────
function CopyButton({ text }) {
  const { lang } = useLang();
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
      {copied ? t[lang].builder_copied_cv : t[lang].builder_copy_cv}
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

// ── Mini Chatbot ─────────────────────────────────────────────────
function MiniChatbot({ currentDocument, onUpdate }) {
  const { lang } = useLang();
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
      onUpdate(stripMarkdown(data.result));
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
        <span>{t[lang].adjust_with_ai}</span>
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
            : t[lang].adjust_apply}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{error}</p>}
      {loading && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Applying your adjustment…</p>}
    </div>
  );
}

// ── CV Text Generator ────────────────────────────────────────────
function buildCVText({ personal, experience, education, skills, summary }) {
  const { name, email, phone, street, city, postalCode, country, linkedin, portfolio } = personal;
  const lines = [];
  lines.push((name || 'YOUR NAME').toUpperCase());
  const loc = [city, country].filter(Boolean).join(', ');
  const contact = [email, phone, loc].filter(Boolean).join(' | ');
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

  const validExp = experience.filter(e => e.jobTitle?.trim() || e.company?.trim() || e.bullets?.trim());
  if (validExp.length > 0) {
    lines.push('─'.repeat(58));
    lines.push('');
    lines.push('WORK EXPERIENCE');
    lines.push('');
    validExp.forEach(exp => {
      const dates = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate].filter(Boolean).join(' – ');
      const header = [exp.jobTitle, exp.company, dates].filter(s => s?.trim()).join(' | ');
      if (header) lines.push(header);
      if (exp.bullets) {
        exp.bullets.split('\n').filter(l => l.trim()).forEach(l => lines.push(l.trim()));
      }
      lines.push('');
    });
  }

  const validEdu = education.filter(e => e.institution?.trim());
  if (validEdu.length > 0) {
    lines.push('─'.repeat(58));
    lines.push('');
    lines.push('EDUCATION');
    lines.push('');
    validEdu.forEach(edu => {
      const dates = [edu.startYear, edu.endYear || edu.year].filter(s => s?.trim()).join(' – ');
      const deg = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
      const parts = [edu.institution, deg, dates].filter(s => s?.trim());
      if (parts.length) lines.push(parts.join(' | '));
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

// ── Main Component ───────────────────────────────────────────────
export default function CVBuilder({ unlocked, onUnlock }) {
  const { lang } = useLang();
  const [state, setState] = useState(load);
  const [skillInput, setSkillInput] = useState('');
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [bulletLoading, setBulletLoading] = useState(null);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [adjustedCvText, setAdjustedCvText] = useState(null);
  const [cvScore, setCvScore] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');

  const previewRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

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
      updExp(expId, 'bullets', stripMarkdown(data.result));
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
      set('summary', stripMarkdown(data.result));
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
      <div className="two-col">
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
          <label className="label">
            Street &amp; House Number
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder="123 High Street" value={state.personal.street} onChange={e => setP('street', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">City</label>
          <input className="input" placeholder="London" value={state.personal.city} onChange={e => setP('city', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">
            Postal Code
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder="SW1A 1AA" value={state.personal.postalCode} onChange={e => setP('postalCode', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">
            Country
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder="United Kingdom" value={state.personal.country} onChange={e => setP('country', e.target.value)} />
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
      {state.experience.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', marginTop: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>💼</div>
          <p>{t[lang].builder_no_exp}</p>
        </div>
      )}

      {state.experience.map((exp, idx) => (
        <div key={exp.id} className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{t[lang].builder_role} {idx + 1}</span>
            <button className="btn btn-danger btn-sm" onClick={() => delExp(exp.id)}>{t[lang].builder_remove}</button>
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
                {t[lang].builder_current_role}
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="label">{t[lang].builder_brief_desc}</label>
            <textarea className="textarea" rows={3} placeholder="Briefly describe what you did — Claude will turn this into strong CV bullet points..." value={exp.description} onChange={e => updExp(exp.id, 'description', e.target.value)} />
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => generateBullets(exp.id)}
            disabled={bulletLoading === exp.id}
            style={{ marginBottom: exp.bullets ? 12 : 0 }}
          >
            {bulletLoading === exp.id
              ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'currentColor' }}></span> {t[lang].builder_ai_generating}</>
              : t[lang].builder_ai_bullets}
          </button>
          {exp.bullets && (
            <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
              <label className="label">{t[lang].builder_bullets_label}</label>
              <textarea className="textarea" rows={5} value={exp.bullets} onChange={e => updExp(exp.id, 'bullets', e.target.value)} />
            </div>
          )}
        </div>
      ))}

      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={addExp}>
        {t[lang].builder_add_role}
      </button>
      <ErrBox msg={apiError} />
    </div>
  );

  const renderStep3 = () => (
    <div>
      {state.education.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', marginTop: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>🎓</div>
          <p>{t[lang].builder_no_edu}</p>
        </div>
      )}

      {state.education.map((edu, idx) => (
        <div key={edu.id} className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{t[lang].builder_entry} {idx + 1}</span>
            <button className="btn btn-danger btn-sm" onClick={() => delEdu(edu.id)}>{t[lang].builder_remove}</button>
          </div>
          <div className="form-group">
            <label className="label">{t[lang].edu_school} *</label>
            <input className="input" placeholder="e.g. BG/BRG Lilienfeld, BHAK St. Pölten, University of Vienna" value={edu.institution} onChange={e => updEdu(edu.id, 'institution', e.target.value)} />
          </div>
          <div className="two-col">
            <div className="form-group">
              <label className="label">
                {t[lang].edu_degree}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>{t[lang].edu_optional}</span>
              </label>
              <input className="input" placeholder="e.g. Matura, Bachelor, Certificate" value={edu.degree} onChange={e => updEdu(edu.id, 'degree', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">
                {t[lang].edu_field}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>{t[lang].edu_optional}</span>
              </label>
              <input className="input" placeholder="e.g. Business, Computer Science" value={edu.field} onChange={e => updEdu(edu.id, 'field', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{t[lang].edu_from}</label>
              <input className="input" placeholder="e.g. 2019" value={edu.startYear} onChange={e => updEdu(edu.id, 'startYear', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{t[lang].edu_to}</label>
              <input className="input" placeholder="e.g. 2023 or 'Present'" value={edu.endYear} onChange={e => updEdu(edu.id, 'endYear', e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={addEdu}>
        {t[lang].builder_add_edu}
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
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
          ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'currentColor' }}></span> {t[lang].builder_ai_generating}</>
          : `${t[lang].builder_ai_skills_prefix} ${state.personal.targetRole || 'My Role'}`}
      </button>

      {suggestedSkills.length > 0 && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            {t[lang].builder_suggestions_hint}
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
            <p style={{ fontSize: 13, color: 'var(--accent)' }}>{t[lang].builder_all_added}</p>
          )}
        </div>
      )}

      <ErrBox msg={apiError} />
    </div>
  );

  const renderStep5 = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          className="btn btn-primary"
          onClick={generateSummary}
          disabled={summaryLoading}
        >
          {summaryLoading
            ? <><span className="spinner"></span> {t[lang].builder_ai_generating}</>
            : t[lang].builder_ai_summary}
        </button>
      </div>

      <div className="form-group">
        <label className="label">{t[lang].builder_summary_label}</label>
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
      <LockedContent unlocked={unlocked} onUnlock={onUnlock}>
        <TemplateSelector selectedTemplate={selectedTemplate} onSelect={setSelectedTemplate} />

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, flexWrap: 'wrap', gap: 8,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{t[lang].builder_your_cv}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t[lang].builder_dl_hint}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <DownloadButtons
              text={displayCvText}
              filename={`${(state.personal.name || 'my-cv').toLowerCase().replace(/\s+/g, '-')}`}
              template={selectedTemplate}
            />
            <CopyButton text={displayCvText} />
          </div>
        </div>

        <DocumentPreview text={displayCvText} template={selectedTemplate} />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => setStep(5)}>{t[lang].builder_back_summary}</button>
          <button className="btn btn-ghost" onClick={startOver} style={{ marginLeft: 'auto', color: 'var(--danger)' }}>
            {t[lang].builder_start_over}
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
      </LockedContent>
    </div>
  );

  return (
    <div className="cvb-wrap">

      {/* ── Section A: Hero ── */}
      <div className="tool-hero scroll-reveal">
        <div className="tool-hero-badge">
          <span>◈</span><span>{t[lang].builder_badge}</span>
        </div>
        <h1 className="tool-hero-h1">
          Build a professional <span className="tool-kw">{t[lang].builder_headline_highlight}</span> from scratch
        </h1>
        <p className="tool-hero-sub">
          {t[lang].builder_sub}
        </p>
        <p className="tool-ats-note">
          {t[lang].builder_timing}
        </p>
      </div>

      {/* ── Section B: Divider ── */}
      <div className="tool-divider" style={{ margin: '24px 40px 40px' }} />

      {/* ── Section C: Progress bar (steps 1–5 only) ── */}
      {state.step <= 5 && <StepProgressBar step={state.step} />}

      {/* ── Sections D + G + E: Form card, tip box, nav ── */}
      {state.step <= 5 && (
        <div className="tool-section" style={{ padding: '0 40px 32px' }}>

          {/* Form card */}
          <div className="cvb-form-card scroll-reveal">
            <StepHeader step={state.step} />
            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
            {state.step === 4 && renderStep4()}
            {state.step === 5 && renderStep5()}
          </div>

          {/* Tip box */}
          <TipBox step={state.step} />

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="cvb-btn-prev"
              onClick={() => setStep(state.step - 1)}
              disabled={state.step === 1}
            >
              {t[lang].builder_previous}
            </button>
            <span style={{ fontSize: 12, color: 'rgba(226,237,232,0.38)' }}>
              {t[lang].builder_step_label} {state.step} {t[lang].builder_step_of} 5
            </span>
            <button
              className="cvb-btn-next"
              onClick={() => setStep(state.step < 5 ? state.step + 1 : 6)}
            >
              {state.step === 5 ? t[lang].builder_preview_cv : t[lang].builder_next}
            </button>
          </div>

        </div>
      )}

      {/* ── Section F: Preview (step 6) ── */}
      {state.step === 6 && (
        <div className="tool-section" style={{ padding: '0 40px 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }} className="scroll-reveal">
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2ede8', marginBottom: 6 }}>
              {t[lang].builder_ready}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(226,237,232,0.45)' }}>
              {t[lang].builder_ready_sub}
            </p>
          </div>
          {renderPreview()}
        </div>
      )}

    </div>
  );
}
