import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import styles from './storyScenes.module.css';

const MESSAGES = [
  { from: 'Asha', text: 'Anyone joining the alumni meetup next week?' },
  { from: 'Rohan', text: 'Count me in — I can help with the venue shortlist.' },
  { from: 'Neha', text: 'I’ll post the details in Events once we lock the date.' },
  { from: 'You', text: 'Sounds great. I’ll bring a couple of juniors along.' },
];

export function StoryChatScene({ active = true, staticMode = false }: { active?: boolean; staticMode?: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const showAll = staticMode || reduced;
  const [count, setCount] = useState(showAll ? MESSAGES.length : 0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (showAll) {
      setCount(MESSAGES.length);
      setTyping(false);
      return;
    }
    if (!active) {
      setCount(0);
      setTyping(false);
      return;
    }
    let i = 0;
    setCount(0);
    setTyping(true);
    const timers: number[] = [];
    const step = () => {
      if (i >= MESSAGES.length) {
        setTyping(false);
        return;
      }
      timers.push(window.setTimeout(() => {
        i += 1;
        setCount(i);
        if (i < MESSAGES.length) {
          setTyping(true);
          timers.push(window.setTimeout(step, 650));
        } else {
          setTyping(false);
        }
      }, i === 0 ? 500 : 350));
    };
    step();
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, showAll]);

  return (
    <div className={styles.scene} aria-label="Chat preview">
      <div className={styles.sceneHeader}>
        <span className={styles.sceneIcon} aria-hidden="true"><MessageCircle size={17} strokeWidth={1.75} /></span>
        <div className={styles.sceneTitleWrap}>
          <p className={styles.sceneTitle}>Batch 2018 · Computer Engineering</p>
          <p className={styles.sceneSub}>Messages</p>
        </div>
      </div>
      <div className={styles.sceneBody}>
        <div className={styles.msgList} aria-live="polite">
          {MESSAGES.slice(0, count).map((m) => (
            <motion.div
              key={m.from + m.text}
              className={`${styles.msg} ${m.from === 'You' ? styles.msgYou : ''}`}
              initial={showAll ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              {m.from !== 'You' && <div className={styles.msgMeta}>{m.from}</div>}
              <div>{m.text}</div>
            </motion.div>
          ))}
          {typing && !showAll && (
            <div className={styles.typing} aria-label="Typing">
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
