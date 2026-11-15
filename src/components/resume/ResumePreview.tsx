/**
 * ResumePreview — typeset, print-like rendering of the StructuredResume.
 *
 * Pure presentational: maps StructuredResume into an A4-style document.
 * Updates live as the editor state changes. No AI, no network.
 */

import React from 'react';
import type {
  StructuredResume,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
} from '../../types/resume';
import { cx } from '../ui/internal';
import styles from './ResumePreview.module.css';

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className={styles.sectionTitle}>{children}</h3>;
}

export const ResumePreview: React.FC<{ data: StructuredResume; className?: string }> = ({
  data,
  className,
}) => {
  const { personalInfo } = data;
  const hasHeader = Boolean(
    personalInfo.name || personalInfo.email || personalInfo.phone || personalInfo.links.length > 0,
  );

  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    ...personalInfo.links,
  ].filter(Boolean);

  const renderBullets = (bullets: string[]) => (
    <ul className={styles.bullets}>
      {bullets.filter(Boolean).map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );

  const renderExperience = (e: ResumeExperience) => (
    <div key={e.id} className={styles.entry}>
      <div className={styles.entryHead}>
        <div className={styles.entryMain}>
          <h4 className={styles.entryTitle}>{e.title || 'Role'}</h4>
          {e.company ? <p className={styles.entrySub}>{e.company}</p> : null}
          {e.location ? <p className={styles.entryLocation}>{e.location}</p> : null}
        </div>
        {e.dates ? <span className={styles.entryDates}>{e.dates}</span> : null}
      </div>
      {renderBullets(e.bullets)}
    </div>
  );

  const renderProject = (p: ResumeProject) => (
    <div key={p.id} className={styles.entry}>
      <div className={styles.entryHead}>
        <div className={styles.entryMain}>
          <h4 className={styles.entryTitle}>{p.title || 'Project'}</h4>
          {p.tech ? <p className={styles.techLine}>{p.tech}</p> : null}
        </div>
        {p.dates ? <span className={styles.entryDates}>{p.dates}</span> : null}
      </div>
      {renderBullets(p.bullets)}
    </div>
  );

  const renderEducation = (e: ResumeEducation) => (
    <div key={e.id} className={styles.entry}>
      <div className={styles.entryHead}>
        <div className={styles.entryMain}>
          <h4 className={styles.entryTitle}>{e.institution || 'Institution'}</h4>
          {e.degree ? <p className={styles.entrySub}>{e.degree}</p> : null}
        </div>
        {e.dates ? <span className={styles.entryDates}>{e.dates}</span> : null}
      </div>
      {e.details ? <p className={styles.paragraph}>{e.details}</p> : null}
    </div>
  );

  return (
    <article
      className={cx(styles.paper, className)}
      aria-label="Resume preview"
      data-testid="resume-preview"
    >
      {hasHeader && (
        <header className={styles.header}>
          <h1 className={styles.name}>{personalInfo.name || 'Your Name'}</h1>
          {personalInfo.headline ? <p className={styles.headline}>{personalInfo.headline}</p> : null}
          {contactParts.length > 0 ? (
            <p className={styles.contact}>{contactParts.join('  •  ')}</p>
          ) : null}
        </header>
      )}

      {data.summary ? (
        <section className={styles.section}>
          <Title>Summary</Title>
          <p className={styles.paragraph}>{data.summary}</p>
        </section>
      ) : null}

      {data.experience.length > 0 && (
        <section className={styles.section}>
          <Title>Experience</Title>
          {data.experience.map((e) => renderExperience(e))}
        </section>
      )}

      {data.projects.length > 0 && (
        <section className={styles.section}>
          <Title>Projects</Title>
          {data.projects.map((p) => renderProject(p))}
        </section>
      )}

      {data.education.length > 0 && (
        <section className={styles.section}>
          <Title>Education</Title>
          {data.education.map((e) => renderEducation(e))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section className={styles.section}>
          <Title>Skills</Title>
          <p className={styles.skillsLine}>{data.skills.join(' · ')}</p>
        </section>
      )}

      {data.certifications.length > 0 && (
        <section className={styles.section}>
          <Title>Certifications</Title>
          <ul className={styles.bullets}>
            {data.certifications.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};
