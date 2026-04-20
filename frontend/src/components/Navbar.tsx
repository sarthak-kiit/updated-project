import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="sb-navbar">
      <span className="sb-brand" onClick={() => navigate('/dashboard')}>
        <span style={{
          width: 28, height: 28, borderRadius: '8px',
          background: 'rgba(96,165,250,0.18)',
          border: '1px solid rgba(96,165,250,0.35)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </span>
        Skill<span className="sb-brand-dot">Builder</span>
      </span>

      <div className="sb-nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
        {user.role === 'MENTEE' && <NavLink to="/mentors" className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>Browse Mentors</NavLink>}
        <NavLink to="/sessions" className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>{user.role === 'MENTOR' ? 'My Sessions' : 'Sessions'}</NavLink>
        {user.role === 'MENTEE' && <NavLink to="/favorites" className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>Favourites</NavLink>}
        {user.role === 'MENTEE' && <NavLink to="/profile/mentee" className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>My Profile</NavLink>}
        {user.role === 'MENTEE' && <NavLink to="/progress" className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>My Progress</NavLink>}
        {user.role === 'MENTOR' && <NavLink to="/profile/build" className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>Build Profile</NavLink>}
        {user.role === 'MENTOR' && <NavLink to="/mentor/reviews" className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>My Reviews</NavLink>}
        {user.role === 'ADMIN'  && <NavLink to="/admin/analytics" className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>Analytics</NavLink>}
      </div>

      <div className="sb-navbar-right">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(96,165,250,0.2)', color: '#93c5fd', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, border: '1px solid rgba(96,165,250,0.35)' }}>{initials}</span>
          <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.85)' }}>{user.fullName}</span>
          <span className="sb-role-badge">{user.role}</span>
        </span>
        <button onClick={handleLogout} className="btn-ghost btn-sm" style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.15)' }}>Sign out</button>
      </div>
    </nav>
  );
}