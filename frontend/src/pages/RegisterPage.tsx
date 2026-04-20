// pages/RegisterPage.tsx
// Two-column layout matching LoginPage — blue left panel + form right
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../services/api';

const ROLES = [
  {
    key: 'MENTEE' as const,
    title: 'Join as Mentee',
    desc: 'Find expert mentors and grow your career',
    perks: ['Browse 100+ verified mentors', 'Book 1-on-1 sessions', 'Track skill growth'],
    icon: '🎓',
  },
  {
    key: 'MENTOR' as const,
    title: 'Join as Mentor',
    desc: 'Share expertise and inspire the next generation',
    perks: ['Build a professional profile', 'Set your own availability', 'Earn reviews & recognition'],
    icon: '🧑‍💼',
  },
];

const FEATURES = [
  { icon: '🎯', text: 'Get matched with expert mentors in your field' },
  { icon: '📅', text: 'Book 1-on-1 sessions at your convenience' },
  { icon: '📈', text: 'Track your skill growth over time' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    role: 'MENTEE' as 'MENTOR' | 'MENTEE',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await registerApi(form);
      login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const selectedRole = ROLES.find(r => r.key === form.role)!;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT panel: brand + features ── */}
      <div style={{
        flex: '1 1 40%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem 3.5rem',
        background: 'linear-gradient(160deg, #1e40af 0%, #2563eb 55%, #3b82f6 100%)',
        color: '#fff',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.2px' }}>
            SkillBuilder
          </span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.25, marginBottom: '0.75rem', letterSpacing: '-0.3px' }}>
          Start your learning journey today
        </h1>
        <p style={{ fontSize: '0.95rem', opacity: 0.85, marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Join thousands of professionals connecting with expert mentors to accelerate their careers.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              }}>{f.icon}</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '2.5rem', paddingTop: '2rem',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', gap: '2rem',
        }}>
          {[['100+', 'Mentors'], ['500+', 'Sessions'], ['4.8★', 'Avg Rating']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.65, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT panel: register form ── */}
      <div style={{
        flex: '1 1 60%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        background: 'var(--bg-page)',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* Header */}
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            Create your account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Join as a mentee or mentor — it's free
          </p>

          {/* Role selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)',
              letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              I want to join as…
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {ROLES.map(r => (
                <button key={r.key} type="button" onClick={() => setForm(f => ({ ...f, role: r.key }))}
                  style={{
                    padding: '0.9rem 0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    border: form.role === r.key ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: form.role === r.key ? 'var(--primary-light)' : 'var(--bg-white)',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>{r.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem',
                    color: form.role === r.key ? 'var(--primary)' : 'var(--text-primary)',
                    marginBottom: '0.2rem' }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {r.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Perks */}
            <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {selectedRole.perks.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span> {p}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>fill in your details</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Error */}
          {error && <div className="sb-alert sb-alert-error">⚠️ {error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="sb-form-group">
              <label className="sb-label">Full name</label>
              <input className="sb-input" type="text" placeholder="Your full name"
                value={form.fullName}
                onChange={e => { setForm({ ...form, fullName: e.target.value }); setError(''); }}
                required />
            </div>

            <div className="sb-form-group">
              <label className="sb-label">Email address</label>
              <input className="sb-input" type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }}
                required />
            </div>

            <div className="sb-form-group">
              <label className="sb-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="sb-input"
                  type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={form.password}
                  style={{ paddingRight: '2.75rem' }}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                  required />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.2rem',
                }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary btn-full"
              disabled={loading}
              style={{ padding: '0.7rem', fontSize: '0.9rem', marginBottom: '1.25rem', marginTop: '0.25rem' }}>
              {loading ? 'Creating account…' : `Create ${form.role === 'MENTEE' ? 'Mentee' : 'Mentor'} Account`}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}