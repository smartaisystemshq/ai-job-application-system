import React, { useState, useEffect } from 'react';

function HealthScore({ applications }) {
  const advanced = applications.filter(a => ['Interview', 'Offer'].includes(a.status)).length;
  const appScore = Math.min(applications.length * 7, 35);
  const advScore = Math.min(advanced * 20, 40);
  const cvoUsed = !!localStorage.getItem('jas.cvo.result');
  const clUsed  = !!localStorage.getItem('jas.cl.result');
  const toolScore = (cvoUsed ? 13 : 0) + (clUsed ? 12 : 0);
  const score = Math.min(appScore + advScore + toolScore, 100);

  const getMessage = () => {
    if (score === 0) return 'Add your first application and start using the AI tools to begin your score.';
    if (score < 30) return 'Good start — keep adding applications and use the CV Optimizer for a quick boost.';
    if (score < 60) return 'Solid progress. Aim for interviews by tailoring each application with the AI tools.';
    if (score < 85) return 'Strong pipeline! Keep your applications moving — interview prep will help seal the deal.';
    return 'Outstanding — your job search is well-organised and highly active. Keep the momentum going!';
  };

  const getLabel = () => {
    if (score === 0) return 'Just Starting';
    if (score < 30) return 'Getting Started';
    if (score < 60) return 'Building Momentum';
    if (score < 85) return 'Good Candidate';
    return 'Outstanding';
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
        <div style={{ fontSize: 16, fontWeight: 700, color: '#e2ede8', marginBottom: 6 }}>Application Health Score</div>
        <div style={{ fontSize: 13, color: '#1D9E75', marginBottom: 12 }}>{getLabel()}</div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', background: '#1D9E75', borderRadius: 4, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ fontSize: 12, color: 'rgba(226,237,232,0.4)', marginBottom: 14, lineHeight: 1.6 }}>{getMessage()}</div>
        <div className="health-score-links" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
          <span style={{ color: applications.length >= 5 ? '#1D9E75' : 'rgba(226,237,232,0.35)' }}>
            {applications.length >= 5 ? '✓' : '○'} 5+ applications tracked
          </span>
          <span style={{ color: cvoUsed ? '#1D9E75' : 'rgba(226,237,232,0.35)' }}>
            {cvoUsed ? '✓' : '○'} CV Optimizer used
          </span>
          <span style={{ color: clUsed ? '#1D9E75' : 'rgba(226,237,232,0.35)' }}>
            {clUsed ? '✓' : '○'} Cover Letter generated
          </span>
          <span style={{ color: advanced > 0 ? '#1D9E75' : 'rgba(226,237,232,0.35)' }}>
            {advanced > 0 ? '✓' : '○'} Interview stage reached
          </span>
        </div>
      </div>
    </div>
  );
}

const STATUSES = ['Draft', 'Applied', 'Interview', 'Offer'];

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
        <div className="tool-hero-badge">◎ DASHBOARD</div>
        <h1 className="tool-hero-h1">
          Track every <span className="tool-kw">application</span> in one place
        </h1>
        <p className="tool-hero-sub" style={{ maxWidth: 500, marginBottom: 0 }}>
          Add every job you apply to and move it through the stages — Draft, Applied, Interview, Offer. Never lose track of an opportunity.
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
              <div style={{ fontSize: 10, color: 'rgba(226,237,232,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>{s}</div>
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
          ✦ Add Application
        </button>
      </div>

      {/* Section F: Applications list */}
      <div className="dash-section" style={{ paddingBottom: 80 }}>
        {applications.length === 0 ? (
          <div className="dash-empty">
            <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 16 }}>📋</div>
            <p style={{ fontSize: 16, color: 'rgba(226,237,232,0.5)', marginBottom: 8 }}>No applications yet</p>
            <p style={{ fontSize: 13, color: 'rgba(226,237,232,0.35)', marginBottom: 24, lineHeight: 1.6 }}>
              Start tracking your first application — every job you apply to goes here.
            </p>
            <div style={{ maxWidth: 320, margin: '0 auto' }}>
              <button className="tool-generate-btn" onClick={openAdd}>
                ✦ Add Your First Application
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'rgba(226,237,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort</span>
              {[['company', 'Company'], ['role', 'Role'], ['status', 'Status'], ['dateApplied', 'Date']].map(([field, label]) => (
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
                  <span className={BADGE_CLS[app.status]}>{app.status}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(app)} title="Edit">✎ Edit</button>
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
              <h2>{editingId ? 'Edit Application' : 'Add Application'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={closeModal} style={{ fontSize: 18, padding: '4px 8px' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="two-col">
                  <div className="form-group">
                    <label className="label">Company *</label>
                    <input
                      className="input"
                      placeholder="e.g. Google"
                      value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Role *</label>
                    <input
                      className="input"
                      placeholder="e.g. Senior Engineer"
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="two-col">
                  <div className="form-group">
                    <label className="label">Status</label>
                    <select
                      className="select"
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Date Applied</label>
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
                  <label className="label">Notes</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="Recruiter name, next steps, salary range..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Add Application'}
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
              <h2>Delete Application</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)} style={{ fontSize: 18, padding: '4px 8px' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Are you sure you want to delete the application for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {applications.find(a => a.id === deleteId)?.company}
                </strong>? This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
