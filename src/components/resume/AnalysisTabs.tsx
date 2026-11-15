/**
 * AnalysisTabs — horizontal tab navigation with three panels:
 * Job Keywords | ATS Issues | Job Description
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DURATION, EASE_REVEAL } from '../../lib/motion';
import { FileIcon, AlertCircle, FileText } from 'lucide-react';
import type { ResumeAnalysis } from '../../lib/resume/analyzeResume';
import type { ATSIssue } from '../../lib/resume/atsLogic';
import { ATSIssueCard } from './ATSIssueCard';
import styles from './AnalysisTabs.module.css';

interface AnalysisTabsProps {
  analysis: ResumeAnalysis;
  atsIssues: ATSIssue[];
  jobDescription: string;
  jobTitle: string;
  jobCompany: string;
  jobLocation: string;
  onFixIssue?: (issueId: string) => void;
  onMarkCompleted?: (issueId: string) => void;
  onMarkDeleted?: (issueId: string) => void;
}

type TabId = 'keywords' | 'issues' | 'description';
type FilterId = 'pending' | 'completed' | 'deleted';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  {
    id: 'keywords',
    label: 'Job Keywords',
    icon: <FileIcon size={14} strokeWidth={1.75} aria-hidden="true" />,
  },
  {
    id: 'issues',
    label: 'ATS Issues',
    icon: <AlertCircle size={14} strokeWidth={1.75} aria-hidden="true" />,
  },
  {
    id: 'description',
    label: 'Job Description',
    icon: <FileText size={14} strokeWidth={1.75} aria-hidden="true" />,
  },
];

const panelVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE_REVEAL } },
  exit: { opacity: 0, y: 8, transition: { duration: DURATION.normal, ease: EASE_REVEAL } },
};

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  analysis,
  atsIssues,
  jobDescription,
  jobTitle,
  jobCompany,
  jobLocation,
  onFixIssue,
  onMarkCompleted,
  onMarkDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('keywords');
  const [activeFilter, setActiveFilter] = useState<FilterId>('pending');

  const handleTabClick = useCallback((id: TabId) => {
    setActiveTab(id);
  }, []);

  const filteredIssues = useMemo(() => {
    if (activeFilter === 'pending') return atsIssues.filter((i) => !i.id.includes('completed') && !i.id.includes('deleted'));
    if (activeFilter === 'completed') return atsIssues.filter((i) => i.id.includes('completed'));
    return atsIssues.filter((i) => i.id.includes('deleted'));
  }, [atsIssues, activeFilter]);

  return (
    <div className={styles.root}>
      {/* Tab navigation */}
      <div className={styles.tabBar} role="tablist" aria-label="Analysis sections">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={cx(
                styles.tabBtn,
                isActive && styles.tabBtnActive,
              )}
              role="tab"
              aria-selected={isActive}
              id={`tab-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.icon}
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div className={styles.panels}>
        <AnimatePresence mode="wait">
          {activeTab === 'keywords' && (
            <motion.div
              key="keywords"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.panel}
              role="tabpanel"
              aria-labelledby="tab-keywords"
            >
              <div className={styles.keywordsPanel}>
                <h3 className={styles.panelTitle}>Matched keywords</h3>
                <div className={styles.chipRow}>
                  {analysis.matched.map((m) => (
                    <span
                      key={m.canonical}
                      className={cx(styles.chip, styles.chipMatched)}
                    >
                      {m.canonical}
                      {m.count > 1 && <span className={styles.chipCount}>{m.count}x</span>}
                      {m.inBullet && <span className={styles.chipNote}>in experience/projects</span>}
                    </span>
                  ))}
                  {analysis.matched.length === 0 && <span className={styles.emptyNote}>None found</span>}
                </div>

                <h3 className={styles.panelTitle} style={{ marginTop: 16 }}>
                  Missing keywords
                </h3>
                <div className={styles.chipRow}>
                  {analysis.missing.map((m) => (
                    <span
                      key={m.canonical}
                      className={cx(styles.chip, styles.chipMissing)}
                    >
                      {m.canonical}
                    </span>
                  ))}
                  {analysis.missing.length === 0 && <span className={styles.emptyNote}>None missing</span>}
                </div>

                <h3 className={styles.panelTitle} style={{ marginTop: 16 }}>
                  Weak phrases
                </h3>
                <div className={styles.weakList}>
                  {analysis.weak.map((w) => (
                    <div key={`${w.start}-${w.end}`} className={styles.weakItem}>
                      <span className={styles.weakText}>{w.text}</span>
                      <span className={styles.weakSuggestion}>{w.suggestion}</span>
                    </div>
                  ))}
                  {analysis.weak.length === 0 && (
                    <span className={styles.emptyNote}>None found</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'issues' && (
            <motion.div
              key="issues"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.panel}
              role="tabpanel"
              aria-labelledby="tab-issues"
            >
              <div className={styles.filterBar}>
                <button
                  type="button"
                  className={cx(
                    styles.filterBtn,
                    activeFilter === 'pending' && styles.filterBtnActive,
                  )}
                  onClick={() => setActiveFilter('pending')}
                >
                  Pending
                </button>
                <button
                  type="button"
                  className={cx(
                    styles.filterBtn,
                    activeFilter === 'completed' && styles.filterBtnActive,
                  )}
                  onClick={() => setActiveFilter('completed')}
                >
                  Completed
                </button>
                <button
                  type="button"
                  className={cx(
                    styles.filterBtn,
                    activeFilter === 'deleted' && styles.filterBtnActive,
                  )}
                  onClick={() => setActiveFilter('deleted')}
                >
                  Deleted
                </button>
              </div>
              <div className={styles.issuesList}>
                {filteredIssues.map((issue) => (
                  <ATSIssueCard
                    key={issue.id}
                    issue={issue}
                    onFix={() => onFixIssue?.(issue.id)}
                    onMarkCompleted={() => onMarkCompleted?.(issue.id)}
                    onMarkDeleted={() => onMarkDeleted?.(issue.id)}
                  />
                ))}
                {filteredIssues.length === 0 && (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon} aria-hidden="true">✓</span>
                    <p className={styles.emptyTitle}>No {activeFilter} issues</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'description' && (
            <motion.div
              key="description"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.panel}
              role="tabpanel"
              aria-labelledby="tab-description"
            >
              <div className={styles.descriptionPanel}>
                <div className={styles.jobHeader}>
                  <span className={styles.companyTag}>{jobCompany}</span>
                  <h2 className={styles.jobTitle}>{jobTitle}</h2>
                  {jobLocation && (
                    <span className={styles.locationTag}>{jobLocation}</span>
                  )}
                </div>
                <div className={styles.descriptionBody}>
                  {jobDescription.split('\n').map((para, i) => (
                    <p key={i} className={styles.descriptionPara}>{para}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
