/**
 * ErrorBoundary — catches render/lifecycle errors in its subtree and shows a
 * friendly fallback card instead of a blank page.
 *
 * Logs only the error name, message and component stack — never resume text,
 * job descriptions, or any user data.
 */
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional callback for the "Close" button (e.g. close a modal or go back). */
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log only name + message + component stack. Never log user data.
    console.error(
      'ErrorBoundary caught an error:',
      error.name,
      error.message,
      errorInfo.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleClose = () => {
    this.props.onClose?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const message =
        this.state.error?.message || 'An unexpected error occurred.';

      return (
        <div className={styles.root} role="alert">
          <div className={styles.card}>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              {message}
            </p>
            <div className={styles.buttons}>
              <Button
                type="button"
                variant="secondary"
                onClick={this.handleRetry}
              >
                Try again
              </Button>
              <Button
                type="button"
                variant="plain"
                onClick={this.handleClose}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export type { Props };
