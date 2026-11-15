/**
 * ScoreCards — dual top-card layout for the Optimise Analysis view.
 *
 * Card 1: ATS Readiness (rule-based structure score, horizontal bar)
 * Card 2: Job Match (existing 0-100 score ring)
 */

import React from 'react';
import type { ResumeAnalysis } from '../../lib/resume/analyzeResume';
import { computeATSReadiness } from '../../lib/resume/atsLogic';
import styles from './ScoreCards.module.css';

interface ScoreCardsProps {
  resumeText: string;
  analysis: ResumeAnalysis;
  className?: string;
}

export const ScoreCards: React.FC<ScoreCardsProps> = ({
  resumeText,
  analysis,
  className,
}) => {
  const ats = React.useMemo(() => computeATSReadiness(resumeText), [resumeText]);

  const atsColor =
    ats.score >= 70 ? 'var(--success)' : ats.score >= 40 ? 'var(--warning)' : 'var(--danger)';
  const matchColor =
    analysis.score >= 70 ? 'var(--success)' : analysis.score >= 40 ? 'var(--warning)' : 'var(--danger)';

  return (
    <section className={cx(styles.root, className)} aria-label="Scores">
      <div className={styles.cardGrid}>
        {/* Card 1: ATS Readiness */}
        <article className={styles.scoreCard}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>ATS Readiness</span>
            <span className={styles.cardValue}>{ats.score}</span>
          </div>
          <div className={styles.barWrap}>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{
                  width: `${Math.min(100, Math.max(0, ats.score))}%`,
                  background: atsColor,
                }}
              />
            </div>
          </div>
          <div className={styles.cardFoot}>
            <span className={styles.cardNote}>
              {ats.score >= 70
                ? 'Strong structure'
                : ats.score >= 40
                  ? 'Fair structure'
                  : 'Needs structural work'}
            </span>
            <span className={styles.issueCount}>
              {ats.issues.length} issue{ats.issues.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </article>

        {/* Card 2: Job Match */}
        <article className={styles.scoreCard}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Job Match</span>
            <span className={styles.cardValue}>{analysis.score}%</span>
          </div>
          <div className={styles.ringWrap}>
            <svg
              className={styles.ringSvg}
              viewBox="0 0 88 88"
              aria-label={`Match score: ${analysis.score}%`}
              role="img"
            >
              <circle
                className={styles.ringTrack}
                cx="44"
                cy="44"
                r="36"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="10"
                fill="none"
              />
              <circle
                className={styles.ringProgress}
                cx="44"
                cy="44"
                r="36"
                stroke={matchColor}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 2 * Math.PI * 36,
                  strokeDashoffset:
                    2 * Math.PI * 36 - (analysis.score / 100) * (2 * Math.PI * 36),
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: 'stroke-dashoffset 0.6s ease',
                }}
              />
              <text
                x="50%"
                y="50%"
                className={styles.ringText}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--text)"
                fontSize="20"
                fontWeight="700"
              >
                {analysis.score}%
              </text>
            </svg>
          </div>
          <div className={styles.cardFoot}>
            <span className={styles.cardNote}>
              {analysis.label}
            </span>
            <span className={styles.issueCount}>
              vs {analysis.matched.length + analysis.missing.length} role keywords
            </span>
          </div>
        </article>
      </div>

      {/* Status message */}
      <div className={styles.statusWrap}>
        <p className={styles.status}>
          {ats.score >= 60 && analysis.score >= 60
            ? 'Good fit — a few refinements will strengthen your profile.'
            : ats.score >= 40 || analysis.score >= 40
              ? 'Decent fit, but some important role signals are still missing.'
              : 'Significant gaps — prioritize the ATS issues below before applying.'}
        </p>
      </div>
    </section>
  );
};

function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
