import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Briefcase, MapPin, Building, PlusCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NewJobModal } from '../components/NewJobModal';

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

export interface JobPost {
  id: string;
  author_id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  description: string;
  requirements: string[];
  tags: string[];
  created_at: string;
  profiles?: { full_name: string };
}

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    const fetchJobsAndUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setCurrentUser(profile);
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setJobs(data as JobPost[]);
      }
      setLoading(false);
    };
    fetchJobsAndUser();
  }, []);

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Internship', 'Contract'];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'All' ? true : job.type === selectedType;

    return matchesSearch && matchesType;
  });

  const getAuthorName = (job: JobPost) => {
    return job.profiles?.full_name || 'Unknown User';
  };

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
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, color: COLORS.text, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          <Briefcase size={24} strokeWidth={2.5} color={COLORS.text} /> Job Portal
        </h1>
      </header>

      <main style={{ flex: 1, padding: '2.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', gap: '2rem' }}>
        
        {/* Sidebar Filters */}
        <aside style={{ width: '280px', flexShrink: 0 }}>
          <div style={{ 
            background: COLORS.white, padding: '1.5rem', borderRadius: '16px',
            border: `2px solid ${COLORS.border}`, boxShadow: '8px 8px 0px rgba(13,30,20,1)',
            position: 'sticky', top: '100px' 
          }}>
            <button 
              style={{ 
                width: '100%', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.875rem', borderRadius: '99px',
                background: COLORS.lavender, border: `2px solid ${COLORS.border}`,
                color: COLORS.text, fontWeight: 900, cursor: 'pointer',
                boxShadow: '4px 4px 0px rgba(13,30,20,1)', textTransform: 'uppercase', fontSize: '0.9375rem',
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px rgba(13,30,20,1)'; }}
              onClick={() => setIsModalOpen(true)}
            >
              <PlusCircle size={20} strokeWidth={2.5} /> Post a Job
            </button>
            
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', fontWeight: 900, textTransform: 'uppercase', color: COLORS.text }}>Filters</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 800, color: COLORS.text, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8125rem' }}>Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: COLORS.text }} strokeWidth={2.5} />
                <input 
                  type="text" 
                  placeholder="Role, company, skills..." 
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

            <div>
              <label style={{ display: 'block', fontWeight: 800, color: COLORS.text, marginBottom: '0.75rem', textTransform: 'uppercase', fontSize: '0.8125rem' }}>Job Type</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {jobTypes.map(type => (
                  <button 
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{
                      textAlign: 'left',
                      padding: '0.625rem 1rem',
                      borderRadius: '99px',
                      background: selectedType === type ? COLORS.sage : COLORS.white,
                      color: COLORS.text,
                      fontWeight: selectedType === type ? 900 : 700,
                      fontSize: '0.875rem',
                      border: selectedType === type ? `2px solid ${COLORS.border}` : `2px solid transparent`,
                      boxShadow: selectedType === type ? '2px 2px 0px rgba(13,30,20,1)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textTransform: 'uppercase'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Jobs List */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div style={{ width: '36px', height: '36px', border: `4px solid ${COLORS.border}`, borderTopColor: COLORS.sage, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ 
              background: COLORS.white, padding: '4rem', textAlign: 'center', 
              border: `2px dashed ${COLORS.border}`, borderRadius: '24px',
              color: COLORS.textMuted 
            }}>
              <Briefcase size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} strokeWidth={1.5} />
              <p style={{ fontWeight: 900, fontSize: '1.25rem', color: COLORS.text, margin: 0, textTransform: 'uppercase' }}>No jobs found matching your criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredJobs.map((job, idx) => {
                const accentColors = [COLORS.sage, COLORS.lavender, COLORS.blue, COLORS.warning];
                const cardAccent = accentColors[idx % accentColors.length];

                return (
                  <div key={job.id} style={{ 
                    background: COLORS.white, padding: '2rem',
                    border: `2px solid ${COLORS.border}`, borderRadius: '24px', 
                    boxShadow: '8px 8px 0px rgba(13,30,20,1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 900, color: COLORS.text, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{job.title}</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: COLORS.text, fontSize: '0.875rem', fontWeight: 700 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Building size={16} strokeWidth={2.5} /> {job.company}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><MapPin size={16} strokeWidth={2.5} /> {job.location}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', background: cardAccent, border: `2px solid ${COLORS.border}`, borderRadius: '99px', textTransform: 'uppercase' }}><Briefcase size={14} strokeWidth={2.5} /> {job.type}</span>
                        </div>
                      </div>
                      <button 
                        style={{ 
                          padding: '0.75rem 1.5rem', borderRadius: '99px',
                          background: COLORS.text, border: `2px solid ${COLORS.border}`,
                          color: COLORS.white, fontWeight: 900, cursor: 'pointer',
                          boxShadow: '4px 4px 0px rgba(13,30,20,0.3)', textTransform: 'uppercase', fontSize: '0.875rem'
                        }} 
                        onClick={() => alert('Application flow would trigger here (Mock)')}
                      >
                        Apply Now
                      </button>
                    </div>

                    <p style={{ color: COLORS.textMuted, lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 500 }}>
                      {job.description}
                    </p>

                    <div style={{ marginBottom: '1.5rem', background: COLORS.bg, padding: '1.5rem', borderRadius: '16px', border: `2px solid ${COLORS.border}` }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900, color: COLORS.text, textTransform: 'uppercase' }}>
                        <CheckCircle size={18} strokeWidth={2.5} color={COLORS.text} /> Requirements
                      </h4>
                      <ul style={{ color: COLORS.text, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>
                        {job.requirements && job.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${COLORS.border}`, paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {job.tags && job.tags.map(tag => (
                          <span key={tag} style={{
                            fontSize: '0.75rem',
                            padding: '0.375rem 0.875rem',
                            background: COLORS.white,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: '9999px',
                            color: COLORS.text,
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div style={{ fontSize: '0.8125rem', color: COLORS.text, fontWeight: 700, textTransform: 'uppercase' }}>
                        Posted by {getAuthorName(job)} • {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <NewJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        onSuccess={(newJob) => setJobs([newJob, ...jobs])}
      />
    </div>
  );
};

export default Jobs;
