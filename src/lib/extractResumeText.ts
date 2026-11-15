/**
 * Extract plain text from a PDF or DOCX file in the browser.
 *
 * PDF: pdf.js — rebuilds lines from text-item geometry (y/x transform
 * coordinates) so line breaks, paragraph gaps and multi-column layouts are
 * preserved instead of being flattened into one long line.
 * DOCX: mammoth.extractRawText — paragraph breaks become \n.
 * Whitespace is normalised; private-use/icon-font glyphs are stripped;
 * ligatures and non-breaking spaces are normalised. Never logs the extracted
 * text to the console.
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export type PdfTextItem = {
  str: string;
  transform: number[];
  fontName: string;
  height: number;
  hasEOL: boolean;
  dir: string;
  width: number;
};

// Dynamic imports keep the main bundle small — only loaded when a file is picked.
let pdfjsLib: typeof import('pdfjs-dist') | null = null;
let mammoth: typeof import('mammoth') | null = null;

async function loadPdfJs(): Promise<typeof import('pdfjs-dist')> {
  if (!pdfjsLib) {
    const mod = await import('pdfjs-dist');
    pdfjsLib = mod;
    const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  return pdfjsLib;
}

export { loadPdfJs };

async function loadMammoth(): Promise<typeof import('mammoth')> {
  if (!mammoth) {
    mammoth = await import('mammoth');
  }
  return mammoth;
}

/** Strip Unicode private-use area characters (icon-font glyphs etc.). */
function stripPrivateUse(str: string): string {
  const chars: string[] = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0;
    const isPrivate =
      (cp >= 0xe000 && cp <= 0xf8ff) || (cp >= 0x10000 && cp <= 0x1fffd) || (cp >= 0x100000 && cp <= 0x10fffd);
    if (!isPrivate) chars.push(ch);
  }
  return chars.join('');
}

/** Known bullet / icon-font glyphs that may appear at line start. */
const BULLET_GLYPH_RE = /^[•●◦▪▫‣⁃–—−]+\s*/;

/** Ligature normalisation map. */
const LIGATURES: Record<string, string> = {
  '\ufb00': 'ff',
  '\ufb01': 'fi',
  '\ufb02': 'fl',
  '\ufb03': 'ffi',
  '\ufb04': 'ffl',
  '\ufb05': 'ft',
  '\ufb06': 'st',
};

/** Normalise a raw text item string: ligatures, NBSP, private-use glyphs. */
function normaliseItem(str: string): string {
  let out = str;
  for (const [k, v] of Object.entries(LIGATURES)) {
    out = out.split(k).join(v);
  }
  out = out.replace(/\u00a0/g, ' ');
  out = stripPrivateUse(out);
  return out;
}

/**
 * Rebuild lines from pdf.js text items using geometry.
 *
 * Groups items into lines by their y coordinate (transform[5]) with a
 * tolerance of ~40% of the font height; sorts each line's items by x
 * (transform[4]); inserts a single space between items only when the
 * horizontal gap exceeds ~15% of the font height (so kerning splits don't
 * add spaces inside words); starts a new line when y changes; adds a blank
 * line when the vertical gap exceeds ~1.5x the line height; respects hasEOL.
 *
 * Removes hyphenation artifacts: when a line ends with "-" and the next
 * line starts with a lowercase letter, the hyphen is removed and the lines
 * are joined.
 *
 * Returns line objects with { text, x, y } for column detection.
 */
