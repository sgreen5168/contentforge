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
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅' : '❌');
console.log('PEXELS_API_KEY:', process.env.PEXELS_API_KEY ? '✅' : '❌');
console.log('REPLICATE_API_KEY:', process.env.REPLICATE_API_KEY ? '✅' : '❌');
console.log('MINIMAX_API_KEY:', process.env.MINIMAX_API_KEY ? '✅' : '❌');
console.log('RUNWAY_API_KEY:', process.env.RUNWAY_API_KEY ? '✅' : '❌');
console.log('LUMA_API_KEY:', process.env.LUMA_API_KEY ? '✅' : '❌');
console.log('FAL_API_KEY:', process.env.FAL_API_KEY ? '✅' : '❌');
console.log('FACEBOOK_ACCESS_TOKEN:', process.env.FACEBOOK_ACCESS_TOKEN ? '✅' : '❌');
console.log('INSTAGRAM_ACCESS_TOKEN:', process.env.INSTAGRAM_ACCESS_TOKEN ? '✅' : '❌');
console.log('YOUTUBE_CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID ? '✅' : '❌');
console.log('YOUTUBE_REFRESH_TOKEN:', process.env.YOUTUBE_REFRESH_TOKEN ? '✅' : '❌');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME ? '✅' : '❌');

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
    {"scene": 1, "visual": "2-4 STOCK-FOOTAGE-SEARCHABLE keywords for the hook, e.g. 'woman frustrated laptop kitchen' — lead with the main subject noun, then setting, then action. No adjectives like quick/close/style.", "duration": 5},
    {"scene": 2, "visual": "2-4 stock-footage-searchable keywords for the problem, same format: subject + setting + action", "duration": 5},
    {"scene": 3, "visual": "2-4 stock-footage-searchable keywords for the solution, same format: subject + setting + action", "duration": 5},
    {"scene": 4, "visual": "2-4 stock-footage-searchable keywords for the CTA, same format: subject + setting + action", "duration": 5},
    {"scene": 5, "visual": "optional scene for longer videos — same keyword format", "duration": 5},
    {"scene": 6, "visual": "optional scene for longer videos — same keyword format", "duration": 5}
  ]
}

