// pages/SessionsPage.tsx
// Sessions management — light clean design with proper status UI
import React, { useEffect, useState } from 'react';
import { getSessionsForUser, cancelSession, respondToSession, rejectSession,
         submitReview, rescheduleSession, completeSession } from '../services/api';
import { SessionDTO } from '../types';
import { useAuth } from '../context/AuthContext';

const STATUS_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

const REJECTION_REASONS = [
  'Schedule conflict',
  'Outside my expertise area',
  'Insufficient session details provided',
  'Already at full capacity',
  'Other',
];

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ session, onClose, onConfirm }: {
  session: SessionDTO; onClose: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="sb-overlay" onClick={onClose}>

      <div className="sb-modal" onClick={e => e.stopPropagation()}>

        <h3 className="sb-modal-title">Reject Session Request</h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          with {session.menteeName} — {new Date(session.scheduledAt).toLocaleString()}
        </p>

        <label className="sb-label">Select a reason *</label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
          {REJECTION_REASONS.map(r => (
            <button key={r} type="button" onClick={() => setReason(r)} style={{
              padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              textAlign: 'left', fontSize: '0.875rem', fontFamily: "'Inter', sans-serif",
              background: reason === r ? 'var(--primary-light)' : 'var(--bg-subtle)',
              border: reason === r ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
              color: reason === r ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: reason === r ? 600 : 400,
            }}>
              {r}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-danger" disabled={!reason} onClick={() => reason && onConfirm(reason)}
            style={{ flex: 2, opacity: reason ? 1 : 0.5, cursor: reason ? 'pointer' : 'not-allowed' }}>
            Confirm Rejection
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ session, onClose, onSubmit }: {
  session: SessionDTO; onClose: () => void; onSubmit: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');
  const [anon, setAnon]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating'); return; }
    setLoading(true);
    try {
      await submitReview({ menteeId: user!.userId, sessionId: session.id, rating, comment: comment.trim() || undefined, anonymous: anon });
      onSubmit();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally { setLoading(false); }
  };

  return (
    <div className="sb-overlay" onClick={onClose}>
      <div className="sb-modal" onClick={e => e.stopPropagation()}>
        <h3 className="sb-modal-title">Rate your session</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          with {session.mentorName}
        </p>

        {error && <div className="sb-alert sb-alert-error">{error}</div>}

        <div className="sb-form-group">
          <label className="sb-label">Overall Rating *</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[1,2,3,4,5].map(star => (
              <span key={star} onClick={() => setRating(star)}
                className={`rating-star${star <= rating ? ' active' : ''}`}>★</span>
            ))}
          </div>
        </div>

        <div className="sb-form-group">
          <label className="sb-label">Comments (optional)</label>
          <textarea className="sb-input" rows={3} placeholder="Share your experience…"
            value={comment} onChange={e => setComment(e.target.value)}
            style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input type="checkbox" id="anon" checked={anon} onChange={e => setAnon(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <label htmlFor="anon" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Submit anonymously
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Skip for now</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading || rating === 0}
            style={{ flex: 2, opacity: loading || rating === 0 ? 0.6 : 1 }}>
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reschedule Modal ──────────────────────────────────────────────────────────
function RescheduleModal({ session, onClose, onSuccess }: {
  session: SessionDTO; onClose: () => void; onSuccess: () => void;
}) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate  = tomorrow.toISOString().slice(0, 16);

  const [newDate,     setNewDate]     = useState('');
  const [newDuration, setNewDuration] = useState(session.durationMinutes);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleConfirm = async () => {
    if (!newDate) { setError('Please select a new date and time'); return; }
    const hrs = (new Date(newDate).getTime() - Date.now()) / 3_600_000;
    if (hrs < 24) { setError('New time must be at least 24 hours from now'); return; }
    setLoading(true); setError('');
    try {
      await rescheduleSession(session.id, { mentorId: session.mentorId, scheduledAt: new Date(newDate).toISOString(), durationMinutes: newDuration });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reschedule failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="sb-overlay" onClick={onClose}>
      <div className="sb-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 className="sb-modal-title">Reschedule Session</h3>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Current: {new Date(session.scheduledAt).toLocaleString()}
        </p>

        {error && <div className="sb-alert sb-alert-error">{error}</div>}

        <div className="sb-form-group">
          <label className="sb-label">New date &amp; time *</label>
          <input className="sb-input" type="datetime-local" min={minDate}
            value={newDate} onChange={e => { setNewDate(e.target.value); setError(''); }} />
        </div>

        <div className="sb-form-group">
          <label className="sb-label">Duration (minutes)</label>
          <select className="sb-input" value={newDuration}
            onChange={e => setNewDuration(Number(e.target.value))}>
            {[30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
          </select>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Both parties will be notified. The original booking is only cancelled once the new time is confirmed.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={loading || !newDate}
            style={{ flex: 2, opacity: loading || !newDate ? 0.6 : 1 }}>
            {loading ? 'Confirming…' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────────
function SessionCard({ session, userRole, onAction }: {
  session: SessionDTO;
  userRole: string;
  onAction: (type: string, session: SessionDTO) => void;
}) {
  const isPast     = new Date(session.scheduledAt) < new Date();
  const otherName  = userRole === 'MENTEE' ? session.mentorName : session.menteeName;
  const initial    = otherName.charAt(0).toUpperCase();

  return (
    <div className="sb-card" style={{ padding: '1.1rem 1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
        <div className="sb-avatar">{initial}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {userRole === 'MENTEE' ? `with ${otherName}` : `with ${otherName}`}
            </span>
            <span className={`sb-status status-${session.status.toLowerCase()}`}>{session.status}</span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
            📅 {new Date(session.scheduledAt).toLocaleString()} · {session.durationMinutes} min
          </div>

          {session.agenda && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>📋 {session.agenda}</div>
          )}

          {session.rejectionReason && (
            <div style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
              Reason: {session.rejectionReason}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>

            {/* MENTOR: accept/reject pending */}
            {userRole === 'MENTOR' && session.status === 'PENDING' && (
              <>
                <button className="btn-primary btn-sm" onClick={() => onAction('accept', session)}>Accept</button>
                <button className="btn-danger btn-sm" onClick={() => onAction('reject', session)}>Reject</button>
              </>
            )}

            {/* MENTOR: mark complete on confirmed past sessions */}
            {userRole === 'MENTOR' && session.status === 'CONFIRMED' && isPast && (
              <button className="btn-primary btn-sm" onClick={() => onAction('complete', session)}>
                Mark Complete
              </button>
            )}

            {/* MENTEE: reschedule confirmed upcoming */}
            {userRole === 'MENTEE' && session.status === 'CONFIRMED' && !isPast && (
              <button className="btn-outline btn-sm" onClick={() => onAction('reschedule', session)}>
                Reschedule
              </button>
            )}

            {/* Cancel — both roles, active sessions */}
            {['PENDING', 'CONFIRMED'].includes(session.status) && !isPast && (
              <button className="btn-ghost btn-sm" onClick={() => onAction('cancel', session)}
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'var(--danger-bg)' }}>
                Cancel
              </button>
            )}

            {/* MENTEE: review completed session */}
            {userRole === 'MENTEE' && session.status === 'COMPLETED' && (
              <button className="btn-outline btn-sm" onClick={() => onAction('review', session)}>
                Leave Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main SessionsPage ─────────────────────────────────────────────────────────
export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions,     setSessions]     = useState<SessionDTO[]>([]);
  const [activeTab,    setActiveTab]    = useState('ALL');
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState('');

  // Modal state
  const [rejectModal,     setRejectModal]     = useState<SessionDTO | null>(null);
  const [reviewModal,     setReviewModal]     = useState<SessionDTO | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<SessionDTO | null>(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    getSessionsForUser(user.userId)
      .then(data => setSessions(data as SessionDTO[]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAction = async (type: string, session: SessionDTO) => {
    try {
      if (type === 'accept')    { await respondToSession(session.id, user!.userId, true); showToast('Session accepted!'); load(); }
      if (type === 'reject')    { setRejectModal(session); }
      if (type === 'cancel')    { await cancelSession(session.id, user!.userId); showToast('Session cancelled.'); load(); }
      if (type === 'complete')  { await completeSession(session.id, user!.userId); showToast('Marked as completed!'); load(); }
      if (type === 'review')    { setReviewModal(session); }
      if (type === 'reschedule'){ setRescheduleModal(session); }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Action failed. Please try again.');
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectModal) return;
    try {
      await rejectSession(rejectModal.id, reason);
      showToast('Session rejected.');
      setRejectModal(null);
      load();
    } catch { showToast('Failed to reject session.'); }
  };

  const filtered = activeTab === 'ALL'
    ? sessions
    : sessions.filter(s => s.status === activeTab);

  const tabCount = (tab: string) => tab === 'ALL' ? sessions.length
    : sessions.filter(s => s.status === tab).length;

  return (
    <div className="sb-page">

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '4.5rem', right: '1.5rem', zIndex: 2000,
          background: 'var(--text-primary)', color: '#fff',
          padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem', fontWeight: 500, boxShadow: 'var(--shadow-md)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="sb-page-header">
        <h1 className="sb-page-title">
          {user?.role === 'MENTOR' ? 'My Sessions' : 'Sessions'}
        </h1>
        <p className="sb-page-subtitle">{sessions.length} total sessions</p>
      </div>

      {/* Status tabs */}
      <div className="sb-tabs">
        {STATUS_TABS.map(tab => (
          <button key={tab} className={`sb-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {tab}
            {tabCount(tab) > 0 && (
              <span style={{
                marginLeft: '0.3rem', background: activeTab === tab ? 'var(--primary)' : '#64748b',
                color: activeTab === tab ? '#fff' : '#ffffff',
                borderRadius: 10, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700,
              }}>{tabCount(tab)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="sb-spinner-wrap"><div className="sb-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="sb-empty">
          <div className="sb-empty-icon">📅</div>
          <div className="sb-empty-title">No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} sessions</div>
          <div className="sb-empty-desc">
            {activeTab === 'ALL' ? 'No sessions have been booked yet.' : `No ${activeTab.toLowerCase()} sessions found.`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(s => (
            <SessionCard key={s.id} session={s} userRole={user?.role ?? ''} onAction={handleAction} />
          ))}
        </div>
      )}

      {/* Modals */}
      {rejectModal && (
        <RejectModal session={rejectModal}
          onClose={() => setRejectModal(null)}
          onConfirm={handleReject} />
      )}
      {reviewModal && (
        <ReviewModal session={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmit={() => { setReviewModal(null); load(); showToast('Review submitted. Thank you!'); }} />
      )}
      {rescheduleModal && (
        <RescheduleModal session={rescheduleModal}
          onClose={() => setRescheduleModal(null)}
          onSuccess={() => { setRescheduleModal(null); load(); showToast('Session rescheduled!'); }} />
      )}
    </div>
  );
}