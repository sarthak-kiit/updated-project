import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MentorProfile } from '../types';

interface Props { mentor: MentorProfile; }

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? 'var(--gold)' : '#d1d5db', fontSize: '0.85rem' }}>★</span>
      ))}
    </span>
  );
}

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' as const }}>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function MentorCard({ mentor }: Props) {
  const navigate = useNavigate();
  const initials = mentor.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="sb-card sb-card-clickable" onClick={() => navigate(`/mentors/${mentor.id}`)}>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.9rem' }}>
        <div className="sb-avatar sb-avatar-lg">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem', color: 'var(--primary)', letterSpacing: '-0.2px' }}>{mentor.fullName}</div>
          {mentor.headline && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mentor.headline}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Stars rating={mentor.averageRating} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>{mentor.averageRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.9rem', padding: '0.6rem 0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
        <StatPill value={mentor.totalSessions} label="Sessions" />
        <StatPill value={mentor.yearsOfExperience ?? '—'} label="Yrs exp" />
        <StatPill value={mentor.totalReviews} label="Reviews" />
      </div>

      <div style={{ marginBottom: '0.75rem', minHeight: 26 }}>
        {(mentor.skills ?? []).slice(0, 4).map(s => (
          <span key={s.skillName} className={`sb-tag skill-${(s.expertiseLevel ?? 'beginner').toLowerCase()}`}>{s.skillName}</span>
        ))}
        {(mentor.skills ?? []).length > 4 && <span className="sb-tag sb-tag-gray">+{mentor.skills.length - 4} more</span>}
      </div>

      {(mentor.industries ?? []).length > 0 && (
        <div style={{ marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', flexWrap: 'wrap' as const, gap: '0.35rem' }}>
          {(mentor.industries ?? []).slice(0, 2).map(i => <span key={i}>🏢 {i}</span>)}
          {(mentor.industries ?? []).length > 2 && <span>+{mentor.industries.length - 2} more</span>}
        </div>
      )}

      <button className="btn-primary btn-full" style={{ fontSize: '0.85rem' }}
        onClick={e => { e.stopPropagation(); navigate(`/mentors/${mentor.id}`); }}>
        View Profile &amp; Book
      </button>
    </div>
  );
}