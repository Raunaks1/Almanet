import React, { useCallback } from 'react';
import { Share2, Copy } from 'lucide-react';
import { Button, useToast } from '../../components/ui';
import styles from './InviteCard.module.css';

interface InviteCardProps {
  visible: boolean;
}

export const InviteCard: React.FC<InviteCardProps> = ({ visible }) => {
  const toast = useToast();

  const handleInvite = useCallback(async () => {
    const baseUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${import.meta.env.BASE_URL || '/'}`
        : '';
    const signupUrl = `${baseUrl}#/auth`;

    if (
      typeof navigator !== 'undefined' &&
      typeof (navigator as any).share === 'function'
    ) {
      try {
        await (navigator as any).share({
          title: 'Join Almanet',
          text: 'Connect with your college alumni on Almanet.',
          url: signupUrl,
        });
        return;
      } catch {
        // Fall through to copy fallback
      }
    }

    if (typeof navigator?.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(signupUrl);
    } else {
      const ta = document.createElement('textarea');
      ta.value = signupUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast.show({
      title: 'Link copied',
      description: 'Share the sign-up link with your classmates.',
      variant: 'success',
    });
  }, [toast]);

  if (!visible) return null;

  return (
    <section className={styles.card}>
      <div className={styles.body}>
        <h2 className={styles.title}>Invite your classmates</h2>
        <p className={styles.text}>
          Help your batchmates join Almanet so you can stay connected after graduation.
        </p>
        <Button
          variant="plain"
          onClick={handleInvite}
          iconLeft={
            typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' ? (
              <Share2 size={16} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Copy size={16} strokeWidth={1.75} aria-hidden="true" />
            )
          }
          className={styles.inviteBtn}
        >
          Invite classmates
        </Button>
      </div>
    </section>
  );
};
