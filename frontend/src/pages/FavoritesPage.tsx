// pages/FavoritesPage.tsx
// US08 — Mentee favourites list — light theme
import React, { useEffect, useState } from 'react';
import { getFavorites, removeFavorite } from '../services/api';
import { MentorProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import MentorCard from '../components/MentorCard';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<MentorProfile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState('');

  const load = () => {
    if (!user) return;
    getFavorites(user.userId)
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user]);

  const handleRemove = async (mentorUserId: number, name: string) => {
    if (!user) return;
    await removeFavorite(user.userId, mentorUserId).catch(() => {});
    setFavorites(prev => prev.filter(m => m.userId !== mentorUserId));
    setToast(`${name} removed from favourites`);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="sb-page">

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '4.5rem', right: '1.5rem', zIndex: 2000,
          background: 'var(--text-primary)', color: '#fff',
          padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem', boxShadow: 'var(--shadow-md)',
        }}>
          {toast}
        </div>
      )}

      <div className="sb-page-header">
        <h1 className="sb-page-title">Favourite Mentors</h1>
        <p className="sb-page-subtitle">{favorites.length} saved mentor{favorites.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="sb-spinner-wrap"><div className="sb-spinner" /></div>
      ) : favorites.length === 0 ? (
        <div className="sb-empty">
          <div className="sb-empty-icon">🤍</div>
          <div className="sb-empty-title">No saved mentors yet</div>
          <div className="sb-empty-desc">Browse mentors and click Save to add them here.</div>
        </div>
      ) : (
        <div className="mentor-grid">
          {favorites.map(m => (
            <div key={m.id} style={{ position: 'relative' }}>
              <MentorCard mentor={m} />
              <button
                onClick={() => handleRemove(m.userId, m.fullName)}
                style={{
                  position: 'absolute', top: '0.9rem', right: '0.9rem',
                  background: 'var(--danger-bg)', border: '1px solid #fca5a5',
                  borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem',
                  cursor: 'pointer', fontSize: '0.75rem', color: 'var(--danger)',
                  fontWeight: 600, zIndex: 1,
                }}>
                Remove ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
