import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// CORS headers — no external package needed
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;

// ── In-memory job store ───────────────────────────────────────────────────────
const jobs = new Map();

async function updateJob(id, updates) {
  const job = jobs.get(id) || {};
  const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  if (process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      await db.from('video_jobs').upsert({ id, ...updates, updated_at: updated.updatedAt });
    } catch (e) { console.warn('DB update failed:', e.message); }
  }
  return updated;
}

async function getJob(id) {
  if (jobs.has(id)) return jobs.get(id);
  if (process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data } = await db.from('video_jobs').select('*').eq('id', id).single();
      if (data) { jobs.set(id, data); return data; }
    } catch (e) {}
  }
  return null;
}

async function getAllJobs() {
  if (process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data } = await db.from('video_jobs').select('*').order('created_at', { ascending: false }).limit(50);
      return data || [];
    } catch (e) {}
  }
  return [...jobs.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ── Startup log ───────────────────────────────────────────────────────────────
console.log('ContentForge Video Engine starting...');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅' : '❌');
console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? '✅' : '❌');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅' : '❌');
console.log('LUMA_API_KEY:', process.env.LUMA_API_KEY ? '✅' : '❌');
console.log('FAL_API_KEY:', process.env.FAL_API_KEY ? '✅' : '❌');
console.log('RUNWAY_API_KEY:', process.env.RUNWAY_API_KEY ? '✅' : '❌');

// ── Script generation ─────────────────────────────────────────────────────────
async function generateScript(params) {
  const { inputMode, topic, url, affiliateUrl, persona, duration, style, platforms, videoType, editedScript } = params;
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const videoTypes = {
    'ugc-persona':  'authentic UGC-style first-person review',
    'ai-vsl':       'Video Sales Letter with Hook-Problem-Solution-CTA structure',
    'hybrid-vsl':   'Hybrid VSL combining avatar sections with B-roll',
    'reel-ads':     'short punchy Reel ad under 30 seconds',
    'product-ads':  'direct-response product ad with price and urgency',
    'commercial':   'cinematic brand commercial with emotional arc',
    'competitor':   'competitor-style video with original content',
  };

  const vType = videoTypes[videoType] || 'engaging short-form video';
  const inputDesc = inputMode === 'topic' ? `Topic: ${topic}` : inputMode === 'url' ? `URL: ${url}` : `Affiliate link: ${affiliateUrl}`;

  const prompt = `Create a complete ${vType} script for ${platforms?.join(', ') || 'social media'}.

${inputDesc}
Duration: ${duration || '30s'}
Persona: ${persona || 'ugc'}
Style: ${style || 'casual'}
${editedScript ? `Use this as the base script and improve it:\n${editedScript}` : ''}

Return ONLY valid JSON with this exact structure:
{
  "hook": "opening line that grabs attention",
  "fullScript": "complete word-for-word script",
  "cta": "call to action",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "sceneDescriptions": [
    {"scene": 1, "visual": "detailed visual description for AI video generation", "duration": 5},
    {"scene": 2, "visual": "detailed visual description for AI video generation", "duration": 5},
    {"scene": 3, "visual": "detailed visual description for AI video generation", "duration": 5}
  ]
}`;

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    system: 'You are an expert video script writer. Return only valid JSON, no markdown.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(raw);
}

// ── Voiceover generation ──────────────────────────────────────────────────────
async function generateVoiceover(script, persona, jobId) {
  const fetch = (await import('node-fetch')).default;
  const fs = (await import('fs')).default;
  const audioPath = `/tmp/voice_${jobId}_${Date.now()}.mp3`;

  if (process.env.OPENAI_API_KEY) {
    const voices = { ugc: 'nova', testimonial: 'shimmer', demo: 'onyx', influencer: 'alloy', educator: 'echo' };
    const voice = voices[persona] || 'nova';
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: script.slice(0, 4096), voice }),
    });
    if (!res.ok) throw new Error(`OpenAI TTS: ${res.status}`);
    const buffer = await res.buffer();
    fs.writeFileSync(audioPath, buffer);
    console.log('✅ OpenAI TTS voiceover ready');
    return audioPath;
  }

  if (process.env.ELEVENLABS_API_KEY) {
    const voiceIds = {
      ugc: '21m00Tcm4TlvDq8ikWAM',
      testimonial: 'AZnzlk1XvdvUeBnXmlld',
      demo: 'EXAVITQu4vr4xnSDxMaL',
      influencer: 'ErXwobaYiN019PkySvjV',
      educator: 'VR6AewLTigWG4xSOukaG',
    };
    const voiceId = voiceIds[persona] || '21m00Tcm4TlvDq8ikWAM';
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({ text: script.slice(0, 2500), model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!res.ok) throw new Error(`ElevenLabs: ${res.status}`);
    const buffer = await res.buffer();
    fs.writeFileSync(audioPath, buffer);
    console.log('✅ ElevenLabs voiceover ready');
    return audioPath;
  }

  throw new Error('No voiceover key — add OPENAI_API_KEY or ELEVENLABS_API_KEY to Railway');
}

