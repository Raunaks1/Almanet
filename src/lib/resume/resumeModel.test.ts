/**
 * Unit tests for the structured resume model — parse + serialise round-trip.
 * Pure, deterministic, runs in the browser (vitest, node environment).
 */

import { describe, it, expect } from 'vitest';
import { emptyResumeData, parseResume, serializeResume } from './resumeModel';

const SAMPLE = `Priya Sharma
priya@example.com | Bengaluru, India

Summary
Full stack developer with 2 years of experience building web apps.

Experience
Software Engineer Intern
Acme Corp | Bengaluru
Jan 2024 - Present
• Built a React dashboard with Node.js.
• Reduced load time by 35%.

Projects
E-Commerce Platform
React, Node.js, PostgreSQL
• Implemented JWT authentication.
• Deployed to AWS.

Education
University of Mumbai
B.Tech, Computer Engineering
2020 - 2024
• CGPA 8.6/10

Skills
React, Node.js, PostgreSQL, JavaScript
`;

describe('parseResume', () => {
  it('extracts the header (name, headline, contact)', () => {
    const data = parseResume(SAMPLE);
    expect(data.name).toBe('Priya Sharma');
    expect(data.headline).toBe('Software Engineer Intern');
    expect(data.contact).toEqual(['priya@example.com | Bengaluru, India']);
  });

  it('parses experience entries with title, company, dates and bullets', () => {
    const data = parseResume(SAMPLE);
    expect(data.experience).toHaveLength(1);
    const [role] = data.experience;
    expect(role.title).toBe('Software Engineer Intern');
    expect(role.company).toBe('Acme Corp');
    expect(role.location).toBe('Bengaluru');
    expect(role.startDate).toBe('Jan 2024');
    expect(role.endDate).toBe('Present');
    expect(role.bullets).toEqual([
      'Built a React dashboard with Node.js.',
      'Reduced load time by 35%.',
    ]);
  });

  it('parses projects, education, skills and summary', () => {
    const data = parseResume(SAMPLE);
    expect(data.projects).toHaveLength(1);
    expect(data.projects[0].title).toBe('E-Commerce Platform');
    expect(data.projects[0].bullets).toEqual([
      'Implemented JWT authentication.',
      'Deployed to AWS.',
    ]);

    expect(data.education).toHaveLength(1);
    expect(data.education[0].school).toBe('University of Mumbai');
    expect(data.education[0].degree).toBe('B.Tech, Computer Engineering');
    expect(data.education[0].dates).toBe('2020 - 2024');

    expect(data.skills).toEqual(['React', 'Node.js', 'PostgreSQL', 'JavaScript']);
    expect(data.summary).toBe(
      'Full stack developer with 2 years of experience building web apps.',
    );
  });

  it('returns empty data for empty text', () => {
    expect(parseResume('')).toEqual(emptyResumeData());
  });
});

describe('serializeResume', () => {
  it('renders the structured data back to ATS-friendly text', () => {
    const text = serializeResume(parseResume(SAMPLE));
    expect(text).toContain('Priya Sharma');
    expect(text).toContain('Experience');
    expect(text).toContain('Software Engineer Intern');
    expect(text).toContain('Acme Corp | Bengaluru');
    expect(text).toContain('• Built a React dashboard with Node.js.');
    expect(text).toContain('Skills');
    expect(text).toContain('React, Node.js, PostgreSQL, JavaScript');
  });
});

describe('round-trip', () => {
  it('parse → serialize → parse preserves the structured data', () => {
    const once = parseResume(SAMPLE);
    const twice = parseResume(serializeResume(once));
    expect(twice).toEqual(once);
  });

  it('round-trips a resume without a summary or projects', () => {
    const minimal = `Demo User
demo@example.com

Experience
Project Lead
Acme Corp
2022 - 2024
• Led a team of 4.

Skills
React, TypeScript
`;
    const once = parseResume(minimal);
    const twice = parseResume(serializeResume(once));
    expect(twice).toEqual(once);
  });
});
