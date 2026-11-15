/**
 * ResumeFileViewer — renders the original resume file (PDF/DOCX) as a
 * document viewer, never as extracted text.
 *
 * - PDF: pdf.js (already installed), one <canvas> per page, lazy rendering
 *   via IntersectionObserver, ResizeObserver re-render, zoom 50%–200%.
 * - DOCX: docx-preview (dynamic import), Shadow DOM, renderAsync.
 * - Errors: friendly fallback with Download button.
 * - Privacy: bytes held in memory only, never logged or persisted. Buffer
 *   dropped and object URLs revoked on unmount.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASE_REVEAL } from '../../lib/motion';
import { pickViewer } from '../../lib/resume/pickViewer';
import { fetchResumeFile } from '../../lib/resume/fetchResumeFile';
import { loadPdfJs } from '../../lib/extractResumeText';
import { normaliseRootMargin } from '../../lib/utils';
import {
  AlertCircle,
  Download,
  FileText,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useToast } from '../ui';
import { useMediaQuery } from '../ui/useMediaQuery';
import styles from './ResumeFileViewer.module.css';

interface ResumeFileViewerProps {
  filePath: string;
  fileName: string;
  mimeType: string | null;
  onClose?: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.25;
const DEFAULT_ZOOM = 1.0;

/** One PDF page: skeleton until in view, then canvas render. */
function PdfPage({
  pageNumber,
  pdfDoc,
  containerWidth,
  zoom,
}: {
  pageNumber: number;
  pdfDoc: any;
  containerWidth: number;
  zoom: number;
}) {
  const [rendered, setRendered] = useState(false);
  const [pageDim, setPageDim] = useState<{ width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const renderPage = useCallback(async () => {
    if (!canvasRef.current || !pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({
        scale: (containerWidth / page.getViewport({ scale: 1 }).width) * window.devicePixelRatio * zoom,
      });
      // Cap scale at 3× device pixels.
      const cappedScale = Math.min(viewport.scale, 3 * window.devicePixelRatio);
      const finalViewport = page.getViewport({ scale: cappedScale });

      const canvas = canvasRef.current;
      canvas.width = finalViewport.width;
      canvas.height = finalViewport.height;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerWidth * (finalViewport.height / finalViewport.width)}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport: finalViewport }).promise;

      setPageDim({ width: finalViewport.width, height: finalViewport.height });
      setRendered(true);
    } catch {
      // Render failure is non-fatal; page stays as skeleton.
    }
  }, [canvasRef, pdfDoc, pageNumber, containerWidth, zoom]);

  // Render when within one screen of the viewport.
  useEffect(() => {
    if (!wrapRef.current || rendered) return;
    let io: IntersectionObserver | null = null;
    try {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              renderPage();
              io?.disconnect();
              break;
            }
          }
        },
        { root: null, rootMargin: normaliseRootMargin('100px 0px'), threshold: 0 },
      );
      io.observe(wrapRef.current);
      ioRef.current = io;
    } catch {
      // IntersectionObserver not supported or invalid options — treat as visible.
      renderPage();
    }
    return () => {
      io?.disconnect();
    };
  }, [wrapRef, rendered, renderPage]);

  // Re-render on zoom/container change.
  useEffect(() => {
    if (rendered) {
      renderPage();
    }
  }, [zoom, containerWidth, rendered, renderPage]);

  const aspectRatio = pageDim ? pageDim.height / pageDim.width : 1.414; // A4 default

  return (
    <div
      ref={wrapRef}
      className={styles.pageWrap}
      style={{ marginBottom: 16 }}
    >
      {rendered && canvasRef.current ? (
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-label={`Page ${pageNumber} of resume`}
        />
      ) : (
        <div className={styles.skeletonPage} style={{ aspectRatio }}>
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonText} style={{ width: '70%' }} />
          <div className={styles.skeletonText} style={{ width: '50%' }} />
          <div className={`${styles.skeletonText} ${styles.last}`} style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
}

export const ResumeFileViewer: React.FC<ResumeFileViewerProps> = ({
  filePath,
  fileName,
  mimeType,
  onClose,
}) => {
  const isMobile = useMediaQuery('(max-width: 899px)');
  const reduced = useReducedMotion();
  const { show: showToast } = useToast();

  const viewer = useMemo(() => pickViewer(mimeType, fileName), [mimeType, fileName]);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [totalPages, setTotalPages] = useState(0);
  const [docLoaded, setDocLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  // ── Cleanup: revoke object URLs, drop buffer, destroy pdf doc ──
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch {}
      });
      objectUrlsRef.current = [];
      setBuffer(null);
      if (pdfDocRef.current) {
        try { pdfDocRef.current.destroy(); } catch {}
        pdfDocRef.current = null;
      }
    };
  }, []);

  // ── Fetch file into memory (ArrayBuffer only) ──
  useEffect(() => {
    if (viewer === 'unsupported') {
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ab = await fetchResumeFile(filePath);
        if (!cancelled) {
          setBuffer(ab);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('We could not load this file.');
      }
    })();
    return () => { cancelled = true; };
  }, [filePath, viewer]);

  // ── Load PDF document ──
  useEffect(() => {
    if (viewer !== 'pdf' || !buffer) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        if (!cancelled) {
          pdfDocRef.current = pdf;
          setTotalPages(pdf.numPages);
          setDocLoaded(true);
          setPage(1);
          setZoom(DEFAULT_ZOOM);
        }
      } catch {
        if (!cancelled) {
          setDocLoaded(false);
          setError('We can\'t preview this file. You can still download it.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [buffer, viewer]);

  // ── DOCX: dynamic import, render into Shadow DOM ──
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const docxShadowRef = useRef<ShadowRoot | null>(null);
  const docxScaleRef = useRef(1);

  useEffect(() => {
    if (viewer !== 'docx' || !buffer || docxShadowRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { renderAsync } = await import('docx-preview');
        const el = docxContainerRef.current;
        if (!el || cancelled) return;
        const shadow = el.attachShadow({ mode: 'open' });
        docxShadowRef.current = shadow;
        await renderAsync(
          buffer as ArrayBuffer,
          shadow as unknown as HTMLElement,
          undefined,
          {
            breakPages: true,
            inWrapper: true,
            ignoreWidth: false,
          },
        );
        if (!cancelled) setDocLoaded(true);
      } catch {
        if (!cancelled) {
          setDocLoaded(false);
          setError('We can\'t preview this file. You can still download it.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [buffer, viewer]);

  // ── Re-render DOCX on container resize ──
  useEffect(() => {
    if (viewer !== 'docx' || !docxContainerRef.current || !docxShadowRef.current) return;
    const el = docxContainerRef.current;
    const ro = new ResizeObserver(() => {
      if (!docxShadowRef.current) return;
      const scale = el.clientWidth / 800;
      docxScaleRef.current = Math.min(Math.max(scale, MIN_ZOOM), MAX_ZOOM);
      el.style.transform = `scale(${docxScaleRef.current})`;
      el.style.transformOrigin = 'top left';
      el.style.width = '800px';
      el.style.height = `${el.scrollHeight / docxScaleRef.current}px`;
    });
    ro.observe(el);
    resizeObserverRef.current = ro;
    return () => ro.disconnect();
  }, [viewer]);

  // ── Handlers ──
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const handleDownload = useCallback(() => {
    // Reuse existing behavior: open signed URL in a new tab (download).
    void import('../../lib/resumes').then(({ getResumeUrl }) => {
      getResumeUrl(filePath).then((url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }).catch(() => {
        showToast({ title: 'Download failed', description: 'Unable to download the file.', variant: 'danger' });
      });
    }).catch(() => {
      showToast({ title: 'Download failed', description: 'Unable to download the file.', variant: 'danger' });
    });
  }, [filePath, fileName, showToast]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') { e.preventDefault(); handleZoomIn(); }
      if (e.key === '-') { e.preventDefault(); handleZoomOut(); }
      if (e.key === 'PageUp') { e.preventDefault(); handlePrevPage(); }
      if (e.key === 'PageDown') { e.preventDefault(); handleNextPage(); }
    },
    [handleZoomIn, handleZoomOut, handlePrevPage, handleNextPage],
  );

  useEffect(() => {
    const onKey = (e: Event) => {
      handleKeyDown(e as unknown as KeyboardEvent);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKeyDown]);

  // ── Unsupported ──
  if (viewer === 'unsupported') {
    return (
      <div className={styles.viewer} role="region" aria-label={`Preview of ${fileName}`}>
        <div className={styles.unsupported}>
          <FileText size={48} strokeWidth={1.75} className={styles.unsupportedIcon} aria-hidden="true" />
          <h2 className={styles.unsupportedTitle}>File type not supported for preview</h2>
          <p className={styles.unsupportedDesc}>
            We can't preview this file in the browser, but you can still download it.
          </p>
          <button
            type="button"
            className={styles.errorBtn}
            onClick={handleDownload}
            aria-label={`Download ${fileName}`}
          >
            <Download size={16} strokeWidth={1.75} aria-hidden="true" />
            Download
          </button>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className={styles.viewer} role="region" aria-label={`Preview of ${fileName}`}>
        <div className={styles.error}>
          <AlertCircle size={48} strokeWidth={1.75} className={styles.errorIcon} aria-hidden="true" />
          <h2 className={styles.errorTitle}>We can't preview this file</h2>
          <p className={styles.errorDesc}>
            The file may be password-protected, corrupt, or in an unsupported format.
          </p>
          <button
            type="button"
            className={styles.errorBtn}
            onClick={handleDownload}
            aria-label={`Download ${fileName}`}
          >
            <Download size={16} strokeWidth={1.75} aria-hidden="true" />
            Download
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (!buffer || !docLoaded) {
    return (
      <div className={styles.viewer} role="region" aria-label={`Preview of ${fileName}`}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} aria-hidden="true" />
          <p>Loading {fileName}…</p>
        </div>
      </div>
    );
  }

  const containerWidth = containerRef.current?.clientWidth || (isMobile ? 360 : 800);
  const pages = viewer === 'pdf' ? Array.from({ length: totalPages }, (_, i) => i + 1) : [1];

  return (
    <div
      ref={containerRef}
      className={styles.viewer}
      role="region"
      aria-label={`Preview of ${fileName}`}
    >
      {viewer === 'pdf' ? (
        <>
          <div className={styles.well}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close preview"
            >
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <div className={styles.pageArea}>
              <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 8 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE_REVEAL }}
            >
                {pages.map((p) => (
                  <PdfPage
                    key={p}
                    pageNumber={p}
                    pdfDoc={pdfDocRef.current}
                    containerWidth={containerWidth}
                    zoom={zoom}
                  />
                ))}
              </motion.div>
            </div>
          </div>
          <div className={styles.toolbar}>
            <div className={styles.pageCounter}>
              {page} / {totalPages}
            </div>
            <div className={styles.zoomGroup}>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
              >
                <ZoomOut size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <span className={styles.pageCounter}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
              >
                <ZoomIn size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownload}
              aria-label={`Download ${fileName}`}
            >
              <Download size={16} strokeWidth={1.75} aria-hidden="true" />
              Download
            </button>
          </div>
        </>
      ) : (
        // DOCX
        <>
          <div className={styles.well}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close preview"
            >
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <div className={styles.pageArea}>
              <div className={styles.paper}>
                <div ref={docxContainerRef} className={styles.docxWrap} />
              </div>
            </div>
          </div>
          <div className={styles.toolbar}>
            <span className={styles.pageCounter}>Document</span>
            <div className={styles.zoomGroup} />
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownload}
              aria-label={`Download ${fileName}`}
            >
              <Download size={16} strokeWidth={1.75} aria-hidden="true" />
              Download
            </button>
          </div>
        </>
      )}
    </div>
  );
};