// ── Video clip generation ─────────────────────────────────────────────────────
async function generateClip(prompt, duration) {
  const fetch = (await import('node-fetch')).default;

  if (process.env.LUMA_API_KEY) {
    console.log(`🎬 Luma: "${prompt.slice(0, 60)}..."`);
    const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LUMA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: 'ray-2',
        resolution: '720p',
        duration: duration <= 5 ? '5s' : '9s',
        aspect_ratio: '9:16',
      }),
    });
    const resText = await res.text();
    console.log(`Luma ${res.status}:`, resText.slice(0, 150));
    if (!res.ok) throw new Error(`Luma ${res.status}: ${resText.slice(0, 200)}`);
    const gen = JSON.parse(resText);
    const genId = gen.id;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const poll = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${genId}`, {
        headers: { 'Authorization': `Bearer ${process.env.LUMA_API_KEY}`, 'Accept': 'application/json' },
      });
      const t = await poll.json();
      console.log(`Luma status: ${t.state} (${i + 1}/60)`);
      if (t.state === 'completed') {
        const videoUrl = t.assets?.video;
        if (videoUrl) return videoUrl;
        throw new Error('Luma completed but no video URL');
      }
      if (t.state === 'failed') throw new Error(`Luma failed: ${t.failure_reason || 'unknown'}`);
    }
    throw new Error('Luma timed out');
  }

  if (process.env.FAL_API_KEY) {
    console.log(`🎬 fal.ai: "${prompt.slice(0, 60)}..."`);
    const res = await fetch('https://fal.run/fal-ai/kling-video/v1.6/standard/text-to-video', {
      method: 'POST',
      headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration: duration <= 5 ? '5' : '10', aspect_ratio: '9:16' }),
    });
    if (!res.ok) throw new Error(`fal.ai ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const requestId = data.request_id;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const poll = await fetch(`https://fal.run/fal-ai/kling-video/v1.6/standard/text-to-video/requests/${requestId}`, {
        headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}` },
      });
      const t = await poll.json();
      if (t.status === 'COMPLETED') {
        const videoUrl = t.output?.video?.url || t.output?.[0]?.url;
        if (videoUrl) return videoUrl;
        throw new Error('fal.ai no video URL');
      }
      if (t.status === 'FAILED') throw new Error(`fal.ai failed: ${t.error}`);
    }
    throw new Error('fal.ai timed out');
  }

  if (process.env.RUNWAY_API_KEY) {
    console.log(`🎬 RunwayML: "${prompt.slice(0, 60)}..."`);
    const res = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
      body: JSON.stringify({ model: 'gen3a_turbo', promptText: prompt, duration: Math.min(duration || 5, 10), ratio: '720:1280' }),
    });
    const resText = await res.text();
    if (!res.ok) throw new Error(`RunwayML ${res.status}: ${resText.slice(0, 200)}`);
    const task = JSON.parse(resText);
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const poll = await fetch(`https://api.dev.runwayml.com/v1/tasks/${task.id}`, {
        headers: { 'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`, 'X-Runway-Version': '2024-11-06' },
      });
      const t = await poll.json();
      if (t.status === 'SUCCEEDED') return t.output?.[0] || t.artifacts?.[0]?.url;
      if (t.status === 'FAILED') throw new Error(`RunwayML failed: ${t.failure}`);
    }
    throw new Error('RunwayML timed out');
  }

  throw new Error('No video API key — add LUMA_API_KEY, FAL_API_KEY, or RUNWAY_API_KEY to Railway');
}

// ── R2 upload ─────────────────────────────────────────────────────────────────
async function tryUploadToR2(localPath, key) {
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const fs = await import('fs');
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
    });
    const body = fs.default.readFileSync(localPath);
    await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: body, ContentType: 'video/mp4' }));
    return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
  } catch (e) {
    console.warn('R2 upload failed:', e.message);
    return null;
  }
}

