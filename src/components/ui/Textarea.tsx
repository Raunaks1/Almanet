import React, { forwardRef } from 'react';
import fieldStyles from './field.module.css';
import { cx, type UiSize } from './internal';

export interface TextareaProps extends React.ComponentPropsWithoutRef<'textarea'> {
  size?: UiSize;
  invalid?: boolean;
}

/** Filled textarea (resizes vertically). Pair with <FormField>. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = 'md', invalid, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(fieldStyles.control, fieldStyles.area, fieldStyles[size], invalid && fieldStyles.invalid, className)}
      {...rest}
    />
  );
});
