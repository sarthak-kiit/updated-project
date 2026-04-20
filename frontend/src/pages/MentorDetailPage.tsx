// pages/MentorDetailPage.tsx
// Full mentor profile view — booking, reviews, skills, availability
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMentorById, getReviewsForMentor, bookSession, addFavorite,
         removeFavorite, getFavorites, respondToReview } from '../services/api';
import { MentorProfile, ReviewDTO } from '../types';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';

function Stars({ rating, size = '0.9rem' }: { rating: number; size?: string }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? 'var(--gold)' : '#d1d5db', fontSize: size }}>★</span>
      ))}
    </span>
  );
}

// ── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ mentor, onClose, onSuccess }: {
  mentor: MentorProfile; onClose: () => void; onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({ scheduledAt: '', durationMinutes: 60, agenda: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  const handleBook = async () => {
    if (!form.scheduledAt) { setError('Please select a date and time'); return; }
    setLoading(true); setError('');
    try {
      await bookSession(user!.userId, {
        mentorId: mentor.userId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: form.durationMinutes,
        agenda: form.agenda,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="sb-overlay" onClick={onClose}>
      <div className="sb-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="sb-modal-title">Book with {mentor.fullName}</h3>
            {mentor.headline && <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem' }}>{mentor.headline}</p>}
          </div>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {error && <div className="sb-alert sb-alert-error">{error}</div>}

        <div className="sb-form-group">
          <label className="sb-label">Select Date &amp; Time</label>
          <input className="sb-input" type="datetime-local" min={minDateStr}
            value={form.scheduledAt}
            onChange={e => { setForm({ ...form, scheduledAt: e.target.value }); setError(''); }} />
        </div>

        <div className="sb-form-group">
          <label className="sb-label">Session Duration</label>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {[30, 45, 60].map(d => (
              <button key={d} type="button" onClick={() => setForm({ ...form, durationMinutes: d })}
                style={{
                  flex: 1, padding: '0.55rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem', fontFamily: "'Inter', sans-serif",
                  border: form.durationMinutes === d ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: form.durationMinutes === d ? 'var(--primary-light)' : 'var(--bg-subtle)',
                  color: form.durationMinutes === d ? 'var(--primary)' : 'var(--text-secondary)',
                }}>
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Availability hint */}
        {mentor.availabilities?.length > 0 && (
          <div className="sb-section-box" style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)',
              textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.5rem' }}>
              Mentor Available On
            </div>
            {mentor.availabilities.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>{a.dayOfWeek}</span>
                <span>{a.startTime} – {a.endTime} <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.timezone}</span></span>
              </div>
            ))}
          </div>
        )}

        <div className="sb-form-group">
          <label className="sb-label">Session Agenda (optional)</label>
          <textarea className="sb-input" rows={3}
            placeholder="What topics would you like to cover?"
            value={form.agenda}
            onChange={e => setForm({ ...form, agenda: e.target.value })}
            style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={handleBook} disabled={loading} style={{ flex: 2 }}>
            {loading ? 'Booking…' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mentor Response on review ─────────────────────────────────────────────────
function ResponseSection({ review, onSaved }: {
  review: ReviewDTO; onSaved: (updated: ReviewDTO) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText]       = useState(review.mentorResponse || '');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const withinWindow = !review.mentorResponse ||
    (Date.now() - new Date(review.createdAt).getTime()) < 48 * 3_600_000;

  if (!withinWindow) return null;

  const handleSave = async () => {
    if (!text.trim()) { setError('Please enter a response'); return; }
    setSaving(true);
    try {
      const updated = await respondToReview(review.id, text.trim());
      onSaved(updated);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save response');
    } finally { setSaving(false); }
  };

  if (!editing) {
    return (
      <button className="btn-ghost btn-sm"
        style={{ marginTop: '0.5rem', fontSize: '0.78rem' }}
        onClick={() => { setText(review.mentorResponse || ''); setEditing(true); }}>
        {review.mentorResponse ? 'Edit reply' : 'Reply to review'}
      </button>
    );
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>{error}</p>}
      <textarea className="sb-input" rows={2}
        placeholder="Write your response…"
        value={text} onChange={e => { setText(e.target.value); setError(''); }}
        style={{ resize: 'vertical', marginBottom: '0.5rem' }} />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn-ghost btn-sm" onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
        <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Response'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MentorDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [mentor,  setMentor]  = useState<MentorProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking]   = useState(false);
  const [bookingOk,   setBookingOk]     = useState(false);
  const [isFav,       setIsFav]         = useState(false);
  const [favError,    setFavError]      = useState('');
  const [showReport,  setShowReport]    = useState(false);
  const [activeTab,   setActiveTab]     = useState<'overview' | 'experience' | 'reviews'>('overview');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getMentorById(Number(id)),
      getReviewsForMentor(Number(id)).catch(() => []),
    ]).then(([m, r]) => {
      setMentor(m);
      setReviews(r);
      if (user?.role === 'MENTEE') {
        getFavorites(user.userId)
          .then((list: MentorProfile[]) => setIsFav(list.some(f => f.userId === m.userId)))
          .catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [id, user]);

  const handleFav = async () => {
    if (!mentor || !user) return;
    setFavError('');
    try {
      if (isFav) { await removeFavorite(user.userId, mentor.userId); setIsFav(false); }
      else        { await addFavorite(user.userId, mentor.userId);    setIsFav(true);  }
    } catch (err: any) {
      setFavError(err.response?.data?.message || 'Could not update favourites.');
    }
  };

  if (loading) return <div className="sb-spinner-wrap"><div className="sb-spinner" /></div>;
  if (!mentor) return (
    <div className="sb-page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😕</div>
      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Mentor not found</p>
      <button className="btn-ghost" onClick={() => navigate('/mentors')}>← Back to Mentors</button>
    </div>
  );

  const initials = mentor.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="sb-page" style={{ maxWidth: 860 }}>

      {bookingOk && (
        <div className="sb-alert sb-alert-success" style={{ marginBottom: '1.25rem' }}>
          ✅ Session booked successfully! The mentor will confirm shortly.
        </div>
      )}

      <button className="btn-ghost btn-sm" onClick={() => navigate(-1)}
        style={{ marginBottom: '1.25rem' }}>
        ← Back
      </button>

      {/* ── Profile header card ── */}
      <div className="sb-card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          <div className="sb-avatar sb-avatar-xl" style={{ flexShrink: 0 }}>{initials}</div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              {mentor.fullName}
            </h1>
            {mentor.headline && (
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                {mentor.headline}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Stars rating={mentor.averageRating} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {mentor.averageRating.toFixed(1)} ({mentor.totalReviews} reviews)
                </span>
              </span>
              {mentor.company && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>🏢 {mentor.company}</span>
              )}
              {mentor.yearsOfExperience && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>💼 {mentor.yearsOfExperience} yrs exp</span>
              )}
            </div>
            <div>
              {(mentor.industries ?? []).map(i => (
                <span key={i} className="sb-tag sb-tag-gray">{i}</span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0, alignItems: 'flex-end' }}>
            {favError && <p style={{ fontSize: '0.75rem', color: 'var(--danger)', maxWidth: 200, textAlign: 'right' }}>{favError}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {user?.role === 'MENTEE' && (
                <>
                  <button className="btn-ghost" onClick={handleFav}>
                    {isFav ? '❤️ Saved' : '🤍 Save'}
                  </button>
                  <button className="btn-primary" onClick={() => setShowBooking(true)}>
                    📅 Book Session
                  </button>
                </>
              )}
              <button onClick={() => setShowReport(true)}
                className="btn-ghost"
                style={{ color: 'var(--danger)', borderColor: '#fca5a5', background: 'var(--danger-bg)', fontSize: '0.8rem' }}>
                🚩 Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <hr className="sb-divider" />
        <div style={{ display: 'flex', gap: '0', justifyContent: 'center' }}>
          {[
            { label: 'Sessions', value: mentor.totalSessions },
            { label: 'Avg Rating', value: mentor.averageRating.toFixed(1) },
            { label: 'Reviews', value: mentor.totalReviews },
            { label: 'Yrs Exp', value: mentor.yearsOfExperience ?? '—' },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              flex: 1, textAlign: 'center', padding: '0.5rem',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {mentor.professionalSummary && (
          <>
            <hr className="sb-divider" />
            <p style={{ color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.75, fontSize: '0.9rem' }}>
              {mentor.professionalSummary}
            </p>
          </>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="sb-tabs">
        {(['overview', 'experience', 'reviews'] as const).map(tab => (
          <button key={tab} className={`sb-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {tab === 'overview' ? 'Skills & Availability'
              : tab === 'experience' ? 'Work Experience'
              : `Reviews (${reviews.length})`}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* Skills */}
          <div className="sb-card">
            <h3 className="sb-section-title">Skills &amp; Expertise</h3>
            {mentor.skills?.length > 0 ? (
              <div>
                {mentor.skills.map(s => (
                  <span key={s.skillName}
                    className={`sb-tag skill-${s.expertiseLevel?.toLowerCase()}`}>
                    {s.skillName}
                    <span style={{ opacity: 0.65, fontSize: '0.7rem' }}> · {s.expertiseLevel}</span>
                  </span>
                ))}
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)',
                  display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="sb-tag skill-expert" style={{ fontSize: '0.7rem' }}>Expert</span>
                  <span className="sb-tag skill-intermediate" style={{ fontSize: '0.7rem' }}>Intermediate</span>
                  <span className="sb-tag skill-beginner" style={{ fontSize: '0.7rem' }}>Beginner</span>
                </div>
              </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No skills listed yet.</p>}
          </div>

          {/* Availability */}
          <div className="sb-card">
            <h3 className="sb-section-title">Weekly Availability</h3>
            {mentor.availabilities?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {mentor.availabilities.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary-light)', border: '1px solid var(--border-focus)',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)' }}>{a.dayOfWeek}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {a.startTime} – {a.endTime}
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500, marginLeft: '0.3rem', fontSize: '0.72rem' }}>{a.timezone}</span>
                    </span>
                    {a.recurring && <span style={{ fontSize: '0.68rem', color: 'var(--success)', fontWeight: 700 }}>↺ Weekly</span>}
                  </div>
                ))}
                {user?.role === 'MENTEE' && (
                  <button className="btn-primary btn-full" style={{ marginTop: '0.5rem' }}
                    onClick={() => setShowBooking(true)}>
                    Book a Slot
                  </button>
                )}
              </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No availability set yet.</p>}
          </div>
        </div>
      )}

      {/* ── Tab: Experience ── */}
      {activeTab === 'experience' && (
        <div className="sb-card">
          <h3 className="sb-section-title">Work Experience</h3>
          {mentor.workExperiences?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {mentor.workExperiences.map((w, i) => (
                <div key={i} style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
                    {w.jobTitle}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem' }}>{w.companyName}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {w.startDate?.slice(0, 7)} – {w.currentJob ? 'Present' : w.endDate?.slice(0, 7)}
                    </span>
                    {w.currentJob && <span className="sb-tag sb-tag-green" style={{ fontSize: '0.7rem' }}>Current</span>}
                  </div>
                  {w.description && (
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.65 }}>
                      {w.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No work experience added yet.</p>}
        </div>
      )}

      {/* ── Tab: Reviews ── */}
      {activeTab === 'reviews' && (
        <div className="sb-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 className="sb-section-title" style={{ margin: 0 }}>Reviews ({reviews.length})</h3>
            {reviews.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <select className="sb-input" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                  onChange={e => {
                    const val = e.target.value;
                    setReviews(prev => [...prev].sort((a, b) =>
                      val === 'rating'
                        ? b.rating - a.rating
                        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    ));
                  }}>
                  <option value="date">Sort by Date</option>
                  <option value="rating">Sort by Rating</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Stars rating={mentor.averageRating} size="1rem" />
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{mentor.averageRating.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem' }}>/5</span>
                </div>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="sb-empty">
              <div className="sb-empty-icon">💬</div>
              <div className="sb-empty-title">No reviews yet</div>
              <div className="sb-empty-desc">Be the first to review after your session!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {reviews.map(r => (
                <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="sb-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                        {r.anonymous ? '?' : r.menteeName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.menteeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <Stars rating={r.rating} size="1rem" />
                  </div>

                  {r.comment && (
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '0.5rem' }}>
                      {r.comment}
                    </p>
                  )}

                  {r.mentorResponse && (
                    <div style={{
                      background: 'var(--primary-light)', border: '1px solid var(--border-focus)',
                      borderLeft: '3px solid var(--primary)', borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.9rem',
                    }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)',
                        marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Mentor Reply
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{r.mentorResponse}</p>
                    </div>
                  )}

                  {user?.role === 'MENTOR' && user.userId === mentor.userId && (
                    <ResponseSection review={r}
                      onSaved={updated => setReviews(prev => prev.map(rv => rv.id === updated.id ? updated : rv))} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showBooking && (
        <BookingModal mentor={mentor} onClose={() => setShowBooking(false)}
          onSuccess={() => { setShowBooking(false); setBookingOk(true); setTimeout(() => setBookingOk(false), 5000); }} />
      )}

      {showReport && mentor && (
        <ReportModal reportedUserId={mentor.userId} reportedUserName={mentor.fullName}
          onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}