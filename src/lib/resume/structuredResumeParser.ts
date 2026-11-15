/**
 * Structured resume parser — converts raw `extracted_text` into the
 * `StructuredResume` editor model and serialises it back to plain text.
 *
 * Pure and deterministic; runs entirely in the browser. Section detection uses
 * multiple signals (alias match, ALL CAPS, size/bold hints) and falls back to
 * inline UPPERCASE heading detection for flattened text.
 *
 * The Supabase schema is untouched: `resumes.extracted_text` stays a single
 * text column. The structured shape exists only in local component state.
 */

import type {
  StructuredResume,
  PersonalInfo,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
} from '../../types/resume';
import { normalizeKeepLines } from './textUtils';

const BULLET_RE = /^(?:[•●◦▪]|-|\*|\d+[.)])\s+(.*)$/;

function stripBullet(line: string): string | null {
  const m = BULLET_RE.exec(line);
  return m ? m[1].trim() : null;
}

/** A line that is (mostly) a date range, e.g. "Jan 2024 - Present". */
function isDateLine(line: string): boolean {
  if (line.length > 60) return false;
  const hasYear = /(?:19|20)\d{2}/.test(line);
  const hasRange =
    /\s[-–—]\s|\s+to\s+|present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(
      line,
    );
  return hasYear && hasRange;
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

type SectionKind =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'education'
  | 'certifications'
  | 'other'
  | 'unclassified';

interface LineSection {
  name: string;
  start: number;
  end: number;
  kind: SectionKind;
  isAllCaps: boolean;
  isLikelyHeading: boolean;
}

/** Extended heading aliases for robust detection. */
const SECTION_ALIASES: Record<string, SectionKind> = {
  // Summary
  summary: 'summary' as SectionKind,
  objective: 'summary' as SectionKind,
  profile: 'summary' as SectionKind,
  about: 'summary' as SectionKind,
  'professional summary': 'summary' as SectionKind,
  'career objective': 'summary' as SectionKind,
  // Experience
  experience: 'experience' as SectionKind,
  'work experience': 'experience' as SectionKind,
  'professional experience': 'experience' as SectionKind,
  employment: 'experience' as SectionKind,
  internships: 'experience' as SectionKind,
  internship: 'experience' as SectionKind,
  // Projects
  projects: 'projects' as SectionKind,
  project: 'projects' as SectionKind,
  'selected projects': 'projects' as SectionKind,
  'academic projects': 'projects' as SectionKind,
  'personal projects': 'projects' as SectionKind,
  // Education
  education: 'education' as SectionKind,
  educations: 'education' as SectionKind,
  'academic background': 'education' as SectionKind,
  qualifications: 'education' as SectionKind,
  // Skills
  skills: 'skills' as SectionKind,
  'technical skills': 'skills' as SectionKind,
  'skills summary': 'skills' as SectionKind,
  'key skills': 'skills' as SectionKind,
  technologies: 'skills' as SectionKind,
  tools: 'skills' as SectionKind,
  // Certifications
  certifications: 'certifications' as SectionKind,
  certificates: 'certifications' as SectionKind,
  courses: 'certifications' as SectionKind,
  licenses: 'certifications' as SectionKind,
  'certifications & licenses': 'certifications' as SectionKind,
  // Extra sections (preserved as unclassified but recognised)
  achievements: 'unclassified' as SectionKind,
  awards: 'unclassified' as SectionKind,
  'positions of responsibility': 'unclassified' as SectionKind,
  languages: 'unclassified' as SectionKind,
  interests: 'unclassified' as SectionKind,
  hobbies: 'unclassified' as SectionKind,
  leadership: 'unclassified' as SectionKind,
  volunteer: 'unclassified' as SectionKind,
  volunteering: 'unclassified' as SectionKind,
  publications: 'unclassified' as SectionKind,
  references: 'unclassified' as SectionKind,
};

function classifySection(name: string): SectionKind {
  const n = name.toLowerCase().trim();
  const alias = SECTION_ALIASES[n];
  if (alias) return alias;
  return 'other';
}

/** True when a line is ALL CAPS (at least 4 letters, mostly uppercase). */
function isAllCapsHeading(line: string): boolean {
  const letters = line.replace(/[^A-Za-z]/g, '');
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^A-Z]/g, '');
  return upper.length / letters.length > 0.7;
}

/** True when a short line looks like a section heading (1-4 words, no trailing punctuation except colon). */
function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 60) return false;
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 5) return false;
  // Allow trailing colon
  const core = trimmed.replace(/[:：]\s*$/, '');
  return core.length > 0;
}

