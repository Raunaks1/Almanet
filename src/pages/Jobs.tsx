import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Briefcase,
  Edit2,
  FileText,
  IndianRupee,
  MapPin,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NewJobModal } from '../components/NewJobModal';
import { PageHeader } from '../components/shell/PageHeader';
import { ResumePanel } from '../components/jobs/ResumePanel';
import { OptimiseModal } from '../components/resume/OptimiseModal';
import { analyzeResume, buildAnalysisJob, labelForScore, type AnalysisJob } from '../lib/resume/analyzeResume';
import { useResumes } from '../lib/resume/useResumes';
import { listStagger } from '../lib/motion';
import { SAVED_JOBS_STORAGE_KEY } from '../data/jobBoardSeed';
import type { Job } from '../types/job-matching';
import {
  Button,
  EmptyState,
  ErrorBoundary,
  SegmentedControl,
  Skeleton,
  useToast,
} from '../components/ui';
import { ExploreOtherSites } from '../components/jobs/ExploreOtherSites';
import styles from './Jobs.module.css';
import { cx } from '../components/ui/internal';

export interface JobPost {
  id: string;
  author_id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  description: string;
  requirements: string[];
  tags: string[];
  created_at: string;
  profiles?: { full_name: string };
}

const timeAgo = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'unknown';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return 'unknown';
  const diffMs = Date.now() - parsed.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return parsed.toLocaleDateString();
};

