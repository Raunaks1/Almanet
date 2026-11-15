/**
 * Unit tests for normaliseRootMargin.
 * Ensures every returned value is safe to pass to the IntersectionObserver
 * constructor (1–4 values, each ending in px or %).
 */

import { describe, it, expect } from 'vitest';
import { normaliseRootMargin } from './utils';

function isValidRootMargin(value: string): boolean {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || parts.length > 4) return false;
  return parts.every((p) => /^-?\d+(?:\.\d+)?(px|%)$/.test(p));
}

describe('normaliseRootMargin', () => {
  const inputs: Array<string | number | undefined | null> = [
    '0',
    '-40',
    '0 0 -40',
    100,
    '0px 0px -40px 0px',
    '10%',
    '',
    undefined,
    'abc',
    '100vh 0px', // unknown unit → coerce to px
    '1.5em 2rem', // unknown units → coerce to px
    null,
  ];

  it.each(inputs)('normalises %s to a valid rootMargin string', (input) => {
    const result = normaliseRootMargin(input);
    expect(typeof result).toBe('string');
    expect(isValidRootMargin(result)).toBe(true);

    // Prove it by actually constructing an IntersectionObserver with it.
    if (typeof IntersectionObserver !== 'undefined') {
      let threw = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const io = new IntersectionObserver(() => {}, { rootMargin: result });
        io.disconnect();
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    }
  });

  it('converts bare numbers to px', () => {
    expect(normaliseRootMargin(0)).toBe('0px');
    expect(normaliseRootMargin(42)).toBe('42px');
    expect(normaliseRootMargin(-10)).toBe('-10px');
  });

  it('keeps valid px and % values unchanged', () => {
    expect(normaliseRootMargin('0px 0px -40px 0px')).toBe('0px 0px -40px 0px');
    expect(normaliseRootMargin('10%')).toBe('10%');
    expect(normaliseRootMargin('50% 0px')).toBe('50% 0px');
  });

  it('coerces unknown units to px', () => {
    expect(normaliseRootMargin('100vh 0px')).toBe('100px 0px');
    expect(normaliseRootMargin('1.5em 2rem')).toBe('1.5px 2px');
  });

  it('falls back to "0px" for empty or unparseable input', () => {
    expect(normaliseRootMargin('')).toBe('0px');
    expect(normaliseRootMargin(undefined)).toBe('0px');
    expect(normaliseRootMargin(null)).toBe('0px');
    expect(normaliseRootMargin('abc')).toBe('0px');
    expect(normaliseRootMargin('')).toBe('0px');
  });

  it('never returns more than 4 values', () => {
    const result = normaliseRootMargin('1px 2px 3px 4px 5px');
    const parts = result.split(/\s+/).filter(Boolean);
    expect(parts.length).toBeLessThanOrEqual(4);
  });
});
