// pages/AdminAnalyticsPage.tsx
// US20 — Skill demand analytics with period filter and CSV export
import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface SkillAnalyticsDTO {
  skillName: string;
  requestCount: number;
  sessionCount: number;
  mentorCount: number;
}

type Period = 'all' | 'week' | 'month' | 'quarter';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'All time',    value: 'all'     },
  { label: 'This week',   value: 'week'    },
  { label: 'This month',  value: 'month'   },
  { label: 'This quarter',value: 'quarter' },
];

export default function AdminAnalyticsPage() {
  const [data,    setData]    = useState<SkillAnalyticsDTO[]>([]);
  const [period,  setPeriod]  = useState<Period>('all');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { fetchAnalytics(period); }, [period]);

  const fetchAnalytics = async (p: Period) => {
    setLoading(true); setError('');
    try {
      const params = p !== 'all' ? `?period=${p}` : '';
      const res = await api.get(`/admin/analytics/skills${params}`);
      setData(res.data);
    } catch {
      setError('Failed to load analytics. Make sure you are logged in as admin.');
    } finally { setLoading(false); }
  };

  const handleExport = () => {
    const params = period !== 'all' ? `?period=${period}` : '';
    window.open(`/admin/analytics/skills/export${params}`, '_blank');
  };

  const maxRequest = data.length > 0 ? Math.max(...data.map(d => d.requestCount)) : 1;
  const totalRequests = data.reduce((s, d) => s + d.requestCount, 0);
  const totalSessions = data.reduce((s, d) => s + d.sessionCount, 0);

  return (
    <div className="sb-page" style={{ maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="sb-page-title">Skill Demand Analytics</h1>
          <p className="sb-page-subtitle">Top 20 most requested skills by mentees</p>
        </div>
        <button className="btn-primary" onClick={handleExport}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Period pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`filter-pill${period === p.value ? ' active' : ''}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <div className="stat-value">{data.length}</div>
            <div className="stat-label">Skills tracked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div>
            <div className="stat-value">{totalRequests}</div>
            <div className="stat-label">Total requests</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-value">{totalSessions}</div>
            <div className="stat-label">Session tags</div>
          </div>
        </div>
      </div>

      {error && <div className="sb-alert sb-alert-error">{error}</div>}

      {/* Data table */}
      {loading ? (
        <div className="sb-spinner-wrap"><div className="sb-spinner" /></div>
      ) : (
        <div className="sb-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                {['#', 'Skill', 'Demand', 'Requests', 'Sessions', 'Mentors'].map((h, i) => (
                  <th key={h} style={{
                    padding: '0.75rem 1rem',
                    textAlign: i >= 3 ? 'right' : 'left',
                    color: 'var(--text-muted)', fontWeight: 600,
                    fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.3px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No skill data found for the selected period.
                  </td>
                </tr>
              )}
              {data.map((row, i) => {
                const barPct = Math.round((row.requestCount / maxRequest) * 100);
                return (
                  <tr key={row.skillName}
                    style={{ borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'var(--bg-white)' : 'var(--bg-page)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {row.skillName}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', minWidth: 140 }}>
                      <div className="sb-progress-bar">
                        <div className="sb-progress-fill" style={{ width: `${barPct}%` }} />
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <span className="sb-tag" style={{ margin: 0 }}>{row.requestCount}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {row.sessionCount}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {row.mentorCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        <strong>Requests</strong> = mentees who listed this skill as desired. &nbsp;
        <strong>Sessions</strong> = completed sessions where mentee tagged this skill. &nbsp;
        <strong>Mentors</strong> = mentors offering this skill.
      </p>
    </div>
  );
}
