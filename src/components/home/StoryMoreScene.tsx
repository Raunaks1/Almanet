import React, { useEffect, useState } from 'react';
import { Calendar, Search, ShieldCheck } from 'lucide-react';
import styles from './storyScenes.module.css';

function CountUp({ to, active, suffix = '' }: { to: number; active: boolean; suffix?: string }) {
  const [val, setVal] = useState(active ? to : 0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, to]);
  return <>{val.toLocaleString()}{suffix}</>;
}

export function StoryMoreScene({ active = true, staticMode = false }: { active?: boolean; staticMode?: boolean }) {
  const showAll = staticMode;
  const run = showAll || active;
  return (
    <div className={styles.scene} aria-label="Events, directory and community stats">
      <div className={styles.sceneHeader}>
        <span className={styles.sceneIcon} aria-hidden="true"><Calendar size={17} strokeWidth={1.75} /></span>
        <div className={styles.sceneTitleWrap}>
          <p className={styles.sceneTitle}>And much more</p>
          <p className={styles.sceneSub}>Events, directory and community</p>
        </div>
      </div>
      <div className={styles.sceneBody}>
        <div className={styles.grid2}>
          <div className={styles.miniCard}>
            <p className={styles.miniTitle}>Alumni Meetup · Pune</p>
            <p className={styles.miniMeta}>Sat, 6:00 PM · 48 RSVPs</p>
            <span className={`${styles.badge} ${styles.badgeSent}`} style={{ marginTop: 8, display: 'inline-block' }}>RSVP open</span>
          </div>
          <div className={styles.miniCard}>
            <p className={styles.miniTitle} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Verified directory <ShieldCheck size={14} strokeWidth={1.75} color="#34c759" aria-hidden="true" /></p>
            <div className={styles.search} style={{ marginTop: 8 }}>
              <Search size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>Search alumni, students…</span>
              <span className={`${styles.badge} ${styles.badgeVerified}`} style={{ marginLeft: 'auto' }}>Verified</span>
            </div>
          </div>
        </div>
        <div className={styles.counters} aria-label="Community counters">
          <div className={styles.counter}><div className={styles.counterVal}><CountUp to={1240} active={run} suffix="+" /></div><div className={styles.counterLabel}>alumni</div></div>
          <div className={styles.counter}><div className={styles.counterVal}><CountUp to={38} active={run} /></div><div className={styles.counterLabel}>cities</div></div>
          <div className={styles.counter}><div className={styles.counterVal}><CountUp to={210} active={run} suffix="+" /></div><div className={styles.counterLabel}>jobs shared</div></div>
        </div>
      </div>
    </div>
  );
}
