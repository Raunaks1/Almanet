import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { EventPost } from '../pages/Events';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEvent: EventPost) => void;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [audience, setAudience] = useState('All Events');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('All Events');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [webinarLink, setWebinarLink] = useState('');
  const [disableRegistrations, setDisableRegistrations] = useState('No');
  const [closeDate, setCloseDate] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate.trim()) return;
    
    setIsSubmitting(true);
    
    // Package extra data into description to avoid schema errors if not present
    const extraDetails = `
Audience: ${audience}
Category: ${category}
Venue: ${venue}
Address: ${address}
Webinar Link: ${webinarLink}
Registrations Close: ${closeDate}

${description}

${instructions ? `Instructions: ${instructions}` : ''}
    `.trim();

    // Map to EventPost structure
    const newEvent = {
      title,
      date: startDate,
      location: venue || address || 'Online',
      description: extraDetails,
      registered_count: 0
    };

    const { data, error } = await supabase
      .from('events')
      .insert([newEvent])
      .select('*')
      .single();
      
    setIsSubmitting(false);

    if (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } else if (data) {
      onSuccess(data as EventPost);
      onClose();
      // Reset form
      setTitle('');
      setVenue('');
      setAddress('');
      setWebinarLink('');
      setStartDate('');
      setDescription('');
      setInstructions('');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Create Event</h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Create an event by filling in event details</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              value={audience} 
              onChange={e => setAudience(e.target.value)}
              style={{ padding: '0.375rem 0.75rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
            >
              <option value="All">All Events / Everyone</option>
              <option value="Students">Students Only</option>
              <option value="Alumni">Alumni Only</option>
            </select>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>
              <X size={20} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem', overflowY: 'auto' }}>
          <form id="eventForm" onSubmit={handleSubmit}>
            
            <div style={rowStyle}>
              <div style={labelStyle}>Title <span style={{color: 'var(--accent-warning)'}}>*</span></div>
              <input type="text" style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Category</div>
              <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
                <option>All Events</option>
                <option>Workshop</option>
                <option>Networking</option>
                <option>Seminar</option>
              </select>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Start Date <span style={{color: 'var(--accent-warning)'}}>*</span></div>
              <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="date" style={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} required />
                <input type="time" style={inputStyle} value={startTime} onChange={e => setStartTime(e.target.value)} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', whiteSpace: 'nowrap' }}>Add End Time</span>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Venue</div>
              <input type="text" style={inputStyle} value={venue} onChange={e => setVenue(e.target.value)} />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Address</div>
              <input type="text" style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Webinar Link</div>
              <div style={{ flex: 1 }}>
                <input type="text" placeholder="Add a webinar link" style={inputStyle} value={webinarLink} onChange={e => setWebinarLink(e.target.value)} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>If there is a webinar link available, then add it here.</div>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Visibility <span style={{color: 'var(--accent-warning)'}}>*</span></div>
              <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" checked readOnly />
                  Only registered members
                </label>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>
                Disable Registrations?<br/>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Note: Users would be not able to register if Yes is selected.</span>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="disableReg" checked={disableRegistrations === 'Yes'} onChange={() => setDisableRegistrations('Yes')} />
                  Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="disableReg" checked={disableRegistrations === 'No'} onChange={() => setDisableRegistrations('No')} />
                  No
                </label>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Registrations Close Date</div>
              <input type="date" style={{...inputStyle, maxWidth: '250px'}} value={closeDate} onChange={e => setCloseDate(e.target.value)} />
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Description</div>
              <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.875rem', alignItems: 'center' }}>
                  <select style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }}>
                    <option>Formats</option>
                  </select>
                  <select style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }}>
                    <option>Font Sizes</option>
                  </select>
                  <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>B</span>
                  <span style={{ fontStyle: 'italic', cursor: 'pointer' }}>I</span>
                  <span style={{ cursor: 'pointer' }}>≡</span>
                </div>
                <textarea 
                  style={{ width: '100%', minHeight: '150px', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', color: 'var(--text-primary)', padding: '0.75rem', fontFamily: 'inherit', fontSize: '0.875rem' }} 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Event Image</div>
              <div style={{ flex: 1 }}>
                <input type="file" style={{ fontSize: '0.875rem' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Image size of 1000px width and 250px height will look perfect</div>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Content/Instructions that appear on top of the registration form</div>
              <textarea 
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
              />
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <button 
            type="submit" 
            form="eventForm"
            className="btn btn-primary" 
            style={{ padding: '0.5rem 1.5rem', fontWeight: 600, background: '#4CAF50', color: 'white', border: 'none' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-outline" 
            style={{ padding: '0.5rem 1.5rem', fontWeight: 600, borderColor: '#F44336', color: '#F44336' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
