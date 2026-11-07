import React from 'react';
import styles from './FormField.module.css';
import { cx } from './internal';

export interface FormFieldProps {
  label: string;
  hint?: string;
  /** Replaces the hint and marks the control aria-invalid. */
  error?: string;
  required?: boolean;
  /** A single form control (Input, Textarea, Select, Combobox…). It receives id + aria wiring. */
  children: React.ReactElement;
  className?: string;
}

/**
 * Field wrapper: associates label/hint/error with the control and injects
 * `id`, `aria-describedby` and `aria-invalid`. The error gets
 * `role="alert"` so it is announced when it appears.
 */
export const FormField: React.FC<FormFieldProps> = ({ label, hint, error, required, children, className }) => {
  const autoId = React.useId();
  const fieldId = `ff-${autoId.replace(/[^a-zA-Z0-9-]/g, '')}`;
  const controlProps = children.props as { id?: string; 'aria-describedby'?: string };
  const id = controlProps.id ?? fieldId;

  const showHint = Boolean(hint) && !error;
  const hintId = showHint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [controlProps['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control = React.cloneElement(
    children as React.ReactElement<{
      id?: string;
      'aria-describedby'?: string;
      'aria-invalid'?: boolean;
    }>,
    {
      id,
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : undefined,
    },
  );

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {control}
      {error ? (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      ) : showHint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};
