import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, HeartHandshake, Star, Calendar } from 'lucide-react';
import { mockUsers } from '../lib/mockData';
import type { UserProfile } from '../lib/mockData';

const Mentorship: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // For the sake of the mock, let's say all verified alumni with Mentorship or Leadership skills are available mentors
  const availableMentors = mockUsers.filter(u => 
    u.user_type === 'alumni' && 
    u.is_verified && 
    u.skills.some(s => s.toLowerCase().includes('mentor') || s.toLowerCase().includes('leader'))
  );

  const filteredMentors = availableMentors.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HeartHandshake size={24} color="var(--brand-primary)" /> Mentorship Portal
        </h1>
      </header>

      <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', width: '100%' }}>
        
        {/* Intro Section */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Find Your Guide</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Connect with experienced alumni who have volunteered to mentor students and recent graduates.</p>
          </div>
          <button className="btn btn-primary" onClick={() => alert('Mock: Your profile has been flagged as available to mentor!')}>
            Offer to Mentor
          </button>
        </div>

        {/* Search */}
        <div className="input-group" style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search by name, industry, or specific skills (e.g. System Design)..." 
              style={{ width: '100%', paddingLeft: '3rem', paddingTop: '1rem', paddingBottom: '1rem', fontSize: '1.125rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Mentors List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredMentors.map((mentor: UserProfile) => (
            <div key={mentor.id} className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, flexShrink: 0 }}>
                {mentor.full_name.charAt(0)}
              </div>
              
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{mentor.full_name}</h3>
                <p style={{ color: 'var(--brand-primary)', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: 500 }}>
                  {mentor.industry} • Class of {mentor.graduation_year}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {mentor.skills.map(skill => (
                    <span key={skill} style={{ background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '200px' }}>
                <button className="btn btn-primary" onClick={() => alert('Mentorship request sent! (Mock)')} style={{ width: '100%' }}>
                  <Star size={18} /> Request Mentorship
                </button>
                <Link to={`/profile/${mentor.id}`} className="btn btn-outline" style={{ width: '100%' }}>
                  <Calendar size={18} /> View Profile
                </Link>
              </div>
            </div>
          ))}

          {filteredMentors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
              <HeartHandshake size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No mentors found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search criteria.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Mentorship;
