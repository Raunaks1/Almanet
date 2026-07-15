import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, GraduationCap, ArrowLeft, Filter, BadgeCheck, Loader2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Define the type locally since we are removing mockData
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
}

// Temporary hardcoded options until we build dynamic filters
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
        .eq('verification_status', 'approved'); // Only show approved alumni
      
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Alumni Directory</h1>
      </header>

      <main style={{ flex: 1, padding: '2rem', display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* Filters Sidebar */}
        <aside style={{ width: '280px', flexShrink: 0 }}>
          <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} /> Filters
            </h2>

            <div className="input-group">
              <label className="input-label">Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Name or skill..." 
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Industry</label>
              <select 
                className="input-field" 
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                style={{ appearance: 'none', backgroundColor: 'var(--bg-tertiary)' }}
              >
                <option value="">All Industries</option>
                {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Graduation Year</label>
              <select 
                className="input-field" 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ appearance: 'none', backgroundColor: 'var(--bg-tertiary)' }}
              >
                <option value="">All Years</option>
                {years.map(yr => <option key={yr} value={yr.toString()}>{yr}</option>)}
              </select>
            </div>

            <button 
              className="btn btn-outline" 
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => { setSearchTerm(''); setSelectedIndustry(''); setSelectedYear(''); }}
            >
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Directory Grid */}
        <section style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 className="animate-spin" size={32} color="var(--brand-primary)" />
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Users size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
              <p>No alumni found matching your criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredAlumni.map((user: UserProfile) => (
              <div key={user.id} className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
                    {user.full_name.charAt(0)}
                  </div>
                  {user.verification_status === 'approved' && (
                    <div title="Institute Verified" style={{ color: 'var(--brand-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem', borderRadius: '50%' }}>
                      <BadgeCheck size={20} />
                    </div>
                  )}
                </div>
                
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user.full_name}</h3>
                <p style={{ color: 'var(--brand-primary)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 500 }}>
                  {user.industry}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={16} /> Class of {user.graduation_year}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} /> {user.location}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {user.skills.slice(0, 3).map(skill => (
                    <span key={skill} style={{ background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                      {skill}
                    </span>
                  ))}
                  {user.skills.length > 3 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>+{user.skills.length - 3} more</span>
                  )}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/profile/${user.id}`} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem' }}>View Profile</Link>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Connect</button>
                </div>
              </div>
            ))}

            {filteredAlumni.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                <Search size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No alumni found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or filters.</p>
              </div>
            )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Directory;
