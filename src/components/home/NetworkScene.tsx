import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import styles from './NetworkScene.module.css';

// TODO: replace with real product content
const PROFILES = [
  { name: 'Asha', initial: 'A', role: 'Alumni', city: 'Hyderabad', color: '#C7E4F2', pos: { left: 18, top: 22 }, startOffset: { x: -40, y: -30 } },
  { name: 'Rohan', initial: 'R', role: 'Student', city: 'Pune', color: '#CCDAC6', pos: { left: 82, top: 20 }, startOffset: { x: 40, y: -30 } },
  { name: 'Neha', initial: 'N', role: 'Alumni', city: 'Mumbai', color: '#D9CFF5', pos: { left: 12, top: 58 }, startOffset: { x: -45, y: 10 } },
  { name: 'Arjun', initial: 'A', role: 'Student', city: 'Bengaluru', color: '#F6DEC8', pos: { left: 88, top: 56 }, startOffset: { x: 45, y: 10 } },
  { name: 'Meera', initial: 'M', role: 'Alumni', city: 'London', color: '#C7E4F2', pos: { left: 30, top: 82 }, startOffset: { x: -20, y: 40 } },
  { name: 'Kiran', initial: 'K', role: 'Student', city: 'Singapore', color: '#CCDAC6', pos: { left: 70, top: 84 }, startOffset: { x: 20, y: 40 } },
] as const;

// Two profiles show chat bubbles after connecting (indices into PROFILES)
const BUBBLES = [
  { index: 0, text: 'Hey!' },
  { index: 3, text: 'Hello!' },
];

const CYCLE_MS = 10000;
const STAGGER_MS = 200;
const FLY_MS = 720;
const CONNECT_AT = STAGGER_MS * (PROFILES.length - 1) + FLY_MS + 250; // ~1970ms
const BUBBLE_AT = CONNECT_AT + 900; // ~2870ms
const FADE_AT = 8600; // fade out near end, then restart

type Phase = 'fly' | 'connect' | 'bubble' | 'hold' | 'fade';

const phaseFor = (t: number): Phase => {
  if (t >= FADE_AT) return 'fade';
  if (t >= BUBBLE_AT) return 'bubble';
  if (t >= CONNECT_AT) return 'connect';
  return 'fly';
};

export function NetworkScene() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const reduced = useReducedMotion() ?? false;
  const [cycle, setCycle] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (reduced || !inView) return;
    let raf = 0;
    let start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      if (t >= CYCLE_MS) {
        setCycle((c) => c + 1);
        start = now;
        setElapsed(0);
      } else {
        setElapsed(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, inView, cycle]);

  const phase: Phase = reduced ? 'bubble' : phaseFor(elapsed);
  const showLines = reduced || phase === 'connect' || phase === 'bubble' || phase === 'hold' || phase === 'fade';
  const showBubbles = reduced || phase === 'bubble' || phase === 'hold' || phase === 'fade';
  const fading = !reduced && phase === 'fade';

  return (
    <div
      ref={ref}
      className={styles.stage}
      role="img"
      aria-label="Animated illustration of alumni and students around the world connecting through the AlmaNET hub, sharing messages across cities."
    >
      <div className={styles.scene} aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={reduced ? 'static' : cycle}
            style={{ position: 'absolute', inset: 0 }}
            initial={false}
            animate={{ opacity: fading ? 0 : 1 }}
            transition={{ duration: fading ? 0.5 : 0.01, ease: 'easeOut' }}
          >
            {/* Connections */}
            <svg className={styles.lines} viewBox="0 0 100 100" preserveAspectRatio="none">
              {PROFILES.map((p, i) => (
                <motion.line
                  key={p.name}
                  className={`${styles.line} ${showLines && !reduced ? styles.lineFlow : ''}`}
                  x1={p.pos.left}
                  y1={p.pos.top}
                  x2={50}
                  y2={50}
                  initial={false}
                  animate={{ opacity: showLines ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : 0.4, ease: 'easeOut' }}
                  style={{ transitionDelay: reduced ? '0ms' : `${i * 40}ms` }}
                />
              ))}
            </svg>

            {/* Hub */}
            <span className={`${styles.ring} ${!reduced ? styles.ringPulse : ''}`} />
            <div className={styles.hub}>AlmaNET</div>

            {/* Profiles */}
            {PROFILES.map((p, i) => (
              <div
                key={`${cycle}-${p.name}`}
                className={`${styles.node} ${!reduced ? styles.nodeFly : ''}`}
                style={{
                  left: `${p.pos.left}%`,
                  top: `${p.pos.top}%`,
                  ['--ox' as any]: `${p.startOffset.x}cqw`,
                  ['--oy' as any]: `${p.startOffset.y}cqh`,
                  ['--delay' as any]: reduced ? '0ms' : `${i * STAGGER_MS}ms`,
                }}
              >
                {showBubbles &&
                  BUBBLES.filter((b) => b.index === i).map((b) => (
                    <span key={b.text} className={`${styles.bubble} ${!reduced ? styles.bubblePop : ''}`}>
                      {b.text}
                    </span>
                  ))}
                <span className={styles.avatar} style={{ background: p.color }}>
                  {p.initial}
                </span>
                <span className={styles.labelName}>{p.name}</span>
                <span className={styles.labelMeta}>
                  {p.role} · {p.city}
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
