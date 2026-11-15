/**
 * Optimise modal — opens from a job's Optimise button.
 *
 * Steps:
 *   - choose-resume: pick an uploaded resume to score against the job
 *   - analysis: rule-based analysis with tabs (Job Keywords | ATS Issues | Job Description)
 *
 * Bottom sheet on mobile, centered scale-in on desktop. Editor Mode is now a
 * full-page route at /jobs/:jobId/editor; clicking "Fix →" or "Edit in Editor
 * Mode" navigates there instead of nesting a view inside this modal.
 * No AI calls.
 *
 * Accessibility: each resume row is a <label> wrapping a visually hidden
 * native <input type="radio"> plus a CSS-drawn custom indicator. Arrow keys
 * move focus between rows; Space selects. Continue always gives feedback:
 * loading state, inline error with Retry, or a switch to the analysis step.
 * Never fails silently.
 *
 * The modal is fully self-contained: it never touches the global active resume,
 * never triggers parent re-renders, and stays open until the user explicitly
 * closes it (Close button, Escape, or backdrop click).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { fadeIn, slideInFromBottom, DURATION } from '../../lib/motion';
import { analyzeResume, type AnalysisJob, type ResumeAnalysis } from '../../lib/resume/analyzeResume';
import { computeATSReadiness, type ATSReadinessResult } from '../../lib/resume/atsLogic';
import { useResumes } from '../../lib/resume/useResumes';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui';
import { ErrorBoundary } from '../ui';
import { Skeleton } from '../ui';
import { ArrowLeft, FileText, X } from 'lucide-react';
import { useMediaQuery } from '../ui/useMediaQuery';
import { ResumeFileViewer } from './ResumeFileViewer';
import { ResumeHighlight } from './ResumeHighlight';
import { Tabs, TabPanel } from '../ui';
import styles from './OptimiseModal.module.css';
import { cx } from '../ui/internal';

interface OptimiseModalProps {
  open: boolean;
  onClose: () => void;
  job: AnalysisJob;
  jobId?: string;
  /** Initial step when the modal opens ('choose-resume' | 'analysis'). */
  initialStep?: 'choose-resume' | 'analysis';
  /** Initial resume id to select when the modal opens. */
  initialResumeId?: string | null;
  onUpload?: () => void;
}

type Step = 'choose-resume' | 'analysis';
type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

/** Fallback analysis when a resume has no extractable text or analysis fails. */
const EMPTY_ANALYSIS: ResumeAnalysis = {
  score: 0,
  label: 'Poor Match',
  parts: [],
  matched: [],
  missing: [],
  weak: [],
  topFixes: ['This resume has no extractable text. Upload a readable PDF/DOCX to see a score.'],
  wordCount: 0,
  yearsDetected: 0,
  sections: [],
  noDescription: false,
};

/** Inline error card shown inside the modal content area. */
function AnalysisErrorCard({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.lead}>{message}</p>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onRetry} fullWidth>
          Retry
        </Button>
        <Button type="button" variant="plain" onClick={onBack} fullWidth>
          Back
        </Button>
      </div>
    </div>
  );
}

