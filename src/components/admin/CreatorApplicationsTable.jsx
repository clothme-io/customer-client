import { useState } from 'react';

const STATUS_LABELS = {
  applied: 'Applied',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  waiting_list: 'Waiting List',
};

const STATUS_COLORS = {
  applied: 'status-applied',
  reviewed: 'status-reviewed',
  shortlisted: 'status-shortlisted',
  accepted: 'status-accepted',
  rejected: 'status-rejected',
  waiting_list: 'status-waiting',
};

const CREATOR_TYPE_LABELS = {
  mom_parent: 'Mom / Parent',
  student: 'Student',
  fashion_creator: 'Fashion Creator',
  lifestyle_creator: 'Lifestyle Creator',
  ugc_creator: 'UGC Creator',
  gen_z_creator: 'Gen Z Creator',
  other: 'Other',
};

function ApplicationDetail({ application, onStatusUpdate }) {
  const [status, setStatus] = useState(application.status);
  const [notes, setNotes] = useState(application.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/creator-applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        setSaved(true);
        onStatusUpdate(application.id, status, notes);
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-detail-panel">
      <div className="admin-detail-grid">
        <div className="admin-detail-col">
          <h3 className="admin-detail-name">{application.fullName}</h3>
          <p className="admin-detail-meta">{application.email}</p>
          {application.phoneNumber && <p className="admin-detail-meta">{application.phoneNumber}</p>}
          <p className="admin-detail-meta">{application.city}, {application.country}</p>

          <div className="admin-detail-section">
            <p><strong>Creator Type:</strong> {CREATOR_TYPE_LABELS[application.creatorType] || application.creatorType}</p>
            <p><strong>Followers:</strong> {application.followerCountRange}</p>
            <p><strong>UGC Experience:</strong> {application.hasUgcExperience ? 'Yes' : 'No'}</p>
            <p><strong>Creator Store Interest:</strong> {application.interestedCreatorStore}</p>
          </div>

          <div className="admin-detail-section">
            <p><strong>TikTok:</strong> <a href={application.tiktokUrl} target="_blank" rel="noreferrer">{application.tiktokUrl}</a></p>
            <p><strong>Instagram:</strong> <a href={application.instagramUrl} target="_blank" rel="noreferrer">{application.instagramUrl}</a></p>
            {application.youtubeUrl && <p><strong>YouTube:</strong> <a href={application.youtubeUrl} target="_blank" rel="noreferrer">{application.youtubeUrl}</a></p>}
            {application.otherLinks && <p><strong>Other:</strong> {application.otherLinks}</p>}
            <p><strong>Portfolio:</strong> <a href={application.portfolioLink} target="_blank" rel="noreferrer">{application.portfolioLink}</a></p>
          </div>
        </div>

        <div className="admin-detail-col">
          <div className="admin-detail-section">
            <p className="admin-detail-section-label">Why ClothME?</p>
            <p className="admin-detail-why">{application.whyClothme}</p>
          </div>

          <div className="admin-detail-section">
            <label htmlFor={`status-${application.id}`} className="admin-detail-section-label">Status</label>
            <select
              id={`status-${application.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="admin-select"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="admin-detail-section">
            <label htmlFor={`notes-${application.id}`} className="admin-detail-section-label">Internal Notes</label>
            <textarea
              id={`notes-${application.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="admin-notes"
              rows={4}
              placeholder="Add notes about this applicant..."
            />
          </div>

          <button onClick={handleSave} disabled={saving} className="admin-save-btn">
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreatorApplicationsTable({ applications: initialApplications }) {
  const [applications, setApplications] = useState(initialApplications);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  function handleStatusUpdate(id, status, notes) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, notes } : a))
    );
  }

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [a.fullName, a.email, a.city].some((v) => v?.toLowerCase().includes(q));
    const matchCountry = !filterCountry || a.country === filterCountry;
    const matchType = !filterType || a.creatorType === filterType;
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchStore = !filterStore || a.interestedCreatorStore === filterStore;
    return matchSearch && matchCountry && matchType && matchStatus && matchStore;
  });

  return (
    <div className="admin-creators-wrap">
      <div className="admin-creators-header">
        <h1 className="admin-creators-title">Creator Applications</h1>
        <span className="admin-creators-count">{filtered.length} of {applications.length}</span>
      </div>

      <div className="admin-filters">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, city…"
          className="admin-search"
        />
        <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="admin-filter-select">
          <option value="">All Countries</option>
          <option value="USA">USA</option>
          <option value="Canada">Canada</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="admin-filter-select">
          <option value="">All Types</option>
          {Object.entries(CREATOR_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="admin-filter-select">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} className="admin-filter-select">
          <option value="">Store Interest</option>
          <option value="yes">Yes</option>
          <option value="maybe">Maybe</option>
          <option value="no">No</option>
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>City</th>
              <th>Country</th>
              <th>Type</th>
              <th>Followers</th>
              <th>UGC</th>
              <th>Store</th>
              <th>Status</th>
              <th>Applied</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="admin-table-empty">No applications match your filters.</td>
              </tr>
            )}
            {filtered.map((a) => (
              <>
                <tr
                  key={a.id}
                  className={`admin-table-row ${expandedId === a.id ? 'admin-table-row--expanded' : ''}`}
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                >
                  <td className="admin-td-name">{a.fullName}</td>
                  <td>{a.email}</td>
                  <td>{a.city}</td>
                  <td>{a.country}</td>
                  <td>{CREATOR_TYPE_LABELS[a.creatorType] || a.creatorType}</td>
                  <td>{a.followerCountRange}</td>
                  <td>{a.hasUgcExperience ? 'Yes' : 'No'}</td>
                  <td>{a.interestedCreatorStore}</td>
                  <td>
                    <span className={`admin-status-badge ${STATUS_COLORS[a.status] || ''}`}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </td>
                  <td className="admin-td-date">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button className="admin-expand-btn" aria-label="Toggle detail">
                      {expandedId === a.id ? '▲' : '▼'}
                    </button>
                  </td>
                </tr>
                {expandedId === a.id && (
                  <tr key={`${a.id}-detail`} className="admin-detail-row">
                    <td colSpan={11}>
                      <ApplicationDetail application={a} onStatusUpdate={handleStatusUpdate} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
