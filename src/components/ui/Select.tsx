import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import fieldStyles from './field.module.css';
import { cx, type UiSize } from './internal';

export interface SelectProps extends Omit<React.ComponentPropsWithoutRef<'select'>, 'size'> {
  size?: UiSize;
  invalid?: boolean;
}

/**
 * Native select in the field recipe — options/optionGroups are passed
 * straight through as children so the platform picker inertness stays.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', invalid, className, children, ...rest },
  ref,
) {
  return (
    <div className={fieldStyles.wrap}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(
          fieldStyles.control,
          fieldStyles[size],
          fieldStyles.select,
          fieldStyles.paddedRight,
          invalid && fieldStyles.invalid,
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <span className={fieldStyles.chevron} aria-hidden="true">
        <ChevronDown size={16} strokeWidth={1.75} />
      </span>
    </div>
  );
});
