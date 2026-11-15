/**
 * Resume vs job analysis — pure, deterministic, runs entirely in the browser.
 * No network calls, no logging of resume text.
 *
 * Scoring (total 100):
 *   - Core keyword coverage      45  (weighted share of job keywords found)
 *   - Evidence in bullets        10  (matched keywords backed by experience/project bullets)
 *   - Role / title fit           10  (job title words vs headline / summary / experience titles)
 *   - Level fit                  10  (min_years vs years detected; internships count projects/education)
 *   - ATS-friendliness           25  (email, phone, headings, length, action verbs, weak phrases, paragraphs, line length)
 *
 * Labels: 0-39 Poor Match, 40-59 Fair Match, 60-79 Good Match, 80-100 Excellent Match.
 * Keyword stuffing: a keyword counted more than 3 times adds nothing.
 */

import { findKeywords } from './skillDictionary';
import {
  detectSections,
  findOffsets,
  normalizeWhitespace,
  splitBullets,
  type Bullet,
  type SectionRange,
} from './textUtils';

export interface AnalysisJob {
  title: string;
  company: string;
  location?: string;
  description?: string;
  requirements?: string[];
  required_skills?: string[];
  nice_skills?: string[];
  min_years?: number;
  type?: string;
}

export interface JobKeyword {
  canonical: string;
  weight: number;
  source: 'required' | 'nice' | 'description' | 'title' | 'requirement';
  where: string;
}

export interface MatchedKeyword extends JobKeyword {
  count: number; // capped at 3 for scoring
  inBullet: boolean;
  offsets: number[];
}

export interface MissingKeyword extends JobKeyword {
  weight: number;
}

export interface WeakFinding {
  start: number;
  end: number;
  text: string;
  kind: 'weak-verb' | 'cliche' | 'long-bullet' | 'no-metric';
  suggestion: string;
}

export interface ScorePart {
  name: string;
  points: number;
  max: number;
  note: string;
}

export interface ResumeAnalysis {
  score: number; // 0 - 100
  label: 'Poor Match' | 'Fair Match' | 'Good Match' | 'Excellent Match';
  parts: ScorePart[];
  matched: MatchedKeyword[];
  missing: MissingKeyword[];
  weak: WeakFinding[];
  topFixes: string[];
  wordCount: number;
  yearsDetected: number;
  sections: SectionRange[];
  noDescription: boolean;
}

/** Safe fallback returned when analysis cannot complete. Never throws. */
export const FALLBACK_ANALYSIS: ResumeAnalysis = {
  score: 0,
  label: 'Poor Match',
  parts: [],
  matched: [],
  missing: [],
  weak: [],
  topFixes: [],
  wordCount: 0,
  yearsDetected: 0,
  sections: [],
  noDescription: true,
};

/** Coerce any value to a string, with a safe default. */
function toStr(v: unknown, def = ''): string {
  if (v == null) return def;
  if (typeof v === 'string') return v;
  return String(v);
}

/** Coerce any value to an array, with a safe default. */
function toArray(v: unknown, def: Array<unknown> = []): Array<unknown> {
  if (v == null) return def;
  if (Array.isArray(v)) return v;
  return [v];
}

