import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GraduationCap, ArrowLeft, Loader2, Search, X, Camera } from 'lucide-react';
import { COLLEGE_NAMES, getBranchesForCollege } from '../lib/colleges';

const COLORS = {
  bg: '#FBFBF9',
  text: '#0D1E14',
  textMuted: '#4A5D53',
  sage: '#CCDAC6',
  lavender: '#D9CFF5',
  blue: '#C7E4F2',
  white: '#FFFFFF',
  border: '#0D1E14',
  danger: '#ff4444',
  dangerSubtle: '#ffecec'
};

const inputStyles = {
  padding: '0.875rem 1.25rem',
  borderRadius: '99px',
  border: `2px solid ${COLORS.border}`,
  fontSize: '0.9375rem',
  fontWeight: 500,
  outline: 'none',
  width: '100%',
  boxShadow: '4px 4px 0px rgba(13,30,20,1)',
  backgroundColor: COLORS.white,
  color: COLORS.text,
  transition: 'all 0.2s ease',
  boxSizing: 'border-box' as const,
};

const labelStyles = {
  fontWeight: 700, 
  color: COLORS.text, 
  marginBottom: '0.5rem', 
  display: 'block',
  fontSize: '0.875rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em'
};

const Auth: React.FC = () => {
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

  const userTypeOptions: Array<{ value: 'alumni' | 'student' | 'admin'; label: string; color: string }> = [
    { value: 'alumni', label: 'Alumni', color: COLORS.lavender },
    { value: 'student', label: 'Student', color: COLORS.sage },
    { value: 'admin', label: 'Admin', color: COLORS.blue },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: COLORS.bg, fontFamily: '"Inter", sans-serif' }}>
      
      <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', gap: '0.75rem' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            padding: '0.5rem 1rem', 
            background: COLORS.white, 
            border: `1.5px solid ${COLORS.border}`, 
            borderRadius: '99px', 
            fontWeight: 700, 
            color: COLORS.text, 
            boxShadow: '4px 4px 0px rgba(13,30,20,1)', 
            cursor: 'pointer',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div style={{ 
        width: '100%', 
        maxWidth: '560px', 
        padding: '3rem',
        background: COLORS.white,
        borderRadius: '32px',
        border: `2px solid ${COLORS.border}`,
        boxShadow: '12px 12px 0px rgba(13,30,20,1)',
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: COLORS.sage,
              border: `2px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '4px 4px 0px rgba(13,30,20,1)',
            }}>
              <GraduationCap size={32} color={COLORS.text} strokeWidth={2.5} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: COLORS.text, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            {mode === 'login' ? 'Welcome Back' : 'Join AlmaNET'}
          </h2>
          <p style={{ color: COLORS.textMuted, fontSize: '1rem', fontWeight: 500 }}>
            {mode === 'login' 
              ? 'Enter your credentials to access the network' 
              : 'The official platform for professional growth'
            }
          </p>
        </div>

        {error && (
          <div style={{
            background: COLORS.dangerSubtle,
            border: `2px solid ${COLORS.danger}`,
            color: COLORS.danger,
            padding: '1rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            boxShadow: `4px 4px 0px ${COLORS.danger}`,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {mode === 'register' && (
            <>
              <div>
                <label style={labelStyles}>I am a</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {userTypeOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setUserType(opt.value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '99px',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        border: `2px solid ${COLORS.border}`,
                        background: userType === opt.value ? opt.color : COLORS.white,
                        color: COLORS.text,
                        cursor: 'pointer',
                        boxShadow: userType === opt.value ? 'none' : '4px 4px 0px rgba(13,30,20,1)',
                        transform: userType === opt.value ? 'translate(4px, 4px)' : 'none',
                        transition: 'all 0.1s ease',
                        textTransform: 'uppercase'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Photo Picker – student & alumni only */}
              {userType !== 'admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{...labelStyles, alignSelf: 'flex-start'}}>Profile Photo <span style={{ color: COLORS.textMuted, fontWeight: 500, textTransform: 'none' }}>(Optional)</span></label>
                  <div
                    onClick={() => profilePhotoRef.current?.click()}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: profilePhotoPreview ? `url(${profilePhotoPreview}) center/cover no-repeat` : COLORS.bg,
                      border: `2px dashed ${COLORS.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden',
                    }}
                  >
                    {!profilePhotoPreview && (
                      <Camera size={28} color={COLORS.textMuted} />
                    )}
                    {profilePhotoPreview && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(13,30,20,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                      >
                        <Camera size={24} color={COLORS.white} />
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
                        color: COLORS.danger,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}

              <div>
                <label style={labelStyles} htmlFor="fullName">Full Name</label>
                <input 
                  type="text" 
                  id="fullName" 
                  style={inputStyles}
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>

              <div ref={collegeRef} style={{ position: 'relative' }}>
                <label style={labelStyles} htmlFor="collegeSearch">College / Institute Name</label>

                {/* Show selected college as a chip, or the search input */}
                {college ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1.25rem',
                    background: COLORS.lavender,
                    border: `2px solid ${COLORS.border}`,
                    borderRadius: '99px',
                    fontSize: '0.9375rem',
                    color: COLORS.text,
                    fontWeight: 700,
                    boxShadow: '4px 4px 0px rgba(13,30,20,1)',
                  }}>
                    <GraduationCap size={18} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{college}</span>
                    <button
                      type="button"
                      onClick={() => { setCollege(''); setCollegeSearch(''); setBranch(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.text, padding: '0', display: 'flex' }}
                      aria-label="Clear college selection"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{
                      position: 'absolute', left: '1.25rem', top: '50%',
                      transform: 'translateY(-50%)', color: COLORS.textMuted, pointerEvents: 'none',
                    }} />
                    <input
                      id="collegeSearch"
                      type="text"
                      style={{ ...inputStyles, paddingLeft: '3rem' }}
                      placeholder="Search your college..."
                      value={collegeSearch}
                      onChange={(e) => { setCollegeSearch(e.target.value); setShowCollegeList(true); }}
                      onFocus={() => setShowCollegeList(true)}
                      autoComplete="off"
                    />
                  </div>
                )}

                {/* Hidden input to satisfy form required validation */}
                <input type="hidden" value={college} required />

                {/* Dropdown list */}
                {showCollegeList && !college && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: COLORS.white,
                    border: `2px solid ${COLORS.border}`,
                    borderRadius: '16px',
                    boxShadow: '8px 8px 0px rgba(13,30,20,1)',
                    zIndex: 200,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '0.5rem'
                  }}>
                    {filteredColleges.length === 0 ? (
                      <div style={{ padding: '1rem', color: COLORS.textMuted, fontSize: '0.9375rem', textAlign: 'center', fontWeight: 500 }}>
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
                            padding: '0.75rem 1rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            color: COLORS.text,
                            borderRadius: '8px',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = COLORS.bg)}
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
                <div>
                  <label style={labelStyles} htmlFor="adminPassphrase">Admin Pass-phrase</label>
                  <input 
                    type="password" 
                    id="adminPassphrase" 
                    style={inputStyles}
                    placeholder="Enter college admin code"
                    value={adminPassphrase}
                    onChange={(e) => setAdminPassphrase(e.target.value)}
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.5rem', fontWeight: 500 }}>Hint: Use 'admin123' for this prototype.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label style={labelStyles} htmlFor="degree">Degree</label>
                    <select 
                      id="degree" 
                      style={{ ...inputStyles, cursor: 'pointer', appearance: 'none', background: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230D1E14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 1rem center/1rem`, paddingRight: '2.5rem' }}
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      required
                    >
                      <option value="">— Select Degree —</option>
                      <option value="B.Tech / B.E. (Bachelor of Technology / Engineering)">B.Tech / B.E. (Bachelor of Technology / Engineering)</option>
                      <option value="M.Tech / M.E. (Master of Technology / Engineering)">M.Tech / M.E. (Master of Technology / Engineering)</option>
                      <option value="Ph.D.">Ph.D.</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={labelStyles} htmlFor="graduationYear">Graduation Year</label>
                    <input 
                      type="number" 
                      id="graduationYear" 
                      style={inputStyles}
                      placeholder="e.g. 2024"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      required 
                    />
                  </div>

                  <div>
                    <label style={labelStyles} htmlFor="branch">Branch / Major</label>
                    <select
                      id="branch"
                      style={{ 
                        ...inputStyles, 
                        cursor: college ? 'pointer' : 'not-allowed', 
                        opacity: college ? 1 : 0.7,
                        appearance: 'none', 
                        background: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230D1E14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 1rem center/1rem`, 
                        paddingRight: '2.5rem',
                        backgroundColor: college ? COLORS.white : COLORS.bg
                      }}
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                      disabled={!college}
                    >
                      <option value="">{college ? '— Select your branch —' : '— Select college first —'}</option>
                      {getBranchesForCollege(college).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyles} htmlFor="idDocument">Upload ID / Certificate (Verification)</label>
                    <input 
                      type="file" 
                      id="idDocument" 
                      style={{ ...inputStyles, padding: '0.625rem 1rem' }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setIdDocument(e.target.files ? e.target.files[0] : null)}
                      required
                    />
                    <p style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.5rem', fontWeight: 500 }}>Upload a valid college ID or degree certificate for admin review.</p>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label style={labelStyles} htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              style={inputStyles}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div>
            <label style={labelStyles} htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              style={inputStyles}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              marginTop: '1rem', 
              padding: '1rem',
              background: COLORS.text,
              color: COLORS.white,
              border: `2px solid ${COLORS.text}`,
              borderRadius: '99px',
              fontSize: '1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '4px 4px 0px rgba(13,30,20,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.8 : 1
            }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9375rem', color: COLORS.textMuted, fontWeight: 600 }}>
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button 
                onClick={() => setMode('register')} 
                style={{ color: COLORS.text, fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => setMode('login')} 
                style={{ color: COLORS.text, fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
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
