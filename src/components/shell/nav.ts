import {
  Briefcase,
  Calendar,
  LayoutDashboard,
  MessageCircle,
  MessagesSquare,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ShellNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Primary destinations in the authenticated shell. */
export const NAV_ITEMS: ShellNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/directory', label: 'Directory', icon: Users },
  { to: '/forums', label: 'Forums', icon: MessagesSquare },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
];

/** Admin-only destination, rendered as its own group. */
export const ADMIN_ITEM: ShellNavItem = { to: '/admin', label: 'Admin', icon: ShieldCheck };

/** Mobile tab bar: 4 destinations + a More button. */
export const TAB_ITEMS: ShellNavItem[] = NAV_ITEMS.filter((item) =>
  ['/dashboard', '/directory', '/forums', '/chat'].includes(item.to),
);

/** Destinations that live inside the mobile More sheet. */
export const MORE_ITEMS: ShellNavItem[] = NAV_ITEMS.filter((item) =>
  ['/jobs', '/events'].includes(item.to),
);

/** True when `to` is the current section (handles nested paths). */
export const isItemActive = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`);

/** Compact title used by the mobile top bar. */
export function titleForPath(pathname: string): string {
  const item = [...NAV_ITEMS, ADMIN_ITEM].find((entry) => isItemActive(pathname, entry.to));
  if (item) return item.label;
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'Almanet';
}

/** Locked for unverified users — everything except the dashboard. */
export const isItemLocked = (to: string, isVerified: boolean) => !isVerified && to !== '/dashboard';
