import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Briefcase, Plus, ArrowRight } from 'lucide-react';
import styles from './storyScenes.module.css';

export function StoryJobsScene({ active = true, staticMode = false }: { active?: boolean; staticMode?: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const showAll = staticMode || reduced;
  const [step, setStep] = useState(showAll ? 3 : 0);

  useEffect(() => {
    if (showAll) { setStep(3); return; }
    if (!active) { setStep(0); return; }
    setStep(0);
    const timers = [300, 800, 1500].map((ms, i) => window.setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, showAll]);

  const card = (visible: boolean, children: React.ReactNode, key: string) => (
    <motion.div key={key} initial={showAll ? false : { opacity: 0, y: 8 }} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  );

  return (
    <div className={styles.scene} aria-label="Jobs and referrals preview">
      <div className={styles.sceneHeader}>
        <span className={styles.sceneIcon} aria-hidden="true"><Briefcase size={17} strokeWidth={1.75} /></span>
        <div className={styles.sceneTitleWrap}>
          <p className={styles.sceneTitle}>Jobs and referrals</p>
          <p className={styles.sceneSub}>Opportunities from your network</p>
        </div>
      </div>
      <div className={styles.sceneBody}>
        {card(step >= 1, (
          <span className={styles.primaryBtn} aria-hidden="true"><Plus size={16} strokeWidth={1.75} /> Post a job</span>
        ), 'btn')}
        {card(step >= 2, (
          <div className={styles.jobCard}>
            <div className={styles.jobTop}>
              <div>
                <p className={styles.jobTitle}>Frontend Engineer</p>
                <p className={styles.jobMeta}>Acme Labs · Pune</p>
              </div>
              <span className={`${styles.badge} ${step >= 3 ? styles.badgeSent : ''}`}>{step >= 3 ? 'Referral sent' : 'Open'}</span>
            </div>
            {step >= 3 && (
              <motion.div className={styles.refRow} initial={showAll ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <span className={styles.avatar} aria-hidden="true">A</span>
                <span>Arjun</span>
                <ArrowRight size={14} strokeWidth={1.75} className={styles.arrow} aria-hidden="true" />
                <span className={styles.avatar} aria-hidden="true" style={{ background: 'linear-gradient(135deg,#34c759,#0a84ff)' }}>R</span>
                <span>Rohan</span>
              </motion.div>
            )}
          </div>
        ), 'job1')}
        {card(step >= 2, (
          <div className={styles.jobCard}>
            <div className={styles.jobTop}>
              <div>
                <p className={styles.jobTitle}>Data Analyst Intern</p>
                <p className={styles.jobMeta}>Northbridge · London</p>
              </div>
              <span className={styles.badge}>Open</span>
            </div>
          </div>
        ), 'job2')}
      </div>
    </div>
  );
}
