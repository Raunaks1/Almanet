// ─── Dashboard data layer (read-only) ───
// Independent queries run with Promise.allSettled; each section owns its own
// skeleton / empty / error state. Column names match the existing pages that
// read the same tables (Jobs, Events, Forums).

import { supabase } from './supabase';
import { fetchChannelsForUser } from './chat';

export interface DashboardJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  created_at: string;
  author_name?: string;
  unread_count?: number;
}

export interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  location: string;
}

export interface DashboardForumPost {
  id: string;
  title: string;
  category: string;
  created_at: string;
  author_name?: string;
}

export interface DashboardBatchMate {
  id: string;
  full_name: string;
  branch?: string | null;
  avatar_url?: string | null;
}

export interface DashboardCompleteness {
  photo: boolean;
  bio: boolean;
  skills: boolean;
  linkedin: boolean;
  workDetails: boolean;
  firstMessage: boolean;
  percentage: number;
  remaining: string[];
}

export interface DashboardData {
  messages: DashboardJob[]; // reused shape: channel → message list item
  jobs: DashboardJob[];
  events: DashboardEvent[];
  forums: DashboardForumPost[];
  batch: DashboardBatchMate[];
  pendingCount: number | null;
  completeness: DashboardCompleteness | null;
}

/* ─── Helpers ─── */

const timeAgo = (dateStr: string): string => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export { timeAgo };

/* ─── Messages (reuses fetchChannelsForUser from chat.ts — not edited) ─── */

export async function fetchDashboardMessages(userId: string): Promise<DashboardJob[]> {
  try {
    const channels = await fetchChannelsForUser(userId);
    return channels.map((ch) => ({
      id: ch.id,
      title: ch.dm_partner_name || ch.name,
      company: ch.type === 'dm' ? 'Direct message' : (ch.type || 'Channel'),
      location: timeAgo(ch.last_message_at || ch.created_at),
      type: ch.type,
      created_at: ch.created_at,
      author_name: ch.last_message,
      unread_count: ch.unread_count,
    }));
  } catch (err) {
    console.error('Dashboard messages error:', err);
    return [];
  }
}

/* ─── Alumni in my college (approved alumni, same college) ─── */

export interface DashboardAlumniCount {
  total: number;
  thisMonth: number;
}

export async function fetchDashboardAlumniCount(college: string): Promise<DashboardAlumniCount> {
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('user_type', 'alumni')
    .eq('verification_status', 'approved')
    .eq('college', college);

  if (error || !data) return { total: 0, thisMonth: 0 };

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = data.filter((p) => new Date(p.created_at) >= monthStart).length;
  return { total: data.length, thisMonth };
}

/* ─── Jobs ─── */

export async function fetchDashboardJobs(): Promise<DashboardJob[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, company, location, type, created_at, profiles:profiles!jobs_author_id_profiles_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error || !data) return [];

  return data.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    type: j.type,
    created_at: j.created_at,
    author_name: (j.profiles as { full_name?: string } | null)?.full_name,
  }));
}

/* ─── New jobs posted in the last 7 days ─── */

export async function fetchDashboardNewJobsCount(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let { data, error } = await supabase
    .from('jobs')
    .select('id')
    .gte('created_at', sevenDaysAgo)
    .eq('status', 'open');

  // The jobs table may not have a `status` column yet — fall back without it.
  if (error && String(error.message).includes('column "status"')) {
    const { data: d2, error: e2 } = await supabase
      .from('jobs')
      .select('id')
      .gte('created_at', sevenDaysAgo);
    if (e2 || !d2) return 0;
    return d2.length;
  }

  if (error || !data) return 0;
  return data.length;
}

/* ─── Events ─── */

export async function fetchDashboardEvents(): Promise<DashboardEvent[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('events')
    .select('id, title, date, location')
    .gte('date', today.toISOString())
    .order('date', { ascending: true })
    .limit(3);

  if (error || !data) return [];

  return data.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    location: e.location,
  }));
}

/* ─── Count of upcoming events (for the stat card) ─── */

export async function fetchDashboardUpcomingEventsCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('date', today.toISOString());

  if (error) return 0;
  return count ?? 0;
}

/* ─── Forums ─── */

