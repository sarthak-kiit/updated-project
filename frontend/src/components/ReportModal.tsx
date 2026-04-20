import React, { useState } from 'react';
import { submitReport } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  reportedUserId: number;
  reportedUserName: string;
  onClose: () => void;
}

const CATEGORIES = [
  'Inappropriate behavior',
  'Harassment or bullying',
  'Spam or misleading content',
  'Fake profile or impersonation',
  'Hate speech or discrimination',
  'Other',
];

export default function ReportModal({ reportedUserId, reportedUserName, onClose }: Props) {
  const { user } = useAuth();
  const [category, setCategory]     = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async () => {
    if (!category) { setError('Please select a violation category'); return; }
    setLoading(true); setError('');
    try {
      await submitReport({ reporterUserId: user!.userId, reportedUserId, category, description: description.trim() || undefined });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="sb-overlay" onClick={onClose}>
      <div className="sb-modal" onClick={e => e.stopPropagation()}>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Report Submitted</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Thank you for keeping SkillBuilder safe. We will review this report shortly.
            </p>
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="sb-modal-title">🚩 Report User</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Reporting: {reportedUserName}</p>
              </div>
              <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
            </div>

            {error && <div className="sb-alert sb-alert-error">{error}</div>}

            <div className="sb-form-group">
              <label className="sb-label">Violation Category *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => { setCategory(cat); setError(''); }}
                    style={{
                      padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      textAlign: 'left', fontSize: '0.875rem', fontFamily: "'Inter', sans-serif",
                      background: category === cat ? 'var(--primary-light)' : 'var(--bg-subtle)',
                      border: category === cat ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                      color: category === cat ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: category === cat ? 600 : 400,
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="sb-form-group">
              <label className="sb-label">Additional Details (optional)</label>
              <textarea className="sb-input" rows={3}
                placeholder="Describe the issue in more detail…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ resize: 'vertical' }} />
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your report is confidential. We review all reports and take appropriate action.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-danger" onClick={handleSubmit}
                disabled={loading || !category}
                style={{ flex: 2, opacity: loading || !category ? 0.6 : 1, cursor: loading || !category ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
