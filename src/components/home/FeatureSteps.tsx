import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import './FeatureSteps.css';

const ChatScene = lazy(() => import('./scenes/ChatScene'));
const JobsScene = lazy(() => import('./scenes/JobsScene'));
const DirectoryScene = lazy(() => import('./scenes/DirectoryScene'));
const ForumScene = lazy(() => import('./scenes/ForumScene'));

export interface Feature {
  step: string;
  title: string;
  content: string;
  scene?: React.ReactNode;
}

export interface FeatureStepsProps {
  features?: Feature[];
  title?: string;
  subtitle?: string;
  autoPlayInterval?: number;
  className?: string;
}

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const SCENES = [<ChatScene key="s1" />, <JobsScene key="s2" />, <DirectoryScene key="s3" />, <ForumScene key="s4" />];

const DEFAULT_FEATURES: Feature[] = [
  {
    step: '01',
    title: 'Realtime chat',
    content: 'Message your batch or any member directly, with typing indicators and read receipts.',
  },
  {
    step: '02',
    title: 'Jobs and referrals',
    content: 'Alumni post openings and offer to refer you, so opportunities reach you through people you trust.',
  },
  {
    step: '03',
    title: 'Alumni directory',
    content: 'Search verified alumni by name, skill, industry, and graduation year.',
  },
  {
    step: '04',
    title: 'Community forums',
    content: 'Share updates, ask questions and start discussions with your college community.',
  },
];

const EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

export default function FeatureSteps({
  features = DEFAULT_FEATURES,
  title = 'One network. Everything you need.',
  subtitle = 'Chat, hire, discover and discuss, all in one trusted space.',
  autoPlayInterval = 6000,
  className,
}: FeatureStepsProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [current, setCurrent] = useState(0);
  const [pausedHover, setPausedHover] = useState(false);
  const [pausedFocus, setPausedFocus] = useState(false);
  const [pausedHidden, setPausedHidden] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false,
  );
  const [inView, setInView] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [revealed, setRevealed] = useState(false);

  const paused = pausedHover || pausedFocus || pausedHidden || !inView;

  // Section in view (for autoplay gating) — IntersectionObserver as specified
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reveal header/steps once when scrolled into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setRevealed(true);
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pause while tab hidden
  useEffect(() => {
    const onVis = () => setPausedHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Autoplay: ONE setTimeout keyed on [current, paused, inView, reduceMotion]
  useEffect(() => {
    if (reduceMotion || paused || features.length <= 1) return;
    const id = window.setTimeout(() => {
      setCurrent((c) => (c + 1) % features.length);
    }, autoPlayInterval);
    return () => window.clearTimeout(id);
  }, [current, paused, inView, reduceMotion, autoPlayInterval, features.length]);

  const jumpTo = useCallback(
    (index: number) => {
      setCurrent(index);
      buttonRefs.current[index]?.focus();
    },
    [],
  );

  const onStepKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      jumpTo(index);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (index + 1) % features.length;
      buttonRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (index - 1 + features.length) % features.length;
      buttonRefs.current[prev]?.focus();
    }
  };

  const onFocusCapture = (e: React.FocusEvent<HTMLElement>) => {
    if (sectionRef.current?.contains(e.target)) setPausedFocus(true);
  };
  const onBlurCapture = (e: React.FocusEvent<HTMLElement>) => {
    const next = e.relatedTarget as Node | null;
    if (!next || !sectionRef.current?.contains(next)) setPausedFocus(false);
  };

  const dur = reduceMotion ? 0 : 0.45;
  const showProgress = !paused && !reduceMotion;

  return (
    <section
      id="features"
      aria-labelledby="features-title"
      ref={sectionRef}
      className={cn('fs-section', className)}
      onPointerEnter={() => setPausedHover(true)}
      onPointerLeave={() => setPausedHover(false)}
      onFocusCapture={onFocusCapture}
      onBlurCapture={onBlurCapture}
    >
      <div className="fs-wrap">
        <motion.header
          className="fs-header"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={revealed ? { opacity: 1, y: 0 } : reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE }}
        >
          <p className="fs-eyebrow">FEATURES</p>
          <h2 id="features-title" className="fs-title">{title}</h2>
          <p className="fs-subtitle">{subtitle}</p>
        </motion.header>

        <div className="fs-body">
          <motion.div
            className="fs-steps-col"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={revealed ? { opacity: 1, y: 0 } : reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE, delay: reduceMotion ? 0 : 0.06 }}
          >
            <div className="fs-steps" role="group" aria-label="Feature steps">
              {features.map((feature, index) => {
                const active = index === current;
                const done = index < current;
                return (
                  <button
                    key={feature.step}
                    ref={(el) => { buttonRefs.current[index] = el; }}
                    type="button"
                    className={cn('fs-step', active && 'fs-step--active', done && 'fs-step--done')}
                    aria-pressed={active}
                    onClick={() => jumpTo(index)}
                    onKeyDown={(e) => onStepKeyDown(e, index)}
                  >
                    <span className="fs-num" aria-hidden="true">
                      {done ? <Check size={16} strokeWidth={2.25} /> : feature.step}
                    </span>
                    <span className="fs-step-body">
                      <span className="fs-step-title">{feature.title}</span>
                      <span className="fs-step-content">{feature.content}</span>
                      {active && (
                        <span className="fs-progress" aria-hidden="true">
                          {showProgress ? (
                            <span
                              key={current}
                              className="fs-progress-fill fs-progress-fill--run"
                              style={{ animationDuration: `${autoPlayInterval}ms` }}
                            />
                          ) : null}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="fs-stage-col">
            <div className="fs-stage">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current}
                  className="fs-stage-inner"
                  initial={reduceMotion ? false : { y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reduceMotion ? { opacity: 1 } : { y: -40, opacity: 0 }}
                  transition={{ duration: dur, ease: EASE }}
                >
                  <Suspense fallback={<div style={{ width: '100%', height: '100%' }} />}>
                    {features[current].scene ?? SCENES[current] ?? null}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
