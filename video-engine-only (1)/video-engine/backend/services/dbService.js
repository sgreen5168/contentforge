import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabase = null;

function getClient() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return supabase;
}

export function isDbConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

// ── Save job to Supabase ──────────────────────────────────────────────────────
export async function saveJob(job) {
  const db = getClient();
  if (!db) return job;
  try {
    const { error } = await db.from('video_jobs').upsert({
      id:         job.id,
      status:     job.status,
      progress:   job.progress,
      step:       job.step,
      data:       job.data,
      result:     job.result,
      error:      job.error,
      created_at: job.createdAt,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('DB save error:', error.message);
  } catch (e) {
    console.warn('DB error:', e.message);
  }
  return job;
}

// ── Get job from Supabase ─────────────────────────────────────────────────────
export async function getJobFromDb(id) {
  const db = getClient();
  if (!db) return null;
  try {
    const { data, error } = await db.from('video_jobs').select('*').eq('id', id).single();
    if (error || !data) return null;
    return {
      id:        data.id,
      status:    data.status,
      progress:  data.progress,
      step:      data.step,
      data:      data.data,
      result:    data.result,
      error:     data.error,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (e) {
    return null;
  }
}

// ── Get all jobs from Supabase ────────────────────────────────────────────────
export async function getAllJobsFromDb(limit = 20) {
  const db = getClient();
  if (!db) return [];
  try {
    const { data, error } = await db
      .from('video_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(d => ({
      id:        d.id,
      status:    d.status,
      progress:  d.progress,
      step:      d.step,
      data:      d.data,
      result:    d.result,
      error:     d.error,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch (e) {
    return [];
  }
}