// ── Main pipeline ─────────────────────────────────────────────────────────────
async function runPipeline(jobId, params) {
  const { inputMode, topic, url, affiliateUrl, persona, duration, durationSeconds, style, platforms, autoUpload, videoType, editedScript } = params;

  try {
    await updateJob(jobId, { status: 'processing', progress: 10, step: 'Writing script with Claude AI...' });
    const script = await generateScript({ inputMode, topic, url, affiliateUrl, persona, duration, style, platforms, videoType, editedScript });
    await updateJob(jobId, { progress: 30, step: 'Script ready — generating voiceover...', script });

    let audioPath = null;
    if (process.env.OPENAI_API_KEY || process.env.ELEVENLABS_API_KEY) {
      try {
        audioPath = await generateVoiceover(script.fullScript, persona, jobId);
        await updateJob(jobId, { progress: 50, step: 'Voiceover ready — generating video scenes...' });
      } catch (e) {
        console.warn('Voiceover failed:', e.message);
        await updateJob(jobId, { step: `Voiceover failed (${e.message.slice(0,60)}) — generating video scenes...` });
      }
    } else {
      await updateJob(jobId, { step: 'No voiceover key — generating video scenes...' });
    }

    const clips = [];
    if ((process.env.LUMA_API_KEY || process.env.FAL_API_KEY || process.env.RUNWAY_API_KEY) && script.sceneDescriptions?.length) {
      await updateJob(jobId, { progress: 55, step: 'Generating video scenes...' });
      const scenes = script.sceneDescriptions.slice(0, 3);
      for (const scene of scenes) {
        try {
          const videoUrl = await generateClip(scene.visual, scene.duration || 5);
          clips.push({ scene: scene.scene, videoUrl, status: 'success' });
          const pct = 55 + Math.round((clips.length / scenes.length) * 30);
          await updateJob(jobId, { progress: pct, step: `Scene ${clips.length} of ${scenes.length} ready...`, clipError: null });
        } catch (e) {
          console.error(`Scene ${scene.scene} failed:`, e.message);
          clips.push({ scene: scene.scene, status: 'failed', error: e.message });
          await updateJob(jobId, { clipError: e.message });
        }
      }
    }

    const finalVideoUrl = clips.find(c => c.videoUrl)?.videoUrl || null;
    let r2Url = null;
    if (finalVideoUrl && process.env.R2_BUCKET_NAME) {
      r2Url = await tryUploadToR2(finalVideoUrl, `videos/${jobId}.mp4`);
    }

    await updateJob(jobId, {
      status: 'completed',
      progress: 100,
      step: 'Complete!',
      result: {
        script,
        clips,
        finalVideoUrl: r2Url || finalVideoUrl,
        audioPath,
        audioUrl: audioPath ? 'generated' : null,  // flag for frontend
        hasAudio: !!audioPath,
      },
    });

    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
      try {
        const { sendVideoCompleteEmail } = await import('./services/emailService.js');
        await sendVideoCompleteEmail({ jobId, script, clipUrl: r2Url || finalVideoUrl, topic: topic || url, persona, duration, platforms });
      } catch (e) { console.warn('Email failed:', e.message); }
    }
  } catch (e) {
    console.error('Pipeline error:', e.message);
    await updateJob(jobId, { status: 'failed', step: 'Failed', error: e.message });
  }
}

// ── VSL generation ────────────────────────────────────────────────────────────
async function generateVSLScript({ product, price, audience, pain, solution, duration, affiliateUrl }) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: 'Expert VSL copywriter. Return only valid JSON.',
    messages: [{
      role: 'user',
      content: `Write a high-converting VSL script for: ${product} ($${price}) targeting ${audience}.
Pain point: ${pain}. Solution: ${solution}. Duration: ${duration || '60s'}.
${affiliateUrl ? `Affiliate link: ${affiliateUrl}` : ''}
Return JSON: { "hook", "problemAgitation", "solutionReveal", "socialProof", "offer", "guarantee", "cta", "fullScript", "hashtags": [] }`,
    }],
  });
  const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(raw);
}

// ── API Routes ────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.0', luma: !!process.env.LUMA_API_KEY, r2: !!process.env.R2_BUCKET_NAME, supabase: !!process.env.SUPABASE_URL });
});

