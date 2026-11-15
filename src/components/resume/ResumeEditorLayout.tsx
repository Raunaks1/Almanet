/**
 * ResumeEditorLayout — split-screen Editor Mode for the Optimise modal.
 *
 * Left pane: ATS Issues box + section accordions (forms). Right pane: live
 * typeset A4 preview. On mobile the two panes collapse behind an Editor /
 * Preview segmented toggle.
 *
 * Uses StructuredResume throughout. No AI calls — manual editing only.
 */

import React, { useState } from 'react';
import { ArrowLeft, Download, X } from 'lucide-react';
import type { StructuredResume } from '../../types/resume';
import type { ATSIssue } from '../../lib/resume/atsLogic';
import { Button, SegmentedControl } from '../ui';
import { cx } from '../ui/internal';
import { ResumeEditorSidebar } from './ResumeEditorSidebar';
import { ResumePreview } from './ResumePreview';
import { ResumeOriginalPreview } from './ResumeOriginalPreview';
import styles from './ResumeEditorLayout.module.css';

type PreviewMode = 'original' | 'optimised';

interface ResumeEditorLayoutProps {
  data: StructuredResume;
  onChange: (next: StructuredResume) => void;
  issues: ATSIssue[];
  activeIssueId: string | null;
  missingKeywords: string[];
  onIssueClick: (issueId: string) => void;
  isMobile: boolean;
  resumeName: string;
  filePath: string;
  mimeType: string | null;
  hasChanges: boolean;
  onBack: () => void;
  onClose: () => void;
  onSave: () => void;
  onExportPdf: () => void;
  /** Parse confidence from the structured parser. */
  parseConfidence?: 'high' | 'medium' | 'low';
  /** Parser warnings to display in the ATS issues box. */
  parseWarnings?: string[];
  /** Unclassified lines the parser couldn't place. */
  unclassified?: string[];
  /** Re-run extraction and parsing from the stored file. */
  onReRead?: () => void;
  /** Current preview mode: 'original' shows the uploaded file; 'optimised' shows structured text. */
  previewMode?: PreviewMode;
  /** Change the preview mode. */
  setPreviewMode?: (mode: PreviewMode) => void;
}

type MobileView = 'editor' | 'preview';

export const ResumeEditorLayout: React.FC<ResumeEditorLayoutProps> = ({
  data,
  onChange,
  issues,
  activeIssueId,
  missingKeywords,
  onIssueClick,
  isMobile,
  resumeName,
  filePath,
  mimeType,
  hasChanges,
  onBack,
  onClose,
  onSave,
  onExportPdf,
  parseConfidence,
  parseWarnings,
  unclassified,
  onReRead,
  previewMode = 'original',
  setPreviewMode,
}) => {
  const [mobileView, setMobileView] = useState<MobileView>('editor');

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          iconLeft={<ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />}
          onClick={onBack}
        >
          Back
        </Button>
        <div className={styles.headerCenter}>
          <h1 id="optimise-modal-title" className={styles.title}>
            Editor Mode
          </h1>
          <p className={styles.subtitle}>{resumeName}</p>
        </div>
        <div className={styles.headerActions}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconLeft={<Download size={14} strokeWidth={1.75} aria-hidden="true" />}
            onClick={onExportPdf}
          >
            Export optimised PDF
          </Button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── Mobile Editor / Preview toggle ── */}
      {isMobile && (
        <div className={styles.mobileBar}>
          <SegmentedControl
            options={[
              { value: 'editor', label: 'Editor' },
              { value: 'preview', label: 'Preview' },
            ]}
            value={mobileView}
            onChange={(value) => setMobileView(value as MobileView)}
            aria-label="Editor or preview view"
          />
        </div>
      )}

      {/* ── Split body ── */}
      <div className={cx(styles.body, isMobile && styles.bodyMobile)}>
        <div
          className={cx(
            styles.editorPane,
            isMobile && mobileView !== 'editor' && styles.paneHidden,
          )}
        >
          <ResumeEditorSidebar
            data={data}
            onChange={onChange}
            issues={issues}
            activeIssueId={activeIssueId}
            missingKeywords={missingKeywords}
            onIssueClick={onIssueClick}
            parseConfidence={parseConfidence}
            parseWarnings={parseWarnings}
            unclassified={unclassified}
            onReRead={onReRead}
          />
        </div>
        <div
          className={cx(
            styles.previewPane,
            isMobile && mobileView !== 'preview' && styles.paneHidden,
          )}
        >
          {/* ── Original / Optimised preview toggle ── */}
          <div className={styles.previewModeBar}>
            <SegmentedControl
              options={[
                { value: 'original', label: 'Original' },
                { value: 'optimised', label: 'Optimised' },
              ]}
              value={previewMode}
              onChange={(v) => {
                setPreviewMode?.(v as PreviewMode);
              }}
              aria-label="Resume preview mode"
            />
          </div>
          <p className={styles.previewHint}>
            Original is your upload exactly as it is. Optimised updates as you edit; this is the
            version you export.
          </p>
          <div className={styles.previewContent}>
            {previewMode === 'original' ? (
              <ResumeOriginalPreview
                filePath={filePath}
                fileName={resumeName}
                mimeType={mimeType}
              />
            ) : (
              <ResumePreview data={data} />
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <footer className={styles.footer}>
        <span className={cx(styles.footerHint, hasChanges && styles.footerHintDirty)}>
          {hasChanges ? 'Unsaved changes' : 'Editing — changes appear in the preview instantly'}
        </span>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!hasChanges}
          onClick={onSave}
        >
          Save changes
        </Button>
      </footer>
    </div>
  );
};
