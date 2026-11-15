/**
 * Data models for the AI Job Board & Resume Optimization Studio.
 * Client-side mock data phase — no Supabase schema changes required.
 */

export type JobType = 'Full Time' | 'Part Time' | 'Contract' | 'Internship';
export type KeywordWeight = 'must-have' | 'good-to-have';
export type KeywordCategory = 'skill' | 'tool' | 'concept';
export type MatchStatus = 'Missing' | 'Moderate' | 'Matched';
export type ReadinessLabel = 'Needs Work' | 'Okayish' | 'Strong' | 'ATS Ready';

export interface RequiredKeyword {
  keyword: string;
  weight: KeywordWeight;
  category: KeywordCategory;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  logoUrl?: string;
  type: JobType;
  experience: string;
  salary: string;
  location: string;
  postedAgo: string;
  summary: string[];
  requiredKeywords: RequiredKeyword[];
}

export interface ResumeEducation {
  institution: string;
  location: string;
  degree: string;
  period: string;
  score: string;
}

export interface ResumeProject {
  name: string;
  role: string;
  bullets: string[];
  updatedAt?: string;
}

export interface ResumeSkills {
  frameworks: string[];
  languages: string[];
  softSkills: string[];
  tools: string[];
}

export interface ResumePersonalInfo {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  linkedin: string;
}

export interface ResumeData {
  id: string;
  title: string;
  fileName: string;
  updatedAt: string;
  personalInfo: ResumePersonalInfo;
  education: ResumeEducation[];
  projects: ResumeProject[];
  skills: ResumeSkills;
  codingProfiles?: string[];
}

export interface MissingKeyword {
  keyword: string;
  status: MatchStatus;
  reason: string;
  recommendedSection: 'skills' | 'projects';
}

export interface ATSAnalysis {
  overallScore: number; // 0 - 100
  readinessLabel: ReadinessLabel;
  readinessBars: number; // 1 to 10
  missingKeywords: MissingKeyword[];
}
