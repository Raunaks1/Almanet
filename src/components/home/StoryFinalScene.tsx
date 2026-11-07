import React from 'react';
import { Link } from 'react-router-dom';
import styles from './storyScenes.module.css';

export function StoryFinalScene() {
  return (
    <div className={styles.final} aria-labelledby="story-final-title">
      <h2 id="story-final-title" className={styles.finalTitle}>Join your college network.</h2>
      <div className={styles.finalActions}>
        <Link to="/auth" className={styles.btnPrimary}>Get started</Link>
        <Link to="/auth" className={styles.btnSecondary}>Login</Link>
      </div>
      <div className={styles.howRow} role="list" aria-label="How it works">
        <div className={styles.howPill} role="listitem"><span className={styles.howNum} aria-hidden="true">1</span>Create your account</div>
        <div className={styles.howPill} role="listitem"><span className={styles.howNum} aria-hidden="true">2</span>Get verified</div>
        <div className={styles.howPill} role="listitem"><span className={styles.howNum} aria-hidden="true">3</span>Connect and contribute</div>
      </div>
    </div>
  );
}