export async function fetchDashboardForums(): Promise<DashboardForumPost[]> {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('id, title, category, created_at, profiles:author_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    created_at: p.created_at,
    author_name: (p.profiles as { full_name?: string } | null)?.full_name,
  }));
}

/* ─── Recent activity: merge latest jobs, forums, events ─── */

export interface DashboardActivityItem {
  id: string;
  title: string;
  created_at: string;
  type: 'job' | 'forum' | 'event' | 'message';
  author_name?: string;
  url: string;
  unread?: number;
}

export async function fetchDashboardRecentActivity(): Promise<DashboardActivityItem[]> {
  const [jobsRes, forumsRes, eventsRes] = await Promise.allSettled([
    supabase.from('jobs').select('id, title, created_at, profiles:profiles!jobs_author_id_profiles_fkey(full_name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('forum_posts').select('id, title, created_at, profiles:author_id(full_name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('events').select('id, title, date').order('date', { ascending: false }).limit(10),
  ]);

  const items: DashboardActivityItem[] = [];

  if (jobsRes.status === 'fulfilled' && jobsRes.value.data) {
    for (const j of jobsRes.value.data) {
      items.push({
        id: j.id,
        title: j.title,
        created_at: j.created_at,
        type: 'job',
        author_name: (j.profiles as { full_name?: string } | null)?.full_name,
        url: '/jobs',
      });
    }
  }

  if (forumsRes.status === 'fulfilled' && forumsRes.value.data) {
    for (const p of forumsRes.value.data) {
      items.push({
        id: p.id,
        title: p.title,
        created_at: p.created_at,
        type: 'forum',
        author_name: (p.profiles as { full_name?: string } | null)?.full_name,
        url: '/forums',
      });
    }
  }

  if (eventsRes.status === 'fulfilled' && eventsRes.value.data) {
    for (const e of eventsRes.value.data) {
      items.push({
        id: e.id,
        title: e.title,
        created_at: e.date,
        type: 'event',
        url: '/events',
      });
    }
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return items.slice(0, 5);
}

/* ─── Batch mates (approved classmates, same college + grad year) ─── */

export async function fetchDashboardBatch(profile: {
  id: string;
  college?: string | null;
  graduation_year?: number | null;
}): Promise<DashboardBatchMate[]> {
  if (!profile.college || !profile.graduation_year) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, branch, avatar_url')
    .eq('verification_status', 'approved')
    .eq('college', profile.college)
    .eq('graduation_year', profile.graduation_year)
    .neq('id', profile.id)
    .order('full_name', { ascending: true })
    .limit(5);

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    branch: p.branch ?? null,
    avatar_url: p.avatar_url ?? null,
  }));
}

/* ─── Pending count (admin only) ─── */

export async function fetchDashboardPendingCount(): Promise<number | null> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending');

  if (error) return null;
  return count ?? 0;
}

/* ─── Profile completeness ─── */

export function computeProfileCompleteness(profile: {
  avatar_url?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  linkedin?: string | null;
  company?: string | null;
  job_title?: string | null;
  firstMessageSent?: boolean;
}): DashboardCompleteness {
  const steps: Array<{ key: keyof DashboardCompleteness; label: string; ok: boolean }> = [
    { key: 'photo', label: 'Add a profile photo', ok: Boolean(profile.avatar_url) },
    { key: 'bio', label: 'Add a bio', ok: Boolean(profile.bio) },
    { key: 'skills', label: 'Add at least one skill', ok: Boolean(profile.skills?.length) },
    { key: 'linkedin', label: 'Add LinkedIn profile', ok: Boolean(profile.linkedin) },
    { key: 'workDetails', label: 'Add work details', ok: Boolean(profile.company || profile.job_title) },
    { key: 'firstMessage', label: 'Send your first message', ok: Boolean(profile.firstMessageSent) },
  ];

  const remaining = steps.filter((s) => !s.ok).map((s) => s.label);
  const total = steps.length;
  const done = total - remaining.length;
  const percentage = total === 0 ? 100 : Math.round((done / total) * 100);

  return {
    photo: steps[0].ok,
    bio: steps[1].ok,
    skills: steps[2].ok,
    linkedin: steps[3].ok,
    workDetails: steps[4].ok,
    firstMessage: steps[5].ok,
    percentage,
    remaining,
  };
}
