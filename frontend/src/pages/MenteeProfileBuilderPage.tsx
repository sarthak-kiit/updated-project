// pages/MenteeProfileBuilderPage.tsx
// US02 — Mentee profile with interests, desired skills, career goals — 3 steps
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMenteeByUserId, updateMenteeProfile } from '../services/api';
import { MenteeProfile } from '../types';

const INTERESTS = [
  'Technology', 'FinTech', 'Cloud Computing', 'E-Commerce',
  'Healthcare', 'Education', 'Data Science', 'Project Management',
  'Consulting', 'Startups', 'Banking', 'Cybersecurity',
  'Manufacturing', 'Media & Entertainment', 'Retail',
];

const SUGGESTED_SKILLS: Record<string, string[]> = {
  'Technology':      ['Java', 'Spring Boot', 'Python', 'React', 'System Design'],
  'FinTech':         ['Java', 'REST APIs', 'MySQL', 'Spring Security'],
  'Cloud Computing': ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
  'Data Science':    ['Python', 'Machine Learning', 'SQL', 'Data Analysis'],
  'E-Commerce':      ['React', 'Node.js', 'MySQL', 'REST APIs'],
  'Cybersecurity':   ['Network Security', 'Python', 'Linux', 'Ethical Hacking'],
};

const ALL_SKILLS = [
  'Java', 'Spring Boot', 'Python', 'React', 'Angular', 'TypeScript',
  'AWS', 'Docker', 'Kubernetes', 'MySQL', 'MongoDB', 'Microservices',
  'REST APIs', 'Git', 'Agile/Scrum', 'Machine Learning', 'Data Analysis',
  'DevOps', 'Node.js', 'System Design', 'Spring Security', 'Hibernate',
];

const CAREER_GOALS = [
  'Get job ready', 'Switch career', 'Learn new technology',
  'Improve coding skills', 'Crack technical interviews',
  'Build real-world projects', 'Get promoted', 'Start a startup',
  'Improve system design skills', 'Get certified',
];

const TOTAL_STEPS = 3;

