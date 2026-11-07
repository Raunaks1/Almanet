import type { Transition, Variants } from 'motion/react';

/**
 * Shared motion presets — the single source of truth for animation values.
 * Springs for interactions, the reveal curve for fades/rises.
 * CSS (`src/styles/tokens.css`) owns ms durations; these JS presets use
 * seconds, which is what motion/react expects.
 */

/** House interaction spring: stiffness 300, damping 30 — critically damped,
 *  no overshoot. Use for anything the user can grab or retarget. */
export const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 30, mass: 1 };

/** Momentum spring: slightly under-damped, for gesture releases (flicks,
 *  throws, drag hand-off). Not for taps, menus, or fades. */
export const SPRING_MOMENTUM: Transition = { type: 'spring', stiffness: 300, damping: 24, mass: 1 };

/** The reveal curve from the design constitution: cubic-bezier(0.22, 1, 0.36, 1). */
export const EASE_REVEAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Reveal durations in seconds (constitution: fades/reveals take 200–400ms). */
export const DURATION = {
  fast: 0.15,
  normal: 0.22,
  reveal: 0.32,
  slow: 0.4,
} as const;

/** Fade in/out. */
export const fadeIn = (duration: number = DURATION.reveal): Variants => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration, ease: EASE_REVEAL } },
  exit: { opacity: 0, transition: { duration: DURATION.normal, ease: EASE_REVEAL } },
});

/** 8px rise on the reveal curve — page and hero entrance. */
export const riseIn = (distance: number = 8, duration: number = DURATION.reveal): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: { opacity: 1, y: 0, transition: { duration, ease: EASE_REVEAL } },
  exit: { opacity: 0, y: distance / 2, transition: { duration: DURATION.normal, ease: EASE_REVEAL } },
});

/** Stagger bounds: 40ms step, at most 8 items animate (constitution). */
export const STAGGER_STEP = 0.04;
export const MAX_STAGGER_ITEMS = 8;

/** Parent wrapper for a staggering list: `animate="visible"` +
 *  `variants={listStagger().parent}`, children use `listStagger().child`. */
export const listStagger = (step: number = STAGGER_STEP): { parent: Variants; child: Variants } => ({
  parent: {
    hidden: {},
    visible: { transition: { staggerChildren: step } },
  },
  child: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE_REVEAL } },
  },
});

/** Compress the stagger step once a list exceeds the 8-item budget, so the
 *  total stagger window (≈ step × 8) stays constant no matter the length. */
export const clampStaggerStep = (items: number, step: number = STAGGER_STEP): number => {
  if (items <= MAX_STAGGER_ITEMS) return step;
  return (step * MAX_STAGGER_ITEMS) / items;
};

/** Swap a transition for a short fade when the OS asks for reduced motion:
 *  no springs, no parallax — plain fades only. */
export const withReducedMotion = (reduced: boolean, transition: Transition): Transition =>
  reduced ? { duration: 0.15, ease: 'linear' } : transition;
