import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { SPRING } from '../../lib/motion';
import { useSceneStepper, isVisible } from './useSceneStepper';
import s from './Scenes.module.css';

const itemMotion = (reduced: boolean) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 10, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 6, scale: 0.98 },
        transition: SPRING,
      };

export function JobScene() {
  const { ref, step, reduced } = useSceneStepper(5, 1100);
  const m = itemMotion(reduced);

  return (
    <article className={s.card} ref={ref} aria-label="Jobs preview">
      <h3 className={s.header}>Jobs — Roles and referrals from your network</h3>
      <div className={s.body} aria-live="polite">
        <AnimatePresence initial={false}>
          {isVisible(step, { at: 0 }, reduced) && (
            <motion.div key="post" {...m}>
              <span className={s.postBtn}>+ Post a job</span>
            </motion.div>
          )}
          {isVisible(step, { at: 1 }, reduced) && (
            <motion.div key="job" className={s.jobCard} {...m}>
              <p className={s.jobTitle}>Frontend Engineer</p>
              <p className={s.jobMeta}>Acme Labs · Pune</p>
              <div className={s.tags}>
                <span className={s.tag}>Full-time</span>
                <span className={s.tag}>React</span>
                <span className={s.tag}>Referral</span>
              </div>
              <p className={s.sharedBy}>Shared by Arjun · Class of 2018</p>
            </motion.div>
          )}
          {isVisible(step, { at: 3 }, reduced) && (
            <motion.div key="int" className={s.interested} {...m}>
              <span className={s.stack} aria-hidden="true">
                <span className={s.stackAv} style={{ background: '#C7E4F2' }}>P</span>
                <span className={s.stackAv} style={{ background: '#CCDAC6' }}>S</span>
                <span className={s.stackAv} style={{ background: '#D9CFF5' }}>N</span>
              </span>
              <span>3 alumni interested</span>
            </motion.div>
          )}
          {isVisible(step, { at: 4, off: 7 }, reduced) && (
            <motion.div key="toast" className={s.toast} role="status" {...m}>
              <CheckCircle2 size={16} strokeWidth={1.75} color="var(--success)" aria-hidden="true" />
              Priya applied
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
