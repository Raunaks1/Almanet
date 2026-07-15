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
      <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={24} color="var(--brand-primary)" /> Job Portal
        </h1>
      </header>

      <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', width: '100%', display: 'flex', gap: '2rem' }}>
        
        {/* Sidebar Filters */}
        <aside style={{ width: '280px', flexShrink: 0 }}>
          <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '2rem' }} onClick={() => alert('New Job Post modal would open here! (Mock)')}>
              <PlusCircle size={18} /> Post a Job
            </button>
            
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Filters</h3>
            
            <div className="input-group">
              <label className="input-label">Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Role, company, skills..." 
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Job Type</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {jobTypes.map(type => (
                  <button 
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{ textAlign: 'left', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: selectedType === type ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: selectedType === type ? 'var(--brand-primary)' : 'var(--text-secondary)', border: selectedType === type ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent' }}
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
              <Loader2 className="animate-spin" size={32} color="var(--brand-primary)" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Briefcase size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
              <p>No jobs found matching your criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredJobs.map(job => (
                <div key={job.id} className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{job.title}</h2>
                      <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building size={16} /> {job.company}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={16} /> {job.location}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Briefcase size={16} /> {job.type}</span>
                      </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => alert('Application flow would trigger here (Mock)')}>
                      Apply Now
                    </button>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {job.description}
                  </p>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} color="var(--accent-success)" /> Requirements
                    </h4>
                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {job.requirements && job.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {job.tags && job.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '9999px', color: 'var(--text-secondary)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
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
