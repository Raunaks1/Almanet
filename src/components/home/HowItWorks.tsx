import React, { useEffect, useRef, useState } from 'react';
import { LazyMotion, domAnimation, m, useInView, useReducedMotion } from 'motion/react';
import { Pin } from 'lucide-react';
import './HowItWorks.css';

export interface Step {
  step: string;
  title: string;
  description: string;
  theme: 'orange' | 'blue' | 'purple' | 'green';
}

export interface HowItWorksProps {
  steps?: Step[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const DEFAULT_STEPS: Step[] = [
  { step: '01', title: 'Create your profile', description: 'Sign up with your college, branch, degree and graduation year.', theme: 'blue' },
  { step: '02', title: 'Get verified', description: 'College admins confirm you belong, so every member is real.', theme: 'orange' },
  { step: '03', title: 'Explore the network', description: 'Browse the alumni directory, jobs, events and forums.', theme: 'purple' },
  { step: '04', title: 'Connect and grow', description: 'Message your batch, ask for referrals and stay in touch after graduation.', theme: 'green' },
];

const CARD_POSITIONS = [
  { left: '12%', top: '0%', rotate: '-4deg' },
  { left: '60%', top: '13%', rotate: '4deg' },
  { left: '12%', top: '50%', rotate: '-4deg' },
  { left: '60%', top: '63%', rotate: '4deg' },
];

const PATH_D =
  'M 260 115 C 520 115, 480 215, 740 215 C 740 380, 260 330, 260 495 C 520 495, 480 595, 740 595';

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export default function HowItWorks({
  steps = DEFAULT_STEPS,
  title = 'Up and running in four steps.',
  subtitle = 'From sign-up to your first connection.',
  className,
}: HowItWorksProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isStageInView = useInView(stageRef, { amount: 0.1, once: false }) ?? false;

  // Pause the travelling dot (SMIL) when the stage is off-screen.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (isStageInView) {
      svg.unpauseAnimations?.();
    } else {
      svg.pauseAnimations?.();
    }
  }, [isStageInView]);

  return (
    <LazyMotion features={domAnimation}>
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className={cn('hiw-section', className)}
        ref={stageRef}
        data-active={isStageInView ? 'true' : 'false'}
      >
        <div className="hiw-wrap">
          <m.header
            className="hiw-header"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="hiw-eyebrow">HOW IT WORKS</p>
            <h2 id="how-it-works-title" className="hiw-title">
              {title}
            </h2>
            <p className="hiw-subtitle">{subtitle}</p>
          </m.header>

          <div className="hiw-stage">
            <svg
              ref={svgRef}
              className="hiw-path-svg"
              viewBox="0 0 1000 760"
              pointerEvents="none"
              aria-hidden="true"
            >
              <path
                id="hiw-path"
                className="hiw-path"
                d={PATH_D}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle className="hiw-dot-bg" r="11">
                <animateMotion dur="9s" repeatCount="indefinite" begin="1.5s">
                  <mpath href="#hiw-path" />
                </animateMotion>
              </circle>
              <circle className="hiw-dot" r="5">
                <animateMotion dur="9s" repeatCount="indefinite" begin="1.5s">
                  <mpath href="#hiw-path" />
                </animateMotion>
              </circle>
            </svg>

            {steps.map((step, index) => {
              const pos = CARD_POSITIONS[index];
              return (
                <m.div
                  key={step.step}
                  className="hiw-card-wrap"
                  style={{ left: pos.left, top: pos.top, width: '28%' }}
                  initial={{ opacity: 0, y: -28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    type: 'spring',
                    stiffness: 120,
                    damping: 16,
                    delay: index * 0.18,
                  }}
                >
                  <div
                    className={cn('hiw-card', `hiw-card--${step.theme}`)}
                    style={{ rotate: pos.rotate }}
                  >
                    <m.span
                      className="hiw-pin-wrap"
                      initial={{ scale: 1.25 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.18 + 0.3 }}
                      style={{ display: 'inline-block' }}
                    >
                      <Pin className="hiw-pin" size={32} strokeWidth={1.75} />
                    </m.span>
                    <div className="hiw-panel">
                      <span className="hiw-number" aria-hidden="true">
                        {step.step}
                      </span>
                      <h3 className="hiw-card-title">{step.title}</h3>
                      <p className="hiw-card-desc">{step.description}</p>
                    </div>
                  </div>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
