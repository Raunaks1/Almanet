import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Mail, MessageSquare, BadgeCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setProfile(data as UserProfile);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--brand-primary)" />
      </div>
    );
  }

  if (!profile) {
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
              {profile.full_name.charAt(0)}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              <MessageSquare size={18} /> Message
            </button>
          </div>

          {/* Details Section */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{profile.full_name}</h1>
              {profile.verification_status === 'approved' && (
                <div title="Institute Verified" style={{ color: 'var(--brand-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem', borderRadius: '50%' }}>
                  <BadgeCheck size={24} />
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '1.25rem', color: 'var(--brand-primary)', fontWeight: 500, marginBottom: '1.5rem' }}>
              {profile.industry || 'Student'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <GraduationCap size={20} /> 
                <span>Class of {profile.graduation_year || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <MapPin size={20} /> 
                <span>{profile.location || 'Location unlisted'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <Mail size={20} /> 
                <span>{profile.email}</span>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>About</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {profile.bio || 'This user hasn\'t added a bio yet.'}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Skills & Expertise</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {profile.skills && profile.skills.length > 0 ? profile.skills.map((skill, index) => (
                  <span key={index} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {skill}
                  </span>
                )) : <span style={{ color: 'var(--text-tertiary)' }}>No skills listed.</span>}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default Profile;
