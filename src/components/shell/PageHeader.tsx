import React from 'react';
import styles from './PageHeader.module.css';
import { cx } from '../ui/internal';

export interface PageHeaderProps {
  /** Large title — the page's h1. */
  title: string;
  subtitle?: string;
  /** Right-aligned controls on desktop, wrapped below on narrow screens. */
  actions?: React.ReactNode;
  className?: string;
}

/** Page-level heading: large title, subtitle and an actions slot. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, className }) => (
  <header className={cx(styles.header, className)}>
    <div className={styles.heading}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
    {actions && <div className={styles.actions}>{actions}</div>}
  </header>
);
