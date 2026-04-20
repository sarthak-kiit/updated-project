// pages/ProgressPage.tsx
// US23 — Mentee progress tracking: session notes, skill tags, next suggestions
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProgress, saveSessionNote, getNextSkillSuggestions, getSessionsForUser } from '../services/api';
import { SessionNoteDTO, SessionDTO } from '../types';

const ALL_SKILLS = [
  'Java', 'Spring Boot', 'Python', 'React', 'Angular', 'TypeScript',
  'AWS', 'Docker', 'Kubernetes', 'MySQL', 'MongoDB', 'Microservices',
  'REST APIs', 'Git', 'Agile/Scrum', 'Machine Learning', 'Data Analysis',
  'DevOps', 'Node.js', 'System Design', 'Spring Security', 'Hibernate',
  'Apache Spark', 'Kafka', 'BigQuery', 'Terraform', 'CSS3',
];

// ── Inline note editor ────────────────────────────────────────────────────────
function NoteEditor({ session, existingNote, menteeId, onSaved }: {
  session: SessionDTO;
  existingNote: SessionNoteDTO | null;
  menteeId: number;
  onSaved: (note: SessionNoteDTO) => void;
}) {
  const [notes, setNotes]           = useState(existingNote?.notes ?? '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(existingNote?.skillsTags ?? []);
  const [customSkill, setCustomSkill] = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [open, setOpen]             = useState(false);

  const toggleSkill = (skill: string) =>
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);

  const addCustom = () => {
    const s = customSkill.trim();
    if (!s || selectedSkills.includes(s)) return;
    setSelectedSkills(prev => [...prev, s]);
    setCustomSkill('');
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const saved = await saveSessionNote(menteeId, {
        sessionId: session.id,
        notes: notes.trim() || undefined,
        skillsTags: selectedSkills,
      });
      onSaved(saved);
      setOpen(false);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save note');
    } finally { setSaving(false); }
  };

  if (!open) {
    return (
      <button className="btn-ghost btn-sm" onClick={() => setOpen(true)}
        style={{ marginTop: '0.6rem', fontSize: '0.78rem' }}>
        {existingNote ? '✏️ Edit Notes' : '📝 Add Notes & Tag Skills'}
      </button>
    );
  }

  return (
    <div style={{
      marginTop: '0.75rem', background: 'var(--primary-light)',
      border: '1px solid var(--border-focus)', borderRadius: 'var(--radius-md)', padding: '1rem',
    }}>
      <div className="sb-form-group">
        <label className="sb-label">Personal Notes</label>
        <textarea className="sb-input" rows={3}
          placeholder="What did you learn? What will you practice next?"
          value={notes} onChange={e => setNotes(e.target.value)}
          style={{ resize: 'vertical' }} />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label className="sb-label" style={{ marginBottom: '0.4rem' }}>Skills Covered</label>
        <div>
          {ALL_SKILLS.map(skill => (
            <span key={skill}
              className={`filter-pill${selectedSkills.includes(skill) ? ' active' : ''}`}
              onClick={() => toggleSkill(skill)}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input className="sb-input" placeholder="Custom skill…" value={customSkill}
          onChange={e => setCustomSkill(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())} />
        <button className="btn-primary btn-sm" onClick={addCustom} style={{ flexShrink: 0 }}>Add</button>
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn-ghost btn-sm" onClick={() => { setOpen(false); setError(''); }}>Cancel</button>
        <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const { user }  = useAuth();
  const [notes,    setNotes]    = useState<SessionNoteDTO[]>([]);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getProgress(user.userId).catch(() => []),
      getSessionsForUser(user.userId).catch(() => []),
      getNextSkillSuggestions(user.userId).catch(() => []),
    ]).then(([n, s, sugg]) => {
      setNotes(n as SessionNoteDTO[]);
      setSessions((s as SessionDTO[]).filter((x: SessionDTO) => x.status === 'COMPLETED'));
      setSuggestions(sugg as string[]);
    }).finally(() => setLoading(false));
  }, [user]);

  // All unique tracked skills across notes
  const allTrackedSkills = [...new Set(notes.flatMap(n => n.skillsTags))];

  if (loading) return <div className="sb-spinner-wrap"><div className="sb-spinner" /></div>;

  return (
    <div className="sb-page">
      <div className="sb-page-header">
        <h1 className="sb-page-title">My Learning Progress</h1>
        <p className="sb-page-subtitle">Track skills covered across all mentoring sessions</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-value">{sessions.length}</div>
            <div className="stat-label">Sessions completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div>
            <div className="stat-value">{allTrackedSkills.length}</div>
            <div className="stat-label">Skills tracked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div>
            <div className="stat-value">{notes.length}</div>
            <div className="stat-label">Notes saved</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── Main: sessions with notes ── */}
        <div>
          <h2 className="sb-section-title">Session Notes</h2>
          {sessions.length === 0 ? (
            <div className="sb-empty">
              <div className="sb-empty-icon">📅</div>
              <div className="sb-empty-title">No completed sessions yet</div>
              <div className="sb-empty-desc">Notes will appear here after you complete mentoring sessions.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.map(session => {
                const note = notes.find(n => n.sessionId === session.id) || null;
                return (
                  <div key={session.id} className="sb-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                          Session with {session.mentorName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {new Date(session.scheduledAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })} · {session.durationMinutes} min
                        </div>
                        {session.agenda && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                            {session.agenda}
                          </div>
                        )}
                      </div>
                      <span className="sb-status status-completed">COMPLETED</span>
                    </div>

                    {/* Existing note */}
                    {note && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                        {note.notes && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.5rem', lineHeight: 1.65 }}>
                            {note.notes}
                          </p>
                        )}
                        {note.skillsTags.length > 0 && (
                          <div>
                            {note.skillsTags.map(s => (
                              <span key={s} className="sb-tag">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <NoteEditor session={session} existingNote={note} menteeId={user!.userId}
                      onSaved={saved => setNotes(prev => {
                        const exists = prev.find(n => n.sessionId === saved.sessionId);
                        return exists ? prev.map(n => n.sessionId === saved.sessionId ? saved : n) : [...prev, saved];
                      })} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Skills covered */}
          <div className="sb-card">
            <h3 className="sb-section-title">Skills Covered</h3>
            {allTrackedSkills.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tag skills in your session notes to track them here.
              </p>
            ) : (
              <div>
                {allTrackedSkills.map(s => (
                  <span key={s} className="sb-tag">{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Next skill suggestions */}
          {suggestions.length > 0 && (
            <div className="sb-card">
              <h3 className="sb-section-title">Suggested Next Skills</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                Based on your learning path
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {suggestions.slice(0, 5).map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.4rem 0.6rem', background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem' }}>{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}