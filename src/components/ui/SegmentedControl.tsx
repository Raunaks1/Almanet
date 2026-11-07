import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SPRING } from '../../lib/motion';
import styles from './SegmentedControl.module.css';
import { cx } from './internal';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

/**
 * macOS-style segmented control with a sliding thumb (`layoutId` so the
 * thumb springs between segments). Radiogroup semantics; arrow keys cycle.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  const thumbId = useId();
  const reduced = useReducedMotion();
  const index = Math.max(
    options.findIndex((o) => o.value === value),
    0,
  );

  const cycle = (dir: 1 | -1) => {
    const next = (index + dir + options.length) % options.length;
    onChange(options[next].value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx(styles.seg, styles[size])}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          cycle(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          cycle(-1);
        }
      }}
    >
      <motion.span
        className={styles.thumb}
        aria-hidden="true"
        layoutId={`seg-thumb-${thumbId}`}
        transition={reduced ? { duration: 0.15, ease: 'linear' } : SPRING}
        data-index={index}
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={styles.btn}
            onClick={() => onChange(option.value)}
          >
            {option.icon && <span className={styles.icon}>{option.icon}</span>}
            <span className={styles.label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
