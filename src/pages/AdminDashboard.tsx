import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Building, CheckCircle, ExternalLink, GraduationCap, Mail, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';
import { PageHeader } from '../components/shell/PageHeader';
import { Avatar, Badge, EmptyState, Skeleton, useToast } from '../components/ui';
import { DURATION, EASE_REVEAL, SPRING } from '../lib/motion';
import styles from './AdminDashboard.module.css';

const formatSubmitted = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const AdminDashboard: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingRejectId, setConfirmingRejectId] = useState<string | null>(null);
  const toast = useToast();
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // fetch logic unchanged
  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPendingUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  // approve logic unchanged (update + filter on success); UI feedback via Toast
  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'approved' })
      .eq('id', id);

    if (!error) {
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      toast.show({
        title: 'User approved',
        description: 'They now have full access to the network.',
        variant: 'success',
        action: { label: 'Undo', onClick: () => {} }, // UI only
      });
    } else {
      toast.show({ title: 'Error updating user', variant: 'danger' });
    }
  };

  // reject logic unchanged (update + filter on success); UI feedback via Toast
  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', id);

    if (!error) {
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      setConfirmingRejectId(null);
      toast.show({
        title: 'User rejected',
        variant: 'neutral',
        action: { label: 'Undo', onClick: () => {} }, // UI only
      });
    } else {
      toast.show({ title: 'Error updating user', variant: 'danger' });
    }
  };

  const exitMotion = reduced
    ? { opacity: 0, transition: { duration: DURATION.fast } }
    : { opacity: 0, height: 0, marginBottom: 0, transition: { duration: DURATION.normal, ease: EASE_REVEAL } };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Pending Verifications"
        subtitle="Review registrations and grant full access to the network."
        actions={
          <Badge variant={pendingUsers.length > 0 ? 'warning' : 'success'} dot>
            {pendingUsers.length} pending
          </Badge>
        }
      />

      <section className={styles.stats} aria-label="Verification stats">
        <div className={styles.statTile}>
          <p className={styles.statLabel}>Pending</p>
          <p className={styles.statValue}>{loading ? '—' : pendingUsers.length}</p>
        </div>
        <div className={styles.statTile}>
          <p className={styles.statLabel}>Approved today</p>
          <p className={styles.statValue}>—</p>
        </div>
        <div className={styles.statTile}>
          <p className={styles.statLabel}>Total</p>
          <p className={styles.statValue}>—</p>
        </div>
      </section>

      <section className={styles.queue} aria-label="Verification queue">
        {loading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={styles.skelCard}>
              <Skeleton width={48} height={48} radius="circle" />
              <div style={{ display: 'grid', gap: 8 }}>
                <Skeleton width="38%" height={18} />
                <Skeleton width="55%" height={14} />
                <Skeleton width="46%" height={14} />
                <Skeleton width="60%" height={14} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Skeleton width={88} height={38} radius={999} />
                <Skeleton width={92} height={38} radius={999} />
              </div>
            </div>
          ))
        ) : pendingUsers.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={28} strokeWidth={1.75} />}
            title="All caught up"
            description="There are no pending users in the verification queue."
          />
        ) : (
          <AnimatePresence initial={false}>
            {pendingUsers.map((user) => {
              const confirming = confirmingRejectId === user.id;
              const submitted = formatSubmitted((user as any).created_at);
              return (
                <motion.div
                  key={user.id}
                  className={styles.itemWrap}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={exitMotion}
                  transition={reduced ? { duration: 0.12 } : SPRING}
                >
                  <article className={styles.card}>
                    <Avatar name={user.full_name} size="md" />
                    <div className={styles.body}>
                      <div className={styles.nameRow}>
                        <h3 className={styles.name}>{user.full_name}</h3>
                        <Badge variant={user.user_type === 'student' ? 'accent' : 'neutral'} size="sm">
                          {user.user_type}
                        </Badge>
                      </div>
                      <div className={styles.meta}>
                        <span className={styles.metaItem}>
                          <Building size={14} strokeWidth={1.75} aria-hidden="true" />
                          {user.college || '—'}
                        </span>
                        <span className={styles.metaItem}>
                          <GraduationCap size={14} strokeWidth={1.75} aria-hidden="true" />
                          {[user.degree, user.branch].filter(Boolean).join(' in ') || '—'}
                          {user.graduation_year ? ` (${user.graduation_year})` : ''}
                        </span>
                      </div>
                      <div className={styles.detail}>
                        <span className={styles.metaItem}>
                          <Mail size={14} strokeWidth={1.75} aria-hidden="true" />
                          {user.email}
                        </span>
                        <span><strong>Submitted</strong> {submitted}</span>
                        <span>
                          <strong>Document</strong>{' '}
                          {/* Keep the "View Uploaded ID" link; styled as secondary button */}
                          <a href="#" className={styles.docLink}>
                            View Uploaded ID
                            <ExternalLink size={13} strokeWidth={1.75} aria-hidden="true" />
                          </a>
                        </span>
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.rejectBtn}
                        onClick={() => setConfirmingRejectId(confirming ? null : user.id)}
                        aria-expanded={confirming}
                        aria-haspopup="dialog"
                      >
                        <XCircle size={16} strokeWidth={1.75} aria-hidden="true" />
                        Reject
                      </button>
                      <button type="button" className={styles.approveBtn} onClick={() => handleApprove(user.id)}>
                        <CheckCircle size={16} strokeWidth={1.75} aria-hidden="true" />
                        Approve
                      </button>

                      <AnimatePresence>
                        {confirming && (
                          <motion.div
                            className={styles.popover}
                            role="dialog"
                            aria-label="Confirm rejection"
                            initial={reduced ? false : { opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
                            transition={reduced ? { duration: 0.1 } : SPRING}
                          >
                            <p>Reject this verification request?</p>
                            <div className={styles.popoverActions}>
                              <button type="button" className={styles.popCancel} onClick={() => setConfirmingRejectId(null)}>
                                Cancel
                              </button>
                              <button type="button" className={styles.popConfirm} onClick={() => handleReject(user.id)}>
                                Reject
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </article>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
