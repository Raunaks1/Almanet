import React from 'react';
import styles from './GlassCard.module.css';
import { cx } from './internal';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive';
  /** Padding override (any CSS length). Defaults to the card's 24px. */
  padding?: string | number;
}

/**
 * Apple-glass surface. Use for chrome and floating layers; dense content
 * should sit on opaque surfaces instead (`variant="elevated"`).
 * `interactive` renders a focusable card with hover lift and press feedback.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  padding,
  style,
  className,
  children,
  onClick,
  onKeyDown,
  ...rest
}) => {
  const interactive = variant === 'interactive' && typeof onClick === 'function';

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
              onKeyDown?.(e);
            }
          : onKeyDown
      }
      className={cx(styles.card, styles[variant], className)}
      style={{ ...style, padding: padding !== undefined ? padding : undefined }}
      {...rest}
    >
      {children}
    </div>
  );
};
