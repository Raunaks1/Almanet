import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE_REVEAL } from '../../lib/motion';

/**
 * Route-level entrance: fade + 8px rise, keyed on the pathname so each
 * navigation replays it. Reduced motion gets a plain fade.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      key={pathname}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced
          ? { duration: DURATION.fast, ease: 'linear' }
          : { duration: DURATION.reveal, ease: EASE_REVEAL }
      }
    >
      {children}
    </motion.div>
  );
};
