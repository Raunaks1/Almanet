import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, GraduationCap, ArrowLeft, Filter, BadgeCheck, Loader2, Users, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const COLORS = {
  bg: '#FBFBF9',
  text: '#0D1E14',
  textMuted: '#4A5D53',
  sage: '#CCDAC6',
  lavender: '#D9CFF5',
  blue: '#C7E4F2',
  terracotta: '#8A4A38',
  white: '#FFFFFF',
  border: '#0D1E14',
  warning: '#FFD166',
};

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_type: 'alumni' | 'student' | 'admin';
  college?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
  industry?: string;
  location?: string;
  skills: string[];
  verification_status: 'pending' | 'approved' | 'rejected';
  bio?: string;
  phone?: string;
  visibility?: 'public' | 'private' | 'alumni-only';
  linkedin?: string;
  twitter?: string;
  employer?: string;
  job_title?: string;
  years_of_experience?: number;
  mission_statement?: string;
  avatar_url?: string;
}

const industries = ['Software Engineering', 'Data Science', 'Product Management', 'Design', 'Finance'];
const years = [2026, 2025, 2024, 2023, 2022, 2021];

const Directory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [alumni, setAlumni] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchAlumni = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'alumni')
        .eq('verification_status', 'approved');
      
      if (!error && data) {
        setAlumni(data as UserProfile[]);
      }
      setLoading(false);
    };
    fetchAlumni();
  }, []);

  const filteredAlumni = alumni.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIndustry = selectedIndustry ? user.industry === selectedIndustry : true;
    const matchesYear = selectedYear ? user.graduation_year?.toString() === selectedYear : true;

    return matchesSearch && matchesIndustry && matchesYear;
  });

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header */}
      <header style={{
        padding: '1.25rem 2rem',
        background: COLORS.white,
        borderBottom: `2px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '99px',
            background: COLORS.white, border: `2px solid ${COLORS.border}`,
            color: COLORS.text, fontWeight: 800, cursor: 'pointer',
            boxShadow: '4px 4px 0px rgba(13,30,20,1)', textTransform: 'uppercase', fontSize: '0.8125rem'
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 900, color: COLORS.text, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Alumni Directory</h1>
      </header>

      <main style={{ flex: 1, padding: '2.5rem', display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* Filters Sidebar */}
        <aside style={{ width: '280px', flexShrink: 0 }}>
          <div style={{ 
            background: COLORS.white, padding: '1.5rem', borderRadius: '16px',
            border: `2px solid ${COLORS.border}`, boxShadow: '8px 8px 0px rgba(13,30,20,1)',
            position: 'sticky', top: '100px' 
          }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900, textTransform: 'uppercase', color: COLORS.text }}>
              <Filter size={20} strokeWidth={2.5} /> Filters
            </h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 800, color: COLORS.text, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8125rem' }}>Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: COLORS.text }} strokeWidth={2.5} />
                <input 
                  type="text" 
                  placeholder="Name or skill..." 
                  style={{ 
                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', 
                    borderRadius: '99px', border: `2px solid ${COLORS.border}`,
                    background: COLORS.white, color: COLORS.text, fontWeight: 600,
                    outline: 'none', fontSize: '0.875rem'
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 800, color: COLORS.text, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8125rem' }}>Industry</label>
              <select 
                style={{ 
                  width: '100%', padding: '0.75rem 1rem', 
                  borderRadius: '99px', border: `2px solid ${COLORS.border}`,
                  background: COLORS.white, color: COLORS.text, fontWeight: 600,
                  outline: 'none', appearance: 'none', fontSize: '0.875rem', cursor: 'pointer'
                }}
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
              >
                <option value="">All Industries</option>
                {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 800, color: COLORS.text, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8125rem' }}>Graduation Year</label>
              <select 
                style={{ 
                  width: '100%', padding: '0.75rem 1rem', 
                  borderRadius: '99px', border: `2px solid ${COLORS.border}`,
                  background: COLORS.white, color: COLORS.text, fontWeight: 600,
                  outline: 'none', appearance: 'none', fontSize: '0.875rem', cursor: 'pointer'
                }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">All Years</option>
                {years.map(yr => <option key={yr} value={yr.toString()}>{yr}</option>)}
              </select>
            </div>

            <button 
              onClick={() => { setSearchTerm(''); setSelectedIndustry(''); setSelectedYear(''); }}
              style={{ 
                width: '100%', padding: '0.75rem', borderRadius: '99px',
                background: COLORS.white, border: `2px solid ${COLORS.border}`,
                color: COLORS.text, fontWeight: 800, cursor: 'pointer',
                boxShadow: '4px 4px 0px rgba(13,30,20,1)', textTransform: 'uppercase', fontSize: '0.875rem',
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px rgba(13,30,20,1)'; }}
            >
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Directory Grid */}
        <section style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div style={{ width: '36px', height: '36px', border: `4px solid ${COLORS.border}`, borderTopColor: COLORS.sage, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div style={{ 
              background: COLORS.white, padding: '4rem', textAlign: 'center', 
              border: `2px dashed ${COLORS.border}`, borderRadius: '24px',
              color: COLORS.textMuted 
            }}>
              <Users size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} strokeWidth={1.5} />
              <p style={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS.text, margin: 0, textTransform: 'uppercase' }}>No alumni found matching your criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredAlumni.map((user: UserProfile, idx: number) => {
                const accentColors = [COLORS.sage, COLORS.lavender, COLORS.blue, COLORS.warning];
                const cardAccent = accentColors[idx % accentColors.length];

                return (
                  <div key={user.id} style={{ 
                    background: COLORS.white, padding: '1.5rem', display: 'flex', flexDirection: 'column',
                    border: `2px solid ${COLORS.border}`, borderRadius: '16px', boxShadow: '6px 6px 0px rgba(13,30,20,1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: user.avatar_url
                          ? `url(${user.avatar_url}) center/cover no-repeat`
                          : cardAccent,
                        border: `2px solid ${COLORS.border}`,
                        color: COLORS.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        boxShadow: '4px 4px 0px rgba(13,30,20,1)'
                      }}>
                        {!user.avatar_url && user.full_name.charAt(0)}
                      </div>
                      {user.verification_status === 'approved' && (
                        <div title="Institute Verified" style={{ color: COLORS.text }}>
                          <BadgeCheck size={24} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', fontWeight: 900, color: COLORS.text, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{user.full_name}</h3>
                    <p style={{ color: COLORS.textMuted, fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 700 }}>
                      {user.industry || 'No Industry Provided'}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', color: COLORS.text, fontSize: '0.875rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <GraduationCap size={16} strokeWidth={2.5} /> Class of {user.graduation_year || 'Unknown'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} strokeWidth={2.5} /> {user.location || 'Unknown'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      {user.skills.slice(0, 3).map(skill => (
                        <span key={skill} style={{
                          background: cardAccent,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '99px',
                          border: `1.5px solid ${COLORS.border}`,
                          fontSize: '0.75rem',
                          color: COLORS.text,
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}>
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 3 && (
                        <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, alignSelf: 'center', fontWeight: 800 }}>+{user.skills.length - 3} more</span>
                      )}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                      <Link 
                        to={`/profile/${user.id}`} 
                        style={{ 
                          flex: 1, padding: '0.625rem', fontSize: '0.8125rem', textDecoration: 'none', textAlign: 'center',
                          borderRadius: '99px', background: COLORS.white, border: `2px solid ${COLORS.border}`,
                          color: COLORS.text, fontWeight: 800, textTransform: 'uppercase',
                          boxShadow: '4px 4px 0px rgba(13,30,20,1)'
                        }}
                      >
                        Profile
                      </Link>
                      <Link 
                        to={`/chat?dm=${user.id}`} 
                        style={{ 
                          flex: 1, padding: '0.625rem', fontSize: '0.8125rem', textDecoration: 'none', textAlign: 'center',
                          borderRadius: '99px', background: COLORS.text, border: `2px solid ${COLORS.border}`,
                          color: COLORS.white, fontWeight: 800, textTransform: 'uppercase',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                          boxShadow: '4px 4px 0px rgba(13,30,20,0.3)'
                        }}
                      >
                        <MessageCircle size={14} strokeWidth={2.5} /> Message
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Directory;
