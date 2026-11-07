import React, { useState } from 'react';
import styles from './Avatar.module.css';
import { cx } from './internal';

export interface AvatarProps {
  /** Full name — drives initials and the deterministic palette slot. */
  name: string;
  src?: string | null;
  online?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/* Pastel + ink pairs; bg uses brand pastels, ink is dark for ≥4.5:1. */
const PAIRS: Array<[fill: string, ink: string]> = [
  ['#d9cff5', '#322749'],
  ['#ccdac6', '#28331f'],
  ['#c7e4f2', '#1d3542'],
  ['#f2d6c4', '#4a2d17'],
  ['#e4ddfa', '#352a5e'],
  ['#f5dfc6', '#46351c'],
];

const hash = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

/**
 * Avatar with an image, an initials fallback (also used if the image
 * fails), and an optional presence dot in the palette's success color.
 */
export const Avatar: React.FC<AvatarProps> = ({ name, src, online, size = 'md', className }) => {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(src) && !broken;
  const [fill, ink] = PAIRS[hash(name) % PAIRS.length];

  return (
    <span className={cx(styles.avatar, styles[size], className)}>
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={name}
          onError={() => setBroken(true)}
          className={styles.image}
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className={styles.fallback}
          style={{ background: fill, color: ink }}
        >
          {initialsOf(name)}
        </span>
      )}
      {online && <span className={styles.dot} aria-label={`${name} online`} />}
    </span>
  );
};
