import dotenv from 'dotenv';
dotenv.config();

// In-memory bulk job store
const bulkJobs = new Map();

// ── Create a bulk generation batch ───────────────────────────────────────────
export function createBulkJob({ topics, persona, duration, style, platforms, videoType, variations }) {
  const batchId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const batch = {
    batchId,
    status: 'queued',
    total: topics.length,
    completed: 0,
    failed: 0,
    progress: 0,
    jobs: topics.map((topic, i) => ({
      index: i + 1,
      topic,
      jobId: null,
      status: 'queued',
      progress: 0,
      step: 'Waiting...',
      result: null,
      error: null,
    })),
    createdAt: new Date().toISOString(),
    settings: { persona, duration, style, platforms, videoType, variations },
  };
  bulkJobs.set(batchId, batch);
  return batch;
}

export function getBulkJob(batchId) {
  return bulkJobs.get(batchId) || null;
}

export function updateBulkJob(batchId, updates) {
  const batch = bulkJobs.get(batchId);
  if (!batch) return null;
  Object.assign(batch, updates, { updatedAt: new Date().toISOString() });
  bulkJobs.set(batchId, batch);
  return batch;
}

export function updateBulkJobItem(batchId, index, updates) {
  const batch = bulkJobs.get(batchId);
  if (!batch) return null;
  const item = batch.jobs.find(j => j.index === index);
  if (!item) return null;
  Object.assign(item, updates);
  // Recalculate overall progress
  const completed = batch.jobs.filter(j => j.status === 'completed').length;
  const failed    = batch.jobs.filter(j => j.status === 'failed').length;
  const progress  = Math.round(((completed + failed) / batch.total) * 100);
  const allDone   = completed + failed === batch.total;
  batch.completed = completed;
  batch.failed    = failed;
  batch.progress  = progress;
  batch.status    = allDone ? 'completed' : 'processing';
  bulkJobs.set(batchId, batch);
  return batch;
}

export function getAllBulkJobs() {
  return [...bulkJobs.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ── Generate topic variations using Claude ───────────────────────────────────
export async function generateTopicVariations({ baseTopic, count, persona, videoType }) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Generate ${count} unique video topic variations based on this base topic for ${persona} style ${videoType} videos.

Base topic: "${baseTopic}"

Return ONLY a JSON array of ${count} unique, specific topic strings that are all related to the base topic but each has a unique angle, hook, or perspective:
["topic 1", "topic 2", "topic 3", ...]

Make each topic specific enough to generate a completely different video script. Vary the angle — some motivational, some educational, some story-based, some list-based.`;

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    system: 'Reply with valid JSON array only.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].text.trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(raw);
}
