import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockUsers } from '../lib/mockData';
import { ArrowLeft, MapPin, GraduationCap, Mail, MessageSquare, BadgeCheck } from 'lucide-react';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const user = mockUsers.find(u => u.id === id);

  if (!user) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <h2>Profile not found</h2>
        <Link to="/directory" className="btn btn-primary">Back to Directory</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Profile Details</h1>
      </header>

      <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '900px' }}>
        
        {/* Profile Card */}
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', display: 'flex', gap: '2.5rem', flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Avatar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', minWidth: '150px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25)' }}>
              {user.full_name.charAt(0)}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              <MessageSquare size={18} /> Message
            </button>
          </div>

          {/* Details Section */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{user.full_name}</h1>
              {user.is_verified && (
                <div title="Institute Verified" style={{ color: 'var(--brand-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
                  <BadgeCheck size={24} />
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '1.25rem', color: 'var(--brand-primary)', fontWeight: 500, marginBottom: '1.5rem' }}>
              {user.industry || 'Student'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <GraduationCap size={20} /> 
                <span>Class of {user.graduation_year || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <MapPin size={20} /> 
                <span>{user.location || 'Location unlisted'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <Mail size={20} /> 
                <span>{user.email}</span>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>About</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {user.bio || 'This user hasn\'t added a bio yet.'}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Skills & Expertise</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {user.skills.map(skill => (
                  <span key={skill} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-xl)', fontSize: '0.875rem', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default Profile;
