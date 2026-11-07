import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants, useInView, useReducedMotion } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import { DURATION, EASE_REVEAL, listStagger, riseIn } from '../../lib/motion';
import styles from './SiteFooter.module.css';

interface SocialEntry {
  name: string;
  url: string;
  icon: React.ReactNode;
}

// TODO: add real profile URLs.
const SOCIALS: SocialEntry[] = [
  {
    name: 'GitHub',
    url: '',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C-4.42 16.6-2.18 12.55-2.18 12.55-2.18 12.55 0 10.05 0 10.05c0-2.15.87-3.82 2.34-5.18.3-.26.5-.56.65-.84-1.05-.22-1.82-.9-2.67-1.15-.54-.68-1.31-1.2-2.3-.44C1.18 6.88 2.7 7.67 3.37 7.9c.8.3 1.48.6 2.03.77.55-.43 1.23-.72 2.03-.97-.02-.49-.2-.92-.2-1.88 0-.43.14-.82.38-1.11 0 0 .32-.1 1.04.38 1.21-.31 2.54-.47 3.84-.47 1.3 0 2.63.16 3.84.47.72-.48 1.04-.38 1.04-.38.24.29.38.68.38 1.11 0 .96-.15 1.39-.2 1.88.8.25 1.48.54 2.03.97.55-.17 1.23-.47 2.03-.77.67-.23 2.19-1.01 3.37-1.47 1.49-.76 2.75-1.23 2.75-1.23.39.29.65.58.78.95 1.61 1.36 2.34 2.68 2.34 5.18 0 4.47-3.88 7.58-8.27 9.38.65.6 1.01 1.43 1.01 2.25 0 1.63 0 2.95 0 3.34 0 .32.22.7.84.57 4.77-1.59 8.2-6.08 8.2-11.385 0-6.627-5.374-12-12-12z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    url: '',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.063 0-1.138.92-2.063 2.063-2.063 1.14 0 2.063.925 2.063 2.063 0 1.139-.923 2.063-2.063 2.063zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v16.542C0 19.226.792 20 1.771 20h20.451C23.2 20 24 19.226 24 18.271V1.729C24 .774 23.2 0 22.225 0z" />
      </svg>
    ),
  },
  {
    name: 'X',
    url: '',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M23.237 1.259a24.9 24.9 0 0 0-8.252.925c4.818 1.996 7.944 6.564 7.944 12.344 0 0.096-.006 0.189-.007 0.285 0 6.861-5.247 12.437-11.727 12.437-2.169 0-4.156-.59-5.91-1.618 0.837 0.101 1.651-.025 2.414-.749-2.403-.22-4.538-1.36-5.71-3.316 0.784 0.137 1.536 0.082 2.192-0.49-2.345-0.42-4.292-2.02-4.98-4.276 0.547 0.091 1.065 0.072 1.559 0.048-2.222-0.52-3.835-2.435-3.835-4.639 0-0.102 0.007-0.199 0.012-0.298 0.73 0.238 1.553 0.374 2.422 0.36-1.046-0.257-1.803-1.181-1.803-2.269 0-0.5 0.126-0.974 0.366-1.423 0.979 1.007 2.368 1.604 3.882 1.746-0.935-0.304-1.92-0.737-2.928-1.318-0.328 1.034-0.122 2.227 0.484 3.014-1.067-0.106-2.093-0.4-2.997-0.908v0.045c0 4.675 3.288 8.568 7.681 9.445-0.8 0.231-1.645 0.37-2.517 0.37-0.612 0-1.207-0.068-1.788-0.187 0.629 1.962 2.471 3.393 4.638 3.432-3.26 2.543-7.393 2.627-11.073 0.877-0.294 0.573-0.635 0.815-1.021 2.489 3.424 7.874 4.593 12.656 3.226-2.124 1.482-4.549 2.306-7.06 2.306-0.425 0-0.841-0.033-1.254-0.094 2.223 1.421 4.962 2.226 7.844 2.226 9.423 0 14.563-7.804 14.563-14.563 0-0.221-0.006-0.439-0.013-0.657 6.585-1.738 11.8-6.262 14.625-12.216a24.9 24.9 0 0 0-3.047-3.667z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    url: '',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M23.498 6.186a3.216 3.216 0 0 0-3.448-.918c-1.388 0.49-2.676 1.464-3.545 2.827-0.562-0.45-1.244-0.726-1.97-0.726-2.624 0-3.392 1.589-3.392 4.006v8.164c0 2.382 0.742 3.918 3.289 3.918 0.72 0 1.409-0.267 1.97-0.726 0.913-1.367 2.233-2.342 3.588-2.828a3.216 3.216 0 0 0 3.448 0.918c1.389-0.49 2.677-1.464 3.547-2.827 0.562 0.45 1.243 0.726 1.97 0.726 2.624 0 3.392-1.589 3.392-4.006V10.192c-.001-2.382-0.742-3.918-3.291-3.918-0.72 0-1.408 0.267-1.969 0.726-0.911 1.364-2.232 2.339-3.585 2.829a3.215 3.215 0 0 0-3.448-0.918z" />
      </svg>
    ),
  },
];

