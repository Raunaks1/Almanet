import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, isMock } from '../lib/supabase';
import { GraduationCap, ArrowLeft, Loader2 } from 'lucide-react';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [userType, setUserType] = useState<'student' | 'alumni'>('alumni');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isMock) {
        // Mock authentication for preview purposes
        setTimeout(() => {
          if (mode === 'register') {
            alert('Mock Registration successful! Redirecting to login...');
            setMode('login');
          } else {
            navigate('/dashboard');
          }
          setLoading(false);
        }, 1000);
        return;
      }

      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: userType,
            }
          }
        });
        if (signUpError) throw signUpError;
        alert('Registration successful! Please check your email.');
        setMode('login');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        navigate('/dashboard'); // Will be created later
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'radial-gradient(circle at top, var(--bg-tertiary), var(--bg-primary))' }}>
      
      <button 
        onClick={() => navigate('/')} 
        style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={20} /> Back to Home
      </button>

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <GraduationCap size={48} color="var(--brand-primary)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' 
              ? 'Enter your credentials to access the network' 
              : 'Join the AlmaNET community today'
            }
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="input-group">
                <label className="input-label">I am a</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${userType === 'alumni' ? 'btn-primary' : 'btn-outline'}`} 
                    style={{ flex: 1 }}
                    onClick={() => setUserType('alumni')}
                  >
                    Alumni
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${userType === 'student' ? 'btn-primary' : 'btn-outline'}`} 
                    style={{ flex: 1 }}
                    onClick={() => setUserType('student')}
                  >
                    Student
                  </button>
                </div>
              </div>

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
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
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
