import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { SPRING } from '../../lib/motion';
import { cx } from './internal';
import styles from './Menu.module.css';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  open: boolean;
  anchor: DOMRect | null;
  triggerRef: React.RefObject<HTMLButtonElement | null> | null;
  items: MenuItem[];
  onClose: () => void;
}

const MENU_MIN_WIDTH = 180;
const VIEWPORT_MARGIN = 12;
const MOBILE_BREAKPOINT = 640;

/**
 * Portal-based dropdown menu. Renders into document.body with position: fixed
 * so no card, glass container or overflow:hidden ancestor can clip it.
 *
 * Positions the menu from the anchor's bounding rect, right-aligned below the
 * trigger, flipped above when there isn't enough vertical space, and clamped
 * inside the viewport with a 12px margin on every side.
 *
 * Keyboard: Arrow Down/Up navigate, Enter activates, Esc closes.
 * Closes on outside click, Esc, page scroll, resize and route change.
 * Returns focus to the trigger on close.
 */
export const Menu: React.FC<MenuProps> = ({
  open,
  anchor,
  triggerRef,
  items,
  onClose,
}) => {
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    origin: string;
  } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef<{ left: number; top: number; origin: string } | null>(null);
  const reduced = useReducedMotion();
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

  // Compute position on open; measure the mounted menu so clamping is accurate.
  useLayoutEffect(() => {
    if (!open || !anchor || !menuRef.current) {
      lastPosition.current = null;
      setPosition(null);
      return;
    }

    const menuRect = menuRef.current.getBoundingClientRect();
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    const menuWidth = Math.max(MENU_MIN_WIDTH, menuRect.width);
    const menuHeight = menuRect.height;

    // Prefer below, right-aligned to the trigger.
    let left = anchor.right - menuWidth;
    let top = anchor.bottom + 6;
    let origin = 'top right';

    const spaceBelow = vpH - anchor.bottom;
    const spaceAbove = anchor.top;

    if (spaceBelow < menuHeight + VIEWPORT_MARGIN && spaceAbove >= spaceBelow) {
      top = anchor.top - menuHeight - VIEWPORT_MARGIN;
      origin = 'bottom right';
    }

    left = Math.max(VIEWPORT_MARGIN, Math.min(left, vpW - menuWidth - VIEWPORT_MARGIN));
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, vpH - menuHeight - VIEWPORT_MARGIN));

    const next = { left, top, origin };
    if (
      !lastPosition.current ||
      lastPosition.current.left !== next.left ||
      lastPosition.current.top !== next.top ||
      lastPosition.current.origin !== next.origin
    ) {
      lastPosition.current = next;
      setPosition(next);
    }
  }, [open, anchor]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocumentClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [open, onClose]);

  // Close on Esc.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Close on page scroll and resize.
  useEffect(() => {
    if (!open) return;
    const onScroll = () => onClose();
    const onResize = () => onClose();
    window.addEventListener('scroll', onScroll, { capture: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onResize);
    };
  }, [open, onClose]);

  // Close on route change (popstate covers HashRouter navigation).
  useEffect(() => {
    if (!open) return;
    const onPopState = () => onClose();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [open, onClose]);

  // Keyboard navigation inside the menu.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length && !items[focusedIndex].disabled) {
          items[focusedIndex].onSelect();
          onClose();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, items, focusedIndex, onClose]);

  // Focus the first item when the menu opens; restore focus to the trigger on close.
  useEffect(() => {
    if (!open) {
      setFocusedIndex(-1);
      if (triggerRef?.current) {
        triggerRef.current.focus({ preventScroll: true });
      }
      return;
    }
    setFocusedIndex(0);
  }, [open, triggerRef]);

  if (!open) return null;

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    minWidth: MENU_MIN_WIDTH,
    zIndex: isMobile ? 'var(--z-drawer)' : 'var(--z-dropdown)',
  };

  if (isMobile) {
    // Bottom sheet on narrow screens.
    return createPortal(
      <>
        <div
          className={styles.sheetBackdrop}
          onClick={onClose}
          style={position ?? undefined}
        />
        <motion.div
          ref={menuRef}
          role="menu"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0.15 } : SPRING}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            transform: 'none',
            ...(position ? { transformOrigin: position.origin } : {}),
          }}
          className={cx(styles.menu, styles.sheet)}
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              aria-disabled={item.disabled || undefined}
              className={cx(
                styles.sheetItem,
                item.destructive && styles.destructive,
                index === focusedIndex && styles.focused,
              )}
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (item.disabled) return;
                item.onSelect();
                onClose();
              }}
            >
              {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
              <span className={styles.itemLabel}>{item.label}</span>
            </button>
          ))}
        </motion.div>
      </>,
      document.body,
    );
  }

  return createPortal(
    <motion.div
      ref={menuRef}
      role="menu"
      style={{
        ...baseStyle,
        left: position?.left ?? anchor?.left ?? 0,
        top: position?.top ?? anchor?.top ?? 0,
        transformOrigin: position?.origin ?? 'top right',
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0.15, ease: 'linear' } : SPRING}
      className={styles.menu}
    >
      {items.map((item, index) => (
        <button
          key={index}
          type="button"
          role="menuitem"
          aria-disabled={item.disabled || undefined}
          className={cx(
            styles.menuItem,
            item.destructive && styles.destructive,
            index === focusedIndex && styles.focused,
          )}
          disabled={item.disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (item.disabled) return;
            item.onSelect();
            onClose();
          }}
        >
          {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
          <span className={styles.itemLabel}>{item.label}</span>
        </button>
      ))}
    </motion.div>,
    document.body,
  );
};
