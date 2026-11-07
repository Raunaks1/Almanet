import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import fieldStyles from './field.module.css';
import styles from './Combobox.module.css';
import { cx, type UiSize } from './internal';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  size?: UiSize;
  id?: string;
  name?: string;
}

/**
 * Searchable listbox attached to a text field (used for the 200+ college
 * list). Type to filter; ↑/↓ move the highlight, Enter commits, Escape or
 * Tab closes. Announced through aria-activedescendant, so input focus stays.
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  { options, value, onChange, placeholder, emptyText = 'No results', disabled, invalid, size = 'md', id, name },
  ref,
) {
  const rawId = useId();
  const uid = id ?? `cb-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q),
    );
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setHi(-1);
  };

  const select = (index: number) => {
    const option = filtered[index];
    if (!option) return;
    onChange?.(option.value);
    close();
  };

  // Follow external/default selection while closed.
  useEffect(() => {
    if (!open) setQuery('');
  }, [value, open]);

  // Keep the highlight on a real option as filters change.
  useEffect(() => {
    setHi(filtered.length > 0 ? 0 : -1);
  }, [query, options]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside pointer presses.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Scroll the highlighted option into view.
  useEffect(() => {
    if (!open || hi < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${hi}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [hi, open, filtered]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation(); // the dropdown goes first; modals stay put
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      close();
      return;
    }
    if (e.key === 'Enter') {
      if (!open) return; // let forms submit
      e.preventDefault();
      select(hi);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setQuery('');
      } else if (filtered.length > 0) {
        setHi((h) => (h + 1) % filtered.length);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      if (open && filtered.length > 0) {
        e.preventDefault();
        setHi((h) => (h - 1 + filtered.length) % filtered.length);
      }
      return;
    }
    if (e.key === 'Home' && open && filtered.length > 0) {
      e.preventDefault();
      setHi(0);
      return;
    }
    if (e.key === 'End' && open && filtered.length > 0) {
      e.preventDefault();
      setHi(filtered.length - 1);
    }
  };

  const activeDescendant = open && hi >= 0 ? `${listId}-${hi}` : undefined;

  return (
    <div ref={wrapRef} className={cx(fieldStyles.wrap, styles.root)}>
      {name && open && <input type="hidden" name={name} value={value ?? ''} readOnly />}
      <input
        ref={ref}
        id={uid}
        name={name}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={activeDescendant}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        type="text"
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (!open) {
            setOpen(true);
            setHi(options.length > 0 ? 0 : -1);
          }
        }}
        onKeyDown={onKeyDown}
        className={cx(
          fieldStyles.control,
          fieldStyles[size],
          fieldStyles.paddedRight,
          invalid && fieldStyles.invalid,
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        className={cx(fieldStyles.chevron, styles.chevronButton)}
        onClick={() => {
          if (open) close();
          else {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <ChevronDown size={16} strokeWidth={1.75} />
      </button>
      {open && (
        <div ref={listRef} id={listId} role="listbox" className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>{emptyText}</div>
          ) : (
            filtered.map((option, i) => {
              const selected = option.value === value;
              return (
                <div
                  key={option.value}
                  role="option"
                  id={`${listId}-${i}`}
                  data-index={i}
                  aria-selected={selected}
                  className={cx(styles.option, i === hi && styles.active)}
                  onPointerDown={(e) => {
                    e.preventDefault(); // keep input focus; suppress blur-before-click
                    select(i);
                  }}
                  onMouseEnter={() => setHi(i)}
                >
                  <span className={styles.optionText}>
                    <span className={cx(styles.optionLabel, selected && styles.selectedLabel)}>
                      {option.label}
                    </span>
                    {option.sublabel && <span className={styles.optionSub}>{option.sublabel}</span>}
                  </span>
                  {selected && (
                    <Check
                      size={15}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className={styles.checkIcon}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});
