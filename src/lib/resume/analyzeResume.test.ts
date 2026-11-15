/**
 * Unit tests for analyzeResume.
 * Pure, deterministic, runs in the browser (vitest, node environment).
 */

import { describe, it, expect } from 'vitest';
import { analyzeResume, labelForScore, type AnalysisJob } from './analyzeResume';
import { findKeywords } from './skillDictionary';
import { detectSections, splitBullets, extractJobTitle } from './textUtils';

const baseJob: AnalysisJob = {
  title: 'Full Stack Developer',
  company: 'Acme Corp',
  description: 'Build web applications with React, Node.js and PostgreSQL. Work with REST APIs.',
  requirements: ['React', 'Node.js'],
  required_skills: ['React', 'Node.js', 'JavaScript'],
  nice_skills: ['PostgreSQL', 'TypeScript'],
  min_years: 1,
};

const devResume = `
John Doe
john.doe@example.com | +91 98765 43210 | Mumbai, India

Summary
Full stack developer with experience building web applications.

Experience
Built a React frontend with Node.js and Express backend.
Developed REST APIs and integrated PostgreSQL database.
Reduced page load time by 35%.

Projects
E-Commerce Platform: Developed a React frontend with Node.js.
Implemented JWT authentication and role-based access control.

Skills
JavaScript, TypeScript, React, Node.js, PostgreSQL, Git, Docker
`;

describe('findKeywords matching rules', () => {
  it('does not match "java" inside "javascript"', () => {
    const hits = findKeywords('I know javascript and java.');
    const java = hits.find((h) => h.canonical === 'Java');
    const js = hits.find((h) => h.canonical === 'JavaScript');
    expect(java).toBeDefined();
    expect(java!.count).toBe(1);
    expect(js!.count).toBe(1);
  });

  it('maps aliases to the canonical name', () => {
    const hits = findKeywords('react js node.js c++ c#');
    expect(hits.find((h) => h.canonical === 'React')).toBeDefined();
    expect(hits.find((h) => h.canonical === 'Node.js')).toBeDefined();
    expect(hits.find((h) => h.canonical === 'C++')).toBeDefined();
    expect(hits.find((h) => h.canonical === 'C#')).toBeDefined();
  });

  it('detects c++ and node.js', () => {
    const hits = findKeywords('C++ and node.js developer');
    expect(hits.find((h) => h.canonical === 'C++')).toBeDefined();
    expect(hits.find((h) => h.canonical === 'Node.js')).toBeDefined();
  });

  it('does not match bare "go" as a verb', () => {
    const hits = findKeywords('I will go home now');
    expect(hits.find((h) => h.canonical === 'Go')).toBeUndefined();
  });

  it('matches go via golang phrase', () => {
    const hits = findKeywords('Golang backend service');
    expect(hits.find((h) => h.canonical === 'Go')).toBeDefined();
  });
});

