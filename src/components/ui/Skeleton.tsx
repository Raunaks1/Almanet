import React from 'react';
import styles from './Skeleton.module.css';
import { cx } from './internal';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | 'circle';
  className?: string;
}

/**
 * Loading placeholder with a transform-only sheen. Decorative by design —
 * place inside an aria-busy section so screen readers skip it.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 14,
  radius,
  className,
}) => {
  const resolvedRadius =
    radius === 'circle' ? '50%' : radius != null ? `${radius}px` : 'var(--radius-1)';

  return (
    <span
      aria-hidden="true"
      className={cx(styles.skeleton, className)}
      style={{ width, height, borderRadius: resolvedRadius }}
    />
  );
};
