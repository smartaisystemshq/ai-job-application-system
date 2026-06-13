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
  personal: { name: '', email: '', phone: '', street: '', city: '', postalCode: '', country: '', linkedin: '', portfolio: '', targetRole: '', jobDescription: '' },
  experience: [],
  projects: [],
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
function newProject() { return { id: Date.now() + 2, title: '', description: '', year: '' }; }

// ── Step Progress Bar ────────────────────────────────────────────
function StepProgressBar({ step }) {
  const { lang } = useLang();
  const STEP_NAMES = [
    t[lang].builder_step1,
    t[lang].builder_step_photo,
    t[lang].builder_step2,
    t[lang].builder_step_projects,
    t[lang].builder_step3,
    t[lang].builder_step4,
    t[lang].builder_step5,
  ];
  const progress = (step / 7) * 100;
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
  const stepData = {
    1: { titleKey: 'builder_s1_title', descKey: 'builder_s1_desc' },
    2: { titleKey: 'builder_photo_title', descKey: 'builder_photo_desc', isPhoto: true },
    3: { titleKey: 'builder_s2_title', descKey: 'builder_s2_desc' },
    4: { titleKey: 'builder_projects_title', descKey: 'builder_projects_desc' },
    5: { titleKey: 'builder_s3_title', descKey: 'builder_s3_desc' },
    6: { titleKey: 'builder_s4_title', descKey: 'builder_s4_desc' },
    7: { titleKey: 'builder_s5_title', descKey: 'builder_s5_desc' },
  };
  const data = stepData[step] || stepData[1];
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2ede8', marginBottom: 6, lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 8 }}>
        {t[lang][data.titleKey]}
        {data.isPhoto && (
          <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(226,237,232,0.4)', fontStyle: 'italic' }}>
            {t[lang].builder_photo_optional}
          </span>
        )}
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(226,237,232,0.45)', lineHeight: 1.6 }}>
        {t[lang][data.descKey]}
      </p>
    </div>
  );
}

// ── Tip box ──────────────────────────────────────────────────────
function TipBox({ step }) {
  const { lang } = useLang();
  const tipKeys = { 1: 'builder_tip1', 3: 'builder_tip2', 4: 'builder_projects_tip', 5: 'builder_tip3', 6: 'builder_tip4', 7: 'builder_tip5' };
  const tipLabel = lang === 'DE' ? 'Tipp:' : 'Tip:';
  const tipKey = tipKeys[step];
  if (!tipKey) return null;
  return (
    <div className="tool-tip-box" style={{ marginBottom: 24 }}>
      <span>
        <strong style={{ color: '#1D9E75' }}>{tipLabel}</strong>{' '}{t[lang][tipKey]}
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
        <span className="mini-chatbot-hint">{t[lang].adjust_placeholder}</span>
      </div>
      <div className="mini-chatbot-row">
        <input
          className="input mini-chatbot-input"
          placeholder={t[lang].adjust_suggestions_cv.map(s => `"${s}"`).join(', ') + '...'}
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
            ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'white' }}></span> {t[lang].adjust_applying}</>
            : t[lang].adjust_apply}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{error}</p>}
      {loading && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{t[lang].adjust_applying}</p>}
    </div>
  );
}