interface FooterLink {
  label: string;
  to: string;
  /** When true and on the home page, scroll to the section instead of navigating. */
  scrollToSection?: boolean;
}

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Get started', to: '/auth' },
      { label: 'Login', to: '/auth' },
      { label: 'How it works', to: '/' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Report an issue', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Use', to: '/terms' },
      { label: 'Community Guidelines', to: '/guidelines' },
    ],
  },
];

function motionProps(
  inView: boolean,
  variants: Variants | undefined,
  reduced: boolean,
): React.ComponentProps<typeof motion.div> {
  if (reduced) {
    return { animate: { opacity: 1, y: 0 } };
  }
  return {
    initial: 'hidden' as const,
    animate: inView ? 'visible' : 'hidden',
    variants,
  };
}

export default function SiteFooter() {
  const reduced = useReducedMotion() ?? false;

  const brandRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);

  const brandVisible = useInView(brandRef, { once: true, margin: '-80px' });
  const navVisible = useInView(navRef, { once: true, margin: '-80px' });
  const bottomVisible = useInView(bottomRef, { once: true, margin: '-80px' });
  const wordmarkVisible = useInView(wordmarkRef, { once: true, margin: '-80px' });

  const socials = SOCIALS.filter((entry) => entry.url !== '');

  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <motion.div
          ref={brandRef}
          {...motionProps(brandVisible, { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.reveal, ease: EASE_REVEAL } } }, reduced)}
          className={styles.brandBlock}
        >
          <Link to="/" className={styles.brandLink} aria-label="AlmaNET home">
            <GraduationCap size={20} strokeWidth={1.75} aria-hidden="true" />
            <span className={styles.brandWordmark}>AlmaNET</span>
          </Link>
          <p className={styles.tagline}>
            A trusted space for alumni and students to connect, share opportunities, and grow together.
          </p>
        </motion.div>

        <motion.nav
          ref={navRef}
          {...motionProps(navVisible, listStagger(0.08).parent, reduced)}
          aria-label="Footer"
          className={styles.nav}
        >
          {FOOTER_COLUMNS.map((column) => (
            <motion.div
              key={column.title}
              {...motionProps(true, listStagger(0.08).child, reduced)}
              className={styles.column}
            >
              <h3 className={styles.columnTitle}>{column.title}</h3>
              <ul className={styles.linkList}>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.nav>

        <motion.div
          ref={bottomRef}
          {...motionProps(bottomVisible, riseIn(16), reduced)}
          className={styles.bottomBar}
        >
          <span className={styles.copyright}>
            © {new Date().getFullYear()} AlmaNET. All rights reserved.
          </span>
          <div className={styles.socials} aria-label="Social profiles">
            {socials.map((entry) => (
              <a
                key={entry.name}
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialButton}
                aria-label={entry.name}
              >
                {entry.icon}
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          ref={wordmarkRef}
          {...motionProps(wordmarkVisible, riseIn(24, 0.6), reduced)}
          className={styles.wordmark}
          aria-hidden="true"
        >
          AlmaNET
        </motion.div>
      </div>
    </footer>
  );
}
