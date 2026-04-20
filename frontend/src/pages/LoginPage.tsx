// pages/LoginPage.tsx
// Clean light-theme login — simple two-column with feature highlights
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';

const DEMO_ROLES = [
  { key: 'mentee', label: 'Mentee',  email: 'arjun.patel@mentee.com',   password: 'Mentee@123' },
  { key: 'mentor', label: 'Mentor',  email: 'priya.sharma@mentor.com',  password: 'Mentor@123' },
  { key: 'admin',  label: 'Admin',   email: 'admin@skillbuilder.com',   password: 'Admin@123'  },
];

const FEATURES = [
  { icon: '🎯', text: 'Get matched with expert mentors in your field' },
  { icon: '📅', text: 'Book 1-on-1 sessions at your convenience' },
  { icon: '📈', text: 'Track your skill growth over time' },
];

export default function LoginPage() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [activeDemo, setActiveDemo] = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await loginApi(form);
      login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  const fillDemo = (role: typeof DEMO_ROLES[0]) => {
    setForm({ email: role.email, password: role.password });
    setActiveDemo(role.key);
    setError('');
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 46, height: 46, borderRadius: '14px',
            background: 'rgba(96,165,250,0.18)',
            border: '1.5px solid rgba(96,165,250,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              Skill<span style={{ color: '#60a5fa' }}>Builder</span>
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.5, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' }}>
              Mentoring Platform
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 40, height: 2, background: 'rgba(96,165,250,0.5)', borderRadius: 2, margin: '1.75rem 0' }} />

        <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.25, marginBottom: '0.5rem', letterSpacing: '-0.3px' }}>
          Mentor smarter.<br />Grow faster.
        </h1>
        <p style={{ fontSize: '0.95rem', opacity: 0.7, marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Connect with industry experts, book personalised sessions, and unlock your professional potential.
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

      {/* ── RIGHT panel: login form ── */}
      <div style={{
        flex: '1 1 60%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        background: 'var(--bg-page)',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Header */}
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Sign in to your account
          </p>

          {/* Error */}
          {error && (
            <div className="sb-alert sb-alert-error">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="sb-form-group">
              <label className="sb-label">Email address</label>
              <input
                className="sb-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); setActiveDemo(''); }}
                required
              />
            </div>

            <div className="sb-form-group" style={{ position: 'relative' }}>
              <label className="sb-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="sb-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                  style={{ paddingRight: '2.75rem' }}
                  required
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.2rem',
                }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={loading}
              style={{ padding: '0.7rem', fontSize: '0.9rem', marginBottom: '1.25rem', marginTop: '0.25rem' }}>
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}