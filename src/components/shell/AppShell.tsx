import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ChevronRight,
  Ellipsis,
  Lock,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import { SPRING } from '../../lib/motion';
import { useAuth } from '../../lib/useAuth';
import { supabase } from '../../lib/supabase';
import { Modal } from '../ui';
import { cx } from '../ui/internal';
import {
  ADMIN_ITEM,
  MORE_ITEMS,
  NAV_ITEMS,
  TAB_ITEMS,
  isItemActive,
  isItemLocked,
  titleForPath,
} from './nav';
import type { ShellNavItem } from './nav';
import { PageTransition } from './PageTransition';
import { ThemeChooser, UserMenu } from './UserMenu';
import type { ShellUser } from './UserMenu';
import styles from './AppShell.module.css';

export interface AppShellFrameProps {
  profile: ShellUser;
  /** Visual-only unread count for the Chat badge slot. */
  unreadChats?: number;
}

interface SidebarItemProps {
  item: ShellNavItem;
  active: boolean;
  locked: boolean;
  unread?: number;
  reduced: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, active, locked, unread = 0, reduced }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={cx(styles.navItem, active && styles.navItemActive, locked && styles.navItemLocked)}
    >
      {active && (
        <motion.span
          layoutId="shell-sidebar-pill"
          className={styles.pill}
          aria-hidden="true"
          transition={reduced ? { duration: 0.15, ease: 'linear' } : SPRING}
        />
      )}
      <span className={styles.navIcon}>
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className={styles.navLabel}>{item.label}</span>
      {locked && (
        <Lock size={13} strokeWidth={1.75} className={styles.navLock} aria-label="Requires verification" role="img" />
      )}
      {item.to === '/chat' && unread > 0 && (
        <span className={styles.navBadge} aria-label={`${unread} unread messages`}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
};

/**
 * Visual shell frame — sidebar on desktop, top bar + tab bar on mobile.
 * Takes the account as a prop so it can be rendered with any auth source.
 */
export const AppShellFrame: React.FC<AppShellFrameProps> = ({ profile, unreadChats = 0 }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Any navigation closes the More sheet.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setMoreOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };

  const skipToMain = (event: React.MouseEvent) => {
    event.preventDefault();
    mainRef.current?.focus();
    mainRef.current?.scrollIntoView({ block: 'start' });
  };

  return (
    <div className={styles.shell}>
      <a href="#shell-main" className={styles.skipLink} onClick={skipToMain}>
        Skip to content
      </a>

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className={styles.sidebar} aria-label="Sidebar">
        <Link to="/dashboard" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3 2.5 8.2 12 13.4l7.4-4V15a1 1 0 0 0 2 0V8.2L12 3Z"
                fill="currentColor"
              />
              <path
                d="M6 11.6v4.2c0 1.7 2.7 3.2 6 3.2s6-1.5 6-3.2v-4.2l-6 3.3-6-3.3Z"
                fill="currentColor"
                opacity="0.55"
              />
            </svg>
          </span>
          <span className={styles.brandName}>Almanet</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.to}
              item={item}
              active={isItemActive(pathname, item.to)}
              locked={isItemLocked(item.to, profile.isVerified)}
              unread={unreadChats}
              reduced={reduced}
            />
          ))}
          {profile.isAdmin && (
            <>
              <div className={styles.navDivider} aria-hidden="true" />
              <SidebarItem
                item={ADMIN_ITEM}
                active={isItemActive(pathname, ADMIN_ITEM.to)}
                locked={false}
                reduced={reduced}
              />
            </>
          )}
        </nav>

        <UserMenu profile={profile} />
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <header className={cx(styles.topBar, scrolled && styles.topBarScrolled)}>
        <div className={styles.topBarInner}>
          <span className={cx(styles.topTitle, scrolled && styles.topTitleVisible)}>
            {titleForPath(pathname)}
          </span>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────── */}
      <main ref={mainRef} id="shell-main" className={styles.main} tabIndex={-1}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* ── Mobile tab bar ──────────────────────────────────────── */}
      <nav className={styles.tabBar} aria-label="Primary">
        {TAB_ITEMS.map((item) => {
          const active = isItemActive(pathname, item.to);
          const locked = isItemLocked(item.to, profile.isVerified);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={cx(styles.tab, active && styles.tabActive, locked && styles.tabLocked)}
            >
              <span className={styles.tabIcon}>
                <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                {item.to === '/chat' && unreadChats > 0 && (
                  <span className={styles.tabBadge} aria-label={`${unreadChats} unread messages`}>
                    {unreadChats > 9 ? '9+' : unreadChats}
                  </span>
                )}
                {locked && (
                  <span className={styles.tabLock} aria-hidden="true">
                    <Lock size={9} strokeWidth={2} />
                  </span>
                )}
              </span>
              <span className={styles.tabLabel}>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={cx(styles.tab, moreOpen && styles.tabActive)}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          onClick={() => setMoreOpen(true)}
        >
          <span className={styles.tabIcon}>
            <Ellipsis size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className={styles.tabLabel}>More</span>
        </button>
      </nav>

      {/* ── More sheet (mobile) ─────────────────────────────────── */}
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className={styles.sheetList}>
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            const locked = isItemLocked(item.to, profile.isVerified);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cx(styles.sheetRow, locked && styles.sheetRowLocked)}
                onClick={() => setMoreOpen(false)}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className={styles.sheetLabel}>{item.label}</span>
                {locked && (
                  <Lock size={14} strokeWidth={1.75} aria-label="Requires verification" role="img" />
                )}
                <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" className={styles.sheetChevron} />
              </Link>
            );
          })}

          <div className={styles.sheetDivider} aria-hidden="true" />

          {profile.userId && (
            <Link
              to={`/profile/${profile.userId}`}
              className={styles.sheetRow}
              onClick={() => setMoreOpen(false)}
            >
              <User size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className={styles.sheetLabel}>Profile</span>
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" className={styles.sheetChevron} />
            </Link>
          )}

          {profile.isAdmin && (
            <Link to="/admin" className={styles.sheetRow} onClick={() => setMoreOpen(false)}>
              <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className={styles.sheetLabel}>Admin</span>
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" className={styles.sheetChevron} />
            </Link>
          )}

          <div className={styles.sheetDivider} aria-hidden="true" />

          <ThemeChooser className={styles.sheetThemeRow} />

          <button
            type="button"
            className={cx(styles.sheetRow, styles.sheetDanger)}
            onClick={handleSignOut}
          >
            <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
            <span className={styles.sheetLabel}>Sign out</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

/**
 * Route layout for authenticated pages. Reads the session through the
 * existing useAuth hook and renders the shell around the nested routes.
 */
export const AppShell: React.FC<{ unreadChats?: number }> = ({ unreadChats = 0 }) => {
  const { user, profile, isVerified, userType } = useAuth();
  const meta = user?.user_metadata ?? {};
  const name: string = profile?.full_name || meta.full_name || user?.email?.split('@')[0] || 'Your account';
  const avatarUrl: string | null = profile?.avatar_url || meta.avatar_url || null;
  const isAdmin = userType === 'admin';

  return (
    <AppShellFrame
      profile={{
        name,
        avatarUrl,
        role: isAdmin ? 'Admin' : isVerified ? 'Verified member' : 'Verification pending',
        isAdmin,
        isVerified,
        userId: user?.id ?? null,
      }}
      unreadChats={unreadChats}
    />
  );
};
