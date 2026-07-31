import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { EventPost } from '../pages/Events';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEvent: EventPost) => void;
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

export const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [audience, setAudience] = useState('All');
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
    
    const extraDetails = `
Category: ${category}
Venue: ${venue}
Address: ${address}
Webinar Link: ${webinarLink}
Registrations Close: ${closeDate}

${description}

${instructions ? `Instructions: ${instructions}` : ''}
    `.trim();

    const newEvent = {
      title,
      date: startDate,
      location: venue || address || 'Online',
      description: extraDetails,
      registered_count: 0,
      audience: audience as 'All' | 'Student' | 'Alumni'
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
      setTitle('');
      setVenue('');
      setAddress('');
      setWebinarLink('');
      setStartDate('');
      setDescription('');
      setInstructions('');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', color: COLORS.text, letterSpacing: '-0.02em' }}>Create Event</h2>
            <span style={{ fontSize: '0.9375rem', color: COLORS.textMuted, fontWeight: 600 }}>Create a new event</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              value={audience} 
              onChange={e => setAudience(e.target.value)}
              style={{ 
                padding: '0.5rem 1rem', borderRadius: '99px', 
                background: COLORS.white, border: `2px solid ${COLORS.border}`, 
                color: COLORS.text, fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase',
                boxShadow: '2px 2px 0px rgba(13,30,20,1)', outline: 'none'
              }}
            >
              <option value="All">All / Everyone</option>
              <option value="Student">Students Only</option>
              <option value="Alumni">Alumni Only</option>
            </select>
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
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', background: COLORS.bg }}>
          <form id="eventForm" onSubmit={handleSubmit}>
            
            <div style={rowStyle}>
              <div style={labelStyle}>Title <span style={{color: COLORS.warning}}>*</span></div>
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
              <div style={labelStyle}>Start Date <span style={{color: COLORS.warning}}>*</span></div>
              <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="date" style={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} required />
                <input type="time" style={inputStyle} value={startTime} onChange={e => setStartTime(e.target.value)} />
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
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Visibility <span style={{color: COLORS.warning}}>*</span></div>
              <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: COLORS.text }}>
                  <input type="radio" checked readOnly style={{ accentColor: COLORS.text }} />
                  Only registered members
                </label>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>
                Disable Registrations?<br/>
                <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontStyle: 'italic', fontWeight: 600, textTransform: 'none' }}>Users won't be able to register if Yes.</span>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: COLORS.text }}>
                  <input type="radio" name="disableReg" checked={disableRegistrations === 'Yes'} onChange={() => setDisableRegistrations('Yes')} style={{ accentColor: COLORS.text }} />
                  Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: COLORS.text }}>
                  <input type="radio" name="disableReg" checked={disableRegistrations === 'No'} onChange={() => setDisableRegistrations('No')} style={{ accentColor: COLORS.text }} />
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
              <div style={{ flex: 1, border: `2px solid ${COLORS.border}`, borderRadius: '16px', overflow: 'hidden', background: COLORS.white }}>
                <textarea 
                  style={{ width: '100%', minHeight: '150px', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', color: COLORS.text, padding: '1rem', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500 }} 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Instructions above form</div>
              <textarea 
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', borderRadius: '16px' }}
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
              />
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', borderTop: `2px solid ${COLORS.border}`, display: 'flex', gap: '1rem', background: COLORS.white }}>
          <button 
            type="submit" 
            form="eventForm"
            style={{ 
              padding: '0.875rem 2rem', fontWeight: 900, background: COLORS.sage, color: COLORS.text, 
              border: `2px solid ${COLORS.border}`, borderRadius: '99px', cursor: 'pointer',
              boxShadow: '4px 4px 0px rgba(13,30,20,1)', textTransform: 'uppercase', fontSize: '0.875rem',
              opacity: isSubmitting ? 0.7 : 1
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
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