/** Strict section heading detection using multiple signals. */
function detectSectionsStrict(
  lines: Array<{ text: string; y: number; fontSize?: number; isBold?: boolean }>,
): LineSection[] {
  const sections: LineSection[] = [];
  let current: LineSection | null = null;
  let offset = 0;

  // Compute body baseline font size (median of non-heading lines).
  const fontSizes = lines
    .filter((l) => l.fontSize && l.fontSize > 0)
    .map((l) => l.fontSize!);
  fontSizes.sort((a, b) => a - b);
  const bodyFontSize = fontSizes.length > 0 ? fontSizes[Math.floor(fontSizes.length / 2)] : 12;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.text.trim();
    const key = trimmed.replace(/[:：]\s*$/, '').replace(/\s+/g, ' ').toLowerCase();

    let isHeading = false;
    let isAllCaps = false;

    // Signal 1: exact alias match
    if (SECTION_ALIASES[key]) {
      isHeading = true;
    }
    // Signal 2: ALL CAPS short line
    else if (looksLikeHeading(trimmed) && isAllCapsHeading(trimmed)) {
      isHeading = true;
      isAllCaps = true;
    }
    // Signal 3: larger or bolder than body, short line
    else if (
      looksLikeHeading(trimmed) &&
      ((line.fontSize && line.fontSize > bodyFontSize * 1.1) ||
        (line.isBold && !isAllCapsHeading(trimmed)))
    ) {
      isHeading = true;
    }

    if (isHeading && key.length > 0) {
      const kind = classifySection(key);
      if (current) current.end = offset;
      current = {
        name: trimmed,
        start: offset,
        end: offset + line.text.length + 1,
        kind,
        isAllCaps,
        isLikelyHeading: true,
      };
      sections.push(current);
    }
    offset += line.text.length + 1;
  }

  if (current) current.end = offset;
  return sections;
}

/**
 * Fallback for flattened text: scan for UPPERCASE section alias words inside
 * the text and split there. Also splits inline headings where a heading word
 * appears in the middle of a line in uppercase or as a bold/larger font run
 * followed by content.
 */
function detectInlineHeadings(text: string): LineSection[] {
  const sections: LineSection[] = [];
  const uppercaseAliases: Array<{ alias: string; kind: SectionKind }> = [
    { alias: 'EXPERIENCE', kind: 'experience' },
    { alias: 'EDUCATIONS', kind: 'education' },
    { alias: 'EDUCATION', kind: 'education' },
    { alias: 'PROJECTS', kind: 'projects' },
    { alias: 'SKILLS', kind: 'skills' },
    { alias: 'CERTIFICATIONS', kind: 'certifications' },
    { alias: 'SUMMARY', kind: 'summary' },
    { alias: 'PROFILE', kind: 'summary' },
  ];

  // Find all occurrences of uppercase alias words at word boundaries.
  const hits: Array<{ pos: number; alias: string; kind: SectionKind }> = [];
  for (const { alias, kind } of uppercaseAliases) {
    const re = new RegExp(`\\b${alias}\\b`, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      hits.push({ pos: match.index, alias, kind });
    }
  }
  hits.sort((a, b) => a.pos - b.pos);

  if (hits.length === 0) return sections;

  // Build sections between hits.
  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i];
    const start = hit.pos;
    const end = i + 1 < hits.length ? hits[i + 1].pos : text.length;
    sections.push({
      name: hit.alias,
      start,
      end,
      kind: hit.kind,
      isAllCaps: true,
      isLikelyHeading: true,
    });
  }
  return sections;
}

let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

function parseExperienceChunk(chunk: string[]): ResumeExperience {
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
  let dates = '';

  const dateIdx = nonBullets.findIndex(isDateLine);
  if (dateIdx >= 0) {
    title = nonBullets[0] ?? '';
    dates = nonBullets[dateIdx];
    const between = nonBullets.slice(1, dateIdx).join(' ');
    if (between) {
      const [c, loc] = splitCompanyLocation(between);
      company = c;
      location = loc;
    }
  } else if (nonBullets.length > 0) {
    title = nonBullets[0];
    const rest = nonBullets.slice(1).join(' ');
    if (rest) {
      const [c, loc] = splitCompanyLocation(rest);
      company = c;
      location = loc;
    }
  }

  return {
    id: nextId('exp'),
    title,
    company,
    location,
    dates,
    bullets,
  };
}

