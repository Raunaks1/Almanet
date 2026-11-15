/**
 * Structured resume model — parses flat extracted resume text into editable
 * sections and serialises it back to plain text.
 *
 * Pure and deterministic; runs entirely in the browser. The Supabase schema is
 * untouched: `resumes.extracted_text` stays a single text column, and the
 * structured shape exists only in local component state.
 */

import { extractJobTitle, HEADINGS, normalizeKeepLines } from './textUtils';
import { findKeywords } from './skillDictionary';

export interface ResumeExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  techStack: string[];
  bullets: string[];
}

export interface ResumeProject {
  id: string;
  title: string;
  techStack: string[];
  bullets: string[];
}

export interface ResumeEducation {
  id: string;
  school: string;
  degree: string;
  dates: string;
  details: string[];
}

export interface ResumeData {
  name: string;
  headline: string;
  contact: string[];
  summary: string;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  skills: string[];
  certifications: string[];
}

export function emptyResumeData(): ResumeData {
  return {
    name: '',
    headline: '',
    contact: [],
    summary: '',
    experience: [],
    projects: [],
    education: [],
    skills: [],
    certifications: [],
  };
}

/* ── Parsing helpers ───────────────────────────────────────────────────── */

const BULLET_RE = /^(?:[•●◦▪]|-|\*|\d+[.)])\s+(.*)$/;

function stripBullet(line: string): string | null {
  const m = BULLET_RE.exec(line);
  return m ? m[1].trim() : null;
}

/** A line that is (mostly) a date range, e.g. "Jan 2024 - Present". */
function isDateLine(line: string): boolean {
  if (line.length > 60) return false;
  const hasYear = /(?:19|20)\d{2}/.test(line);
  const hasRange = /\s[-–—]\s|\s+to\s+|present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line);
  return hasYear && hasRange;
}

function splitDateRange(line: string): [string, string] {
  const parts = line.split(/\s[-–—]\s|\s+to\s+/i);
  if (parts.length >= 2) return [parts[0].trim(), parts.slice(1).join(' - ').trim()];
  return [line.trim(), ''];
}

function splitCompanyLocation(text: string): [string, string] {
  const trimmed = text.trim();
  if (!trimmed) return ['', ''];
  const parts = trimmed.split(/\s+[|•]\s*|\s*,\s*/);
  if (parts.length >= 2) return [parts[0].trim(), parts.slice(1).join(', ').trim()];
  return [trimmed, ''];
}

function isContactLine(line: string): boolean {
  return (
    /@|www\.|https?:\/\/|\.com|\.in|\.dev|\.io|\.co\b/i.test(line) ||
    /\+?\d[\d\s-]{7,}/.test(line)
  );
}

function splitChunks(lines: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.length === 0) {
      if (current.length > 0) {
        chunks.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function splitLinesPreservingBlanks(text: string): string[] {
  return text.split('\n').map((l) => l.replace(/\r/g, '').trim());
}

type SectionKind = 'summary' | 'experience' | 'projects' | 'skills' | 'education' | 'certifications' | 'other';

interface LineSection {
  name: string;
  start: number;
  end: number;
}

/**
 * Exact-match section heading detection.
 *
 * `detectSections` (used by the scoring engine) also treats any line starting
 * with a heading keyword as a heading — so "Project Lead" becomes a section.
 * The editor needs stricter boundaries, so a heading must match a known heading
 * exactly (ignoring case, inner whitespace and a trailing colon).
 */
function detectSectionsStrict(text: string): LineSection[] {
  const sections: LineSection[] = [];
  const lines = text.split('\n');
  let current: LineSection | null = null;
  let offset = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const key = trimmed.replace(/[:：]\s*$/, '').replace(/\s+/g, ' ').toLowerCase();
    if (key.length > 0 && HEADINGS.has(key)) {
      if (current) current.end = offset;
      current = { name: trimmed, start: offset, end: offset + line.length };
      sections.push(current);
    }
    offset += line.length + 1;
  }

  if (current) current.end = offset;
  return sections;
}

function classifySection(name: string): SectionKind {
  const n = name.toLowerCase();
  if (/summary|objective|profile|about/.test(n)) return 'summary';
  if (/experience|employment|work history/.test(n)) return 'experience';
  if (/project/.test(n)) return 'projects';
  if (/skill|technolog|tool|stack/.test(n)) return 'skills';
  if (/education|academic|qualification/.test(n)) return 'education';
  if (/certification|license|licence/.test(n)) return 'certifications';
  return 'other';
}

/** Distinct canonical skills found in `text`, capped at `limit`. */
function detectSkills(text: string, limit = 8): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const hit of findKeywords(text)) {
    const key = hit.canonical.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit.canonical);
    if (out.length >= limit) break;
  }
  return out;
}

