import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SPRING } from '../../lib/motion';
import styles from './IconButton.module.css';
import { cx, type UiSize } from './internal';

export interface IconButtonProps
  extends Omit<
    React.ComponentPropsWithoutRef<'button'>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
  > {
  variant?: 'primary' | 'secondary' | 'tinted' | 'plain' | 'destructive';
  size?: UiSize;
  loading?: boolean;
  /** Icon glyph (lucide, size ~18, stroke 1.75). */
  icon: React.ReactNode;
  /** Accessible name — icon-only controls must be labelled (used as aria-label). */
  label: string;
}

/**
 * Circular icon-only button. Touch-class 44px hit area at the md size;
 * press feedback is the shared spring, hover is a tint on fine pointers.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'secondary', size = 'md', loading = false, icon, label, type = 'button', disabled, className, ...rest },
  ref,
) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-label={label}
      aria-busy={loading || undefined}
      whileTap={reduced ? undefined : { scale: 0.94 }}
      transition={SPRING}
      className={cx(styles.iconButton, styles[variant], styles[size], className)}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon}
    </motion.button>
  );
});
