import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { DURATION, EASE_REVEAL } from '../lib/motion';
import SiteFooter from '../components/layout/SiteFooter';
import styles from './ComingSoon.module.css';

// TODO: build this page.

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.reveal, ease: EASE_REVEAL }}
        >
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.body}>This page is coming soon.</p>
          <Link to="/" className={styles.link}>
            Back to home
          </Link>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  );
}
