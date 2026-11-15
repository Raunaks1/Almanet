/**
 * Text utilities for resume analysis.
 *
 * Whitespace is normalised but line breaks are kept, so character offsets computed
 * against the stored (already normalised) resume text map exactly onto the text that
 * is rendered by ResumeHighlight.
 */

export interface SectionRange {
  name: string;
  start: number;
  end: number;
}

export interface Bullet {
  text: string;
  start: number;
  end: number;
  wordCount: number;
  hasNumber: boolean;
  startsWithAction: boolean;
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Collapse horizontal whitespace, keep line breaks, trim. */
export function normalizeKeepLines(text: string): string {
  return text.replace(/[ \t\r\u00a0]+/g, ' ').replace(/\n[ \t]*/g, '\n').trim();
}

export const HEADINGS = new Set([
  'summary', 'objective', 'profile', 'professional summary', 'career objective',
  'experience', 'work experience', 'employment', 'professional experience',
  'internships', 'internship', 'projects', 'project', 'key projects', 'academic projects',
  'skills', 'technical skills', 'technologies', 'tools',
  'education', 'academic background',
  'certifications', 'certifications & licenses', 'licenses',
  'achievements', 'achievements & awards', 'awards', 'honors',
  'leadership', 'volunteer', 'volunteering', 'publications', 'references',
]);

/** Matches a line that is primarily a section heading (short, heading-like). */
const HEADING_RE = /^(summary|objective|profile|experience|employment|internship|internships|projects|project|skills|education|certification|achievement|award|leadership|volunteer|publication|reference)\b/i;

/** Detect resume sections by common headings. Returns each section's [start, end]
 *  character range within `text`. */
export function detectSections(text: string): SectionRange[] {
  const sections: SectionRange[] = [];
  const lines = text.split('\n');
  let current: SectionRange | null = null;
  let offset = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    const isKnown = HEADINGS.has(lower);
    const looksLike = HEADING_RE.test(trimmed) && trimmed.length <= 50 && !/\s{2,}/.test(trimmed);

    if (trimmed.length > 0 && (isKnown || looksLike)) {
      if (current) current.end = offset;
      current = { name: trimmed, start: offset, end: offset + line.length };
      sections.push(current);
    }
    offset += line.length + 1; // +1 for the newline
  }

  if (current) current.end = offset;
  return sections;
}

export function sectionNames(sections: SectionRange[]): string[] {
  return sections.map((s) => s.name.toLowerCase());
}

/** True when the resume has the standard sections ATS parsers expect. */
export function hasStandardSections(sections: SectionRange[]): boolean {
  const names = sectionNames(sections);
  return (
    names.some((n) => /experience|employment/.test(n)) &&
    names.some((n) => /education/.test(n)) &&
    names.some((n) => /skills/.test(n))
  );
}

const ACTION_VERBS = [
  'built', 'developed', 'implemented', 'designed', 'automated', 'optimised', 'optimized',
  'analysed', 'analyzed', 'led', 'reduced', 'improved', 'created', 'launched', 'managed',
  'delivered', 'engineered', 'architected', 'deployed', 'migrated', 'increased', 'decreased',
];

/** Split `text` into bullet lines (lines starting with a bullet char, dash, or
 *  numbered list marker). Returns offsets that index into `text`. */
export function splitBullets(text: string): Bullet[] {
  const bullets: Bullet[] = [];
  const lines = text.split('\n');
  let offset = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = /^([\u2022\-*•]|\d+[.)])\s+/.exec(trimmed);
    if (bulletMatch) {
      const textContent = trimmed.slice(bulletMatch[0].length);
      const words = textContent.split(/\s+/).filter((w) => w.length > 0).length;
      const hasNumber = /\d/.test(textContent);
      const firstWord = (textContent.split(/\s+/)[0] || '').toLowerCase();
      const startsWithAction = ACTION_VERBS.includes(firstWord);
      bullets.push({
        text: textContent,
        start: offset,
        end: offset + line.length,
        wordCount: words,
        hasNumber,
        startsWithAction,
      });
    }
    offset += line.length + 1;
  }

  return bullets;
}

/** All character offsets where `keyword` occurs in `text` (case-insensitive,
 *  plain substring — used for title/keyword presence checks). */
export function findOffsets(text: string, keyword: string): number[] {
  const low = text.toLowerCase();
  const k = keyword.toLowerCase();
  const offsets: number[] = [];
  let i = 0;
  while ((i = low.indexOf(k, i)) !== -1) {
    offsets.push(i);
    i += Math.max(k.length, 1);
  }
  return offsets;
}

/** Extract the most likely job title from resume text.
 *
 * Looks for the Experience/Projects section, then returns the first non-bullet,
 * non-date line after the heading — which is typically the job title (e.g.
 * "Software Engineer", "Project Lead"). Falls back to the first short, non-contact
 * line of the document if no experience section is found.
 */
export function extractJobTitle(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // Find Experience/Projects section heading
  let sectionIdx = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const lower = lines[i].toLowerCase();
    if (
      /^(experience|employment|professional experience|projects|internships?)$/.test(
        lower,
      ) &&
      lines[i].length <= 50
    ) {
      sectionIdx = i;
      break;
    }
  }

  const searchFrom = sectionIdx >= 0 ? sectionIdx + 1 : 0;

  for (let i = searchFrom; i < lines.length; i += 1) {
    const line = lines[i];

    // Stop at the next major section heading
    if (
      /^(education|skills|certification|achievement|summary|objective|publications)$/i.test(
        line,
      ) &&
      line.length <= 50
    ) {
      break;
    }

    // Skip bullet lines
    if (/^[\u2022\-*•]/.test(line)) continue;
    // Skip date-only lines (e.g. "Jan 2024 - Present", "01/2024 - 12/2024")
    if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(line)) continue;
    if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i.test(line)) continue;
    // Skip "Company | Location" or "Company, Location" style lines
    if (/\|/.test(line) && line.length < 60) continue;
    if (/,\s*[A-Z]{2}\b/.test(line) && line.length < 60) continue;

    // This line is most likely the job title
    return line;
  }

  // Fallback: first short, non-contact line of the document
  for (const line of lines) {
    if (line.length > 0 && line.length <= 60 && !line.includes('@') && !/^\d/.test(line)) {
      return line;
    }
  }

  return '';
}
