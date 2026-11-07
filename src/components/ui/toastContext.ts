import { createContext, useContext } from 'react';

export type ToastVariant = 'neutral' | 'success' | 'info' | 'warning' | 'danger';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. Default 4000. */
  duration?: number;
  /** Optional action button (e.g. Undo). */
  action?: { label: string; onClick: () => void };
}

export interface ToastApi {
  show: (toast: ToastOptions) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

/** Access the toast API from anywhere under <ToastProvider>. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
