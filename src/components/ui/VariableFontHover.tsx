import React from 'react';
import { cx } from './internal';
import styles from './VariableFontHover.module.css';

interface Props {
  label: string;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center';
  className?: string;
}

export function VariableFontHover({
  label,
  fromFontVariationSettings = "'wght' 400",
  toFontVariationSettings = "'wght' 700",
  staggerDuration = 0.03,
  staggerFrom = 'center',
  className,
}: Props) {
  const letters = Array.from(label);
  const n = letters.length;
  const delay = (i: number) =>
    (staggerFrom === 'first'
      ? i
      : staggerFrom === 'last'
        ? n - 1 - i
        : Math.abs(i - (n - 1) / 2)) * staggerDuration;

  return (
    <span
      className={cx(styles.vfh, className)}
      style={{
        '--vfh-from': fromFontVariationSettings,
        '--vfh-to': toFontVariationSettings,
      } as React.CSSProperties}
    >
      <span className={styles.vfhSizer} aria-hidden="true">
        {label}
      </span>
      <span className={styles.vfhLetters} aria-hidden="true">
        {letters.map((ch, i) => (
          <span
            key={i}
            className={styles.vfhLetter}
            style={{ transitionDelay: `${delay(i).toFixed(3)}s` }}
          >
            {ch}
          </span>
        ))}
      </span>
      <span className={styles.vfhSr}>{label}</span>
    </span>
  );
}
