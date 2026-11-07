import React from 'react';
import styles from './Tooltip.module.css';
import { cx } from './internal';

export interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom';
  /** Single interactive element (IconButton, Button…); gets aria-describedby. */
  children: React.ReactElement;
  className?: string;
}

/**
 * Small tooltip for icon-only controls. Shows on hover and on keyboard
 * focus (`focus-within`), after a 250ms dwell. The trigger receives
 * `aria-describedby`, so screen readers announce the content too.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, side = 'top', children, className }) => {
  const id = React.useId();
  const tipId = `tip-${id.replace(/[^a-zA-Z0-9-]/g, '')}`;
  const triggerProps = children.props as { 'aria-describedby'?: string };
  const describedBy =
    [triggerProps['aria-describedby'], tipId].filter(Boolean).join(' ') || undefined;

  return (
    <span className={cx(styles.wrap, className)} data-side={side}>
      {React.cloneElement(
        children as React.ReactElement<{ 'aria-describedby'?: string }>,
        { 'aria-describedby': describedBy },
      )}
      <span role="tooltip" id={tipId} className={styles.tip}>
        {content}
      </span>
    </span>
  );
};