function StepBar({ current }: { current: number }) {
  const labels = ['Career & Interests', 'Desired Skills', 'Career Goals'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
      {labels.map((label, i) => {
        const s = i + 1;
        const isActive  = s === current;
        const isDone    = s < current;
        const isPending = s > current;
        return (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                background: isDone ? 'var(--primary)' : isActive ? 'var(--primary)' : '#94a3b8',
                color: '#fff',
              }}>
                {isDone ? '✓' : s}
              </div>
              <span style={{
                fontSize: '0.78rem', flexShrink: 0,
                fontWeight: isActive ? 700 : 600,
                color: 'var(--text-primary)',
              }}>
                {label}
              </span>
            </div>
            {s < TOTAL_STEPS && <div style={{ flex: 1, minWidth: 12, height: 2, background: s < current ? 'var(--primary)' : 'var(--border)' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function MenteeProfileBuilderPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]   = useState('');

  const [careerObjectives, setCareerObjectives] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [desiredSkills, setDesiredSkills]         = useState<string[]>([]);
  const [customSkill, setCustomSkill]             = useState('');
  const [selectedGoals, setSelectedGoals]         = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    getMenteeByUserId(user.userId)
      .then((p: MenteeProfile) => {
        setCareerObjectives(p.careerObjectives || '');
        if (p.interests?.length)    setSelectedInterests(p.interests);
        if (p.desiredSkills?.length) setDesiredSkills(p.desiredSkills);
        if (p.careerGoals?.length)  setSelectedGoals(p.careerGoals);
      })
      .catch(() => {});
  }, [user]);

  const toggle = <T extends string>(arr: T[], item: T, set: React.Dispatch<React.SetStateAction<T[]>>) =>
    set(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const addCustomSkill = () => {
    const s = customSkill.trim();
    if (!s || desiredSkills.includes(s)) return;
    setDesiredSkills(prev => [...prev, s]);
    setCustomSkill('');
  };

  const suggestedSkills = [...new Set(selectedInterests.flatMap(i => SUGGESTED_SKILLS[i] || []))];

  const handleSubmit = async () => {
    setError('');
    if (!careerObjectives.trim()) { setError('Please enter your career objectives'); return; }
    if (selectedInterests.length === 0) { setError('Please select at least one area of interest'); return; }
    setSaving(true);
    try {
      await updateMenteeProfile(user!.userId, {
        careerObjectives,
        interests: selectedInterests,
        desiredSkills,
        careerGoals: selectedGoals,
      });
      setSuccess('Profile saved! Redirecting to dashboard…');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally { setSaving(false); }
  };

  const stepTitles = [
    'Career Objectives & Interests',
    'Skills You Want to Learn',
    'Career Goals',
  ];

  return (
    <div className="sb-page" style={{ maxWidth: 680 }}>
      <div className="sb-page-header">
        <h1 className="sb-page-title">Build Your Profile</h1>
        <p className="sb-page-subtitle">Help us find the right mentors for you</p>
      </div>

      <div className="sb-card">
        <StepBar current={step} />

        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
          {stepTitles[step - 1]}
        </h2>

        {error   && <div className="sb-alert sb-alert-error">{error}</div>}
        {success && <div className="sb-alert sb-alert-success">✅ {success}</div>}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div>
            <div className="sb-form-group">
              <label className="sb-label">Career Objectives *</label>
              <textarea className="sb-input" rows={3}
                placeholder="e.g. I want to become a backend engineer specialising in Java microservices…"
                value={careerObjectives}
                onChange={e => { setCareerObjectives(e.target.value); setError(''); }}
                style={{ resize: 'vertical' }} />
            </div>

            <div className="sb-form-group">
              <label className="sb-label">Industry Interests *</label>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Select one or more — we'll suggest matching skills and mentors
              </p>
              <div>
                {INTERESTS.map(i => (
                  <span key={i}
                    className={`filter-pill${selectedInterests.includes(i) ? ' active' : ''}`}
                    onClick={() => { toggle(selectedInterests, i, setSelectedInterests); setError(''); }}>
                    {i}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div>
            {suggestedSkills.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="sb-label" style={{ marginBottom: '0.4rem' }}>
                  ✨ Suggested based on your interests
                </label>
                <div>
                  {suggestedSkills.map(s => (
                    <span key={s}
                      className={`filter-pill${desiredSkills.includes(s) ? ' active' : ''}`}
                      onClick={() => toggle(desiredSkills, s, setDesiredSkills)}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="sb-label" style={{ marginBottom: '0.4rem' }}>All Skills</label>
              <div>
                {ALL_SKILLS.map(s => (
                  <span key={s}
                    className={`filter-pill${desiredSkills.includes(s) ? ' active' : ''}`}
                    onClick={() => toggle(desiredSkills, s, setDesiredSkills)}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="sb-form-group">
              <label className="sb-label">Add a custom skill</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="sb-input" placeholder="e.g. GraphQL, Rust…"
                  value={customSkill} onChange={e => setCustomSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())} />
                <button className="btn-primary" onClick={addCustomSkill}
                  style={{ flexShrink: 0 }}>Add</button>
              </div>
            </div>

            {desiredSkills.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <label className="sb-label" style={{ marginBottom: '0.4rem' }}>
                  Selected ({desiredSkills.length})
                </label>
                <div>
                  {desiredSkills.map(s => (
                    <span key={s} className="sb-tag"
                      onClick={() => toggle(desiredSkills, s, setDesiredSkills)}
                      style={{ cursor: 'pointer' }}>
                      {s} ✕
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              What are you hoping to achieve? Select all that apply.
            </p>
            <div>
              {CAREER_GOALS.map(g => (
                <span key={g}
                  className={`filter-pill${selectedGoals.includes(g) ? ' active' : ''}`}
                  onClick={() => toggle(selectedGoals, g, setSelectedGoals)}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <hr className="sb-divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
          <button className="btn-ghost"
            onClick={() => step === 1 ? navigate('/dashboard') : setStep(s => s - 1)}
            style={{ minWidth: 100 }}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step < TOTAL_STEPS ? (
            <button className="btn-primary"
              onClick={() => {
                if (step === 1 && !careerObjectives.trim()) { setError('Please enter your career objectives'); return; }
                if (step === 1 && selectedInterests.length === 0) { setError('Please select at least one interest'); return; }
                setError('');
                setStep(s => s + 1);
              }}
              style={{ minWidth: 100 }}>
              Next →
            </button>
          ) : (
            <button className="btn-primary"
              onClick={handleSubmit} disabled={saving}
              style={{ minWidth: 140 }}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}