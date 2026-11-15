import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../lib/useAuth';
import { buildJobSearchLinks } from '../../lib/jobSearchLinks';
import styles from './ExploreOtherSites.module.css';

const BREAKPOINT = 768;

export interface ExploreOtherSitesProps {}

export const ExploreOtherSites: React.FC<ExploreOtherSitesProps> = () => {
  const { profile } = useAuth();
  const [expanded, setExpanded] = useState(typeof window !== 'undefined' && window.innerWidth >= BREAKPOINT);
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [fresher, setFresher] = useState(true);

  // Default the city to the profile's location when it exists.
  useEffect(() => {
    const loc = (profile as { location?: string | null } | null)?.location ?? null;
    if (loc && !city) setCity(loc);
  }, [profile, city]);

  const links = buildJobSearchLinks({ role, city, fresher });

  const handleOpen = useCallback(
    (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [],
  );

  return (
    <section className={styles.card} aria-labelledby="explore-title">
      <div className={styles.header}>
        <div>
          <h2 id="explore-title" className={styles.title}>
            Search on other sites
          </h2>
          <p className={styles.subtitle}>
            Opens each site in a new tab with your search filled in.
          </p>
        </div>
        {typeof window !== 'undefined' && window.innerWidth < BREAKPOINT && (
          <button
            type="button"
            className={styles.expandBtn}
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Hide sites' : 'Show sites'}
            <span className={styles.chevron} aria-hidden="true" />
          </button>
        )}
      </div>

      {expanded && (
        <div className={styles.body}>
          <div className={styles.field}>
            <label htmlFor="explore-role" className={styles.label}>
              Role or keywords
            </label>
            <input
              id="explore-role"
              className={styles.input}
              placeholder="e.g. Software Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="explore-city" className={styles.label}>
              City
            </label>
            <input
              id="explore-city"
              className={styles.input}
              placeholder="e.g. Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className={styles.checkboxRow}>
            <input
              id="explore-fresher"
              type="checkbox"
              className={styles.checkbox}
              checked={fresher}
              onChange={(e) => setFresher(e.target.checked)}
            />
            <label htmlFor="explore-fresher" className={styles.checkboxLabel}>
              Fresher or internship
            </label>
          </div>
          <div className={styles.actions}>
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.siteLink}
                onClick={(e) => {
                  e.preventDefault();
                  handleOpen(link.url);
                }}
              >
                {link.name}
              </a>
            ))}
          </div>
          <p className={styles.note}>
            These links open other websites. Almanet is not affiliated with them.
          </p>
        </div>
      )}
    </section>
  );
};
