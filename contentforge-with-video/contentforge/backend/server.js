import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { existsSync, mkdirSync } from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const OUTPUT_DIR = process.env.OUTPUT_DIR || './output';

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.static(OUTPUT_DIR));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ status: 'ContentForge Video Engine v1.0', ok: true }));
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0' }));

// ── In-memory job store ───────────────────────────────────────────────────────
const jobs = new Map();

function createJob(data) {
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const job = { id, status: 'queued', progress: 0, step: 'Queued', data, result: null, error: null, createdAt: new Date().toISOString() };
  jobs.set(id, job);
  return job;
}

function updateJob(id, updates) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, updates, { updatedAt: new Date().toISOString() });
  return job;
}

// ── Script generation with Claude ─────────────────────────────────────────────
async function generateScript({ topic, url, affiliateUrl, inputMode, persona, duration, style, platforms }) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const platList = platforms.join(', ');
  const durationSecs = parseInt(duration) || 30;
  const subject = inputMode === 'topic' ? `Topic: "${topic}"` : inputMode === 'url' ? `URL content: ${url}` : `Affiliate product: ${affiliateUrl}`;

  const prompt = `Write a ${durationSecs}-second ${persona} style video script for ${platList}.
${subject}
Visual style: ${style}

Return ONLY raw JSON:
{
  "hook": "opening line",
  "fullScript": "complete voiceover script",
  "cta": "call to action",
  "sceneDescriptions": [
    {"scene": 1, "duration": 5, "visual": "what to show on screen", "text": "overlay text"}
  ],
  "hashtags": ["#tag1", "#tag2"],
  "title": "video title",
  "description": "platform caption",
  "estimatedDuration": ${durationSecs}
}`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    system: 'You are a short-form video script expert. Reply with valid JSON only.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(raw);
}

// ── Voiceover with ElevenLabs ─────────────────────────────────────────────────
async function generateVoiceover(script, persona, jobId) {
  const VOICES = { testimonial: 'EXAVITQu4vr4xnSDxMaL', demo: 'VR6AewLTigWG4xSOukaG', influencer: 'pFZP5JQG7iQjIQuC4Bku', educator: 'onwK4e9ZLuTAKqWW03F9', ugc: 'EXAVITQu4vr4xnSDxMaL' };
  const voiceId = VOICES[persona] || VOICES.ugc;
  const fetch = (await import('node-fetch')).default;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify({ text: script, model_id: 'eleven_turbo_v2', voice_settings: { stability: 0.5, similarity_boost: 0.8 } }),
  });

  if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);

  const { createWriteStream } = await import('fs');
  const { join } = await import('path');
  const audioPath = join(OUTPUT_DIR, `voice_${jobId}.mp3`);
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(audioPath);
    res.body.pipe(stream);
    res.body.on('error', reject);
    stream.on('finish', resolve);
  });
  return audioPath;
}

// ── Video clip with RunwayML ──────────────────────────────────────────────────
async function generateClip(prompt, duration) {
  const fetch = (await import('node-fetch')).default;
  const API_KEY = process.env.RUNWAY_API_KEY;

  const res = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
    body: JSON.stringify({ model: 'gen4_turbo', promptText: prompt, duration: Math.min(duration || 5, 10), ratio: '720:1280' }),
  });

  if (!res.ok) throw new Error(`RunwayML error: ${res.status}`);
  const task = await res.json();

  for (let i = 0; i < 45; i++) {
    await new Promise(r => setTimeout(r, 4000));
    const poll = await fetch(`https://api.dev.runwayml.com/v1/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'X-Runway-Version': '2024-11-06' },
    });
    const t = await poll.json();
    if (t.status === 'SUCCEEDED') return t.output?.[0] || t.artifacts?.[0]?.url;
    if (t.status === 'FAILED') throw new Error('RunwayML clip failed');
  }
  throw new Error('RunwayML timed out');
}

// ── Main video generation pipeline ────────────────────────────────────────────
async function runPipeline(jobId, params) {
  try {
    updateJob(jobId, { status: 'processing', progress: 10, step: 'Writing video script with AI...' });
    const script = await generateScript(params);
    updateJob(jobId, { progress: 35, step: 'Generating voiceover...', script });

    let audioPath = null;
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        audioPath = await generateVoiceover(script.fullScript, params.persona, jobId);
        updateJob(jobId, { progress: 55, step: 'Voiceover ready — generating video scenes...' });
      } catch (e) { console.warn('Voiceover failed:', e.message); }
    }

    const clips = [];
    if (process.env.RUNWAY_API_KEY && script.sceneDescriptions?.length) {
      updateJob(jobId, { progress: 60, step: 'Generating video scenes with RunwayML...' });
      for (const scene of script.sceneDescriptions.slice(0, 3)) {
        try {
          const videoUrl = await generateClip(scene.visual, scene.duration);
          clips.push({ scene: scene.scene, videoUrl, status: 'success' });
          updateJob(jobId, { progress: 60 + (clips.length * 10), step: `Scene ${scene.scene} ready...` });
        } catch (e) {
          clips.push({ scene: scene.scene, status: 'failed', error: e.message });
        }
      }
    }

    updateJob(jobId, {
      status: 'completed', progress: 100, step: 'Complete!',
      result: { script, audioPath: audioPath ? `/output/voice_${jobId}.mp3` : null, clips, uploadResults: [] }
    });
  } catch (err) {
    updateJob(jobId, { status: 'failed', error: err.message });
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/api/video/generate', async (req, res) => {
  const { inputMode='topic', topic='', url='', affiliateUrl='', persona='ugc', duration='30s', style='ugc', platforms=['tiktok'], autoUpload=false } = req.body;
  if (!topic && !url && !affiliateUrl) return res.status(400).json({ error: 'topic, url, or affiliateUrl required' });
  const job = createJob({ inputMode, topic, url, affiliateUrl, persona, duration, style, platforms, autoUpload });
  res.json({ jobId: job.id, status: 'queued' });
  runPipeline(job.id, { inputMode, topic, url, affiliateUrl, persona, duration, style, platforms }).catch(console.error);
});

app.get('/api/video/job/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/api/video/jobs', (_req, res) => {
  res.json([...jobs.values()].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20));
});

app.post('/api/vsl/generate', async (req, res) => {
  try {
    const script = await generateScript({ ...req.body, inputMode: 'topic', topic: req.body.product, persona: 'testimonial', platforms: ['tiktok'], style: 'studio' });
    res.json({ script });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/persona', (_req, res) => res.json({ personas: ['testimonial','demo','influencer','educator','ugc'] }));
app.post('/api/affiliate/shorten', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(req.body.url)}`);
    const short = await r.text();
    res.json({ original: req.body.url, shortened: short.trim() });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Start ─────────────────────────────────────────────────────────────────────
createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ContentForge Video Engine running on port ${PORT}`);
});
