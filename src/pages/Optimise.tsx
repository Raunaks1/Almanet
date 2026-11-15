/**
 * Optimise route — renders the Optimise modal for the given job.
 *
 * Kept so the /jobs/:jobId/optimise route remains functional. The resume
 * optimisation flow is rule-based and runs entirely in the browser; no sample
 * resume and no AI calls are used here.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { buildAnalysisJob, type AnalysisJob } from '../lib/resume/analyzeResume';
import { OptimiseModal } from '../components/resume/OptimiseModal';
import { ErrorBoundary, Skeleton } from '../components/ui';

type JobPost = {
  id: string;
  title: string;
  company: string;
  description?: string | null;
  requirements?: string[] | null;
  tags?: string[] | null;
  experience?: string | null;
  type?: string | null;
};

export const Optimise: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();
        if (err) throw err;
        if (cancelled) return;
        setJob(data ? buildAnalysisJob(data as JobPost) : null);
        if (!data) setError('Job not found.');
      } catch {
        if (cancelled) return;
        setError('Unable to load the job.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
        <Skeleton width={120} height={120} radius="circle" />
        <div style={{ marginTop: 12 }}>
          <Skeleton width="40%" height={24} radius={6} />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ padding: 24, color: 'var(--text-2)' }}>
        {error || 'Job not found.'}
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          style={{ marginTop: 12, background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary onClose={() => navigate('/jobs')}>
      <OptimiseModal
        open
        onClose={() => navigate('/jobs')}
        job={job}
        jobId={jobId ?? ''}
        onUpload={() => {}}
      />
    </ErrorBoundary>
  );
};

export default Optimise;
