import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronUp, LogOut, Monitor, Moon, Sun, User } from 'lucide-react';
import { Avatar } from '../ui';
import { SPRING } from '../../lib/motion';
import { useTheme } from '../../ThemeContext';
import type { Theme } from '../../ThemeContext';
import { supabase } from '../../lib/supabase';
import styles from './AppShell.module.css';
import { cx } from '../ui/internal';

export interface ShellUser {
  name: string;
  avatarUrl?: string | null;
  /** Short role line under the name ("Verified alumni", "Admin"…). */
  role: string;
  isAdmin: boolean;
  isVerified: boolean;
  userId?: string | null;
}

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/** Compact appearance picker — used in the user menu and the More sheet. */
export const ThemeChooser: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const groupRef = useRef<HTMLDivElement>(null);
  const index = Math.max(
    THEME_OPTIONS.findIndex((option) => option.value === theme),
    0,
  );

  // Radiogroup keyboard model: arrows cycle, Home/End jump, roving tab stop.
  const onKeyDown = (event: React.KeyboardEvent) => {
    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = THEME_OPTIONS.length - 1;
    if (next === null) return;
    event.preventDefault();
    const wrapped = (next + THEME_OPTIONS.length) % THEME_OPTIONS.length;
    setTheme(THEME_OPTIONS[wrapped].value);
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[wrapped]?.focus();
  };

  return (
    <div className={cx(styles.themeRow, className)}>
      <span className={styles.themeLabel}>Appearance</span>
      <div
        ref={groupRef}
        className={styles.themeOptions}
        role="radiogroup"
        aria-label="Appearance"
        onKeyDown={onKeyDown}
      >
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme === value}
            aria-label={label}
            title={label}
            tabIndex={theme === value ? 0 : -1}
            className={cx(styles.themeBtn, theme === value && styles.themeBtnActive)}
            onClick={() => setTheme(value)}
          >
            <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Sidebar footer account card. Opens a popover with Profile, Appearance
 * and Sign out; closes on outside press or Escape.
 */
export const UserMenu: React.FC<{ profile: ShellUser }> = ({ profile }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className={styles.userArea} ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.userCard}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={profile.name} src={profile.avatarUrl} size="sm" />
        <span className={styles.userMeta}>
          <span className={styles.userName}>{profile.name}</span>
          <span className={styles.userRole}>{profile.role}</span>
        </span>
        <ChevronUp
          size={15}
          strokeWidth={1.75}
          aria-hidden="true"
          className={cx(styles.userChevron, open && styles.userChevronOpen)}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.menu}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            transition={reduced ? { duration: 0.15, ease: 'linear' } : SPRING}
          >
            {profile.userId && (
              <Link
                to={`/profile/${profile.userId}`}
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <User size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Profile</span>
              </Link>
            )}
            <ThemeChooser />
            <div className={styles.menuDivider} aria-hidden="true" />
            <button type="button" className={cx(styles.menuItem, styles.menuDanger)} onClick={signOut}>
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
