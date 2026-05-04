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
app.use('/output', express.static(OUTPUT_DIR));

// ── In-memory job store (backed by Supabase if configured) ───────────────────
const jobs = new Map();

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createJob(data) {
  const job = {
    id: makeId(), status: 'queued', progress: 0,
    step: 'Queued', data, result: null, error: null,
    createdAt: new Date().toISOString(),
  };
  jobs.set(job.id, job);
  return job;
}

async function updateJob(id, updates) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, updates, { updatedAt: new Date().toISOString() });
  jobs.set(id, job);
  // Persist to Supabase if configured
  if (process.env.SUPABASE_URL) {
    try {
      const { saveJob } = await import('./services/dbService.js');
      await saveJob(job);
    } catch (e) { console.warn('DB save failed:', e.message); }
  }
  return job;
}

async function getJob(id) {
  // Check memory first
  if (jobs.has(id)) return jobs.get(id);
  // Fall back to Supabase
  if (process.env.SUPABASE_URL) {
    try {
      const { getJobFromDb } = await import('./services/dbService.js');
      const job = await getJobFromDb(id);
      if (job) { jobs.set(id, job); return job; }
    } catch (e) {}
  }
  return null;
}

async function getAllJobs() {
  // If Supabase configured use it for persistent history
  if (process.env.SUPABASE_URL) {
    try {
      const { getAllJobsFromDb } = await import('./services/dbService.js');
      return await getAllJobsFromDb(20);
    } catch (e) {}
  }
  return [...jobs.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({
  status: 'ContentForge Video Engine v2.0',
  storage: process.env.R2_ACCOUNT_ID ? 'Cloudflare R2 ✅' : 'Local only',
  database: process.env.SUPABASE_URL ? 'Supabase ✅' : 'In-memory only',
}));
app.get('/health', (_req, res) => res.json({
  status: 'ok', version: '2.0',
  r2: !!process.env.R2_ACCOUNT_ID,
  supabase: !!process.env.SUPABASE_URL,
}));

// ── Script generation ─────────────────────────────────────────────────────────
async function generateScript(params) {
  const { topic, url, affiliateUrl, inputMode, persona, duration, style, platforms, videoType } = params;
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const secs = parseInt(duration) || 30;
  const platList = (platforms || ['tiktok']).join(', ');
  const subject = inputMode === 'topic' ? `Topic: "${topic}"` :
    inputMode === 'url' ? `URL content: ${url}` : `Affiliate product: ${affiliateUrl}`;
  const typeInstructions = {
    'ugc-persona':  'Write as an authentic UGC creator sharing personal experience. First-person, casual, relatable.',
    'ai-vsl':       'Write as a direct-response VSL. Hook → Problem → Agitate → Solution → Offer → CTA.',
    'hybrid-vsl':   'Write for hybrid format: avatar intro, B-roll demo section, product close-up, CTA outro.',
    'reel-ads':     'Write as a punchy Reel ad. Pattern-interrupt hook in 2 seconds. Fast pacing. Strong CTA.',
    'product-ads':  'Write as a product ad. Lead with biggest benefit. Show features. Price anchor. Urgency CTA.',
    'commercial':   'Write as a brand commercial. Emotional story arc. Cinematic pacing. Brand tagline close.',
    'competitor':   'Analyze competitor structure and write original content with same pacing and flow.',
    'auto':         'Choose the most effective format based on the input content.',
  };
  const prompt = `Write a ${secs}-second ${persona} video script for ${platList}.
${subject}
Video type: ${videoType || 'auto'} — ${typeInstructions[videoType] || typeInstructions.auto}
Visual style: ${style || 'ugc'}

Return ONLY raw JSON:
{
  "hook": "opening line — stops the scroll in 2 seconds",
  "fullScript": "complete word-for-word voiceover script",
  "cta": "call to action",
  "sceneDescriptions": [
    {"scene": 1, "duration": 5, "visual": "detailed visual description for video generation", "text": "caption overlay text"}
  ],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "title": "video title for upload",
  "description": "platform caption",
  "estimatedDuration": ${secs}
}`;

  const msg = await client.messages.create({
    model: 'claude-opus-4-5', max_tokens: 1500,
    system: 'You are a short-form video script expert. Reply with valid JSON only.',
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(raw);
}

// ── ElevenLabs voiceover ──────────────────────────────────────────────────────
async function generateVoiceover(script, persona, jobId) {
  const VOICES = {
    testimonial: 'EXAVITQu4vr4xnSDxMaL',
    demo: 'VR6AewLTigWG4xSOukaG',
    influencer: 'pFZP5JQG7iQjIQuC4Bku',
    educator: 'onwK4e9ZLuTAKqWW03F9',
    ugc: 'EXAVITQu4vr4xnSDxMaL',
  };
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
  console.log(`🎙️ Voiceover saved: ${audioPath}`);
  return audioPath;
}

// ── RunwayML video clip ───────────────────────────────────────────────────────
async function generateClip(prompt, duration) {
  const fetch = (await import('node-fetch')).default;
  const API_KEY = process.env.RUNWAY_API_KEY;
  const res = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
    body: JSON.stringify({ model: 'gen4_turbo', promptText: prompt, duration: Math.min(duration || 5, 10), ratio: '720:1280' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`RunwayML: ${err.message || res.status}`);
  }
  const task = await res.json();
  console.log(`⏳ RunwayML task: ${task.id}`);
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const poll = await fetch(`https://api.dev.runwayml.com/v1/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'X-Runway-Version': '2024-11-06' },
    });
    const t = await poll.json();
    console.log(`⏳ ${t.status} (${i + 1}/60)`);
    if (t.status === 'SUCCEEDED') {
      const url = t.output?.[0] || t.artifacts?.[0]?.url;
      if (url) return url;
      throw new Error('No video URL in response');
    }
    if (t.status === 'FAILED') throw new Error(`RunwayML failed: ${t.failure || 'unknown'}`);
  }
  throw new Error('RunwayML timed out');
}

// ── Upload to R2 if configured ────────────────────────────────────────────────
async function tryUploadToR2(localPath, key) {
  if (!process.env.R2_ACCOUNT_ID) return null;
  try {
    const { uploadToR2 } = await import('./services/storageService.js');
    const url = await uploadToR2(localPath, key);
    console.log(`☁️ Uploaded to R2: ${key}`);
    return url;
  } catch (e) {
    console.warn('R2 upload failed:', e.message);
    return null;
  }
}

// ── Main pipeline ─────────────────────────────────────────────────────────────
async function runPipeline(jobId, params) {
  try {
    // Step 1 — Script
    await updateJob(jobId, { status: 'processing', progress: 10, step: 'Writing video script with AI...' });
    const script = await generateScript(params);
    await updateJob(jobId, { progress: 30, step: 'Script ready — generating voiceover...', script });

    // Step 2 — Voiceover
    let audioPath = null;
    let audioUrl = null;
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        audioPath = await generateVoiceover(script.fullScript, params.persona, jobId);
        // Upload audio to R2
        audioUrl = await tryUploadToR2(audioPath, `audio/${jobId}/voice.mp3`);
        await updateJob(jobId, { progress: 50, step: 'Voiceover ready — generating video scenes...' });
      } catch (e) {
        console.warn('Voiceover failed (continuing):', e.message);
        await updateJob(jobId, { step: 'Voiceover skipped — generating video scenes...' });
      }
    }

    // Step 3 — RunwayML clips
    const clips = [];
    if (process.env.RUNWAY_API_KEY && script.sceneDescriptions?.length) {
      await updateJob(jobId, { progress: 55, step: 'Generating video scenes with RunwayML...' });
      const scenes = script.sceneDescriptions.slice(0, 3);
      for (const scene of scenes) {
        try {
          const videoUrl = await generateClip(scene.visual, scene.duration);
          clips.push({ scene: scene.scene, videoUrl, status: 'success' });
          const pct = 55 + Math.round((clips.length / scenes.length) * 30);
          await updateJob(jobId, { progress: pct, step: `Scene ${scene.scene} of ${scenes.length} ready...` });
        } catch (e) {
          console.error(`Scene ${scene.scene} failed:`, e.message);
          clips.push({ scene: scene.scene, status: 'failed', error: e.message });
        }
      }
    }

    // Step 4 — Upload final video to R2
    let finalVideoUrl = null;
    const successClips = clips.filter(c => c.videoUrl);
    if (successClips.length > 0) {
      await updateJob(jobId, { progress: 90, step: 'Uploading video to cloud storage...' });
      // For now store the first clip URL — FFmpeg assembly can be added later
      finalVideoUrl = successClips[0].videoUrl;
    }

    // Done!
    await updateJob(jobId, {
      status: 'completed', progress: 100, step: 'Complete!',
      result: {
        script,
        audioUrl: audioUrl || (audioPath ? `/output/voice_${jobId}.mp3` : null),
        clips,
        finalVideoUrl,
        uploadResults: [],
      },
    });
    console.log(`✅ Job ${jobId} complete`);
  } catch (e) {
    console.error(`Job ${jobId} failed:`, e.message);
    await updateJob(jobId, { status: 'failed', error: e.message });
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/api/video/generate', async (req, res) => {
  const { inputMode='topic', topic='', url='', affiliateUrl='', persona='ugc',
    duration='30s', style='ugc', platforms=['tiktok'], autoUpload=false, videoType='auto',
    competitorUrl='', vslSections=[], autoPacing=true, trendCaptions=true,
    autoScrape=true, showPrice=false, ctaText='', tagline='', brandColor='#534AB7',
    preserveStruct=true, energyLevel=3, personaStyle='Friendly reviewer' } = req.body;

  if (!topic && !url && !affiliateUrl) return res.status(400).json({ error: 'topic, url, or affiliateUrl required' });

  const job = createJob({ inputMode, topic, url, affiliateUrl, persona, duration,
    style, platforms, autoUpload, videoType, competitorUrl });
  res.json({ jobId: job.id, status: 'queued' });

  runPipeline(job.id, { inputMode, topic, url, affiliateUrl, persona, duration,
    style, platforms, videoType }).catch(console.error);
});

app.get('/api/video/job/:id', async (req, res) => {
  const job = await getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/api/video/jobs', async (_req, res) => {
  res.json(await getAllJobs());
});

app.post('/api/vsl/generate', async (req, res) => {
  try {
    const script = await generateScript({
      ...req.body, inputMode: 'topic', topic: req.body.product,
      persona: 'testimonial', platforms: ['tiktok'], style: 'studio', videoType: 'ai-vsl',
    });
    res.json({ script });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/persona', (_req, res) => res.json({
  personas: ['testimonial', 'demo', 'influencer', 'educator', 'ugc']
}));

app.post('/api/affiliate/shorten', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(req.body.url)}`);
    const short = await r.text();
    res.json({ original: req.body.url, shortened: short.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Start ─────────────────────────────────────────────────────────────────────
createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ContentForge Video Engine v2.0 running on port ${PORT}`);
  console.log(`☁️  R2 Storage: ${process.env.R2_ACCOUNT_ID ? 'Configured ✅' : 'Not configured'}`);
  console.log(`🗄️  Supabase:   ${process.env.SUPABASE_URL ? 'Configured ✅' : 'Not configured'}`);
});