describe('analyzeResume core behavior', () => {
  it('scores a developer resume higher against a developer job than an unrelated job', () => {
    const dev = analyzeResume(devResume, baseJob);
    const unrelated = analyzeResume(devResume, {
      ...baseJob,
      title: 'Quantitative Analyst',
      company: 'Bank',
      required_skills: ['Python', 'SQL', 'Statistics'],
      nice_skills: ['Excel', 'Financial Modeling'],
      description: 'Build statistical models for risk and trading desks. Analyze market data.',
    });
    expect(dev.score).toBeGreaterThan(unrelated.score);
  });

  it('keyword stuffing does not raise the score beyond 3 counts', () => {
    const stuffed = 'React React React React React React React';
    const normal = 'React';
    const job: AnalysisJob = {
      title: 'Developer',
      company: 'C',
      required_skills: ['React'],
    };
    const stuffedScore = analyzeResume(`${devResume}\n${stuffed}`, job).score;
    const normalScore = analyzeResume(`${devResume}\n${normal}`, job).score;
    expect(stuffedScore).toBe(normalScore);
  });

  it('missing keywords come from the description, not the title', () => {
    const job: AnalysisJob = {
      title: 'Associate Product Manager, University Graduate 2027',
      company: 'Acme Corp',
      required_skills: [],
      nice_skills: [],
      description: 'Build web applications with React, Node.js and PostgreSQL. Work with REST APIs.',
      min_years: 1,
    };
    const res = analyzeResume(devResume, job);

    // Title words should NOT appear as missing keywords
    const missingCanonicals = res.missing.map((m) => m.canonical);
    expect(missingCanonicals).not.toContain('Associate');
    expect(missingCanonicals).not.toContain('Product');
    expect(missingCanonicals).not.toContain('Manager');
    expect(missingCanonicals).not.toContain('University');
    expect(missingCanonicals).not.toContain('Graduate');
    expect(missingCanonicals).not.toContain('2027');

    // Description keywords that ARE in the resume should be matched
    const matchedCanonicals = res.matched.map((m) => m.canonical);
    expect(matchedCanonicals).toContain('React');
    expect(matchedCanonicals).toContain('Node.js');
    expect(matchedCanonicals).toContain('PostgreSQL');
  });

  it('adding a genuinely matched keyword never lowers the score', () => {
    const job: AnalysisJob = {
      title: 'Developer',
      company: 'C',
      required_skills: ['Python'],
    };
    const without = analyzeResume('I know JavaScript.', job).score;
    const withPy = analyzeResume('I know JavaScript and Python.', job).score;
    expect(withPy).toBeGreaterThanOrEqual(without);
  });

  it('empty text gives a low score without crashing', () => {
    const res = analyzeResume('', baseJob);
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeLessThanOrEqual(100);
    expect(res.label).toBe('Poor Match');
  });

  it('a job without a description still scores', () => {
    const res = analyzeResume(devResume, {
      title: 'Developer',
      company: 'C',
      required_skills: ['React'],
      description: undefined,
    });
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeLessThanOrEqual(100);
    expect(res.noDescription).toBe(true);
  });

  it('scores stay within 0 to 100', () => {
    const res = analyzeResume(devResume, baseJob);
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeLessThanOrEqual(100);
  });

  it('label thresholds are correct', () => {
    expect(labelForScore(0)).toBe('Poor Match');
    expect(labelForScore(39)).toBe('Poor Match');
    expect(labelForScore(40)).toBe('Fair Match');
    expect(labelForScore(59)).toBe('Fair Match');
    expect(labelForScore(60)).toBe('Good Match');
    expect(labelForScore(79)).toBe('Good Match');
    expect(labelForScore(80)).toBe('Excellent Match');
    expect(labelForScore(100)).toBe('Excellent Match');
  });
});

describe('weak findings and offsets', () => {
  it('weak phrase offsets point at the exact text', () => {
    const text = 'I worked on a project and helped the team.';
    const res = analyzeResume(text, baseJob);
    const weakVerb = res.weak.find((w) => w.kind === 'weak-verb' && w.text === 'worked on');
    expect(weakVerb).toBeDefined();
    expect(text.slice(weakVerb!.start, weakVerb!.end)).toBe('worked on');
  });

  it('bullets with numbers are not flagged no-metric', () => {
    const res = analyzeResume('Built a system that reduced load time by 35%.', baseJob);
    const noMetric = res.weak.find((w) => w.kind === 'no-metric');
    expect(noMetric).toBeUndefined();
  });

  it('bullets over 35 words are flagged long-bullet', () => {
    const longBullet = '• ' + 'word '.repeat(40);
    const res = analyzeResume(longBullet, baseJob);
    expect(res.weak.some((w) => w.kind === 'long-bullet')).toBe(true);
  });
});

describe('sections and utilities', () => {
  it('sections are detected', () => {
    const sections = detectSections(devResume);
    const names = sections.map((s) => s.name.toLowerCase());
    expect(names.some((n) => /experience/.test(n))).toBe(true);
    expect(names.some((n) => /skills/.test(n))).toBe(true);
    expect(names.some((n) => /education|projects/.test(n))).toBe(true);
  });

  it('bullet splitting preserves offsets', () => {
    const source = '• Built a react app.\n- Developed an api.\n';
    const bullets = splitBullets(source);
    expect(bullets.length).toBeGreaterThan(0);
    for (const b of bullets) {
      expect(source.slice(b.start, b.end).trim().length).toBeGreaterThan(0);
    }
  });
});

