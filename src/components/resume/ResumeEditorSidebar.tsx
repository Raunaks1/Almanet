/**
 * ResumeEditorSidebar — left pane of Editor Mode (StructuredResume).
 *
 * Shows the ATS Issues box at the top, then accordion-based forms for each
 * resume section. All edits flow up through `onChange` so the preview updates
 * live. No AI calls — manual, rule-based editing only.
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Briefcase,
  ChevronDown,
  Edit,
  Eye,
  EyeOff,
  FolderGit2,
  GraduationCap,
  Info,
  Plus,
  RefreshCw,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react';
import type { ATSIssue } from '../../lib/resume/atsLogic';
import type {
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
  StructuredResume,
} from '../../types/resume';
import { Button, Select } from '../ui';
import { cx } from '../ui/internal';
import styles from './ResumeEditorSidebar.module.css';

export type EditorSectionId =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications';

interface ResumeEditorSidebarProps {
  data: StructuredResume;
  onChange: (next: StructuredResume) => void;
  issues: ATSIssue[];
  activeIssueId: string | null;
  missingKeywords: string[];
  onIssueClick: (issueId: string) => void;
  className?: string;
  /** Parse confidence from the structured parser. */
  parseConfidence?: 'high' | 'medium' | 'low';
  /** Parser warnings to display. */
  parseWarnings?: string[];
  /** Unclassified lines the parser couldn't place. */
  unclassified?: string[];
  /** Re-run extraction and parsing from the stored file. */
  onReRead?: () => void;
}

const SECTIONS: Array<{
  id: EditorSectionId;
  label: string;
  icon: React.ElementType;
  hint: string;
}> = [
  { id: 'summary', label: 'Summary & Contact', icon: User, hint: 'Name, headline, links' },
  { id: 'experience', label: 'Experience', icon: Briefcase, hint: 'Roles, companies, dates, bullets' },
  { id: 'projects', label: 'Projects', icon: FolderGit2, hint: 'Personal & academic work' },
  { id: 'education', label: 'Education', icon: GraduationCap, hint: 'Degrees & institutions' },
  { id: 'skills', label: 'Skills', icon: Wrench, hint: 'Technologies & tools' },
  { id: 'certifications', label: 'Certifications', icon: Award, hint: 'Licenses & courses' },
];

/** Map an ATS issue to the section that can fix it. */
function sectionForIssue(issue: ATSIssue): EditorSectionId {
  const id = issue.id.toLowerCase();
  if (/summary|objective|profile/.test(id)) return 'summary';
  if (/education/.test(id)) return 'education';
  if (/skill/.test(id)) return 'skills';
  if (/email|phone|contact/.test(id)) return 'summary';
  if (/certification/.test(id)) return 'certifications';
  return 'experience';
}

/** ATS issues mapped to a given editor section. */
function issuesForSection(sectionId: EditorSectionId, issues: ATSIssue[]): ATSIssue[] {
  return issues.filter((issue) => sectionForIssue(issue) === sectionId);
}

/**
 * Inline ATS alert banner shown at the top of a section that has detectable
 * issues. Keeps the warning next to the fields the user needs to fix.
 */
function ATSBanner({ issues }: { issues: ATSIssue[] }) {
  if (issues.length === 0) return null;
  const issue = issues[0];
  const Icon = issue.severity === 'error' ? AlertTriangle : Info;
  return (
    <div className={styles.atsBanner}>
      <Icon size={13} strokeWidth={1.75} className={styles.atsBannerIcon} aria-hidden="true" />
      <div className={styles.atsBannerBody}>
        <span className={styles.atsBannerTitle}>
          {issue.severity === 'error' ? 'ATS issue' : 'ATS suggestion'}
        </span>
        <span className={styles.atsBannerText}>{issue.title}</span>
      </div>
    </div>
  );
}

let idSeq = 0;
function newId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

