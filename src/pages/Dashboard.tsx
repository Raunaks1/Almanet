import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  Briefcase,
  Calendar,
  GraduationCap,
  Lock,
  MessageCircle,
  Newspaper,
  Star,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStoriesForCollege } from '../lib/collegeNews';
import type { CollegeStory } from '../lib/collegeNews';
import { listStagger } from '../lib/motion';
import { Avatar, Badge, EmptyState, GlassCard, SegmentedControl, Skeleton } from '../components/ui';
import { cx } from '../components/ui/internal';
import styles from './Dashboard.module.css';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function NewsIllustration() {
  return (
    <svg width="120" height="84" viewBox="0 0 120 84" fill="none" aria-hidden="true">
      <rect x="18" y="10" width="84" height="64" rx="12" fill="var(--surface-2)" stroke="var(--hairline)" />
      <rect x="28" y="22" width="38" height="6" rx="3" fill="var(--surface-3)" />
      <rect x="28" y="34" width="64" height="4" rx="2" fill="var(--surface-3)" />
      <rect x="28" y="43" width="56" height="4" rx="2" fill="var(--surface-3)" />
      <rect x="28" y="52" width="48" height="4" rx="2" fill="var(--surface-3)" />
      <circle cx="84" cy="26" r="8" fill="var(--accent-subtle)" stroke="color-mix(in srgb, var(--accent) 30%, transparent)" />
      <path d="M81 26l2 2 4-4" stroke="var(--accent-text)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'success'>('all');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          navigate('/auth');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        setUser({
          ...session.user,
          user_metadata: {
            ...session.user.user_metadata,
            ...(profileData ? {
              user_type: profileData.user_type,
              full_name: profileData.full_name,
              college: profileData.college,
              branch: profileData.branch,
              degree: profileData.degree,
              graduation_year: profileData.graduation_year,
            } : {}),
          },
        });
      } catch (err) {
        console.error('Dashboard init error:', err);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  void handleSignOut; // Preserved logic; sign-out UI lives in the app shell.

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true" aria-label="Loading dashboard">
        <div className={styles.header}>
          <Skeleton width="min(320px, 70%)" height={38} radius={10} />
          <div style={{ height: 8 }} />
          <Skeleton width="min(420px, 85%)" height={18} />
        </div>
        <div className={styles.bento}>
          <GlassCard className={styles.span7}>
            <div className={styles.skelRow}>
              <Skeleton width={56} height={56} radius="circle" />
              <div className={styles.skelCol} style={{ flex: 1 }}>
                <Skeleton width={120} height={12} />
                <Skeleton width="80%" height={18} />
                <Skeleton width="60%" height={14} />
              </div>
            </div>
          </GlassCard>
          <GlassCard className={styles.span5}>
            <div className={styles.skelCol}>
              <Skeleton width={140} height={18} />
              <Skeleton width={90} height={28} radius={999} />
              <Skeleton width="100%" height={14} />
              <Skeleton width="70%" height={14} />
            </div>
          </GlassCard>
          <GlassCard className={styles.span12}>
            <Skeleton width={180} height={18} />
            <div style={{ height: 14 }} />
            <div className={styles.actionsGrid}>
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} height={104} radius={14} />
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const meta = user?.user_metadata || {};
  const collegeName: string = meta.college || profile?.college || meta.college_name || '';
  const branch: string = meta.branch || profile?.branch || '';
  const degree: string = meta.degree || profile?.degree || '';
  const gradYear: string | number = meta.graduation_year || profile?.graduation_year || '';
  const userType: string = meta.user_type || profile?.user_type || 'alumni';
  const fullName: string = meta.full_name || user?.email || 'there';

  const verificationStatus: string = profile?.verification_status || meta.verification_status || 'pending';
  const isVerified = userType === 'admin' || verificationStatus === 'approved';

  const stories: CollegeStory[] = getStoriesForCollege(collegeName);
  const filtered = activeTab === 'all' ? stories : stories.filter((s) => s.type === activeTab);

  const firstName = fullName.split(' ')[0] || 'there';
  const greeting = `${greetingForHour(new Date().getHours())}, ${firstName}`;
  const stagger = listStagger();

  const quickActions = [
    { to: '/directory', label: 'Directory', hint: 'Find people', icon: <Users size={18} strokeWidth={1.75} /> },
    { to: '/chat', label: 'Chat', hint: 'Messages', icon: <MessageCircle size={18} strokeWidth={1.75} /> },
    { to: '/jobs', label: 'Jobs', hint: 'Opportunities', icon: <Briefcase size={18} strokeWidth={1.75} /> },
    { to: '/events', label: 'Events', hint: 'What’s on', icon: <Calendar size={18} strokeWidth={1.75} /> },
  ];

  const containerMotion = reduced
    ? {}
    : { initial: 'hidden' as const, animate: 'visible' as const, variants: stagger.parent };
  const itemMotion = reduced ? {} : { variants: stagger.child };

  return (
    <motion.div className={styles.page} {...containerMotion}>
      <motion.header className={styles.header} {...itemMotion}>
        <h1 className={styles.greeting}>{greeting}</h1>
        <p className={styles.sub}>Here’s what’s happening in your network today.</p>
      </motion.header>

      {!isVerified && (
        <motion.div className={styles.banner} role="status" {...itemMotion}>
          <span className={styles.bannerDot} aria-hidden="true" />
          <div>
            <p className={styles.bannerTitle}>Verification in progress</p>
            <p className={styles.bannerText}>
              Your account is being reviewed by the college admin. You can explore the dashboard now — Directory, Chat,
              Jobs, and Events will unlock once you’re verified.
            </p>
          </div>
        </motion.div>
      )}

      <div className={styles.bento}>
        {/* Identity card */}
        <motion.div className={styles.span7} {...itemMotion}>
          <GlassCard>
            <div className={styles.identity}>
              <Avatar name={fullName} src={profile?.avatar_url} size="lg" />
              <div className={styles.identityBody}>
                <p className={styles.eyebrow}>Your institution</p>
                <h2 className={styles.collegeName}>{collegeName || 'No college linked yet'}</h2>
                {(degree || branch || gradYear) ? (
                  <p className={styles.metaLine}>
                    {[degree, branch].filter(Boolean).join(' · ')}
                    {gradYear ? ` · Batch of ${gradYear}` : ''}
                  </p>
                ) : (
                  <p className={styles.metaLine}>Add your education details to personalize your network.</p>
                )}
                <span className={styles.typePill}>
                  <GraduationCap size={15} strokeWidth={1.75} aria-hidden="true" />
                  {userType === 'alumni' ? 'Alumni' : userType === 'student' ? 'Student' : 'Admin'}
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Verification status card */}
        <motion.div className={styles.span5} {...itemMotion}>
          <GlassCard>
            <div className={styles.statusRow}>
              <h2 className={styles.statusTitle}>Verification</h2>
              <span className={cx(styles.badgePulse, !isVerified && styles.badgePulsePending)}>
                <Badge variant={isVerified ? 'success' : 'warning'} dot>
                  {isVerified ? 'Approved' : 'Pending'}
                </Badge>
              </span>
            </div>
            <p className={styles.statusDesc}>
              {isVerified
                ? 'Your account is verified. You have full access to the community.'
                : 'We’re reviewing your details. This usually doesn’t take long.'}
            </p>
          </GlassCard>
        </motion.div>

        {/* Quick actions */}
        <motion.div className={styles.span12} {...itemMotion}>
          <GlassCard>
            <h2 className={styles.statusTitle} style={{ marginBottom: 14 }}>Quick actions</h2>
            <div className={styles.actionsGrid}>
              {quickActions.map((action) => {
                const locked = !isVerified;
                return (
                  <Link
                    key={action.to}
                    to={locked ? '#' : action.to}
                    onClick={locked ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                    className={cx(styles.actionTile, locked && styles.tileLocked)}
                    aria-disabled={locked || undefined}
                    tabIndex={locked ? -1 : undefined}
                  >
                    <span className={styles.actionIcon} aria-hidden="true">{action.icon}</span>
                    <p className={styles.actionLabel}>{action.label}</p>
                    <p className={styles.actionHint}>{action.hint}</p>
                    {locked && (
                      <span className={styles.frost}>
                        <Lock size={18} strokeWidth={1.75} aria-hidden="true" />
                        Verification required
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* College News & Success Stories */}
        <motion.div className={styles.span12} {...itemMotion}>
          <GlassCard>
            <div className={styles.newsHeader}>
              <div>
                <h2 className={styles.newsTitle}>College News &amp; Success Stories</h2>
                <p className={styles.newsSub}>
                  {collegeName ? `Latest updates from ${collegeName}` : 'Highlights from the AlmaNET community'}
                </p>
              </div>
              <div className={styles.segWrap}>
                <SegmentedControl
                  aria-label="Story filter"
                  size="sm"
                  value={activeTab}
                  onChange={(v) => setActiveTab(v as 'all' | 'news' | 'success')}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'news', label: 'News' },
                    { value: 'success', label: 'Success' },
                  ]}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className={styles.emptyWrap}>
                <EmptyState
                  icon={<NewsIllustration />}
                  title="No stories yet"
                  description="News and success stories from your college will appear here once they’re published."
                />
              </div>
            ) : (
              <div className={styles.stories}>
                {filtered.map((story: CollegeStory) => (
                  <article key={story.id} className={styles.story}>
                    <div className={styles.storyMeta}>
                      <span className={styles.storyType}>
                        {story.type === 'success' ? <Star size={14} strokeWidth={1.75} /> : <Newspaper size={14} strokeWidth={1.75} />}
                        {story.type === 'success' ? 'Success story' : 'News'}
                      </span>
                      <Badge variant="neutral">{story.tag}</Badge>
                    </div>
                    <h3 className={styles.storyTitle}>{story.title}</h3>
                    <p className={styles.storySummary}>{story.summary}</p>
                    <p className={styles.storyDate}>
                      {new Date(story.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
