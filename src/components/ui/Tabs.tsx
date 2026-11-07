import React, { createContext, useContext, useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SPRING } from '../../lib/motion';
import styles from './Tabs.module.css';
import { cx } from './internal';

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsContextValue {
  active: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabPanel must be used inside <Tabs>');
  return ctx;
};

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
  children?: React.ReactNode;
}

/**
 * Underline tabs. The active underline slides between tabs (`layoutId`),
 * the bar is a real ARIA tablist with arrow-key navigation, and
 * `<TabPanel value>` shows the active panel.
 */
export function Tabs({ items, value, onChange, 'aria-label': ariaLabel, children }: TabsProps) {
  const underlineId = useId();
  const reduced = useReducedMotion();
  const activeIndex = Math.max(
    items.findIndex((t) => t.value === value),
    0,
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (activeIndex + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    onChange(items[next].value);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-tab-index="${next}"]`)?.focus();
  };

  return (
    <TabsContext.Provider value={{ active: value }}>
      <div className={styles.tabs}>
        <div role="tablist" aria-label={ariaLabel} className={styles.tablist} onKeyDown={onKeyDown}>
          {items.map((item, i) => {
            const active = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                data-tab-index={i}
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                id={`tab-${item.value}`}
                className={cx(styles.tab, active && styles.tabActive)}
                onClick={() => onChange(item.value)}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                {item.label}
                {active && (
                  <motion.span
                    className={styles.indicator}
                    aria-hidden="true"
                    layoutId={`tab-underline-${underlineId}`}
                    transition={reduced ? { duration: 0.15, ease: 'linear' } : SPRING}
                  />
                )}
              </button>
            );
          })}
        </div>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabPanelProps {
  value: string;
  children: React.ReactNode;
}

/** Content pane for a Tabs bar; renders only while its tab is active. */
export function TabPanel({ value, children }: TabPanelProps) {
  const { active } = useTabs();
  if (active !== value) return null;
  return (
    <div role="tabpanel" aria-labelledby={`tab-${value}`} className={styles.panel}>
      {children}
    </div>
  );
}
