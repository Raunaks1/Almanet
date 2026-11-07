import React, { forwardRef } from 'react';
import styles from './Switch.module.css';
import { cx } from './internal';

export interface SwitchProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type'> {}

/**
 * iOS-style switch. A real <input type="checkbox"> with `appearance: none`;
 * the knob is drawn by the input and animates transform only.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} type="checkbox" role="switch" className={cx(styles.switch, className)} {...rest} />;
});
