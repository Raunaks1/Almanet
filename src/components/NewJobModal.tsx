import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { JobPost } from '../pages/Jobs';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onSuccess: (newJob: JobPost) => void;
}

const COLORS = {
  bg: '#FBFBF9',
  text: '#0D1E14',
  textMuted: '#4A5D53',
  sage: '#CCDAC6',
  lavender: '#D9CFF5',
  blue: '#C7E4F2',
  warning: '#FFD166',
  white: '#FFFFFF',
  border: '#0D1E14',
};

export const NewJobModal: React.FC<NewJobModalProps> = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [expFrom, setExpFrom] = useState('-- From --');
  const [expTo, setExpTo] = useState('-- To --');
  const [location, setLocation] = useState('');
  const [receiveApp, setReceiveApp] = useState('email');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [jobArea, setJobArea] = useState('');
  const [skills, setSkills] = useState('');
  const [salary, setSalary] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !companyName.trim() || !contactEmail.trim()) return;
    
    setIsSubmitting(true);
    
    const extraDetails = `
Experience: ${expFrom !== '-- From --' ? expFrom : ''} to ${expTo !== '-- To --' ? expTo : ''} Years
Website: ${companyWebsite}
Job Area: ${jobArea}
Salary: ${salary}
Deadline: ${deadline}
Apply via: ${contactEmail}

${description}
    `.trim();

    const newJob = {
      author_id: currentUser?.id,
      title: jobTitle,
      company: companyName,
      location: location,
      type: 'Full-time' as const,
      description: extraDetails,
      requirements: [],
      tags: skills.split(',').map(s => s.trim()).filter(Boolean),
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert([newJob])
      .select('*, profiles(full_name)')
      .single();
      
    setIsSubmitting(false);

    if (error) {
      console.error('Error creating job:', error);
      alert('Failed to post job. Please try again.');
    } else if (data) {
      onSuccess(data as JobPost);
      onClose();
      setJobTitle('');
      setCompanyName('');
      setCompanyWebsite('');
      setLocation('');
      setSkills('');
      setDescription('');
    }
  };

  const labelStyle = { width: '250px', fontSize: '0.875rem', fontWeight: 800, color: COLORS.text, textTransform: 'uppercase' as const };
  const inputStyle = { 
    flex: 1, background: COLORS.white, border: `2px solid ${COLORS.border}`, color: COLORS.text, 
    padding: '0.75rem', borderRadius: '99px', outline: 'none', fontSize: '0.875rem', fontWeight: 600,
  };
  const rowStyle = { display: 'flex', marginBottom: '1.5rem', alignItems: 'flex-start' };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(13, 30, 20, 0.8)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      zIndex: 1000, paddingTop: '5vh', paddingBottom: '5vh',
      backdropFilter: 'blur(8px)', fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{
        width: '100%', maxWidth: '800px', maxHeight: '90vh',
        backgroundColor: COLORS.bg, borderRadius: '24px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '12px 12px 0px rgba(13,30,20,1)',
        border: `2px solid ${COLORS.border}`, overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: `2px solid ${COLORS.border}`, background: COLORS.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', color: COLORS.text, letterSpacing: '-0.02em' }}>Post a Job</h2>
            <span style={{ fontSize: '0.9375rem', color: COLORS.textMuted, fontWeight: 600 }}>Create a new opportunity</span>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              padding: '0.5rem', borderRadius: '50%', background: COLORS.white, border: `2px solid ${COLORS.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '2px 2px 0px rgba(13,30,20,1)'
            }}
          >
            <X size={20} color={COLORS.text} strokeWidth={2.5} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', background: COLORS.bg }}>
          <form id="jobForm" onSubmit={handleSubmit}>
            
            <div style={rowStyle}>
              <div style={labelStyle}>Job Title <span style={{color: COLORS.warning}}>*</span></div>
              <input type="text" style={inputStyle} value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Company Name</div>
              <input type="text" placeholder="Enter Company Name" style={inputStyle} value={companyName} onChange={e => setCompanyName(e.target.value)} required />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Company Website</div>
              <input type="text" style={inputStyle} value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Experience Level</div>
              <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <select style={{...inputStyle, flex: 'none', width: '150px'}} value={expFrom} onChange={e => setExpFrom(e.target.value)}>
                  <option>-- From --</option>
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select style={{...inputStyle, flex: 'none', width: '150px'}} value={expTo} onChange={e => setExpTo(e.target.value)}>
                  <option>-- To --</option>
                  {[1,2,3,4,5,6,7,8,9,10,15,20].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: COLORS.text }}>Years</span>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Location</div>
              <div style={{ flex: 1 }}>
                <input type="text" style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} />
                <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.5rem', fontWeight: 600 }}>Separated locations with a comma (,).</div>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Receive App Via</div>
              <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: COLORS.text }}>
                  <input type="radio" name="receiveApp" checked={receiveApp === 'email'} onChange={() => setReceiveApp('email')} style={{ accentColor: COLORS.text }} />
                  Contact Email
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: COLORS.text }}>
                  <input type="radio" name="receiveApp" checked={receiveApp === 'url'} onChange={() => setReceiveApp('url')} style={{ accentColor: COLORS.text }} />
                  Job Apply Url
                </label>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Contact Email <span style={{color: COLORS.warning}}>*</span></div>
              <div style={{ flex: 1 }}>
                <input type="email" style={inputStyle} value={contactEmail} onChange={e => setContactEmail(e.target.value)} required />
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Job Area</div>
              <input type="text" style={inputStyle} value={jobArea} onChange={e => setJobArea(e.target.value)} />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Skills</div>
              <input type="text" style={inputStyle} value={skills} onChange={e => setSkills(e.target.value)} />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Salary Package</div>
              <input type="text" style={{...inputStyle, maxWidth: '250px'}} value={salary} onChange={e => setSalary(e.target.value)} />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Application Deadline</div>
              <input type="date" style={{...inputStyle, maxWidth: '250px'}} value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Job Description</div>
              <div style={{ flex: 1, border: `2px solid ${COLORS.border}`, borderRadius: '16px', overflow: 'hidden', background: COLORS.white }}>
                <textarea 
                  style={{ width: '100%', minHeight: '150px', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', color: COLORS.text, padding: '1rem', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500 }} 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', borderTop: `2px solid ${COLORS.border}`, display: 'flex', gap: '1rem', background: COLORS.white }}>
          <button 
            type="submit" 
            form="jobForm"
            style={{ 
              padding: '0.875rem 2rem', fontWeight: 900, background: COLORS.lavender, color: COLORS.text, 
              border: `2px solid ${COLORS.border}`, borderRadius: '99px', cursor: 'pointer',
              boxShadow: '4px 4px 0px rgba(13,30,20,1)', textTransform: 'uppercase', fontSize: '0.875rem',
              opacity: isSubmitting ? 0.7 : 1
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Job'}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              padding: '0.875rem 2rem', fontWeight: 900, background: COLORS.white, color: COLORS.text, 
              border: `2px solid ${COLORS.border}`, borderRadius: '99px', cursor: 'pointer',
              textTransform: 'uppercase', fontSize: '0.875rem'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
