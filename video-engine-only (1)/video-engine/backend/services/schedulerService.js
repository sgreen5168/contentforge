import dotenv from 'dotenv';
dotenv.config();

// In-memory schedule store (backed by Supabase if configured)
const schedules = new Map();

// ── Optimal posting times per platform ───────────────────────────────────────
export const OPTIMAL_TIMES = {
  tiktok:    [{ day: 'Any', time: '19:00', label: '7pm — Peak TikTok engagement' },
              { day: 'Any', time: '09:00', label: '9am — Morning scroll' },
              { day: 'Tue', time: '20:00', label: 'Tue 8pm — Best day + time' }],
  instagram: [{ day: 'Any', time: '11:00', label: '11am — Peak Reels time' },
              { day: 'Any', time: '19:00', label: '7pm — Evening engagement' },
              { day: 'Wed', time: '11:00', label: 'Wed 11am — Highest reach' }],
  youtube:   [{ day: 'Any', time: '15:00', label: '3pm — YouTube Shorts peak' },
              { day: 'Sat', time: '11:00', label: 'Sat 11am — Weekend views' },
              { day: 'Sun', time: '17:00', label: 'Sun 5pm — End of weekend' }],
  'fb-reels':{ day: 'Any', time: '13:00', label: '1pm — Facebook lunch scroll' },
  'fb-feed': { day: 'Any', time: '09:00', label: '9am — Morning Facebook' },
  reddit:    [{ day: 'Any', time: '08:00', label: '8am ET — Reddit morning peak' },
              { day: 'Mon', time: '08:00', label: 'Mon 8am ET — Highest traffic' }],
};

// ── Create a scheduled post ───────────────────────────────────────────────────
export async function schedulePost({ jobId, platforms, scheduledAt, script, videoUrl }) {
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const schedule = {
    id,
    jobId,
    platforms,
    scheduledAt,
    script,
    videoUrl,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    results: [],
  };
  schedules.set(id, schedule);

  // Save to Supabase if configured
  if (process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      await db.from('scheduled_posts').upsert({
        id,
        job_id: jobId,
        platforms,
        scheduled_at: scheduledAt,
        script,
        video_url: videoUrl,
        status: 'scheduled',
        created_at: schedule.createdAt,
      });
    } catch (e) { console.warn('DB schedule save failed:', e.message); }
  }

  console.log(`📅 Scheduled post ${id} for ${scheduledAt} on ${platforms.join(', ')}`);
  return schedule;
}

// ── Get all schedules ─────────────────────────────────────────────────────────
export async function getAllSchedules() {
  if (process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data } = await db.from('scheduled_posts')
        .select('*')
        .order('scheduled_at', { ascending: true });
      return (data || []).map(d => ({
        id: d.id,
        jobId: d.job_id,
        platforms: d.platforms,
        scheduledAt: d.scheduled_at,
        script: d.script,
        videoUrl: d.video_url,
        status: d.status,
        createdAt: d.created_at,
        results: d.results || [],
      }));
    } catch (e) {}
  }
  return [...schedules.values()].sort((a, b) =>
    new Date(a.scheduledAt) - new Date(b.scheduledAt)
  );
}

// ── Cancel a scheduled post ───────────────────────────────────────────────────
export async function cancelSchedule(id) {
  schedules.delete(id);
  if (process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      await db.from('scheduled_posts').update({ status: 'cancelled' }).eq('id', id);
    } catch (e) {}
  }
  return { success: true };
}

// ── Check and fire due schedules (called every minute) ───────────────────────
export async function processDueSchedules() {
  const now = new Date();
  const all = await getAllSchedules();
  const due = all.filter(s =>
    s.status === 'scheduled' &&
    new Date(s.scheduledAt) <= now
  );

  for (const schedule of due) {
    console.log(`🚀 Publishing scheduled post ${schedule.id}`);
    await publishScheduledPost(schedule);
  }
}

// ── Publish a scheduled post to all platforms ─────────────────────────────────
async function publishScheduledPost(schedule) {
  const results = [];

  for (const platform of schedule.platforms) {
    try {
      // Dynamic import of upload service
      const { uploadToAllPlatforms } = await import('./uploadService.js').catch(() => null) || {};

      if (uploadToAllPlatforms && schedule.videoUrl) {
        const uploadResult = await uploadToAllPlatforms({
          videoPath: schedule.videoUrl,
          script: schedule.script,
          platforms: [platform],
        });
        results.push(...uploadResult);
      } else {
        // Simulate for platforms without upload keys
        results.push({ platform, status: 'skipped', reason: 'No upload credentials' });
      }
    } catch (e) {
      results.push({ platform, status: 'failed', error: e.message });
    }
  }

  // Update status
  const updated = { ...schedule, status: 'published', results };
  schedules.set(schedule.id, updated);

  if (process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      await db.from('scheduled_posts').update({
        status: 'published',
        results,
        published_at: new Date().toISOString(),
      }).eq('id', schedule.id);
    } catch (e) {}
  }

  console.log(`✅ Published ${schedule.id}:`, results);
  return updated;
}

// ── Start the scheduler — checks every minute ─────────────────────────────────
export function startScheduler() {
  console.log('📅 Scheduler started — checking every minute');
  setInterval(processDueSchedules, 60 * 1000);
  processDueSchedules(); // Run immediately on start
}

// ── Get next optimal time for a platform ──────────────────────────────────────
export function getNextOptimalTime(platform) {
  const now = new Date();
  const times = Array.isArray(OPTIMAL_TIMES[platform])
    ? OPTIMAL_TIMES[platform]
    : [OPTIMAL_TIMES[platform]];

  // Find the next upcoming optimal time slot
  for (const slot of times) {
    const [h, m] = slot.time.split(':').map(Number);
    const candidate = new Date(now);
    candidate.setHours(h, m, 0, 0);
    if (candidate > now) return { time: candidate.toISOString(), label: slot.label };
    // Try tomorrow
    candidate.setDate(candidate.getDate() + 1);
    return { time: candidate.toISOString(), label: slot.label + ' (tomorrow)' };
  }
  return null;
}
