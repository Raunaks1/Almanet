import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { JobPost } from '../pages/Jobs';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any; // We'll just use any here or import UserProfile if needed
  onSuccess: (newJob: JobPost) => void;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({ isOpen, onClose, currentUser, onSuccess }) => {
  // State for all the form fields
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [expFrom, setExpFrom] = useState('-- From --');
  const [expTo, setExpTo] = useState('-- To --');
  const [location, setLocation] = useState('');
  const [receiveApp, setReceiveApp] = useState('email'); // 'email' or 'url'
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
    
    // Convert to JobPost format (we'll save extra fields in description for now since they might not be in DB)
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
      type: 'Full-time' as const, // Hardcoded or we could add a selector if needed
      description: extraDetails,
      requirements: [], // Would parse from description if we had a dedicated field
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
      // Reset form
      setJobTitle('');
      setCompanyName('');
      setCompanyWebsite('');
      setLocation('');
      setSkills('');
      setDescription('');
    }
  };

  const labelStyle = { width: '250px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' };
  const inputStyle = { flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.625rem', borderRadius: '4px', outline: 'none', fontSize: '0.875rem' };
  const rowStyle = { display: 'flex', marginBottom: '1.25rem', alignItems: 'flex-start' };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      paddingTop: '5vh',
      paddingBottom: '5vh',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Post a Job</h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Create a job by filling in Job details</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <X size={20} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem', overflowY: 'auto' }}>
          <form id="jobForm" onSubmit={handleSubmit}>
            
            <div style={rowStyle}>
              <div style={labelStyle}>Job Title <span style={{color: 'var(--brand-primary)'}}>*</span></div>
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
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Years</span>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Location</div>
              <div style={{ flex: 1 }}>
                <input type="text" style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Separated locations with a Comma (,).</div>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>How do you want to receive the application?</div>
              <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="receiveApp" checked={receiveApp === 'email'} onChange={() => setReceiveApp('email')} />
                  Contact Email
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="receiveApp" checked={receiveApp === 'url'} onChange={() => setReceiveApp('url')} />
                  Job Apply Url
                </label>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Contact Email <span style={{color: 'var(--brand-primary)'}}>*</span></div>
              <div style={{ flex: 1 }}>
                <input type="email" style={inputStyle} value={contactEmail} onChange={e => setContactEmail(e.target.value)} required />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                  Applications to the opportunity shall be sent by email to the above address, if you are submitting the email address of a recruiter, please make sure you have the permission to do so.
                </div>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Job Area</div>
              <input type="text" style={inputStyle} value={jobArea} onChange={e => setJobArea(e.target.value)} />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Skills relevant to the Opportunity</div>
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
              <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                {/* Mock rich text toolbar */}
                <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.875rem', alignItems: 'center' }}>
                  <select style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }}>
                    <option>Formats</option>
                  </select>
                  <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>B</span>
                  <span style={{ fontStyle: 'italic', cursor: 'pointer' }}>I</span>
                  <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>U</span>
                  <span>|</span>
                  <span style={{ cursor: 'pointer' }}>≡</span>
                  <span style={{ cursor: 'pointer' }}>=</span>
                  <span style={{ cursor: 'pointer' }}>🔗</span>
                </div>
                <textarea 
                  style={{ width: '100%', minHeight: '150px', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', color: 'var(--text-primary)', padding: '0.75rem', fontFamily: 'inherit', fontSize: '0.875rem' }} 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Attach file</div>
              <div style={{ flex: 1 }}>
                <input type="file" style={{ fontSize: '0.875rem' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                  (Allowed file types: doc, docx, ppt, pptx, xls, xlsx, zip, pdf)<br/>
                  <span style={{color: 'var(--brand-primary)'}}>*</span>Before attaching a pdf document, please compress it using <strong>smallpdf.com</strong>
                </div>
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', background: 'var(--bg-secondary)' }}>
          <button 
            type="submit" 
            form="jobForm"
            className="btn btn-primary" 
            style={{ padding: '0.5rem 1.5rem', fontWeight: 600, background: '#4CAF50', color: 'white', border: 'none' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Job'}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-ghost" 
            style={{ padding: '0.5rem 1.5rem', fontWeight: 600 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