IMPORTANT for sceneDescriptions: these are used to search a stock video library (Pexels), not to direct a film shoot. Write them as a short list of concrete, literal, searchable nouns and verbs that would actually appear as a Pexels video title — like "woman typing laptop home office" not "a determined professional powering through her morning workflow." Avoid abstract/emotional language, camera direction words (close-up, split-screen, cut), and filler. Every scene's keywords must reflect what is literally, visually happening in THAT part of the script — not a generic restatement of the whole video's topic.`;

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    system: 'You are an expert video script writer. Return only valid JSON, no markdown.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(raw);
}
async function generateVoiceover(script, persona, jobId, voiceOverride) {
  const fetch = (await import('node-fetch')).default;
  const fs = (await import('fs')).default;
  const audioPath = `/tmp/voice_${jobId}_${Date.now()}.mp3`;

  if (process.env.OPENAI_API_KEY) {
    const voices = { ugc: 'nova', testimonial: 'shimmer', demo: 'onyx', influencer: 'alloy', educator: 'echo' };
    const voice = voiceOverride || voices[persona] || 'nova';
    console.log(`🎙 Voice: ${voice} (${voiceOverride ? 'user selected' : 'persona default'})`);
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1-hd', input: script.slice(0, 4096), voice, speed: 0.95 }),
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
      console.log(`🎬 Pexels: matching scene "${prompt.slice(0, 80)}..."`);

      // ── Build a ranked list of search queries from MOST to LEAST specific ──
      const stopWords = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','during','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','need','this','that','these','those','very','really','just','also']);
      const genericVisualWords = new Set(['close','closeup','quick','showing','style','split','screen','side','camera','shot','shots','view','cuts','cut','angle','frame','footage']);

      const cleaned = prompt.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const allWords = cleaned.split(' ').filter(w => w.length > 2 && !stopWords.has(w));
      const specificWords = allWords.filter(w => !genericVisualWords.has(w));

      // Strategy 1: first 4-5 specific content words in original order (preserves scene meaning)
      const primaryQuery = specificWords.slice(0, 5).join(' ');
      // Strategy 2: first 3 words — narrower, still specific
      const secondaryQuery = specificWords.slice(0, 3).join(' ');
      // Strategy 3: just the most distinctive single word (usually a noun further into the phrase)
      const tertiaryQuery = specificWords.slice(0, 1).join(' ');

      const queryAttempts = [primaryQuery, secondaryQuery, tertiaryQuery].filter(q => q && q.length > 2);

      let matchedVideo = null;
      let matchedQuery = null;

      for (const query of queryAttempts) {
        console.log(`   trying Pexels query: "${query}"`);
        const res = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=8&min_duration=3&max_duration=15`,
          { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
        );
        if (!res.ok) {
          console.warn(`   Pexels ${res.status} for "${query}"`);
          continue;
        }
        const data = await res.json();
        const videos = data.videos || [];
        if (videos.length > 0) {
          // Use Pexels' top-ranked result (their relevance algorithm) instead of
          // a random pick — reduces inconsistency across repeated generations
          // of the same script.
          matchedVideo = videos[0];
          matchedQuery = query;
          break;
        }
        console.warn(`   no results for "${query}", trying broader query...`);
      }

      if (matchedVideo) {
        const files = matchedVideo.video_files || [];
        const hd = files.find(f => f.quality === 'hd' && f.width >= 720) ||
                   files.find(f => f.quality === 'sd') ||
                   files[0];
        if (hd?.link) {
          console.log(`✅ Pexels match for "${matchedQuery}": ${hd.width}x${hd.height} ${hd.quality} — ${matchedVideo.duration}s`);
          return hd.link;
        }
      }

      // Last resort: broaden by dropping to just 2 most distinctive words (still scene-derived, not random)
      if (specificWords.length > 0) {
        const broadQuery = specificWords.slice(0, 2).join(' ') || specificWords[0];
        console.log(`   final attempt with broadened scene query: "${broadQuery}"`);
        const broadRes = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(broadQuery)}&orientation=portrait&per_page=10`,
          { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
        );
        if (broadRes.ok) {
          const broadData = await broadRes.json();
          const vids = broadData.videos || [];
          if (vids.length > 0) {
            const vid = vids[0];
            const file = vid.video_files?.find(f => f.quality === 'hd') || vid.video_files?.[0];
            if (file?.link) {
              console.log(`✅ Broadened scene match for "${broadQuery}": ${file.width}x${file.height}`);
              return file.link;
            }
          }
        }
      }

      console.warn(`⚠ Pexels: no footage found for scene: "${prompt.slice(0,60)}..." — scene will be marked failed, not silently replaced with unrelated stock footage`);
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

// ── Upload + generate a temporary signed URL (works even with a private bucket) ──
// Used for YouTube publishing: the video only needs to be fetchable by Google's
// servers for the duration of the upload, so a presigned URL avoids needing to
// expose the entire R2 bucket publicly.
async function uploadToR2AndSign(localPath, key, expiresInSeconds = 3600) {
  try {
    const { S3Client, PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const fs = await import('fs');
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
    });
    const body = fs.default.readFileSync(localPath);
    await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: body, ContentType: 'video/mp4' }));
    const signedUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }),
      { expiresIn: expiresInSeconds }
    );
    return signedUrl;
  } catch (e) {
    console.warn('R2 signed upload failed:', e.message);
    return null;
  }
}
// ── FFmpeg video assembly ─────────────────────────────────────────────────────
async function assembleVideo(clips, audioPath, jobId) {
  // Try ffmpeg-static first (npm bundled binary - no system install needed)
  let ffmpegBin = null;
  try {
    const ffmpegStatic = await import('ffmpeg-static');
    ffmpegBin = ffmpegStatic.default || ffmpegStatic;
    console.log(`✅ ffmpeg-static found: ${ffmpegBin}`);
  } catch(e) {
    console.log('ffmpeg-static not available, trying system ffmpeg...');
  }
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const fs = (await import('fs')).default;
    const fetch = (await import('node-fetch')).default;
    const path = (await import('path')).default;

    const tmpDir = `/tmp/job_${jobId}`;
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // Set ffmpeg path
    let ffmpegCmd = ffmpegBin || 'ffmpeg';
    try { 
      const { stdout } = await execAsync(`${ffmpegCmd} -version`);
      console.log('✅ FFmpeg ready:', ffmpegCmd);
    } catch(e) {
      // Try system paths
      for (const p of ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg']) {
        try { await execAsync(`${p} -version`); ffmpegCmd = p; break; } catch {}
      }
      try { await execAsync(`${ffmpegCmd} -version`); }
      catch(e2) {
        console.warn('FFmpeg not available anywhere — skipping assembly');
        return clips.find(c => c.videoUrl)?.videoUrl || null;
      }
    }

    // Download each clip
    const clipPaths = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (!clip.videoUrl || clip.status !== 'success') continue;
      try {
        const res = await fetch(clip.videoUrl);
        if (!res.ok) continue;
        const buffer = await res.buffer();
        const clipPath = path.join(tmpDir, `clip_${i}.mp4`);
        fs.writeFileSync(clipPath, buffer);
        clipPaths.push(clipPath);
        console.log(`✅ Downloaded clip ${i+1}: ${(buffer.length/1024/1024).toFixed(1)}MB`);
      } catch(e) { console.warn(`Clip ${i+1} download failed:`, e.message); }
    }

    if (clipPaths.length === 0) return null;

    const outputPath = path.join(tmpDir, 'final.mp4');

    if (clipPaths.length === 1 && audioPath && fs.existsSync(audioPath)) {
      await execAsync(`${ffmpegCmd} -y -i "${clipPaths[0]}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}"`);
    } else if (clipPaths.length === 1) {
      fs.copyFileSync(clipPaths[0], outputPath);
    } else {
      const concatFile = path.join(tmpDir, 'concat.txt');
      fs.writeFileSync(concatFile, clipPaths.map(p => `file '${p}'`).join(String.fromCharCode(10)));
      const concatPath = path.join(tmpDir, 'concat.mp4');
      await execAsync(`${ffmpegCmd} -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset fast -crf 23 "${concatPath}"`);
      if (audioPath && fs.existsSync(audioPath)) {
        await execAsync(`${ffmpegCmd} -y -i "${concatPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}"`);
      } else {
        fs.copyFileSync(concatPath, outputPath);
      }
    }

    if (!fs.existsSync(outputPath)) return clips.find(c => c.videoUrl)?.videoUrl || null;
    console.log(`✅ Final video assembled: ${(fs.statSync(outputPath).size/1024/1024).toFixed(1)}MB`);
    return outputPath;
  } catch(e) {
    console.warn('Assembly failed:', e.message);
    return clips.find(c => c.videoUrl)?.videoUrl || null;
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
        audioPath = await generateVoiceover(script.fullScript, persona, jobId, params.voice);
        await updateJob(jobId, { progress: 50, step: 'Voiceover ready — generating video scenes...' });
      } catch (e) {
        console.warn('Voiceover failed:', e.message);
        await updateJob(jobId, { step: `Voiceover failed (${e.message.slice(0,60)}) — generating video scenes...` });
      }
    } else {
      await updateJob(jobId, { step: 'No voiceover key — generating video scenes...' });
    }

    await updateJob(jobId, {
      progress: 90,
      step: '✅ Script + voiceover ready — pick scenes from your script below to generate clips',
    });

    // Convert audio to base64 for frontend access
    let audioBase64 = null;
    if (audioPath) {
      try {
        const fs = (await import('fs')).default;
        if (fs.existsSync(audioPath)) {
          const audioBuf = fs.readFileSync(audioPath);
          if (audioBuf.length < 5 * 1024 * 1024) { // Only if under 5MB
            audioBase64 = `data:audio/mpeg;base64,${audioBuf.toString('base64')}`;
            console.log(`✅ Audio converted to base64: ${(audioBuf.length/1024).toFixed(0)}KB`);
          }
        }
      } catch(e) { console.warn('Audio base64 failed:', e.message); }
    }

    await updateJob(jobId, {
      status: 'completed',
      progress: 100,
      step: '✅ Script + voiceover ready — pick scenes from your script to generate clips.',
      result: {
        script,
        clips: [],
        finalVideoUrl: null,
        audioPath,
        audioBase64,
        audioUrl: audioBase64 ? audioBase64 : `/api/video/audio/${jobId}`,
        hasAudio: !!audioPath,
        clipsCount: 0,
      },
    });

    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
      try {
        const { sendVideoCompleteEmail } = await import('./services/emailService.js');
        await sendVideoCompleteEmail({ jobId, script, clipUrl: null, topic: topic || url, persona, duration, platforms });
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

// ── Video assembly endpoint ───────────────────────────────────────────────────
app.post('/api/video/assemble', async (req, res) => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const fs   = (await import('fs')).default;
    const fetch = (await import('node-fetch')).default;
    const path  = (await import('path')).default;

    const { clipUrls, audioUrl, jobId, aspectRatio = '9:16', music, captions, captionText, captionStyle = 'bottom' } = req.body;
    if (!clipUrls?.length) return res.status(400).json({ error: 'clipUrls required' });

    const tmpDir = `/tmp/assemble_${jobId || Date.now()}`;
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // ── Find FFmpeg ────────────────────────────────────────────────────────────
    let ffmpegPath = 'ffmpeg';
    try {
      const ffmpegStatic = await import('ffmpeg-static');
      const p = ffmpegStatic.default || ffmpegStatic;
      if (p) { ffmpegPath = p; console.log(`✅ ffmpeg-static: ${ffmpegPath}`); }
    } catch {}
    try { await execAsync(`"${ffmpegPath}" -version`); }
    catch(e) { return res.status(500).json({ error: 'FFmpeg not available' }); }

    // ── Aspect ratio dimensions ────────────────────────────────────────────────
    const ratioMap = {
      '9:16':  { w: 720,  h: 1280, label: 'Vertical (TikTok/Reels)' },
      '16:9':  { w: 1280, h: 720,  label: 'Landscape (YouTube)' },
      '1:1':   { w: 720,  h: 720,  label: 'Square (Instagram Feed)' },
      '4:5':   { w: 720,  h: 900,  label: 'Portrait (Instagram)' },
      '4:3':   { w: 960,  h: 720,  label: 'Standard' },
    };
    const dim = ratioMap[aspectRatio] || ratioMap['9:16'];
    const { w, h } = dim;
    console.log(`🎬 Assembling ${clipUrls.length} clips at ${w}x${h} (${aspectRatio})`);

    // ── Download and normalize all clips to same size ─────────────────────────
    const clipPaths = [];
    for (let i = 0; i < clipUrls.length; i++) {
      try {
        const r = await fetch(clipUrls[i]);
        if (!r.ok) { console.warn(`Clip ${i} fetch failed: ${r.status}`); continue; }
        const buf = await r.buffer();
        const rawPath = path.join(tmpDir, `raw_${i}.mp4`);
        fs.writeFileSync(rawPath, buf);

        // Re-encode to exact target size with padding to preserve aspect ratio
        const normPath = path.join(tmpDir, `clip_${i}.mp4`);
        const scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`;
        await execAsync(`"${ffmpegPath}" -y -i "${rawPath}" -vf "${scaleFilter}" -c:v libx264 -preset ultrafast -crf 26 -r 24 -an -t 7 "${normPath}"`);

        if (fs.existsSync(normPath)) {
          clipPaths.push(normPath);
          console.log(`✅ Clip ${i+1} normalized to ${w}x${h}: ${(buf.length/1024/1024).toFixed(1)}MB`);
        }
      } catch(e) { console.warn(`Clip ${i} error:`, e.message); }
    }

    if (clipPaths.length === 0) return res.status(500).json({ error: 'No clips could be processed' });

    // ── Download audio ─────────────────────────────────────────────────────────
    let audioPath = null;
    if (audioUrl) {
      try {
        if (audioUrl.startsWith('data:')) {
          // Base64 audio
          const base64Data = audioUrl.split(',')[1];
          if (base64Data) {
            audioPath = path.join(tmpDir, 'voice.mp3');
            fs.writeFileSync(audioPath, Buffer.from(base64Data, 'base64'));
            console.log(`✅ Audio from base64: ${(fs.statSync(audioPath).size/1024).toFixed(0)}KB`);
          }
        } else {
          const r = await fetch(audioUrl);
          if (r.ok) {
            const buf = await r.buffer();
            audioPath = path.join(tmpDir, 'voice.mp3');
            fs.writeFileSync(audioPath, buf);
            console.log(`✅ Audio downloaded: ${(buf.length/1024).toFixed(0)}KB`);
          }
        }
      } catch(e) { console.warn('Audio download failed:', e.message); }
    }

    // ── Download background music if provided ────────────────────────────────
    let musicPath = null;
    if (music && music !== 'none') {
      const musicUrls = {
        'upbeat':       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'calm':         'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'motivational': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        'corporate':    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      };
      const musicUrl = musicUrls[music];
      if (musicUrl) {
        try {
          const r = await fetch(musicUrl);
          if (r.ok) {
            const buf = await r.buffer();
            musicPath = path.join(tmpDir, 'music.mp3');
            fs.writeFileSync(musicPath, buf);
            console.log(`✅ Music downloaded: ${music}`);
          }
        } catch(e) { console.warn('Music download failed:', e.message); }
      }
    }

    const concatPath = path.join(tmpDir, 'concat.mp4');
    const outputPath = path.join(tmpDir, 'final.mp4');

    // ── Concatenate clips ─────────────────────────────────────────────────────
    if (clipPaths.length === 1) {
      fs.copyFileSync(clipPaths[0], concatPath);
    } else {
      const concatFile = path.join(tmpDir, 'list.txt');
      const concatLines = clipPaths.map(p => "file '" + p + "'"); fs.writeFileSync(concatFile, concatLines.join('\n'));
      await execAsync(`"${ffmpegPath}" -y -f concat -safe 0 -i "${concatFile}" -c copy "${concatPath}"`);
    }
    console.log('✅ Clips concatenated');

    // ── Mix audio: voiceover + optional background music ─────────────────────
    // Get audio duration to loop video to match
    let audioDuration = 0;
    if (audioPath && fs.existsSync(audioPath)) {
      try {
        const { stdout: probOut } = await execAsync(`"${ffmpegPath}" -i "${audioPath}" 2>&1 | grep Duration || true`);
        const match = probOut.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        if (match) {
          audioDuration = parseInt(match[1])*3600 + parseInt(match[2])*60 + parseFloat(match[3]);
          console.log(`✅ Audio duration: ${audioDuration.toFixed(1)}s`);
        }
      } catch(e) { console.warn('Could not get audio duration:', e.message); }
    }

    // Loop video to match audio duration if audio is longer
    let videoForMix = concatPath;
    if (audioDuration > 0) {
      const loopedPath = path.join(tmpDir, 'looped.mp4');
      try {
        // Stream_loop -1 loops indefinitely, -t cuts at audio duration
        await execAsync(`"${ffmpegPath}" -y -stream_loop -1 -i "${concatPath}" -c:v libx264 -preset ultrafast -crf 26 -t ${audioDuration + 1} "${loopedPath}"`);
        if (fs.existsSync(loopedPath)) {
          videoForMix = loopedPath;
          console.log(`✅ Video looped to ${audioDuration.toFixed(1)}s to match voiceover`);
        }
      } catch(e) { console.warn('Video loop failed, using original:', e.message); }
    }

    if (audioPath && musicPath) {
      const mixedAudio = path.join(tmpDir, 'mixed.mp3');
      await execAsync(`"${ffmpegPath}" -y -i "${audioPath}" -i "${musicPath}" -filter_complex "[0:a]volume=1.0[v];[1:a]volume=0.30[m];[v][m]amix=inputs=2:duration=first" "${mixedAudio}"`);
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${mixedAudio}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "${outputPath}"`);
    } else if (audioPath) {
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "${outputPath}"`);
    } else if (musicPath) {
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${musicPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "${outputPath}"`);
    } else {
      fs.copyFileSync(videoForMix, outputPath);
    }
    console.log('✅ Audio mixed');

    if (!fs.existsSync(outputPath)) return res.status(500).json({ error: 'Assembly failed' });

    // ── Burn in captions if requested ────────────────────────────────────────
    let finalPath = outputPath;
    if (captions && captionText) {
      try {
        const srtPath = path.join(tmpDir, 'captions.srt');
        const words = captionText.trim().split(/\s+/);
        const wordsPerChunk = 4;
        const totalDuration = audioDuration > 0 ? audioDuration : 20;
        const chunks = [];
        for (let i = 0; i < words.length; i += wordsPerChunk) {
          chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
        }
        const perChunk = totalDuration / Math.max(chunks.length, 1);

        function toSRTTime(sec) {
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = Math.floor(sec % 60);
          const ms = Math.round((sec - Math.floor(sec)) * 1000);
          const pad = (n, len) => String(n).padStart(len, '0');
          return `${pad(h,2)}:${pad(m,2)}:${pad(s,2)},${pad(ms,3)}`;
        }

        let srt = '';
        chunks.forEach((chunk, i) => {
          const start = i * perChunk;
          const end = (i + 1) * perChunk;
          srt += `${i+1}\n${toSRTTime(start)} --> ${toSRTTime(end)}\n${chunk}\n\n`;
        });
        fs.writeFileSync(srtPath, srt);

        const fontsDir = await getFontsDir();
        const styleString = buildCaptionStyle({
          customStyling: !!req.body.customCaptionStyling,
          captionFont: req.body.captionFont,
          fontSize: req.body.captionFontSize,
          textColor: req.body.captionTextColor,
          backgroundColor: req.body.captionBackgroundColor,
          captionStyle,
        });
        const captionedPath = path.join(tmpDir, 'captioned.mp4');
        const srtEscaped = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
        const fontsDirEscaped = fontsDir.replace(/\\/g, '/').replace(/:/g, '\\:');
        await execAsync(`"${ffmpegPath}" -y -i "${outputPath}" -vf "subtitles='${srtEscaped}':fontsdir='${fontsDirEscaped}':force_style='${styleString}'" -c:a copy "${captionedPath}"`);
        if (fs.existsSync(captionedPath) && fs.statSync(captionedPath).size > 0) {
          finalPath = captionedPath;
          console.log('✅ Captions burned in (' + captionStyle + ')');
        } else {
          console.warn('Caption burn produced no output, using uncaptioned video');
        }
      } catch(e) {
        console.warn('Caption burn-in failed, continuing without captions:', e.message);
      }
    }

    const stat = fs.statSync(finalPath);
    console.log(`✅ Assembly complete: ${(stat.size/1024/1024).toFixed(1)}MB at ${w}x${h}${captions ? ' with captions' : ''}`);

    // Stream back
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="contentforge-video.mp4"');
    res.setHeader('Content-Length', stat.size);
    const stream = fs.createReadStream(finalPath);
    stream.pipe(res);
    stream.on('end', () => { try { fs.rmSync(tmpDir, { recursive: true }); } catch {} });

  } catch(e) {
    console.error('Assembly error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/video/publish-youtube', async (req, res) => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const fs   = (await import('fs')).default;
    const fetch = (await import('node-fetch')).default;
    const path  = (await import('path')).default;

    const {
      clipUrls, audioUrl, jobId, aspectRatio = '9:16', music, captions, captionText, captionStyle = 'bottom',
      title, description = '', privacy = 'unlisted', isShort,
    } = req.body;
    if (!clipUrls?.length) return res.status(400).json({ error: 'clipUrls required' });
    if (!title || !title.trim()) return res.status(400).json({ error: 'title is required to publish to YouTube' });

    const tmpDir = `/tmp/assemble_${jobId || Date.now()}`;
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // ── Find FFmpeg ────────────────────────────────────────────────────────────
    let ffmpegPath = 'ffmpeg';
    try {
      const ffmpegStatic = await import('ffmpeg-static');
      const p = ffmpegStatic.default || ffmpegStatic;
      if (p) { ffmpegPath = p; console.log(`✅ ffmpeg-static: ${ffmpegPath}`); }
    } catch {}
    try { await execAsync(`"${ffmpegPath}" -version`); }
    catch(e) { return res.status(500).json({ error: 'FFmpeg not available' }); }

    // ── Aspect ratio dimensions ────────────────────────────────────────────────
    const ratioMap = {
      '9:16':  { w: 720,  h: 1280, label: 'Vertical (TikTok/Reels)' },
      '16:9':  { w: 1280, h: 720,  label: 'Landscape (YouTube)' },
      '1:1':   { w: 720,  h: 720,  label: 'Square (Instagram Feed)' },
      '4:5':   { w: 720,  h: 900,  label: 'Portrait (Instagram)' },
      '4:3':   { w: 960,  h: 720,  label: 'Standard' },
    };
    const dim = ratioMap[aspectRatio] || ratioMap['9:16'];
    const { w, h } = dim;
    console.log(`🎬 Assembling ${clipUrls.length} clips at ${w}x${h} (${aspectRatio})`);

    // ── Download and normalize all clips to same size ─────────────────────────
    const clipPaths = [];
    for (let i = 0; i < clipUrls.length; i++) {
      try {
        const r = await fetch(clipUrls[i]);
        if (!r.ok) { console.warn(`Clip ${i} fetch failed: ${r.status}`); continue; }
        const buf = await r.buffer();
        const rawPath = path.join(tmpDir, `raw_${i}.mp4`);
        fs.writeFileSync(rawPath, buf);

        // Re-encode to exact target size with padding to preserve aspect ratio
        const normPath = path.join(tmpDir, `clip_${i}.mp4`);
        const scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`;
        await execAsync(`"${ffmpegPath}" -y -i "${rawPath}" -vf "${scaleFilter}" -c:v libx264 -preset ultrafast -crf 26 -r 24 -an -t 7 "${normPath}"`);

        if (fs.existsSync(normPath)) {
          clipPaths.push(normPath);
          console.log(`✅ Clip ${i+1} normalized to ${w}x${h}: ${(buf.length/1024/1024).toFixed(1)}MB`);
        }
      } catch(e) { console.warn(`Clip ${i} error:`, e.message); }
    }

    if (clipPaths.length === 0) return res.status(500).json({ error: 'No clips could be processed' });

    // ── Download audio ─────────────────────────────────────────────────────────
    let audioPath = null;
    if (audioUrl) {
      try {
        if (audioUrl.startsWith('data:')) {
          // Base64 audio
          const base64Data = audioUrl.split(',')[1];
          if (base64Data) {
            audioPath = path.join(tmpDir, 'voice.mp3');
            fs.writeFileSync(audioPath, Buffer.from(base64Data, 'base64'));
            console.log(`✅ Audio from base64: ${(fs.statSync(audioPath).size/1024).toFixed(0)}KB`);
          }
        } else {
          const r = await fetch(audioUrl);
          if (r.ok) {
            const buf = await r.buffer();
            audioPath = path.join(tmpDir, 'voice.mp3');
            fs.writeFileSync(audioPath, buf);
            console.log(`✅ Audio downloaded: ${(buf.length/1024).toFixed(0)}KB`);
          }
        }
      } catch(e) { console.warn('Audio download failed:', e.message); }
    }

    // ── Download background music if provided ────────────────────────────────
    let musicPath = null;
    if (music && music !== 'none') {
      const musicUrls = {
        'upbeat':       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'calm':         'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'motivational': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        'corporate':    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      };
      const musicUrl = musicUrls[music];
      if (musicUrl) {
        try {
          const r = await fetch(musicUrl);
          if (r.ok) {
            const buf = await r.buffer();
            musicPath = path.join(tmpDir, 'music.mp3');
            fs.writeFileSync(musicPath, buf);
            console.log(`✅ Music downloaded: ${music}`);
          }
        } catch(e) { console.warn('Music download failed:', e.message); }
      }
    }

    const concatPath = path.join(tmpDir, 'concat.mp4');
    const outputPath = path.join(tmpDir, 'final.mp4');

    // ── Concatenate clips ─────────────────────────────────────────────────────
    if (clipPaths.length === 1) {
      fs.copyFileSync(clipPaths[0], concatPath);
    } else {
      const concatFile = path.join(tmpDir, 'list.txt');
      const concatLines = clipPaths.map(p => "file '" + p + "'"); fs.writeFileSync(concatFile, concatLines.join('\n'));
      await execAsync(`"${ffmpegPath}" -y -f concat -safe 0 -i "${concatFile}" -c copy "${concatPath}"`);
    }
    console.log('✅ Clips concatenated');

    // ── Mix audio: voiceover + optional background music ─────────────────────
    // Get audio duration to loop video to match
    let audioDuration = 0;
    if (audioPath && fs.existsSync(audioPath)) {
      try {
        const { stdout: probOut } = await execAsync(`"${ffmpegPath}" -i "${audioPath}" 2>&1 | grep Duration || true`);
        const match = probOut.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        if (match) {
          audioDuration = parseInt(match[1])*3600 + parseInt(match[2])*60 + parseFloat(match[3]);
          console.log(`✅ Audio duration: ${audioDuration.toFixed(1)}s`);
        }
      } catch(e) { console.warn('Could not get audio duration:', e.message); }
    }

    // Loop video to match audio duration if audio is longer
    let videoForMix = concatPath;
    if (audioDuration > 0) {
      const loopedPath = path.join(tmpDir, 'looped.mp4');
      try {
        // Stream_loop -1 loops indefinitely, -t cuts at audio duration
        await execAsync(`"${ffmpegPath}" -y -stream_loop -1 -i "${concatPath}" -c:v libx264 -preset ultrafast -crf 26 -t ${audioDuration + 1} "${loopedPath}"`);
        if (fs.existsSync(loopedPath)) {
          videoForMix = loopedPath;
          console.log(`✅ Video looped to ${audioDuration.toFixed(1)}s to match voiceover`);
        }
      } catch(e) { console.warn('Video loop failed, using original:', e.message); }
    }

    if (audioPath && musicPath) {
      const mixedAudio = path.join(tmpDir, 'mixed.mp3');
      await execAsync(`"${ffmpegPath}" -y -i "${audioPath}" -i "${musicPath}" -filter_complex "[0:a]volume=1.0[v];[1:a]volume=0.15[m];[v][m]amix=inputs=2:duration=first" "${mixedAudio}"`);
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${mixedAudio}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "${outputPath}"`);
    } else if (audioPath) {
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "${outputPath}"`);
    } else if (musicPath) {
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${musicPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "${outputPath}"`);
    } else {
      fs.copyFileSync(videoForMix, outputPath);
    }
    console.log('✅ Audio mixed');

    if (!fs.existsSync(outputPath)) return res.status(500).json({ error: 'Assembly failed' });

    // ── Burn in captions if requested ────────────────────────────────────────
    let finalPath = outputPath;
    if (captions && captionText) {
      try {
        const srtPath = path.join(tmpDir, 'captions.srt');
        const words = captionText.trim().split(/\s+/);
        const wordsPerChunk = 4;
        const totalDuration = audioDuration > 0 ? audioDuration : 20;
        const chunks = [];
        for (let i = 0; i < words.length; i += wordsPerChunk) {
          chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
        }
        const perChunk = totalDuration / Math.max(chunks.length, 1);

        function toSRTTime(sec) {
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = Math.floor(sec % 60);
          const ms = Math.round((sec - Math.floor(sec)) * 1000);
          const pad = (n, len) => String(n).padStart(len, '0');
          return `${pad(h,2)}:${pad(m,2)}:${pad(s,2)},${pad(ms,3)}`;
        }

        let srt = '';
        chunks.forEach((chunk, i) => {
          const start = i * perChunk;
          const end = (i + 1) * perChunk;
          srt += `${i+1}\n${toSRTTime(start)} --> ${toSRTTime(end)}\n${chunk}\n\n`;
        });
        fs.writeFileSync(srtPath, srt);

        const fontsDir = await getFontsDir();
        const styleString = buildCaptionStyle({
          customStyling: !!req.body.customCaptionStyling,
          captionFont: req.body.captionFont,
          fontSize: req.body.captionFontSize,
          textColor: req.body.captionTextColor,
          backgroundColor: req.body.captionBackgroundColor,
          captionStyle,
        });
        const captionedPath = path.join(tmpDir, 'captioned.mp4');
        const srtEscaped = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
        const fontsDirEscaped = fontsDir.replace(/\\/g, '/').replace(/:/g, '\\:');
        await execAsync(`"${ffmpegPath}" -y -i "${outputPath}" -vf "subtitles='${srtEscaped}':fontsdir='${fontsDirEscaped}':force_style='${styleString}'" -c:a copy "${captionedPath}"`);
        if (fs.existsSync(captionedPath) && fs.statSync(captionedPath).size > 0) {
          finalPath = captionedPath;
          console.log('✅ Captions burned in (' + captionStyle + ')');
        } else {
          console.warn('Caption burn produced no output, using uncaptioned video');
        }
      } catch(e) {
        console.warn('Caption burn-in failed, continuing without captions:', e.message);
      }
    }

    const stat = fs.statSync(finalPath);
    console.log(`✅ Assembly complete: ${(stat.size/1024/1024).toFixed(1)}MB at ${w}x${h}${captions ? ' with captions' : ''}`);

    // ── Upload finished video to R2 and get a temporary signed URL YouTube can fetch ──
    // (Uses a presigned URL rather than the bucket's public dev URL, since the
    // bucket's public access is disabled and we don't want to expose it just for this.)
    if (!process.env.R2_BUCKET_NAME) {
      try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
      return res.status(500).json({ error: 'R2_BUCKET_NAME not configured — cannot publish to YouTube without persistent storage' });
    }
    const r2Key = `youtube-publish/${jobId || Date.now()}.mp4`;
    const r2Url = await uploadToR2AndSign(finalPath, r2Key, 3600);
    if (!r2Url) {
      try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
      return res.status(500).json({ error: 'R2 upload failed — see server logs for details' });
    }
    console.log(`✅ Uploaded to R2 with signed URL for YouTube publish (expires in 1 hour)`);

    // ── Determine Short vs long-form ───────────────────────────────────────────
    // isShort may be explicitly passed by the caller; otherwise infer from
    // aspect ratio + duration, since YouTube Shorts are vertical and under 60s.
    const inferredShort = (aspectRatio === '9:16') && (audioDuration > 0 ? audioDuration <= 60 : true);
    const publishAsShort = (typeof isShort === 'boolean') ? isShort : inferredShort;

    // ── Publish to YouTube using the real, already-working service functions ──
    let ytResult;
    try {
      const { uploadVideoToYouTube, uploadYouTubeShort } = await import('./services/youtubeService.js');
      if (publishAsShort) {
        ytResult = await uploadYouTubeShort({ videoUrl: r2Url, title: title.trim(), description, tags: [], privacy });
      } else {
        ytResult = await uploadVideoToYouTube({ videoUrl: r2Url, title: title.trim(), description, tags: [], privacy });
      }
    } catch (e) {
      try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
      return res.status(500).json({ error: 'YouTube publish failed: ' + e.message });
    }

    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}

    res.json({
      success: true,
      youtubeUrl: ytResult.url,
      videoId: ytResult.videoId,
      isShort: publishAsShort,
    });

  } catch(e) {
    console.error('YouTube publish error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Serve audio file by jobId ─────────────────────────────────────────────────
app.get('/api/video/audio/:jobId', async (req, res) => {
  try {
    const fs = (await import('fs')).default;
    const job = await getJob(req.params.jobId);
    if (!job?.result?.audioPath) return res.status(404).json({ error: 'No audio for this job' });
    const audioPath = job.result.audioPath;
    if (!fs.existsSync(audioPath)) return res.status(404).json({ error: 'Audio file not found on server' });
    const stat = fs.statSync(audioPath);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', 'inline; filename="voiceover.mp3"');
    fs.createReadStream(audioPath).pipe(res);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Convert a standard web hex color (#RRGGBB) to libass/ASS format (&HBBGGRR&) ──
function hexToAssColor(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return null;
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `&H${b}${g}${r}&`;
}

const CAPTION_FONTS = {
  'default':    'Roboto-Regular.ttf',
  'roboto':     'Roboto-Regular.ttf',
  'montserrat': 'Montserrat-Regular.ttf',
  'montserrat-bold': 'Montserrat-Bold.ttf',
  'anton':      'Anton-Regular.ttf',
};

const CAPTION_FONT_FAMILY_NAMES = {
  'default':    'Roboto',
  'roboto':     'Roboto',
  'montserrat': 'Montserrat',
  'montserrat-bold': 'Montserrat',
  'anton':      'Anton',
};

function buildCaptionStyle({ customStyling, captionFont, fontSize, textColor, backgroundColor, captionStyle }) {
  const vAlign = captionStyle === 'top' ? 'Alignment=6,MarginV=40' :
                 captionStyle === 'middle' ? 'Alignment=10' :
                 'Alignment=2,MarginV=40';

  if (!customStyling) {
    return `FontName=Arial,FontSize=22,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=1,Outline=2,Bold=1,${vAlign}`;
  }

  const fontKey = CAPTION_FONTS[captionFont] ? captionFont : 'default';
  const fontFamily = CAPTION_FONT_FAMILY_NAMES[fontKey] || 'Roboto';
  const size = (typeof fontSize === 'number' && fontSize > 0) ? fontSize : 28;
  const primaryColour = hexToAssColor(textColor) || '&HFFFFFF&';

  const parts = [
    `FontName=${fontFamily}`,
    `FontSize=${size}`,
    `PrimaryColour=${primaryColour}`,
    'Bold=1',
    vAlign,
  ];

  if (backgroundColor) {
    const backColour = hexToAssColor(backgroundColor) || '&H000000&';
    parts.push(`BackColour=&H80${backColour.replace('&H', '').replace('&', '')}`);
    parts.push('BorderStyle=4');
    parts.push('Outline=4');
    parts.push('Shadow=0');
  } else {
    parts.push('OutlineColour=&H000000');
    parts.push('BorderStyle=1');
    parts.push('Outline=2');
  }

  return parts.join(',');
}

async function getFontsDir() {
  const path = (await import('path')).default;
  return path.join(process.cwd(), 'fonts');
}function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

// ── Pexels search proxy (browser can't call Pexels directly) ─────────────────
app.get('/api/pexels/search', async (req, res) => {
  if (!process.env.PEXELS_API_KEY) return res.status(400).json({ error: 'PEXELS_API_KEY not configured' });
  try {
    const fetch = (await import('node-fetch')).default;
    const q = req.query.q || 'lifestyle';
    const count = Math.min(parseInt(req.query.count) || 6, 15);
    const r = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=${count}&size=medium`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    if (!r.ok) return res.status(r.status).json({ error: `Pexels ${r.status}` });
    const data = await r.json();
    const videos = (data.videos || []).map(v => {
      const file = v.video_files?.find(f => f.quality === 'hd' && f.width >= 720) ||
                   v.video_files?.find(f => f.quality === 'sd') ||
                   v.video_files?.[0];
      return {
        id:       v.id,
        url:      file?.link,
        thumb:    v.image,
        duration: v.duration,
        quality:  file?.quality || 'sd',
        width:    file?.width,
        height:   file?.height,
      };
    }).filter(v => v.url);
    res.json({ videos, total: data.total_results });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Voice options endpoint ───────────────────────────────────────────────────
app.get('/api/voice/options', (_req, res) => {
  res.json({
    voices: [
      // Female voices
      { id:'nova',    label:'Nova',    gender:'Female', style:'Warm & friendly',    sample:'Great for UGC and lifestyle content' },
      { id:'shimmer', label:'Shimmer', gender:'Female', style:'Clear & professional',sample:'Great for educational and VSL content' },
      { id:'alloy',   label:'Alloy',   gender:'Female', style:'Versatile & neutral', sample:'Great for any content type' },
      // Male voices
      { id:'onyx',    label:'Onyx',    gender:'Male',   style:'Deep & authoritative',sample:'Great for product demos and commercials' },
      { id:'echo',    label:'Echo',    gender:'Male',   style:'Confident & clear',   sample:'Great for tutorials and reviews' },
      { id:'fable',   label:'Fable',   gender:'Male',   style:'Expressive & warm',   sample:'Great for storytelling content' },
    ]
  });
});

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

// ── Generate clips from user-selected phrases (no scene cap, no Claude-invented visuals) ──
app.post('/api/video/clips-from-phrases', async (req, res) => {
  if (!process.env.PEXELS_API_KEY) return res.status(500).json({ error: 'PEXELS_API_KEY not configured' });
  const { phrases, jobId } = req.body;
  if (!Array.isArray(phrases) || phrases.length === 0) {
    return res.status(400).json({ error: 'phrases must be a non-empty array of strings' });
  }
  if (phrases.some(p => typeof p !== 'string' || !p.trim())) {
    return res.status(400).json({ error: 'each phrase must be a non-empty string' });
  }

  try {
    const clips = [];
    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i].trim();
      console.log(`🎬 Scene ${i + 1}/${phrases.length} from selected phrase: "${phrase.slice(0, 80)}"`);
      try {
        const videoUrl = await generateClip(phrase, 5);
        clips.push({ scene: i + 1, phrase, status: videoUrl ? 'success' : 'failed', videoUrl: videoUrl || null });
      } catch (e) {
        console.warn(`Scene ${i + 1} failed:`, e.message);
        clips.push({ scene: i + 1, phrase, status: 'failed', videoUrl: null, error: e.message });
      }
    }

    const successCount = clips.filter(c => c.status === 'success').length;
    console.log(`✅ Phrase-based clips: ${successCount}/${phrases.length} matched`);

    if (jobId) {
      try { await updateJob(jobId, { phraseClips: clips }); } catch (e) { console.warn('Job update failed:', e.message); }
    }

    res.json({ clips, total: phrases.length, matched: successCount });
  } catch (e) {
    console.error('clips-from-phrases error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Ask Claude for a short, literal, stock-footage-searchable keyword
// phrase that captures the MAIN VISUAL SUBJECT of a single sentence.
async function suggestSceneKeyword(sentence) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Here is one sentence from a video script:
"${sentence}"

In 3-5 words, describe the MAIN VISUAL SUBJECT of this sentence — what a stock video library search should look for. Be literal and concrete: subject + setting/action. Examples of good output: "elderly woman baking pie", "man typing laptop office", "woman jogging park morning".

Reply with ONLY the 3-5 word phrase. No punctuation, no quotes, no explanation.`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 30,
    system: 'You extract short, literal, stock-footage-searchable keyword phrases. Reply with only the phrase, nothing else.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].text.trim();
  return raw.replace(/^["']|["']$/g, '').replace(/[.!?]+$/, '').trim();
}

// ── Search Pexels videos for a given keyword query, returning the top match.
async function searchPexelsForKeyword(keyword) {
  const fetch = (await import('node-fetch')).default;
  if (!process.env.PEXELS_API_KEY) throw new Error('PEXELS_API_KEY not configured');

  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&orientation=portrait&size=medium&per_page=8&min_duration=3&max_duration=15`,
    { headers: { Authorization: process.env.PEXELS_API_KEY } }
  );
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = await res.json();
  const videos = data.videos || [];
  if (videos.length === 0) return null;

  const top = videos[0];
  const files = top.video_files || [];
  const hd = files.find(f => f.quality === 'hd' && f.width >= 720) ||
             files.find(f => f.quality === 'sd') ||
             files[0];
  if (!hd?.link) return null;

  return {
    videoUrl: hd.link,
    thumb: top.image,
    duration: top.duration,
    width: hd.width,
    height: hd.height,
  };
}

// ── Single endpoint: given one sentence, suggest a keyword AND immediately
// search Pexels with it, returning both.
app.post('/api/video/scene-keyword-match', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  if (!process.env.PEXELS_API_KEY) return res.status(500).json({ error: 'PEXELS_API_KEY not configured' });

  const { sentence, keyword: overrideKeyword } = req.body;
  if (!sentence || !sentence.trim()) return res.status(400).json({ error: 'sentence is required' });

  try {
    const keyword = overrideKeyword && overrideKeyword.trim()
      ? overrideKeyword.trim()
      : await suggestSceneKeyword(sentence.trim());

    console.log(`🔑 Scene keyword for "${sentence.slice(0, 50)}...": "${keyword}"`);

    const match = await searchPexelsForKeyword(keyword);

    res.json({
      keyword,
      matched: !!match,
      videoUrl: match ? match.videoUrl : null,
      thumb: match ? match.thumb : null,
      duration: match ? match.duration : null,
    });
  } catch (e) {
    console.error('scene-keyword-match error:', e.message);
    res.status(500).json({ error: e.message });
  }
});app.post('/api/video/generate', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  const jobId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  await updateJob(jobId, { status: 'queued', progress: 0, step: 'Queued...', data: req.body, createdAt: new Date().toISOString() });
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
  if (process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      await db.from('schedules').upsert({ id, ...schedule });
    } catch(e) { console.warn('Schedule save failed:', e.message); }
  }
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
    const fetch = (await import('node-fetch')).default;
    const { message, link } = req.body;
    const userToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID || '1310272512449356';

    // Step 1: Get page access token from user token
    const pageTokenRes = await fetch(
      `https://graph.facebook.com/v25.0/${pageId}?fields=access_token&access_token=${userToken}`
    );
    const pageTokenData = await pageTokenRes.json();
    
    if (!pageTokenData.access_token) {
      // Fall back to posting with user token directly
      console.warn('No page token, trying user token directly');
      const postRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          link: link || undefined,
          access_token: userToken,
        }),
      });
      const postData = await postRes.json();
      if (postData.error) throw new Error(postData.error.message);
      return res.json({ success: true, postId: postData.id, url: `https://facebook.com/${postData.id}` });
    }

    const pageToken = pageTokenData.access_token;
    console.log('✅ Got page access token');

    // Step 2: Post using page token
    const postRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        link: link || undefined,
        access_token: pageToken,
      }),
    });
    const postData = await postRes.json();
    if (postData.error) throw new Error(postData.error.message);
    res.json({ success: true, postId: postData.id, url: `https://facebook.com/${postData.id}` });
  } catch (e) {
    console.error('Facebook post error:', e.message);
    res.status(500).json({ error: e.message });
  }
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

