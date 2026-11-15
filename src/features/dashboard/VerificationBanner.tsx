import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { cx } from '../../components/ui/internal';
import { Button } from '../../components/ui';
import styles from './VerificationBanner.module.css';

export interface VerificationBannerProps {
  status: 'pending' | 'rejected' | 'approved' | null;
  onSupport?: () => void;
}

export const VerificationBanner: React.FC<VerificationBannerProps> = ({
  status,
  onSupport,
}) => {
  if (!status || status === 'approved') return null;

  const isPending = status === 'pending';
  const icon = isPending ? (
    <Clock size={18} strokeWidth={1.75} aria-hidden="true" />
  ) : (
    <AlertCircle size={18} strokeWidth={1.75} aria-hidden="true" />
  );
  const tone = isPending ? 'warning' : 'danger';

  return (
    <div className={cx(styles.banner, styles[tone])} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <div className={styles.body}>
        {isPending ? (
          <>
            <h2 className={styles.title}>Your account is waiting for verification</h2>
            <p className={styles.text}>
              An admin is reviewing your details. You can browse the dashboard now — Directory, Chat, Jobs, and Events
              will unlock once you’re approved.
            </p>
          </>
        ) : (
          <>
            <h2 className={styles.title}>Verification was not approved</h2>
            <p className={styles.text}>
              We weren’t able to verify your account. Please contact support so we can review your details again.
            </p>
            {onSupport && (
              <Button key="support" variant="plain" onClick={onSupport} className={styles.supportBtn}>
                Contact support
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