export const ResumeEditorSidebar: React.FC<ResumeEditorSidebarProps> = ({
  data,
  onChange,
  issues,
  activeIssueId,
  missingKeywords,
  onIssueClick,
  className,
  parseConfidence,
  parseWarnings,
  unclassified,
  onReRead,
}) => {
  const [open, setOpen] = useState<EditorSectionId | null>('experience');
  /** Item ids the user has hidden via the visibility (eye) toggle — editor-only visual. */
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  /** Whether the "Text we couldn't place" collapsible is open. */
  const [unclassifiedOpen, setUnclassifiedOpen] = useState(false);
  /** Map of unclassified index → chosen move-to section id. */
  const [unclassifiedTargets, setUnclassifiedTargets] = useState<Record<number, string>>({});

  /** Remove a line from the unclassified list (manual fix). */
  const removeUnclassified = (index: number) => {
    onChange({ ...data, unclassified: (unclassified ?? []).filter((_, i) => i !== index) });
  };

  const toggleHidden = (id: string) =>
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const isHidden = (id: string) => hiddenIds.has(id);

  // Open the section relevant to the issue the user clicked.
  useEffect(() => {
    if (!activeIssueId) return;
    const issue = issues.find((i) => i.id === activeIssueId);
    if (issue) setOpen(sectionForIssue(issue));
  }, [activeIssueId, issues]);

  /** Move an unclassified line into a recognised section (user-driven fix). */
  const moveUnclassified = (index: number, target: string) => {
    const line = unclassified?.[index];
    if (!line) return;
    const remaining = (unclassified ?? []).filter((_, i) => i !== index);
    switch (target) {
      case 'summary':
        onChange({
          ...data,
          summary: data.summary ? `${data.summary} ${line}` : line,
          unclassified: remaining,
        });
        break;
      case 'skills':
        onChange({ ...data, skills: [...data.skills.filter(Boolean), line], unclassified: remaining });
        break;
      case 'certifications':
        onChange({
          ...data,
          certifications: [...data.certifications.filter(Boolean), line],
          unclassified: remaining,
        });
        break;
      case 'experience':
        onChange({
          ...data,
          experience: [
            ...data.experience,
            { id: newId('exp'), title: line, company: '', dates: '', bullets: [] },
          ],
          unclassified: remaining,
        });
        break;
      case 'projects':
        onChange({
          ...data,
          projects: [
            ...data.projects,
            { id: newId('proj'), title: line, tech: '', dates: '', bullets: [] },
          ],
          unclassified: remaining,
        });
        break;
      case 'education':
        onChange({
          ...data,
          education: [
            ...data.education,
            { id: newId('edu'), institution: line, degree: '', dates: '', details: '' },
          ],
          unclassified: remaining,
        });
        break;
      default:
        break;
    }
  };

  const toggle = (id: EditorSectionId) => setOpen((cur) => (cur === id ? null : id));

  /** True when the parser could not fully read the resume — show the honest warning box. */
  const showParseWarning =
    parseConfidence === 'low' || (parseWarnings !== undefined && parseWarnings.length > 0);

  const patchExperience = (id: string, patch: Partial<ResumeExperience>) =>
    onChange({
      ...data,
      experience: data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });

  const patchProject = (id: string, patch: Partial<ResumeProject>) =>
    onChange({
      ...data,
      projects: data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });

  const patchEducation = (id: string, patch: Partial<ResumeEducation>) =>
    onChange({
      ...data,
      education: data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });

  /** Add a blank entry to the currently-open section. */
  const addToSection = () => {
    if (!open) return;
    switch (open) {
      case 'experience':
        onChange({
          ...data,
          experience: [
            ...data.experience,
            { id: newId('exp'), title: '', company: '', dates: '', bullets: [] },
          ],
        });
        break;
      case 'projects':
        onChange({
          ...data,
          projects: [
            ...data.projects,
            { id: newId('proj'), title: '', tech: '', dates: '', bullets: [] },
          ],
        });
        break;
      case 'education':
        onChange({
          ...data,
          education: [
            ...data.education,
            { id: newId('edu'), institution: '', degree: '', dates: '', details: '' },
          ],
        });
        break;
      case 'skills':
        onChange({ ...data, skills: [...data.skills, ''] });
        break;
      case 'certifications':
        onChange({ ...data, certifications: [...data.certifications, ''] });
        break;
      case 'summary':
        break;
      default:
        break;
    }
    setOpen(open);
  };

  const renderBody = (id: EditorSectionId) => {
    switch (id) {
      case 'summary': {
        const sectionIssues = issuesForSection('summary', issues);
        return (
          <>
            <ATSBanner issues={sectionIssues} />
            <div className={styles.form}>
              <Field label="Full name">
                <input
                  className={styles.input}
                  value={data.personalInfo.name}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      personalInfo: { ...data.personalInfo, name: e.target.value },
                    })
                  }
                  placeholder="e.g. Priya Sharma"
                />
              </Field>
              <Field label="Email">
                <input
                  className={styles.input}
                  value={data.personalInfo.email}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      personalInfo: { ...data.personalInfo, email: e.target.value },
                    })
                  }
                  placeholder="priya@example.com"
                />
              </Field>
              <Field label="Phone">
                <input
                  className={styles.input}
                  value={data.personalInfo.phone}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      personalInfo: { ...data.personalInfo, phone: e.target.value },
                    })
                  }
                  placeholder="+91 98765 43210"
                />
              </Field>
              <Field label="Links" hint="One per line — LinkedIn, portfolio, GitHub">
                <BulletInput
                  values={data.personalInfo.links}
                  onChange={(links) =>
                    onChange({
                      ...data,
                      personalInfo: { ...data.personalInfo, links },
                    })
                  }
                  placeholder="linkedin.com/in/priya-sharma"
                />
              </Field>
              <Field label="Professional summary">
                <textarea
                  className={styles.textarea}
                  value={data.summary}
                  onChange={(e) => onChange({ ...data, summary: e.target.value })}
                  placeholder="Two or three sentences on what you do and what you're looking for."
                  rows={5}
                  spellCheck={false}
                />
              </Field>
            </div>
            </>
          );
        }

      case 'experience': {
        const sectionIssues = issuesForSection('experience', issues);
        return (
          <>
            <ATSBanner issues={sectionIssues} />
            <div className={styles.form}>
              {data.experience.length === 0 && (
                <p className={styles.emptyNote}>No experience entries yet.</p>
              )}
              {data.experience.map((e, idx) => (
                <div
                  key={e.id}
                  className={cx(styles.card, isHidden(e.id) && styles.cardHidden)}
                >
                  <div className={styles.cardHead}>
                    <span className={styles.cardTitle}>Experience #{idx + 1}</span>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => toggleHidden(e.id)}
                        aria-label={isHidden(e.id) ? 'Show experience' : 'Hide experience'}
                        title={isHidden(e.id) ? 'Show' : 'Hide'}
                      >
                        {isHidden(e.id) ? (
                          <EyeOff size={13} strokeWidth={1.75} aria-hidden="true" />
                        ) : (
                          <Eye size={13} strokeWidth={1.75} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => setOpen('experience')}
                        aria-label={`Edit experience ${idx + 1}`}
                        title="Edit"
                      >
                        <Edit size={13} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() =>
                          onChange({
                            ...data,
                            experience: data.experience.filter((x) => x.id !== e.id),
                          })
                        }
                        aria-label={`Remove experience ${idx + 1}`}
                        title="Delete"
                      >
                        <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className={styles.gridRow}>
                    <Field label="Job title">
                      <input
                        className={styles.input}
                        value={e.title}
                        onChange={(ev) => patchExperience(e.id, { title: ev.target.value })}
                        placeholder="Software Engineer"
                      />
                    </Field>
                    <Field label="Company">
                      <input
                        className={styles.input}
                        value={e.company}
                        onChange={(ev) => patchExperience(e.id, { company: ev.target.value })}
                        placeholder="Acme Corp"
                      />
                    </Field>
                  </div>
                  <Field label="Dates">
                    <input
                      className={styles.input}
                      value={e.dates}
                      onChange={(ev) => patchExperience(e.id, { dates: ev.target.value })}
                      placeholder="Jan 2024 — Present"
                    />
                  </Field>
                  <Field label="Bullets" hint="One per line — start with an action verb">
                    <BulletInput
                      values={e.bullets}
                      onChange={(bullets) => patchExperience(e.id, { bullets })}
                      placeholder="Built a React dashboard…"
                    />
                  </Field>
                </div>
              ))}
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  onChange({
                    ...data,
                    experience: [
                      ...data.experience,
                      { id: newId('exp'), title: '', company: '', dates: '', bullets: [] },
                    ],
                  })
                }
              >
                <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                Add experience
              </button>
            </div>
            </>
          );
        }

      case 'projects': {
        const sectionIssues = issuesForSection('projects', issues);
        return (
          <>
            <ATSBanner issues={sectionIssues} />
            <div className={styles.form}>
              {data.projects.length === 0 && (
                <p className={styles.emptyNote}>No projects yet.</p>
              )}
              {data.projects.map((p, idx) => (
                <div
                  key={p.id}
                  className={cx(styles.card, isHidden(p.id) && styles.cardHidden)}
                >
                  <div className={styles.cardHead}>
                    <span className={styles.cardTitle}>Project #{idx + 1}</span>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => toggleHidden(p.id)}
                        aria-label={isHidden(p.id) ? 'Show project' : 'Hide project'}
                        title={isHidden(p.id) ? 'Show' : 'Hide'}
                      >
                        {isHidden(p.id) ? (
                          <EyeOff size={13} strokeWidth={1.75} aria-hidden="true" />
                        ) : (
                          <Eye size={13} strokeWidth={1.75} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => setOpen('projects')}
                        aria-label={`Edit project ${idx + 1}`}
                        title="Edit"
                      >
                        <Edit size={13} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() =>
                          onChange({
                            ...data,
                            projects: data.projects.filter((x) => x.id !== p.id),
                          })
                        }
                        aria-label={`Remove project ${idx + 1}`}
                        title="Delete"
                      >
                        <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <Field label="Project title">
                    <input
                      className={styles.input}
                      value={p.title}
                      onChange={(ev) => patchProject(p.id, { title: ev.target.value })}
                      placeholder="E-Commerce Platform"
                    />
                  </Field>
                  <Field label="Tech stack">
                    <input
                      className={styles.input}
                      value={p.tech}
                      onChange={(ev) => patchProject(p.id, { tech: ev.target.value })}
                      placeholder="React, Node.js, PostgreSQL"
                    />
                  </Field>
                  <Field label="Dates">
                    <input
                      className={styles.input}
                      value={p.dates}
                      onChange={(ev) => patchProject(p.id, { dates: ev.target.value })}
                      placeholder="Jan 2024 — Present"
                    />
                  </Field>
                  <Field label="Bullets" hint="One per line">
                    <BulletInput
                      values={p.bullets}
                      onChange={(bullets) => patchProject(p.id, { bullets })}
                      placeholder="Implemented JWT auth…"
                    />
                  </Field>
                </div>
              ))}
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  onChange({
                    ...data,
                    projects: [
                      ...data.projects,
                      { id: newId('proj'), title: '', tech: '', dates: '', bullets: [] },
                    ],
                  })
                }
              >
                <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                Add project
              </button>
            </div>
            </>
          );
        }

      case 'education': {
        const sectionIssues = issuesForSection('education', issues);
        return (
          <>
            <ATSBanner issues={sectionIssues} />
            <div className={styles.form}>
              {data.education.length === 0 && (
                <p className={styles.emptyNote}>No education entries yet.</p>
              )}
              {data.education.map((e, idx) => (
                <div
                  key={e.id}
                  className={cx(styles.card, isHidden(e.id) && styles.cardHidden)}
                >
                  <div className={styles.cardHead}>
                    <span className={styles.cardTitle}>Education #{idx + 1}</span>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => toggleHidden(e.id)}
                        aria-label={isHidden(e.id) ? 'Show education' : 'Hide education'}
                        title={isHidden(e.id) ? 'Show' : 'Hide'}
                      >
                        {isHidden(e.id) ? (
                          <EyeOff size={13} strokeWidth={1.75} aria-hidden="true" />
                        ) : (
                          <Eye size={13} strokeWidth={1.75} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => setOpen('education')}
                        aria-label={`Edit education ${idx + 1}`}
                        title="Edit"
                      >
                        <Edit size={13} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() =>
                          onChange({
                            ...data,
                            education: data.education.filter((x) => x.id !== e.id),
                          })
                        }
                        aria-label={`Remove education ${idx + 1}`}
                        title="Delete"
                      >
                        <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <Field label="Institution">
                    <input
                      className={styles.input}
                      value={e.institution}
                      onChange={(ev) => patchEducation(e.id, { institution: ev.target.value })}
                      placeholder="University of Mumbai"
                    />
                  </Field>
                  <Field label="Degree">
                    <input
                      className={styles.input}
                      value={e.degree}
                      onChange={(ev) => patchEducation(e.id, { degree: ev.target.value })}
                      placeholder="B.Tech, Computer Engineering"
                    />
                  </Field>
                  <Field label="Dates">
                    <input
                      className={styles.input}
                      value={e.dates}
                      onChange={(ev) => patchEducation(e.id, { dates: ev.target.value })}
                      placeholder="2020 — 2024"
                    />
                  </Field>
                  <Field label="Details" hint="GPA, honours, coursework">
                    <textarea
                      className={styles.textarea}
                      value={e.details}
                      onChange={(ev) => patchEducation(e.id, { details: ev.target.value })}
                      placeholder="CGPA 8.6/10"
                      rows={3}
                      spellCheck={false}
                    />
                  </Field>
                </div>
              ))}
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  onChange({
                    ...data,
                    education: [
                      ...data.education,
                      { id: newId('edu'), institution: '', degree: '', dates: '', details: '' },
                    ],
                  })
                }
              >
                <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                Add education
              </button>
            </div>
            </>
          );
        }

      case 'skills': {
        const sectionIssues = issuesForSection('skills', issues);
        return (
          <>
            <ATSBanner issues={sectionIssues} />
            <div className={styles.form}>
              <Field label="Skills" hint="Technologies, tools and languages">
                <ChipInput
                  values={data.skills}
                  onChange={(skills) => onChange({ ...data, skills })}
                  suggestions={missingKeywords}
                  placeholder="Add a skill"
                />
              </Field>
            </div>
            </>
          );
        }

      case 'certifications': {
        const sectionIssues = issuesForSection('certifications', issues);
        return (
          <>
            <ATSBanner issues={sectionIssues} />
            <div className={styles.form}>
              <Field label="Certifications" hint="One per line">
                <BulletInput
                  values={data.certifications}
                  onChange={(certifications) =>
                    onChange({ ...data, certifications })
                  }
                  placeholder="AWS Certified Cloud Practitioner"
                />
              </Field>
            </div>
            </>
          );
        }

      default:
        return null;
    }
  };

  return (
    <div className={cx(styles.root, className)}>
      {/* ── Edit Content header ── */}
      <header className={styles.editHeader}>
        <div className={styles.editHeaderTitleWrap}>
          <span className={styles.editHeaderTitle}>Edit Content</span>
          {open && (
            <span className={styles.editHeaderSection}>
              • {SECTIONS.find((s) => s.id === open)?.label}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          iconLeft={<Plus size={13} strokeWidth={1.75} aria-hidden="true" />}
          onClick={addToSection}
          disabled={!open || open === 'summary'}
        >
          Add Section
        </Button>
      </header>

      {/* ── ATS Issues box ── */}
      <section className={styles.issuesBox} aria-label="ATS issues">
        <h3 className={styles.issuesBoxTitle}>ATS Issues</h3>
        {showParseWarning ? (
          <div className={styles.parseWarning}>
            <AlertTriangle size={14} strokeWidth={1.75} className={styles.warningIcon} aria-hidden="true" />
            <div className={styles.warningBody}>
              <span className={styles.warningTitle}>We couldn't fully read the layout of your resume.</span>
              {parseWarnings?.map((w, i) => (
                <p key={i} className={styles.warningText}>{w}</p>
              ))}
            </div>
            {onReRead ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onReRead}
                className={styles.reReadBtn}
              >
                <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
                Re-read my resume
              </Button>
            ) : null}
          </div>
        ) : issues.length === 0 ? (
          <p className={styles.issuesBoxEmpty}>No issues detected — nice work.</p>
        ) : (
          <ul className={styles.issueList}>
            {issues.map((issue) => {
              const Icon = issue.severity === 'error' ? AlertTriangle : Info;
              const color =
                issue.severity === 'error'
                  ? 'var(--danger)'
                  : issue.severity === 'warning'
                    ? 'var(--warning)'
                    : 'var(--accent)';
              return (
                <li key={issue.id} className={styles.issueItem}>
                  <button
                    type="button"
                    className={styles.issueBtn}
                    onClick={() => onIssueClick(issue.id)}
                  >
                    <Icon size={14} strokeWidth={1.75} className={styles.issueIcon} style={{ color }} aria-hidden="true" />
                    <span className={styles.issueTitle}>{issue.title}</span>
                    <span className={styles.issueFix}>Fix →</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Unclassified text ── */}
      {unclassified && unclassified.length > 0 && (
        <section className={styles.unclassifiedSection} aria-label="Unclassified text">
          <button
            type="button"
            className={styles.unclassifiedHead}
            onClick={() => setUnclassifiedOpen((o) => !o)}
            aria-expanded={unclassifiedOpen}
          >
            <h3 className={styles.unclassifiedTitle}>Text we couldn't place</h3>
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              className={cx(styles.accChevron, unclassifiedOpen && styles.accChevronOpen)}
              aria-hidden="true"
            />
          </button>
          {unclassifiedOpen ? (
            <div className={styles.unclassifiedBody}>
              {unclassified.map((line, i) => (
                <div key={i} className={styles.unclassifiedItem}>
                  <span className={styles.unclassifiedText}>{line}</span>
                  <div className={styles.unclassifiedActions}>
                    <Select
                      value={unclassifiedTargets[i] ?? ''}
                      onChange={(e) => {
                        setUnclassifiedTargets((prev) => ({ ...prev, [i]: e.target.value }));
                        moveUnclassified(i, e.target.value);
                      }}
                      aria-label={`Move ${line} to…`}
                      className={styles.unclassifiedSelect}
                    >
                      <option value="" disabled>
                        Move to…
                      </option>
                      <option value="summary">Summary</option>
                      <option value="experience">Experience</option>
                      <option value="projects">Projects</option>
                      <option value="education">Education</option>
                      <option value="skills">Skills</option>
                      <option value="certifications">Certifications</option>
                    </Select>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => removeUnclassified(i)}
                      aria-label={`Delete "${line}"`}
                    >
                      <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* ── Section accordion ── */}
      <div className={styles.accordion}>
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isOpen = open === sec.id;
          return (
            <div key={sec.id} className={cx(styles.accItem, isOpen && styles.accItemOpen)}>
              <button
                type="button"
                className={styles.accHead}
                onClick={() => toggle(sec.id)}
                aria-expanded={isOpen}
              >
                <Icon size={15} strokeWidth={1.75} className={styles.accIcon} aria-hidden="true" />
                <span className={styles.accLabelWrap}>
                  <span className={styles.accLabel}>{sec.label}</span>
                  <span className={styles.accHint}>{sec.hint}</span>
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={1.75}
                  className={cx(styles.accChevron, isOpen && styles.accChevronOpen)}
                  aria-hidden="true"
                />
              </button>
              {isOpen && <div className={styles.accBody}>{renderBody(sec.id)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Small building blocks ────────────────────────────────────────────── */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function ChipInput({
  values,
  onChange,
  suggestions = [],
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const value = raw.trim();
    if (!value || values.includes(value)) {
      setDraft('');
      return;
    }
    onChange([...values, value]);
    setDraft('');
  };

  const unusedSuggestions = suggestions.filter((s) => !values.includes(s));

  return (
    <div className={styles.chipInputWrap}>
      <div className={styles.chipRow}>
        {values.map((v) => (
          <span key={v} className={styles.chip}>
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
            >
              <X size={11} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className={styles.chipInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder={placeholder}
        />
      </div>
      {unusedSuggestions.length > 0 && (
        <div className={styles.suggestionRow}>
          <span className={styles.suggestionLabel}>Suggested</span>
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.suggestionChip}
              onClick={() => add(s)}
            >
              <Plus size={11} strokeWidth={1.75} aria-hidden="true" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BulletInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className={styles.bulletInput}
      value={values.join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n'))}
      placeholder={placeholder}
      rows={4}
      spellCheck={false}
    />
  );
}
