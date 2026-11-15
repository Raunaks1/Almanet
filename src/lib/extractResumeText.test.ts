/**
 * Tests for the pdf.js line-rebuild logic.
 *
 * Uses fake text items with explicit transform coordinates so no real
 * document or extracted text ever touches the repo. Never logs resume content.
 */

import { describe, it, expect } from 'vitest';
import { rebuildPageLines, type PdfTextItem } from './extractResumeText';

function makeItem(
  str: string,
  x: number,
  y: number,
  fontSize = 12,
  hasEOL = false,
): PdfTextItem {
  return {
    str,
    transform: [1, 0, 0, fontSize, x, y],
    fontName: 'F1',
    height: fontSize,
    hasEOL,
    dir: 'ltr',
    width: 10,
  };
}

describe('rebuildPageLines', () => {
  it('merges items on the same y into a single line, sorted by x', () => {
    const lines = rebuildPageLines([makeItem('World', 60, 100), makeItem('Hello', 0, 100)]);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('Hello World');
    expect(lines[0].y).toBe(100);
  });

  it('starts a new line when the y coordinate changes', () => {
    const lines = rebuildPageLines([makeItem('First', 0, 100), makeItem('Second', 0, 112)]);
    expect(lines.map((l) => l.text)).toEqual(['First', 'Second']);
  });

  it('does not insert a space for close items (kerning-style splits)', () => {
    const lines = rebuildPageLines([makeItem('Hello', 0, 100), makeItem('World', 0.5, 100)]);
    expect(lines[0].text).toBe('HelloWorld');
  });

  it('inserts a space when the horizontal gap is large enough', () => {
    const lines = rebuildPageLines([makeItem('Hello', 0, 100), makeItem('World', 60, 100)]);
    expect(lines[0].text).toBe('Hello World');
  });

  it('adds a blank line between paragraphs when the vertical gap is large', () => {
    const lines = rebuildPageLines([makeItem('First', 0, 100), makeItem('Second', 0, 200)]);
    expect(lines.map((l) => l.text)).toEqual(['First', '', 'Second']);
  });

  it('handles hasEOL as a line break', () => {
    const lines = rebuildPageLines([makeItem('First', 0, 100, 12, true), makeItem('Second', 0, 100, 12, true)]);
    expect(lines.map((l) => l.text)).toEqual(['First', 'Second']);
  });

  it('returns an empty array for no items', () => {
    expect(rebuildPageLines([])).toEqual([]);
  });
});
