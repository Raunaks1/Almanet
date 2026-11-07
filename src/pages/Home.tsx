import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import { DURATION, EASE_REVEAL } from '../lib/motion';
import { cx } from '../components/ui/internal';
import { NetworkScene } from '../components/home/NetworkScene';
import { ChatScene } from '../components/home/ChatScene';
import { JobScene } from '../components/home/JobScene';
import { ForumScene } from '../components/home/ForumScene';
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
      {/* 1. Floating glass pill nav — stronger blur + hairline once scrollY > 8 */}
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

      <main>
        {/* 2. Hero */}
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

        {/* 3. Network scene */}
        <section className={styles.container} aria-label="Community network">
          <div className={styles.sceneWrap}>
            <NetworkScene />
          </div>
        </section>

        {/* 4. Heading */}
        <section className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Everything happens in one place.</h2>
            <p className={styles.sectionSub}>Chat, jobs, and discussions — connected through your alumni community.</p>
          </div>
        </section>

        {/* 5. Three glass cards */}
        <section className={styles.container} aria-label="Product scenes">
          <div className={styles.cardsGrid}>
            <ChatScene />
            <JobScene />
            <ForumScene />
          </div>
        </section>

        {/* 6. How it works */}
        <section className={styles.container} aria-labelledby="how-title">
          <div className={styles.sectionHead}>
            <h2 id="how-title" className={styles.sectionTitle}>
              How it works
            </h2>
          </div>
          <div className={styles.howRow} role="list">
            <div className={styles.howPill} role="listitem">
              <span className={styles.howNum} aria-hidden="true">1</span>
              <span>Create your account</span>
            </div>
            <div className={styles.howPill} role="listitem">
              <span className={styles.howNum} aria-hidden="true">2</span>
              <span>Get verified</span>
            </div>
            <div className={styles.howPill} role="listitem">
              <span className={styles.howNum} aria-hidden="true">3</span>
              <span>Connect and contribute</span>
            </div>
          </div>
        </section>

        {/* 7. Final CTA glass block */}
        <section className={styles.container} aria-labelledby="cta-title">
          <div className={styles.ctaBlock}>
            <h2 id="cta-title" className={styles.ctaTitle}>
              Join your college network.
            </h2>
            <div className={styles.heroActions} style={{ marginTop: 18 }}>
              <Link to="/auth" className={styles.btnPrimary}>
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 8. One-line footer — keep existing /about, /privacy, /terms links */}
      <footer className={styles.footer}>
        <div className={cx(styles.container, styles.footerInner)}>
          <span>© 2026 AlmaNET</span>
          <ul className={styles.footerLinks}>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy</Link>
            </li>
            <li>
              <Link to="/terms">Terms</Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
