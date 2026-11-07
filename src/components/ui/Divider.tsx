import React from 'react';
import styles from './Divider.module.css';
import { cx } from './internal';

export interface DividerProps {
  /** Optional centered word — wraps the rule around a label ("OR", a date…). */
  label?: string;
  vertical?: boolean;
  /** Outer spacing for horizontal dividers. Vertical dividers manage their own inline margins. */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** Mostly for one-off sizing (e.g. a fixed-height vertical rule). */
  style?: React.CSSProperties;
  className?: string;
}

const SPACING = { none: '0px', sm: '12px', md: '20px', lg: '28px' } as const;

/** Hairline separator in the theme's line color. */
export const Divider: React.FC<DividerProps> = ({ label, vertical, spacing = 'md', style, className }) => {
  if (vertical) {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={cx(styles.rule, styles.vertical, className)}
        style={style}
      />
    );
  }

  if (label) {
    return (
      <div role="separator" className={cx(styles.labeled, className)} style={style}>
        <span className={styles.line} />
        <span className={styles.word}>{label}</span>
        <span className={styles.line} />
      </div>
    );
  }

  return (
    <div
      role="separator"
      className={cx(styles.rule, styles.horizontal, className)}
      style={{ ...style, margin: `${SPACING[spacing]} 0` }}
    />
  );
};
