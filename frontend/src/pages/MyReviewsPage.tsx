// pages/MyReviewsPage.tsx
// US16 — Mentor feedback dashboard — private, chronological, with aggregate score
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReviewsForMentor, respondToReview } from '../services/api';
import { ReviewDTO } from '../types';

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= rating ? 'var(--gold)' : '#d1d5db', fontSize: '1rem' }}>★</span>
      ))}
    </span>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: 30, textAlign: 'right', flexShrink: 0 }}>
        {star}★
      </span>
      <div className="sb-progress-bar" style={{ flex: 1 }}>
        <div className="sb-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: 20, flexShrink: 0 }}>{count}</span>
    </div>
  );
}

export default function MyReviewsPage() {
  const { user }  = useAuth();
  const [reviews, setReviews]         = useState<ReviewDTO[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState('');
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [respondErr,   setRespondErr]   = useState('');

  useEffect(() => {
    if (!user) return;
    getReviewsForMentor(user.userId)
      .then((data: ReviewDTO[]) =>
        setReviews([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      )
      .catch(() => setError('Failed to load reviews.'))
      .finally(() => setLoading(false));
  }, [user]);

  const total   = reviews.length;
  const avg     = total === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / total;
  const counts  = [5,4,3,2,1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));

  const handleRespond = async (reviewId: number) => {
    if (!responseText.trim()) return;
    setSubmitting(true); setRespondErr('');
    try {
      const updated = await respondToReview(reviewId, responseText.trim());
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, mentorResponse: updated.mentorResponse } : r));
      setRespondingId(null);
      setResponseText('');
    } catch (err: any) {
      setRespondErr(err.response?.data?.message || 'Failed to submit response.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="sb-spinner-wrap"><div className="sb-spinner" /></div>;

  return (
    <div className="sb-page">
      <div className="sb-page-header">
        <h1 className="sb-page-title">My Feedback Dashboard</h1>
        <p className="sb-page-subtitle">Private — only visible to you</p>
      </div>

      {error && <div className="sb-alert sb-alert-error">{error}</div>}

      {/* ── Aggregate score card ── */}
      <div className="sb-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'center' }}>
          {/* Big score */}
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontSize: '3.2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
              {total === 0 ? '—' : avg.toFixed(1)}
            </div>
            <Stars rating={Math.round(avg)} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {total} {total === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          {/* Bar breakdown */}
          <div>
            {counts.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={total} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Reviews list ── */}
      {total === 0 ? (
        <div className="sb-empty">
          <div className="sb-empty-icon">💬</div>
          <div className="sb-empty-title">No reviews yet</div>
          <div className="sb-empty-desc">Reviews will appear here after mentees complete sessions with you.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map(r => (
            <div key={r.id} className="sb-card">
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="sb-avatar" style={{ width: 36, height: 36, fontSize: '0.82rem' }}>
                    {r.anonymous ? '?' : r.menteeName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {r.anonymous ? 'Anonymous' : r.menteeName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <Stars rating={r.rating} />
              </div>

              {r.comment && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '0.5rem' }}>
                  {r.comment}
                </p>
              )}

              {/* Existing response */}
              {r.mentorResponse && (
                <div style={{
                  background: 'var(--primary-light)', border: '1px solid var(--border-focus)',
                  borderLeft: '3px solid var(--primary)', borderRadius: 'var(--radius-md)',
                  padding: '0.6rem 0.85rem', marginBottom: '0.5rem',
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)',
                    textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.2rem' }}>
                    Your Reply
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {r.mentorResponse}
                  </p>
                </div>
              )}

              {/* Respond form */}
              {respondingId === r.id ? (
                <div style={{ marginTop: '0.5rem' }}>
                  {respondErr && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>{respondErr}</p>}
                  <textarea className="sb-input" rows={2}
                    placeholder="Write a professional response…"
                    value={responseText}
                    onChange={e => { setResponseText(e.target.value); setRespondErr(''); }}
                    style={{ resize: 'vertical', marginBottom: '0.5rem' }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-ghost btn-sm"
                      onClick={() => { setRespondingId(null); setResponseText(''); setRespondErr(''); }}>
                      Cancel
                    </button>
                    <button className="btn-primary btn-sm" onClick={() => handleRespond(r.id)}
                      disabled={submitting || !responseText.trim()}>
                      {submitting ? 'Saving…' : 'Save Response'}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn-ghost btn-sm"
                  style={{ marginTop: '0.35rem', fontSize: '0.78rem' }}
                  onClick={() => { setRespondingId(r.id); setResponseText(r.mentorResponse || ''); setRespondErr(''); }}>
                  {r.mentorResponse ? 'Edit reply' : 'Reply to review'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