app.post('/api/video/script', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  try {
    const script = await generateScript(req.body);
    res.json({ script });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/video/generate', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  const jobId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const job = { id: jobId, status: 'queued', progress: 0, step: 'Queued...', data: req.body, createdAt: new Date().toISOString() };
  jobs.set(jobId, job);
  res.json({ jobId, status: 'queued' });
  runPipeline(jobId, req.body).catch(console.error);
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
    const script = await generateVSLScript(req.body);
    res.json({ script });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { inputMode, topic, url, style, platforms, affiliate } = req.body;
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const PM = { facebook: 'Facebook', instagram: 'Instagram', reddit: 'Reddit' };
    const active = (platforms || ['facebook','instagram','reddit']).filter(p => PM[p]);
    const prompt = `Write ${style || 'Casual'} social media posts for: ${inputMode === 'topic' ? topic : url}
${affiliate ? 'Include affiliate link naturally.' : ''}
Platforms: ${active.join(', ')}
Return JSON: { ${active.map(p => `"${p}": {"text": "post content", "compliant": true, "note": ""}`).join(', ')} }`;
    const msg = await client.messages.create({
      model: 'claude-opus-4-5', max_tokens: 1000,
      system: 'Expert social media copywriter. Return only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    res.json({ posts: JSON.parse(raw) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/persona', (_req, res) => {
  res.json({ personas: ['ugc','testimonial','demo','influencer','educator'] });
});

// ── Bulk routes ───────────────────────────────────────────────────────────────
const bulkJobs = new Map();

app.post('/api/bulk/variations', async (req, res) => {
  const { baseTopic, count = 10, persona = 'ugc', videoType = 'auto' } = req.body;
  if (!baseTopic) return res.status(400).json({ error: 'baseTopic required' });
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-opus-4-5', max_tokens: 500,
      system: 'Reply with valid JSON array only.',
      messages: [{ role: 'user', content: `Generate ${count} unique video topic variations based on: "${baseTopic}" for ${persona} style videos. Return JSON array of ${count} strings.` }],
    });
    const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    res.json({ topics: JSON.parse(raw) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/bulk/generate', async (req, res) => {
  const { topics, persona = 'ugc', duration = '30s', style = 'ugc', platforms = ['tiktok'], videoType = 'auto', concurrency = 2 } = req.body;
  if (!topics?.length) return res.status(400).json({ error: 'topics array required' });
  if (topics.length > 10) return res.status(400).json({ error: 'Max 10 videos per batch' });
  const batchId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const batch = {
    batchId, status: 'queued', total: topics.length, completed: 0, failed: 0, progress: 0,
    jobs: topics.map((topic, i) => ({ index: i+1, topic, status: 'queued', progress: 0, step: 'Waiting...', result: null, error: null })),
    createdAt: new Date().toISOString(),
    settings: { persona, duration, style, platforms, videoType },
  };
  bulkJobs.set(batchId, batch);
  res.json({ batchId, total: batch.total, status: 'queued' });
  runBulkBatch(batchId, topics, { persona, duration, style, platforms, videoType, concurrency }).catch(console.error);
});

app.get('/api/bulk/:batchId', (req, res) => {
  const batch = bulkJobs.get(req.params.batchId);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  res.json(batch);
});

app.get('/api/bulk', (_req, res) => {
  res.json({ batches: [...bulkJobs.values()].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,10) });
});

async function runBulkBatch(batchId, topics, settings) {
  const batch = bulkJobs.get(batchId);
  batch.status = 'processing';
  const { concurrency = 2, persona, duration, style, platforms, videoType } = settings;
  for (let i = 0; i < topics.length; i += concurrency) {
    const chunk = topics.slice(i, i + concurrency);
    await Promise.all(chunk.map(async (topic, ci) => {
      const idx = i + ci;
      batch.jobs[idx].status = 'processing';
      batch.jobs[idx].step = 'Writing script...';
      try {
        const script = await generateScript({ inputMode: 'topic', topic, persona, duration, style, platforms, videoType });
        batch.jobs[idx].progress = 40;
        batch.jobs[idx].step = 'Script ready...';
        let clipUrl = null;
        if ((process.env.LUMA_API_KEY || process.env.FAL_API_KEY || process.env.RUNWAY_API_KEY) && script.sceneDescriptions?.[0]) {
          try { clipUrl = await generateClip(script.sceneDescriptions[0].visual, 5); } catch (e) { console.warn(`Bulk clip failed:`, e.message); }
        }
        batch.jobs[idx].status = 'completed';
        batch.jobs[idx].progress = 100;
        batch.jobs[idx].step = 'Complete!';
        batch.jobs[idx].result = { script, clipUrl, topic };
        batch.completed++;
      } catch (e) {
        batch.jobs[idx].status = 'failed';
        batch.jobs[idx].error = e.message;
        batch.failed++;
      }
      batch.progress = Math.round(((batch.completed + batch.failed) / batch.total) * 100);
    }));
  }
  batch.status = 'completed';
}

// ── Schedule routes ───────────────────────────────────────────────────────────
const schedules = new Map();

app.post('/api/schedule', async (req, res) => {
  const { jobId, platforms, scheduledAt, script, videoUrl } = req.body;
  if (!platforms?.length || !scheduledAt) return res.status(400).json({ error: 'platforms and scheduledAt required' });
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const schedule = { id, jobId, platforms, scheduledAt, script, videoUrl, status: 'scheduled', createdAt: new Date().toISOString() };
  schedules.set(id, schedule);
  res.json({ schedule });
});

app.get('/api/schedule', (_req, res) => {
  res.json({ schedules: [...schedules.values()].sort((a,b) => new Date(a.scheduledAt)-new Date(b.scheduledAt)) });
});

app.delete('/api/schedule/:id', (req, res) => {
  schedules.delete(req.params.id);
  res.json({ success: true });
});

app.get('/api/schedule/optimal/:platform', (req, res) => {
  const times = {
    tiktok: [{ time:'19:00', label:'7pm — Peak TikTok' }],
    instagram: [{ time:'11:00', label:'11am — Peak Reels' }],
    youtube: [{ time:'15:00', label:'3pm — Shorts peak' }],
    'fb-reels': [{ time:'13:00', label:'1pm — Facebook lunch' }],
    reddit: [{ time:'08:00', label:'8am ET — Reddit peak' }],
  };
  const t = times[req.params.platform];
  if (!t) return res.status(404).json({ error: 'Platform not found' });
  res.json({ platform: req.params.platform, optimalTimes: t });
});

// ── Email routes ──────────────────────────────────────────────────────────────
app.get('/api/email/settings', (_req, res) => {
  res.json({
    configured: !!(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL),
    notifyEmail: process.env.NOTIFY_EMAIL ? process.env.NOTIFY_EMAIL.replace(/(.{2}).*(@.*)/, '$1***$2') : null,
  });
});

app.post('/api/email/test', async (req, res) => {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL) return res.status(400).json({ error: 'RESEND_API_KEY and NOTIFY_EMAIL required' });
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'ContentForge <notifications@contentstudiohub.com>', to: [process.env.NOTIFY_EMAIL], subject: '✅ ContentForge email working!', html: '<p>Email notifications are working!</p>' }),
    });
    if (!r.ok) throw new Error(`Resend: ${r.status}`);
    res.json({ success: true, message: `Test email sent to ${process.env.NOTIFY_EMAIL}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Reddit routes ─────────────────────────────────────────────────────────────
app.get('/api/reddit/verify', async (_req, res) => {
  if (!process.env.REDDIT_CLIENT_ID) return res.json({ connected: false, error: 'REDDIT_CLIENT_ID not set' });
  try {
    const { verifyRedditCredentials } = await import('./services/redditService.js');
    res.json(await verifyRedditCredentials());
  } catch (e) { res.json({ connected: false, error: e.message }); }
});

app.post('/api/reddit/post-video', async (req, res) => {
  try {
    const { postVideoToReddit } = await import('./services/redditService.js');
    res.json(await postVideoToReddit(req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reddit/post-text', async (req, res) => {
  try {
    const { postTextToReddit } = await import('./services/redditService.js');
    res.json(await postTextToReddit(req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/affiliate/shorten', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(req.body.url)}`);
    const short = await r.text();
    res.json({ original: req.body.url, shortened: short.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ContentForge Video Engine running on port ${PORT}`);
});

// Scheduler — check every minute
setInterval(async () => {
  const now = new Date();
  for (const [id, s] of schedules.entries()) {
    if (s.status === 'scheduled' && new Date(s.scheduledAt) <= now) {
      console.log(`📅 Publishing scheduled post ${id}`);
      schedules.set(id, { ...s, status: 'published', publishedAt: now.toISOString() });
    }
  }
}, 60000);
