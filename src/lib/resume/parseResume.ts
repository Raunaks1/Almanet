/**
 * Structured resume parser entry point.
 *
 * Converts raw `extracted_text` into the `StructuredResume` editor model.
 *
 * Delegates to the implementation in `structuredResumeParser.ts`. The
 * Supabase schema is untouched — `resumes.extracted_text` stays a single
 * text column, and the structured shape exists only in local component state.
 */

import type { StructuredResume } from '../../types/resume';
import { parseStructuredResume, serializeStructuredResume } from './structuredResumeParser';

/**
 * Parse raw resume text into a structured `StructuredResume` object.
 *
 * Uses heuristic section detection: splits the raw text by common resume
 * headers (EDUCATION, EXPERIENCE, PROJECTS, SKILLS, etc.) and maps the
 * content into typed fields suitable for the split-screen editor forms.
 */
export function parseRawTextToStructured(rawText: string): StructuredResume {
  return parseStructuredResume(rawText ?? '');
}

/** Serialise a `StructuredResume` back to plain text (ATS-friendly). */
export { serializeStructuredResume };
