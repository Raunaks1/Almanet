import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Calendar,
  CalendarPlus,
  Check,
  ChevronRight,
  Clock,
  Clock3,
  GraduationCap,
  Lock,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  RotateCw,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Users,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { Skeleton } from '../components/ui';
import { EASE_REVEAL } from '../lib/motion';
import {
  computeProfileCompleteness,
  fetchDashboardAlumniCount,
  fetchDashboardEvents,
  fetchDashboardMessages,
  fetchDashboardNewJobsCount,
  fetchDashboardPendingCount,
  fetchDashboardRecentActivity,
  fetchDashboardUpcomingEventsCount,
} from '../lib/dashboardData';
import type {
  DashboardActivityItem,
  DashboardAlumniCount,
  DashboardCompleteness,
  DashboardEvent,
  DashboardJob,
} from '../lib/dashboardData';
import styles from './Dashboard.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers & Small Shared Components
// ─────────────────────────────────────────────────────────────────────────────

const GREETING_BY_HOUR = (h: number): string => (h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening');

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const timeAgo = (dateStr: string): string => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (name[0] || 'U').toUpperCase();
};

// Count-up animation for stat numbers (skips under prefers-reduced-motion)
const CountUp: React.FC<{ target: number; duration?: number }> = ({ target, duration = 0.8 }) => {
  const [displayed, setDisplayed] = useState(0);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) {
      setDisplayed(target);
      return;
    }
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / (duration * 1000), 1);
      setDisplayed(Math.floor(easeOut(p) * target));
      if (p < 1) {
        raf = requestAnimationFrame(animate);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return <span className={styles.statNumber}>{displayed}</span>;
};

// Per-card skeleton state
const CardSkeleton: React.FC<{ minHeight?: number }> = ({ minHeight = 170 }) => (
  <div className={styles.skelCard} style={{ minHeight }}>
    <div className={styles.skelHeader}>
      <Skeleton width={44} height={44} radius={18} />
      <Skeleton width={28} height={28} radius="circle" />
    </div>
    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width={64} height={32} radius={8} />
      <Skeleton width="60%" height={14} radius={6} />
    </div>
  </div>
);

// Per-card error state with retry button
const CardError: React.FC<{ onRetry: () => void; message?: string }> = ({ onRetry, message }) => (
  <div className={styles.errorCard} role="alert" aria-live="polite">
    <div className={styles.errorIcon}>
      <RotateCw size={24} strokeWidth={1.75} aria-hidden="true" />
    </div>
    <div className={styles.errorContent}>
      <h3 className={styles.errorTitle}>Could not load</h3>
      <p className={styles.errorMessage}>{message || 'Please check your connection and retry.'}</p>
    </div>
    <button type="button" onClick={onRetry} className={styles.emptyBtn}>
      Retry
    </button>
  </div>
);

