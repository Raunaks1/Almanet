/**
 * pickViewer tests — vitest suite.
 *
 * Cases:
 *   - pdf by mime type
 *   - docx by mime type
 *   - extension fallback (pdf/docx)
 *   - uppercase extension
 *   - null mime → extension fallback
 *   - unknown type → 'unsupported'
 */

import { describe, it, expect } from 'vitest';
import { pickViewer } from './pickViewer';

describe('pickViewer', () => {
  it('returns pdf for pdf mime type', () => {
    expect(pickViewer('application/pdf', 'resume.pdf')).toBe('pdf');
  });

  it('returns docx for docx mime type', () => {
    expect(
      pickViewer(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'resume.docx',
      ),
    ).toBe('docx');
  });

  it('falls back to extension when mime is null', () => {
    expect(pickViewer(null, 'resume.pdf')).toBe('pdf');
    expect(pickViewer(null, 'resume.docx')).toBe('docx');
  });

  it('handles uppercase extensions', () => {
    expect(pickViewer(null, 'resume.PDF')).toBe('pdf');
    expect(pickViewer(null, 'resume.DOCX')).toBe('docx');
  });

  it('returns unsupported for unknown types', () => {
    expect(pickViewer(null, 'resume.txt')).toBe('unsupported');
    expect(pickViewer('image/png', 'resume.png')).toBe('unsupported');
    expect(pickViewer('', 'noextension')).toBe('unsupported');
  });

  it('mime type wins over conflicting extension', () => {
    expect(pickViewer('application/pdf', 'resume.docx')).toBe('pdf');
  });
});
