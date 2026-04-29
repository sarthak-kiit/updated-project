import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SKILL_CATEGORIES = ['Backend', 'Frontend', 'DevOps', 'Cloud', 'Data', 'Architecture', 'Mobile', 'Database', 'Tools', 'Management', 'Other'];
const INDUSTRIES       = ['Technology', 'FinTech', 'Cloud Computing', 'E-Commerce', 'Healthcare', 'Education', 'Data Science', 'Consulting', 'Startups'];
const EXPERTISE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'];
const DAYS             = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const TOTAL_STEPS      = 4;

interface Skill        { skillName: string; category: string; expertiseLevel: string; }
interface WorkExp      { companyName: string; jobTitle: string; startDate: string; endDate: string; currentJob: boolean; description: string; }
interface Availability { dayOfWeek: string; startTime: string; endTime: string; recurring: boolean; timezone: string; blockedDates: string[]; }

/** Convert "YYYY-MM-DD" (LocalDate.toString) → "YYYY-MM" for <input type="month"> */
const toMonthValue = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  return dateStr.length >= 7 ? dateStr.substring(0, 7) : dateStr;
};

function StepBar({ current }: { current: number }) {
  const labels = ['Basic Info', 'Experience', 'Skills', 'Availability'];
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
                color: isPending ? 'var(--text-primary)' : 'var(--text-primary)',
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

export default function MentorProfileBuilderPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]   = useState('');

  const [basic, setBasic] = useState({
    headline: '', company: '', designation: '',
    yearsOfExperience: '', education: '', professionalSummary: '', industries: [] as string[],
  });

  const [experiences, setExperiences] = useState<WorkExp[]>([
    { companyName: '', jobTitle: '', startDate: '', endDate: '', currentJob: false, description: '' },
  ]);

  const [skills, setSkills] = useState<Skill[]>([
    { skillName: '', category: 'Backend', expertiseLevel: 'INTERMEDIATE' },
  ]);

  const [availabilities, setAvailabilities] = useState<Availability[]>([
    { dayOfWeek: 'MONDAY', startTime: '18:00', endTime: '20:00', recurring: true, timezone: 'IST', blockedDates: [] },
  ]);

  useEffect(() => {
    if (!user) return;
    axios.get(`/mentors/user/${user.userId}`).then(res => {
      const p = res.data;
      setBasic({
        headline:            p.headline            || '',
        company:             p.company             || '',
        designation:         p.designation         || '',
        yearsOfExperience:   p.yearsOfExperience?.toString() || '',
        education:           p.education           || '',
        professionalSummary: p.professionalSummary || '',
        industries:          p.industries          || [],
      });

      if (p.skills?.length) {
        setSkills(p.skills.map((s: any) => ({
          skillName:      s.skillName      || '',
          category:       s.category       || 'Backend',
          expertiseLevel: s.expertiseLevel || 'INTERMEDIATE',
        })));
      }

      if (p.workExperiences?.length) {
        setExperiences(p.workExperiences.map((w: any) => ({
          companyName: w.companyName || '',
          jobTitle:    w.jobTitle    || '',
          // FIX 1: Backend returns LocalDate.toString() = "YYYY-MM-DD".
          //         <input type="month"> needs "YYYY-MM". Truncate to 7 chars.
          startDate:   toMonthValue(w.startDate),
          endDate:     toMonthValue(w.endDate),
          currentJob:  w.currentJob  || false,
          description: w.description || '',
        })));
      }

      if (p.availabilities?.length) {
        setAvailabilities(p.availabilities.map((a: any) => ({
          dayOfWeek:    a.dayOfWeek    || 'MONDAY',
          startTime:    a.startTime    || '18:00',
          endTime:      a.endTime      || '20:00',
          recurring:    a.recurring    ?? true,
          timezone:     a.timezone     || 'IST',
          blockedDates: a.blockedDates || [],
        })));
      }
    }).catch(() => {
      // No existing profile — keep defaults (first-time setup)
    });
  }, [user]);

  // ── Skill helpers ──────────────────────────────────────────────
  const addSkill    = () => { if (skills.length >= 20) { setError('Maximum 20 skills allowed'); return; } setSkills([...skills, { skillName: '', category: 'Backend', expertiseLevel: 'INTERMEDIATE' }]); };
  const removeSkill = (i: number) => setSkills(skills.filter((_, idx) => idx !== i));
  const updateSkill = (i: number, field: keyof Skill, value: string) => { const u = [...skills]; u[i] = { ...u[i], [field]: value }; setSkills(u); };

  // ── Experience helpers ─────────────────────────────────────────
  const addExp    = () => setExperiences([...experiences, { companyName: '', jobTitle: '', startDate: '', endDate: '', currentJob: false, description: '' }]);
  const removeExp = (i: number) => setExperiences(experiences.filter((_, idx) => idx !== i));
  const updateExp = (i: number, field: keyof WorkExp, value: any) => { const u = [...experiences]; u[i] = { ...u[i], [field]: value }; setExperiences(u); };

  // ── Availability helpers ───────────────────────────────────────
  const addAvail    = () => setAvailabilities([...availabilities, { dayOfWeek: 'MONDAY', startTime: '18:00', endTime: '20:00', recurring: true, timezone: 'IST', blockedDates: [] }]);
  const removeAvail = (i: number) => setAvailabilities(availabilities.filter((_, idx) => idx !== i));
  const updateAvail = (i: number, field: keyof Availability, value: any) => { const u = [...availabilities]; u[i] = { ...u[i], [field]: value }; setAvailabilities(u); };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!basic.headline.trim()) {
      setError('Please enter a headline');
      setStep(1);
      return;
    }

    // Client-side availability validation before hitting the server
    for (let i = 0; i < availabilities.length; i++) {
      const a = availabilities[i];
      if (!a.startTime || !a.endTime) {
        setError(`Availability slot ${i + 1}: start and end time are required.`);
        return;
      }
      if (a.startTime >= a.endTime) {
        setError(`Availability slot ${i + 1}: end time must be after start time.`);
        return;
      }
    }

    const validSkills = skills.filter(s => s.skillName.trim());
    setSaving(true);
    try {
      await axios.put(`/mentors/profile/${user!.userId}`, {
        headline:            basic.headline,
        company:             basic.company,
        designation:         basic.designation,
        yearsOfExperience:   basic.yearsOfExperience ? Number(basic.yearsOfExperience) : null,
        education:           basic.education,
        professionalSummary: basic.professionalSummary,
        industries:          basic.industries,
        skills:              validSkills,
        workExperiences:     experiences.filter(e => e.companyName.trim()),
        availabilities:      availabilities,
      });

      setSuccess('Profile saved successfully! Redirecting…');
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err: any) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : null)
        || 'Failed to save profile. Please check your inputs and try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputRow = (label: string, value: string, onChange: (v: string) => void, props?: any) => (
    <div className="sb-form-group">
      <label className="sb-label">{label}</label>
      <input className="sb-input" value={value} onChange={e => onChange(e.target.value)} {...props} />
    </div>
  );

  return (
    <div className="sb-page" style={{ maxWidth: 780 }}>
      <div className="sb-page-header">
        <h1 className="sb-page-title">Build Your Mentor Profile</h1>
        <p className="sb-page-subtitle">Showcase your expertise to attract the right mentees</p>
      </div>

      <div className="sb-card">
        <StepBar current={step} />

        {error   && <div className="sb-alert sb-alert-error">{error}</div>}
        {success && <div className="sb-alert sb-alert-success">✅ {success}</div>}

        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              {inputRow('Professional Headline *', basic.headline, v => setBasic({...basic, headline: v}), { placeholder: 'e.g. Senior Java Engineer at TCS' })}
              {inputRow('Company', basic.company, v => setBasic({...basic, company: v}), { placeholder: 'e.g. Infosys' })}
              {inputRow('Designation', basic.designation, v => setBasic({...basic, designation: v}), { placeholder: 'e.g. Technical Lead' })}
              {inputRow('Years of Experience', basic.yearsOfExperience, v => setBasic({...basic, yearsOfExperience: v}), { type: 'number', placeholder: '5' })}
              <div className="sb-form-group" style={{ gridColumn: '1 / -1' }}>
                {inputRow('Education', basic.education, v => setBasic({...basic, education: v}), { placeholder: 'e.g. B.Tech Computer Science, IIT Delhi' })}
              </div>
            </div>

            <div className="sb-form-group">
              <label className="sb-label">Professional Summary</label>
              <textarea className="sb-input" rows={3}
                placeholder="Brief overview of your expertise and mentoring style…"
                value={basic.professionalSummary}
                onChange={e => setBasic({...basic, professionalSummary: e.target.value})}
                style={{ resize: 'vertical' }} />
            </div>

            <div className="sb-form-group">
              <label className="sb-label">Industries</label>
              <div>
                {INDUSTRIES.map(i => (
                  <span key={i}
                    className={`filter-pill${basic.industries.includes(i) ? ' active' : ''}`}
                    onClick={() => setBasic(b => ({ ...b, industries: b.industries.includes(i) ? b.industries.filter(x => x !== i) : [...b.industries, i] }))}>
                    {i}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Work Experience ── */}
        {step === 2 && (
          <div>
            {experiences.map((exp, i) => (
              <div key={i} className="sb-section-box" style={{ position: 'relative' }}>
                {experiences.length > 1 && (
                  <button className="btn-ghost btn-sm" onClick={() => removeExp(i)}
                    style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', color: 'var(--danger)', fontSize: '0.75rem' }}>
                    Remove
                  </button>
                )}
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Experience {i + 1}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <div className="sb-form-group">
                    <label className="sb-label">Company Name</label>
                    <input className="sb-input" placeholder="Infosys" value={exp.companyName}
                      onChange={e => updateExp(i, 'companyName', e.target.value)} />
                  </div>
                  <div className="sb-form-group">
                    <label className="sb-label">Job Title</label>
                    <input className="sb-input" placeholder="Senior Engineer" value={exp.jobTitle}
                      onChange={e => updateExp(i, 'jobTitle', e.target.value)} />
                  </div>
                  <div className="sb-form-group">
                    <label className="sb-label">Start Date</label>
                    {/* type="month" requires "YYYY-MM". toMonthValue() ensures correct format on load. */}
                    <input
                      className="sb-input"
                      type="month"
                      value={exp.startDate}
                      max={new Date().toISOString().substring(0, 7)}
                      onChange={e => updateExp(i, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className="sb-form-group">
                    <label className="sb-label">End Date</label>
                    <input
                      className="sb-input"
                      type="month"
                      value={exp.endDate}
                      max={new Date().toISOString().substring(0, 7)}
                      disabled={exp.currentJob}
                      onChange={e => updateExp(i, 'endDate', e.target.value)}
                      style={{ opacity: exp.currentJob ? 0.5 : 1, cursor: exp.currentJob ? 'not-allowed' : 'auto' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input type="checkbox" id={`curr-${i}`} checked={exp.currentJob}
                    onChange={e => {
                      updateExp(i, 'currentJob', e.target.checked);
                      if (e.target.checked) updateExp(i, 'endDate', '');
                    }} />
                  <label htmlFor={`curr-${i}`} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    I currently work here
                  </label>
                </div>
                <div className="sb-form-group">
                  <label className="sb-label">Description</label>
                  <textarea className="sb-input" rows={2}
                    placeholder="Brief description of your role and achievements…"
                    value={exp.description}
                    onChange={e => updateExp(i, 'description', e.target.value)}
                    style={{ resize: 'vertical' }} />
                </div>
              </div>
            ))}
            <button className="btn-ghost" onClick={addExp} style={{ fontSize: '0.85rem' }}>
              + Add Another Experience
            </button>
          </div>
        )}

        {/* ── Step 3: Skills ── */}
        {step === 3 && (
          <div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Add up to 20 skills. Select the category and expertise level for each.
            </p>

            {skills.map((skill, i) => (

              <div key={i} className="sb-section-box" style={{ marginBottom: '0.75rem', position: 'relative' }}>
                {skills.length > 1 && (
                  <button className="btn-ghost btn-sm" onClick={() => removeSkill(i)}
                    style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', color: 'var(--danger)', fontSize: '0.72rem' }}>
                    ✕
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: '0.75rem', alignItems: 'end', paddingRight: '3rem' }}>

                  <div className="sb-form-group" style={{ marginBottom: 0 }}>
                    <label className="sb-label">Skill Name</label>
                    <input className="sb-input" placeholder="e.g. Spring Boot"
                    value={skill.skillName} onChange={e => updateSkill(i, 'skillName', e.target.value)} />
                  </div>

                  <div className="sb-form-group" style={{ marginBottom: 0 }}>
                    <label className="sb-label">Category</label>
                    <select className="sb-input" value={skill.category}
                      onChange={e => updateSkill(i, 'category', e.target.value)}>
                      {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>


                  <div className="sb-form-group" style={{ marginBottom: 0 }}>
                    <label className="sb-label">Expertise</label>
                    <select className="sb-input" value={skill.expertiseLevel}
                      onChange={e => updateSkill(i, 'expertiseLevel', e.target.value)}>
                      {EXPERTISE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>


                </div>
              </div>
            ))}

            {skills.length < 20 && (
              <button className="btn-ghost" onClick={addSkill} style={{ fontSize: '0.85rem' }}>
                + Add Skill
              </button>
            )}
            
          </div>
        )}

        {/* ── Step 4: Availability (US03) ── */}
        {step === 4 && (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Set your weekly availability so mentees can book sessions when you&apos;re free.
              You can also block specific dates for vacation or unavailability.
            </p>

            {availabilities.map((avail, i) => {
              // US03 AC3: helper to add a block-off date to this slot
              const addBlockedDate = (date: string) => {
                if (!date) return;
                const u = [...availabilities];
                const existing = u[i].blockedDates || [];
                if (!existing.includes(date)) {
                  u[i] = { ...u[i], blockedDates: [...existing, date].sort() };
                  setAvailabilities(u);
                }
              };
              const removeBlockedDate = (date: string) => {
                const u = [...availabilities];
                u[i] = { ...u[i], blockedDates: (u[i].blockedDates || []).filter(d => d !== date) };
                setAvailabilities(u);
              };

              return (
                <div key={i} className="sb-section-box" style={{ marginBottom: '0.75rem', position: 'relative' }}>
                  {availabilities.length > 1 && (
                    <button className="btn-ghost btn-sm" onClick={() => removeAvail(i)}
                      style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', color: 'var(--danger)', fontSize: '0.72rem' }}>
                      ✕
                    </button>
                  )}

                  {/* ── AC1: Day + time slot ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: '0.75rem', alignItems: 'end', paddingRight: '3rem' }}>
                    <div className="sb-form-group" style={{ marginBottom: 0 }}>
                      <label className="sb-label">Day</label>
                      <select className="sb-input" value={avail.dayOfWeek}
                        onChange={e => updateAvail(i, 'dayOfWeek', e.target.value)}>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="sb-form-group" style={{ marginBottom: 0 }}>
                      <label className="sb-label">Start</label>
                      <input className="sb-input" type="time" value={avail.startTime}
                        onChange={e => updateAvail(i, 'startTime', e.target.value)} />
                    </div>
                    <div className="sb-form-group" style={{ marginBottom: 0 }}>
                      <label className="sb-label">End</label>
                      <input className="sb-input" type="time" value={avail.endTime}
                        onChange={e => updateAvail(i, 'endTime', e.target.value)} />
                    </div>
                    {/* AC4: Timezone clearly displayed and adjustable */}
                    <div className="sb-form-group" style={{ marginBottom: 0 }}>
                      <label className="sb-label">Timezone</label>
                      <select className="sb-input" value={avail.timezone}
                        onChange={e => updateAvail(i, 'timezone', e.target.value)}>
                        {['IST','UTC','EST','PST','CET','SGT','JST','AEST'].map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* AC2: Recurring weekly pattern */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <input type="checkbox" id={`rec-${i}`} checked={avail.recurring}
                      onChange={e => updateAvail(i, 'recurring', e.target.checked)} />
                    <label htmlFor={`rec-${i}`} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      Repeats every week (recurring)
                    </label>
                    {avail.recurring && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700, marginLeft: '0.25rem' }}>↺ Weekly</span>
                    )}
                  </div>

                  {/* AC3: Block-off dates for vacation / unavailability */}
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)',
                      textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.5rem' }}>
                      Block Off Dates (Vacation / Unavailability)
                    </div>
                    {(avail.blockedDates || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                        {(avail.blockedDates || []).map(d => (
                          <span key={d} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: 'var(--danger-bg)', border: '1px solid #fca5a5',
                            color: 'var(--danger)', borderRadius: 'var(--radius-sm)',
                            padding: '0.2rem 0.5rem', fontSize: '0.78rem', fontWeight: 600,
                          }}>
                            🚫 {d}
                            <span onClick={() => removeBlockedDate(d)}
                              style={{ cursor: 'pointer', fontWeight: 700, marginLeft: '0.15rem' }}>✕</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        className="sb-input"
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        style={{ flex: '0 0 auto', width: 'auto', fontSize: '0.82rem' }}
                        onChange={e => { if (e.target.value) { addBlockedDate(e.target.value); e.target.value = ''; } }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Pick a date to block (e.g. public holiday or vacation day)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            <button className="btn-ghost" onClick={addAvail} style={{ fontSize: '0.85rem' }}>
              + Add Availability Slot
            </button>

            <div style={{
              marginTop: '1rem', padding: '0.75rem', background: 'var(--primary-light)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-focus)',
              fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500,
            }}>
              💡 <strong>Tip:</strong> Changes you save here update your booking availability immediately.
              Mentees will see your available slots and any blocked dates when scheduling a session.
            </div>
          </div>
        )}

        {/* Navigation */}
        <hr className="sb-divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
          <button className="btn-ghost"
            onClick={() => step === 1 ? navigate('/dashboard') : setStep(s => s - 1)}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step < TOTAL_STEPS ? (
            <button className="btn-primary" onClick={() => { setError(''); setStep(s => s + 1); }}>
              Next →
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}