/** Coerce any value to a finite number, with a safe default. */
function toNumber(v: unknown, def = 0): number {
  if (v == null) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

const LABEL_THRESHOLDS: Array<{ max: number; label: ResumeAnalysis['label'] }> = [
  { max: 39, label: 'Poor Match' },
  { max: 59, label: 'Fair Match' },
  { max: 79, label: 'Good Match' },
  { max: 100, label: 'Excellent Match' },
];

export function labelForScore(score: number): ResumeAnalysis['label'] {
  for (const { max, label } of LABEL_THRESHOLDS) {
    if (score <= max) return label;
  }
  return 'Excellent Match';
}

const WEAK_PHRASES: Array<{ phrase: string; suggestion: string }> = [
  { phrase: 'worked on', suggestion: 'Replace with a stronger verb such as "Built", "Developed" or "Implemented".' },
  { phrase: 'responsible for', suggestion: 'Replace with "Led", "Owned" or "Managed".' },
  { phrase: 'helped', suggestion: 'Replace with "Contributed", "Built" or "Delivered".' },
  { phrase: 'assisted with', suggestion: 'Replace with "Supported" or "Delivered".' },
  { phrase: 'participated in', suggestion: 'Replace with "Contributed to".' },
  { phrase: 'involved in', suggestion: 'Replace with "Contributed to".' },
  { phrase: 'tried to', suggestion: 'Replace with "Attempted" or state what you achieved.' },
  { phrase: 'familiar with', suggestion: 'Replace with "Proficient in" or state your level.' },
  { phrase: 'knowledge of', suggestion: 'Replace with "Experienced with" or state your level.' },
  { phrase: 'various', suggestion: 'Specify the tools or technologies instead of "various".' },
  { phrase: 'etc', suggestion: 'List the items instead of ending with "etc".' },
];

const CLICHES: Array<{ phrase: string; suggestion: string }> = [
  { phrase: 'hardworking', suggestion: 'Show it with a metric or example instead of the cliché "hardworking".' },
  { phrase: 'team player', suggestion: 'Show collaboration with a concrete example instead of "team player".' },
  { phrase: 'passionate', suggestion: 'State what you built or shipped instead of "passionate".' },
  { phrase: 'fast learner', suggestion: 'Cite a skill you picked up and applied instead of "fast learner".' },
  { phrase: 'self-motivated', suggestion: 'Point to a self-driven project instead of "self-motivated".' },
  { phrase: 'results-oriented', suggestion: 'Include a measurable result instead of "results-oriented".' },
];

const STRONG_VERBS = ['Built', 'Developed', 'Implemented', 'Designed', 'Automated', 'Optimised', 'Analysed', 'Led', 'Reduced', 'Improved'];

/** Detect years of experience mentioned in the text. */
function detectYears(text: string): number {
  const low = text.toLowerCase();
  let best = 0;
  const re = /(\d+(?:\.\d+)?)\s*(?:\+?\s*)?years?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(low)) !== null) {
    const v = Number(m[1]);
    if (!Number.isNaN(v) && v > best) best = v;
  }
  return best;
}

/** All occurrences of a phrase in text, bounded so it is not glued to other word chars. */
function findPhraseOccurrences(text: string, phrase: string): { start: number; end: number }[] {
  const low = text.toLowerCase();
  const k = phrase.toLowerCase();
  const out: { start: number; end: number }[] = [];
  let i = 0;
  while ((i = low.indexOf(k, i)) !== -1) {
    const before = i === 0 || !/\w/.test(text[i - 1]);
    const after = i + k.length === text.length || !/\w/.test(text[i + k.length]);
    if (before && after) out.push({ start: i, end: i + k.length });
    i += Math.max(k.length, 1);
  }
  return out;
}

