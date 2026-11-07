import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import type { Theme } from '../ThemeContext';
import './ThemeToggle.css';

const OPTIONS: Array<{
  value: Theme;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'light', label: 'Light', icon: <Sun size={16} strokeWidth={1.75} aria-hidden="true" /> },
  { value: 'system', label: 'System', icon: <Monitor size={16} strokeWidth={1.75} aria-hidden="true" /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={16} strokeWidth={1.75} aria-hidden="true" /> },
];

/**
 * Glass segmented control for theme selection (light / system / dark).
 * Arrow keys move between options, matching macOS segmented-control habits.
 */
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const cycle = (dir: 1 | -1) => {
    const index = OPTIONS.findIndex((o) => o.value === theme);
    const next = (index + dir + OPTIONS.length) % OPTIONS.length;
    setTheme(OPTIONS[next].value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      cycle(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      cycle(-1);
    }
  };

  return (
    <div className="theme-seg" role="radiogroup" aria-label="Appearance" onKeyDown={onKeyDown}>
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className="theme-seg__btn"
            onClick={() => setTheme(option.value)}
          >
            {option.icon}
            <span className="theme-seg__label">{option.label}</span>
            <span className="theme-sr-only">{option.label} appearance</span>
          </button>
        );
      })}
    </div>
  );
};
