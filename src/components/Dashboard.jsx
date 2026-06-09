import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

function HealthScore({ applications }) {
  const { lang } = useLang();
  const advanced = applications.filter(a => ['Interview', 'Offer'].includes(a.status)).length;
  const appScore = Math.min(applications.length * 7, 35);
  const advScore = Math.min(advanced * 20, 40);
  const cvoUsed = !!localStorage.getItem('jas.cvo.result');
  const clUsed  = !!localStorage.getItem('jas.cl.result');
  const toolScore = (cvoUsed ? 13 : 0) + (clUsed ? 12 : 0);
  const score = Math.min(appScore + advScore + toolScore, 100);

  const getMessage = () => {
    if (score === 0) return t[lang].dash_health_empty_msg;
    if (score < 30) return t[lang].dash_health_msg_start;
    if (score < 60) return t[lang].dash_health_msg_building;
    if (score < 85) return t[lang].dash_health_msg_strong;
    return t[lang].dash_health_msg_outstanding;
  };

  const getLabel = () => {
    if (score === 0) return t[lang].dash_health_just_starting;
    if (score < 30) return t[lang].dash_health_getting_started;
    if (score < 60) return t[lang].dash_health_building;
    if (score < 85) return t[lang].dash_health_strong;
    return t[lang].dash_health_outstanding;
  };

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="dash-health-card">
      <div style={{ position: 'relative', flexShrink: 0, width: 90, height: 90 }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="45" cy="45" r={radius} fill="none"
            stroke="#1D9E75" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 45 45)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1D9E75', textShadow: '0 0 20px rgba(29,158,117,0.5)', lineHeight: 1 }}>{score}</span>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#e2ede8', marginBottom: 6 }}>{t[lang].dash_health_title}</div>
        <div style={{ fontSize: 13, color: '#1D9E75', marginBottom: 12 }}>{getLabel()}</div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', background: '#1D9E75', borderRadius: 4, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ fontSize: 12, color: 'rgba(226,237,232,0.4)', marginBottom: 14, lineHeight: 1.6 }}>{getMessage()}</div>
        <div className="health-score-links" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
          <span style={{ color: applications.length >= 5 ? '#1D9E75' : 'rgba(226,237,232,0.35)' }}>
            {applications.length >= 5 ? '✓' : '○'} {t[lang].dash_health_check1}
          </span>
          <span style={{ color: cvoUsed ? '#1D9E75' : 'rgba(226,237,232,0.35)' }}>
            {cvoUsed ? '✓' : '○'} {t[lang].dash_health_check2}
          </span>
          <span style={{ color: clUsed ? '#1D9E75' : 'rgba(226,237,232,0.35)' }}>
            {clUsed ? '✓' : '○'} {t[lang].dash_health_check3}
          </span>
          <span style={{ color: advanced > 0 ? '#1D9E75' : 'rgba(226,237,232,0.35)' }}>
            {advanced > 0 ? '✓' : '○'} {t[lang].dash_health_check4}
          </span>
        </div>
      </div>
    </div>
  );
}

const STATUSES = ['Draft', 'Applied', 'Interview', 'Offer'];

const STATUS_LABEL_KEY = {
  Draft: 'dash_status_draft',
  Applied: 'dash_status_applied',
  Interview: 'dash_status_interview',
  Offer: 'dash_status_offer',
};

const STATUS_DOT = {
  Draft: 'rgba(226,237,232,0.3)',
  Applied: '#1D9E75',
  Interview: '#f59e0b',
  Offer: '#10b981',
};

const BADGE_CLS = {
  Draft:     'dash-badge dash-badge-draft',
  Applied:   'dash-badge dash-badge-applied',
  Interview: 'dash-badge dash-badge-interview',
  Offer:     'dash-badge dash-badge-offer',
};