/** Detect weak phrases and clichés with exact character ranges. */
function detectWeakPhrases(text: string): WeakFinding[] {
  const findings: WeakFinding[] = [];
  const seen = new Set<string>();

  for (const { phrase, suggestion } of WEAK_PHRASES) {
    for (const occ of findPhraseOccurrences(text, phrase)) {
      const key = `${occ.start}|${occ.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({ start: occ.start, end: occ.end, text: phrase, kind: 'weak-verb', suggestion });
    }
  }
  for (const { phrase, suggestion } of CLICHES) {
    for (const occ of findPhraseOccurrences(text, phrase)) {
      const key = `${occ.start}|${occ.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({ start: occ.start, end: occ.end, text: phrase, kind: 'cliche', suggestion });
    }
  }

  return findings.sort((a, b) => a.start - b.start);
}

/** Build the top-3 fixes as plain sentences. */
function computeTopFixes(
  missing: MissingKeyword[],
  weak: WeakFinding[],
  bullets: Bullet[],
  sections: SectionRange[],
  wordCount: number,
): string[] {
  const fixes: string[] = [];

  const highMissing = missing.filter((m) => m.weight >= 2).slice(0, 2);
  for (const m of highMissing) {
    fixes.push(`Add "${m.canonical}" to your skills or project bullets — it's a ${m.weight >= 2.5 ? 'must-have' : 'useful'} keyword for this role.`);
  }

  const weakVerbs = weak.filter((w) => w.kind === 'weak-verb').slice(0, 1);
  if (weakVerbs.length > 0) {
    fixes.push(`Replace weak phrases like "${weakVerbs[0].text}" with stronger action verbs (e.g. ${STRONG_VERBS.slice(0, 4).join(', ')}).`);
  }

  const noMetric = bullets.filter((b) => !b.hasNumber && b.wordCount > 8).length;
  if (noMetric > 0) {
    fixes.push('Add measurable results (numbers) to your experience bullets — but only if you really have them.');
  }

  const names = sections.map((s) => s.name.toLowerCase());
  if (!names.some((n) => /experience|employment/.test(n))) {
    fixes.push('Add an Experience section with your roles and bullets.');
  } else if (!names.some((n) => /education/.test(n))) {
    fixes.push('Add an Education section.');
  } else if (!names.some((n) => /skills/.test(n))) {
    fixes.push('Add a Skills section listing your key technologies.');
  }

  if (wordCount > 0 && wordCount < 250) {
    fixes.push('Expand your resume — aim for 250 to 900 words so ATS parsers have enough to read.');
  }

  // De-dupe similar sentences and cap at 3.
  const unique: string[] = [];
  for (const f of fixes) {
    if (!unique.includes(f)) unique.push(f);
  }
  return unique.slice(0, 3);
}

export function analyzeResume(resumeText: string, job: AnalysisJob): ResumeAnalysis {
  // ── Normalise inputs at the boundary so nothing downstream can throw on
  //    null, undefined, or wrong-typed job/resume fields. ───────────────
  let text = '';
  let safeJob: AnalysisJob;
  try {
    text = normalizeWhitespace(toStr(resumeText));
    safeJob = {
      title: toStr(job.title),
      company: toStr(job.company),
      location: toStr(job.location) || undefined,
      description: toStr(job.description) || undefined,
      requirements: toArray(job.requirements) as string[],
      required_skills: toArray(job.required_skills) as string[],
      nice_skills: toArray(job.nice_skills) as string[],
      min_years: job.min_years == null ? undefined : toNumber(job.min_years),
      type: toStr(job.type) || undefined,
    };
  } catch {
    return FALLBACK_ANALYSIS;
  }

  try {
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
    const sections = detectSections(text);
    const bullets = splitBullets(text);
    const bulletRanges = bullets.map((b) => [b.start, b.end] as [number, number]);

    const isInternship =
      /intern|fresher|graduate|entry.level|junior|trainee/i.test(
        `${safeJob.title} ${safeJob.description || ''} ${safeJob.type || ''}`,
      );
    const noDescription = !safeJob.description || safeJob.description.trim().length === 0;
    const yearsDetected = detectYears(text);

    // ── Build job keywords (de-duplicated by canonical, max weight wins) ───
    type KW = JobKeyword;
    const kwMap = new Map<string, KW>();
    const addKW = (canonical: string, weight: number, source: KW['source'], where: string) => {
      const c = canonical.trim().toLowerCase();
      if (!c) return;
      const existing = kwMap.get(c);
      if (!existing) kwMap.set(c, { canonical, weight, source, where });
      else if (weight > existing.weight) existing.weight = weight;
    };

    (safeJob.required_skills || []).forEach((s) => addKW(s, 3, 'required', 'required skills'));
    (safeJob.nice_skills || []).forEach((s) => addKW(s, 1.5, 'nice', 'nice-to-have skills'));
    (safeJob.requirements || []).forEach((r, i) => {
      addKW(r.trim(), 2, 'requirement', `requirement ${i + 1}`);
      findKeywords(r).forEach((k) => addKW(k.canonical, 2, 'requirement', `requirement ${i + 1}`));
    });
    if (!noDescription) {
      findKeywords(safeJob.description || '').forEach((k) => {
        const w = Math.min(Math.max(k.count, 1), 3);
        addKW(k.canonical, w, 'description', 'job description');
      });
    }

    const allKeywords = Array.from(kwMap.values());
    const totalWeight = allKeywords.reduce((s, k) => s + k.weight, 0);

    // ── Match each keyword against the resume ───
    const matched: MatchedKeyword[] = [];
    const missing: MissingKeyword[] = [];

    for (const kw of allKeywords) {
      const hits = findKeywords(text).filter((h) => h.canonical.toLowerCase() === kw.canonical.toLowerCase());
      // findKeywords returns proper-case canonicals; compare lowercased.
      const hit = hits[0];
      const count = hit ? Math.min(hit.count, 3) : 0;
      const offsets = hit ? hit.offsets : [];
      const inBullet = offsets.some((o) => bulletRanges.some(([s, e]) => o >= s && o <= e));

      if (count > 0) {
        matched.push({ ...kw, count, inBullet, offsets });
      } else {
        missing.push({ canonical: kw.canonical, weight: kw.weight, source: kw.source, where: kw.where });
      }
    }

    missing.sort((a, b) => b.weight - a.weight || a.canonical.localeCompare(b.canonical));

    // ── Score parts ───
    const matchedWeight = matched.reduce((s, k) => s + k.weight, 0);
    const corePoints = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 45) : 0;

    const matchedWithBullets = matched.filter((m) => m.inBullet).length;
    const evidencePoints = matched.length > 0 ? Math.round((matchedWithBullets / matched.length) * 10) : 0;

    const titleWords = (safeJob.title || '').split(/\s+/).filter((w) => w.length > 2);
    const titleMatchCount = titleWords.filter((w) => findOffsets(text, w).length > 0).length;
    const titlePoints = titleWords.length > 0 ? Math.round((titleMatchCount / titleWords.length) * 10) : 5;

    let levelPoints = 0;
    let levelNote = '';
    if (safeJob.min_years != null) {
      if (yearsDetected >= safeJob.min_years) {
        levelPoints = 10;
        levelNote = `You have ${yearsDetected}+ years; the role wants ${safeJob.min_years}.`;
      } else {
        levelPoints = Math.round((yearsDetected / Math.max(safeJob.min_years, 1)) * 10);
        levelNote = `Role wants ${safeJob.min_years} years; you show about ${yearsDetected}.`;
      }
    } else if (isInternship) {
      const hasProjectsOrEdu = sections.some((s) => /project|education/.test(s.name));
      levelPoints = hasProjectsOrEdu ? 10 : 0;
      levelNote = hasProjectsOrEdu ? 'Internship/graduate role — projects and education count.' : 'Internship/graduate role but no projects or education section found.';
    } else {
      levelPoints = 5;
      levelNote = 'No minimum years specified; scored neutrally.';
    }

    // ATS-friendliness (max 25)
    const hasEmail = /\S+@\S+\.\S+/.test(text);
    const hasPhone = /(\+?\d[\d\s-]{7,})/.test(text);
    const standardHeadings = sections.filter((s) => /summary|experience|projects|skills|education/i.test(s.name)).length;
    const headingsPoints = Math.min(standardHeadings, 4);
    const lengthOk = wordCount >= 250 && wordCount <= 900;
    const actionStarted = bullets.filter((b) => b.startsWithAction).length;
    const actionPoints = bullets.length > 0 ? Math.min(actionStarted, 4) : (noDescription ? 0 : 0);
    const weakPhraseCount = detectWeakPhrases(text).filter((w) => w.kind === 'weak-verb' || w.kind === 'cliche').length;
    const weakPoints = weakPhraseCount <= 2 ? 4 : Math.max(0, 4 - weakPhraseCount);
    const giantLines = text.split('\n').filter((l) => l.length > 120).length;
    const paraPoints = giantLines === 0 ? 2 : Math.max(0, 2 - giantLines);
    const longLineOk = text.split('\n').every((l) => l.length <= 160);
    const linePoints = longLineOk ? 1 : 0;

    let atsPoints = (hasEmail ? 3 : 0) + (hasPhone ? 3 : 0) + headingsPoints + (lengthOk ? 4 : 0) + actionPoints + weakPoints + paraPoints + linePoints;
    atsPoints = Math.min(atsPoints, 25);

    const atScoreNotes = [
      `Email ${hasEmail ? 'present' : 'missing'}, phone ${hasPhone ? 'present' : 'missing'}.`,
      `Standard section headings: ${standardHeadings}.`,
      `Length: ${wordCount} words (ideal 250–900).`,
      `Bullets starting with action verbs: ${actionStarted} of ${bullets.length}.`,
      `Weak/cliché phrases: ${weakPhraseCount}. Giant paragraphs: ${giantLines}.`,
    ].join(' ');

    const score = Math.min(100, Math.max(0, corePoints + evidencePoints + titlePoints + levelPoints + atsPoints));
    const label = labelForScore(score);

    const parts: ScorePart[] = [
      {
        name: 'Core keyword coverage',
        points: corePoints,
        max: 45,
        note: totalWeight === 0 ? 'No job keywords to score against.' : `Found ${matchedWeight.toFixed(1)} of ${totalWeight.toFixed(1)} weighted keyword points.`,
      },
      {
        name: 'Evidence in bullets',
        points: evidencePoints,
        max: 10,
        note: `${matchedWithBullets} of ${matched.length} matched keywords appear in experience/project bullets.`,
      },
      {
        name: 'Role / title fit',
        points: titlePoints,
        max: 10,
        note: `${titleMatchCount} of ${titleWords.length} title words appear in your resume headline / summary / experience titles.`,
      },
      {
        name: 'Level fit',
        points: levelPoints,
        max: 10,
        note: levelNote,
      },
      {
        name: 'ATS-friendliness',
        points: atsPoints,
        max: 25,
        note: atScoreNotes,
      },
    ];

    // ── Weak findings (bullets over 35 words, no-metric) ───
    const weak: WeakFinding[] = [...detectWeakPhrases(text)];
    for (const b of bullets) {
      if (b.wordCount > 35) {
        weak.push({
          start: b.start,
          end: b.end,
          text: b.text,
          kind: 'long-bullet',
          suggestion: 'Split into shorter bullets (under 35 words each).',
        });
      }
      if (!b.hasNumber && b.wordCount > 8) {
        weak.push({
          start: b.start,
          end: b.end,
          text: b.text,
          kind: 'no-metric',
          suggestion: 'Add a result or number ONLY if you have one.',
        });
      }
    }
    weak.sort((a, b) => a.start - b.start);

    const topFixes = computeTopFixes(missing, weak, bullets, sections, wordCount);

    return {
      score,
      label,
      parts,
      matched,
      missing,
      weak,
      topFixes,
      wordCount,
      yearsDetected,
      sections,
      noDescription,
    };
  } catch {
    return FALLBACK_ANALYSIS;
  }
}

/** Build the analysis job input from a raw job post (Supabase Jobs row or seed Job).
 *  Centralised so the Jobs page and the Optimise route/page agree on keyword weights. */
export function buildAnalysisJob(post: {
  title: string;
  company: string;
  location?: string | null;
  description?: string | null;
  requirements?: string[] | null;
  tags?: string[] | null;
  experience?: string | null;
  type?: string | null;
}): AnalysisJob {
  const minYears = (post.experience || '').match(/\d+/)?.[0];
  return {
    title: post.title || '',
    company: post.company || '',
    location: post.location || undefined,
    description: post.description || undefined,
    requirements: post.requirements || [],
    required_skills: (post.tags || []).map(String),
    nice_skills: [],
    min_years: minYears != null ? Number(minYears) : undefined,
    type: post.type || undefined,
  };
}
