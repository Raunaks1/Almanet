import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { SPRING, withReducedMotion } from '../../lib/motion';
import { useMediaQuery } from './useMediaQuery';
import styles from './Modal.module.css';
import { cx } from './internal';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Actions pinned below the body (Buttons). */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Desktop panel max width in px — ignored on mobile (full-width sheet). */
  maxWidth?: number;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/** Below this width the modal renders as a bottom sheet with drag-to-dismiss. */
const SHEET_QUERY = '(max-width: 640px)';

/**
 * Modal shell: dimmed scrim + panel, centered on desktop, bottom sheet with a
 * draggable grabber on phones. Focus is trapped inside while open, Escape
 * closes, body scroll locks, and focus returns to the opener on close.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  maxWidth = 560,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const isSheet = useMediaQuery(SHEET_QUERY);
  const reduced = useReducedMotion() ?? false;

  // Scroll lock + focus handoff for as long as the dialog is open.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // Escape to close + Tab focus trap.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Sheet variants — slide up on a spring, fall back to a plain fade.
  const sheetTransition = withReducedMotion(reduced, SPRING);
  const sheetInitial = reduced ? { opacity: 0 } : { opacity: 0, y: '100%' };
  const sheetExit = reduced ? { opacity: 0 } : { opacity: 0, y: '100%' };
  // Centered variants — scale-in with an 8px rise (constitution page rule).
  const centerInitial = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 };
  const centerExit = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 };

  const drag = isSheet && !reduced ? 'y' : false;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="almanet-modal"
          className={cx(styles.overlay, isSheet && styles.overlaySheet)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.22 } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            drag={drag}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose();
            }}
            initial={isSheet ? sheetInitial : centerInitial}
            animate={
              isSheet
                ? { opacity: 1, y: 0, transition: sheetTransition }
                : { opacity: 1, scale: 1, y: 0, transition: withReducedMotion(reduced, SPRING) }
            }
            exit={isSheet ? { ...sheetExit, transition: { duration: 0.2 } } : { ...centerExit, transition: { duration: 0.18 } }}
            transition={sheetTransition}
            className={cx(styles.panel, isSheet ? styles.sheet : styles.center)}
            style={!isSheet && maxWidth !== 560 ? { maxWidth } : undefined}
          >
            {isSheet && (
              <div
                className={styles.grabber}
                onPointerDown={(e) => {
                  if (drag) dragControls.start(e);
                }}
              >
                <span className={styles.handle} aria-hidden="true" />
              </div>
            )}
            <header className={styles.header}>
              <div className={styles.heading}>
                <h2 id={titleId} className={styles.title}>
                  {title}
                </h2>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
              <button
                type="button"
                className={styles.close}
                aria-label="Close"
                onClick={onClose}
              >
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.body}>{children}</div>

            {footer && <footer className={styles.footer}>{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
