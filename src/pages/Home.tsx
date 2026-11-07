import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import { DURATION, EASE_REVEAL } from '../lib/motion';
import { cx } from '../components/ui/internal';
import { ConnectScene } from '../components/home/ConnectScene';
import { globePeople } from '../data/globePeople';
import SiteFooter from '../components/layout/SiteFooter';
import styles from './Home.module.css';

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
            <span>AlmaNET</span>
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

      </main>

      <SiteFooter />
    </div>
  );
}