const typeOptions = [
  { value: 'All', label: 'All' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Contract', label: 'Contract' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'match', label: 'Match Score' },
];

function getSavedJobIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(SAVED_JOBS_STORAGE_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function toggleSavedJobId(jobId: string, current: Set<string>): Set<string> {
  const next = new Set(current);
  if (next.has(jobId)) next.delete(jobId);
  else next.add(jobId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify([...next]));
  }
  return next;
}

/** Derive required keywords from a Supabase job post for ATS matching. */
function deriveKeywords(job: JobPost): { keyword: string; weight: 'must-have' | 'good-to-have'; category: 'skill' | 'tool' | 'concept' }[] {
  const keywords: Array<{ keyword: string; weight: 'must-have' | 'good-to-have'; category: 'skill' | 'tool' | 'concept' }> = [];
  const seen = new Set<string>();

  const add = (word: string, weight: 'must-have' | 'good-to-have' = 'good-to-have', category: 'skill' | 'tool' | 'concept' = 'skill') => {
    const key = word.toLowerCase().trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    keywords.push({ keyword: word, weight, category });
  };

  // Title words are must-have
  (job.title || '').split(/\s+/).forEach((w) => add(w, 'must-have', 'skill'));
  // Tags are must-have skills
  (job.tags || []).forEach((t) => add(t, 'must-have', 'skill'));
  // Description words are good-to-have concepts
  (job.description || '').split(/\s+/).forEach((w) => add(w, 'good-to-have', 'concept'));
  // Requirements are good-to-have skills
  (job.requirements || []).forEach((r) => add(r, 'good-to-have', 'skill'));

  return keywords;
}

function buildJobFromPost(post: JobPost): Job {
  try {
    return {
      id: post.id || '',
      title: post.title || 'Untitled',
      company: post.company || post.profiles?.full_name || 'Unknown',
      logoUrl: undefined,
      type: (post.type as Job['type']) || 'Full Time',
      experience: 'Not specified',
      salary: 'Not disclosed',
      location: post.location || 'Not specified',
      postedAgo: timeAgo(post.created_at),
      summary: post.description ? [post.description] : [],
      requiredKeywords: deriveKeywords(post),
    };
  } catch {
    return {
      id: post.id || '',
      title: post.title || 'Untitled',
      company: post.company || post.profiles?.full_name || 'Unknown',
      logoUrl: undefined,
      type: (post.type as Job['type']) || 'Full Time',
      experience: 'Not specified',
      salary: 'Not disclosed',
      location: post.location || 'Not specified',
      postedAgo: timeAgo(post.created_at),
      summary: post.description ? [post.description] : [],
      requiredKeywords: [],
    };
  }
}

const Jobs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>('match'); // default to match score
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobPost | null>(null);
  const [isResumePanelOpen, setIsResumePanelOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => getSavedJobIds());
  const reduced = useReducedMotion() ?? false;

  const { activeResume } = useResumes();
  const [isOptimiseModalOpen, setIsOptimiseModalOpen] = useState(false);
  /** Single source of truth for the optimise modal. Snapshots the job at open time
   *  so the modal is never affected by list re-sorts, re-fetches, or active-resume changes. */
  const [optimise, setOptimise] = useState<{
    jobId: string;
    job: AnalysisJob;
    step: 'choose-resume' | 'analysis';
    resumeId: string | null;
  } | null>(null);

  const fetchJobs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsApproved(true);
      setCurrentUser(session.user);
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles:profiles!jobs_author_id_profiles_fkey(full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      setFetchError(error.message);
      console.error('Jobs fetch error:', error);
    } else if (data) {
      console.log('Jobs fetch data:', data.length, 'rows');
      setJobs(data as unknown as JobPost[]);
    } else {
      console.log('Jobs fetch: no data, no error');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchJobs();
  }, []);

  const handleRefreshJobs = async () => {
    await fetchJobs();
  };

  React.useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (data) setProfile(data);
      } catch {
        // Profile fetch is non-fatal; consent flow handles missing data.
      }
    };
    fetchProfile();
  }, [currentUser]);

  // Build analyzed jobs: Supabase posts scored against the user's active uploaded resume.
  // When there is no ready resume, analysis is null and cards show an upload prompt.
  const analyzedJobs = useMemo(() => {
    const hasResume = activeResume?.status === 'ready' && !!activeResume.extracted_text;
    return jobs.map((_post) => {
      const job = buildJobFromPost(_post);
      const analysisJob = buildAnalysisJob(_post);
      const analysis = hasResume
        ? analyzeResume(activeResume!.extracted_text!, analysisJob)
        : null;
      return { job, analysis, analysisJob };
    });
  }, [jobs, activeResume]);

  // Filtering + sorting
  const filtered = useMemo(() => {
    let list = analyzedJobs;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        ({ job }) =>
          job.title.toLowerCase().includes(s) ||
          job.company.toLowerCase().includes(s) ||
          job.location.toLowerCase().includes(s) ||
          job.requiredKeywords.some((k) => k.keyword.toLowerCase().includes(s)),
      );
    }

    if (selectedType !== 'All') {
      const target = selectedType.toLowerCase().replace(/[\s-]/g, '');
      list = list.filter(({ job }) => (job.type || '').toLowerCase().replace(/[\s-]/g, '') === target);
    }

    list.sort((a, b) => {
      if (selectedSort === 'match') {
        const sa = a.analysis?.score ?? 0;
        const sb = b.analysis?.score ?? 0;
        return sb - sa;
      }
      // Newest first: stable by original array order
      return jobs.findIndex((j) => j.id === a.job.id) - jobs.findIndex((j) => j.id === b.job.id);
    });

    return list;
  }, [analyzedJobs, searchTerm, selectedType, selectedSort, jobs]);

  const handleToggleSaved = (jobId: string) => {
    setSavedJobs((prev) => toggleSavedJobId(jobId, prev));
  };

  const handleOptimise = (analysisJob: AnalysisJob, jobId?: string) => {
    setOptimise({
      jobId: jobId ?? '',
      job: analysisJob,
      step: 'choose-resume',
      resumeId: null,
    });
    setIsOptimiseModalOpen(true);
  };

  const { show: showToast } = useToast();

  const handleEditJob = (job: JobPost) => {
    setJobToEdit(job);
    setIsEditJobModalOpen(true);
  };

  const handleDeleteJob = async (job: JobPost) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id);

      if (error) throw error;

      // Remove from local state immediately — no need to re-fetch.
      // If the server-side delete didn't persist (e.g. RLS), the job
      // will reappear on next page load; see RLS note below.
      setJobs((prev) => prev.filter((j) => j.id !== job.id));

      showToast({
        title: 'Job deleted',
        description: 'The job posting has been removed.',
        variant: 'success',
      });
    } catch (err: any) {
      console.error('Delete error:', err);
      let message = 'Failed to delete job. Please try again.';
      if (err?.message) {
        if (err.message.includes('row-level security') || err.message.includes('RLS') || err.message.includes('permission')) {
          message = 'You are not authorized to delete this job.';
        } else if (err.message.includes('network') || err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          message = 'Network error. Please check your connection and try again.';
        }
      }
      showToast({
        title: 'Delete failed',
        description: message,
        variant: 'danger',
      });
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Jobs"
        subtitle="Opportunities shared by the Almanet community."
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              iconLeft={<FileText size={16} strokeWidth={1.75} />}
              onClick={() => setIsResumePanelOpen(true)}
            >
              My resume
            </Button>
            <Button
              iconLeft={<Plus size={18} strokeWidth={1.75} />}
              onClick={() => setIsNewJobModalOpen(true)}
              disabled={!isApproved}
            >
              Post a job
            </Button>
          </div>
        }
      />

      {activeResume && (
        <div className={styles.resumeSelectorBar}>
          <span className={styles.resumeSelectorLabel}>Scoring with:</span>
          <span className={styles.resumeSelectorName}>{activeResume.file_name}</span>
          <Button size="sm" variant="plain" onClick={() => setIsResumePanelOpen(true)}>
            Change
          </Button>
        </div>
      )}

      <div className={styles.filterBar} role="search">
        <div className={styles.searchWrap}>
          <Search size={16} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search jobs, companies, locations, skills…"
            aria-label="Search jobs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.typeScroll}>
          <SegmentedControl
            aria-label="Job type"
            options={typeOptions}
            value={selectedType}
            onChange={setSelectedType}
            size="sm"
          />
        </div>
        <div className={styles.sortScroll}>
          <SegmentedControl
            aria-label="Sort by"
            options={sortOptions}
            value={selectedSort}
            onChange={setSelectedSort}
            size="sm"
          />
        </div>
      </div>

      <ExploreOtherSites />

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={styles.skelCard}>
              <Skeleton width={48} height={48} radius={12} />
              <div style={{ display: 'grid', gap: 8 }}>
                <Skeleton width="55%" height={18} />
                <Skeleton width="40%" height={14} />
                <div style={{ display: 'flex', gap: 6 }}><Skeleton width={60} height={22} radius={999} /><Skeleton width={72} height={22} radius={999} /></div>
              </div>
              <Skeleton width={72} height={34} radius={999} />
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <EmptyState
          icon={<Briefcase size={28} strokeWidth={1.75} />}
          title="Unable to load jobs"
          description={fetchError}
          action={
            <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} strokeWidth={1.75} />}
          title="No jobs found"
          description={
            searchTerm || selectedType !== 'All'
              ? 'Try adjusting your search or filters.'
              : 'No opportunities posted yet. Check back soon.'
          }
          action={
            searchTerm || selectedType !== 'All' ? (
              <Button size="sm" variant="secondary" onClick={() => { setSearchTerm(''); setSelectedType('All'); }}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ErrorBoundary fallback={
          <EmptyState
            icon={<Briefcase size={28} strokeWidth={1.75} />}
            title="Jobs temporarily unavailable"
            description="An error occurred while loading jobs. Please refresh the page."
            action={
              <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            }
          />
        }>
          <motion.div
            className={styles.grid}
            variants={reduced ? undefined : listStagger().parent}
            initial={reduced ? undefined : 'hidden'}
            animate={reduced ? undefined : 'visible'}
          >
          {filtered.map(({ job, analysis, analysisJob }) => (
            <motion.article
              key={job.id}
              className={styles.card}
              variants={reduced ? undefined : listStagger().child}
              initial={reduced ? undefined : 'hidden'}
              animate={reduced ? undefined : 'visible'}
            >
              <div className={styles.cardBody}>
                {/* Left: Job Overview */}
                <div className={styles.leftHalf}>
                  <div className={styles.companyHeader}>
                    <div className={styles.monogram} aria-hidden="true">
                      {(job.company || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.jobInfo}>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <p className={styles.jobCompany}>{job.company}</p>
                      <button
                        type="button"
                        className={cx(
                          styles.bookmarkBtn,
                          savedJobs.has(job.id) && styles.bookmarkBtnActive,
                        )}
                        aria-label={savedJobs.has(job.id) ? 'Unsave job' : 'Save job'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSaved(job.id);
                        }}
                      >
                        <Star size={16} strokeWidth={1.75} className={styles.bookmarkIcon} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Edit job"
                        onClick={(e) => {
                          e.stopPropagation();
                          const jobPost = jobs.find((j) => j.id === job.id);
                          if (jobPost) handleEditJob(jobPost);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: '1px solid rgba(255 255 255 / 0.4)',
                          background: 'rgba(255 255 255 / 0.55)',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          backdropFilter: 'blur(24px) saturate(180%)',
                          marginLeft: 8,
                        }}
                      >
                        <Edit2 size={14} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete job"
                        onClick={(e) => {
                          e.stopPropagation();
                          const jobPost = jobs.find((j) => j.id === job.id);
                          if (jobPost) handleDeleteJob(jobPost);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: '1px solid rgba(255 255 255 / 0.4)',
                          background: 'rgba(255 255 255 / 0.55)',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          backdropFilter: 'blur(24px) saturate(180%)',
                          marginLeft: 8,
                        }}
                      >
                        <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className={styles.metaStrip}>
                    <div className={styles.metaItem}>
                      <Briefcase size={14} strokeWidth={1.75} className={styles.metaIcon} aria-hidden="true" />
                      <span>{job.experience}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <IndianRupee size={14} strokeWidth={1.75} className={styles.metaIcon} aria-hidden="true" />
                      <span>{job.salary}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <MapPin size={14} strokeWidth={1.75} className={styles.metaIcon} aria-hidden="true" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <div className={styles.summary}>
                    <ul className={styles.summaryList}>
                      {job.summary.map((line, i) => (
                        <li key={i} className={styles.summaryItem}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <span className={styles.posted}>{job.postedAgo}</span>
                </div>

                {/* Right: Match Evaluation */}
                <div className={styles.rightHalf}>
                  <div className={styles.matchCard}>
                    {analysis ? (
                      <>
                        <div className={styles.ringWrapper}>
                          <svg
                            className={styles.ringSvg}
                            viewBox="0 0 88 88"
                            aria-label={`Match score: ${analysis.score}%`}
                            role="img"
                          >
                            <circle
                              className={styles.ringTrack}
                              cx="44"
                              cy="44"
                              r="36"
                              stroke="rgba(255,255,255,0.08)"
                              strokeWidth="8"
                              fill="none"
                            />
                            <circle
                              className={styles.ringProgress}
                              cx="44"
                              cy="44"
                              r="36"
                              stroke={
                                analysis.score >= 70 ? '#10B981' : analysis.score >= 40 ? '#F59E0B' : '#EF4444'
                              }
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              style={{
                                strokeDasharray: 2 * Math.PI * 36,
                                strokeDashoffset:
                                  2 * Math.PI * 36 - (analysis.score / 100) * (2 * Math.PI * 36),
                                transition: reduced ? 'none' : 'stroke-dashoffset 0.6s ease',
                              }}
                            />
                            <text
                              x="50%"
                              y="50%"
                              className={styles.ringText}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="var(--text)"
                              fontSize="15"
                              fontWeight="700"
                            >
                              {analysis.score}%
                            </text>
                          </svg>
                          <span className={styles.matchLabel}>{labelForScore(analysis.score)}</span>
                          <span className={styles.atsNote}>ATS match (estimate)</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={styles.noResumeText}>Upload your resume to see your match</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setIsResumePanelOpen(true)}
                        >
                          My resume
                        </Button>
                      </>
                    )}
                    {analysis && (
                      <Button
                        fullWidth
                        onClick={() => handleOptimise(analysisJob, job.id)}
                        className={styles.optimiseBtn}
                      >
                        Optimise <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </ErrorBoundary>
      )}

      <NewJobModal
        isOpen={isNewJobModalOpen}
        onClose={() => setIsNewJobModalOpen(false)}
        onSuccess={async () => {
          setIsNewJobModalOpen(false);
          await handleRefreshJobs();
        }}
      />

      <NewJobModal
        isOpen={isEditJobModalOpen}
        onClose={() => setIsEditJobModalOpen(false)}
        jobToEdit={jobToEdit ?? undefined}
        onSuccess={async () => {
          setIsEditJobModalOpen(false);
          setJobToEdit(null);
          await handleRefreshJobs();
        }}
      />

      <ResumePanel
        open={isResumePanelOpen}
        onClose={() => setIsResumePanelOpen(false)}
        user={currentUser}
        profile={profile}
      />

      {optimise && (
        <ErrorBoundary onClose={() => {
          setOptimise(null);
          setIsOptimiseModalOpen(false);
        }}>
          <OptimiseModal
            open={isOptimiseModalOpen}
            onClose={() => {
              setOptimise(null);
              setIsOptimiseModalOpen(false);
            }}
            job={optimise.job}
            jobId={optimise.jobId}
            initialStep={optimise.step}
            initialResumeId={optimise.resumeId}
            onUpload={() => setIsResumePanelOpen(true)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default Jobs;
