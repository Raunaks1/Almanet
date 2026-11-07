import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Modal, Button, FormField, Input, Textarea, Select } from './ui';
import type { JobPost } from '../pages/Jobs';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onSuccess: (newJob: JobPost) => void;
}

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
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit handler, extraDetails/newJob payload shape, insert, and onSuccess preserved exactly.
  const handleSubmit = async () => {
    if (!jobTitle.trim() || !companyName.trim() || !location.trim() || !description.trim()) {
      alert('Please fill required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const extraDetails = {
        website: companyWebsite,
        experience: `${expFrom} - ${expTo}`,
        applicationMode: receiveApp,
        email: contactEmail,
        area: jobArea,
      };

      const newJob = {
        title: jobTitle,
        company: companyName,
        location: location,
        type: expTo as any, // Mapping expTo as placeholder
        description: description,
        requirements: [],
        tags: [],
        extraDetails,
      };

      const { data, error } = await supabase
        .from('jobs')
        .insert([newJob])
        .select('*, profiles:author_id (full_name)')
        .single();

      if (error) throw error;

      onSuccess(data as JobPost);

      // reset
      setJobTitle('');
      setCompanyName('');
      setCompanyWebsite('');
      setExpFrom('-- From --');
      setExpTo('-- To --');
      setLocation('');
      setReceiveApp('email');
      setContactEmail(currentUser?.email || '');
      setJobArea('');
      setDescription('');
    } catch (err: any) {
      alert('Failed to post job: ' + err.message);
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
      title="Post a job"
      subtitle="Share an opportunity with the community."
      maxWidth={720}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Post job
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section>
          <div style={sectionTitle}>Role</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <FormField label="Job title" required>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Frontend Engineer" />
            </FormField>
            <FormField label="Job area">
              <Input value={jobArea} onChange={(e) => setJobArea(e.target.value)} placeholder="e.g. Engineering" />
            </FormField>
            <FormField label="Experience range">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Select value={expFrom} onChange={(e) => setExpFrom(e.target.value)} aria-label="Experience from">
                  <option value="-- From --">-- From --</option>
                  <option value="0">0 years</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="5">5+ years</option>
                </Select>
                <Select value={expTo} onChange={(e) => setExpTo(e.target.value)} aria-label="Experience to">
                  <option value="-- To --">-- To --</option>
                  <option value="1">1 year</option>
                  <option value="3">3 years</option>
                  <option value="5">5 years</option>
                  <option value="10+">10+ years</option>
                </Select>
              </div>
            </FormField>
          </div>
        </section>

        <section>
          <div style={sectionTitle}>Company & location</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="Company name" required>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company" />
              </FormField>
              <FormField label="Location" required>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or Remote" />
              </FormField>
            </div>
            <FormField label="Company website">
              <Input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://…" />
            </FormField>
          </div>
        </section>

        <section>
          <div style={sectionTitle}>Application</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <FormField label="Receive applications">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', minHeight: 44 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: 'var(--type-subhead)', color: 'var(--text)' }}>
                  <input
                    type="radio"
                    name="receiveApp"
                    checked={receiveApp === 'email'}
                    onChange={() => setReceiveApp('email')}
                  />
                  Email
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: 'var(--type-subhead)', color: 'var(--text)' }}>
                  <input
                    type="radio"
                    name="receiveApp"
                    checked={receiveApp === 'walkin'}
                    onChange={() => setReceiveApp('walkin')}
                  />
                  Walk-in
                </label>
              </div>
            </FormField>
            <FormField label="Contact email">
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@company.com" />
            </FormField>
          </div>
        </section>

        <section>
          <div style={sectionTitle}>Description</div>
          <FormField label="Job details" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and requirements…"
              rows={6}
              style={{ resize: 'vertical' }}
            />
          </FormField>
        </section>
      </div>
    </Modal>
  );
};
