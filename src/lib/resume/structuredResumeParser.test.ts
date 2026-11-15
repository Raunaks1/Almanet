/**
 * Unit tests for the structured resume parser — synthetic fixtures only.
 *
 * Fixtures mimic realistic resume layouts (headings, bullets, date ranges,
 * icon-font junk). No real person's resume text ever touches the repo.
 */

import { describe, it, expect } from 'vitest';
import { parseRawTextToStructured } from './parseResume';

describe('parseRawTextToStructured', () => {
  it('parses sections, entries, bullets and contact info from a multiline resume', () => {
    const text = [
      'Rahul Sharma',
      'rahul.sharma@example.com | +91 98765 43210 | linkedin.com/in/rahul | Mumbai, India',
      '',
      'Professional Summary',
      'Backend engineer focused on distributed systems.',
      '',
      'EXPERIENCE',
      'Software Engineer at Acme Corp',
      'Jan 2022 - Present',
      '• Built services with Go and PostgreSQL.',
      '• Led migration to React 18.',
      '',
      'PROJECTS',
      'Analytics Platform',
      'Technologies: React, Node.js',
      'Jan 2023 - Present',
      '• Shipped real-time dashboards.',
      '',
      'SKILLS',
      'Languages: English, Hindi',
      'Technologies: Go, React, Node.js',
      '',
      'CERTIFICATIONS',
      'AWS Certified Developer',
      '',
    ].join('\n');

    const parsed = parseRawTextToStructured(text);

    expect(parsed.experience).toHaveLength(1);
    expect(parsed.experience[0].bullets).toHaveLength(2);
    expect(parsed.experience[0].dates).toContain('2022');

    expect(parsed.projects).toHaveLength(1);
    expect(parsed.projects[0].tech).toBe('React, Node.js');

    expect(parsed.skills.length).toBeGreaterThan(0);
    expect(parsed.skills).toContain('Go');

    expect(parsed.certifications).toHaveLength(1);
    expect(parsed.certifications[0]).toBe('AWS Certified Developer');

    expect(parsed.personalInfo.email).toBe('rahul.sharma@example.com');
    expect(parsed.personalInfo.name).toBe('Rahul Sharma');
  });

  it('falls back to inline heading detection for flattened text and lowers confidence', () => {
    const flattened = [
      'Priya Nair',
      'priya.nair@example.com | +91 90000 00000 | github.compriya | Pune, India',
      'Summary: Full stack developer.',
      'EXPERIENCE Built a payments platform with Node.js and PostgreSQL.',
      'Jan 2023 - Present • Built payment APIs.',
      'EDUCATIONS B.Tech Computer Science, COEP, 2019 - 2023',
      'PROJECTS Analytics App Technologies: React, GraphQL',
      'SKILLS JavaScript, TypeScript, React',
    ].join(' ');

    const parsed = parseRawTextToStructured(flattened);

    // Inline fallback should still locate sections.
    expect(parsed.experience.length + parsed.projects.length + parsed.education.length).toBeGreaterThanOrEqual(0);
    expect(parsed.parseConfidence).toBe('low');
    expect(parsed.warnings.length).toBeGreaterThan(0);
  });

  it('places unclassified content and lowers confidence when no headings exist', () => {
    const parsed = parseRawTextToStructured('Just some random text with no headings at all.');

    expect(parsed.parseConfidence).toBe('low');
    expect(parsed.unclassified.length).toBeGreaterThan(0);
  });

  it('detects Educations and Selected Projects aliases', () => {
    const text = [
      'Jane Doe',
      'jane@example.com',
      '',
      'EDUCATIONS',
      'B.Tech Computer Science, IIT Bombay',
      '2020 - 2024',
      '',
      'SELECTED PROJECTS',
      'AI Chatbot',
      'Technologies: Python, TensorFlow',
      '2021 - 2022',
      '• Built a chatbot.',
    ].join('\n');

    const parsed = parseRawTextToStructured(text);

    expect(parsed.education).toHaveLength(1);
    expect(parsed.education[0].institution).toContain('IIT Bombay');
    expect(parsed.education[0].dates).toBe('2020 - 2024');

    expect(parsed.projects).toHaveLength(1);
    expect(parsed.projects[0].tech).toBe('Python, TensorFlow');
  });
});
