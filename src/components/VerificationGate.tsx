import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Check, Clock } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { Skeleton } from './ui';
import { cx } from './ui/internal';
import { DURATION, EASE_REVEAL } from '../lib/motion';
import styles from './VerificationGate.module.css';

interface VerificationGateProps {
  children: React.ReactNode;
}

/**
 * Wraps any page that requires an approved/verified account.
 * Shows a loading state while checking, and a blocked message if not verified.
 * (Logic preserved; UI redesigned.)
 */
const VerificationGate: React.FC<VerificationGateProps> = ({ children }) => {
  const { loading, isVerified } = useAuth();
  const reduced = useReducedMotion() ?? false;

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true" aria-label="Checking verification">
        <div className={styles.skelCard}>
          <Skeleton width={64} height={64} radius="circle" />
          <Skeleton width="60%" height={26} radius={8} />
          <Skeleton width="88%" height={14} />
          <Skeleton width="72%" height={14} />
          <div style={{ display: 'flex', gap: 16, width: '100%', marginTop: 8, justifyContent: 'center' }}>
            <Skeleton width={72} height={52} radius={10} />
            <Skeleton width={72} height={52} radius={10} />
            <Skeleton width={72} height={52} radius={10} />
          </div>
          <Skeleton width={160} height={44} radius={999} />
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className={styles.page}>
        <motion.div
          className={styles.card}
          role="status"
          initial={reduced ? false : { opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduced ? { duration: DURATION.fast } : { duration: DURATION.reveal, ease: EASE_REVEAL }}
        >
          <div className={styles.iconWrap}>
            <motion.span
              animate={reduced ? undefined : { rotate: [0, -8, 8, -4, 0] }}
              transition={reduced ? undefined : { duration: 2.8, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
              style={{ display: 'inline-flex' }}
              aria-hidden="true"
            >
              <Clock size={28} strokeWidth={1.75} />
            </motion.span>
          </div>

          <h2 className={styles.title}>Verification in progress</h2>
          <p className={styles.text}>
            Your account is being reviewed by the college admin. You’ll get full access once your identity has been
            verified.
          </p>

          <ol className={styles.timeline} aria-label="Verification progress">
            <li className={cx(styles.step, styles.stepDone)}>
              <span className={styles.dot} aria-hidden="true"><Check size={14} strokeWidth={2.25} /></span>
              <span className={styles.stepLabel}>Submitted</span>
            </li>
            <li className={cx(styles.step, styles.stepActive)} aria-current="step">
              <span className={styles.dot} aria-hidden="true">2</span>
              <span className={styles.stepLabel}>Under review</span>
            </li>
            <li className={styles.step}>
              <span className={styles.dot} aria-hidden="true">3</span>
              <span className={styles.stepLabel}>Approved</span>
            </li>
          </ol>

          <div className={styles.actions}>
            <Link
              to="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 44,
                padding: '0 20px',
                borderRadius: 999,
                background: 'var(--accent)',
                color: '#fff',
                font: 'var(--type-subhead)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
              Back to dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default VerificationGate;
