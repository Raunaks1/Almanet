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

export function ForumScene() {
  const { ref, step, reduced } = useSceneStepper(5, 1100);
  const m = itemMotion(reduced);

  return (
    <article className={s.card} ref={ref} aria-label="Forums preview">
      <h3 className={s.header}>Forums — Ask, answer and discuss</h3>
      <div className={s.body} aria-live="polite">
        <AnimatePresence initial={false}>
          {isVisible(step, { at: 1 }, reduced) && (
            <motion.div key="post" className={s.postCard} {...m}>
              <div className={s.postMeta}>Sara · London · Career</div>
              <p className={s.postTitle}>Moving from services to product — any advice?</p>
            </motion.div>
          )}
          {isVisible(step, { at: 2 }, reduced) && (
            <motion.div key="r1" className={s.reply} {...m}>
              <div className={s.replyName}>Rohan</div>
              <p className={s.replyText}>Start with a small internal product project to build proof.</p>
            </motion.div>
          )}
          {isVisible(step, { at: 3 }, reduced) && (
            <motion.div key="r2" className={s.reply} {...m}>
              <div className={s.replyName}>Neha</div>
              <p className={s.replyText}>Highlight outcomes and user impact, not just delivery.</p>
            </motion.div>
          )}
          {isVisible(step, { at: 4 }, reduced) && (
            <motion.div key="r3" className={s.reply} {...m}>
              <div className={s.replyName}>Asha</div>
              <p className={s.replyText}>Talk to PMs in your network — referrals help a lot.</p>
            </motion.div>
          )}
          {isVisible(step, { at: 5 }, reduced) && (
            <motion.div key="votes" className={s.votes} {...m}>
              ▲ 24 upvotes · 3 replies
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
