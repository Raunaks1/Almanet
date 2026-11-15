/**
 * ATSIssueCard — a single actionable ATS issue card (Liquid Glass style).
 *
 * Shows icon, title, description, severity badge, "Fix ->" button,
 * and a collapsible "Reason" expander.
 */

import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import type { ATSIssue } from '../../lib/resume/atsLogic';
import { Button } from '../ui';
import styles from './ATSIssueCard.module.css';

interface ATSIssueCardProps {
  issue: ATSIssue;
  onFix?: () => void;
  onMarkCompleted?: () => void;
  onMarkDeleted?: () => void;
}

const SEVERITY_ICON: Record<ATSIssue['severity'], React.ElementType> = {
  error: AlertTriangle,
  warning: Info,
  info: Info,
};

const SEVERITY_VARIANT: Record<ATSIssue['severity'], string> = {
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--accent)',
};

export const ATSIssueCard: React.FC<ATSIssueCardProps> = ({
  issue,
  onFix,
  onMarkCompleted,
  onMarkDeleted,
}) => {
  const [reasonOpen, setReasonOpen] = useState(false);
  const severityColor = SEVERITY_VARIANT[issue.severity];
  const Icon = SEVERITY_ICON[issue.severity];

  return (
    <article className={styles.card} aria-label={`Issue: ${issue.title}`}>
      <div className={styles.cardHead}>
        <div className={styles.severityBadge} style={{ color: severityColor }}>
          <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className={styles.severityText}>{issue.severity}</span>
        </div>
        <button
          type="button"
          className={styles.reasonBtn}
          onClick={() => setReasonOpen(!reasonOpen)}
          aria-expanded={reasonOpen}
          aria-label={reasonOpen ? 'Hide reason' : 'Show reason'}
        >
          {reasonOpen ? <X size={14} strokeWidth={1.75} aria-hidden="true" /> : <Info size={14} strokeWidth={1.75} aria-hidden="true" />}
          <span>{reasonOpen ? 'Hide' : 'Why this matters'}</span>
        </button>
      </div>

      <h4 className={styles.title}>{issue.title}</h4>
      <p className={styles.description}>{issue.description}</p>

      {issue.fixable && onFix ? (
        <div className={styles.fixWrapper}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onFix}
            aria-label={`Fix: ${issue.title}`}
          >
            Fix <span className={styles.fixArrow} aria-hidden="true">&#8594;</span>
          </Button>
        </div>
      ) : null}

      {reasonOpen && (
        <div className={styles.reasonBox}>
          <span className={styles.reasonLabel}>Reason:</span>
          <p className={styles.reasonText}>{issue.reason}</p>
        </div>
      )}

      <div className={styles.actions}>
        {onMarkCompleted && (
          <button
            type="button"
            className={styles.statusBtn}
            onClick={onMarkCompleted}
            aria-label="Mark as completed"
          >
            <CheckCircle2 size={14} strokeWidth={1.75} aria-hidden="true" />
            Completed
          </button>
        )}
        {onMarkDeleted && (
          <button
            type="button"
            className={styles.statusBtn}
            onClick={onMarkDeleted}
            aria-label="Mark as deleted"
          >
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
            Deleted
          </button>
        )}
      </div>
    </article>
  );
}
