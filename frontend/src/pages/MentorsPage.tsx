// pages/MentorsPage.tsx
// US05 + US06: filter by industry + skill with multiple selection
import React, { useEffect, useState, useCallback } from 'react';
import { getAllMentors } from '../services/api';
import { MentorProfile } from '../types';
import MentorCard from '../components/MentorCard';

const INDUSTRIES = [
  'Technology', 'FinTech', 'Cloud Computing', 'E-Commerce',
  'Healthcare', 'Education', 'Data Science', 'Consulting', 'Startups',
];

const SKILLS = [
  'Java', 'Spring Boot', 'React', 'Angular', 'AWS', 'Docker',
  'Kubernetes', 'TypeScript', 'Python', 'Microservices',
  'Hibernate', 'Kafka', 'Apache Spark', 'BigQuery', 'Terraform', 'CSS3',
];

const SORT_OPTIONS = [
  { value: 'rating',     label: 'Top Rated' },
  { value: 'sessions',   label: 'Most Sessions' },
  { value: 'experience', label: 'Most Experienced' },
];

export default function MentorsPage() {
  const [mentors,  setMentors]  = useState<MentorProfile[]>([]);
  const [filtered, setFiltered] = useState<MentorProfile[]>([]);
  const [search,   setSearch]   = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSkills,     setSelectedSkills]     = useState<string[]>([]);
  const [sortBy,   setSortBy]   = useState<'rating' | 'sessions' | 'experience'>('rating');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getAllMentors()
      .then(data => { setMentors(data); setFiltered(data); })
      .finally(() => setLoading(false));
  }, []);

  const toggleIndustry = (ind: string) =>
    setSelectedIndustries(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);

  const toggleSkill = (skill: string) =>
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);

  const clearAll = () => {
    setSelectedIndustries([]);
    setSelectedSkills([]);
    setSearch('');
  };

  const applyFilters = useCallback(() => {
    let result = [...mentors];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.fullName.toLowerCase().includes(q) ||
        m.headline?.toLowerCase().includes(q) ||
        m.company?.toLowerCase().includes(q) ||
        m.skills?.some(s => s.skillName.toLowerCase().includes(q)) ||
        m.industries?.some(i => i.toLowerCase().includes(q))
      );
    }

    if (selectedIndustries.length > 0)
      result = result.filter(m => m.industries?.some(i => selectedIndustries.includes(i)));

    if (selectedSkills.length > 0)
      result = result.filter(m => m.skills?.some(s => selectedSkills.includes(s.skillName)));

    // Relevance sort when filters active
    if (selectedIndustries.length > 0 || selectedSkills.length > 0) {
      result.sort((a, b) => {
        const aScore = (a.industries?.filter(i => selectedIndustries.includes(i)).length ?? 0)
                     + (a.skills?.filter(s => selectedSkills.includes(s.skillName)).length ?? 0);
        const bScore = (b.industries?.filter(i => selectedIndustries.includes(i)).length ?? 0)
                     + (b.skills?.filter(s => selectedSkills.includes(s.skillName)).length ?? 0);
        return bScore !== aScore ? bScore - aScore : b.averageRating - a.averageRating;
      });
    } else {
      result.sort((a, b) =>
        sortBy === 'rating'     ? b.averageRating - a.averageRating :
        sortBy === 'sessions'   ? b.totalSessions - a.totalSessions :
        (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0)
      );
    }

    setFiltered(result);
  }, [mentors, search, selectedIndustries, selectedSkills, sortBy]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const hasFilters = selectedIndustries.length > 0 || selectedSkills.length > 0 || search.trim() !== '';

  return (
    <div className="sb-page">

      {/* Page header */}
      <div className="sb-page-header">
        <h1 className="sb-page-title">Browse Mentors</h1>
        <p className="sb-page-subtitle">
          {loading ? 'Loading…' : `${filtered.length} mentor${filtered.length !== 1 ? 's' : ''} found`}
          {hasFilters && ' with current filters'}
        </p>
      </div>

      <div className="sb-sidebar-layout">

        {/* ── Sidebar: filters ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Search */}
          <div className="sb-card" style={{ padding: '1rem' }}>
            <div className="sb-search-wrap">
              <span className="sb-search-icon">🔍</span>
              <input className="sb-input" type="text" placeholder="Search name, skill, company…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Sort */}
          <div className="sb-card" style={{ padding: '1rem' }}>
            <label className="sb-label" style={{ marginBottom: '0.6rem' }}>Sort by</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setSortBy(opt.value as any)}
                  style={{
                    padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    border: sortBy === opt.value ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    background: sortBy === opt.value ? 'var(--primary-light)' : 'var(--bg-white)',
                    color: sortBy === opt.value ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif", textAlign: 'left',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Industry filter */}
          <div className="sb-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label className="sb-label" style={{ margin: 0 }}>Industry</label>
              {selectedIndustries.length > 0 && (
                <span className="sb-tag" style={{ margin: 0, fontSize: '0.7rem', cursor: 'default' }}>
                  {selectedIndustries.length} selected
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
              {INDUSTRIES.map(i => (
                <span key={i} className={`filter-pill${selectedIndustries.includes(i) ? ' active' : ''}`}
                  onClick={() => toggleIndustry(i)}>
                  {i}
                </span>
              ))}
            </div>
          </div>

          {/* Skill filter */}
          <div className="sb-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label className="sb-label" style={{ margin: 0 }}>Skills</label>
              {selectedSkills.length > 0 && (
                <span className="sb-tag" style={{ margin: 0, fontSize: '0.7rem', cursor: 'default' }}>
                  {selectedSkills.length} selected
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
              {SKILLS.map(s => (
                <span key={s} className={`filter-pill${selectedSkills.includes(s) ? ' active' : ''}`}
                  onClick={() => toggleSkill(s)}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button className="btn-ghost btn-full" onClick={clearAll}
              style={{ fontSize: '0.82rem' }}>
              Clear all filters
            </button>
          )}
        </div>

        {/* ── Main: mentor grid ── */}
        <div>
          {loading ? (
            <div className="sb-spinner-wrap"><div className="sb-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="sb-empty">
              <div className="sb-empty-icon">🔍</div>
              <div className="sb-empty-title">No mentors match your filters</div>
              <div className="sb-empty-desc">Try adjusting your search or removing some filters.</div>
              <button className="btn-ghost" style={{ marginTop: '1rem' }} onClick={clearAll}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mentor-grid">
              {filtered.map(m => <MentorCard key={m.id} mentor={m} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
