import React, { forwardRef } from 'react';
import fieldStyles from './field.module.css';
import { cx, type UiSize } from './internal';

export interface InputProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size'> {
  size?: UiSize;
  invalid?: boolean;
  iconLeft?: React.ReactNode;
}

/**
 * Filled text input. 16px font floor keeps mobile Safari from zooming.
 * Pair with <FormField> for labels, hints and errors.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid, iconLeft, className, ...rest },
  ref,
) {
  return (
    <div className={fieldStyles.wrap}>
      {iconLeft && <span className={fieldStyles.iconLeft}>{iconLeft}</span>}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(fieldStyles.control, fieldStyles[size], invalid && fieldStyles.invalid, className)}
        {...rest}
      />
    </div>
  );
});