function parseProjectChunk(chunk: string[]): ResumeProject {
  const bullets: string[] = [];
  const nonBullets: string[] = [];
  for (const line of chunk) {
    const b = stripBullet(line);
    if (b != null) bullets.push(b);
    else nonBullets.push(line);
  }

  // Look for a "Technologies/Tech Stack/Skills Used:" line.
  let tech = '';
  const techIdx = nonBullets.findIndex(
    (l) => /technolog|stack|skills used/i.test(l) && l.length < 80,
  );
  if (techIdx >= 0) {
    tech = nonBullets[techIdx].replace(/^(technologies?|stack|skills used):?\s*/i, '').trim();
    nonBullets.splice(techIdx, 1);
  }

  return {
    id: nextId('proj'),
    title: nonBullets[0] ?? '',
    tech,
    dates: '',
    bullets,
  };
}

function parseEducationChunk(chunk: string[]): ResumeEducation {
  const detailsLines: string[] = [];
  const nonBullets: string[] = [];
  for (const line of chunk) {
    const b = stripBullet(line);
    if (b != null) detailsLines.push(b);
    else nonBullets.push(line);
  }

  const institution = nonBullets[0] ?? '';
  const dateIdx = nonBullets.findIndex(isDateLine);
  let degree = '';
  let dates = '';
  if (dateIdx >= 0) {
    degree = nonBullets.slice(1, dateIdx).join(' ');
    dates = nonBullets[dateIdx];
  } else {
    degree = nonBullets.slice(1).join(' ');
  }

  // Extract CGPA/percentage from details.
  return {
    id: nextId('edu'),
    institution,
    degree,
    dates,
    details: detailsLines.join(' '),
  };
}

function parseSkills(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    // Handle "Category : a, b, c" format.
    const catMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (catMatch) {
      const items = catMatch[2]
        .split(/\s*[,;•|·]\s*/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= 40);
      out.push(...items);
      continue;
    }
    const cleaned = line.replace(BULLET_RE, '').trim();
    for (const part of cleaned.split(/\s*(?:[,;|•]|\||·)\s*/)) {
      const s = part.trim();
      if (s && s.length <= 40) out.push(s);
    }
  }
  return [...new Set(out)].slice(0, 40);
}

