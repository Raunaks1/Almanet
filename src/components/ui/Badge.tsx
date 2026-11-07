import React from 'react';
import { X } from 'lucide-react';
import styles from './Badge.module.css';
import { cx } from './internal';

export interface BadgeProps {
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const DOT_COLORS: Record<Exclude<BadgeProps['variant'], undefined>, string | undefined> = {
  neutral: undefined,
  accent: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
};

/** Colored status pill. Tinted background, high-contrast mixed text. */
export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', size = 'md', dot, children, className }) => (
  <span className={cx(styles.badge, styles[variant], styles[size], className)}>
    {dot && variant !== 'neutral' && (
      <span className={styles.dot} style={{ background: DOT_COLORS[variant] }} aria-hidden="true" />
    )}
    {children}
  </span>
);

export interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Selectable pill with an optional remove affordance. */
export const Chip: React.FC<ChipProps> = ({ selected, onClick, onRemove, children, className }) => (
  <span
    className={cx(styles.chip, selected && styles.chipSelected, className)}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }
        : undefined
    }
  >
    {children}
    {onRemove && (
      <button
        type="button"
        aria-label="Remove"
        className={styles.remove}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X size={12} strokeWidth={1.75} aria-hidden="true" />
      </button>
    )}
  </span>
);
