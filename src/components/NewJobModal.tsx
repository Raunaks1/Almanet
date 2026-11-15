import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Modal, Button, FormField, Input, Textarea, Select, useToast } from './ui';
import type { JobPost } from '../pages/Jobs';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newJob: JobPost) => void;
  jobToEdit?: JobPost;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({ isOpen, onClose, onSuccess, jobToEdit }) => {
  const { show: showToast } = useToast();
  const isEditing = !!jobToEdit;
  const [jobTitle, setJobTitle] = useState(jobToEdit?.title || '');
  const [companyName, setCompanyName] = useState(jobToEdit?.company || '');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [jobType, setJobType] = useState<JobPost['type']>(jobToEdit?.type || 'Full-time');
  const [expFrom, setExpFrom] = useState('-- From --');
  const [expTo, setExpTo] = useState('-- To --');
  const [location, setLocation] = useState(jobToEdit?.location || '');
  const [receiveApp, setReceiveApp] = useState('email');
  const [contactEmail, setContactEmail] = useState('');
  const [jobArea, setJobArea] = useState('');
  const [description, setDescription] = useState(jobToEdit?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clearError = () => setSubmitError(null);

  // Fetch the authenticated user from the session — source of truth, never trust props.
  const getAuthenticatedUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('Please log in to post a job.');
    }
    return user;
  };

  // Verify the user has a profile record before inserting/updating a job.
  const verifyProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', userId)
      .single();
    if (error || !profile) {
      throw new Error('Profile not found. Please complete your profile before posting a job.');
    }
    return profile;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // --- Validation ---
    if (!jobTitle.trim()) {
      setSubmitError('Job title is required.');
      return;
    }
    if (!companyName.trim()) {
      setSubmitError('Company name is required.');
      return;
    }
    if (!location.trim()) {
      setSubmitError('Location is required.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Job description is required.');
      return;
    }
    if (companyWebsite.trim()) {
      try {
        new URL(companyWebsite.trim());
      } catch {
        setSubmitError('Please enter a valid company website URL.');
        return;
      }
    }
    if (contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail.trim())) {
        setSubmitError('Please enter a valid contact email.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const user = await getAuthenticatedUser();
      await verifyProfile(user.id);

      if (isEditing && jobToEdit) {
        // --- Update existing job ---
        const { data, error } = await supabase
          .from('jobs')
          .update({
            title: jobTitle.trim(),
            company: companyName.trim(),
            location: location.trim(),
            type: jobType,
            description: description.trim(),
          })
          .eq('id', jobToEdit.id)
          .select(`
            *,
            profiles:profiles!jobs_author_id_profiles_fkey (
              full_name
            )
          `)
          .single();

        if (error) throw error;

        showToast({
          title: 'Job updated',
          description: 'Your job posting has been updated.',
          variant: 'success',
        });

        onSuccess(data as unknown as JobPost);
      } else {
        // --- Insert new job ---
        const newJob = {
          author_id: user.id,
          title: jobTitle.trim(),
          company: companyName.trim(),
          location: location.trim(),
          type: jobType,
          description: description.trim(),
          requirements: [],
        };

        const { data, error } = await supabase
          .from('jobs')
          .insert([newJob])
          .select(`
            *,
            profiles:profiles!jobs_author_id_profiles_fkey (
              full_name
            )
          `)
          .single();

        if (error) throw error;

        showToast({
          title: 'Job posted',
          description: 'Your opportunity has been shared with the community.',
          variant: 'success',
        });

        onSuccess(data as unknown as JobPost);
      }

      // Reset form
      setJobTitle('');
      setCompanyName('');
      setCompanyWebsite('');
      setJobType('Full-time');
      setExpFrom('-- From --');
      setExpTo('-- To --');
      setLocation('');
      setReceiveApp('email');
      setContactEmail('');
      setJobArea('');
      setDescription('');
      onClose();
    } catch (err: any) {
      console.error('Job error:', err);
      let message = 'Failed to save job. Please try again.';
      if (err?.message) {
        if (err.message.includes('Please log in')) {
          message = err.message;
        } else if (err.message.includes('Profile not found')) {
          message = err.message;
        } else if (err.message.includes('foreign key') || err.message.includes('relationship')) {
          message = 'Unable to save job: database relationship not configured. Please contact support.';
        } else if (err.message.includes('row-level security') || err.message.includes('RLS') || err.message.includes('permission')) {
          message = isEditing ? 'You are not authorized to edit this job.' : 'You are not authorized to post jobs.';
        } else if (err.message.includes('network') || err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          message = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('duplicate')) {
          message = 'A job with these details may already exist.';
        }
      }
      setSubmitError(message);
      showToast({
        title: isEditing ? 'Job update failed' : 'Job post failed',
        description: message,
        variant: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prefill form when editing an existing job.
  useEffect(() => {
    if (!isOpen || !jobToEdit) return;
    setJobTitle(jobToEdit.title);
    setCompanyName(jobToEdit.company);
    setLocation(jobToEdit.location);
    setJobType(jobToEdit.type as JobPost['type']);
    setDescription(jobToEdit.description);
  }, [isOpen, jobToEdit]);

  // Prefill contact email from the authenticated session when the modal opens (create mode only).
  useEffect(() => {
    if (!isOpen || isEditing) return;
    const prefills = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setContactEmail(user.email);
        }
      } catch {
        // Email prefill is non-fatal.
      }
    };
    prefills();
  }, [isOpen, isEditing]);

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
      title={isEditing ? 'Edit job' : 'Post a job'}
      subtitle={isEditing ? 'Update the job details below.' : 'Share an opportunity with the community.'}
      maxWidth={720}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
            {isEditing ? 'Update job' : 'Post job'}
          </Button>
        </>
      }
    >
      {submitError && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            marginBottom: 12,
            background: 'rgba(255, 59, 48, 0.08)',
            border: '1px solid rgba(255, 59, 48, 0.35)',
            borderRadius: 10,
            color: '#FF3B30',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {submitError}
        </div>
      )}
      <div style={{ display: 'grid', gap: 18 }}>
        <section>
          <div style={sectionTitle}>Role</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <FormField label="Job title" required error={!jobTitle.trim() ? 'Job title is required.' : submitError?.includes('Job title') ? 'Job title is required.' : undefined}>
              <Input
                value={jobTitle}
                onChange={(e) => {
                  setJobTitle(e.target.value);
                  clearError();
                }}
                placeholder="e.g. Frontend Engineer"
              />
            </FormField>
            <FormField label="Job area">
              <Input
                value={jobArea}
                onChange={(e) => setJobArea(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </FormField>
            <FormField label="Job type">
              <Select value={jobType} onChange={(e) => setJobType(e.target.value as JobPost['type'])} aria-label="Job type">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </Select>
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
              <FormField label="Company name" required error={!companyName.trim() ? 'Company name is required.' : submitError?.includes('Company name') ? 'Company name is required.' : undefined}>
                <Input
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    clearError();
                  }}
                  placeholder="Company"
                />
              </FormField>
              <FormField label="Location" required error={!location.trim() ? 'Location is required.' : submitError?.includes('Location') ? 'Location is required.' : undefined}>
                <Input
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    clearError();
                  }}
                  placeholder="City or Remote"
                />
              </FormField>
            </div>
            <FormField label="Company website" error={submitError?.includes('website URL') ? 'Please enter a valid company website URL.' : undefined}>
              <Input
                value={companyWebsite}
                onChange={(e) => {
                  setCompanyWebsite(e.target.value);
                  clearError();
                }}
                placeholder="https://…"
              />
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
            <FormField label="Contact email" error={submitError?.includes('contact email') ? 'Please enter a valid contact email.' : undefined}>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  clearError();
                }}
                placeholder="you@company.com"
              />
            </FormField>
          </div>
        </section>

        <section>
          <div style={sectionTitle}>Description</div>
          <FormField label="Job details" required error={!description.trim() ? 'Job description is required.' : submitError?.includes('Job description') ? 'Job description is required.' : undefined}>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearError();
              }}
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
