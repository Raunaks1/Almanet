import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui';
import styles from './GetStartedCard.module.css';

export interface GetStartedCardProps {
  completeness: {
    percentage: number;
    remaining: string[];
  } | null;
  _loading: boolean;
}

export const GetStartedCard: React.FC<GetStartedCardProps> = ({
  completeness,
  _loading,
}) => {
  if (!completeness) return null;
  if (completeness.percentage >= 100) return null;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Get started</h2>
        <span className={styles.pct}>{completeness.percentage}% complete</span>
      </div>
      <div className={styles.ringWrap}>
        <svg className={styles.ring} viewBox="0 0 44 44">
          <circle
            className={styles.ringTrack}
            cx="22"
            cy="22"
            r="18"
            stroke="var(--surface-2)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <circle
            className={styles.ringProgress}
            cx="22"
            cy="22"
            r="18"
            stroke="var(--accent)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="113"
            strokeDashoffset={`${113 * (1 - completeness.percentage / 100)}`}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
        <span className={styles.ringText}>{completeness.percentage}%</span>
      </div>
      <ul className={styles.steps} aria-label="Remaining steps">
        {completeness.remaining.map((step, i) => (
          <li key={i} className={styles.stepRow}>
            <span className={styles.stepNum}>{i + 1}</span>
            <span className={styles.stepLabel}>{step}</span>
            <span className={styles.chevron} aria-hidden="true" />
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <Link to="/profile/edit">
          <Button variant="primary">Finish profile</Button>
        </Link>
      </div>
    </section>
  );
};
