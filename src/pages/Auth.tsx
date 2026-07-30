import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GraduationCap, ArrowLeft, Loader2, Sun, Moon, Search, X, Camera } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { COLLEGE_NAMES, getBranchesForCollege } from '../lib/colleges';

const Auth: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [userType, setUserType] = useState<'student' | 'alumni' | 'admin'>('alumni');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Cohort & Verification Fields
  const [college, setCollege] = useState('');
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showCollegeList, setShowCollegeList] = useState(false);
  const collegeRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (collegeRef.current && !collegeRef.current.contains(e.target as Node)) {
        setShowCollegeList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredColleges = COLLEGE_NAMES.filter(name =>
    name.toLowerCase().includes(collegeSearch.toLowerCase())
  );
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [adminPassphrase, setAdminPassphrase] = useState('');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        // Enforce admin pass-phrase for admin registrations
        if (userType === 'admin' && adminPassphrase !== 'admin123') {
          setError('Invalid admin pass-phrase.');
          setLoading(false);
          return;
        }
        // Upload profile photo if provided (student/alumni only)
        let avatarUrl: string | null = null;
        if (profilePhoto && userType !== 'admin') {
          const fileExt = profilePhoto.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, profilePhoto, { upsert: true });
          if (uploadError) {
            console.warn('Avatar upload failed:', uploadError.message);
          } else if (uploadData) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
            avatarUrl = urlData.publicUrl;
          }
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: userType,
              college: college || null,
              degree: userType === 'admin' ? null : (degree || null),
              branch: userType === 'admin' ? null : (branch || null),
              graduation_year: userType === 'admin' ? null : (graduationYear ? parseInt(graduationYear) : null),
              verification_status: userType === 'admin' ? 'approved' : 'pending',
              avatar_url: avatarUrl,
            }
          }
        });
        if (signUpError) throw signUpError;
        alert('Registration successful! Please check your email.');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const userTypeOptions: Array<{ value: 'alumni' | 'student' | 'admin'; label: string }> = [
    { value: 'alumni', label: 'Alumni' },
    { value: 'student', label: 'Student' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg-secondary)' }}>
      
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-ghost"
          style={{ padding: '0.5rem 0.75rem' }}
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <button
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label="Toggle theme"
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--brand-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GraduationCap size={28} color="var(--brand-primary)" />
            </div>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {mode === 'login' 
              ? 'Enter your credentials to access the network' 
              : 'Join the AlmaNET community today'
            }
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--accent-danger-subtle)',
            border: '1px solid var(--accent-danger)',
            color: 'var(--accent-danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="input-group">
                <label className="input-label">I am a</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {userTypeOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setUserType(opt.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        border: `1px solid ${userType === opt.value ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                        background: userType === opt.value ? 'var(--brand-subtle)' : 'transparent',
                        color: userType === opt.value ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Photo Picker – student & alumni only */}
              {userType !== 'admin' && (
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <label className="input-label" style={{ alignSelf: 'flex-start' }}>Profile Photo <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span></label>
                  <div
                    onClick={() => profilePhotoRef.current?.click()}
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '50%',
                      background: profilePhotoPreview ? `url(${profilePhotoPreview}) center/cover no-repeat` : 'var(--bg-tertiary)',
                      border: `2px dashed ${profilePhotoPreview ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = profilePhotoPreview ? 'var(--brand-primary)' : 'var(--border-color)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {!profilePhotoPreview && (
                      <Camera size={24} color="var(--text-tertiary)" />
                    )}
                    {profilePhotoPreview && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                      >
                        <Camera size={20} color="#fff" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={profilePhotoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setProfilePhoto(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      } else {
                        setProfilePhotoPreview(null);
                      }
                    }}
                  />
                  {profilePhotoPreview && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setProfilePhoto(null); setProfilePhotoPreview(null); }}
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
                </div>
              )}

              <div className="input-group">
                <label className="input-label" htmlFor="fullName">Full Name</label>
                <input 
                  type="text" 
                  id="fullName" 
                  className="input-field" 
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group" ref={collegeRef} style={{ position: 'relative' }}>
                <label className="input-label" htmlFor="collegeSearch">College / Institute Name</label>

                {/* Show selected college as a chip, or the search input */}
                {college ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.875rem',
                    background: 'var(--brand-subtle)',
                    border: '1px solid var(--brand-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem',
                    color: 'var(--brand-primary)',
                    fontWeight: 500,
                  }}>
                    <GraduationCap size={15} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{college}</span>
                    <button
                      type="button"
                      onClick={() => { setCollege(''); setCollegeSearch(''); setBranch(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)', padding: '0', display: 'flex' }}
                      aria-label="Clear college selection"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{
                      position: 'absolute', left: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none',
                    }} />
                    <input
                      id="collegeSearch"
                      type="text"
                      className="input-field"
                      placeholder="Search your college..."
                      value={collegeSearch}
                      onChange={(e) => { setCollegeSearch(e.target.value); setShowCollegeList(true); }}
                      onFocus={() => setShowCollegeList(true)}
                      autoComplete="off"
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                )}

                {/* Hidden input to satisfy form required validation */}
                <input type="hidden" value={college} required />

                {/* Dropdown list */}
                {showCollegeList && !college && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 200,
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}>
                    {filteredColleges.length === 0 ? (
                      <div style={{ padding: '0.875rem 1rem', color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center' }}>
                        No colleges found
                      </div>
                    ) : (
                      filteredColleges.map(name => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setCollege(name); setCollegeSearch(''); setShowCollegeList(false); setBranch(''); }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.6rem 1rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {userType === 'admin' ? (
                <div className="input-group">
                  <label className="input-label" htmlFor="adminPassphrase">Admin Verification Pass-phrase</label>
                  <input 
                    type="password" 
                    id="adminPassphrase" 
                    className="input-field" 
                    placeholder="Enter college admin code"
                    value={adminPassphrase}
                    onChange={(e) => setAdminPassphrase(e.target.value)}
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Hint: Use 'admin123' for this prototype.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label" htmlFor="degree">Degree</label>
                      <input 
                        type="text" 
                        id="degree" 
                        className="input-field" 
                        placeholder="e.g. B.Tech"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label" htmlFor="graduationYear">Graduation Year</label>
                      <input 
                        type="number" 
                        id="graduationYear" 
                        className="input-field" 
                        placeholder="e.g. 2024"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="branch">Branch / Major</label>
                    <select
                      id="branch"
                      className="input-field"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                      disabled={!college}
                      style={{ cursor: college ? 'pointer' : 'not-allowed', opacity: college ? 1 : 0.6 }}
                    >
                      <option value="">{college ? '— Select your branch —' : '— Select college first —'}</option>
                      {getBranchesForCollege(college).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {!college && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Please select a college first to see available branches.</p>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="idDocument">Upload ID / Certificate (Verification)</label>
                    <input 
                      type="file" 
                      id="idDocument" 
                      className="input-field"
                      style={{ padding: '0.5rem' }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setIdDocument(e.target.files ? e.target.files[0] : null)}
                      required
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Upload a valid college ID or degree certificate for admin review.</p>
                  </div>
                </>
              )}
            </>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              className="input-field" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('register')} style={{ color: 'var(--brand-primary)', fontWeight: 500 }}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} style={{ color: 'var(--brand-primary)', fontWeight: 500 }}>
                Sign in
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Auth;
