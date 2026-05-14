import React, { useState, useEffect } from 'react';

const STATUSES = ['Draft', 'Applied', 'Interview', 'Offer'];

const STATUS_BADGE = {
  Draft: 'badge badge-draft',
  Applied: 'badge badge-applied',
  Interview: 'badge badge-interview',
  Offer: 'badge badge-offer',
};

const STAT_COLORS = {
  Draft: 'var(--status-draft-color)',
  Applied: 'var(--status-applied-color)',
  Interview: 'var(--status-interview-color)',
  Offer: 'var(--status-offer-color)',
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

  const SortIcon = ({ field }) => (
    <span style={{ color: sortField === field ? 'var(--accent)' : 'transparent', marginLeft: 4, fontSize: 10 }}>
      {sortDir === 'asc' && sortField === field ? '▲' : '▼'}
    </span>
  );

  return (
    <div className="page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Job Applications</h1>
          <p>Track and manage all your job applications in one place</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <span style={{ fontSize: 16 }}>+</span> Add Application
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {STATUSES.map(s => (
          <div key={s} className="stat-card">
            <div className="stat-value" style={{ color: STAT_COLORS[s] }}>{counts[s]}</div>
            <div className="stat-label">{s}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📋</div>
          <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>No applications yet</p>
          <p style={{ marginBottom: 20 }}>Start tracking your job applications by adding your first entry.</p>
          <button className="btn btn-primary" onClick={openAdd}>Add Your First Application</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('company')}>
                  Company <SortIcon field="company" />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('role')}>
                  Role <SortIcon field="role" />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('dateApplied')}>
                  Date Applied <SortIcon field="dateApplied" />
                </th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(app => (
                <tr key={app.id}>
                  <td className="td-company">{app.company}</td>
                  <td className="td-role">{app.role}</td>
                  <td><span className={STATUS_BADGE[app.status]}>{app.status}</span></td>
                  <td className="td-date">{formatDate(app.dateApplied)}</td>
                  <td className="td-notes"><span title={app.notes}>{app.notes || '—'}</span></td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(app)} title="Edit">
                        ✎ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteId(app.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