function parseExperienceChunk(chunk: string[], id: string): ResumeExperience {
  const bullets: string[] = [];
  const nonBullets: string[] = [];
  for (const line of chunk) {
    const b = stripBullet(line);
    if (b != null) bullets.push(b);
    else nonBullets.push(line);
  }

  let title = '';
  let company = '';
  let location = '';
  let startDate = '';
  let endDate = '';

  const dateIdx = nonBullets.findIndex(isDateLine);
  if (dateIdx >= 0) {
    title = nonBullets[0] ?? '';
    const [s, e] = splitDateRange(nonBullets[dateIdx]);
    startDate = s;
    endDate = e;
    const between = nonBullets.slice(1, dateIdx).join(' ');
    if (between) {
      const [c, l] = splitCompanyLocation(between);
      company = c;
      location = l;
    }
  } else if (nonBullets.length > 0) {
    title = nonBullets[0];
    const rest = nonBullets.slice(1).join(' ');
    if (rest) {
      const [c, l] = splitCompanyLocation(rest);
      company = c;
      location = l;
    }
  }

  return {
    id,
    title,
    company,
    location,
    employmentType: '',
    startDate,
    endDate,
    techStack: detectSkills(chunk.join(' ')),
    bullets,
  };
}

function parseProjectChunk(chunk: string[], id: string): ResumeProject {
  const bullets: string[] = [];
  const nonBullets: string[] = [];
  for (const line of chunk) {
    const b = stripBullet(line);
    if (b != null) bullets.push(b);
    else nonBullets.push(line);
  }
  return {
    id,
    title: nonBullets[0] ?? '',
    techStack: detectSkills(chunk.join(' ')),
    bullets,
  };
}

function parseEducationChunk(chunk: string[], id: string): ResumeEducation {
  const details: string[] = [];
  const nonBullets: string[] = [];
  for (const line of chunk) {
    const b = stripBullet(line);
    if (b != null) details.push(b);
    else nonBullets.push(line);
  }

  const school = nonBullets[0] ?? '';
  const dateIdx = nonBullets.findIndex(isDateLine);
  let degree = '';
  let dates = '';
  if (dateIdx >= 0) {
    degree = nonBullets.slice(1, dateIdx).join(' ');
    dates = nonBullets[dateIdx];
  } else {
    degree = nonBullets.slice(1).join(' ');
  }

  return { id, school, degree, dates, details };
}

function parseSkills(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const cleaned = line.replace(BULLET_RE, '').trim();
    for (const part of cleaned.split(/\s*(?:[,;|•]|\||·)\s*/)) {
      const s = part.trim();
      if (s && s.length <= 40) out.push(s);
    }
  }
  return [...new Set(out)].slice(0, 40);
}

