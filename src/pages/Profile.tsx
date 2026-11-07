import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BadgeCheck,
  Briefcase,
  Camera,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';
import { COLLEGE_NAMES, getBranchesForCollege } from '../lib/colleges';
import { DURATION, EASE_REVEAL } from '../lib/motion';
import { PageHeader } from '../components/shell/PageHeader';
import {
  Avatar,
  Badge,
  Button,
  Chip,
  FormField,
  Input,
  Modal,
  SegmentedControl,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '../components/ui';
import { cx } from '../components/ui/internal';
import styles from './Profile.module.css';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'alumni-only', label: 'Alumni only' },
];

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const reduced = useReducedMotion() ?? false;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Current user auth
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Profile photo state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // UI-only state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [skillDraft, setSkillDraft] = useState('');

  useEffect(() => {
    const fetchProfileAndUser = async () => {
      setLoading(true);

      // Get current logged-in user
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);

      if (!id) return;

      // Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
        setEditForm(data as UserProfile);
      }
      setLoading(false);
    };

    fetchProfileAndUser();
  }, [id]);

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      // Upload avatar if a new file was selected
      let avatarUrl = editForm.avatar_url || null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });
        if (uploadError) {
          console.warn('Avatar upload failed:', uploadError.message);
        } else if (uploadData) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
          avatarUrl = urlData.publicUrl;
        }
      }

      const updatedForm = { ...editForm, avatar_url: avatarUrl };
      const { error } = await supabase
        .from('profiles')
        .update(updatedForm)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(updatedForm as UserProfile);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.show({ title: 'Profile saved', variant: 'success' });
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.show({ title: 'Could not save changes', description: 'Please try again.', variant: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      await supabase.auth.signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      toast.show({
        title: 'Failed to delete account',
        description: 'Please ensure the delete_user_account SQL function is set up in Supabase.',
        variant: 'danger',
      });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const addSkill = (raw: string) => {
    const next = raw.split(',').map((s) => s.trim()).filter((s) => s !== '');
    if (next.length === 0) return;
    setEditForm((prev) => {
      const current = prev.skills ?? profile?.skills ?? [];
      const merged = [...current];
      next.forEach((s) => {
        if (!merged.some((m) => m.toLowerCase() === s.toLowerCase())) merged.push(s);
      });
      return { ...prev, skills: merged };
    });
    setSkillDraft('');
  };

  const removeSkill = (skill: string) => {
    setEditForm((prev) => ({ ...prev, skills: (prev.skills ?? []).filter((s) => s !== skill) }));
  };

  const isDirty = useMemo(() => {
    if (!profile) return false;
    if (avatarFile) return true;
    const keys: Array<keyof UserProfile> = [
      'full_name', 'bio', 'location', 'phone', 'linkedin', 'twitter', 'visibility',
      'college', 'graduation_year', 'degree', 'branch', 'industry', 'employer',
      'job_title', 'years_of_experience', 'mission_statement',
    ];
    for (const k of keys) {
      const a = (editForm as any)[k] ?? '';
      const b = (profile as any)[k] ?? '';
      if (String(a) !== String(b)) return true;
    }
    const es = (editForm.skills ?? []).join('|');
    const ps = (profile.skills ?? []).join('|');
    return es !== ps || (editForm.avatar_url ?? '') !== (profile.avatar_url ?? '');
  }, [avatarFile, editForm, profile]);

  const cancelEdit = () => {
    if (profile) setEditForm(profile);
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setSkillDraft('');
  };

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true" aria-label="Loading profile">
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <Skeleton width={88} height={88} radius="circle" />
            <div style={{ flex: 1, minWidth: 220 }}>
              <Skeleton width="55%" height={30} radius={8} />
              <div style={{ height: 8 }} />
              <Skeleton width="40%" height={16} />
              <div style={{ height: 12 }} />
              <Skeleton width={100} height={28} radius={999} />
            </div>
          </div>
        </div>
        <div className={styles.group}><div style={{ padding: 18 }}><Skeleton width="90%" height={14} /><div style={{ height: 8 }} /><Skeleton width="70%" height={14} /></div></div>
        <div className={styles.group}><div style={{ padding: 18 }}><Skeleton width="80%" height={14} /><div style={{ height: 8 }} /><Skeleton width="60%" height={14} /></div></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.statePage}>
        <div className={styles.group} style={{ padding: 28, textAlign: 'center', maxWidth: 420 }}>
          <h2 style={{ margin: 0, font: 'var(--type-headline)', color: 'var(--text)' }}>Profile not found</h2>
          <p style={{ margin: '8px 0 16px', font: 'var(--type-subhead)', color: 'var(--text-2)' }}>
            This profile may not exist or is unavailable.
          </p>
          <Button onClick={() => navigate('/directory')}>Back to directory</Button>
        </div>
      </div>
    );
  }

  const displayAvatar = avatarPreview || profile.avatar_url || null;
  const roleLine = profile.user_type === 'alumni'
    ? (profile.job_title ? `${profile.job_title}${profile.employer || profile.industry ? ` at ${profile.employer || profile.industry}` : ''}` : (profile.industry || 'Alumni'))
    : profile.user_type === 'student'
      ? (profile.degree ? `${profile.degree} student` : 'Student')
      : 'Admin';

  const viewTransition = reduced
    ? { duration: 0.12 }
    : { duration: DURATION.reveal, ease: EASE_REVEAL };

  return (
    <div className={styles.page}>
      {isOwnProfile && (
        <PageHeader
          title={isEditing ? 'Edit profile' : 'Your profile'}
          subtitle={isEditing ? 'Update your details and save when you’re ready.' : 'How others see you in the community.'}
          actions={!isEditing ? <Button onClick={() => setIsEditing(true)}>Edit profile</Button> : undefined}
        />
      )}

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroAvatarWrap}>
            <Avatar name={editForm.full_name || profile.full_name} src={displayAvatar} size="xl" />
            {isEditing && isOwnProfile && profile.user_type !== 'admin' && (
              <>
                <button
                  type="button"
                  className={styles.avatarEditBtn}
                  aria-label="Change photo"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera size={15} strokeWidth={1.75} aria-hidden="true" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setAvatarFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setAvatarPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      setAvatarPreview(null);
                    }
                  }}
                />
              </>
            )}
          </div>
          <div className={styles.heroBody}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{isEditing ? (editForm.full_name || profile.full_name) : profile.full_name}</h1>
              {profile.verification_status === 'approved' && (
                <span className={styles.verified} title="Verified" aria-label="Verified">
                  <BadgeCheck size={22} strokeWidth={1.75} />
                </span>
              )}
            </div>
            <p className={styles.roleLine}>{roleLine}</p>
            <div className={styles.badges}>
              <Badge variant="accent">
                {profile.user_type === 'alumni' ? 'Alumni' : profile.user_type === 'student' ? 'Student' : 'Admin'}
              </Badge>
              {profile.visibility && profile.visibility !== 'public' && (
                <Badge variant="neutral">{profile.visibility === 'alumni-only' ? 'Alumni only' : 'Private'}</Badge>
              )}
            </div>
            {!isEditing && (
              <div className={styles.quickActions}>
                {!isOwnProfile && (
                  <Link to={`/chat?dm=${profile.id}`} className={cx(styles.qaBtn, styles.qaPrimary)}>
                    <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />
                    Message
                  </Link>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className={styles.qaBtn}>
                    <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
                    LinkedIn
                  </a>
                )}
                {profile.twitter && (
                  <a href={profile.twitter} target="_blank" rel="noreferrer" className={styles.qaBtn}>
                    <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
                    Twitter
                  </a>
                )}
              </div>
            )}
            {isEditing && isOwnProfile && (avatarPreview || profile.avatar_url) && (
              <button
                type="button"
                className={styles.avatarRemove}
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  setEditForm((prev) => ({ ...prev, avatar_url: undefined }));
                }}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {!isEditing ? (
          <motion.div
            key="view"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={viewTransition}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <section className={styles.group} aria-labelledby="about-title">
              <div className={styles.groupHeader}><h2 id="about-title" className={styles.groupTitle}>About</h2></div>
              <ul className={styles.rows}>
                <li className={styles.row}>
                  <span className={styles.rowBody}>
                    <p className={cx(styles.rowValue, !profile.bio && styles.rowEmpty)}>
                      {profile.bio || 'No bio added yet.'}
                    </p>
                  </span>
                </li>
              </ul>
            </section>

            {(profile.user_type === 'alumni' || profile.employer || profile.job_title || profile.industry) && (
              <section className={styles.group} aria-labelledby="exp-title">
                <div className={styles.groupHeader}><h2 id="exp-title" className={styles.groupTitle}>Experience</h2></div>
                <ul className={styles.rows}>
                  {(profile.job_title || profile.employer) && (
                    <li className={styles.row}>
                      <Briefcase size={18} strokeWidth={1.75} className={styles.rowIcon} aria-hidden="true" />
                      <span className={styles.rowBody}>
                        <span className={styles.rowLabel}>Role</span>
                        <p className={styles.rowValue}>
                          {[profile.job_title, profile.employer].filter(Boolean).join(' · ')}
                        </p>
                      </span>
                    </li>
                  )}
                  {profile.industry && (
                    <li className={styles.row}>
                      <span className={styles.rowIcon} style={{ width: 18 }} aria-hidden="true" />
                      <span className={styles.rowBody}>
                        <span className={styles.rowLabel}>Industry</span>
                        <p className={styles.rowValue}>{profile.industry}</p>
                      </span>
                    </li>
                  )}
                  {profile.years_of_experience != null && (
                    <li className={styles.row}>
                      <span className={styles.rowIcon} style={{ width: 18 }} aria-hidden="true" />
                      <span className={styles.rowBody}>
                        <span className={styles.rowLabel}>Experience</span>
                        <p className={styles.rowValue}>{profile.years_of_experience} years</p>
                      </span>
                    </li>
                  )}
                </ul>
              </section>
            )}

            {(profile.college || profile.degree || profile.branch || profile.graduation_year) && (
              <section className={styles.group} aria-labelledby="edu-title">
                <div className={styles.groupHeader}><h2 id="edu-title" className={styles.groupTitle}>Education</h2></div>
                <ul className={styles.rows}>
                  {profile.college && (
                    <li className={styles.row}>
                      <GraduationCap size={18} strokeWidth={1.75} className={styles.rowIcon} aria-hidden="true" />
                      <span className={styles.rowBody}>
                        <span className={styles.rowLabel}>College</span>
                        <p className={styles.rowValue}>{profile.college}</p>
                      </span>
                    </li>
                  )}
                  {(profile.degree || profile.branch) && (
                    <li className={styles.row}>
                      <span className={styles.rowIcon} style={{ width: 18 }} aria-hidden="true" />
                      <span className={styles.rowBody}>
                        <span className={styles.rowLabel}>Program</span>
                        <p className={styles.rowValue}>{[profile.degree, profile.branch].filter(Boolean).join(' · ')}</p>
                      </span>
                    </li>
                  )}
                  {profile.graduation_year && (
                    <li className={styles.row}>
                      <span className={styles.rowIcon} style={{ width: 18 }} aria-hidden="true" />
                      <span className={styles.rowBody}>
                        <span className={styles.rowLabel}>Graduation year</span>
                        <p className={styles.rowValue}>{profile.graduation_year}</p>
                      </span>
                    </li>
                  )}
                </ul>
              </section>
            )}

            {profile.user_type !== 'admin' && (
              <section className={styles.group} aria-labelledby="skills-title">
                <div className={styles.groupHeader}><h2 id="skills-title" className={styles.groupTitle}>Skills</h2></div>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className={styles.skillsWrap}>
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="neutral">{skill}</Badge>
                    ))}
                  </div>
                ) : (
                  <ul className={styles.rows}><li className={styles.row}><p className={cx(styles.rowValue, styles.rowEmpty)}>No skills listed.</p></li></ul>
                )}
              </section>
            )}

            <section className={styles.group} aria-labelledby="contact-title">
              <div className={styles.groupHeader}><h2 id="contact-title" className={styles.groupTitle}>Contact</h2></div>
              <ul className={styles.rows}>
                <li className={styles.row}>
                  <Mail size={18} strokeWidth={1.75} className={styles.rowIcon} aria-hidden="true" />
                  <span className={styles.rowBody}>
                    <span className={styles.rowLabel}>Email</span>
                    <p className={styles.rowValue}>{profile.email}</p>
                  </span>
                </li>
                {profile.phone && (
                  <li className={styles.row}>
                    <Phone size={18} strokeWidth={1.75} className={styles.rowIcon} aria-hidden="true" />
                    <span className={styles.rowBody}>
                      <span className={styles.rowLabel}>Phone</span>
                      <p className={styles.rowValue}>{profile.phone}</p>
                    </span>
                  </li>
                )}
                {profile.location && (
                  <li className={styles.row}>
                    <MapPin size={18} strokeWidth={1.75} className={styles.rowIcon} aria-hidden="true" />
                    <span className={styles.rowBody}>
                      <span className={styles.rowLabel}>Location</span>
                      <p className={styles.rowValue}>{profile.location}</p>
                    </span>
                  </li>
                )}
              </ul>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={viewTransition}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <section className={styles.group}>
              <div className={styles.groupHeader}><h2 className={styles.groupTitle}>About</h2></div>
              <div className={styles.editForm}>
                <FormField label="Full name">
                  <Input name="full_name" value={editForm.full_name || ''} onChange={handleInputChange} />
                </FormField>
                <FormField label="Bio">
                  <Textarea name="bio" rows={4} value={editForm.bio || ''} onChange={handleInputChange} placeholder="Tell us about yourself…" />
                </FormField>
                <div className={styles.segRow}>
                  <span className={styles.segLabel}>Profile visibility</span>
                  <SegmentedControl
                    aria-label="Profile visibility"
                    value={(editForm.visibility as string) || 'public'}
                    onChange={(v) => setEditForm((prev) => ({ ...prev, visibility: v as UserProfile['visibility'] }))}
                    options={VISIBILITY_OPTIONS}
                  />
                </div>
              </div>
            </section>

            <section className={styles.group}>
              <div className={styles.groupHeader}><h2 className={styles.groupTitle}>Contact</h2></div>
              <div className={styles.editForm}>
                <div className={styles.editGrid}>
                  <FormField label="Location">
                    <Input name="location" value={editForm.location || ''} onChange={handleInputChange} placeholder="City, Country" />
                  </FormField>
                  <FormField label="Phone">
                    <Input type="tel" name="phone" value={editForm.phone || ''} onChange={handleInputChange} placeholder="+91 98765 43210" />
                  </FormField>
                  <FormField label="LinkedIn URL">
                    <Input type="url" name="linkedin" value={editForm.linkedin || ''} onChange={handleInputChange} placeholder="https://linkedin.com/in/username" />
                  </FormField>
                  <FormField label="Twitter / X URL">
                    <Input type="url" name="twitter" value={editForm.twitter || ''} onChange={handleInputChange} placeholder="https://twitter.com/username" />
                  </FormField>
                </div>
              </div>
            </section>

            {profile.user_type === 'student' && (
              <section className={styles.group}>
                <div className={styles.groupHeader}><h2 className={styles.groupTitle}>Education</h2></div>
                <div className={styles.editForm}>
                  <div className={styles.editGrid}>
                    <FormField label="College / university">
                      <Select
                        name="college"
                        value={editForm.college || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, college: e.target.value, branch: '' }))}
                      >
                        <option value="">— Select college —</option>
                        {COLLEGE_NAMES.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Graduation year">
                      <Input type="number" name="graduation_year" value={(editForm.graduation_year as any) || ''} onChange={handleInputChange} />
                    </FormField>
                    <FormField label="Degree">
                      <Select name="degree" value={editForm.degree || ''} onChange={handleInputChange}>
                        <option value="">— Select degree —</option>
                        <option value="B.Tech / B.E. (Bachelor of Technology / Engineering)">B.Tech / B.E. (Bachelor of Technology / Engineering)</option>
                        <option value="M.Tech / M.E. (Master of Technology / Engineering)">M.Tech / M.E. (Master of Technology / Engineering)</option>
                        <option value="Ph.D.">Ph.D.</option>
                      </Select>
                    </FormField>
                    <FormField label="Branch / major">
                      <Select
                        name="branch"
                        value={editForm.branch || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, branch: e.target.value }))}
                        disabled={!editForm.college}
                      >
                        <option value="">{editForm.college ? '— Select branch —' : '— Select college first —'}</option>
                        {getBranchesForCollege(editForm.college || '').map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                </div>
              </section>
            )}

            {profile.user_type === 'alumni' && (
              <section className={styles.group}>
                <div className={styles.groupHeader}><h2 className={styles.groupTitle}>Experience & education</h2></div>
                <div className={styles.editForm}>
                  <div className={styles.editGrid}>
                    <FormField label="Current employer">
                      <Input name="employer" value={editForm.employer || ''} onChange={handleInputChange} />
                    </FormField>
                    <FormField label="Job title">
                      <Input name="job_title" value={editForm.job_title || ''} onChange={handleInputChange} />
                    </FormField>
                    <FormField label="Industry">
                      <Input name="industry" value={editForm.industry || ''} onChange={handleInputChange} />
                    </FormField>
                    <FormField label="Years of experience">
                      <Input type="number" name="years_of_experience" value={(editForm.years_of_experience as any) || ''} onChange={handleInputChange} />
                    </FormField>
                    <FormField label="College / university">
                      <Input name="college" value={editForm.college || ''} onChange={handleInputChange} />
                    </FormField>
                    <FormField label="Graduation year">
                      <Input type="number" name="graduation_year" value={(editForm.graduation_year as any) || ''} onChange={handleInputChange} />
                    </FormField>
                  </div>
                </div>
              </section>
            )}

            {profile.user_type === 'admin' && (
              <section className={styles.group}>
                <div className={styles.groupHeader}><h2 className={styles.groupTitle}>Institution details</h2></div>
                <div className={styles.editForm}>
                  <FormField label="Mission statement">
                    <Textarea name="mission_statement" rows={3} value={editForm.mission_statement || ''} onChange={handleInputChange} />
                  </FormField>
                </div>
              </section>
            )}

            {profile.user_type !== 'admin' && (
              <section className={styles.group}>
                <div className={styles.groupHeader}><h2 className={styles.groupTitle}>Skills</h2></div>
                <div className={styles.editForm}>
                  <FormField label="Skills" hint="Press Enter or comma to add a skill.">
                    <div className={styles.skillInputWrap}>
                      <div className={styles.skillChips}>
                        <AnimatePresence initial={false}>
                          {(editForm.skills ?? []).map((skill) => (
                            <motion.span
                              key={skill}
                              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                              transition={{ duration: DURATION.fast, ease: EASE_REVEAL }}
                              style={{ display: 'inline-flex' }}
                            >
                              <Chip onRemove={() => removeSkill(skill)}>{skill}</Chip>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                      <input
                        className={styles.skillInput}
                        value={skillDraft}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v.includes(',')) addSkill(v);
                          else setSkillDraft(v);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill(skillDraft);
                          } else if (e.key === 'Backspace' && !skillDraft && (editForm.skills?.length ?? 0) > 0) {
                            removeSkill(editForm.skills![editForm.skills!.length - 1]);
                          }
                        }}
                        placeholder={(editForm.skills?.length ?? 0) === 0 ? 'e.g. React, TypeScript, Design' : 'Add a skill'}
                        aria-label="Add a skill"
                      />
                    </div>
                  </FormField>
                </div>
              </section>
            )}

            {isOwnProfile && (
              <section className={cx(styles.group, styles.dangerGroup)}>
                <div className={styles.groupHeader}><h2 className={styles.groupTitle}>Danger zone</h2></div>
                <div className={styles.dangerBody}>
                  <p className={styles.dangerText}>
                    Permanently delete your account and profile data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                    Delete account
                  </Button>
                </div>
              </section>
            )}

            {/* Sticky save bar */}
            <div className={styles.saveBar} role="region" aria-label="Save changes">
              <p className={styles.saveHint}>
                {isDirty ? <><strong>Unsaved changes.</strong> Save when you’re ready.</> : 'No unsaved changes.'}
              </p>
              <div className={styles.saveActions}>
                <Button variant="secondary" onClick={cancelEdit} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} loading={isSaving} disabled={!isDirty && !avatarFile}>
                  Save changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Delete account?"
        subtitle="This will permanently erase your profile data. This action cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} loading={deleting}>Delete account</Button>
          </>
        }
      >
        <p style={{ margin: 0, font: 'var(--type-subhead)', color: 'var(--text-2)' }}>
          If you’re sure, confirm below. You’ll be signed out and returned to the home page.
        </p>
      </Modal>
    </div>
  );
};

export default Profile;
