/**
 * ATS Readiness logic — pure, deterministic, runs entirely in the browser.
 * Independent of analyzeResume.ts; focuses on resume *structure* rather than
 * keyword matching against a job description.
 *
 * Returns a 0-100 score plus a list of detected issues with reasons.
 */

import { detectSections, splitBullets, type SectionRange, type Bullet } from './textUtils';

export interface ATSIssue {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'structure' | 'content' | 'contact' | 'formatting';
  fixable: boolean;
  reason: string;
}

export interface ATSReadinessResult {
  score: number; // 0 - 100
  issues: ATSIssue[];
  sections: SectionRange[];
  bullets: Bullet[];
  wordCount: number;
  hasEmail: boolean;
  hasPhone: boolean;
}

/** Build the list of rule-based ATS issues from resume text. */
export function computeATSIssues(text: string): ATSIssue[] {
  const safeText = text == null ? '' : text;
  const issues: ATSIssue[] = [];
  const sections = detectSections(safeText);
  const sectionNames = sections.map((s) => s.name.toLowerCase());
  const bullets = splitBullets(safeText);
  const wordCount = safeText.split(/\s+/).filter((w) => w.length > 0).length;

  const hasExperience = sectionNames.some((n) => /experience|employment/.test(n));
  const hasEducation = sectionNames.some((n) => /education/.test(n));
  const hasSkills = sectionNames.some((n) => /skills/.test(n));
  const hasSummary = sectionNames.some((n) => /summary|objective|profile/.test(n));

  // ── Structure issues ──
  if (!hasExperience) {
    issues.push({
      id: 'ats-missing-experience',
      title: 'Missing Experience section',
      description: 'Your resume does not include an Experience or Employment section.',
      severity: 'error',
      category: 'structure',
      fixable: true,
      reason: 'ATS parsers look for an Experience section to evaluate work history. Add one with your roles and bullets.',
    });
  }
  if (!hasEducation) {
    issues.push({
      id: 'ats-missing-education',
      title: 'Missing Education section',
      description: 'No Education section was detected.',
      severity: 'warning',
      category: 'structure',
      fixable: true,
      reason: 'Add your degree, institution, and graduation dates so recruiters can verify your background.',
    });
  }
  if (!hasSkills) {
    issues.push({
      id: 'ats-missing-skills',
      title: 'Missing Skills section',
      description: 'No Skills section was detected.',
      severity: 'error',
      category: 'structure',
      fixable: true,
      reason: 'A Skills section helps ATS match your technologies against the job requirements.',
    });
  }
  if (!hasSummary) {
    issues.push({
      id: 'ats-missing-summary',
      title: 'Missing Summary/Objective',
      description: 'No professional summary or objective was found.',
      severity: 'info',
      category: 'content',
      fixable: true,
      reason: 'A short summary helps frame your experience for both ATS and human readers.',
    });
  }

  // ── Content issues ──
  if (wordCount > 0 && wordCount < 250) {
    issues.push({
      id: 'ats-too-short',
      title: 'Resume is too short',
      description: `Only ${wordCount} words detected. ATS-friendly resumes typically run 250–900 words.`,
      severity: 'warning',
      category: 'content',
      fixable: true,
      reason: 'Add more detail to your project and experience bullets so ATS parsers have enough signal.',
    });
  } else if (wordCount > 900) {
    issues.push({
      id: 'ats-too-long',
      title: 'Resume may be too long',
      description: `${wordCount} words detected. Consider trimming for readability.`,
      severity: 'info',
      category: 'content',
      fixable: false,
      reason: 'Very long resumes can dilute key signals. Focus on the most relevant experience.',
    });
  }

  const bulletsWithNoMetric = bullets.filter((b) => !b.hasNumber && b.wordCount > 8).length;
  if (bulletsWithNoMetric > 0) {
    issues.push({
      id: 'ats-no-metrics',
      title: 'Bullets lack measurable results',
      description: `${bulletsWithNoMetric} bullet(s) have no number or measurable outcome.`,
      severity: 'warning',
      category: 'content',
      fixable: true,
      reason: 'Add metrics (percentages, dollar amounts, time saved) only where you truly have them.',
    });
  }

  const weakVerbs = bullets.filter((b) =>
    /^(worked on|responsible for|helped|assisted with|participated in|involved in|tried to|familiar with|knowledge of)\b/i.test(b.text)
  ).length;
  if (weakVerbs > 0) {
    issues.push({
      id: 'ats-weak-verbs',
      title: 'Weak action verbs detected',
      description: `${weakVerbs} bullet(s) start with weak phrases like "worked on" or "responsible for".`,
      severity: 'warning',
      category: 'content',
      fixable: true,
      reason: 'Start bullets with strong verbs (Built, Developed, Implemented, Led, Reduced).',
    });
  }

  // ── Contact issues ──
  const hasEmail = /\S+@\S+\.\S+/.test(safeText);
  const hasPhone = /(\+?\d[\d\s-]{7,})/.test(safeText);
  if (!hasEmail) {
    issues.push({
      id: 'ats-missing-email',
      title: 'Missing email address',
      description: 'No email address was found in your resume text.',
      severity: 'error',
      category: 'contact',
      fixable: true,
      reason: 'Recruiters and ATS need a way to contact you. Add a professional email address.',
    });
  }
  if (!hasPhone) {
    issues.push({
      id: 'ats-missing-phone',
      title: 'Missing phone number',
      description: 'No phone number was detected.',
      severity: 'warning',
      category: 'contact',
      fixable: true,
      reason: 'Add a phone number so recruiters can reach you directly.',
    });
  }

  // ── Formatting issues ──
  const giantLines = safeText.split('\n').filter((l) => l.length > 160).length;
  if (giantLines > 0) {
    issues.push({
      id: 'ats-long-lines',
      title: 'Very long lines detected',
      description: `${giantLines} line(s) exceed 160 characters, which can break ATS parsing.`,
      severity: 'info',
      category: 'formatting',
      fixable: true,
      reason: 'Break long lines into shorter sentences or bullets for better parser compatibility.',
    });
  }

  return issues;
}

/** Compute the ATS readiness score (0-100) from detected issues. */
export function computeATSScore(issues: ATSIssue[], wordCount: number): number {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case 'error':
        score -= 15;
        break;
      case 'warning':
        score -= 8;
        break;
      case 'info':
        score -= 3;
        break;
    }
  }

  // Length bonus/penalty
  if (wordCount >= 250 && wordCount <= 900) {
    score += 5;
  } else if (wordCount > 0 && wordCount < 250) {
    score -= 5;
  }

  return Math.min(100, Math.max(0, score));
}

/** Main entry point: compute ATS readiness result from resume text. */
export function computeATSReadiness(text: string): ATSReadinessResult {
  const safeText = text == null ? '' : text;
  const issues = computeATSIssues(safeText);
  const sections = detectSections(safeText);
  const bullets = splitBullets(safeText);
  const wordCount = safeText.split(/\s+/).filter((w) => w.length > 0).length;
  const hasEmail = /\S+@\S+\.\S+/.test(safeText);
  const hasPhone = /(\+?\d[\d\s-]{7,})/.test(safeText);
  const score = computeATSScore(issues, wordCount);

  return { score, issues, sections, bullets, wordCount, hasEmail, hasPhone };
}
