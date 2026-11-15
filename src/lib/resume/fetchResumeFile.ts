/**
 * fetchResumeFile — fetches a resume file from Supabase storage as an
 * ArrayBuffer, held in memory only while the viewer is open.
 *
 * Uses the existing getResumeUrl (short-lived signed URL, 60 s) then fetches
 * the bytes. Never logs, persists, or returns the URL. The caller is
 * responsible for releasing any object URLs and dropping the buffer on close.
 */

import { getResumeUrl } from '../resumes';

export async function fetchResumeFile(filePath: string): Promise<ArrayBuffer> {
  const signedUrl = await getResumeUrl(filePath);
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch resume: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}
