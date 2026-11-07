import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MessagesSquare, ArrowBigUp } from 'lucide-react';
import styles from './storyScenes.module.css';

export function StoryForumsScene({ active = true, staticMode = false }: { active?: boolean; staticMode?: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const showAll = staticMode || reduced;
  const [step, setStep] = useState(showAll ? 4 : 0);
  const [votes, setVotes] = useState(showAll ? [12, 9] : [3, 2]);

  useEffect(() => {
    if (showAll) { setStep(4); setVotes([12, 9]); return; }
    if (!active) { setStep(0); setVotes([3, 2]); return; }
    setStep(0); setVotes([3, 2]);
    const t1 = window.setTimeout(() => setStep(1), 250);
    const t2 = window.setTimeout(() => setStep(2), 800);
    const t3 = window.setTimeout(() => setStep(3), 1350);
    const t4 = window.setTimeout(() => { setStep(4); setVotes([12, 9]); }, 1900);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [active, showAll]);

  const appear = (on: boolean, delay = 0) => ({
    initial: showAll ? false : { opacity: 0, y: 8 },
    animate: { opacity: on ? 1 : 0, y: on ? 0 : 8 },
    transition: { duration: 0.24, delay },
  });

  return (
    <div className={styles.scene} aria-label="Forums preview">
      <div className={styles.sceneHeader}>
        <span className={styles.sceneIcon} aria-hidden="true"><MessagesSquare size={17} strokeWidth={1.75} /></span>
        <div className={styles.sceneTitleWrap}>
          <p className={styles.sceneTitle}>Forums</p>
          <p className={styles.sceneSub}>Questions answered by alumni</p>
        </div>
        {step >= 4 && <span className={`${styles.badge} ${styles.badgeAnswered}`} style={{ marginLeft: 'auto' }}>Answered by the community</span>}
      </div>
      <div className={styles.sceneBody}>
        <motion.div className={styles.question} {...appear(step >= 1)}>
          <div className={styles.qMeta}><span className={styles.avatar} aria-hidden="true">S</span> Sara · New York</div>
          <p className={styles.qText}>Moving from services to product. Any advice?</p>
        </motion.div>
        <motion.div className={styles.reply} {...appear(step >= 2)}>
          <span className={styles.avatar} aria-hidden="true" style={{ background: 'linear-gradient(135deg,#34c759,#0a84ff)' }}>R</span>
          <div className={styles.replyBody}>
            <div className={styles.replyName}>Rohan</div>
            <p className={styles.replyText}>Build a small product case study from your current work — it translates well.</p>
          </div>
          <span className={styles.votes} aria-label={`${votes[0]} upvotes`}><ArrowBigUp size={15} strokeWidth={1.75} /> {votes[0]}</span>
        </motion.div>
        <motion.div className={styles.reply} {...appear(step >= 3)}>
          <span className={styles.avatar} aria-hidden="true">N</span>
          <div className={styles.replyBody}>
            <div className={styles.replyName}>Neha</div>
            <p className={styles.replyText}>Talk to PMs in your target domain; referrals helped me make the switch.</p>
          </div>
          <span className={styles.votes} aria-label={`${votes[1]} upvotes`}><ArrowBigUp size={15} strokeWidth={1.75} /> {votes[1]}</span>
        </motion.div>
      </div>
    </div>
  );
}