app.delete('/api/youtube/video/:videoId', async (req, res) => {
  try {
    const { deleteYouTubeVideo } = await import('./services/youtubeService.js');
    res.json(await deleteYouTubeVideo(req.params.videoId));
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
    // Persist to Supabase
    if (process.env.SUPABASE_URL) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        await db.from('landing_pages').upsert({ id, ...page });
      } catch(e) { console.warn('Landing page save failed:', e.message); }
    }
    const pageUrl = `${process.env.FRONTEND_URL || 'https://contentstudiohub.com'}/lp/${id}`;
    console.log(`✅ Landing page created: ${pageUrl}`);
    res.json({ success: true, id, url: pageUrl, page });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/landing/:id', async (req, res) => {
  let page = landingPages.get(req.params.id);
  // Try Supabase if not in memory
  if (!page && process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data } = await db.from('landing_pages').select('*').eq('id', req.params.id).single();
      if (data) { page = data; landingPages.set(data.id, data); }
    } catch(e) {}
  }
  if (!page) return res.status(404).json({ error: 'Landing page not found' });
  res.json(page);
});

app.get('/api/landing', async (_req, res) => {
  let pages = [...landingPages.values()];
  if (process.env.SUPABASE_URL) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data } = await db.from('landing_pages').select('*').order('created_at', { ascending: false }).limit(50);
      if (data && data.length > 0) pages = data;
    } catch(e) {}
  }
  res.json({ pages: pages.sort((a,b) => new Date(b.createdAt||b.created_at)-new Date(a.createdAt||a.created_at)) });
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
