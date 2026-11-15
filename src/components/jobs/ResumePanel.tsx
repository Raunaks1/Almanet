import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMediaQuery } from '../ui/useMediaQuery';
import { supabase } from '../../lib/supabase';
import { extractResumeText } from '../../lib/extractResumeText';
import { fetchResumeFile } from '../../lib/resume/fetchResumeFile';
import { updateResumeContent } from '../../lib/resumes';
import { parseRawTextToStructured } from '../../lib/resume/parseResume';
import {
  Button,
  Modal,
  Badge,
  EmptyState,
  Skeleton,
  Checkbox,
  Input,
  Tabs,
  TabPanel,
  useToast,
} from '../ui';
import {
  FileText,
  ExternalLink,
  Trash2,
  Edit2,
  X,
  Loader2,
  AlertCircle,
  Eye,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { listStagger, EASE_REVEAL, MAX_STAGGER_ITEMS } from '../../lib/motion';
import { ResumeFileViewer } from '../resume/ResumeFileViewer';
import styles from './ResumePanel.module.css';
import { cx } from '../ui/internal';

interface ResumeRow {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: string;
  parsed: any;
  extracted_text: string | null;
  created_at: string;
}

const MAX_RESUMES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTS = ['.pdf', '.docx'];
const MIN_TEXT_CHARS = 200;

const CONSENT_TEXT =
  'I agree that Almanet may store this resume privately and analyse it to help me. Only I can see it.';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getExt(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  if (idx < 0) return '';
  return fileName.slice(idx).toLowerCase();
}

function statusLabel(status: string): string {
  return status === 'ready' ? 'Ready' : 'Needs attention';
}

function statusVariant(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  return status === 'ready' ? 'success' : 'warning';
}

export const ResumePanel: React.FC<{
  open: boolean;
  onClose: () => void;
  user: { id: string } | null;
  profile: { resume_ai_consent_at: string | null } | null;
}> = ({ open, onClose, user, profile }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const reduced = useReducedMotion() ?? false;
  const toast = useToast();

  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'reading' | 'saved' | null>(
    null,
  );
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingResume, setViewingResume] = useState<ResumeRow | null>(null);
  const [viewTab, setViewTab] = useState('resume');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stagger = listStagger();

  const loadResumes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setListError(null);
    try {
      const { data, error: err } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setResumes((data as ResumeRow[]) || []);
    } catch (err: any) {
      const msg = err.message || 'Failed to load resumes';
      setListError(msg);
      toast.show({ title: 'Unable to load resumes', description: msg, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!open) {
      setResumes([]);
      setLoading(true);
      setListError(null);
      setEditingId(null);
      setDeleteId(null);
      setConsentChecked(false);
      setUploadStep(null);
      return;
    }
    loadResumes();
    if (user && profile && !profile.resume_ai_consent_at) {
      setConsentModalOpen(true);
    }
  }, [open, user, profile, loadResumes]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const giveConsent = async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .update({ resume_ai_consent_at: new Date().toISOString() })
        .eq('id', user.id)
        .select();

      if (err) throw err;
      if (!data || data.length === 0) {
        throw new Error('Consent could not be saved. Please try again.');
      }

      setConsentModalOpen(false);
      setConsentChecked(false);
      toast.show({
        title: 'Consent saved',
        description: 'You can now upload your resume.',
        variant: 'success',
      });
    } catch (err: any) {
      const msg = err.message || 'Failed to save consent';
      toast.show({ title: 'Consent failed', description: msg, variant: 'danger' });
    }
  };

  const validateFile = (file: File): string | null => {
    const ext = getExt(file.name);
    if (!ALLOWED_EXTS.includes(ext)) {
      return 'Only .pdf and .docx files are accepted.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File must be 5 MB or smaller.';
    }
    if (file.size === 0) {
      return 'File is empty.';
    }
    return null;
  };

  const readFileHeader = async (file: File): Promise<string> => {
    const slice = file.slice(0, 4);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return String.fromCharCode(...bytes);
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (!user) return;

      if (resumes.length >= MAX_RESUMES) {
        toast.show({
          title: 'Resume limit reached',
          description: `You can store up to ${MAX_RESUMES} resumes. Delete one to upload another.`,
          variant: 'warning',
        });
        return;
      }

      const err = validateFile(file);
      if (err) {
        toast.show({ title: 'Invalid file', description: err, variant: 'danger' });
        return;
      }

      // Real file-type check via magic bytes.
      const header = await readFileHeader(file);
      const ext = getExt(file.name);
      if (ext === '.pdf' && !header.startsWith('%PDF')) {
        toast.show({
          title: 'Invalid file',
          description: 'The file does not look like a PDF.',
          variant: 'danger',
        });
        return;
      }
      if (ext === '.docx' && !header.startsWith('PK')) {
        toast.show({
          title: 'Invalid file',
          description: 'The file does not look like a Word document.',
          variant: 'danger',
        });
        return;
      }

      if (profile && !profile.resume_ai_consent_at) {
        setConsentModalOpen(true);
        return;
      }

      const path = `${user.id}/${crypto.randomUUID()}${ext}`;
      const displayName = file.name.trim().slice(0, 200);

      setUploadStep('uploading');
      setListError(null);

      try {
        const { error: uploadErr } = await supabase.storage
          .from('resumes')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (uploadErr) throw uploadErr;

        setUploadStep('reading');

        // Extract text in the browser.
        const extracted = await extractResumeText(file);
        const status = extracted.length >= MIN_TEXT_CHARS ? 'ready' : 'needs_attention';

        const { data, error: insertErr } = await supabase
          .from('resumes')
          .insert([
            {
              user_id: user.id,
              file_name: displayName || 'My resume',
              file_path: path,
              mime_type: file.type || null,
              size_bytes: file.size,
              status,
              parsed: null,
              extracted_text: extracted || null,
              created_at: new Date().toISOString(),
            },
          ])
          .select();

        if (insertErr) throw insertErr;
        if (!data || data.length === 0) {
          await supabase.storage.from('resumes').remove([path]);
          throw new Error('Resume record was not created. Please try again.');
        }

        setUploadStep('saved');

        const newResume = data[0] as ResumeRow;
        setResumes((prev) => [newResume, ...prev]);
        toast.show({ title: 'Resume uploaded', description: displayName, variant: 'success' });

        if (fileInputRef.current) fileInputRef.current.value = '';

        // Reset the step after a brief moment so the user sees "Saved".
        setTimeout(() => setUploadStep(null), 1200);
      } catch (err: any) {
        const msg = err.message || 'Upload failed';
        setListError(msg);
        toast.show({ title: 'Upload failed', description: msg, variant: 'danger' });
        try {
          await supabase.storage.from('resumes').remove([path]);
        } catch {
          // Ignore cleanup failures.
        }
      } finally {
        setUploadStep(null);
      }
    },
    [user, profile, resumes.length, toast],
  );

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleOpen = async (resume: ResumeRow) => {
    try {
      const { data, error: err } = await supabase.storage
        .from('resumes')
        .createSignedUrl(resume.file_path, 60);
      if (err) throw err;
      if (!data?.signedUrl) throw new Error('Unable to open file.');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      const msg = err.message || 'Open failed';
      toast.show({ title: 'Open failed', description: msg, variant: 'danger' });
    }
  };

  /**
   * Re-run extraction + structured parsing from the stored file and update
   * only the extracted text + parsed data of this resume row (legacy flat text).
   */
  const handleReRead = async (resume: ResumeRow) => {
    try {
      const buffer = await fetchResumeFile(resume.file_path);
      const file = new File([buffer], resume.file_name, { type: resume.mime_type ?? 'application/pdf' });
      const text = await extractResumeText(file);
      const parsed = parseRawTextToStructured(text);
      const updated = await updateResumeContent(user!.id, resume.id, text, parsed);
      if (updated !== 1) {
        // Row count check — local state is refreshed from the fresh parse regardless.
      }
      setResumes((prev) =>
        prev.map((r) => (r.id === resume.id ? { ...r, extracted_text: text, parsed } : r)),
      );
      toast.show({ title: 'Resume re-read', description: 'We re-parsed your resume.', variant: 'success' });
    } catch (err: any) {
      const msg = err.message || 'Re-read failed';
      toast.show({ title: 'Re-read failed', description: msg, variant: 'danger' });
    }
  };

  const startEdit = (resume: ResumeRow) => {
    setEditingId(resume.id);
    setEditTitle(resume.file_name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveEdit = async (resume: ResumeRow) => {
    const title = editTitle.trim().slice(0, 200);
    if (!title || title === resume.file_name) {
      cancelEdit();
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from('resumes')
        .update({ file_name: title })
        .eq('id', resume.id)
        .eq('user_id', user!.id)
        .select();

      if (err) throw err;
      if (!data || data.length === 0) {
        throw new Error('Rename did not apply. Please try again.');
      }

      setResumes((prev) =>
        prev.map((r) => (r.id === resume.id ? { ...r, file_name: title } : r)),
      );
      cancelEdit();
      toast.show({ title: 'Renamed', description: title, variant: 'success' });
    } catch (err: any) {
      const msg = err.message || 'Rename failed';
      toast.show({ title: 'Rename failed', description: msg, variant: 'danger' });
    }
  };

  const startDelete = (id: string) => {
    setDeleteId(id);
  };

  const cancelDelete = () => {
    setDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId || !user) return;
    const resume = resumes.find((r) => r.id === deleteId);
    if (!resume) {
      cancelDelete();
      return;
    }

    try {
      const { error: storageErr } = await supabase.storage
        .from('resumes')
        .remove([resume.file_path]);

      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase
        .from('resumes')
        .delete()
        .eq('id', deleteId)
        .eq('user_id', user.id)
        .select();

      if (dbErr) throw dbErr;

      setResumes((prev) => prev.filter((r) => r.id !== deleteId));
      cancelDelete();
      toast.show({
        title: 'Deleted',
        description: resume.file_name,
        variant: 'success',
      });
    } catch (err: any) {
      const msg = err.message || 'Delete failed';
      toast.show({ title: 'Delete failed', description: msg, variant: 'danger' });
    }
  };

  const atLimit = resumes.length >= MAX_RESUMES;

  const consentContent = (
    <div className={styles.consentBody}>
      <p className={styles.consentText}>{CONSENT_TEXT}</p>
      <div className={styles.consentRow}>
        <Checkbox
          id="resume-consent"
          checked={consentChecked}
          onChange={() => setConsentChecked(!consentChecked)}
          required
          aria-required="true"
        />
        <label htmlFor="resume-consent" className={styles.consentLabel}>
          I agree.
        </label>
      </div>
    </div>
  );

  const stepLabel = () => {
    switch (uploadStep) {
      case 'uploading':
        return 'Uploading…';
      case 'reading':
        return 'Reading text…';
      case 'saved':
        return 'Saved.';
      default:
        return '';
    }
  };

  const uploadZone = (
    <section className={styles.uploadSection} aria-labelledby="upload-title">
      <h2 id="upload-title" className={styles.sectionTitle}>Upload resume</h2>
      <p className={styles.uploadHint}>
        Drag a PDF or DOCX here, or choose a file. Max 5 MB.
      </p>

      <div
        className={cx(styles.dropzone, dragActive && styles.dropzoneDrag)}
        role="button"
        tabIndex={0}
        aria-label="Drop a resume file here to upload"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleChooseFile();
          }
        }}
        onClick={handleChooseFile}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={handleDrop}
      >
        <FileText size={32} strokeWidth={1.75} className={styles.dropzoneIcon} aria-hidden="true" />
        <div className={styles.dropzoneLabel}>
          {atLimit ? (
            <span className={styles.dropzoneLimit}>
              Limit reached ({MAX_RESUMES} resumes). Delete one to upload another.
            </span>
          ) : (
            <>
              <span className={styles.dropzonePrimary}>Drop file here</span>
              <span className={styles.dropzoneSecondary}>or</span>
              <button
                type="button"
                className={cx(styles.dropzoneChoose, styles.buttonPlain)}
                onClick={(e) => { e.stopPropagation(); handleChooseFile(); }}
              >
                Choose file
              </button>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className={styles.hiddenInput}
          aria-hidden="true"
          onChange={handleFileInputChange}
        />
      </div>

      {uploadStep && (
        <div className={styles.uploadProgress}>
          <Loader2 size={20} strokeWidth={1.75} className={styles.spinner} aria-hidden="true" />
          <span className={styles.uploadingText}>{stepLabel()}</span>
        </div>
      )}
    </section>
  );

  const renderResumeRow = (resume: ResumeRow, animate: boolean) => {
    const content = (
      <>
        <div className={styles.rowIcon}>
          <FileText size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className={styles.rowBody}>
          {editingId === resume.id ? (
            <div className={styles.editWrap}>
              <Input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); saveEdit(resume); }
                  if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                }}
                onBlur={() => saveEdit(resume)}
                maxLength={200}
              />
            </div>
          ) : (
            <div className={styles.rowTitleWrap}>
              <span className={styles.rowTitle}>{resume.file_name}</span>
              <button
                type="button"
                className={styles.editBtn}
                aria-label={`Rename ${resume.file_name}`}
                onClick={(e) => { e.stopPropagation(); startEdit(resume); }}
              >
                <Edit2 size={14} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          )}
          <div className={styles.rowMeta}>
            <span className={styles.rowFileName}>{resume.file_name}</span>
            {resume.size_bytes && (
              <>
                <span className={styles.rowSizeDot}>·</span>
                <span className={styles.rowSize}>{formatBytes(resume.size_bytes)}</span>
              </>
            )}
            <span className={styles.rowSizeDot}>·</span>
            <span className={styles.rowDate}>
              {new Date(resume.created_at).toLocaleDateString()}
            </span>
          </div>
          <Badge
            variant={statusVariant(resume.status)}
            size="sm"
            className={styles.statusBadge}
          >
            {statusLabel(resume.status)}
          </Badge>
        </div>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`View ${resume.file_name}`}
            onClick={(e) => { e.stopPropagation(); setViewingResume(resume); }}
          >
            <Eye size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Re-read ${resume.file_name}`}
            title="Re-read my resume"
            onClick={() => handleReRead(resume)}
          >
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Open ${resume.file_name}`}
            onClick={() => handleOpen(resume)}
          >
            <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Delete ${resume.file_name}`}
            onClick={(e) => { e.stopPropagation(); startDelete(resume.id); }}
          >
            <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </>
    );

    if (!animate) {
      return (
        <div key={resume.id} className={styles.listRow}>
          {content}
        </div>
      );
    }

    return (
      <motion.div
        key={resume.id}
        className={styles.listRow}
        variants={stagger.child}
      >
        {content}
      </motion.div>
    );
  };

  const listContent = () => {
    if (loading) {
      return (
        <div className={styles.listSkeleton}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skelRow}>
              <Skeleton width={40} height={40} radius={10} />
              <div className={styles.skelTextCol}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="50%" height={14} />
                <Skeleton width="40%" height={12} />
              </div>
              <Skeleton width={96} height={34} radius={999} />
            </div>
          ))}
        </div>
      );
    }

    if (listError) {
      return (
        <div className={styles.errorState}>
          <AlertCircle size={24} strokeWidth={1.75} className={styles.errorIcon} aria-hidden="true" />
          <div className={styles.errorText}>
            <p className={styles.errorTitle}>Unable to load resumes</p>
            <p className={styles.errorDesc}>{listError}</p>
          </div>
          <Button onClick={loadResumes}>Try again</Button>
        </div>
      );
    }

    if (resumes.length === 0) {
      return (
        <EmptyState
          icon={<FileText size={28} strokeWidth={1.75} />}
          title="No resume yet"
          description="Upload one to get your score."
          action={
            <Button size="sm" onClick={handleChooseFile}>
              Upload resume
            </Button>
          }
          className={styles.emptyState}
        />
      );
    }

    const animate = resumes.length <= MAX_STAGGER_ITEMS;
    const items = animate ? resumes : resumes.slice(0, MAX_STAGGER_ITEMS);
    const rest = animate ? [] : resumes.slice(MAX_STAGGER_ITEMS);

    return (
      <motion.div
        className={styles.list}
        variants={reduced ? undefined : stagger.parent}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'visible'}
      >
        {items.map((resume) => renderResumeRow(resume, true))}
        {rest.map((resume) => renderResumeRow(resume, false))}
      </motion.div>
    );
  };

  return (
    <>
      <Modal
        open={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        title="Resume storage consent"
        maxWidth={520}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConsentModalOpen(false)}>
              Not now
            </Button>
            <Button onClick={giveConsent} disabled={!consentChecked}>
              Continue
            </Button>
          </>
        }
      >
        {consentContent}
      </Modal>

      <Modal
        open={deleteId !== null}
        onClose={cancelDelete}
        title="Delete resume"
        maxWidth={480}
        footer={
          <>
            <Button variant="secondary" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className={styles.deleteText}>
          This will remove the resume file and its record. This cannot be undone.
        </p>
      </Modal>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="resume-panel-overlay"
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                aria-hidden="true"
              />

              <motion.div
                key="resume-panel-content"
                initial={isMobile ? { y: '100%', opacity: 0 } : { x: 400, opacity: 0 }}
                animate={
                  isMobile
                    ? { y: 0, opacity: 1, transition: reduced ? { duration: 0.15 } : { duration: 0.25, ease: EASE_REVEAL } }
                    : { x: 0, opacity: 1, transition: reduced ? { duration: 0.15 } : { duration: 0.25, ease: EASE_REVEAL } }
                }
                exit={
                  isMobile
                    ? { y: '100%', opacity: 0, transition: { duration: 0.2, ease: EASE_REVEAL } }
                    : { x: 400, opacity: 0, transition: { duration: 0.2, ease: EASE_REVEAL } }
                }
                className={cx(styles.panel, isMobile && styles.panelMobile)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="resume-panel-title"
              >
                <header className={styles.panelHeader}>
                  <h2 id="resume-panel-title" className={styles.panelTitle}>
                    My resumes
                  </h2>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    aria-label="Close"
                    onClick={onClose}
                  >
                    <X size={20} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </header>

                <div className={styles.panelBody}>
                  {uploadZone}
                  <div className={styles.divider} aria-hidden="true" />
                  {viewingResume ? (
                    <section className={styles.listSection} aria-labelledby="resume-view-title">
                      <div className={styles.viewHeader}>
                        <button
                          type="button"
                          className={styles.backBtn}
                          onClick={() => setViewingResume(null)}
                          aria-label="Back to resume list"
                        >
                          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                          Back
                        </button>
                        <span className={styles.viewTitle}>{viewingResume.file_name}</span>
                      </div>
                      <Tabs
                        items={[
                          { value: 'resume', label: 'Resume', icon: <FileText size={14} strokeWidth={1.75} aria-hidden="true" /> },
                          { value: 'text', label: 'Text we read', icon: <FileText size={14} strokeWidth={1.75} aria-hidden="true" /> },
                        ]}
                        value={viewTab}
                        onChange={setViewTab}
                        aria-label="Resume view"
                      >
                        <TabPanel value="resume">
                          <div className={styles.viewerWrap}>
                            <ResumeFileViewer
                              filePath={viewingResume.file_path}
                              fileName={viewingResume.file_name}
                              mimeType={viewingResume.mime_type}
                              onClose={() => setViewingResume(null)}
                            />
                          </div>
                        </TabPanel>
                        <TabPanel value="text">
                          <div className={styles.textPanel}>
                            <h3 className={styles.textPanelTitle}>This is the text our scoring reads from your file.</h3>
                            {viewingResume.extracted_text ? (
                              <pre className={styles.textBody}>{viewingResume.extracted_text}</pre>
                            ) : (
                              <p className={styles.textEmpty}>Not analyzed yet.</p>
                            )}
                          </div>
                        </TabPanel>
                      </Tabs>
                    </section>
                  ) : (
                    <section className={styles.listSection} aria-labelledby="resume-list-title">
                      <h2 id="resume-list-title" className={styles.sectionTitle}>
                        Your resumes
                      </h2>
                      {listContent()}
                    </section>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
