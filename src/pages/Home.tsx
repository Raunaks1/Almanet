import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { GraduationCap, Menu, X } from 'lucide-react';
import { DURATION, EASE_REVEAL } from '../lib/motion';
import { normaliseRootMargin } from '../lib/utils';
import { cx } from '../components/ui/internal';
import { ConnectScene } from '../components/home/ConnectScene';
import { globePeople } from '../data/globePeople';
import SiteFooter from '../components/layout/SiteFooter';
import { VariableFontHover } from '../components/ui';
import { type Step } from '../components/home/HowItWorks';
import styles from './Home.module.css';
import './Home.mobile.css';

const FeatureSteps = lazy(() => import('../components/home/FeatureSteps'));
const HowItWorksLazy = lazy(() => import('../components/home/HowItWorks'));
const Faq = lazy(() => import('../components/home/Faq'));

const NAV_LINKS = [
  { label: 'Home', id: 'home' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Features', id: 'features' },
  { label: 'FAQs', id: 'faq' },
] as const;

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

/** Tiny matchMedia hook: safe SSR default of false, updates on resize/orientation. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [navActiveId, setNavActiveId] = useState<string>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const reduced = useReducedMotion() ?? false;
  const isSmallScreen = useMediaQuery('(max-width: 1023px)');
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll spy: the section crossing the upper third of the viewport
  // becomes the active nav link.
  useEffect(() => {
    const ids = ['home', 'how-it-works', 'features', 'faq'];
    let observer: IntersectionObserver | null = null;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.boundingClientRect.top - a.boundingClientRect.top)[0];
          if (visible) {
            setNavActiveId(visible.target.id);
          }
        },
        { threshold: 0.33, rootMargin: normaliseRootMargin('0px 0px -66% 0px') },
      );
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer!.observe(el);
      });
    } catch {
      // IntersectionObserver not supported or invalid options — skip scroll spy.
    }
    return () => {
      observer?.disconnect();
    };
  }, []);

  // Close menu on route change — only when the route actually changes,
  // not when menuOpen itself toggles (menuOpen is deliberately not a dep).
  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
  }, [location]);

  // Body scroll lock when menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    document.body.classList.add('menu-open');
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    } else {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
    setNavActiveId(id);
    if (isSmallScreen) setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Escape closes the menu; focus returns to the hamburger button.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Outside tap closes the menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const hamburger = hamburgerRef.current;
      const panel = document.querySelector('.home-menu-panel');
      if (hamburger && !hamburger.contains(target) && panel && !panel.contains(target)) {
        setMenuOpen(false);
        hamburger.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  return (
    <div className={cx(styles.page, 'home')}>
      {/* Floating glass pill nav */}
      <header className={cx(styles.nav, scrolled && styles.navScrolled, 'home-nav')}>
        <nav className={styles.navInner} aria-label="Primary">
          <Link to="/" className={cx(styles.brand, 'home-brand')}>
            <GraduationCap size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Almanet</span>
          </Link>
          <ul className={cx(styles.navLinks, 'home-nav-links')}>
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  className={cx(styles.navLink, navActiveId === link.id && styles.navLinkActive)}
                  href="#/"
                  onClick={scrollToSection(link.id)}
                  aria-current={navActiveId === link.id ? 'true' : undefined}
                >
                  <VariableFontHover
                    label={link.label}
                    fromFontVariationSettings="'wght' 400"
                    toFontVariationSettings="'wght' 700"
                    staggerDuration={0.03}
                    staggerFrom="center"
                  />
                </a>
              </li>
            ))}
          </ul>
          <div className={cx(styles.navActions, 'home-nav-actions')}>
            <Link to="/auth" className={styles.btnSecondary}>
              Login
            </Link>
            <Link to="/auth" className={cx(styles.btnPrimary, 'home-btn-primary')}>
              Get started
            </Link>
            {/* Hamburger menu button — hidden on desktop via CSS, shown on mobile/tablet */}
            <button
              ref={hamburgerRef}
              className="home-hamburger"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="home-menu-panel"
              onClick={toggleMenu}
              style={{ display: 'none' }}
            >
              {menuOpen ? <X size={24} strokeWidth={1.75} aria-hidden="true" /> : <Menu size={24} strokeWidth={1.75} aria-hidden="true" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile/tablet menu panel — hidden by default, animated open via CSS */}
      <div
        id="home-menu-panel"
        className={cx('home-menu-panel', menuOpen && 'open')}
        role="menu"
        aria-label="Main navigation"
        style={{ display: 'none' }}
      >
        <ul className="home-menu-list">
          {NAV_LINKS.map((link) => (
            <li key={link.id} className="home-menu-item" role="none">
              <a
                href="#/"
                onClick={scrollToSection(link.id)}
                className={cx(navActiveId === link.id && 'home-menu-item--active')}
                role="menuitem"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <hr className="home-menu-divider" aria-hidden="true" />
        <div className="home-menu-action">
          <Link to="/auth" className="home-menu-login" role="menuitem">
            Login
          </Link>
          <Link to="/auth" className="home-menu-getstarted" role="menuitem">
            Get started
          </Link>
        </div>
      </div>

      <main className={styles.main}>
        {/* Hero — headline, subtitle, and CTA buttons */}
        <section id="home" className={cx(styles.hero, 'home-hero')} aria-labelledby="home-hero-title">
          <div className={styles.container}>
            <motion.h1
              id="home-hero-title"
              className={cx(styles.heroTitle, 'home-hero-title')}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.slow, ease: EASE_REVEAL }}
            >
              Remember your batch? They remember you.
            </motion.h1>
            <motion.p
              className={cx(styles.heroSub, 'home-hero-sub')}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.slow, ease: EASE_REVEAL, delay: reduced ? 0 : DURATION.fast * 0.4 }}
            >
              Find people, share opportunities, and stay close to your community.
            </motion.p>
            <motion.div
              className={cx(styles.heroActions, 'home-hero-actions')}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.slow, ease: EASE_REVEAL, delay: reduced ? 0 : DURATION.fast * 0.8 }}
            >
              <Link to="/auth" className={cx(styles.btnPrimary, 'home-btn-primary')}>
                Get started
              </Link>
              <Link to="/auth" className={cx(styles.btnSecondary, 'home-btn-secondary')}>
                Login
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Continuous rotating 3D globe showcase overlapping slightly under the hero */}
        <section className={cx(styles.globeSection, 'home-globe-section')} aria-label="Global Alumni Network">
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

        <Suspense fallback={<div style={{ minHeight: 560 }} aria-hidden="true" />}>
          <Faq />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