/** Parse flat extracted text into StructuredResume with confidence and warnings. */
export function parseStructuredResume(text: string): StructuredResume {
  const warnings: string[] = [];
  const normalized = normalizeKeepLines(text || '');
  if (!normalized) {
    return {
      personalInfo: { name: '', email: '', phone: '', links: [], headline: '' },
      summary: '',
      education: [],
      experience: [],
      projects: [],
      skills: [],
      certifications: [],
      unclassified: [],
      parseConfidence: 'low',
      warnings: ['No text to parse.'],
      extractor: 2,
    };
  }

  const allLines = splitLinesPreservingBlanks(normalized);
  const lines = allLines.filter((l) => l.length > 0);

  // Build line objects with style hints (we don't have geometry from stored text,
  // so fontSize/isBold are undefined — detection relies on alias + ALL CAPS).
  const lineObjs = allLines.map((l) => ({ text: l, y: 0, fontSize: undefined, isBold: undefined }));

  // Try strict section detection on separate lines.
  let sections = detectSectionsStrict(lineObjs);

  let parseConfidence: 'high' | 'medium' | 'low' = 'high';

  // Fallback: if no sections found on separate lines, try inline heading detection.
  if (sections.length === 0) {
    sections = detectInlineHeadings(normalized);
    if (sections.length > 0) {
      parseConfidence = 'low';
      warnings.push('No section headings on separate lines; detected inline headings.');
    } else {
      parseConfidence = 'low';
      warnings.push('No section headings found. Everything is unclassified.');
    }
  } else {
    // Headings were found on their own lines — good confidence for stored text.
    parseConfidence = 'high';
  }

  const firstSectionStart = sections.length > 0 ? sections[0].start : normalized.length;

  // Header block (before the first section): name, contact lines, headline.
  const headerLines = splitLinesPreservingBlanks(normalized.slice(0, firstSectionStart)).filter(
    (l) => l.length > 0,
  );
  const name = headerLines[0] ?? '';
  const contact = headerLines.slice(1).filter(isContactLine);
  const phone = contact.find((c) => /\+?\d[\d\s-]{7,}/.test(c)) ?? '';
  const links = contact.filter((c) => !/@/.test(c) && !/\+?\d[\d\s-]{7,}/.test(c));

  // Headline: first non-contact line after the name.
  let headline = '';
  for (const h of headerLines.slice(1)) {
    if (!isContactLine(h)) {
      headline = h;
      break;
    }
  }

  const emailMatch = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.exec(
    contact.find((c) => /@/.test(c)) ?? '',
  );
  const email = emailMatch ? emailMatch[0] : '';

  const personalInfo: PersonalInfo = { name, email, phone, links, headline };

  const unclassified: string[] = [];
  if (sections.length === 0) {
    // No headings at all — keep every line for manual placement.
    unclassified.push(...lines);
  }

  const bodies = new Map<SectionKind, string[]>();
  sections.forEach((s) => {
    if (s.kind === 'unclassified') return;
    const rawBody = normalized.slice(s.start, s.end);
    const rawLines = splitLinesPreservingBlanks(rawBody);
    const firstNonEmpty = rawLines.findIndex((l) => l.length > 0);
    const body = firstNonEmpty >= 0 ? rawLines.slice(firstNonEmpty + 1) : [];
    bodies.set(s.kind, [...(bodies.get(s.kind) ?? []), ...body]);
  });

  // Collect unclassified text (extra sections + anything not matched).
  sections.forEach((s) => {
    if (s.kind === 'unclassified') {
      const rawBody = normalized.slice(s.start, s.end);
      const rawLines = splitLinesPreservingBlanks(rawBody).filter((l) => l.length > 0);
      // Skip the heading line itself.
      unclassified.push(...rawLines.slice(1));
    }
  });
  // Also add trailing text after the last section.
  if (sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    const tail = normalized.slice(lastSection.end).trim();
    if (tail.length > 0) {
      unclassified.push(...tail.split('\n').filter((l) => l.length > 0));
    }
  }

  const nonBlank = (kind: SectionKind) => (bodies.get(kind) ?? []).filter((l) => l.length > 0);
  const chunksOf = (kind: SectionKind) => splitChunks(bodies.get(kind) ?? []);

  const experience = chunksOf('experience').map(parseExperienceChunk);
  const projects = chunksOf('projects').map(parseProjectChunk);
  const education = chunksOf('education').map(parseEducationChunk);

  const skills = parseSkills(nonBlank('skills'));
  const certifications = nonBlank('certifications')
    .map((l) => l.replace(BULLET_RE, '').trim())
    .filter(Boolean);

  // Section-empty warnings.
  const sectionCounts = {
    experience: experience.length,
    projects: projects.length,
    education: education.length,
    skills: skills.length,
    certifications: certifications.length,
  };
  const emptySections = Object.entries(sectionCounts)
    .filter(([, c]) => c === 0)
    .map(([k]) => k);
  if (emptySections.length > 0 && parseConfidence !== 'low') {
    warnings.push(`No entries detected for: ${emptySections.join(', ')}.`);
  }

  return {
    personalInfo,
    summary: nonBlank('summary')
      .map((l) => l.replace(BULLET_RE, '').trim())
      .join(' ')
      .trim(),
    experience,
    projects,
    education,
    skills,
    certifications,
    unclassified,
    parseConfidence,
    warnings,
    extractor: 2,
  };
}

/* ── Serialisation ─────────────────────────────────────────────────────── */

function experienceBlock(e: ResumeExperience): string {
  const lines: string[] = [];
  if (e.title) lines.push(e.title);
  if (e.company) lines.push(e.company);
  const dates = e.dates;
  if (dates) lines.push(dates);
  for (const b of e.bullets.filter(Boolean)) lines.push(`• ${b}`);
  return lines.join('\n');
}

function projectBlock(p: ResumeProject): string {
  const lines: string[] = [];
  if (p.title) lines.push(p.title);
  if (p.tech) lines.push(`Technologies: ${p.tech}`);
  if (p.dates) lines.push(p.dates);
  for (const b of p.bullets.filter(Boolean)) lines.push(`• ${b}`);
  return lines.join('\n');
}

function educationBlock(e: ResumeEducation): string {
  const lines: string[] = [];
  if (e.institution) lines.push(e.institution);
  if (e.degree) lines.push(e.degree);
  if (e.dates) lines.push(e.dates);
  if (e.details) lines.push(`• ${e.details}`);
  return lines.join('\n');
}

/** Serialise StructuredResume back to plain text (ATS-friendly). */
export function serializeStructuredResume(data: StructuredResume): string {
  const parts: string[] = [];

  const header = [
    data.personalInfo.name,
    data.personalInfo.email,
    data.personalInfo.phone,
    ...data.personalInfo.links,
  ].filter(Boolean);
  if (header.length > 0) parts.push(header.join('\n'));

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

  if (data.unclassified.length > 0) {
    parts.push(['Unclassified', ...data.unclassified].join('\n'));
  }

  return parts.join('\n\n');
}
