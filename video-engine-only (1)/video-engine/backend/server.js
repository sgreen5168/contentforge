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
console.log('ContentForge Video Engine starting...');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅' : '❌');
console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? '✅' : '❌');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅' : '❌');
console.log('PEXELS_API_KEY:', process.env.PEXELS_API_KEY ? '✅' : '❌');
console.log('REPLICATE_API_KEY:', process.env.REPLICATE_API_KEY ? '✅' : '❌');
console.log('PEXELS_API_KEY:', process.env.PEXELS_API_KEY ? '✅' : '❌');
console.log('REPLICATE_API_KEY:', process.env.REPLICATE_API_KEY ? '✅' : '❌');
console.log('MINIMAX_API_KEY:', process.env.MINIMAX_API_KEY ? '✅' : '❌');
console.log('RUNWAY_API_KEY:', process.env.RUNWAY_API_KEY ? '✅' : '❌');
console.log('FACEBOOK_ACCESS_TOKEN:', process.env.FACEBOOK_ACCESS_TOKEN ? '✅' : '❌');
console.log('INSTAGRAM_ACCESS_TOKEN:', process.env.INSTAGRAM_ACCESS_TOKEN ? '✅' : '❌');
console.log('YOUTUBE_CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID ? '✅' : '❌');
console.log('YOUTUBE_REFRESH_TOKEN:', process.env.YOUTUBE_REFRESH_TOKEN ? '✅' : '❌');
console.log('LUMA_API_KEY:', process.env.LUMA_API_KEY ? '✅' : '❌');
console.log('FAL_API_KEY:', process.env.FAL_API_KEY ? '✅' : '❌');
console.log('PEXELS_API_KEY:', process.env.PEXELS_API_KEY ? '✅' : '❌');
console.log('REPLICATE_API_KEY:', process.env.REPLICATE_API_KEY ? '✅' : '❌');
console.log('PEXELS_API_KEY:', process.env.PEXELS_API_KEY ? '✅' : '❌');
console.log('REPLICATE_API_KEY:', process.env.REPLICATE_API_KEY ? '✅' : '❌');
console.log('MINIMAX_API_KEY:', process.env.MINIMAX_API_KEY ? '✅' : '❌');
console.log('RUNWAY_API_KEY:', process.env.RUNWAY_API_KEY ? '✅' : '❌');
console.log('FACEBOOK_ACCESS_TOKEN:', process.env.FACEBOOK_ACCESS_TOKEN ? '✅' : '❌');
console.log('INSTAGRAM_ACCESS_TOKEN:', process.env.INSTAGRAM_ACCESS_TOKEN ? '✅' : '❌');
console.log('YOUTUBE_CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID ? '✅' : '❌');
console.log('YOUTUBE_REFRESH_TOKEN:', process.env.YOUTUBE_REFRESH_TOKEN ? '✅' : '❌');
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
async function generateClip(prompt, duration) {
  const fetch = (await import('node-fetch')).default;

  // ── Pexels Stock Video (FREE — no credits needed) ─────────────────────────
  if (process.env.PEXELS_API_KEY) {
    try {
      console.log(`🎬 Pexels: searching for "${prompt.slice(0, 60)}..."`);

      // Extract keywords from scene description for search
      const stopWords = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','during','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','need','dare','ought','used','close','quick','person','people']);
      const keywords = prompt
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w))
        .slice(0, 3)
        .join(' ');

      const query = keywords || 'lifestyle productivity';
      console.log(`Pexels search query: "${query}"`);

      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=10&min_duration=4&max_duration=15`,
        { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
      );

      if (res.ok) {
        const data = await res.json();
        const videos = data.videos || [];
        if (videos.length > 0) {
          // Pick a random video from results
          const video = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
          // Get HD quality file
          const files = video.video_files || [];
          const hd = files.find(f => f.quality === 'hd' && f.width >= 720) ||
                     files.find(f => f.quality === 'sd') ||
                     files[0];
          if (hd?.link) {
            console.log(`✅ Pexels video found: ${hd.width}x${hd.height} ${hd.quality} — ${video.duration}s`);
            return hd.link;
          }
        }
        console.warn('Pexels: no suitable video found for query:', query);
        // Try broader search
        const broadRes = await fetch(
          `https://api.pexels.com/videos/search?query=lifestyle&orientation=portrait&per_page=10`,
          { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
        );
        if (broadRes.ok) {
          const broadData = await broadRes.json();
          const vid = broadData.videos?.[Math.floor(Math.random() * 5)];
          const file = vid?.video_files?.find(f => f.quality === 'hd') || vid?.video_files?.[0];
          if (file?.link) {
            console.log(`✅ Pexels fallback video: ${file.link}`);
            return file.link;
          }
        }
      } else {
        console.warn(`Pexels ${res.status}:`, (await res.text()).slice(0, 100));
      }
    } catch (e) {
      console.warn('Pexels failed:', e.message);
    }
  }

  // ── Replicate/Kling (paid fallback) ────────────────────────────────────────
  if (process.env.REPLICATE_API_KEY) {
    console.log(`🎬 Replicate/Kling: "${prompt.slice(0, 60)}..."`);
    const createRes = await fetch('https://api.replicate.com/v1/models/klingai/kling-video-3.0/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: { prompt, duration: 5, aspect_ratio: '9:16' } }),
    });
    const createText = await createRes.text();
    console.log(`Replicate ${createRes.status}:`, createText.slice(0, 200));
    if (!createRes.ok) {
      console.warn('Replicate failed — trying next provider');
    } else {
      const prediction = JSON.parse(createText);
      const predId = prediction.id;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
          headers: { 'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}` },
        });
        const t = await pollRes.json();
        console.log(`Replicate: ${t.status} (${i+1}/60)`);
        if (t.status === 'succeeded') {
          const url = Array.isArray(t.output) ? t.output[0] : t.output;
          if (url) { console.log(`✅ Replicate video ready`); return url; }
          break;
        }
        if (t.status === 'failed' || t.status === 'canceled') { console.warn(`Replicate ${t.status}`); break; }
      }
    }
  }

  // ── MiniMax Hailuo (paid fallback) ─────────────────────────────────────────
  if (process.env.MINIMAX_API_KEY) {
    console.log(`🎬 MiniMax: "${prompt.slice(0, 60)}..."`);
    const res = await fetch('https://api.minimax.io/v1/video_generation', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'MiniMax-Hailuo-02', prompt, duration: 6, resolution: '768P', aspect_ratio: '9:16' }),
    });
    const resText = await res.text();
    console.log(`MiniMax ${res.status}:`, resText.slice(0, 200));
    if (res.ok) {
      const data = JSON.parse(resText);
      const taskId = data.task_id;
      if (taskId) {
        for (let i = 0; i < 72; i++) {
          await new Promise(r => setTimeout(r, 5000));
          const poll = await fetch(`https://api.minimax.io/v1/query/video_generation?task_id=${taskId}`, {
            headers: { 'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}` },
          });
          const t = await poll.json();
          console.log(`MiniMax: ${t.status} (${i+1}/72)`);
          if (t.status === 'Success') {
            if (t.file_id) {
              const fileRes = await fetch(`https://api.minimax.io/v1/files/retrieve?file_id=${t.file_id}`, {
                headers: { 'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}` },
              });
              const fileData = await fileRes.json();
              const url = fileData.file?.download_url;
              if (url) return url;
            }
            if (t.video_url) return t.video_url;
            break;
          }
          if (t.status === 'Fail') { console.warn('MiniMax failed'); break; }
        }
      }
    }
  }

  throw new Error('No video provider available — add PEXELS_API_KEY to Railway for free video clips');
}


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
    const hasVideoKey = !!(process.env.PEXELS_API_KEY || process.env.REPLICATE_API_KEY || process.env.MINIMAX_API_KEY || process.env.LUMA_API_KEY || process.env.FAL_API_KEY || process.env.RUNWAY_API_KEY);
    const hasScenes = !!(script.sceneDescriptions?.length);
    console.log(`🎬 Video clip check: hasKey=${hasVideoKey} hasScenes=${hasScenes} sceneCount=${script.sceneDescriptions?.length || 0}`);

    if (hasVideoKey && hasScenes) {
      await updateJob(jobId, { progress: 55, step: 'Generating video scenes with Luma...' });
      const scenes = script.sceneDescriptions.slice(0, 3);
      for (const scene of scenes) {
        try {
          console.log(`🎬 Generating scene ${scene.scene}: "${scene.visual?.slice(0,60)}..."`);
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
    } else if (!hasVideoKey) {
      console.log('⚠ No video API key configured');
      await updateJob(jobId, { clipError: 'No video API key configured in Railway' });
    } else if (!hasScenes) {
      console.log('⚠ Script returned no scene descriptions');
      await updateJob(jobId, { clipError: 'Script did not return scene descriptions — try regenerating' });
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
    let raw = msg.content[0].text.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Fix common JSON issues before parsing
    raw = raw
      .replace(/,\s*}/g, '}')          // trailing commas before }
      .replace(/,\s*]/g, ']')          // trailing commas before ]
      .replace(/([\w"])\s*\n\s*"/g, '$1, "')  // missing commas between properties
      .replace(/}\s*{/g, '},{');        // missing commas between objects

    let posts;
    try {
      posts = JSON.parse(raw);
    } catch (parseErr) {
      // Try to extract valid JSON with regex as fallback
      console.warn('JSON parse failed, attempting repair:', parseErr.message);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          posts = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          // Build manual response from text
          const fallback = {};
          active.forEach(p => {
            fallback[p] = {
              text: raw.slice(0, 500).replace(/[{}"]/g, '').trim(),
              compliant: true,
              note: ''
            };
          });
          posts = fallback;
        }
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }
    res.json({ posts });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/persona', (_req, res) => {
  res.json({ personas: ['ugc','testimonial','demo','influencer','educator'] });
});
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
        if ((process.env.PEXELS_API_KEY || process.env.REPLICATE_API_KEY || process.env.MINIMAX_API_KEY || process.env.RUNWAY_API_KEY || process.env.LUMA_API_KEY || process.env.FAL_API_KEY) && script.sceneDescriptions?.[0]) {
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

// Reddit integration removed
app.get('/api/facebook/verify', async (_req, res) => {
  try {
    const { verifyFacebookCredentials } = await import('./services/facebookService.js');
    res.json(await verifyFacebookCredentials());
  } catch (e) { res.json({ connected: false, error: e.message }); }
});

app.post('/api/facebook/post-video', async (req, res) => {
  try {
    const { postVideoToFacebook } = await import('./services/facebookService.js');
    res.json(await postVideoToFacebook(req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/facebook/post-text', async (req, res) => {
  try {
    const { postTextToFacebook } = await import('./services/facebookService.js');
    res.json(await postTextToFacebook(req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/instagram/verify', async (_req, res) => {
  try {
    const { verifyInstagramCredentials } = await import('./services/instagramService.js');
    res.json(await verifyInstagramCredentials());
  } catch (e) { res.json({ connected: false, error: e.message }); }
});

app.post('/api/instagram/post-video', async (req, res) => {
  try {
    const { postVideoToInstagram } = await import('./services/instagramService.js');
    res.json(await postVideoToInstagram(req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/instagram/post-image', async (req, res) => {
  try {
    const { postImageToInstagram } = await import('./services/instagramService.js');
    res.json(await postImageToInstagram(req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/youtube/verify', async (_req, res) => {
  try {
    const { verifyYouTubeCredentials } = await import('./services/youtubeService.js');
    res.json(await verifyYouTubeCredentials());
  } catch (e) { res.json({ connected: false, error: e.message }); }
});

app.post('/api/youtube/upload', async (req, res) => {
  try {
    const { uploadVideoToYouTube } = await import('./services/youtubeService.js');
    res.json(await uploadVideoToYouTube(req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/youtube/upload-short', async (req, res) => {
  try {
    const { uploadYouTubeShort } = await import('./services/youtubeService.js');
    res.json(await uploadYouTubeShort(req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
if (process.env.FACEBOOK_ACCESS_TOKEN) {
  import('./services/facebookService.js')
    .then(({ verifyFacebookCredentials }) => verifyFacebookCredentials())
    .then(r => console.log('Facebook:', r.connected ? `✅ ${r.pageName} (${r.followers} followers)` : `❌ ${r.error}`))
    .catch(e => console.warn('Facebook check failed:', e.message));
}

if (process.env.INSTAGRAM_ACCESS_TOKEN) {
  import('./services/instagramService.js')
    .then(({ verifyInstagramCredentials }) => verifyInstagramCredentials())
    .then(r => console.log('Instagram:', r.connected ? `✅ @${r.username} (${r.followers} followers)` : `❌ ${r.error}`))
    .catch(e => console.warn('Instagram check failed:', e.message));
}

if (process.env.YOUTUBE_REFRESH_TOKEN) {
  import('./services/youtubeService.js')
    .then(({ verifyYouTubeCredentials }) => verifyYouTubeCredentials())
    .then(r => console.log('YouTube:', r.connected ? `✅ ${r.channelName} (${r.subscribers} subscribers)` : `❌ ${r.error}`))
    .catch(e => console.warn('YouTube check failed:', e.message));
}
const landingPages = new Map(); // in-memory store

app.post('/api/landing/create', async (req, res) => {
  try {
    const { headline, subheadline, benefits, cta, affiliateUrl, disclaimer, slug, product, style } = req.body;
    if (!affiliateUrl || !headline) return res.status(400).json({ error: 'headline and affiliateUrl required' });

    const id = slug || Math.random().toString(36).slice(2, 8);
    const page = {
      id, headline, subheadline, benefits: benefits || [],
      cta: cta || 'Learn More', affiliateUrl, disclaimer,
      product, style: style || 'teal',
      createdAt: new Date().toISOString(),
      views: 0, clicks: 0,
    };
    landingPages.set(id, page);
    const pageUrl = `${process.env.FRONTEND_URL || 'https://contentstudiohub.com'}/lp/${id}`;
    console.log(`✅ Landing page created: ${pageUrl}`);
    res.json({ success: true, id, url: pageUrl, page });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/landing/:id', (req, res) => {
  const page = landingPages.get(req.params.id);
  if (!page) return res.status(404).json({ error: 'Landing page not found' });
  res.json(page);
});

app.get('/api/landing', (_req, res) => {
  res.json({ pages: [...landingPages.values()].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)) });
});

app.delete('/api/landing/:id', (req, res) => {
  landingPages.delete(req.params.id);
  res.json({ success: true });
});

app.post('/api/landing/:id/click', (req, res) => {
  const page = landingPages.get(req.params.id);
  if (page) { page.clicks++; landingPages.set(req.params.id, page); }
  res.json({ success: true });
});
app.get('/lp/:id', (req, res) => {
  const page = landingPages.get(req.params.id);
  if (!page) return res.status(404).send('<h1>Page not found</h1>');
  page.views++;
  landingPages.set(req.params.id, page);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.headline}</title>
<meta name="description" content="${page.subheadline || page.headline}">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0D2137;color:#E8F4F0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#102D4F;border:1px solid rgba(29,158,117,.25);border-radius:16px;padding:40px 32px;max-width:520px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)}
  .badge{display:inline-block;background:rgba(29,158,117,.2);color:#5DCAA5;font-size:11px;padding:4px 12px;border-radius:20px;margin-bottom:16px;font-weight:500;letter-spacing:.5px;text-transform:uppercase}
  h1{font-size:26px;font-weight:700;margin-bottom:12px;line-height:1.3;color:#E8F4F0}
  .sub{font-size:16px;color:#7BAAA0;margin-bottom:28px;line-height:1.6}
  .benefits{list-style:none;text-align:left;margin-bottom:28px}
  .benefits li{padding:10px 0;border-bottom:1px solid rgba(29,158,117,.1);font-size:15px;display:flex;gap:10px;align-items:flex-start;color:#E8F4F0}
  .benefits li::before{content:'✓';color:#1D9E75;font-weight:700;flex-shrink:0;margin-top:1px}
  .cta{display:block;background:#1D9E75;color:white;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:17px;font-weight:600;margin-bottom:12px;transition:opacity .2s;cursor:pointer}
  .cta:hover{opacity:.9}
  .sub-cta{font-size:12px;color:#4A7A72;margin-bottom:20px}
  .disclaimer{font-size:11px;color:#4A7A72;line-height:1.5;border-top:1px solid rgba(29,158,117,.1);padding-top:16px}
  .views{font-size:10px;color:#2A5A52;margin-top:8px}
</style>
</head>
<body>
<div class="card">
  <div class="badge">✦ Featured Resource</div>
  <h1>${page.headline}</h1>
  <p class="sub">${page.subheadline || ''}</p>
  <ul class="benefits">
    ${(page.benefits || []).map(b => `<li>${b.replace(/^[-•*✓]\s*/,'')}</li>`).join('')}
  </ul>
  <a href="${page.affiliateUrl}" class="cta" onclick="fetch('/api/landing/${page.id}/click',{method:'POST'})" target="_blank" rel="noopener noreferrer">
    ${page.cta} →
  </a>
  <p class="sub-cta">No obligation • Takes less than 60 seconds</p>
  <p class="disclaimer">${page.disclaimer || 'Results may vary. This page contains affiliate links.'} #ad #affiliate</p>
  <p class="views">${page.views} people viewed this page</p>
</div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
app.post('/api/image/generate', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const { prompt, width = 1024, height = 1024, n = 2, style } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const styleMap = {
      photorealistic: 'photorealistic, high quality photography, professional photo, 4K',
      lifestyle:      'lifestyle photography, natural light, authentic, warm tones',
      professional:   'professional corporate photography, clean background, business style',
      minimalist:     'minimalist, clean, simple background, elegant, modern',
      vibrant:        'vibrant colors, bold, eye-catching, dynamic composition',
      social:         'social media ready, engaging, modern, trendy aesthetic',
    };

    const enhancedPrompt = [
      prompt,
      styleMap[style] || 'high quality, professional',
      'no text, no watermarks, no logos',
    ].filter(Boolean).join(', ');

    const count = Math.min(n, 4);
    const results = [];

    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 999999);
      const w = Math.min(width, 1024);
      const h = Math.min(height, 1024);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&enhance=true`;
      results.push({ url, seed });
    }

    console.log(`✅ Generated ${results.length} images via Pollinations.ai`);
    res.json({ images: results, count: results.length });
  } catch (e) {
    console.error('Image generation error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/affiliate/shorten', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(req.body.url)}`);
    const short = await r.text();
    res.json({ original: req.body.url, shortened: short.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
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
