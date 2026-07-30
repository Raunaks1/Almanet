import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Mail, MessageSquare, BadgeCheck, Loader2, Edit2, Save, Trash2, X, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';
import { COLLEGE_NAMES, getBranchesForCollege } from '../lib/colleges';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    setEditForm(prev => ({ ...prev, [name]: value }));
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
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone and will erase all your profile data.')) {
      setLoading(true);
      try {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw error;
        await supabase.auth.signOut();
        navigate('/');
      } catch (err: any) {
        console.error('Error deleting account:', err);
        alert('Failed to delete account. Please ensure the delete_user_account SQL function is set up in Supabase.');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={28} color="var(--brand-primary)" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem', background: 'var(--bg-primary)' }}>
        <h2>Profile not found</h2>
        <Link to="/directory" className="btn btn-primary">Back to Directory</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        padding: '1rem 1.5rem',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>{isEditing ? 'Edit Profile' : 'Profile Details'}</h1>
        
        {/* Action Buttons for Own Profile */}
        {isOwnProfile && !isEditing && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}>
              <Edit2 size={16} /> Edit Profile
            </button>
            <button onClick={handleDeleteAccount} className="btn btn-outline" style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}>
              <Trash2 size={16} /> Delete Account
            </button>
          </div>
        )}
        {isEditing && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setIsEditing(false)} className="btn btn-outline" style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }} disabled={isSaving}>
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }} disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
            </button>
          </div>
        )}
      </header>

      <main className="container" style={{ padding: '1.5rem', maxWidth: '900px' }}>
        
        {/* Profile Card */}
        <div className="card animate-fade-in" style={{ padding: '2rem', display: 'flex', gap: '2rem', flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Avatar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', minWidth: '140px' }}>
            {isEditing && isOwnProfile && profile.user_type !== 'admin' ? (
              /* Editable avatar for student/alumni */
              <>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: avatarPreview
                      ? `url(${avatarPreview}) center/cover no-repeat`
                      : profile.avatar_url
                        ? `url(${profile.avatar_url}) center/cover no-repeat`
                        : 'var(--brand-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '2px dashed var(--brand-primary)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {!avatarPreview && !profile.avatar_url && (
                    <span>{(editForm.full_name || profile.full_name || '?').charAt(0)}</span>
                  )}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                  >
                    <Camera size={22} color="#fff" />
                  </div>
                </div>
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
                {(avatarPreview || profile.avatar_url) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                      setEditForm(prev => ({ ...prev, avatar_url: null }));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-danger)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Remove photo
                  </button>
                )}
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>Click to change photo</p>
              </>
            ) : (
              /* Read-only avatar */
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: profile.avatar_url
                  ? `url(${profile.avatar_url}) center/cover no-repeat`
                  : 'var(--brand-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 600,
              }}>
                {!profile.avatar_url && (editForm.full_name || profile.full_name || '?').charAt(0)}
              </div>
            )}
            {!isEditing && !isOwnProfile && (
              <Link to={`/chat?dm=${profile.id}`} className="btn btn-primary" style={{ width: '100%', fontSize: '0.8125rem', textDecoration: 'none' }}>
                <MessageSquare size={16} /> Message
              </Link>
            )}
          </div>

          {/* Details Section */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            {!isEditing ? (
              // VIEW MODE
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>{profile.full_name}</h1>
                  {profile.verification_status === 'approved' && (
                    <div title="Institute Verified" style={{ color: 'var(--brand-primary)' }}>
                      <BadgeCheck size={22} />
                    </div>
                  )}
                </div>
                
                <p style={{ fontSize: '1rem', color: 'var(--brand-primary)', fontWeight: 500, marginBottom: '1.25rem' }}>
                  {profile.user_type === 'alumni' ? (profile.job_title ? `${profile.job_title} at ${profile.employer || profile.industry}` : profile.industry) : profile.user_type === 'student' ? (profile.degree ? `${profile.degree} Student` : 'Student') : 'Admin'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
                  {(profile.user_type === 'student' || profile.user_type === 'alumni') && profile.graduation_year && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <GraduationCap size={18} /> 
                      <span>Class of {profile.graduation_year}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <MapPin size={18} /> 
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Mail size={18} /> 
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <span style={{ fontSize: '1.125rem' }}>📞</span>
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>About</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9375rem' }}>
                    {profile.bio || 'This user hasn\'t added a bio yet.'}
                  </p>
                </div>

                {profile.user_type !== 'admin' && (
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Skills & Expertise</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {profile.skills && profile.skills.length > 0 ? profile.skills.map((skill, index) => (
                        <span key={index} style={{
                          background: 'var(--bg-tertiary)',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 500,
                        }}>
                          {skill}
                        </span>
                      )) : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No skills listed.</span>}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // EDIT MODE
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease-out' }}>
                
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" name="full_name" className="input-field" value={editForm.full_name || ''} onChange={handleInputChange} />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Bio / About</label>
                  <textarea name="bio" className="input-field" rows={4} value={editForm.bio || ''} onChange={handleInputChange} placeholder="Tell us about yourself..."></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Location</label>
                    <input type="text" name="location" className="input-field" value={editForm.location || ''} onChange={handleInputChange} placeholder="City, Country" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Phone (Optional)</label>
                    <input type="tel" name="phone" className="input-field" value={editForm.phone || ''} onChange={handleInputChange} placeholder="+1 234 567 8900" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">LinkedIn URL</label>
                    <input type="url" name="linkedin" className="input-field" value={editForm.linkedin || ''} onChange={handleInputChange} placeholder="https://linkedin.com/in/username" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Twitter / X URL</label>
                    <input type="url" name="twitter" className="input-field" value={editForm.twitter || ''} onChange={handleInputChange} placeholder="https://twitter.com/username" />
                  </div>
                </div>

                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <label className="input-label">Profile Visibility</label>
                  <select name="visibility" className="input-field" value={editForm.visibility || 'public'} onChange={handleInputChange} style={{ appearance: 'none' }}>
                    <option value="public">Public (Visible to everyone)</option>
                    <option value="private">Private (Only you)</option>
                    <option value="alumni-only">Alumni Only (Visible to verified members)</option>
                  </select>
                </div>

                {/* Role Specific Fields */}
                {profile.user_type === 'student' && (
                  <div style={{ marginTop: '0.5rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', color: 'var(--brand-primary)', fontWeight: 600 }}>Student Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div className="input-group">
                        <label className="input-label">College / University</label>
                        <select
                          name="college"
                          className="input-field"
                          value={editForm.college || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, college: e.target.value, branch: '' }))}
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="">— Select college —</option>
                          {COLLEGE_NAMES.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Graduation Year</label>
                        <input type="number" name="graduation_year" className="input-field" value={editForm.graduation_year || ''} onChange={handleInputChange} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Degree (e.g. B.Tech, MS)</label>
                        <input type="text" name="degree" className="input-field" value={editForm.degree || ''} onChange={handleInputChange} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Branch / Major</label>
                        <select
                          name="branch"
                          className="input-field"
                          value={editForm.branch || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, branch: e.target.value }))}
                          disabled={!editForm.college}
                          style={{ cursor: editForm.college ? 'pointer' : 'not-allowed', opacity: editForm.college ? 1 : 0.6 }}
                        >
                          <option value="">{editForm.college ? '— Select branch —' : '— Select college first —'}</option>
                          {getBranchesForCollege(editForm.college || '').map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {profile.user_type === 'alumni' && (
                  <div style={{ marginTop: '0.5rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', color: 'var(--brand-primary)', fontWeight: 600 }}>Alumni Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div className="input-group">
                        <label className="input-label">Current Employer</label>
                        <input type="text" name="employer" className="input-field" value={editForm.employer || ''} onChange={handleInputChange} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Job Title</label>
                        <input type="text" name="job_title" className="input-field" value={editForm.job_title || ''} onChange={handleInputChange} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Industry</label>
                        <input type="text" name="industry" className="input-field" value={editForm.industry || ''} onChange={handleInputChange} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Years of Experience</label>
                        <input type="number" name="years_of_experience" className="input-field" value={editForm.years_of_experience || ''} onChange={handleInputChange} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">College / University</label>
                        <input type="text" name="college" className="input-field" value={editForm.college || ''} onChange={handleInputChange} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Graduation Year</label>
                        <input type="number" name="graduation_year" className="input-field" value={editForm.graduation_year || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                )}

                {profile.user_type === 'admin' && (
                  <div style={{ marginTop: '0.5rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', color: 'var(--brand-primary)', fontWeight: 600 }}>Institution Details</h3>
                    <div className="input-group">
                      <label className="input-label">Mission Statement</label>
                      <textarea name="mission_statement" className="input-field" rows={3} value={editForm.mission_statement || ''} onChange={handleInputChange}></textarea>
                    </div>
                  </div>
                )}
                
                <div className="input-group">
                    <label className="input-label">Skills (Comma separated)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={editForm.skills ? editForm.skills.join(', ') : ''} 
                      onChange={(e) => {
                        const skillsArray = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                        setEditForm(prev => ({ ...prev, skills: skillsArray }));
                      }} 
                      placeholder="React, TypeScript, UI Design"
                    />
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Profile;
