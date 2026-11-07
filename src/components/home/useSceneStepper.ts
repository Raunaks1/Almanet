import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

/**
 * Steps a scene forward while its card is in view, pauses offscreen, and loops.
 * - starts when the card is >= ~30% in view
 * - advances step 0..(stepCount + 2), then resets to 0
 * - reduced motion: returns the final step (no looping/animation driver)
 */
export function useSceneStepper(stepCount: number, intervalMs = 1100) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion() ?? false;
  const finalStep = stepCount + 2;
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) return;
    if (!inView) return;
    const id = window.setInterval(() => {
      setStep((s) => (s >= finalStep ? 0 : s + 1));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [inView, reduced, finalStep, intervalMs]);

  if (reduced) return { ref, step: finalStep, reduced: true } as const;
  return { ref, step, reduced: false } as const;
}

export type SceneItem = { at: number; off?: number };
export const isVisible = (step: number, item: SceneItem, reduced = false) =>
  step >= item.at && (reduced || item.off == null || step < item.off);
