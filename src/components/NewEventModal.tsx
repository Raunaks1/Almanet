import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Modal, Button, FormField, Input, Textarea, Select } from './ui';
import type { EventPost } from '../pages/Events';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEvent: EventPost) => void;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [audience, setAudience] = useState('All');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('All Events');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [webinarLink, setWebinarLink] = useState('');
  const [disableRegistrations, setDisableRegistrations] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit handler, extraDetails/newEvent payload shape, insert, and onSuccess preserved exactly.
  const handleSubmit = async () => {
    if (!title.trim() || !startDate || !startTime) {
      alert('Please fill required fields (Title, Start Date, Start Time)');
      return;
    }

    setIsSubmitting(true);

    try {
      const dateStr = new Date(`${startDate}T${startTime}`).toISOString();

      const extraDetails = {
        venue,
        address,
        webinarLink,
        disableRegistrations,
        category,
      };

      const newEvent = {
        title,
        date: dateStr,
        location: venue || webinarLink || 'TBD',
        description,
        registered_count: 0,
        audience: audience as any,
        extraDetails,
      };

      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()
        .single();

      if (error) throw error;

      onSuccess(data as EventPost);

      // reset
      setAudience('All');
      setTitle('');
      setCategory('All Events');
      setStartDate('');
      setStartTime('');
      setVenue('');
      setAddress('');
      setWebinarLink('');
      setDisableRegistrations(false);
      setDescription('');
    } catch (err: any) {
      alert('Failed to create event: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionTitle: React.CSSProperties = {
    font: 'var(--type-caption)',
    fontWeight: 700,
    letterSpacing: '0.01em',
    color: 'var(--text-3)',
    margin: '4px 0 10px',
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create event"
      subtitle="Schedule something for the community."
      maxWidth={720}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Create event
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section>
          <div style={sectionTitle}>Basics</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {/* headerExtra (audience) moved into body; ui/Modal has no headerExtra */}
            <FormField label="Publish to">
              <Select value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Audience">
                <option value="All">All</option>
                <option value="Alumni">Alumni</option>
                <option value="Student">Student</option>
              </Select>
            </FormField>
            <FormField label="Event title" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
            </FormField>
            <FormField label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                <option value="All Events">All events</option>
                <option value="Reunion">Reunion</option>
                <option value="Webinar">Webinar</option>
                <option value="Meetup">Meetup</option>
              </Select>
            </FormField>
          </div>
        </section>

        <section>
          <div style={sectionTitle}>Date & time</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="Start date" required>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FormField>
            <FormField label="Start time" required>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </FormField>
          </div>
        </section>

        <section>
          <div style={sectionTitle}>Where</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <FormField label="Venue">
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
            </FormField>
            <FormField label="Address">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
            </FormField>
            <FormField label="Webinar link">
              <Input value={webinarLink} onChange={(e) => setWebinarLink(e.target.value)} placeholder="https://…" />
            </FormField>
          </div>
        </section>

        <section>
          <div style={sectionTitle}>Details</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: 'var(--type-subhead)', color: 'var(--text)', minHeight: 44 }}>
              <input
                type="checkbox"
                checked={disableRegistrations}
                onChange={(e) => setDisableRegistrations(e.target.checked)}
              />
              Disable registrations
            </label>
            <FormField label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What’s this event about?"
                rows={5}
                style={{ resize: 'vertical' }}
              />
            </FormField>
          </div>
        </section>
      </div>
    </Modal>
  );
};
