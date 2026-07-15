import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Briefcase, MapPin, Building, PlusCircle, CheckCircle } from 'lucide-react';
import { mockJobs, mockUsers } from '../lib/mockData';
import type { JobPost } from '../lib/mockData';

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  
  const jobTypes = ['All', 'Full-time', 'Part-time', 'Internship', 'Contract'];

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'All' ? true : job.type === selectedType;

    return matchesSearch && matchesType;
  });

  const getAuthorName = (authorId: string) => {
    return mockUsers.find(u => u.id === authorId)?.full_name || 'Unknown User';
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
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Showing {filteredJobs.length} job{filteredJobs.length !== 1 && 's'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredJobs.map((job: JobPost) => (
              <div key={job.id} className="glass-card animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{job.title}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9375rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building size={16} /> {job.company}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={16} /> {job.location}</span>
                      {job.salary && <span style={{ color: 'var(--brand-primary)', fontWeight: 500 }}>{job.salary}</span>}
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => alert(`Applied to ${job.title} at ${job.company}! Your AlmaNET profile has been shared. (Mock)`)}>
                    <CheckCircle size={18} /> Apply Now
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-xl)', fontSize: '0.75rem', fontWeight: 500 }}>
                    {job.type}
                  </span>
                  {job.tags.map(tag => (
                    <span key={tag} style={{ background: 'var(--bg-tertiary)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-xl)', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                  <span>Posted by <strong style={{ color: 'var(--text-secondary)' }}>{getAuthorName(job.postedBy)}</strong></span>
                  <span>{job.createdAt}</span>
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                <Briefcase size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No jobs found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or search term.</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Jobs;
