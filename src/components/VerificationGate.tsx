import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/useAuth';

interface VerificationGateProps {
  children: React.ReactNode;
}

/**
 * Wraps any page that requires an approved/verified account.
 * Shows a loading spinner while checking, and a blocked message if not verified.
 */
const VerificationGate: React.FC<VerificationGateProps> = ({ children }) => {
  const { loading, isVerified } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Loader2 className="animate-spin" size={28} color="var(--brand-primary)" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div
          className="card animate-fade-in"
          style={{
            maxWidth: '460px',
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-warning-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <ShieldAlert size={28} color="var(--accent-warning)" />
          </div>

          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Account Pending Verification
          </h2>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            marginBottom: '1.5rem',
          }}>
            Your account is currently being reviewed by the college admin.
            You'll get full access to this feature once your identity has been verified.
          </p>

          {/* Status badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'var(--accent-warning-subtle)',
            color: 'var(--accent-warning)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginBottom: '2rem',
          }}>
            <Clock size={14} />
            Verification Pending
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link
              to="/dashboard"
              className="btn btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              <ArrowLeft size={15} /> Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default VerificationGate;
