import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { SPRING } from '../../lib/motion';
import { ToastContext } from './toastContext';
import type { ToastApi, ToastOptions, ToastVariant } from './toastContext';
import styles from './Toast.module.css';
import { cx } from './internal';

interface ActiveToast extends ToastOptions {
  id: string;
}

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4000;

const ICONS: Record<ToastVariant, React.ReactNode> = {
  neutral: <Info size={18} strokeWidth={1.75} aria-hidden="true" />,
  success: <CheckCircle size={18} strokeWidth={1.75} aria-hidden="true" />,
  info: <Info size={18} strokeWidth={1.75} aria-hidden="true" />,
  warning: <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />,
  danger: <AlertCircle size={18} strokeWidth={1.75} aria-hidden="true" />,
};

/**
 * Glass toast system — a provider plus its own viewer (no separate
 * toaster component). Top-center, auto-dismisses after ~4s, keeps at
 * most 3 on screen; replaces window.alert().
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const counter = useRef(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const apiId = useId();

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (toast: ToastOptions) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;
      setToasts((current) => {
        const next = current.length >= MAX_TOASTS ? current.slice(current.length - (MAX_TOASTS - 1)) : current;
        return [...next, { ...toast, id }];
      });
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), toast.duration ?? DEFAULT_DURATION),
      );
      return id;
    },
    [dismiss],
  );

  // Clear orphaned timers if the provider unmounts.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  const api = useRef<ToastApi>({ show, dismiss });
  api.current.show = show;
  api.current.dismiss = dismiss;

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <Player toasts={toasts} onDismiss={dismiss} regionId={`toasts-${apiId.replace(/[^\w]/g, '')}`} />
    </ToastContext.Provider>
  );
};

const Player: React.FC<{ toasts: ActiveToast[]; onDismiss: (id: string) => void; regionId: string }> = ({
  toasts,
  onDismiss,
  regionId,
}) => {
  const reduced = useReducedMotion();

  return (
    <div className={styles.region} role="region" aria-label="Notifications" id={regionId}>
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            role="status"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: SPRING }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.18 } }}
            className={styles.toast}
          >
            <span className={cx(styles.icon, styles[toast.variant ?? 'neutral'])}>
              {ICONS[toast.variant ?? 'neutral']}
            </span>
            <div className={styles.content}>
              <p className={styles.title}>{toast.title}</p>
              {toast.description && <p className={styles.description}>{toast.description}</p>}
            </div>
            {toast.action && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              className={styles.close}
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
            >
              <X size={15} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
