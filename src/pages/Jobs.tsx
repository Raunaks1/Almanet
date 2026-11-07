import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Briefcase, MapPin, Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NewJobModal } from '../components/NewJobModal';
import { PageHeader } from '../components/shell/PageHeader';
import { Badge, Button, EmptyState, SegmentedControl, Skeleton, useToast } from '../components/ui';
import { listStagger } from '../lib/motion';
import styles from './Jobs.module.css';

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

const timeAgo = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const typeOptions = [
  { value: 'All', label: 'All' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Contract', label: 'Contract' },
];

const Jobs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const reduced = useReducedMotion() ?? false;
  const toast = useToast();

  React.useEffect(() => {
    const fetchJobs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsApproved(true);
        setCurrentUser(session.user);
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*, profiles:author_id(full_name)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setJobs(data as unknown as JobPost[]);
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  const stagger = listStagger();

  // Keep Apply alert as a Toast.
  const handleApply = (jobTitle: string, company: string) => {
    toast.show({ title: `Applied to ${jobTitle}`, description: `at ${company}`, variant: 'success' });
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Jobs"
        subtitle="Opportunities shared by the Almanet community."
        actions={
          <Button iconLeft={<Plus size={18} strokeWidth={1.75} />} onClick={() => setIsNewJobModalOpen(true)} disabled={!isApproved}>
            Post a job
          </Button>
        }
      />

      <div className={styles.filterBar} role="search">
        <div className={styles.searchWrap}>
          <Search size={16} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search jobs, companies, locations"
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
      </div>

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
      ) : filteredJobs.length === 0 ? (
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
        <motion.div
          className={styles.grid}
          variants={reduced ? undefined : stagger.parent}
          initial={reduced ? undefined : 'hidden'}
          animate={reduced ? undefined : 'show'}
        >
          {filteredJobs.map((job) => (
            <motion.article key={job.id} className={styles.card} variants={reduced ? undefined : stagger.child}>
              <div className={styles.monogram} aria-hidden="true">
                {(job.company || '?').charAt(0).toUpperCase()}
              </div>
              <div className={styles.body}>
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <p className={styles.companyLine}>
                  <span>{job.company}</span>
                  <span className={styles.metaInline}>
                    <MapPin size={14} strokeWidth={1.75} aria-hidden="true" />
                    {job.location}
                  </span>
                </p>
                {job.tags && job.tags.length > 0 && (
                  <div className={styles.tags}>
                    {job.tags.map((tag, idx) => (
                      <span key={idx} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.cardRight}>
                <Badge variant={job.type === 'Internship' ? 'accent' : 'neutral'} size="sm">
                  {job.type}
                </Badge>
                <span className={styles.posted}>{timeAgo(job.created_at)}</span>
                <Button size="sm" onClick={() => handleApply(job.title, job.company)}>
                  Apply
                </Button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      <NewJobModal
        isOpen={isNewJobModalOpen}
        onClose={() => setIsNewJobModalOpen(false)}
        currentUser={currentUser}
        onSuccess={(newJob) => {
          setJobs([newJob, ...jobs]);
          setIsNewJobModalOpen(false);
        }}
      />
    </div>
  );
};

export default Jobs;
