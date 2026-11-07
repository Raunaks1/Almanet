import React from 'react';
import styles from './EmptyState.module.css';
import { cx } from './internal';

export interface EmptyStateProps {
  /** Icon glyph (lucide, >=28px, stroke 1.75). Decorative. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Usually a Button. */
  action?: React.ReactNode;
  className?: string;
}

/** Empty-data placeholder — transparent, composes inside any surface. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div className={cx(styles.empty, className)}>
    {icon && (
      <span className={styles.iconWrap} aria-hidden="true">
        {icon}
      </span>
    )}
    <h3 className={styles.title}>{title}</h3>
    {description && <p className={styles.description}>{description}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
);
