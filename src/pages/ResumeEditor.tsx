/**
 * ResumeEditor — full-page Editor Mode for the Resume Optimization Studio.
 *
 * Hosts the split-screen resume editor (structured forms on the left, live
 * A4-style preview on the right) as a dedicated route below the App Shell.
 *
 * Edits live in React state and are serialised to localStorage on save so they
 * survive navigation back to the Optimise analysis page. The Supabase schema is
 * untouched.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useResumes } from '../lib/resume/useResumes';
import { computeATSReadiness } from '../lib/resume/atsLogic';
import { parseRawTextToStructured, serializeStructuredResume } from '../lib/resume/parseResume';
import { exportResumePdf } from '../lib/resume/pdfExport';
import { fetchResumeFile } from '../lib/resume/fetchResumeFile';
import { updateResumeContent } from '../lib/resumes';
import { extractResumeText } from '../lib/extractResumeText';
import type { ResumeData } from '../lib/resume/resumeModel';
import type { StructuredResume, ResumeExperience, ResumeProject, ResumeEducation } from '../types/resume';
import { ResumeEditorLayout } from '../components/resume/ResumeEditorLayout';
import { useMediaQuery } from '../components/ui/useMediaQuery';
import { useToast } from '../components/ui';
import styles from './ResumeEditor.module.css';

type PreviewMode = 'original' | 'optimised';

export const ResumeEditor: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { show: showToast } = useToast();

  const { readyResumes } = useResumes();
  const selectedResume = readyResumes.find((r) => r.id === resumeId);

  // Read the source text persisted by OptimiseModal when the user clicked
  // "Fix →" or "Edit in Editor Mode".
  const [sourceText, setSourceText] = useState<string>('');
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);

  // Editor state — the structured resume being edited.
  const [editorData, setEditorData] = useState<StructuredResume | null>(null);

  // Preview mode: 'original' shows the uploaded file exactly; 'optimised' shows
  // the structured editor output as typeset text.
  const [previewMode, setPreviewMode] = useState<PreviewMode>('original');

  /**
   * Re-run extraction + structured parsing from the stored file — e.g. for
   * resumes stored with flattened text before the geometry-aware fix. Updates
   * only the extracted text + parsed data of that resume row.
   */
  const handleReRead = useCallback(async () => {
    if (!selectedResume) return;
    try {
      const buffer = await fetchResumeFile(selectedResume.file_path);
      const file = new File([buffer], selectedResume.file_name, {
        type: selectedResume.mime_type ?? 'application/pdf',
      });
      const text = await extractResumeText(file);
      const parsed = parseRawTextToStructured(text);
      setSourceText(text);
      setEditorData(parsed);
      const updated = await updateResumeContent(selectedResume.user_id, selectedResume.id, text, parsed);
      if (updated !== 1) {
        // Row count check — local state is already refreshed from the fresh parse.
      }
      const sectionCount =
        parsed.experience.length +
        parsed.projects.length +
        parsed.education.length +
        (parsed.skills.length > 0 ? 1 : 0) +
        (parsed.certifications.length > 0 ? 1 : 0) +
        (parsed.summary.length > 0 ? 1 : 0);
      showToast({
        title: 'Resume re-read',
        description: `${sectionCount} section(s) found`,
        variant: 'success',
      });
    } catch {
      showToast({
        title: 'Re-read failed',
        description: 'Unable to re-extract this resume.',
        variant: 'danger',
      });
    }
  }, [selectedResume, showToast]);

  useEffect(() => {
    if (!selectedResume || editorData) return;
    try {
      const stored = localStorage.getItem(`almanet_editor_source_${selectedResume.id}`);
      if (stored) {
        setSourceText(stored);
        localStorage.removeItem(`almanet_editor_source_${selectedResume.id}`);
      }
      const issueId = localStorage.getItem(`almanet_editor_issue_${selectedResume.id}`);
      if (issueId) {
        setActiveIssueId(issueId);
        localStorage.removeItem(`almanet_editor_issue_${selectedResume.id}`);
      }
    } catch {
      // localStorage unavailable — ignore.
    }
    const parsed = parseRawTextToStructured(selectedResume.extracted_text ?? '');
    setEditorData(parsed);

    // Auto re-extract when the stored text was produced by the old extractor
    // (no extractor version marker in parsed).
    const parsedRow = selectedResume as unknown as { parsed?: { extractor?: number } };
    if (!parsedRow.parsed?.extractor) {
      void handleReRead();
    }
  }, [selectedResume, editorData, handleReRead]);

  // ATS issues for the current (unedited) source text — used to surface
  // warnings in the left panel's ATS Issues box.
  const atsReadiness = useMemo(() => {
    if (!sourceText) return null;
    return computeATSReadiness(sourceText);
  }, [sourceText]);

  const handleEditorChange = useCallback((next: StructuredResume) => {
    setEditorData(next);
  }, []);

  const handleEditorSave = useCallback(() => {
    if (!editorData || !selectedResume || !jobId) return;
    const serialized = serializeStructuredResume(editorData);
    try {
      localStorage.setItem(`almanet_editor_edited_${selectedResume.id}`, serialized);
    } catch {
      // localStorage unavailable — ignore.
    }
    navigate(`/jobs/${jobId}/optimise`);
  }, [editorData, selectedResume, jobId, navigate]);

  const handleEditorExport = useCallback(() => {
    if (!editorData) return;
    const resumeData: ResumeData = {
      name: editorData.personalInfo.name,
      headline: '',
      contact: editorData.personalInfo.links,
      summary: editorData.summary,
      experience: editorData.experience.map((e: ResumeExperience) => ({
        id: e.id,
        title: e.title,
        company: e.company,
        location: '',
        employmentType: '',
        startDate: '',
        endDate: e.dates,
        techStack: [],
        bullets: e.bullets,
      })),
      projects: editorData.projects.map((p: ResumeProject) => ({
        id: p.id,
        title: p.title,
        techStack: p.tech ? [p.tech] : [],
        bullets: p.bullets,
      })),
      education: editorData.education.map((e: ResumeEducation) => ({
        id: e.id,
        school: e.institution,
        degree: e.degree,
        dates: e.dates,
        details: e.details ? [e.details] : [],
      })),
      skills: editorData.skills,
      certifications: editorData.certifications,
    };
    exportResumePdf(resumeData);
  }, [editorData]);

  const editorHasChanges = useMemo(() => {
    if (!editorData || !selectedResume) return false;
    const original = sourceText ? sourceText : selectedResume.extracted_text ?? '';
    return serializeStructuredResume(editorData).trim() !== original.trim();
  }, [editorData, selectedResume, sourceText]);

  const handleBack = useCallback(() => {
    if (!jobId) return;
    navigate(`/jobs/${jobId}/optimise`);
  }, [jobId, navigate]);

  if (!selectedResume || !editorData || !jobId) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <p>Loading editor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ResumeEditorLayout
        data={editorData}
        onChange={handleEditorChange}
        issues={atsReadiness?.issues ?? []}
        activeIssueId={activeIssueId}
        missingKeywords={[]}
        onIssueClick={setActiveIssueId}
        isMobile={isMobile}
        resumeName={selectedResume.file_name ?? 'Resume'}
        filePath={selectedResume.file_path}
        mimeType={selectedResume.mime_type}
        hasChanges={editorHasChanges}
        onBack={handleBack}
        onClose={handleBack}
        onSave={handleEditorSave}
        onExportPdf={handleEditorExport}
        parseConfidence={editorData.parseConfidence}
        parseWarnings={editorData.warnings}
        unclassified={editorData.unclassified}
        onReRead={handleReRead}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
      />
    </div>
  );
};

export default ResumeEditor;