/** Parse flat extracted text into structured resume data. */
export function parseResume(text: string): ResumeData {
  const normalized = normalizeKeepLines(text || '');
  if (!normalized) return emptyResumeData();

  let idSeq = 0;
  const nextId = (prefix: string) => `${prefix}-${(idSeq += 1)}`;

  const sections = detectSectionsStrict(normalized);
  const firstSectionStart = sections.length > 0 ? sections[0].start : normalized.length;

  // Header block (before the first heading): name, headline, contact lines.
  const headerLines = splitLinesPreservingBlanks(normalized.slice(0, firstSectionStart)).filter(
    (l) => l.length > 0,
  );
  const name = headerLines[0] ?? '';
  const contact = headerLines.slice(1).filter(isContactLine);
  const headline =
    headerLines.slice(1).find((l) => !isContactLine(l)) ?? extractJobTitle(normalized);

  const bodies = new Map<SectionKind, string[]>();
  sections.forEach((s) => {
    const kind = classifySection(s.name);
    if (kind === 'other') return;
    const rawBody = normalized.slice(s.start, s.end);
    const rawLines = splitLinesPreservingBlanks(rawBody);
    const firstNonEmpty = rawLines.findIndex((l) => l.length > 0);
    const body = firstNonEmpty >= 0 ? rawLines.slice(firstNonEmpty + 1) : [];
    bodies.set(kind, [...(bodies.get(kind) ?? []), ...body]);
  });

  const nonBlank = (kind: SectionKind) => (bodies.get(kind) ?? []).filter((l) => l.length > 0);
  const chunksOf = (kind: SectionKind) => splitChunks(bodies.get(kind) ?? []);

  const experience = chunksOf('experience').map((chunk) => parseExperienceChunk(chunk, nextId('exp')));
  const projects = chunksOf('projects').map((chunk) => parseProjectChunk(chunk, nextId('proj')));
  const education = chunksOf('education').map((chunk) => parseEducationChunk(chunk, nextId('edu')));

  return {
    name,
    headline,
    contact,
    summary: nonBlank('summary')
      .map((l) => l.replace(BULLET_RE, '').trim())
      .join(' ')
      .trim(),
    experience,
    projects,
    education,
    skills: parseSkills(nonBlank('skills')),
    certifications: nonBlank('certifications')
      .map((l) => l.replace(BULLET_RE, '').trim())
      .filter(Boolean),
  };
}

/* ── Serialisation ─────────────────────────────────────────────────────── */

function experienceBlock(e: ResumeExperience): string {
  const lines: string[] = [];
  if (e.title) lines.push(e.title);
  const companyLine = [e.company, e.location, e.employmentType].filter(Boolean).join(' | ');
  if (companyLine) lines.push(companyLine);
  const dates = [e.startDate, e.endDate].filter(Boolean).join(' - ');
  if (dates) lines.push(dates);
  if (e.techStack.length > 0) lines.push(`Technologies: ${e.techStack.join(', ')}`);
  for (const b of e.bullets.filter(Boolean)) lines.push(`• ${b}`);
  return lines.join('\n');
}

function projectBlock(p: ResumeProject): string {
  const lines: string[] = [];
  if (p.title) lines.push(p.title);
  if (p.techStack.length > 0) lines.push(`Technologies: ${p.techStack.join(', ')}`);
  for (const b of p.bullets.filter(Boolean)) lines.push(`• ${b}`);
  return lines.join('\n');
}

function educationBlock(e: ResumeEducation): string {
  const lines: string[] = [];
  if (e.school) lines.push(e.school);
  if (e.degree) lines.push(e.degree);
  if (e.dates) lines.push(e.dates);
  for (const d of e.details.filter(Boolean)) lines.push(`• ${d}`);
  return lines.join('\n');
}

/** Serialise structured resume data back to plain text (ATS-friendly). */
export function serializeResume(data: ResumeData): string {
  const parts: string[] = [];

  const header = [data.name, data.headline, ...data.contact].filter(Boolean).join('\n');
  if (header) parts.push(header);

  if (data.summary) parts.push(['Summary', data.summary].join('\n'));

  if (data.experience.length > 0) {
    parts.push(['Experience', ...data.experience.map(experienceBlock)].join('\n\n'));
  }

  if (data.projects.length > 0) {
    parts.push(['Projects', ...data.projects.map(projectBlock)].join('\n\n'));
  }

  if (data.education.length > 0) {
    parts.push(['Education', ...data.education.map(educationBlock)].join('\n\n'));
  }

  if (data.skills.length > 0) {
    parts.push(['Skills', data.skills.join(', ')].join('\n'));
  }

  if (data.certifications.length > 0) {
    parts.push(['Certifications', ...data.certifications].join('\n'));
  }

  return parts.join('\n\n');
}