// ── CV Text Generator ────────────────────────────────────────────
function buildCVText({ personal, experience, projects, education, skills, summary }) {
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

  const validProjects = (projects || []).filter(p => p.title?.trim() || p.description?.trim());
  if (validProjects.length > 0) {
    lines.push('─'.repeat(58));
    lines.push('');
    lines.push('PROJECTS & ACHIEVEMENTS');
    lines.push('');
    validProjects.forEach(proj => {
      const header = [proj.title, proj.year].filter(s => s?.trim()).join(' | ');
      if (header) lines.push(header);
      if (proj.description?.trim()) lines.push(proj.description.trim());
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
  const photoInputRef = useRef(null);
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.step !== 8) setAdjustedCvText(null);
  }, [state.step]);

  const set = (key, val) => setState(s => ({ ...s, [key]: val }));
  const setP = (key, val) => setState(s => ({ ...s, personal: { ...s.personal, [key]: val } }));
  const setStep = (n) => {
    setState(s => ({ ...s, step: n }));
    setApiError('');
    setSuggestedSkills([]);
    if (n === 8) {
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

  const addProject = () => set('projects', [...(state.projects || []), newProject()]);
  const updProject = (id, key, val) => set('projects', (state.projects || []).map(p => p.id === id ? { ...p, [key]: val } : p));
  const delProject = (id) => set('projects', (state.projects || []).filter(p => p.id !== id));

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
        body: JSON.stringify({ action: 'generate-summary', data: { name: state.personal.name, targetRole: state.personal.targetRole, jobDescription: state.personal.jobDescription, experience: state.experience, projects: state.projects, education: state.education, skills: state.skills } }),
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
    setPhotoBase64('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setPhotoError(lang === 'DE' ? 'Datei zu groß (max. 5 MB).' : 'File too large (max 5 MB).'); return; }
    if (!file.type.startsWith('image/')) { setPhotoError(lang === 'DE' ? 'Nur Bilddateien erlaubt.' : 'Image files only.'); return; }
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoBase64(ev.target.result);
    reader.readAsDataURL(file);
  };

  const renderStepPhoto = () => (
    <div>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png"
        style={{ display: 'none' }}
        onChange={handlePhotoUpload}
      />
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(29,158,117,0.12)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: 20,
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2ede8', marginBottom: '4px' }}>
          {t[lang].cv_photo_section_title}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(226,237,232,0.45)', marginBottom: '16px', lineHeight: '1.6' }}>
          {t[lang].cv_photo_section_desc}
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{
            width: 100, height: 130, flexShrink: 0,
            background: photoBase64 ? 'transparent' : 'rgba(255,255,255,0.04)',
            border: photoBase64 ? 'none' : '2px dashed rgba(255,255,255,0.12)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {photoBase64 ? (
              <img src={photoBase64} alt="CV photo" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(226,237,232,0.25)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 6px' }}>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <span style={{ fontSize: 11 }}>{t[lang].builder_photo_upload_btn}</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button className="btn btn-secondary" onClick={() => photoInputRef.current?.click()}>
                {t[lang].builder_photo_upload_btn}
              </button>
              {photoBase64 && (
                <button className="btn btn-danger btn-sm" onClick={() => { setPhotoBase64(''); setPhotoError(''); }}>
                  {t[lang].builder_photo_remove}
                </button>
              )}
            </div>
            {photoError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, color: '#f87171', fontSize: 12 }}>
                {photoError}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(226,237,232,0.3)', marginTop: '10px' }}>
          {t[lang].cv_photo_size_hint}
        </div>
      </div>
      <div style={{
        background: 'transparent',
        border: 'none',
        borderLeft: '2px solid rgba(29,158,117,0.3)',
        borderRadius: 0,
        padding: '8px 0 8px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ color: '#1D9E75', fontSize: 11, flexShrink: 0, marginTop: 1 }}>·</span>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1D9E75', display: 'block', marginBottom: 2 }}>{t[lang].cv_privacy_label}</span>
          <span style={{ fontSize: 11, color: 'rgba(226,237,232,0.4)', lineHeight: 1.6 }}>{t[lang].builder_photo_privacy}</span>
        </div>
      </div>
    </div>
  );

  const baseCvText = buildCVText(state);
  const displayCvText = adjustedCvText ?? baseCvText;

  // ── Step renders ──────────────────────────────────────────────

  const renderStep1 = () => (
    <div>
      <div className="two-col">
        <div className="form-group">
          <label className="label">{t[lang].builder_label_fullname} *</label>
          <input className="input" placeholder="Jane Smith" value={state.personal.name} onChange={e => setP('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">{t[lang].builder_label_target} *</label>
          <input className="input" placeholder={t[lang].builder_target_placeholder} value={state.personal.targetRole} onChange={e => setP('targetRole', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">{t[lang].builder_label_email}</label>
          <input className="input" type="email" placeholder="jane@example.com" value={state.personal.email} onChange={e => setP('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">{t[lang].builder_label_phone}</label>
          <input className="input" placeholder="+44 7000 000000" value={state.personal.phone} onChange={e => setP('phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">
            {t[lang].builder_label_street}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder="123 High Street" value={state.personal.street} onChange={e => setP('street', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">{t[lang].builder_label_city}</label>
          <input className="input" placeholder="London" value={state.personal.city} onChange={e => setP('city', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">
            {t[lang].builder_label_postal}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder="SW1A 1AA" value={state.personal.postalCode} onChange={e => setP('postalCode', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">
            {t[lang].builder_label_country}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder="United Kingdom" value={state.personal.country} onChange={e => setP('country', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">
            LinkedIn URL
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder={t[lang].builder_linkedin_placeholder} value={state.personal.linkedin} onChange={e => setP('linkedin', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">
            Portfolio / Website
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 12 }}>(optional)</span>
          </label>
          <input className="input" placeholder="janesmith.com or github.com/janesmith" value={state.personal.portfolio} onChange={e => setP('portfolio', e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <label className="label">{t[lang].builder_label_jd}</label>
        <textarea
          className="textarea"
          value={state.personal.jobDescription || ''}
          onChange={e => setP('jobDescription', e.target.value)}
          placeholder={t[lang].builder_jd_placeholder}
          rows={4}
          style={{ resize: 'vertical' }}
        />
        <div style={{ fontSize: '11px', color: 'rgba(226,237,232,0.35)', marginTop: '4px' }}>
          {t[lang].builder_jd_hint}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      {state.experience.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', marginTop: 16 }}>
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
              <label className="label">{t[lang].builder_label_jobtitle}</label>
              <input className="input" placeholder={t[lang].builder_exp_placeholder_title} value={exp.jobTitle} onChange={e => updExp(exp.id, 'jobTitle', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{t[lang].builder_label_company}</label>
              <input className="input" placeholder={t[lang].builder_exp_placeholder_company} value={exp.company} onChange={e => updExp(exp.id, 'company', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{t[lang].builder_label_from} <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(e.g. Jan 2022)</span></label>
              <input className="input" placeholder="Jan 2022" value={exp.startDate} onChange={e => updExp(exp.id, 'startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{t[lang].builder_label_to} <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(e.g. Dec 2023 or "Present")</span></label>
              <input className="input" placeholder={exp.isCurrent ? 'Present' : 'Dec 2023'} value={exp.isCurrent ? 'Present' : exp.endDate} onChange={e => updExp(exp.id, 'endDate', e.target.value)} disabled={exp.isCurrent} />
              <label style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={exp.isCurrent} onChange={e => updExp(exp.id, 'isCurrent', e.target.checked)} />
                {t[lang].builder_current_role}
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="label">{t[lang].builder_label_desc}</label>
            <textarea className="textarea" rows={3} placeholder={t[lang].builder_exp_placeholder_desc} value={exp.description} onChange={e => updExp(exp.id, 'description', e.target.value)} />
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
        {t[lang].builder_add_exp}
      </button>
      <ErrBox msg={apiError} />
    </div>
  );

  const renderStepProjects = () => (
    <div>
      {(state.projects || []).length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', marginTop: 16 }}>
          <p>{t[lang].builder_no_projects}</p>
        </div>
      )}

      {(state.projects || []).map((proj, idx) => (
        <div key={proj.id} className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{t[lang].builder_entry} {idx + 1}</span>
            <button className="btn btn-danger btn-sm" onClick={() => delProject(proj.id)}>{t[lang].builder_remove}</button>
          </div>
          <div className="form-group">
            <label className="label">{t[lang].builder_project_title_label}</label>
            <input
              className="input"
              placeholder={t[lang].builder_project_title_placeholder}
              value={proj.title}
              onChange={e => updProject(proj.id, 'title', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">{t[lang].builder_project_desc_label}</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder={t[lang].builder_project_desc_placeholder}
              value={proj.description}
              onChange={e => updProject(proj.id, 'description', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">{t[lang].builder_project_year_label}</label>
            <input
              className="input"
              placeholder={t[lang].builder_project_year_placeholder}
              value={proj.year}
              onChange={e => updProject(proj.id, 'year', e.target.value)}
              style={{ maxWidth: 160 }}
            />
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={addProject}>
        {t[lang].builder_add_project}
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div>
      {state.education.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', marginTop: 16 }}>
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
            <label className="label">{t[lang].builder_label_school} *</label>
            <input className="input" placeholder={t[lang].builder_edu_placeholder_school} value={edu.institution} onChange={e => updEdu(edu.id, 'institution', e.target.value)} />
          </div>
          <div className="two-col">
            <div className="form-group">
              <label className="label">{t[lang].builder_label_degree}</label>
              <input className="input" placeholder={t[lang].builder_edu_placeholder_degree} value={edu.degree} onChange={e => updEdu(edu.id, 'degree', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{t[lang].builder_label_field}</label>
              <input className="input" placeholder={t[lang].builder_edu_placeholder_field} value={edu.field} onChange={e => updEdu(edu.id, 'field', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{t[lang].builder_label_from}</label>
              <input className="input" placeholder="e.g. 2019" value={edu.startYear} onChange={e => updEdu(edu.id, 'startYear', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{t[lang].builder_label_to}</label>
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
          placeholder={t[lang].builder_skill_placeholder}
          value={skillInput}
          onChange={e => setSkillInput(e.target.value)}
          onKeyDown={handleSkillKeyDown}
          style={{ flex: 1 }}
        />
        <button className="btn btn-secondary" onClick={() => { addSkill(skillInput); setSkillInput(''); }} disabled={!skillInput.trim()}>
          {t[lang].builder_add_skill}
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
          : t[lang].builder_ai_suggest}
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
            : t[lang].builder_gen_summary}
        </button>
      </div>

      <div className="form-group">
        <label className="label">{t[lang].builder_summary_label}</label>
        <textarea
          className="textarea"
          rows={6}
          placeholder={t[lang].builder_summary_placeholder}
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
              photo={photoBase64}
            />
            <CopyButton text={displayCvText} />
          </div>
        </div>

        <DocumentPreview text={displayCvText} template={selectedTemplate} photo={photoBase64} />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => setStep(7)}>{t[lang].builder_back_summary}</button>
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
          <span>◈</span><span>{t[lang].cv_builder_badge}</span>
        </div>
        <h1 className="tool-hero-h1">
          {t[lang].builder_headline_pre} <span className="tool-kw">{t[lang].builder_headline_highlight}</span> {t[lang].builder_headline_post}
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

      {/* ── Section C: Progress bar (steps 1–7 only) ── */}
      {state.step <= 7 && <StepProgressBar step={state.step} />}

      {/* ── Sections D + G + E: Form card, tip box, nav ── */}
      {state.step <= 7 && (
        <div className="tool-section" style={{ padding: '0 40px 32px' }}>

          {/* Form card */}
          <div className="cvb-form-card scroll-reveal">
            <StepHeader step={state.step} />
            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStepPhoto()}
            {state.step === 3 && renderStep2()}
            {state.step === 4 && renderStepProjects()}
            {state.step === 5 && renderStep3()}
            {state.step === 6 && renderStep4()}
            {state.step === 7 && renderStep5()}
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
              {t[lang].builder_step_label} {state.step} {t[lang].builder_step_of} 7
            </span>
            <button
              className="cvb-btn-next"
              onClick={() => setStep(state.step < 7 ? state.step + 1 : 8)}
            >
              {state.step === 7 ? t[lang].builder_preview_cv : t[lang].builder_next}
            </button>
          </div>

        </div>
      )}

      {/* ── Section F: Preview (step 8) ── */}
      {state.step === 8 && (
        <div className="tool-section" style={{ padding: '0 40px 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }} className="scroll-reveal">
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
