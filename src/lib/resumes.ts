/**
 * Resume data layer — thin wrappers around Supabase storage + the public.resumes table.
 * All URLs are signed (60 s); no public URLs are ever created.
 */

import { supabase } from './supabase';

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: string;
  parsed: any;
  extracted_text: string | null;
  created_at: string;
}

/** List the signed-in user's resumes, newest first. */
export async function listResumes(userId: string): Promise<Resume[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    file_name: r.file_name,
    file_path: r.file_path,
    mime_type: r.mime_type,
    size_bytes: r.size_bytes,
    status: r.status,
    parsed: r.parsed,
    extracted_text: r.extracted_text,
    created_at: r.created_at,
  }));
}

/**
 * Upload a resume file to the private "resumes" bucket at
 * `<user id>/<random uuid>.<ext>`, then insert a row into public.resumes.
 * `onProgress` receives a 0–100 percentage.
 */
export async function uploadResume(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Resume> {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}${ext}`;

  // Supabase JS v2 does not expose upload progress; report milestones instead.
  onProgress?.(10);

  const { error: uploadErr } = await supabase.storage
    .from('resumes')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadErr) throw uploadErr;

  onProgress?.(50);

  const { data, error: insertErr } = await supabase
    .from('resumes')
    .insert([
      {
        user_id: userId,
        file_name: file.name.trim().slice(0, 200),
        file_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
        status: 'uploaded',
        parsed: null,
        extracted_text: null,
      },
    ])
    .select();

  if (insertErr) {
    // Best-effort cleanup of the orphaned storage object.
    await supabase.storage.from('resumes').remove([path]);
    throw insertErr;
  }

  if (!data || data.length === 0) {
    await supabase.storage.from('resumes').remove([path]);
    throw new Error('Resume record was not created. Please try again.');
  }

  onProgress?.(100);

  const r = data[0];
  return {
    id: r.id,
    user_id: r.user_id,
    file_name: r.file_name,
    file_path: r.file_path,
    mime_type: r.mime_type,
    size_bytes: r.size_bytes,
    status: r.status,
    parsed: r.parsed,
    extracted_text: r.extracted_text,
    created_at: r.created_at,
  };
}

/** Delete a resume: remove the storage object, then the database row. */
export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  const { data: resume } = await supabase
    .from('resumes')
    .select('file_path')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

  if (resume?.file_path) {
    await supabase.storage.from('resumes').remove([resume.file_path]);
  }

  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId)
    .eq('user_id', userId);

  if (error) throw error;
}

/** Get a signed URL (60 s) for a resume file. Never returns a public URL. */
export async function getResumeUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(filePath, 60);

  if (error) throw error;
  if (!data?.signedUrl) throw new Error('Unable to create download link.');
  return data.signedUrl;
}

/**
 * Update ONLY the extracted text + parsed data of an existing resume row.
 * Returns the number of rows updated (should be 1 for a single resume id).
 */
export async function updateResumeContent(
  userId: string,
  resumeId: string,
  extractedText: string,
  parsed: unknown,
): Promise<number> {
  const { data, error } = await supabase
    .from('resumes')
    .update({ extracted_text: extractedText, parsed })
    .eq('id', resumeId)
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return data?.length ?? 0;
}
