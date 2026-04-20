// pages/DashboardPage.tsx
// Clean dashboard — stat cards, upcoming sessions, mentor recommendations
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTopRatedMentors, getRecommendedMentors, getSessionsForUser,
         getMenteeByUserId, getAllMentors, getTopSkillAnalytics } from '../services/api';
import { MentorProfile, SessionDTO, MenteeProfile } from '../types';
import MentorCard from '../components/MentorCard';

// ── Shared stat card ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function isProfileComplete(profile: MenteeProfile | null): boolean {
  if (!profile) return false;
  return (profile.interests?.length ?? 0) > 0 && (profile.desiredSkills?.length ?? 0) > 0;
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topSkills, setTopSkills] = useState<{ skillName: string; requestCount: number }[]>([]);
  const [mentorCount, setMentorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTopSkillAnalytics().catch(() => []),
      getAllMentors().catch(() => []),
    ]).then(([skills, mentors]) => {
      setTopSkills((skills as any[]).slice(0, 5));
      setMentorCount((mentors as any[]).length);
    }).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="sb-page">
      {/* Hero */}
      <div className="sb-hero">
        <div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.25rem' }}>{greeting},</div>
          <div className="sb-hero-title">{user?.fullName}</div>
          <div className="sb-hero-sub">Platform overview — monitor mentor activity and skill demand.</div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/analytics')}>
          📊 Full Analytics
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <StatCard label="Total Mentors" value={loading ? '—' : mentorCount} icon="👨‍🏫" />
        <StatCard label="Top Skill" value={loading || !topSkills.length ? '—' : topSkills[0]?.skillName ?? '—'} icon="🔥" />
        <StatCard label="Skills Tracked" value={loading ? '—' : '20+'} icon="📈" />
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Top skills */}
        <div>
          <h2 className="sb-section-title">Top In-Demand Skills</h2>
          {loading ? (
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>Loading…</div>
          ) : topSkills.length === 0 ? (
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>No data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topSkills.map((skill, i) => {
                const max = topSkills[0]?.requestCount ?? 1;
                const pct = Math.round((skill.requestCount / max) * 100);
                return (
                  <div key={skill.skillName} className="sb-card" style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--primary)', marginRight: '0.4rem' }}>#{i + 1}</span>
                        {skill.skillName}
                      </span>
                      <span className="sb-tag" style={{ margin: 0 }}>{skill.requestCount} req.</span>
                    </div>
                    <div className="sb-progress-bar">
                      <div className="sb-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <button className="btn-ghost btn-sm" onClick={() => navigate('/admin/analytics')}>
                View all 20 skills →
              </button>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="sb-section-title">Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '📊', title: 'Skill Demand Analytics', desc: 'Top 20 skills with filtering and CSV export', path: '/admin/analytics' },
              { icon: '👥', title: 'Browse Mentors', desc: 'View all mentor profiles and skills', path: '/mentors' },
              { icon: '📋', title: 'Session Overview', desc: 'Review session activity across the platform', path: '/sessions' },
            ].map(card => (
              <div key={card.path} className="sb-card sb-card-clickable"
                onClick={() => navigate(card.path)}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.1rem' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{card.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.15rem', color: 'var(--text-primary)' }}>{card.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{card.desc}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mentors,  setMentors]  = useState<MentorProfile[]>([]);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN') { setLoading(false); return; }

    const fetchAll = async () => {
      setLoading(true);
      const sessionsPromise = getSessionsForUser(user.userId).catch(() => []);

      if (user.role === 'MENTOR') {
        const [s, top] = await Promise.all([sessionsPromise, getTopRatedMentors().catch(() => [])]);
        setSessions(s as SessionDTO[]);
        setMentors((top as MentorProfile[]).slice(0, 6));
        setLoading(false);
        return;
      }

      // MENTEE
      const [s, menteeProfile] = await Promise.all([
        sessionsPromise,
        getMenteeByUserId(user.userId).catch(() => null),
      ]);
      setSessions(s as SessionDTO[]);
      const complete = isProfileComplete(menteeProfile as MenteeProfile | null);
      setProfileComplete(complete);

      if (!complete) { setMentors([]); setLoading(false); return; }
      try {
        const rec: MentorProfile[] = await getRecommendedMentors(user.userId);
        setMentors((rec ?? []).slice(0, 6));
      } catch {
        const top = await getTopRatedMentors().catch(() => []);
        setMentors((top as MentorProfile[]).slice(0, 6));
      }
      setLoading(false);
    };

    fetchAll();
  }, [user, location.key]);

  if (user?.role === 'ADMIN') return <AdminDashboard />;

  const upcoming  = sessions.filter(s => s.status === 'CONFIRMED' || s.status === 'PENDING');
  const completed = sessions.filter(s => s.status === 'COMPLETED');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return <div className="sb-spinner-wrap"><div className="sb-spinner" /></div>;
  }

  return (
    <div className="sb-page">

      {/* Hero banner */}
      <div className="sb-hero">
        <div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.25rem' }}>{greeting},</div>
          <div className="sb-hero-title">{user?.fullName}</div>
          <div className="sb-hero-sub">
            {user?.role === 'MENTOR'
              ? 'Manage your sessions and inspire the next generation.'
              : 'Find the right mentor and accelerate your career.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {user?.role === 'MENTEE' && (
            <button className="btn-primary" onClick={() => navigate('/mentors')}>
              Browse Mentors
            </button>
          )}
          {user?.role === 'MENTOR' && (
            <button className="btn-primary" onClick={() => navigate('/profile/build')}>
              Build Profile
            </button>
          )}
          <button className="btn-ghost" onClick={() => navigate('/sessions')}>
            My Sessions
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <StatCard label="Upcoming Sessions"  value={upcoming.length}  icon="📅" />
        <StatCard label="Completed Sessions" value={completed.length} icon="✅" />
        <StatCard label="Total Sessions"     value={sessions.length}  icon="🎯" />
        {user?.role === 'MENTEE' && profileComplete && (
          <StatCard label="Matched Mentors" value={mentors.length} icon="⭐" />
        )}
      </div>

      {/* Upcoming sessions preview */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <h2 className="sb-section-title" style={{ margin: 0 }}>Upcoming Sessions</h2>
            <Link to="/sessions" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {upcoming.slice(0, 3).map(s => (
              <div key={s.id} className="sb-card"
                style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '1rem 1.1rem' }}>
                <div className="sb-avatar">
                  {(user?.role === 'MENTEE' ? s.mentorName : s.menteeName).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Session with {user?.role === 'MENTEE' ? s.mentorName : s.menteeName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                    {new Date(s.scheduledAt).toLocaleString()} · {s.durationMinutes} min
                    {s.agenda && ` · ${s.agenda}`}
                  </div>
                </div>
                <span className={`sb-status status-${s.status.toLowerCase()}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentor recommendations */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <h2 className="sb-section-title" style={{ margin: 0 }}>
            {user?.role !== 'MENTEE' ? 'Top Rated Mentors'
              : profileComplete ? 'Recommended for You'
              : 'Discover Mentors'}
          </h2>
          {user?.role === 'MENTEE' && profileComplete && (
            <Link to="/mentors" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              View all →
            </Link>
          )}
        </div>

        {/* Profile incomplete prompt */}
        {user?.role === 'MENTEE' && !profileComplete ? (
          <div className="sb-card" style={{
            display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap',
            background: 'var(--primary-light)', border: '1.5px solid var(--border-focus)',
          }}>
            <span style={{ fontSize: '2.5rem' }}>🎯</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                Complete your profile to unlock personalised recommendations
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.9rem' }}>
                Tell us your interests and desired skills — we'll match you with the best mentors.
              </p>
              <button className="btn-primary btn-sm" onClick={() => navigate('/profile/mentee')}>
                Complete My Profile →
              </button>
            </div>
          </div>
        ) : mentors.length === 0 ? (
          <div className="sb-empty">
            <div className="sb-empty-icon">🔍</div>
            <div className="sb-empty-title">No mentors available right now</div>
            <div className="sb-empty-desc">Check back later or browse all mentors.</div>
          </div>
        ) : (
          <>
            {user?.role === 'MENTEE' && profileComplete && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '1rem' }}>
                {mentors.length} mentors matched based on your interests and skills
              </p>
            )}
            <div className="mentor-grid">
              {mentors.map(m => <MentorCard key={m.id} mentor={m} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}