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

// ── Booking Modal (US03 + US07 + US10) ───────────────────────────────────────
// Smart calendar — only available days are clickable, blocked dates are greyed out.
// Mentee CANNOT submit on a wrong day or a blocked date (hard enforcement, not just a warning).
function BookingModal({ mentor, onClose, onSuccess }: {
  mentor: MentorProfile; onClose: () => void; onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(''); // "YYYY-MM-DD"
  const [selectedTime, setSelectedTime] = useState<string>(''); // "HH:MM"
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [agenda, setAgenda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState('');
  // US07 AC3 — daily/weekly/monthly view toggle
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  // US07 AC2 — mentee's local timezone for conversion display
  const menteeLocalTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const DAY_NAMES = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

  // FIX: Array of slots per day — supports multiple slots on the same day.
  // Old code used a plain object which silently overwrote the first slot if a day had two.
  const availMap: Record<string, { startTime: string; endTime: string; timezone: string }[]> = {};
  (mentor.availabilities ?? []).forEach(a => {
    if (!availMap[a.dayOfWeek]) availMap[a.dayOfWeek] = [];
    availMap[a.dayOfWeek].push({ startTime: a.startTime, endTime: a.endTime, timezone: a.timezone });
  });

  // All blocked dates across all slots as a Set for O(1) lookup
  const blockedSet = new Set<string>(
    (mentor.availabilities ?? []).flatMap(a => (a as any).blockedDates ?? [])
  );

  const mentorTz  = (mentor.availabilities ?? [])[0]?.timezone ?? 'IST';
  const tzDisplay = [...new Set((mentor.availabilities ?? []).map(a => a.timezone))].join(' / ');

  // US07 AC2 — convert a "HH:MM" time from mentor's IST slot to mentee's local timezone.
  // Uses the browser's Intl API — works for all IANA timezones.
  // IST isn't an IANA tz key ("Asia/Kolkata" is), so we normalise common abbreviations.
  const TZ_MAP: Record<string, string> = {
    IST: 'Asia/Kolkata', UTC: 'UTC', EST: 'America/New_York',
    PST: 'America/Los_Angeles', CET: 'Europe/Paris',
    SGT: 'Asia/Singapore', JST: 'Asia/Tokyo', AEST: 'Australia/Sydney',
  };
  const toIANA = (abbr: string) => TZ_MAP[abbr] ?? abbr;

  const convertToLocal = (timeStr: string, mentorTzAbbr: string): string => {
    try {
      const [h, m] = timeStr.split(':').map(Number);
      // Build a today-date string in mentor's timezone at that time
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const mentorDt = new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
      // Format in mentee's local tz
      return mentorDt.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: toIANA(mentorTzAbbr),
      });
    } catch { return timeStr.slice(0,5); }
  };

  const isSameTz = menteeLocalTz === toIANA(mentorTz) || mentorTz === 'IST' && menteeLocalTz === 'Asia/Kolkata';

  // Build 6-week calendar grid starting from tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const calStart = new Date(today);
  calStart.setDate(today.getDate() + 1); // earliest bookable = tomorrow
  // Roll back to the Monday of that week for a clean Mon–Sun grid
  const dowOffset = (calStart.getDay() + 6) % 7; // Mon=0 … Sun=6
  calStart.setDate(calStart.getDate() - dowOffset);

  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(calStart);
      day.setDate(calStart.getDate() + w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }

  // FIX: toISOString() converts to UTC — shifts IST midnight back by 5.5h giving wrong date.
  // Use local getters instead.
  const toYMD = (d: Date) => {
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const isAvailableDay  = (d: Date) => DAY_NAMES[d.getDay()] in availMap;
  const isBlocked       = (d: Date) => blockedSet.has(toYMD(d));
  const isPast          = (d: Date) => d <= today;
  const isSelectable    = (d: Date) => !isPast(d) && isAvailableDay(d) && !isBlocked(d);

  const handleDateClick = (d: Date) => {
    if (!isSelectable(d)) return;
    setSelectedDate(toYMD(d));
    setSelectedTime(''); // reset — mentee must explicitly pick a time
    setError('');
  };

  // Build time options from ALL slots on the selected day (every 30 min per slot range).
  // FIX: was only using the first/last slot — now merges all slot ranges for the day.
  const timeOptions: string[] = [];
  if (selectedDate) {
    const dayName = DAY_NAMES[new Date(selectedDate + 'T00:00:00').getDay()];
    const slots = availMap[dayName] ?? [];
    const seen = new Set<string>();
    for (const slot of slots) {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      let cur = sh * 60 + sm;
      const end = eh * 60 + em;
      while (cur < end) {
        const hh = String(Math.floor(cur / 60)).padStart(2, '0');
        const mm = String(cur % 60).padStart(2, '0');
        const t = `${hh}:${mm}`;
        if (!seen.has(t)) { seen.add(t); timeOptions.push(t); }
        cur += 30;
      }
    }
    timeOptions.sort(); // ensure chronological order across multiple slots
  }

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) { setError('Please select a date and time slot'); return; }
    if (!isSelectable(new Date(selectedDate + 'T00:00:00'))) {
      setError('Selected date is not available. Please pick an available date.');
      return;
    }
    setLoading(true); setError('');
    try {
      await bookSession(user!.userId, {
        mentorId: mentor.userId,
        scheduledAt: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        durationMinutes,
        agenda,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setLoading(false); }
  };

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const headerMonth = weeks[2][0]; // middle of the grid

  return (
    <div className="sb-overlay" onClick={onClose}>
      <div className="sb-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 className="sb-modal-title">Book with {mentor.fullName}</h3>
            {tzDisplay && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                🌐 {tzDisplay}
              </span>
            )}
          </div>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {error && <div className="sb-alert sb-alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)', display: 'inline-block' }} />
            Available
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#fca5a5', display: 'inline-block' }} />
            Blocked
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--border)', display: 'inline-block' }} />
            Unavailable
          </span>
        </div>

        {/* US07 AC3 — Daily / Weekly / Monthly view toggle */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', justifyContent: 'center' }}>
          {(['daily','weekly','monthly'] as const).map(v => (
            <button key={v} type="button" onClick={() => { setViewMode(v); setSelectedDate(''); setSelectedTime(''); }}
              style={{
                padding: '0.3rem 0.85rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Inter', sans-serif",
                border: viewMode === v ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                background: viewMode === v ? 'var(--primary)' : 'var(--bg-subtle)',
                color: viewMode === v ? '#fff' : 'var(--text-secondary)',
              }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Calendar header */}
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.9rem',
          color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {MONTH_NAMES[headerMonth.getMonth()]} {headerMonth.getFullYear()}
        </div>

        {/* Day-of-week headers — hidden in daily view */}
        {viewMode !== 'daily' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem',
                fontWeight: 700, color: 'var(--text-muted)', padding: '0.2rem 0' }}>
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Calendar grid — US07 AC1: color-coded by availability status */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'daily' ? '1fr' : 'repeat(7, 1fr)',
          gap: viewMode === 'daily' ? '0.4rem' : 3,
          marginBottom: '1rem',
          maxHeight: viewMode === 'daily' ? 220 : 'none',
          overflowY: viewMode === 'daily' ? 'auto' : 'visible',
        }}>
          {(viewMode === 'daily'
            // Daily view: show only available + selectable days in next 30 days as list rows
            ? weeks.flat().filter(d => isSelectable(d)).slice(0, 30)
            // Weekly view: current 6-week grid  |  Monthly: same grid (already 1 month+)
            : viewMode === 'monthly' ? weeks.flat() : weeks.slice(0,2).flat()
          ).map((day, idx) => {
            const ymd = toYMD(day);
            const past      = isPast(day);
            const available = isAvailableDay(day);
            const blocked   = isBlocked(day);
            const selectable = isSelectable(day);
            const selected  = ymd === selectedDate;
            const isToday   = ymd === toYMD(today);

            let bg = 'transparent';
            let color = 'var(--text-muted)';
            let border = '1px solid transparent';
            let cursor = 'default';
            let opacity = past ? 0.3 : 1;

            if (selected) {
              bg = 'var(--primary)'; color = '#fff'; border = '1px solid var(--primary)';
            } else if (blocked && available && !past) {
              // available day but this specific date is blocked
              bg = '#fee2e2'; color = '#b91c1c'; border = '1px solid #fca5a5';
            } else if (selectable) {
              bg = 'var(--primary-light)'; color = 'var(--primary)';
              border = '1px solid var(--border-focus)'; cursor = 'pointer';
            } else if (!past) {
              bg = 'var(--bg-subtle)'; color = 'var(--text-muted)';
            }

            return (
              <div key={idx} onClick={() => handleClick(day)}
                style={{
                  textAlign: 'center', padding: '0.45rem 0.2rem', borderRadius: 6,
                  fontSize: '0.78rem', fontWeight: selected ? 700 : selectable ? 600 : 500,
                  background: bg, color, border, cursor, opacity,
                  outline: isToday && !selected ? '2px solid var(--primary)' : 'none',
                  outlineOffset: -2,
                  transition: 'all 0.1s',
                }}
                title={
                  blocked && available && !past ? '🚫 Blocked by mentor' :
                  selectable ? (availMap[DAY_NAMES[day.getDay()]] ?? []).map(s => s.startTime.slice(0,5) + '–' + s.endTime.slice(0,5)).join(', ') :
                  past ? 'Past date' : 'Not available'
                }
              >
                {viewMode === 'daily' ? (
                  <span style={{ fontSize: '0.82rem' }}>
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day.getDay()]} {day.getDate()} {MONTH_NAMES[day.getMonth()]}
                    &nbsp;·&nbsp;
                    {(availMap[DAY_NAMES[day.getDay()]] ?? []).map(s =>
                      s.startTime.slice(0,5) + '–' + s.endTime.slice(0,5)
                    ).join(', ')}
                  </span>
                ) : (
                  <>
                    {day.getDate()}
                    {blocked && available && !past && (
                      <div style={{ fontSize: '0.55rem', lineHeight: 1 }}>🚫</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Step 2: Time picker — appears after date is chosen */}
        {selectedDate && (
          <div className="sb-form-group">
            <label className="sb-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{
                background: selectedTime ? 'var(--primary)' : 'var(--text-muted)',
                color: '#fff', borderRadius: '50%', width: 18, height: 18,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
              }}>2</span>
              Pick a time for {selectedDate}
              {/* US07 AC2 — show mentor tz + mentee local tz conversion */}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                (Mentor: {tzDisplay}
                {!isSameTz && ` · Your local: ${menteeLocalTz}`})
              </span>
            </label>

            {timeOptions.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                No time slots available for this date.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                {timeOptions.map(t => (
                  <button key={t} type="button"
                    onClick={() => setSelectedTime(t)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      border: selectedTime === t ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                      background: selectedTime === t ? 'var(--primary)' : 'var(--bg-card)',
                      color: selectedTime === t ? '#fff' : 'var(--text-secondary)',
                      boxShadow: selectedTime === t ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                      transform: selectedTime === t ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}>
                    {/* US07 AC2 — show mentor time + mentee local equivalent */}
                    🕐 {t}
                    {!isSameTz && (
                      <span style={{ fontSize: '0.68rem', display: 'block',
                        opacity: 0.85, fontWeight: 500, marginTop: '0.1rem' }}>
                        {convertToLocal(t, mentorTz)} local
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {!selectedTime && timeOptions.length > 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                ☝️ Tap a time slot above to select it
              </p>
            )}
          </div>
        )}

        {/* Duration — US10 */}
        <div className="sb-form-group">
          <label className="sb-label">Session Duration</label>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {[30, 45, 60].map(d => (
              <button key={d} type="button" onClick={() => setDurationMinutes(d)}
                style={{
                  flex: 1, padding: '0.55rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem', fontFamily: "'Inter', sans-serif",
                  border: durationMinutes === d ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: durationMinutes === d ? 'var(--primary-light)' : 'var(--bg-subtle)',
                  color: durationMinutes === d ? 'var(--primary)' : 'var(--text-secondary)',
                }}>
                {d} min
              </button>
            ))}
          </div>
        </div>

        <div className="sb-form-group">
          <label className="sb-label">Session Agenda (optional)</label>
          <textarea className="sb-input" rows={2}
            placeholder="What topics would you like to cover?"
            value={agenda} onChange={e => setAgenda(e.target.value)}
            style={{ resize: 'vertical' }} />
        </div>

        {selectedDate && selectedTime && (
          <div style={{
            background: 'var(--primary-light)', border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-md)', padding: '0.6rem 0.9rem',
            fontSize: '0.82rem', marginBottom: '0.75rem', fontWeight: 600,
          }}>
            📅 {selectedDate} at {selectedTime} · {durationMinutes} min · {tzDisplay}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={handleBook}
            disabled={loading || !selectedDate || !selectedTime} style={{ flex: 2 }}>
            {loading ? 'Booking…' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );

  function handleClick(day: Date) {
    if (!isSelectable(day)) return;
    handleDateClick(day);
  }
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