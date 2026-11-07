import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import { DURATION, EASE_REVEAL } from '../lib/motion';
import { cx } from '../components/ui/internal';
import { ConnectScene } from '../components/home/ConnectScene';
import { globePeople } from '../data/globePeople';
import SiteFooter from '../components/layout/SiteFooter';
import { type Step } from '../components/home/HowItWorks';
import styles from './Home.module.css';

const FeatureSteps = lazy(() => import('../components/home/FeatureSteps'));
const HowItWorksLazy = lazy(() => import('../components/home/HowItWorks'));

const HOW_IT_WORKS: Step[] = [
  { step: '01', title: 'Create your profile', description: 'Sign up with your college, branch, degree and graduation year.', theme: 'blue' },
  { step: '02', title: 'Get verified', description: 'College admins confirm you belong, so every member is real.', theme: 'orange' },
  { step: '03', title: 'Explore the network', description: 'Browse the alumni directory, jobs, events and forums.', theme: 'purple' },
  { step: '04', title: 'Connect and grow', description: 'Message your batch, ask for referrals and stay in touch after graduation.', theme: 'green' },
];

const FEATURES = [
  { step: '01', title: 'Realtime chat', content: 'Message your batch or any member directly, with typing indicators and read receipts.' },
  { step: '02', title: 'Jobs and referrals', content: 'Alumni post openings and offer to refer you, so opportunities reach you through people you trust.' },
  { step: '03', title: 'Alumni directory', content: 'Search verified alumni by name, skill, industry, and graduation year.' },
  { step: '04', title: 'Community forums', content: 'Share updates, ask questions and start discussions with your college community.' },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={styles.page}>
      {/* Floating glass pill nav */}
      <header className={cx(styles.nav, scrolled && styles.navScrolled)}>
        <nav className={styles.navInner} aria-label="Primary">
          <Link to="/" className={styles.brand}>
            <GraduationCap size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Almanet</span>
          </Link>
          <div className={styles.navActions}>
            <Link to="/auth" className={styles.btnSecondary}>
              Login
            </Link>
            <Link to="/auth" className={styles.btnPrimary}>
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        {/* Hero — headline, subtitle, and CTA buttons */}
        <section className={styles.hero} aria-labelledby="home-hero-title">
          <div className={styles.container}>
            <motion.h1
              id="home-hero-title"
              className={styles.heroTitle}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.slow, ease: EASE_REVEAL }}
            >
              Your alumni network, beautifully connected.
            </motion.h1>
            <motion.p
              className={styles.heroSub}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.slow, ease: EASE_REVEAL, delay: reduced ? 0 : DURATION.fast * 0.4 }}
            >
              Find people, share opportunities, and stay close to your community.
            </motion.p>
            <motion.div
              className={styles.heroActions}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.slow, ease: EASE_REVEAL, delay: reduced ? 0 : DURATION.fast * 0.8 }}
            >
              <Link to="/auth" className={styles.btnPrimary}>
                Get started
              </Link>
              <Link to="/auth" className={styles.btnSecondary}>
                Login
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Continuous rotating 3D globe showcase overlapping slightly under the hero */}
        <section className={styles.globeSection} aria-label="Global Alumni Network">
          <ConnectScene
            items={globePeople}
            autoplay={true}
            size={284}
            layout="side-by-side"
          />
        </section>

        <Suspense fallback={<div style={{ minHeight: 560 }} aria-hidden="true" />}>
          <HowItWorksLazy steps={HOW_IT_WORKS} />
        </Suspense>

        <Suspense fallback={<div style={{ minHeight: 560 }} aria-hidden="true" />}>
          <FeatureSteps features={FEATURES} />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
