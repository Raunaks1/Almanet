import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Briefcase, MapPin, Building, PlusCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setJobs(data as JobPost[]);
      }
      setLoading(false);
    };
    fetchJobs();
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{
        padding: '1rem 1.5rem',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Briefcase size={20} color="var(--brand-primary)" /> Job Portal
        </h1>
      </header>

      <main className="container" style={{ padding: '1.5rem', maxWidth: '1200px', width: '100%', display: 'flex', gap: '1.5rem' }}>
        
        {/* Sidebar Filters */}
        <aside style={{ width: '260px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: '80px' }}>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }} onClick={() => alert('New Job Post modal would open here! (Mock)')}>
              <PlusCircle size={16} /> Post a Job
            </button>
            
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', fontWeight: 600 }}>Filters</h3>
            
            <div className="input-group">
              <label className="input-label">Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Role, company, skills..." 
                  style={{ width: '100%', paddingLeft: '2.25rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Job Type</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {jobTypes.map(type => (
                  <button 
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedType === type ? 'var(--brand-subtle)' : 'transparent',
                      color: selectedType === type ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: selectedType === type ? 500 : 400,
                      fontSize: '0.875rem',
                      border: 'none',
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
              <Loader2 className="animate-spin" size={28} color="var(--brand-primary)" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Briefcase size={40} style={{ opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
              <p>No jobs found matching your criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredJobs.map(job => (
                <div key={job.id} className="card animate-fade-in" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.375rem', fontWeight: 600 }}>{job.title}</h2>
                      <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building size={14} /> {job.company}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {job.location}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Briefcase size={14} /> {job.type}</span>
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ fontSize: '0.8125rem' }} onClick={() => alert('Application flow would trigger here (Mock)')}>
                      Apply Now
                    </button>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
                    {job.description}
                  </p>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}>
                      <CheckCircle size={14} color="var(--accent-success)" /> Requirements
                    </h4>
                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                      {job.requirements && job.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {job.tags && job.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: '0.6875rem',
                          padding: '0.1875rem 0.625rem',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '9999px',
                          color: 'var(--text-secondary)',
                          fontWeight: 500,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                      Posted by {getAuthorName(job)} • {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Jobs;
