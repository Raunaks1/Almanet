import React, { forwardRef, useEffect, useRef } from 'react';
import styles from './Checkbox.module.css';
import { cx } from './internal';

export interface CheckboxProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type'> {
  /** "Select all" mixed state — renders a dash and aria-checked="mixed". */
  indeterminate?: boolean;
}

/**
 * Apple-style checkbox: a real <input type="checkbox"> with `appearance:
 * none`. Focus, Space, forms and label association all come free; the
 * check/dash visuals are pure CSS and spring-scale on state change.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate, className, ...rest },
  ref,
) {
  const nodeRef = useRef<HTMLInputElement | null>(null);

  const attach = (node: HTMLInputElement | null) => {
    nodeRef.current = node;
    if (node) node.indeterminate = indeterminate === true;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    if (nodeRef.current) nodeRef.current.indeterminate = indeterminate === true;
  }, [indeterminate]);

  return (
    <input
      ref={attach}
      type="checkbox"
      aria-checked={indeterminate ? 'mixed' : undefined}
      className={cx(styles.native, className)}
      {...rest}
    />
  );
});
