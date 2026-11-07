import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BadgeCheck, ChevronDown, GraduationCap, MapPin, MessageCircle, Search, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/shell/PageHeader';
import { Avatar, Badge, EmptyState, Skeleton } from '../components/ui';
import { cx } from '../components/ui/internal';
import { DURATION, EASE_REVEAL, listStagger } from '../lib/motion';
import styles from './Directory.module.css';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_type: 'alumni' | 'student' | 'admin';
  college?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
  industry?: string;
  location?: string;
  skills: string[];
  verification_status: 'pending' | 'approved' | 'rejected';
  bio?: string;
  phone?: string;
  visibility?: 'public' | 'private' | 'alumni-only';
  linkedin?: string;
  twitter?: string;
  employer?: string;
  job_title?: string;
  years_of_experience?: number;
  mission_statement?: string;
  avatar_url?: string;
}

const industries = ['Software Engineering', 'Data Science', 'Product Management', 'Design', 'Finance'];
const years = [2026, 2025, 2024, 2023, 2022, 2021];

type FilterKind = 'industry' | 'year' | null;

const FilterPopover: React.FC<{
  label: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (value: string) => void;
}> = ({ label, value, options, open, onToggle, onClose, onSelect }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={styles.filterWrap} ref={wrapRef}>
      <button
        type="button"
        className={cx(styles.filterChip, value && styles.filterChipActive)}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={onToggle}
      >
        <span>{value || label}</span>
        <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.popover}
            role="listbox"
            aria-label={label}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            transition={reduced ? { duration: 0.12 } : { duration: DURATION.fast, ease: EASE_REVEAL }}
          >
            <button
              type="button"
              className={cx(styles.popItem, !value && styles.popItemSelected)}
              onClick={() => { onSelect(''); onClose(); }}
            >
              {label === 'Industry' ? 'All industries' : 'All years'}
            </button>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={value === opt}
                className={cx(styles.popItem, value === opt && styles.popItemSelected)}
                onClick={() => { onSelect(opt); onClose(); }}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Directory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [alumni, setAlumni] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFilter, setOpenFilter] = useState<FilterKind>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion() ?? false;

  React.useEffect(() => {
    const fetchAlumni = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'alumni')
        .eq('verification_status', 'approved');
      
      if (!error && data) {
        setAlumni(data as UserProfile[]);
      }
      setLoading(false);
    };
    fetchAlumni();
  }, []);

  // ⌘K / Ctrl+K focuses search (visual hint shown on desktop; UI-only enhancement)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredAlumni = alumni.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIndustry = selectedIndustry ? user.industry === selectedIndustry : true;
    const matchesYear = selectedYear ? user.graduation_year?.toString() === selectedYear : true;

    return matchesSearch && matchesIndustry && matchesYear;
  });

  const activeFilters = [
    selectedIndustry ? { key: 'industry', label: selectedIndustry, clear: () => setSelectedIndustry('') } : null,
    selectedYear ? { key: 'year', label: `Class of ${selectedYear}`, clear: () => setSelectedYear('') } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

  const stagger = listStagger();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Directory"
        subtitle="Find alumni by name, skills, industry, and graduation year."
      />

      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <Search size={18} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            className={styles.searchInput}
            placeholder="Search by name or skill"
            aria-label="Search alumni by name or skill"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className={styles.kbdHint} aria-hidden="true">⌘K</span>
        </div>
        <div className={styles.filters}>
          <FilterPopover
            label="Industry"
            value={selectedIndustry}
            options={industries}
            open={openFilter === 'industry'}
            onToggle={() => setOpenFilter((v) => (v === 'industry' ? null : 'industry'))}
            onClose={() => setOpenFilter(null)}
            onSelect={setSelectedIndustry}
          />
          <FilterPopover
            label="Graduation year"
            value={selectedYear}
            options={years.map(String)}
            open={openFilter === 'year'}
            onToggle={() => setOpenFilter((v) => (v === 'year' ? null : 'year'))}
            onClose={() => setOpenFilter(null)}
            onSelect={setSelectedYear}
          />
        </div>
      </div>

      <div className={styles.activeFilters} aria-live="polite">
        <AnimatePresence initial={false}>
          {activeFilters.map((f) => (
            <motion.span
              key={f.key}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              transition={{ duration: DURATION.fast, ease: EASE_REVEAL }}
              style={{ display: 'inline-flex' }}
            >
              <Badge variant="accent">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {f.label}
                  <button
                    type="button"
                    onClick={f.clear}
                    aria-label={`Remove ${f.label} filter`}
                    style={{ display: 'inline-flex', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                </span>
              </Badge>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className={styles.grid} aria-busy="true" aria-label="Loading alumni">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={styles.card} style={{ minHeight: 260 }}>
              <div className={styles.cardTop}>
                <Skeleton width={52} height={52} radius="circle" />
                <Skeleton width={20} height={20} radius="circle" />
              </div>
              <Skeleton width="70%" height={18} />
              <div style={{ height: 6 }} />
              <Skeleton width="50%" height={14} />
              <div style={{ height: 12 }} />
              <Skeleton width="45%" height={13} />
              <Skeleton width="38%" height={13} />
              <div style={{ height: 12 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <Skeleton width={64} height={24} radius={999} />
                <Skeleton width={54} height={24} radius={999} />
                <Skeleton width={58} height={24} radius={999} />
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Skeleton height={40} radius={999} />
                <Skeleton height={40} radius={999} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAlumni.length === 0 ? (
        <EmptyState
          icon={<Users size={28} strokeWidth={1.75} />}
          title="No alumni found"
          description="Try adjusting your search or filters to find people in the network."
          action={
            (searchTerm || selectedIndustry || selectedYear) ? (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSelectedIndustry(''); setSelectedYear(''); }}
                style={{
                  minHeight: 40, padding: '0 16px', borderRadius: 999, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text)', font: 'var(--type-footnote)', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          className={styles.grid}
          initial={reduced ? false : 'hidden'}
          animate="visible"
          variants={stagger.parent}
        >
          {filteredAlumni.map((user: UserProfile) => {
            const roleLine = user.job_title && user.employer
              ? `${user.job_title} at ${user.employer}`
              : user.job_title || user.employer || user.industry || 'Alumni';
            return (
              <motion.article
                key={user.id}
                className={styles.card}
                variants={reduced ? undefined : stagger.child}
              >
                <div className={styles.cardTop}>
                  <Avatar name={user.full_name} src={user.avatar_url} size="lg" />
                  {user.verification_status === 'approved' && (
                    <span className={styles.verified} title="Verified" aria-label="Verified">
                      <BadgeCheck size={20} strokeWidth={1.75} />
                    </span>
                  )}
                </div>

                <h3 className={styles.name}>{user.full_name}</h3>
                <p className={styles.roleLine}>{roleLine}</p>

                <div className={styles.meta}>
                  <span className={styles.metaRow}>
                    <GraduationCap size={15} strokeWidth={1.75} aria-hidden="true" />
                    Class of {user.graduation_year || '—'}
                  </span>
                  {user.location && (
                    <span className={styles.metaRow}>
                      <MapPin size={15} strokeWidth={1.75} aria-hidden="true" />
                      {user.location}
                    </span>
                  )}
                </div>

                <div className={styles.skills}>
                  {user.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="neutral">{skill}</Badge>
                  ))}
                  {user.skills.length > 3 && (
                    <span className={styles.moreSkills}>+{user.skills.length - 3}</span>
                  )}
                </div>

                <div className={styles.actions}>
                  <Link to={`/profile/${user.id}`} className={cx(styles.actionBtn, styles.actionSecondary)}>
                    View
                  </Link>
                  <Link to={`/chat?dm=${user.id}`} className={cx(styles.actionBtn, styles.actionPrimary)}>
                    <MessageCircle size={15} strokeWidth={1.75} aria-hidden="true" />
                    Message
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default Directory;
