import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SPRING } from '../../lib/motion';
import styles from './Button.module.css';
import { cx, type UiSize } from './internal';

// Reasonable MotionProps overrides need omitting: native drag/animation
// handlers have different signatures in motion/react.
export interface ButtonProps
  extends Omit<
    React.ComponentPropsWithoutRef<'button'>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
  > {
  /** primary = filled accent · secondary = glass · tinted = quiet accent · plain = text-only · destructive */
  variant?: 'primary' | 'secondary' | 'tinted' | 'plain' | 'destructive';
  size?: UiSize;
  /** Replaces the label with a spinner and disables the button. */
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Stretch to the parent container's width. */
  fullWidth?: boolean;
}

/**
 * Pill button. Press feedback is a spring on pointer-down (responds before
 * release); hover lift happens only on fine-pointer devices.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    iconLeft,
    iconRight,
    fullWidth,
    type = 'button',
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={SPRING}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        loading && styles.loading,
        fullWidth && styles.block,
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        iconLeft && <span className={styles.icon}>{iconLeft}</span>
      )}
      <span className={styles.label}>{children}</span>
      {!loading && iconRight && <span className={styles.icon}>{iconRight}</span>}
    </motion.button>
  );
});
