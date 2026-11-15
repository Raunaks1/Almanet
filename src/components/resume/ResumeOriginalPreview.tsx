/**
 * ResumeOriginalPreview — renders the uploaded resume file exactly as it is.
 *
 * PDF: signed URL (60 s) → fetch ArrayBuffer → pdf.js → canvas per page,
 *   lazy-rendered near the viewport, scaled to pane width, sharp at 2× device
 *   pixels. Page indicator, zoom controls, per-page aria-labels.
 * DOCX: signed URL → fetch → mammoth.convertToHtml → sanitised HTML in a
 *   sandboxed container. Note that Word files are approximate.
 *
 * Errors: friendly card with Retry + "Open original in a new tab" button.
 * Never logs file bytes or text. Never creates public URLs.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink, FileText, Loader2, RefreshCw, X } from 'lucide-react';
import { getResumeUrl } from '../../lib/resumes';
import { normaliseRootMargin } from '../../lib/utils';
import { Button } from '../ui';
import styles from './ResumeOriginalPreview.module.css';

type ViewerKind = 'pdf' | 'docx' | 'unsupported';

interface ResumeOriginalPreviewProps {
  filePath: string;
  fileName: string;
  mimeType: string | null;
}

function getViewerKind(mimeType: string | null, fileName: string): ViewerKind {
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('vnd.openxmlformats-officedocument.wordprocessingml')) return 'docx';
  if (mime === 'application/msword') return 'docx';
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'docx';
  return 'unsupported';
}

/** Sanitise mammoth HTML output: strip scripts, event handlers, external URLs. */
function sanitiseHtml(html: string): string {
  let out = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  out = out.replace(/\s(on\w+)\s*=\s*("[^"]*"|'[^']*')/gi, '');
  out = out.replace(/\b(href|src)\s*=\s*"https?:\/\/[^"]*"/gi, (match) => {
    const attr = match.startsWith('href="') ? 'href' : 'src';
    return `${attr}=""`;
  });
  return out;
}