export const OptimiseModal: React.FC<OptimiseModalProps> = ({
  open,
  onClose,
  job,
  jobId,
  initialStep = 'choose-resume',
  initialResumeId = null,
  onUpload,
}) => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const reduced = useReducedMotion();
  const { readyResumes, loading: resumesLoading } = useResumes();

  const [step, setStep] = useState<Step>(initialStep);
  const [selectedId, setSelectedId] = useState<string | null>(initialResumeId);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisTab, setAnalysisTab] = useState<'original' | 'highlights'>('original');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const triggerRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // ── Initialize selection when modal opens ──
  // NOTE: does NOT read or set the global activeResume — that would cause the
  // parent (Jobs page) to re-render and could unmount/reset this modal.
  useEffect(() => {
    if (!open) {
      initialized.current = false;
      setStep('choose-resume');
      setAnalysisStatus('idle');
      setAnalysisError(null);
      setFocusedIndex(null);
      setSelectedId(null);
      return;
    }
    if (!initialized.current) {
      initialized.current = true;
      triggerRef.current = document.activeElement as HTMLElement | null;
      setStep(initialStep);
      setAnalysisStatus('idle');
      setAnalysisError(null);
      const defaultId = initialResumeId ?? readyResumes[0]?.id ?? null;
      setSelectedId(defaultId);
      setFocusedIndex(defaultId ? readyResumes.findIndex((r) => r.id === defaultId) : 0);
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {
        const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      // Arrow key navigation in choose-resume step
      if (step === 'choose-resume' && readyResumes.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (focusedIndex ?? -1) + 1;
          if (next < readyResumes.length) setFocusedIndex(next);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const next = (focusedIndex ?? readyResumes.length) - 1;
          if (next >= 0) setFocusedIndex(next);
        }
        if ((e.key === ' ' || e.key === 'Enter') && focusedIndex != null) {
          e.preventDefault();
          const id = readyResumes[focusedIndex]?.id;
          if (id) {
            setSelectedId(id);
            setFocusedIndex(readyResumes.findIndex((r) => r.id === id));
          }
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, initialStep, initialResumeId, readyResumes, step, focusedIndex]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!open && triggerRef.current && document.body.contains(triggerRef.current)) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  // Hydrate persisted editor edits from localStorage
  useEffect(() => {
    if (!open || !selectedId) return;
    try {
      const stored = localStorage.getItem(`almanet_editor_edited_${selectedId}`);
      if (stored) {
        setEditedTexts((prev) => ({ ...prev, [selectedId]: stored }));
        localStorage.removeItem(`almanet_editor_edited_${selectedId}`);
      }
    } catch {}
  }, [open, selectedId]);

  // Validate selectedId is still in the list; fall back to first ready resume
  const validSelectedId = useMemo(() => {
    if (!selectedId) return null;
    if (readyResumes.some((r) => r.id === selectedId)) return selectedId;
    return readyResumes[0]?.id ?? null;
  }, [selectedId, readyResumes]);

  // Sync state when the validated id changes (e.g. list changed underneath)
  useEffect(() => {
    if (open && validSelectedId !== selectedId) {
      setSelectedId(validSelectedId);
      setFocusedIndex(validSelectedId ? readyResumes.findIndex((r) => r.id === validSelectedId) : 0);
    }
  }, [open, validSelectedId, selectedId, readyResumes]);

  const selectedResume = readyResumes.find((r) => r.id === validSelectedId);
  const canContinue = !!selectedResume && readyResumes.length > 0;

  const effectiveText = selectedResume
    ? editedTexts[selectedResume.id] ?? selectedResume.extracted_text ?? ''
    : '';

  // Pre-compute analysis for every ready resume against this job (cached, never throws).
  // `job` is the snapshotted job from the parent — it does not change while the
  // modal is open, so re-renders of the parent cannot re-run or reset the analysis.
  const analyses = useMemo(() => {
    const map = new Map<string, ResumeAnalysis>();
    for (const r of readyResumes) {
      try {
        map.set(r.id, analyzeResume(editedTexts[r.id] ?? r.extracted_text ?? '', job));
      } catch {
        map.set(r.id, EMPTY_ANALYSIS);
      }
    }
    return map;
  }, [job, readyResumes, editedTexts]);

  const analysis = validSelectedId ? analyses.get(validSelectedId) ?? EMPTY_ANALYSIS : null;

  const atsReadiness: ATSReadinessResult | null = React.useMemo(() => {
    if (!effectiveText) return null;
    return computeATSReadiness(effectiveText);
  }, [effectiveText]);

  const goBackToChoose = useCallback(() => {
    setStep('choose-resume');
    setAnalysisStatus('idle');
    setAnalysisError(null);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      setFocusedIndex(readyResumes.findIndex((r) => r.id === id));
    },
    [readyResumes],
  );

  /** Single entry point for switching to the analysis step. Always gives feedback. */
  const goToAnalysis = useCallback((resumeId: string) => {
    const resume = readyResumes.find((r) => r.id === resumeId);
    if (!resume) {
      setAnalysisError('Resume not found.');
      setAnalysisStatus('error');
      setStep('choose-resume');
      return;
    }

    const text = editedTexts[resume.id] ?? resume.extracted_text ?? '';
    if (!text) {
      setAnalysisError('This resume has no extractable text. Please choose another resume.');
      setAnalysisStatus('error');
      setStep('choose-resume');
      return;
    }

    // Verify analysis functions can run against this resume + job without throwing.
    try {
      analyzeResume(text, job);
      computeATSReadiness(text);
    } catch (err: any) {
      setAnalysisError(`We couldn’t analyse this resume. (${err?.name || 'Error'})`);
      setAnalysisStatus('error');
      setStep('choose-resume');
      console.error('Analysis failed:', err?.name, err?.message);
      return;
    }

    setSelectedId(resumeId);
    setAnalysisStatus('success');
    setAnalysisError(null);
    setStep('analysis');
  }, [readyResumes, job, editedTexts]);

  const handleRetry = useCallback(() => {
    if (!validSelectedId) {
      setAnalysisError('Please select a resume first.');
      setAnalysisStatus('error');
      setStep('choose-resume');
      return;
    }
    setAnalysisStatus('loading');
    setAnalysisError(null);
    goToAnalysis(validSelectedId);
  }, [validSelectedId, goToAnalysis]);

  const statusAnnouncement = React.useMemo(() => {
    if (analysisStatus === 'loading') return 'Analyzing resume…';
    if (analysisStatus === 'error') return analysisError || 'Analysis failed.';
    return analysis ? `Analysis ready. Match score ${analysis.score}%, ${analysis.label}.` : '';
  }, [analysisStatus, analysisError, analysis]);

  // Stop clicks inside the modal from bubbling to the backdrop (which closes it).
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (resumesLoading) {
    return null; // modal not mounted until resumes load
  }

  // ── Step content (computed as a variable to avoid nested JSX ternaries) ──
  let stepContent: React.ReactNode = null;

  if (step === 'analysis') {
    if (analysisStatus === 'loading') {
      stepContent = (
        <>
          {isMobile && <div className={styles.dragHandle} aria-hidden="true" />}
          <div className={styles.sheetContent}>
            <div className={styles.emptyState}>
              <Skeleton width={120} height={120} radius="circle" />
              <p className={styles.lead}>Analyzing your resume…</p>
            </div>
          </div>
        </>
      );
    } else if (analysisStatus === 'error') {
      stepContent = (
        <>
          {isMobile && <div className={styles.dragHandle} aria-hidden="true" />}
          <div className={styles.sheetContent}>
            <AnalysisErrorCard
              message={analysisError || 'We couldn’t analyse this resume.'}
              onRetry={handleRetry}
              onBack={goBackToChoose}
            />
          </div>
        </>
      );
    } else if (selectedResume && analysis && atsReadiness) {
      stepContent = (
        <>
          {isMobile && <div className={styles.dragHandle} aria-hidden="true" />}
          <div className={styles.sheetContent}>
            <Tabs
              items={[
                { value: 'original', label: 'Original', icon: <FileText size={14} strokeWidth={1.75} aria-hidden="true" /> },
                { value: 'highlights', label: 'Keyword highlights', icon: <FileText size={14} strokeWidth={1.75} aria-hidden="true" /> },
              ]}
              value={analysisTab}
              onChange={(v) => setAnalysisTab(v as 'original' | 'highlights')}
              aria-label="Resume view"
            >
              <TabPanel value="original">
                <div className={styles.viewerWrap}>
                  <ResumeFileViewer
                    filePath={selectedResume.file_path}
                    fileName={selectedResume.file_name}
                    mimeType={selectedResume.mime_type}
                    onClose={goBackToChoose}
                  />
                </div>
              </TabPanel>
              <TabPanel value="highlights">
                <div className={styles.highlightsWrap}>
                  <ErrorBoundary fallback={
                    <AnalysisErrorCard
                      message="The resume preview could not be displayed."
                      onRetry={handleRetry}
                      onBack={goBackToChoose}
                    />
                  }>
                    <ResumeHighlight
                      text={effectiveText}
                      matched={analysis.matched}
                      weak={analysis.weak}
                    />
                  </ErrorBoundary>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </>
      );
    } else {
      stepContent = (
        <>
          {isMobile && <div className={styles.dragHandle} aria-hidden="true" />}
          <div className={styles.sheetContent}>
            <AnalysisErrorCard
              message="Unable to load analysis for the selected resume."
              onRetry={handleRetry}
              onBack={goBackToChoose}
            />
          </div>
        </>
      );
    }
  }

  return (
    <>
      <div
        className={cx(styles.overlay, !reduced && styles.overlayMotion)}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={containerRef}
        className={cx(styles.modal, isMobile && styles.modalMobile)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="optimise-modal-title"
        aria-describedby="optimise-modal-desc"
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'visible'}
        exit={reduced ? undefined : 'hidden'}
        variants={
          isMobile
            ? { ...slideInFromBottom('100%'), initial: { y: '100%', opacity: 0 } }
            : fadeIn(DURATION.reveal)
        }
        transition={reduced ? { duration: 0.15 } : undefined}
        onClick={stopPropagation}
      >
        {/* Drag handle for mobile bottom sheet */}
        {isMobile && <div className={styles.dragHandle} aria-hidden="true" />}

        {/* Sticky Header */}
        <header className={styles.sheetHeader}>
          {step === 'analysis' ? (
            <Button
              type="button"
              variant="secondary"
              iconLeft={<ArrowLeft size={14} strokeWidth={1.75} />}
              onClick={goBackToChoose}
            >
              Back
            </Button>
          ) : null}
          <div className={styles.headerCenter}>
            <h1 id="optimise-modal-title" className={styles.sheetTitle}>
              {step === 'choose-resume' ? 'Choose a resume' : 'Analysis'}
            </h1>
            {step === 'choose-resume' && (
              <p className={styles.sheetSub}>
                Score <strong>{job.title}</strong> at <strong>{job.company}</strong> against which resume?
              </p>
            )}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className={styles.sheetContent}>
          {/* ══ Step 1: choose-resume ══ */}
          {step === 'choose-resume' && (
            <div className={styles.step}>
              {readyResumes.length === 0 ? (
                <div className={styles.empty}>
                  <FileText size={24} strokeWidth={1.75} className={styles.emptyIcon} aria-hidden="true" />
                  <p className={styles.emptyTitle}>No uploaded resumes</p>
                  <p className={styles.emptyDesc}>
                    Upload a resume first, then come back to see your match for this job.
                  </p>
                  {onUpload ? (
                    <Button onClick={onUpload} variant="primary" fullWidth>
                      Upload a resume
                    </Button>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className={styles.list}>
                    {readyResumes.map((r) => {
                      const a = analyses.get(r.id);
                      const score = a?.score ?? null;
                      const label = a ? a.label : '—';
                      const isSelected = validSelectedId === r.id;
                      return (
                        <label
                          key={r.id}
                          className={cx(styles.resumeCard, isSelected && styles.resumeCardSelected)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(r.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelect(r.id);
                            }
                          }}
                          tabIndex={0}
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={r.file_name}
                        >
                          <input
                            type="radio"
                            name="resume"
                            checked={isSelected}
                            onChange={() => handleSelect(r.id)}
                            tabIndex={-1}
                          />
                          <span className={styles.radioIndicator} />
                          <div className={styles.resumeInfo}>
                            <div className={styles.resumeName}>{r.file_name}</div>
                            <div className={styles.resumeMeta}>
                              <span>{new Date(r.created_at).toLocaleDateString()}</span>
                              <span className={styles.metaDot}>·</span>
                              <span>{r.status === 'ready' ? 'Ready' : 'Needs attention'}</span>
                            </div>
                          </div>
                          <div className={styles.resumeScore}>
                            {score === null ? (
                              <span className={styles.scoreNone}>No text</span>
                            ) : (
                              <>
                                <span className={styles.scoreValue}>{score}%</span>
                                <span className={styles.scoreLabel}>{label}</span>
                              </>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <p className={styles.hint}>
                    Ready resumes are scored. <span className={styles.hintStrong}>Needs-attention</span> resumes can't be scored yet.
                  </p>
                </>
              )}
            </div>
          )}

          {/* ══ Step 2: analysis ══ */}
          {stepContent}
        </div>

        {/* Sticky Footer */}
        <footer className={styles.sheetFooter}>
          {step === 'choose-resume' ? (
            <>
              {onUpload && (
                <Button type="button" variant="secondary" onClick={() => { setStep('choose-resume'); onUpload?.(); }}>
                  Upload a new resume
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                fullWidth
                disabled={!canContinue}
                onClick={() => {
                  if (!validSelectedId) {
                    setAnalysisError('Please select a resume first.');
                    setAnalysisStatus('error');
                    setStep('choose-resume');
                    return;
                  }
                  goToAnalysis(validSelectedId);
                }}
              >
                {analysisStatus === 'loading' ? 'Analyzing…' : 'Continue'}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!selectedResume}
                onClick={() => {
                  if (!selectedResume || !jobId) return;
                  const sourceText = editedTexts[selectedResume.id] ?? selectedResume.extracted_text ?? '';
                  try {
                    localStorage.setItem(`almanet_editor_source_${selectedResume.id}`, sourceText);
                  } catch {}
                  navigate(`/jobs/${jobId}/editor?resumeId=${selectedResume.id}`);
                }}
              >
                Edit in Editor Mode
              </Button>
            </>
          )}
        </footer>
      </motion.div>

      <div className={styles.srOnly} aria-live="polite">{statusAnnouncement}</div>
    </>
  );
};
