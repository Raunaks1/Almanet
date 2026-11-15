/**
 * Structured resume data model for the Editor Mode live split-screen editor.
 *
 * This is a flat, editor-friendly representation parsed from the raw
 * `extracted_text` string stored in Supabase. It lives entirely in client
 * state — the Supabase schema is untouched.
 */

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  links: string[];
  headline: string;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  dates: string;
  details: string;
}

export interface ResumeExperience {
  id: string;
  title: string;
  company: string;
  /** Optional location (e.g. "Pune, India") shown under the company. */
  location?: string;
  dates: string;
  bullets: string[];
}

export interface ResumeProject {
  id: string;
  title: string;
  tech: string;
  dates: string;
  bullets: string[];
}

export interface StructuredResume {
  personalInfo: PersonalInfo;
  summary: string;
  education: ResumeEducation[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skills: string[];
  certifications: string[];
  unclassified: string[];
  parseConfidence: 'high' | 'medium' | 'low';
  warnings: string[];
  /** Extractor version marker — 2 means geometry-aware line reconstruction was used. */
  extractor?: number;
}

export function emptyStructuredResume(): StructuredResume {
  return {
    personalInfo: { name: '', email: '', phone: '', links: [], headline: '' },
    summary: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    unclassified: [],
    parseConfidence: 'high',
    warnings: [],
  };
}