export const ResumeOriginalPreview: React.FC<ResumeOriginalPreviewProps> = ({
  filePath,
  fileName,
  mimeType,
}) => {
  const viewer = useMemo(() => getViewerKind(mimeType, fileName), [mimeType, fileName]);

  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [docLoaded, setDocLoaded] = useState(false);

  const pdfDocRef = useRef<any>(null);
  const objectUrlsRef = useRef<string[]>([]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch {}
      });
      objectUrlsRef.current = [];
      if (pdfDocRef.current) {
        try { pdfDocRef.current.destroy(); } catch {}
        pdfDocRef.current = null;
      }
    };
  }, []);

  // Fetch file into memory via short-lived signed URL.
  useEffect(() => {
    if (viewer === 'unsupported') {
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const signedUrl = await getResumeUrl(filePath);
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const ab = await response.arrayBuffer();
        if (!cancelled) {
          setBuffer(ab);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Unable to load this file.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [filePath, viewer]);

  // ── PDF: load document ──
  useEffect(() => {
    if (viewer !== 'pdf' || !buffer) return;
    let cancelled = false;
    setDocLoaded(false);
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const { default: workerUrl } = await import(
          'pdfjs-dist/build/pdf.worker.min.mjs?url'
        );
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        if (!cancelled) {
          pdfDocRef.current = pdf;
          setTotalPages(pdf.numPages);
          setDocLoaded(true);
          setPage(1);
        }
      } catch {
        if (!cancelled) {
          setDocLoaded(false);
          setError('Unable to load this PDF.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [buffer, viewer]);

  // ── DOCX: convert to HTML ──
  const docxContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (viewer !== 'docx' || !buffer || docxContainerRef.current?.innerHTML) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('mammoth');
        const { value } = await mod.convertToHtml({ arrayBuffer: buffer });
        if (!cancelled && docxContainerRef.current) {
          docxContainerRef.current.innerHTML = sanitiseHtml(value);
          setDocLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setDocLoaded(false);
          setError('Unable to load this Word document.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [buffer, viewer]);

  // ── PDF page rendering ──
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTasksRef = useRef<Map<number, Promise<void>>>(new Map());

  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement, containerWidth: number) => {
      const pdf = pdfDocRef.current;
      if (!pdf || !canvas) return;
      const existing = renderTasksRef.current.get(pageNumber);
      if (existing) return existing;

      const task = (async () => {
        try {
          const pdfPage = await pdf.getPage(pageNumber);
          const viewport = pdfPage.getViewport({ scale: 1 });
          const scale = (containerWidth / viewport.width) * window.devicePixelRatio * zoom;
          const cappedScale = Math.min(scale, 2 * window.devicePixelRatio);
          const finalViewport = pdfPage.getViewport({ scale: cappedScale });

          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          canvas.width = finalViewport.width;
          canvas.height = finalViewport.height;
          canvas.style.width = `${containerWidth}px`;
          canvas.style.height = `${
            containerWidth * (finalViewport.height / finalViewport.width)
          }px`;

          await pdfPage.render({
            canvasContext: ctx,
            viewport: finalViewport,
          }).promise;
        } catch {
          // Render failure is non-fatal.
        } finally {
          renderTasksRef.current.delete(pageNumber);
        }
      })();

      renderTasksRef.current.set(pageNumber, task);
      return task;
    },
    [zoom],
  );

  // IntersectionObserver for lazy rendering.
  useEffect(() => {
    if (viewer !== 'pdf' || !docLoaded) return;
    const container = containerRef.current;
    if (!container) return;
    let io: IntersectionObserver | null = null;
    try {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              const pageNum = parseInt(el.dataset.pageNum ?? '0', 10);
              if (pageNum > 0) {
                const canvas = el.querySelector('canvas');
                if (canvas) {
                  void renderPage(pageNum, canvas, el.clientWidth);
                }
              }
            }
          }
        },
        { root: null, rootMargin: normaliseRootMargin('200px 0px 200px 0px'), threshold: 0 },
      );
      const els = container.querySelectorAll<HTMLElement>('[data-page-num]');
      els.forEach((el) => io!.observe(el));
      const containerEl = container;
      return () => {
        io?.disconnect();
        // containerEl no longer needed after cleanup.
        void containerEl;
      };
    } catch {
      // IntersectionObserver not supported — render all pages.
      container.querySelectorAll<HTMLElement>('[data-page-num]').forEach((el) => {
        const pageNum = parseInt(el.dataset.pageNum ?? '0', 10);
        const canvas = el.querySelector('canvas');
        if (canvas && pageNum > 0) {
          void renderPage(pageNum, canvas, el.clientWidth);
        }
      });
    }
  }, [viewer, docLoaded, renderPage]);

  // Re-render on zoom change.
  useEffect(() => {
    if (viewer !== 'pdf' || !docLoaded) return;
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLElement>('[data-page-num]').forEach((el) => {
      const pageNum = parseInt(el.dataset.pageNum ?? '0', 10);
      const canvas = el.querySelector('canvas');
      if (canvas && pageNum > 0) {
        void renderPage(pageNum, canvas, el.clientWidth);
      }
    });
  }, [zoom, viewer, docLoaded, renderPage]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.25, 2.0));
  }, []);
  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.25, 0.5));
  }, []);

  const handleOpenInNewTab = useCallback(async () => {
    try {
      const signedUrl = await getResumeUrl(filePath);
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Ignore.
    }
  }, [filePath, fileName]);

  const handleRetry = useCallback(() => {
    setError(null);
    setBuffer(null);
    pdfDocRef.current = null;
    setDocLoaded(false);
    setPage(1);
  }, []);

  // ── Unsupported ──
  if (viewer === 'unsupported') {
    return (
      <section className={styles.viewer} role="region" aria-label={`Preview of ${fileName}`}>
        <div className={styles.unsupported}>
          <FileText size={48} strokeWidth={1.75} className={styles.icon} aria-hidden="true" />
          <h2 className={styles.title}>File type not supported for preview</h2>
          <p className={styles.desc}>
            We can't preview this file in the browser, but you can still open it.
          </p>
          <Button type="button" variant="secondary" onClick={handleOpenInNewTab} fullWidth>
            <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
            Open original
          </Button>
        </div>
      </section>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <section className={styles.viewer} role="region" aria-label={`Preview of ${fileName}`}>
        <div className={styles.error}>
          <X size={48} strokeWidth={1.75} className={styles.icon} aria-hidden="true" />
          <h2 className={styles.title}>We can't preview this file</h2>
          <p className={styles.desc}>{error}</p>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={handleRetry} fullWidth>
              <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
              Retry
            </Button>
            <Button type="button" variant="plain" onClick={handleOpenInNewTab} fullWidth>
              <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
              Open original in new tab
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ── Loading ──
  if (!buffer || !docLoaded) {
    return (
      <section className={styles.viewer} role="region" aria-label={`Preview of ${fileName}`}>
        <div className={styles.loading}>
          <Loader2 size={32} strokeWidth={1.75} className={styles.spinner} aria-hidden="true" />
          <p>Loading {fileName}…</p>
        </div>
      </section>
    );
  }

  // ── PDF rendering ──
  if (viewer === 'pdf') {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <section className={styles.viewer} role="region" aria-label={`Preview of ${fileName}`}>
        <div className={styles.controls}>
          <span className={styles.pageCounter}>{page} / {totalPages}</span>
          <div className={styles.zoomControls}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              aria-label="Zoom out"
            >
              <X size={12} strokeWidth={1.75} aria-hidden="true" />
            </Button>
            <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 2.0}
              aria-label="Zoom in"
            >
              +
            </Button>
          </div>
        </div>
        <div ref={containerRef} className={styles.pdfPages}>
          {pages.map((p) => (
            <div
              key={p}
              className={styles.pdfPage}
              data-page-num={p}
              aria-label={`Resume page ${p} of ${totalPages}`}
            >
              <canvas className={styles.canvas} />
            </div>
          ))}
        </div>
        <div className={styles.downloadBar}>
          <Button type="button" variant="secondary" onClick={handleOpenInNewTab} fullWidth>
            <Download size={14} strokeWidth={1.75} aria-hidden="true" />
            Download original PDF
          </Button>
        </div>
      </section>
    );
  }

  // ── DOCX rendering ──
  return (
    <section className={styles.viewer} role="region" aria-label={`Preview of ${fileName}`}>
      <div className={styles.note}>
        <p>
          Word files are shown approximately. <strong>Export a PDF</strong> for the exact layout.
        </p>
      </div>
      <div ref={docxContainerRef} className={styles.docxContainer} />
      <div className={styles.downloadBar}>
        <Button type="button" variant="secondary" onClick={handleOpenInNewTab} fullWidth>
          <Download size={14} strokeWidth={1.75} aria-hidden="true" />
          Download original DOCX
        </Button>
      </div>
    </section>
  );
};