const BLANK_FORM = {
  company: '',
  role: '',
  status: 'Draft',
  dateApplied: new Date().toISOString().split('T')[0],
  notes: '',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const { lang } = useLang();
  const [applications, setApplications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jobApplications') || '[]');
    } catch {
      return [];
    }
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [sortField, setSortField] = useState('dateApplied');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    localStorage.setItem('jobApplications', JSON.stringify(applications));
  }, [applications]);

  const openAdd = () => {
    setForm(BLANK_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (app) => {
    setForm({ company: app.company, role: app.role, status: app.status, dateApplied: app.dateApplied, notes: app.notes || '' });
    setEditingId(app.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(BLANK_FORM);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    if (editingId) {
      setApplications(prev => prev.map(a => a.id === editingId ? { ...form, id: editingId } : a));
    } else {
      setApplications(prev => [...prev, { ...form, id: Date.now() }]);
    }
    closeModal();
  };

  const handleDelete = () => {
    setApplications(prev => prev.filter(a => a.id !== deleteId));
    setDeleteId(null);
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...applications].sort((a, b) => {
    let va = a[sortField] || '';
    let vb = b[sortField] || '';
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {});

  return (
    <div style={{ flex: 1, overflowX: 'hidden' }}>

      {/* Section A: Hero */}
      <div className="dash-hero">
        <div className="tool-hero-badge">◎ {t[lang].dash_badge}</div>
        <h1 className="tool-hero-h1">
          {t[lang].dash_headline_pre} <span className="tool-kw">{t[lang].dash_headline_highlight}</span> {t[lang].dash_headline_post}
        </h1>
        <p className="tool-hero-sub" style={{ maxWidth: 500, marginBottom: 0 }}>
          {t[lang].dash_sub}
        </p>
      </div>

      {/* Section B: Divider */}
      <div className="tool-divider dash-divider" />

      {/* Section C: Stats */}
      <div className="dash-section" style={{ paddingBottom: 40 }}>
        <div className="dash-stats-row">
          {STATUSES.map(s => (
            <div key={s} className="dash-stat-card">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[s], margin: '0 auto 14px' }} />
              <div style={{
                fontSize: 36,
                fontWeight: 700,
                lineHeight: 1,
                marginBottom: 6,
                color: s === 'Applied' ? '#1D9E75' : '#e2ede8',
                textShadow: s === 'Applied' ? '0 0 20px rgba(29,158,117,0.4)' : 'none',
              }}>{counts[s]}</div>
              <div style={{ fontSize: 10, color: 'rgba(226,237,232,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>{t[lang][STATUS_LABEL_KEY[s]]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section D: Health Score */}
      <div className="dash-section" style={{ paddingBottom: 40 }}>
        <HealthScore applications={applications} />
      </div>

      {/* Section E: Add Application */}
      <div className="dash-section" style={{ paddingBottom: 32, textAlign: 'right' }}>
        <button
          className="tool-generate-btn"
          style={{ width: 'auto', padding: '12px 24px', fontSize: 14, display: 'inline-flex' }}
          onClick={openAdd}
        >
          ✦ {t[lang].dash_add_btn}
        </button>
      </div>

      {/* Section F: Applications list */}
      <div className="dash-section" style={{ paddingBottom: 80 }}>
        {applications.length === 0 ? (
          <div className="dash-empty">
            <p style={{ fontSize: 16, color: 'rgba(226,237,232,0.5)', marginBottom: 8 }}>{t[lang].dash_empty_title}</p>
            <p style={{ fontSize: 13, color: 'rgba(226,237,232,0.35)', marginBottom: 24, lineHeight: 1.6 }}>
              {t[lang].dash_empty_sub}
            </p>
            <div style={{ maxWidth: 320, margin: '0 auto' }}>
              <button className="tool-generate-btn" onClick={openAdd}>
                ✦ {t[lang].dash_empty_btn}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'rgba(226,237,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t[lang].dash_sort}</span>
              {[['company', t[lang].dash_sort_company], ['role', t[lang].dash_sort_role], ['status', t[lang].dash_sort_status], ['dateApplied', t[lang].dash_sort_date]].map(([field, label]) => (
                <button key={field} onClick={() => toggleSort(field)} style={{
                  background: sortField === field ? 'rgba(29,158,117,0.1)' : 'transparent',
                  border: `1px solid ${sortField === field ? 'rgba(29,158,117,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 100,
                  color: sortField === field ? '#1D9E75' : 'rgba(226,237,232,0.4)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {label}
                  {sortField === field && <span style={{ fontSize: 9 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </button>
              ))}
            </div>

            {/* Application cards */}
            {sorted.map(app => (
              <div key={app.id} className="dash-app-card">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#e2ede8', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.company}{app.role ? ` — ${app.role}` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(226,237,232,0.4)' }}>
                    {formatDate(app.dateApplied)}{app.notes ? ` · ${app.notes.length > 48 ? app.notes.slice(0, 48) + '…' : app.notes}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span className={BADGE_CLS[app.status]}>{t[lang][STATUS_LABEL_KEY[app.status]]}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(app)} title="Edit">✎ {t[lang].dash_edit}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(app.id)} title="Delete">✕</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? t[lang].dash_edit + ' ' + t[lang].dash_add_application : t[lang].dash_add_application}</h2>
              <button className="btn btn-ghost btn-sm" onClick={closeModal} style={{ fontSize: 18, padding: '4px 8px' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="two-col">
                  <div className="form-group">
                    <label className="label">{t[lang].dash_company_label}</label>
                    <input
                      className="input"
                      placeholder={t[lang].dash_company_placeholder}
                      value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">{t[lang].dash_role_label}</label>
                    <input
                      className="input"
                      placeholder={t[lang].dash_role_placeholder}
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="two-col">
                  <div className="form-group">
                    <label className="label">{t[lang].dash_status_label}</label>
                    <select
                      className="select"
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{t[lang][STATUS_LABEL_KEY[s]]}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">{t[lang].dash_date_label}</label>
                    <input
                      type="date"
                      className="input"
                      value={form.dateApplied}
                      onChange={e => setForm(f => ({ ...f, dateApplied: e.target.value }))}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">{t[lang].dash_notes_label}</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder={t[lang].dash_notes_placeholder}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>{t[lang].dash_cancel}</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? t[lang].dash_save_changes : t[lang].dash_add_application}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>{t[lang].dash_delete_application}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)} style={{ fontSize: 18, padding: '4px 8px' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {t[lang].dash_delete_confirm_pre}{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {applications.find(a => a.id === deleteId)?.company}
                </strong>{t[lang].dash_delete_confirm_post}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>{t[lang].dash_cancel}</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={handleDelete}>
                {t[lang].dash_delete_btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
