/**
 * Resume hook for the signed-in user.
 *
 * Loads the user's resumes from public.resumes (newest first).
 * - status 'ready' resumes are eligible for scoring.
 * - status 'needs_attention' resumes are listed but disabled for scoring.
 * Remembers the active resume id in localStorage (id only, never text) and
 * defaults to the newest ready resume.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { listResumes, type Resume } from '../resumes';

const ACTIVE_RESUME_STORAGE_KEY = 'almanet_active_resume_id';

export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setResumes([]);
        setActiveId(null);
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const all = await listResumes(userId);
      setResumes(all);

      const ready = all.filter((r) => r.status === 'ready');
      const newestReady = ready[0]?.id ?? null;

      // Scope the active-resume memory to the signed-in user (id only).
      const key = userId ? `${ACTIVE_RESUME_STORAGE_KEY}_${userId}` : ACTIVE_RESUME_STORAGE_KEY;
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;

      let active = stored;
      if (!active || !all.some((r) => r.id === active)) {
        active = newestReady;
        if (active) localStorage.setItem(key, active);
      }
      setActiveId(active);
    } catch (err: any) {
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const readyResumes = resumes.filter((r) => r.status === 'ready');
  const needsAttention = resumes.filter((r) => r.status !== 'ready');
  const activeResume = resumes.find((r) => r.id === activeId) ?? readyResumes[0] ?? null;

  const setActiveResume = (id: string) => {
    const userId = resumes.find((r) => r.id === id)?.user_id;
    const key = userId ? `${ACTIVE_RESUME_STORAGE_KEY}_${userId}` : ACTIVE_RESUME_STORAGE_KEY;
    try {
      localStorage.setItem(key, id);
    } catch {
      // localStorage may be unavailable in private mode; ignore.
    }
    setActiveId(id);
  };

  return {
    resumes,
    readyResumes,
    needsAttention,
    activeResume,
    activeId,
    setActiveResume,
    loading,
    error,
  };
}
