/**
 * pickViewer — decides which viewer to use for a resume file.
 *
 * Pure function. Mime type wins; falls back to the file extension
 * (case-insensitive) when mime type is missing or unrecognized.
 *
 * Returns 'pdf' | 'docx' | 'unsupported'.
 */

export type ViewerKind = 'pdf' | 'docx' | 'unsupported';

const EXT_TO_VIEWER: Record<string, ViewerKind> = {
  pdf: 'pdf',
  docx: 'docx',
};

function getExt(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  if (idx < 0) return '';
  return fileName.slice(idx + 1).toLowerCase();
}

export function pickViewer(mimeType: string | null, fileName: string): ViewerKind {
  const mime = (mimeType || '').toLowerCase();

  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('vnd.openxmlformats-officedocument.wordprocessingml')) return 'docx';
  if (mime === 'application/msword') return 'docx';

  // Fall back to extension.
  const ext = getExt(fileName);
  if (ext) {
    const fromExt = EXT_TO_VIEWER[ext];
    if (fromExt) return fromExt;
  }

  return 'unsupported';
}