export function rebuildPageLines(items: PdfTextItem[]): Array<{ text: string; x: number; y: number }> {
  if (items.length === 0) return [];

  // Normalise and attach geometry.
  const normalized = items
    .map((item) => {
      const text = normaliseItem(item.str);
      if (!text.trim()) return null;
      const transform = item.transform || [0, 0, 0, 0, 0, 0];
      const x = transform[4];
      const y = transform[5];
      // font height from transform scaleY (d) or item.height
      const fontHeight = Math.abs((item.transform && item.transform[3]) || item.height || 10);
      // Use actual advance width from pdf.js when available.
      const advance = item.width || text.trim().length * 0.6 * fontHeight;
      return { text, x, y, fontHeight, advance, hasEOL: Boolean(item.hasEOL) };
    })
    .filter(Boolean) as Array<{ text: string; x: number; y: number; fontHeight: number; advance: number; hasEOL: boolean }>;

  // Sort by y then x.
  normalized.sort((a, b) => {
    const dy = a.y - b.y;
    if (Math.abs(dy) > 1) return dy;
    return a.x - b.x;
  });

  const lines: Array<{ text: string; y: number; fontHeight: number; lastX: number }> = [];
  let current: { text: string; y: number; fontHeight: number; lastX: number } | null = null;
  let prevLineY: number | null = null;

  const pushLine = () => {
    if (!current) return;
    const gap = prevLineY !== null ? current.y - prevLineY : 0;
    if (gap > current.fontHeight * 1.5) {
      lines.push({ text: '', y: prevLineY ?? current.y, fontHeight: current.fontHeight, lastX: current.lastX });
    }
    lines.push(current);
    prevLineY = current.y;
  };

  for (const item of normalized) {
    // Decide if this item starts a new line.
    const newLine =
      current === null ||
      item.hasEOL ||
      (current !== null && item.y - current.y > current.fontHeight * 0.6); // new line by y

    if (newLine) {
      pushLine();
      current = { text: item.text.trim(), y: item.y, fontHeight: item.fontHeight, lastX: item.x + item.advance };
    } else {
      // Same line: insert space if horizontal gap is large enough.
      if (!current) continue;
      const gap = item.x - current.lastX;
      const spaceThreshold = current.fontHeight * 0.15;
      const separator = gap > spaceThreshold ? ' ' : '';
      current.text = current.text + separator + item.text.trim();
      current.lastX = item.x + item.advance;
    }
  }
  pushLine();

  const result = lines.map((l) => ({ text: l.text, x: l.lastX - l.text.length * 0.6 * l.fontHeight, y: l.y }));

  // Remove hyphenation artifacts: if a line ends with "-" and the next line
  // starts with a lowercase letter, join them without the hyphen.
  for (let i = 0; i < result.length - 1; i += 1) {
    const line = result[i];
    const next = result[i + 1];
    if (line.text.endsWith('-') && /^[a-z]/.test(next.text.trim())) {
      line.text = line.text.slice(0, -1) + next.text.trim();
      result.splice(i + 1, 1);
      i -= 1; // re-check this line against the new next
    }
  }

  return result;
}

/** Read all pages of a PDF and return text with real line breaks. */
async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf: PDFDocumentProxy = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page: PDFPageProxy = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as unknown as PdfTextItem[];

    // Rebuild lines with geometry.
    const pageLines = rebuildPageLines(items).filter((l) => l.text.length > 0);

    // Multi-column detection: cluster line x-positions; if two stable
    // clusters with a gap > 60px exist, read left column then right column.
    let columnGroups: Array<Array<{ text: string; x: number; y: number }>> = [pageLines];
    if (pageLines.length >= 4) {
      const xs = pageLines.map((l) => l.x).sort((a, b) => a - b);
      const gaps: number[] = [];
      for (let k = 1; k < xs.length; k += 1) gaps.push(xs[k] - xs[k - 1]);
      gaps.sort((a, b) => b - a);
      const biggest = gaps[0];
      const median = gaps[Math.floor(gaps.length / 2)] || 1;
      if (biggest > median * 3 && biggest > 60) {
        const gutter = (xs[Math.floor(xs.length / 2 - 1)] + xs[Math.floor(xs.length / 2)]) / 2;
        columnGroups = [
          pageLines.filter((l) => l.x < gutter),
          pageLines.filter((l) => l.x >= gutter),
        ];
      }
    }

    const pageText = columnGroups
      .map((col) => col.map((l) => l.text).join('\n'))
      .join('\n');

    pages.push(pageText);
  }

  return pages.join('\n\n'); // blank line between pages
}

/** Extract raw text from a DOCX file — paragraph breaks become \n. */
async function extractDocxText(file: File): Promise<string> {
  const mod = await loadMammoth();
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mod.extractRawText({ arrayBuffer });
  // mammoth already joins paragraphs with \n; normalise but keep line breaks.
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/** Collapse runs of horizontal whitespace (not newlines) and trim. */
function normaliseWhitespaceKeepLines(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // collapse 3+ newlines to 2
    .trim();
}

/**
 * Strip private-use/icon-font glyphs and normalise bullet glyphs at line start.
 * Also normalise ligatures and non-breaking spaces already handled per-item.
 */
function cleanLines(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      // Strip private-use glyphs.
      let cleaned = stripPrivateUse(line);
      // Replace leading bullet glyphs with a clean "• ".
      cleaned = cleaned.replace(BULLET_GLYPH_RE, '• ');
      return cleaned;
    })
    .join('\n');
}

/**
 * Extract plain text from a PDF or DOCX file.
 * Returns an empty string if the file type is unsupported or extraction fails.
 * Never logs the extracted text to the console.
 */
export async function extractResumeText(file: File): Promise<string> {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  try {
    let raw = '';
    if (ext === '.pdf') {
      raw = await extractPdfText(file);
    } else if (ext === '.docx') {
      raw = await extractDocxText(file);
    } else {
      return '';
    }

    // Normalise whitespace per line, clean glyphs, collapse excess blank lines.
    return cleanLines(normaliseWhitespaceKeepLines(raw));
  } catch {
    return '';
  }
}
