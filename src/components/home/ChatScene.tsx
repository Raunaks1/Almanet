import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
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

export function ChatScene() {
  const { ref, step, reduced } = useSceneStepper(5, 1100);
  const m = itemMotion(reduced);

  return (
    <article className={s.card} ref={ref} aria-label="Chat preview">
      <h3 className={s.header}>Chat — Batch groups and direct messages</h3>
      <div className={s.body} aria-live="polite">
        <AnimatePresence initial={false}>
          {isVisible(step, { at: 1 }, reduced) && (
            <motion.div key="m1" {...m}>
              <div className={s.sender}>Asha</div>
              <div className={s.bubbleRow}>
                <div className={`${s.bubble} ${s.bubbleIn}`}>Anyone joining the alumni meetup next week?</div>
              </div>
            </motion.div>
          )}
          {isVisible(step, { at: 2, off: 3 }, reduced) && (
            <motion.div key="typing" className={`${s.bubbleRow} ${s.bubbleRowOwn}`} {...m}>
              <div className={s.typing} aria-label="Typing">
                <span className={s.dot} />
                <span className={s.dot} />
                <span className={s.dot} />
              </div>
            </motion.div>
          )}
          {isVisible(step, { at: 3 }, reduced) && (
            <motion.div key="m2" className={`${s.bubbleRow} ${s.bubbleRowOwn}`} {...m}>
              <div className={`${s.bubble} ${s.bubbleOut}`}>Count me in — see you there!</div>
            </motion.div>
          )}
          {isVisible(step, { at: 4 }, reduced) && (
            <motion.div key="m3" {...m}>
              <div className={s.sender}>Neha</div>
              <div className={s.bubbleRow}>
                <div className={`${s.bubble} ${s.bubbleIn}`}>I'll book the venue.</div>
              </div>
            </motion.div>
          )}
          {isVisible(step, { at: 5 }, reduced) && (
            <motion.div key="seen" className={s.seen} {...m}>
              Seen by 12
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