// Empty state inside a card
const CardEmpty: React.FC<{
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
  icon: React.ReactNode;
}> = ({ title, description, href, linkLabel, icon }) => (
  <div className={styles.emptyCard}>
    <div className={styles.emptyIconBox}>{icon}</div>
    <h3 className={styles.emptyTitle}>{title}</h3>
    <p className={styles.emptyDesc}>{description}</p>
    {href && linkLabel && (
      <Link to={href} className={styles.emptyBtn}>
        {linkLabel}
      </Link>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Verification / Admin Banner
// ─────────────────────────────────────────────────────────────────────────────

const ContextBanner: React.FC<{
  isVerified: boolean;
  isAdmin: boolean;
  pendingCount: number | null;
}> = ({ isVerified, isAdmin, pendingCount }) => {
  if (isVerified) {
    if (isAdmin && pendingCount != null && pendingCount > 0) {
      return (
        <aside className={`${styles.contextBanner} ${styles.bannerAdmin}`} role="status" aria-live="polite">
          <div className={styles.bannerLeft}>
            <div className={styles.bannerIcon}>
              <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
            </div>
            <div className={styles.bannerText}>
              <span className={styles.bannerTitle}>
                {pendingCount} verification request{pendingCount !== 1 ? 's' : ''} waiting
              </span>
              <span className={styles.bannerDesc}>
                Review student credentials to approve access to college features.
              </span>
            </div>
          </div>
          <Link to="/admin" className={styles.bannerLink}>
            Review <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </aside>
      );
    }
    return null;
  }

  return (
    <aside className={`${styles.contextBanner} ${styles.bannerPending}`} role="status" aria-live="polite">
      <div className={styles.bannerLeft}>
        <div className={styles.bannerIcon}>
          <Clock3 size={18} strokeWidth={2} aria-hidden="true" />
        </div>
        <div className={styles.bannerText}>
          <span className={styles.bannerTitle}>Your account is pending verification.</span>
          <span className={styles.bannerDesc}>
            We’ll unlock the full app once it’s approved by your college administrator.
          </span>
        </div>
      </div>
      <span className={styles.bannerPill}>Pending Review</span>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Greeting Row (Greeting H1 + Subtitle + College Pill)
// ─────────────────────────────────────────────────────────────────────────────

const GreetingRow: React.FC<{
  greeting: string;
  firstName: string;
  college: string | null;
}> = ({ greeting, firstName, college }) => (
  <header className={styles.greetingRow}>
    <div className={styles.greetingText}>
      <h1 className={styles.greetingH1}>
        Good {greeting}, {firstName}
      </h1>
      <p className={styles.greetingSub}>Stay connected with your alumni community</p>
    </div>

    {college && (
      <div className={styles.collegePill} title={college}>
        <div className={styles.collegeIcon}>
          <GraduationCap size={18} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <span className={styles.collegeName}>{college}</span>
      </div>
    )}
  </header>
);

// ─────────────────────────────────────────────────────────────────────────────
// Row 1: Four Stat Cards
// ─────────────────────────────────────────────────────────────────────────────

type StatVariant = 'alumni' | 'messages' | 'jobs' | 'events';

const StatCard: React.FC<{
  variant: StatVariant;
  value: number | null;
  loading: boolean;
  error: boolean;
  thisMonth?: number;
  href: string;
  label: string;
  visuallyHiddenLabel: string;
  onRetry: () => void;
}> = ({ variant, value, loading, error, thisMonth, href, label, visuallyHiddenLabel, onRetry }) => {
  const iconTiles: Record<StatVariant, { icon: React.ReactNode; className: string }> = {
    alumni: {
      icon: <Users size={22} strokeWidth={2} aria-hidden="true" />,
      className: styles.statIconTileAlumni,
    },
    messages: {
      icon: <MessageCircle size={22} strokeWidth={2} aria-hidden="true" />,
      className: styles.statIconTileMessages,
    },
    jobs: {
      icon: <Briefcase size={22} strokeWidth={2} aria-hidden="true" />,
      className: styles.statIconTileJobs,
    },
    events: {
      icon: <Calendar size={22} strokeWidth={2} aria-hidden="true" />,
      className: styles.statIconTileEvents,
    },
  };

  if (loading) return <CardSkeleton minHeight={170} />;
  if (error) return <CardError onRetry={onRetry} />;

  const displayValue = <CountUp target={value ?? 0} />;

  return (
    <Link to={href} className={styles.statLink} aria-label={`${visuallyHiddenLabel}: ${value ?? 0}`}>
      <div className={`${styles.card} ${styles.statCard}`}>
        <div className={styles.statTop}>
          <div className={`${styles.statIconTile} ${iconTiles[variant].className}`}>
            {iconTiles[variant].icon}
          </div>
          <div className={styles.statArrowBtn}>
            <ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.statBottom}>
          <div className={styles.visuallyHidden}>{visuallyHiddenLabel}: </div>
          {displayValue}
          <div className={styles.statLabel}>{label}</div>
          {thisMonth != null && thisMonth > 0 && (
            <span className={styles.statTrend} aria-hidden="true">
              +{thisMonth} this month
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Row 2: Community Hub Hero Card (with Auto-rotation & Pause on hover/focus)
// ─────────────────────────────────────────────────────────────────────────────

interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  description: string;
  cta: string;
  href: string;
}

const HeroCard: React.FC<{
  newJobs: number;
  events: DashboardEvent[];
}> = ({ newJobs, events }) => {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<number | null>(null);
  const reduced = useReducedMotion() ?? false;

  const slides: HeroSlide[] = [
    {
      id: 'directory',
      badge: 'Community Hub',
      title: 'Find batchmates',
      description: 'Explore the alumni directory and reconnect with peers.',
      cta: 'Explore directory',
      href: '/directory',
    },
  ];

  if (newJobs > 0) {
    slides.push({
      id: 'jobs',
      badge: 'Opportunities',
      title: `${newJobs} new job${newJobs !== 1 ? 's' : ''} this week`,
      description: 'Browse the latest openings and referral opportunities.',
      cta: 'Browse jobs',
      href: '/jobs',
    });
  }

  if (events.length > 0) {
    const next = events[0];
    const d = new Date(next.date);
    slides.push({
      id: 'events',
      badge: 'Upcoming Event',
      title: next.title,
      description: `Happening ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${next.location}`,
      cta: 'View events',
      href: '/events',
    });
  }

  // Auto-rotation every 6s unless reduced-motion, paused, hovered, or focused
  useEffect(() => {
    if (reduced || paused || isHovered || slides.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, isHovered, slides.length, reduced]);

  const activeSlide = slides[slide] || slides[0];

  return (
    <div
      className={styles.heroCard}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div className={styles.heroGlow1} />
      <div className={styles.heroGlow2} />

      <div className={styles.heroContent}>
        <span className={styles.heroPill}>
          <Sparkles size={13} strokeWidth={2} aria-hidden="true" />
          {activeSlide.badge}
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: EASE_REVEAL }}
          >
            <h2 className={styles.heroTitle}>{activeSlide.title}</h2>
            <p className={styles.heroDesc}>{activeSlide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.heroFooter}>
        <Link to={activeSlide.href} className={styles.heroCta}>
          <span>{activeSlide.cta}</span>
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </Link>

        {slides.length > 1 && (
          <div className={styles.heroControls} role="toolbar" aria-label="Hero carousel controls">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.heroDot} ${i === slide ? styles.heroDotActive : ''}`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === slide ? 'true' : undefined}
                onClick={() => setSlide(i)}
              />
            ))}
            <button
              type="button"
              className={styles.heroPauseBtn}
              aria-label={paused ? 'Resume carousel' : 'Pause carousel'}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? (
                <Play size={12} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <Pause size={12} strokeWidth={2.5} aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Row 2: Upcoming Events Card
// ─────────────────────────────────────────────────────────────────────────────

const EventsCard: React.FC<{
  events: DashboardEvent[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}> = ({ events, loading, error, onRetry }) => {
  const show = events.slice(0, 2);

  if (loading) return <CardSkeleton minHeight={250} />;
  if (error) return <CardError onRetry={onRetry} />;
  if (show.length === 0) {
    return (
      <div className={`${styles.card} ${styles.eventsCard}`}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Upcoming events</h2>
          <Link to="/events" className={styles.cardAction}>
            View all <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
        <CardEmpty
          title="No upcoming events"
          description="Nothing scheduled right now. Check back soon for meetups and panels."
          href="/events"
          linkLabel="View all events"
          icon={<Calendar size={24} strokeWidth={1.75} aria-hidden="true" />}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.eventsCard}`}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Upcoming events</h2>
        <Link to="/events" className={styles.cardAction}>
          View all <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.eventList}>
        {show.map((ev, index) => {
          const d = new Date(ev.date);
          const month = MONTH_NAMES[d.getMonth()] || 'EVENT';
          const day = String(d.getDate()).padStart(2, '0');
          const isAlt = index % 2 === 1;

          return (
            <Link key={ev.id} to="/events" className={styles.eventRow} aria-label={ev.title}>
              <div className={`${styles.eventDateTile} ${isAlt ? styles.eventDateTileAlt : ''}`}>
                <span className={styles.eventMonth}>{month}</span>
                <span className={styles.eventDay}>{day}</span>
              </div>
              <div className={styles.eventBody}>
                <h3 className={styles.eventTitle}>{ev.title}</h3>
                <div className={styles.eventMeta}>
                  <span className={styles.eventMetaItem} title={ev.location}>
                    <MapPin size={13} strokeWidth={1.75} aria-hidden="true" />
                    <span>{ev.location}</span>
                  </span>
                  <span className={styles.eventMetaItem}>
                    <Clock size={13} strokeWidth={1.75} aria-hidden="true" />
                    <span>
                      {d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </span>
                </div>
              </div>
              <ChevronRight size={15} strokeWidth={1.75} className={styles.eventChevron} aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Row 3: Recent Activity Card
// ─────────────────────────────────────────────────────────────────────────────

const ActivityCard: React.FC<{
  items: DashboardActivityItem[];
  unread: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}> = ({ items, unread, loading, error, onRetry }) => {
  const unreadRows: DashboardActivityItem[] =
    unread > 0
      ? [
          {
            id: 'messages',
            title: 'You have unread messages',
            type: 'message',
            author_name: undefined,
            url: '/chat',
            created_at: new Date().toISOString(),
            unread,
          },
        ]
      : [];
  const activityRows = [...unreadRows, ...items].slice(0, 3);

  if (loading) return <CardSkeleton minHeight={280} />;
  if (error) return <CardError onRetry={onRetry} />;

  if (activityRows.length === 0) {
    return (
      <div className={`${styles.card} ${styles.activityCard}`}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Recent activity</h2>
          <span className={styles.cardBadge}>Live</span>
        </div>
        <CardEmpty
          title="Nothing yet"
          description="Be the first to share an opportunity, post on forums, or connect with peers."
          href="/forums"
          linkLabel="Post on forums"
          icon={<MessageCircle size={24} strokeWidth={1.75} aria-hidden="true" />}
        />
      </div>
    );
  }

  const badgeConfig: Record<string, { icon: React.ReactNode; className: string }> = {
    job: { icon: <Briefcase size={9} strokeWidth={2.5} />, className: styles.activityBadgeJob },
    forum: { icon: <SquarePen size={9} strokeWidth={2.5} />, className: styles.activityBadgeForum },
    event: { icon: <Calendar size={9} strokeWidth={2.5} />, className: styles.activityBadgeEvent },
    message: { icon: <MessageCircle size={9} strokeWidth={2.5} />, className: styles.activityBadgeMessage },
  };

  return (
    <div className={`${styles.card} ${styles.activityCard}`}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Recent activity</h2>
        <span className={styles.cardBadge}>Live</span>
      </div>

      <div className={styles.activityList}>
        {activityRows.map((row) => {
          const initials = row.author_name ? getInitials(row.author_name) : 'AN';
          const badge = badgeConfig[row.type] || badgeConfig.forum;

          return (
            <Link
              key={row.id}
              to={row.unread ? '/chat' : row.url}
              className={styles.activityItem}
              aria-label={row.title}
            >
              <div className={styles.activityAvatarWrapper}>
                <div className={styles.activityAvatar}>{initials}</div>
                <div className={`${styles.activityBadgeOverlay} ${badge.className}`}>
                  {badge.icon}
                </div>
              </div>

              <div className={styles.activityBody}>
                <div className={styles.activityHeaderRow}>
                  <span className={styles.activityTitle}>{row.title}</span>
                  <span className={styles.activityTime}>
                    {row.unread ? `${row.unread} new` : timeAgo(row.created_at)}
                  </span>
                </div>
                <div className={styles.activitySub}>
                  {row.unread
                    ? 'Check your inbox for new messages'
                    : row.author_name
                    ? `By ${row.author_name}`
                    : 'Community update'}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Row 3: Quick Actions Card
// ─────────────────────────────────────────────────────────────────────────────

const QuickActionsCard: React.FC<{ isVerified: boolean }> = ({ isVerified }) => {
  const actions = [
    {
      label: 'Start a chat',
      href: '/chat',
      icon: <MessageCircle size={18} strokeWidth={2} aria-hidden="true" />,
      tileClass: styles.quickTileChat,
    },
    {
      label: 'Browse jobs',
      href: '/jobs',
      icon: <Briefcase size={18} strokeWidth={2} aria-hidden="true" />,
      tileClass: styles.quickTileJobs,
    },
    {
      label: 'Post on forums',
      href: '/forums',
      icon: <SquarePen size={18} strokeWidth={2} aria-hidden="true" />,
      tileClass: styles.quickTileForums,
    },
    {
      label: 'Register for event',
      href: '/events',
      icon: <CalendarPlus size={18} strokeWidth={2} aria-hidden="true" />,
      tileClass: styles.quickTileEvents,
    },
  ];

  return (
    <div className={`${styles.card} ${styles.quickCard}`}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Quick actions</h2>
        <span className={styles.cardBadge}>Shortcuts</span>
      </div>

      <div className={styles.quickGrid}>
        {actions.map((act) => {
          const isLocked = !isVerified;
          return (
            <Link
              key={act.label}
              to={act.href}
              className={`${styles.quickTile} ${act.tileClass} ${isLocked ? styles.quickTileLocked : ''}`}
              aria-label={isLocked ? `${act.label} (locked — verification pending)` : act.label}
              aria-disabled={isLocked || undefined}
            >
              <div className={styles.quickIconBox}>{act.icon}</div>
              <span className={styles.quickLabel}>{act.label}</span>
              {isLocked && (
                <Lock size={14} strokeWidth={2} className={styles.quickLockIcon} aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Row 3: Your Profile Card
// ─────────────────────────────────────────────────────────────────────────────

const ProfileCard: React.FC<{
  fullName: string;
  degree: string | null;
  branch: string | null;
  gradYear: string | number | null;
  avatarUrl: string | null;
  verificationStatus: string;
  completeness: DashboardCompleteness;
  isAdmin: boolean;
}> = ({ fullName, degree, branch, gradYear, avatarUrl, verificationStatus, completeness, isAdmin }) => {
  const navigate = useNavigate();
  const initials = getInitials(fullName);

  const subline = [degree, branch, gradYear ? `'${String(gradYear).slice(-2)}` : null]
    .filter(Boolean)
    .join(' • ') || 'Alumni Member';

  const isApproved = verificationStatus === 'approved' || isAdmin;
  const isPending = !isApproved && verificationStatus !== 'rejected';

  return (
    <div className={`${styles.card} ${styles.profileCard}`}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Your profile</h2>
        <span className={styles.cardBadge} title={subline}>
          {subline}
        </span>
      </div>

      <div className={styles.profileInfo}>
        <div className={styles.profileAvatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className={styles.profileAvatarImg} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className={styles.profileMeta}>
          <h3 className={styles.profileName}>{fullName}</h3>
          {isApproved ? (
            <span className={`${styles.verifiedPill} ${isAdmin ? styles.verifiedAdmin : styles.verifiedApproved}`}>
              {isAdmin ? (
                <ShieldCheck size={12} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <Check size={12} strokeWidth={2.5} aria-hidden="true" />
              )}
              <span>{isAdmin ? 'Admin' : 'Verified'}</span>
            </span>
          ) : isPending ? (
            <span className={`${styles.verifiedPill} ${styles.verifiedPending}`}>
              <Clock3 size={12} strokeWidth={2.5} aria-hidden="true" />
              <span>Pending</span>
            </span>
          ) : (
            <span className={`${styles.verifiedPill} ${styles.verifiedPending}`}>
              <span>Action required</span>
            </span>
          )}
        </div>
      </div>

      <div className={styles.completenessBox}>
        <div className={styles.completenessHeader}>
          <span className={styles.completenessLabel}>Profile completeness</span>
          <span className={styles.completenessValue}>{completeness.percentage}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${completeness.percentage}%` }} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/profile')}
        className={styles.profileBtn}
      >
        {completeness.percentage === 100 ? 'View profile' : 'Finish profile'}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────

interface CardState<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

const initialCard = <T,>(): CardState<T> => ({ data: null, loading: true, error: false });

export const Dashboard: React.FC = () => {
  const { user, profile, isVerified, userType } = useAuth();

  const meta = (user?.user_metadata || {}) as Record<string, unknown>;
  const prof = (profile || {}) as Record<string, unknown>;
  const fullName: string =
    (meta.full_name as string) || (prof.full_name as string) || user?.email?.split('@')[0] || 'there';
  const firstName = fullName.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = GREETING_BY_HOUR(hour);

  const college: string | null = (meta.college as string) || (prof.college as string) || null;
  const branch: string | null = (meta.branch as string) || (prof.branch as string) || null;
  const degree: string | null = (meta.degree as string) || (prof.degree as string) || null;
  const gradYear: string | number | null =
    (meta.graduation_year as string | number) || (prof.graduation_year as string) || null;
  const avatarUrl: string | null = (prof.avatar_url as string) ?? null;
  const verificationStatus: string =
    (prof.verification_status as string) || (meta.verification_status as string) || 'pending';
  const isAdmin = userType === 'admin';
  const profId: string = (prof.id as string) || user?.id || '';
  const isLocked = !isVerified;

  const [alumniState, setAlumniState] = useState<CardState<DashboardAlumniCount>>(initialCard());
  const [messagesState, setMessagesState] = useState<CardState<DashboardJob[]>>(initialCard());
  const [newJobsState, setNewJobsState] = useState<CardState<number>>(initialCard());
  const [upcomingCountState, setUpcomingCountState] = useState<CardState<number>>(initialCard());
  const [eventsState, setEventsState] = useState<CardState<DashboardEvent[]>>(initialCard());
  const [activityState, setActivityState] = useState<CardState<DashboardActivityItem[]>>(initialCard());
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (isLocked) {
      setAlumniState({ data: null, loading: false, error: false });
      setMessagesState({ data: [], loading: false, error: false });
      setNewJobsState({ data: 0, loading: false, error: false });
      setUpcomingCountState({ data: 0, loading: false, error: false });
      setEventsState({ data: [], loading: false, error: false });
      setActivityState({ data: [], loading: false, error: false });
      if (isAdmin) {
        setPendingCount(null);
      }
      return;
    }

    await Promise.allSettled([
      (async () => {
        if (!college) {
          setAlumniState({ data: { total: 0, thisMonth: 0 }, loading: false, error: false });
          return;
        }
        try {
          const data = await fetchDashboardAlumniCount(college);
          setAlumniState({ data, loading: false, error: false });
        } catch {
          setAlumniState({ data: null, loading: false, error: true });
        }
      })(),
      (async () => {
        try {
          const data = await fetchDashboardMessages(profId);
          setMessagesState({ data, loading: false, error: false });
        } catch {
          setMessagesState({ data: [], loading: false, error: true });
        }
      })(),
      (async () => {
        try {
          const data = await fetchDashboardNewJobsCount();
          setNewJobsState({ data, loading: false, error: false });
        } catch {
          setNewJobsState({ data: 0, loading: false, error: true });
        }
      })(),
      (async () => {
        try {
          const data = await fetchDashboardUpcomingEventsCount();
          setUpcomingCountState({ data, loading: false, error: false });
        } catch {
          setUpcomingCountState({ data: 0, loading: false, error: true });
        }
      })(),
      (async () => {
        try {
          const data = await fetchDashboardEvents();
          setEventsState({ data, loading: false, error: false });
        } catch {
          setEventsState({ data: [], loading: false, error: true });
        }
      })(),
      (async () => {
        try {
          const data = await fetchDashboardRecentActivity();
          setActivityState({ data, loading: false, error: false });
        } catch {
          setActivityState({ data: [], loading: false, error: true });
        }
      })(),
      (async () => {
        if (isAdmin) {
          try {
            const count = await fetchDashboardPendingCount();
            setPendingCount(count);
          } catch {
            setPendingCount(null);
          }
        }
      })(),
    ]);
  }, [college, profId, isLocked, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unreadMessagesCount = messagesState.data?.length ?? 0;

  const completeness: DashboardCompleteness = computeProfileCompleteness({
    avatar_url: avatarUrl,
    bio: (prof.bio as string) ?? null,
    skills: (prof.skills as string[]) ?? null,
    linkedin: (prof.linkedin as string) ?? null,
    company: (prof.company as string) ?? null,
    job_title: (prof.job_title as string) ?? null,
    firstMessageSent: unreadMessagesCount > 0,
  });

  return (
    <motion.main
      className={styles.dashboard}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_REVEAL }}
    >
      {/* Context banner for unverified accounts or admin pending review */}
      <ContextBanner isVerified={isVerified} isAdmin={isAdmin} pendingCount={pendingCount} />

      {/* Greeting Header Row */}
      <GreetingRow greeting={greeting} firstName={firstName} college={college} />

      {/* Row 1: Four Stat Cards */}
      <section className={styles.statsGrid} aria-label="Key alumni metrics">
        <StatCard
          variant="alumni"
          value={alumniState.data?.total ?? (isLocked ? 0 : null)}
          loading={alumniState.loading}
          error={alumniState.error}
          thisMonth={alumniState.data?.thisMonth}
          href="/directory"
          label="Alumni in your college"
          visuallyHiddenLabel="Alumni count"
          onRetry={loadData}
        />

        <StatCard
          variant="messages"
          value={unreadMessagesCount}
          loading={messagesState.loading}
          error={messagesState.error}
          href="/chat"
          label="Unread messages"
          visuallyHiddenLabel="Unread messages count"
          onRetry={loadData}
        />

        <StatCard
          variant="jobs"
          value={newJobsState.data ?? (isLocked ? 0 : null)}
          loading={newJobsState.loading}
          error={newJobsState.error}
          href="/jobs"
          label="New jobs this week"
          visuallyHiddenLabel="New jobs count"
          onRetry={loadData}
        />

        <StatCard
          variant="events"
          value={upcomingCountState.data ?? (isLocked ? 0 : null)}
          loading={upcomingCountState.loading}
          error={upcomingCountState.error}
          href="/events"
          label="Upcoming events"
          visuallyHiddenLabel="Upcoming events count"
          onRetry={loadData}
        />
      </section>

      {/* Row 2: Community Hub Hero Card (7 cols) + Upcoming Events Card (5 cols) */}
      <section className={styles.row2} aria-label="Spotlight and events">
        <HeroCard newJobs={newJobsState.data ?? 0} events={eventsState.data ?? []} />

        <EventsCard
          events={eventsState.data ?? []}
          loading={eventsState.loading}
          error={eventsState.error}
          onRetry={loadData}
        />
      </section>

      {/* Row 3: Three Equal Cards (Recent Activity + Quick Actions + Your Profile) */}
      <section className={styles.row3} aria-label="Activity, quick actions, and profile">
        <ActivityCard
          items={activityState.data ?? []}
          unread={unreadMessagesCount}
          loading={activityState.loading}
          error={activityState.error}
          onRetry={loadData}
        />

        <QuickActionsCard isVerified={isVerified} />

        <ProfileCard
          fullName={fullName}
          degree={degree}
          branch={branch}
          gradYear={gradYear}
          avatarUrl={avatarUrl}
          verificationStatus={verificationStatus}
          completeness={completeness}
          isAdmin={isAdmin}
        />
      </section>
    </motion.main>
  );
};

export default Dashboard;
