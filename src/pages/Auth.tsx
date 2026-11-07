import React, { useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Upload,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COLLEGE_NAMES, getBranchesForCollege } from '../lib/colleges';
import { DURATION, EASE_REVEAL } from '../lib/motion';
import { cx } from '../components/ui/internal';
import { Button, Combobox, FormField, Input, SegmentedControl, Select, useToast } from '../components/ui';
import type { ComboboxOption } from '../components/ui';
import styles from './Auth.module.css';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  const levels = [
    { score: 1, label: 'Weak', color: 'var(--danger)' },
    { score: 2, label: 'Fair', color: 'var(--warning)' },
    { score: 3, label: 'Good', color: 'var(--accent)' },
    { score: 4, label: 'Strong', color: 'var(--success)' },
  ];
  return levels[Math.max(0, s - 1)] ?? { score: 0, label: 'Weak', color: 'var(--danger)' };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const collegeOptions: ComboboxOption[] = COLLEGE_NAMES.map((name) => ({ value: name, label: name }));

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const reduced = useReducedMotion() ?? false;
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [userType, setUserType] = useState<'student' | 'alumni' | 'admin'>('alumni');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State (preserved)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Cohort & Verification Fields (preserved)
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [adminPassphrase, setAdminPassphrase] = useState('');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  // UI-only state
  const [registerStep, setRegisterStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarDrag, setAvatarDrag] = useState(false);
  const [idDrag, setIdDrag] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
            },
          },
        });
        if (signUpError) throw signUpError;
        toast.show({ title: 'Registration successful!', description: 'Please check your email.', variant: 'success' });
        setMode('login');
        setRegisterStep(1);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
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

  const onProfilePhoto = (file: File | null) => {
    setProfilePhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setProfilePhotoPreview(null);
    }
  };

  const strength = passwordStrength(password);
  const totalSteps = 3;
  const progress = (registerStep / totalSteps) * 100;

  // If native validation fails on submit, jump to the step containing the field.
  const onInvalidCapture = (e: React.FormEvent<HTMLFormElement>) => {
    if (mode !== 'register') return;
    const target = e.target as HTMLElement;
    const panel = target.closest<HTMLElement>('[data-step]');
    if (panel?.dataset.step) setRegisterStep(Number(panel.dataset.step));
  };

  // "Preserve all existing state and submission": inactive panels stay in the DOM
  // (so required fields validate on submit) but are visually inert.
  const panelClass = (step: number) =>
    cx(styles.stepPanel, registerStep !== step && styles.stepHiddenAria);

  return (
    <div className={styles.page}>
      <button type="button" onClick={() => navigate('/')} className={styles.backBtn}>
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" /> Back
      </button>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoMark}>
            <GraduationCap size={26} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h2 className={styles.title}>{mode === 'login' ? 'Welcome back' : 'Join Almanet'}</h2>
          <p className={styles.subtitle}>
            {mode === 'login'
              ? 'Enter your credentials to access the network.'
              : 'Create your account and connect with your community.'}
          </p>
        </div>

        <div className={styles.segmentWrap}>
          <SegmentedControl
            aria-label="Authentication mode"
            value={mode}
            onChange={(v) => {
              setMode(v as 'login' | 'register');
              setError(null);
              if (v === 'register') setRegisterStep(1);
            }}
            options={[
              { value: 'login', label: 'Login' },
              { value: 'register', label: 'Register' },
            ]}
          />
        </div>

        {error && <p className={styles.formError} role="alert">{error}</p>}

        <form ref={formRef} onSubmit={handleSubmit} onInvalidCapture={onInvalidCapture} className={styles.form} noValidate={false}>
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'login' ? (
              <motion.div
                key="login"
                className={styles.stepPanel}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: DURATION.reveal, ease: EASE_REVEAL }}
              >
                <FormField label="Email address" required>
                  <Input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </FormField>
                <FormField label="Password" required>
                  <div className={cx(styles.passwordWrap, styles.passwordInputPad)}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                    </button>
                  </div>
                </FormField>
                <Button type="submit" fullWidth loading={loading} style={{ marginTop: 4 }}>
                  Sign in
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: DURATION.reveal, ease: EASE_REVEAL }}
              >
                <div className={styles.stepMeta}>
                  <span>Step {registerStep} of {totalSteps}</span>
                  <span>{registerStep === 1 ? 'Role & photo' : registerStep === 2 ? 'Education' : 'Account & ID'}</span>
                </div>
                <div className={styles.progressTrack} aria-hidden="true">
                  <motion.div
                    className={styles.progressFill}
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: DURATION.normal, ease: EASE_REVEAL }}
                  />
                </div>

                {/* Step 1: Role and Photo (+ Full Name, preserved) */}
                <div data-step="1" className={panelClass(1)} aria-hidden={registerStep !== 1}>
                  <div>
                    <span className={styles.avatarLabel} style={{ display: 'block', marginBottom: 8 }}>I am a</span>
                    <div className={styles.roleGroup} role="group" aria-label="Account type">
                      {(['alumni', 'student', 'admin'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setUserType(opt)}
                          className={cx(styles.roleBtn, userType === opt && styles.roleBtnActive)}
                          aria-pressed={userType === opt}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {userType !== 'admin' && (
                    <div className={styles.avatarRow}>
                      <span className={styles.avatarLabel}>
                        Profile photo <span className={styles.avatarOptional}>(optional)</span>
                      </span>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cx(styles.avatarDrop, avatarDrag && styles.avatarDropOver)}
                        onClick={() => profilePhotoRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            profilePhotoRef.current?.click();
                          }
                        }}
                        onDragOver={(e) => { e.preventDefault(); setAvatarDrag(true); }}
                        onDragLeave={() => setAvatarDrag(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setAvatarDrag(false);
                          const file = e.dataTransfer.files?.[0] ?? null;
                          if (file && file.type.startsWith('image/')) onProfilePhoto(file);
                        }}
                        aria-label="Upload profile photo"
                      >
                        {profilePhotoPreview ? (
                          <img src={profilePhotoPreview} alt="Profile preview" className={styles.avatarImg} />
                        ) : (
                          <Camera size={26} strokeWidth={1.75} className={styles.avatarIcon} aria-hidden="true" />
                        )}
                        <span className={styles.avatarOverlay}>
                          <Camera size={22} strokeWidth={1.75} aria-hidden="true" />
                        </span>
                      </div>
                      <input
                        ref={profilePhotoRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className={styles.hiddenInput}
                        onChange={(e) => onProfilePhoto(e.target.files?.[0] || null)}
                      />
                      {profilePhotoPreview && (
                        <button
                          type="button"
                          className={styles.avatarRemove}
                          onClick={(e) => { e.stopPropagation(); onProfilePhoto(null); }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}

                  <FormField label="Full name" required>
                    <Input
                      type="text"
                      id="fullName"
                      placeholder="e.g. Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={mode === 'register'}
                      autoComplete="name"
                    />
                  </FormField>

                  <div className={styles.stepActions}>
                    <Button type="button" variant="secondary" onClick={() => setRegisterStep(2)}>
                      Continue
                    </Button>
                  </div>
                </div>

                {/* Step 2: Education */}
                <div data-step="2" className={panelClass(2)} aria-hidden={registerStep !== 2}>
                  {userType === 'admin' ? (
                    <FormField
                      label="Admin pass-phrase"
                      required
                      hint="Hint: Use 'admin123' for this prototype."
                      error={error === 'Invalid admin pass-phrase.' ? error : undefined}
                    >
                      <Input
                        type="password"
                        id="adminPassphrase"
                        placeholder="Enter college admin code"
                        value={adminPassphrase}
                        onChange={(e) => setAdminPassphrase(e.target.value)}
                        required={mode === 'register' && userType === 'admin'}
                        autoComplete="off"
                      />
                    </FormField>
                  ) : (
                    <>
                      <FormField label="College / institute" required>
                        <Combobox
                          options={collegeOptions}
                          value={college || null}
                          onChange={(v) => {
                            setCollege(v ?? '');
                            setBranch('');
                          }}
                          placeholder="Search your college..."
                        />
                      </FormField>
                      {/* Hidden required input preserves native validation (Combobox text is a filter UI) */}
                      <input type="hidden" value={college} required={mode === 'register'} readOnly />

                      <FormField label="Degree" required>
                        <Select
                          id="degree"
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          required={mode === 'register'}
                        >
                          <option value="">— Select degree —</option>
                          <option value="B.Tech / B.E. (Bachelor of Technology / Engineering)">B.Tech / B.E. (Bachelor of Technology / Engineering)</option>
                          <option value="M.Tech / M.E. (Master of Technology / Engineering)">M.Tech / M.E. (Master of Technology / Engineering)</option>
                          <option value="Ph.D.">Ph.D.</option>
                        </Select>
                      </FormField>

                      <FormField label="Graduation year" required>
                        <Input
                          type="number"
                          id="graduationYear"
                          placeholder="e.g. 2024"
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value)}
                          required={mode === 'register'}
                        />
                      </FormField>

                      <FormField label="Branch / major" required hint={!college ? 'Select a college first.' : undefined}>
                        <Select
                          id="branch"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          required={mode === 'register'}
                          disabled={!college}
                        >
                          <option value="">{college ? '— Select your branch —' : '— Select college first —'}</option>
                          {getBranchesForCollege(college).map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </Select>
                      </FormField>
                    </>
                  )}

                  <div className={styles.stepActions}>
                    <Button type="button" variant="secondary" onClick={() => setRegisterStep(1)}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setRegisterStep(3)}>
                      Continue
                    </Button>
                  </div>
                </div>

                {/* Step 3: Account (email, password) and ID upload */}
                <div data-step="3" className={panelClass(3)} aria-hidden={registerStep !== 3}>
                  <FormField label="Email address" required>
                    <Input
                      type="email"
                      id="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={mode === 'register'}
                      autoComplete="email"
                    />
                  </FormField>

                  <FormField label="Password" required>
                    <div>
                      <div className={cx(styles.passwordWrap, styles.passwordInputPad)}>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required={mode === 'register'}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                        </button>
                      </div>
                      {password && (
                        <div className={styles.strength} aria-live="polite">
                          <div className={styles.strengthTrack}>
                            <div
                              className={styles.strengthFill}
                              style={{ width: `${(strength.score / 4) * 100}%`, background: strength.color }}
                            />
                          </div>
                          <p className={styles.strengthLabel}>Strength: {strength.label}</p>
                        </div>
                      )}
                    </div>
                  </FormField>

                  {userType !== 'admin' && (
                    <div>
                      <span className={styles.avatarLabel} style={{ display: 'block', marginBottom: 6 }}>
                        ID / certificate (verification)
                      </span>
                      <div
                        className={cx(styles.dropzone, idDrag && styles.dropzoneOver)}
                        onDragOver={(e) => { e.preventDefault(); setIdDrag(true); }}
                        onDragLeave={() => setIdDrag(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIdDrag(false);
                          const file = e.dataTransfer.files?.[0] ?? null;
                          if (file) setIdDocument(file);
                        }}
                      >
                        <input
                          ref={idInputRef}
                          type="file"
                          id="idDocument"
                          className={styles.dropzoneInput}
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setIdDocument(e.target.files ? e.target.files[0] : null)}
                          required={mode === 'register'}
                          aria-label="Upload ID or certificate"
                        />
                        <Upload size={20} strokeWidth={1.75} className={styles.dropzoneIcon} aria-hidden="true" />
                        <p className={styles.dropzoneTitle}>Drop a file here, or browse</p>
                        <p className={styles.dropzoneHint}>PDF, JPG, or PNG · used for admin review</p>
                      </div>
                      {idDocument && (
                        <div className={styles.fileRow}>
                          <FileText size={18} strokeWidth={1.75} style={{ color: 'var(--text-2)', flexShrink: 0 }} aria-hidden="true" />
                          <span className={styles.fileMeta}>
                            <span className={styles.fileName}>{idDocument.name}</span>
                            <span className={styles.fileSize}>{formatBytes(idDocument.size)}</span>
                          </span>
                          <button
                            type="button"
                            className={styles.fileRemove}
                            aria-label="Remove file"
                            onClick={() => {
                              setIdDocument(null);
                              if (idInputRef.current) idInputRef.current.value = '';
                            }}
                          >
                            <X size={15} strokeWidth={1.75} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.stepActions}>
                    <Button type="button" variant="secondary" onClick={() => setRegisterStep(2)}>
                      Back
                    </Button>
                    <Button type="submit" loading={loading}>
                      Create account
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className={styles.switchRow}>
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => { setMode('register'); setRegisterStep(1); setError(null); }} className={styles.switchBtn}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={() => { setMode('login'); setError(null); }} className={styles.switchBtn}>
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