describe('performance', () => {
  it('analysis of a 3000-word text finishes well under 100 ms', () => {
    const words = Array(3000).fill('React Node JavaScript developer').join(' ');
    const start = performance.now();
    analyzeResume(words, baseJob);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});

describe('extractJobTitle', () => {
  it('extracts the first line after an Experience heading as the job title', () => {
    const resume = `
John Doe
john.doe@example.com | Mumbai, India

Experience
Software Engineer Intern
Tech Corp | Bangalore
Jan 2024 - Present
• Built a React frontend with Node.js.
• Reduced load time by 35%.

Education
B.Tech, University of Mumbai
`;
    const title = extractJobTitle(resume);
    expect(title).toBe('Software Engineer Intern');
  });

  it('extracts the job title from a Projects section when no Experience section exists', () => {
    const resume = `
Jane Smith
jane@example.com | Delhi, India

Projects
E-Commerce Platform
Developed a React frontend with Node.js.
Implemented JWT authentication.

Skills
JavaScript, React
`;
    const title = extractJobTitle(resume);
    expect(title).toBe('E-Commerce Platform');
  });

  it('skips bullet lines and date lines when looking for a job title', () => {
    const resume = `
Bob Wilson
bob@example.com | Pune, India

Experience
• Built a React frontend with Node.js.
• Reduced load time by 35%.
Jan 2024 - Present
Software Engineer
Tech Corp
`;
    const title = extractJobTitle(resume);
    expect(title).toBe('Software Engineer');
  });

  it('returns empty string for a resume with no recognizable sections', () => {
    const resume = 'Just some random text without any sections.';
    const title = extractJobTitle(resume);
    expect(title).toBe('Just some random text without any sections.');
  });

  it('handles empty text without crashing', () => {
    const title = extractJobTitle('');
    expect(title).toBe('');
  });
});

/* ═════════════════════════════════════════════════════════════════════
   REGRESSION TESTS — blank-page crash on Optimise analysis flow
   ═════════════════════════════════════════════════════════════════════ */

import { buildSegments } from '../../components/resume/ResumeHighlight';
import type { MatchedKeyword } from './analyzeResume';
import type { WeakFinding } from './analyzeResume';

describe('REGRESSION: special-character skills in job and resume', () => {
  const specialSkills = [
    'C++', 'C#', '.NET', 'Node.js', 'R', 'Go', '(AWS)', '[SQL]', 'Vue.js', 'ASP.NET Core',
  ];

  it.each(specialSkills)('matches "%s" skill in job required_skills and resume text', (skill) => {
    const job: AnalysisJob = {
      title: 'Developer',
      company: 'Acme',
      required_skills: [skill],
      nice_skills: [],
      description: `Experience with ${skill} required.`,
    };
    const resume = `I know ${skill}.`;
    let threw = false;
    let result: ReturnType<typeof analyzeResume> | null = null;
    try {
      result = analyzeResume(resume, job);
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });

  it('matches all special skills at once', () => {
    const job: AnalysisJob = {
      title: 'Developer',
      company: 'Acme',
      required_skills: specialSkills,
      nice_skills: [],
      description: 'We need C++, C#, .NET, Node.js, R, Go, (AWS), [SQL], Vue.js, ASP.NET Core.',
    };
    const resume = 'C++ C# .NET Node.js R Go (AWS) [SQL] Vue.js ASP.NET Core';
    let threw = false;
    try {
      analyzeResume(resume, job);
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });

  it('does not throw when bare short tokens are common English words', () => {
    const job: AnalysisJob = {
      title: 'Developer',
      company: 'Acme',
      required_skills: ['Go', 'R', 'C'],
      nice_skills: [],
      description: 'We need Go, R, and C developers.',
    };
    const resume = 'I will go home now. R is a letter. C is a note.';
    let threw = false;
    try {
      analyzeResume(resume, job);
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });
});

describe('REGRESSION: null / undefined / wrong-typed fields', () => {
  const baseResume = 'John Doe john@example.com Built a React frontend with Node.js.';

  it('null requirements does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: 'C', required_skills: [],
        description: 'x', requirements: null as unknown as string[],
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('string requirements does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: 'C', required_skills: [],
        description: 'x', requirements: 'React' as unknown as string[],
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('number requirements does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: 'C', required_skills: [],
        description: 'x', requirements: 42 as unknown as string[],
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('null required_skills does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: 'C',
        required_skills: null as unknown as string[], nice_skills: [],
        description: 'x',
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('string required_skills does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: 'C',
        required_skills: 'React' as unknown as string[], nice_skills: [],
        description: 'x',
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('null description does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: 'C', required_skills: [],
        description: null as unknown as string,
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('undefined description does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: 'C', required_skills: [],
        description: undefined,
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('empty description does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: 'C', required_skills: [],
        description: '',
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('null title does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: null as unknown as string, company: 'C', required_skills: [],
        description: 'x',
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('null company does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: null as unknown as string, required_skills: [],
        description: 'x',
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('null min_years does not throw', () => {
    let threw = false;
    try {
      analyzeResume(baseResume, {
        title: 'Developer', company: 'C', required_skills: [],
        description: 'x', min_years: null as unknown as number,
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('null resume text does not throw', () => {
    let threw = false;
    try {
      analyzeResume(null as unknown as string, {
        title: 'Developer', company: 'C', required_skills: ['React'],
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('undefined resume text does not throw', () => {
    let threw = false;
    try {
      analyzeResume(undefined as unknown as string, {
        title: 'Developer', company: 'C', required_skills: ['React'],
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('number resume text does not throw', () => {
    let threw = false;
    try {
      analyzeResume(123 as unknown as string, {
        title: 'Developer', company: 'C', required_skills: ['React'],
      });
    } catch { threw = true; }
    expect(threw).toBe(false);
  });
});

describe('REGRESSION: extreme text inputs', () => {
  const baseJob: AnalysisJob = {
    title: 'Developer', company: 'C', required_skills: ['React', 'Node.js'],
    description: 'Build web applications with React, Node.js and PostgreSQL.',
    requirements: ['React', 'Node.js'],
    nice_skills: [],
    min_years: 1,
  };

  it('100,000 character text does not throw', () => {
    const longText = 'React Node.js developer '.repeat(10000);
    let threw = false;
    let score: number | null = null;
    try {
      score = analyzeResume(longText, baseJob).score;
    } catch { threw = true; }
    expect(threw).toBe(false);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('emoji text does not throw', () => {
    let threw = false;
    try {
      analyzeResume('🚀 React 👨‍💻 Node.js 🎯 Built a great app!', baseJob);
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('RTL text does not throw', () => {
    let threw = false;
    try {
      analyzeResume('مرحبا React Node.js 개발자 Built a frontend.', baseJob);
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('text with no line breaks does not throw', () => {
    let threw = false;
    try {
      analyzeResume('Built a React frontend with Node.js and Express backend. Developed REST APIs and integrated PostgreSQL database.', baseJob);
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('text with form feeds and weird whitespace does not throw', () => {
    let threw = false;
    try {
      analyzeResume('React\r\nNode.js\tPostgreSQL\x0cBuilt a \x00 app.', baseJob);
    } catch { threw = true; }
    expect(threw).toBe(false);
  });
});

describe('REGRESSION: score always within 0-100', () => {
  it('never returns a score outside 0-100 for any input', () => {
    const jobs: AnalysisJob[] = [
      { title: 'Developer', company: 'C', required_skills: ['React'], description: 'React developer needed' },
      { title: '', company: '', required_skills: [], description: undefined },
      { title: 'C++ Engineer', company: 'Acme', required_skills: ['C++', '.NET'], description: 'C++ and .NET required' },
    ];
    const resumes: string[] = [
      '',
      'I know React and C++.',
      null as unknown as string,
      '🚀 ' + 'x '.repeat(50000),
      'مرحبا React Node.js',
      'Built a React frontend with Node.js. Developed REST APIs.',
    ];
    for (const job of jobs) {
      for (const resume of resumes) {
        let threw = false;
        let score: number | null = null;
        try {
          score = analyzeResume(resume, job).score;
        } catch { threw = true; }
        expect(threw).toBe(false);
        if (score !== null) {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});

describe('REGRESSION: highlight range merging', () => {
  const mk = (canonical: string, start: number, _end: number): MatchedKeyword => ({
    canonical,
    weight: 1,
    source: 'required',
    where: 'test',
    count: 1,
    inBullet: false,
    offsets: [start],
  });

  const wf = (start: number, _end: number, text: string, suggestion = 'fix'): WeakFinding => ({
    start, end: _end, text, kind: 'weak-verb', suggestion,
  });

  it('merges overlapping matched ranges', () => {
    const segments = buildSegments('abcdef', [
      mk('abc', 0, 3),
      mk('cde', 2, 5),
    ], []);
    const matched = segments.filter((s) => s.kind === 'matched');
    expect(segments.length).toBeGreaterThan(0);
    // Points: 0, 2, 3, 5, 6 → segments "ab", "c", "de", "f"
    expect(matched.some((s) => s.text === 'ab')).toBe(true);
    expect(matched.some((s) => s.text === 'c')).toBe(true);
    expect(matched.some((s) => s.text === 'de')).toBe(true);
  });

  it('clamps out-of-range ranges', () => {
    let threw = false;
    try {
      buildSegments('hello', [
        mk('x', -5, 100),
      ], []);
    } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('weak findings take precedence over matched on overlap', () => {
    const segments = buildSegments('worked on it', [], [
      wf(0, 10, 'worked on'),
    ]);
    const weak = segments.filter((s) => s.kind === 'weak');
    expect(weak.length).toBeGreaterThan(0);
    // buildSegments slices text[0:10] = "worked on " (includes trailing space)
    expect(weak[0].text).toBe('worked on ');
  });

  it('handles empty text and empty marks', () => {
    let threw = false;
    let result: ReturnType<typeof buildSegments> | null = null;
    try {
      result = buildSegments('', [], []);
    } catch { threw = true; }
    expect(threw).toBe(false);
    expect(result).toEqual([]);
  });

  it('handles duplicate ranges', () => {
    let threw = false;
    try {
      buildSegments('hello world', [
        mk('hello', 0, 5),
        mk('hello', 0, 5),
      ], []);
    } catch { threw = true; }
    expect(threw).toBe(false);
  });
});

describe('REGRESSION: fuzz test — analyzeResume never throws', () => {
  const titles = ['Developer', 'Engineer', 'C++ Programmer', 'React Developer', 'Data Scientist', null];
  const companies = ['Acme', 'TechCorp', '', null];
  const descriptions = [
    'Build web apps with React and Node.js.',
    'C++ and .NET developer needed.',
    '',
    null,
    'We need (AWS) and [SQL] experts.',
  ];
  const skillSets = [
    ['React', 'Node.js'],
    ['C++', '.NET', 'Go'],
    ['Vue.js', 'ASP.NET Core'],
    null,
    undefined,
    'React' as unknown as string[],
  ];
  const resumes = [
    '',
    'I know React and Node.js.',
    'C++ and .NET developer with (AWS) experience.',
    null as unknown as string,
    '🚀 ' + 'x '.repeat(5000),
    'مرحبا React Node.js',
    'Built a React frontend with Node.js and Express backend.',
  ];

  it('never throws over 200 random job/resume combinations and score is 0-100', () => {
    let throws = 0;
    let outOfRange = 0;
    let count = 0;

    for (let i = 0; i < 200; i += 1) {
      const job: AnalysisJob = {
        title: titles[i % titles.length] || 'Developer',
        company: companies[i % companies.length] || 'Acme',
        description: descriptions[i % descriptions.length] || undefined,
        requirements: skillSets[i % skillSets.length] as unknown as string[] | undefined,
        required_skills: skillSets[(i + 1) % skillSets.length] as unknown as string[],
        nice_skills: [],
        min_years: i % 3 === 0 ? undefined : i % 5,
      };
      const resume = resumes[i % resumes.length];

      try {
        const result = analyzeResume(resume, job);
        count += 1;
        if (result.score < 0 || result.score > 100) outOfRange += 1;
      } catch {
        throws += 1;
      }
    }

    expect(throws).toBe(0);
    expect(outOfRange).toBe(0);
    expect(count).toBe(200);
  });
});
