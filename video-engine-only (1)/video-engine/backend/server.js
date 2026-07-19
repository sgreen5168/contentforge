import express from 'express';

// ── FFmpeg path resolver ──────────────────────────────────────────────────────
// Prefers system FFmpeg (installed via Dockerfile) over ffmpeg-static
// System FFmpeg has no sandbox restrictions and supports all codecs + fonts
let FFMPEG_PATH = 'ffmpeg'; // default: system ffmpeg from PATH
try {
  const { execSync } = await import('child_process');
  execSync('ffmpeg -version', { stdio: 'ignore' });
  console.log('✅ System FFmpeg found — using system ffmpeg');
} catch {
  // System FFmpeg not available — fall back to ffmpeg-static
  try {
    const ffmpegStatic = await import('ffmpeg-static');
    FFMPEG_PATH = ffmpegStatic.default || ffmpegStatic;
    console.log(`✅ Using ffmpeg-static: ${FFMPEG_PATH}`);
  } catch {
    console.warn('⚠ No FFmpeg found — video assembly will fail');
  }
}
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
console.log('HEYGEN_API_KEY:', process.env.HEYGEN_API_KEY ? '✅' : '❌');
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
  const { inputMode, topic, url, affiliateUrl, persona, duration, style, platforms, videoType, editedScript, niche, subNiche } = params;
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

  const nicheContext = {
    'make-money-home': {
      label: 'Make Money from Home',
      compliance: 'CRITICAL COMPLIANCE: Do NOT make personal income claims like "I made $X". Do NOT say the viewer will definitely earn money. Present opportunities in an educational, informational, honest way. Use phrases like "here are ways people are earning from home" or "this is what home entrepreneurs are doing" — never first-person unverifiable income claims. Tone must be relaxed, uplifting, professional-casual. Must comply with Facebook, TikTok, and FTC advertising guidelines.',
      tone: 'relaxed, uplifting, honest, educational, professional-casual. Like a knowledgeable friend sharing useful information, not a salesperson making promises.',
    },
    'healthy-eating': {
      label: 'Healthy Eating',
      compliance: 'Do NOT make specific health or weight loss claims. Do NOT promise medical outcomes. Present food ideas as inspiration and options. Encourage professional consultation for health decisions.',
      tone: 'warm, encouraging, practical. Like a friend who genuinely loves healthy food sharing what they enjoy.',
    },
    'fitness-wellness': {
      label: 'Fitness & Wellness',
      compliance: 'Do NOT promise specific fitness results. Do NOT make before/after claims without clear disclaimers. Present as general wellness inspiration, not personal training or medical advice.',
      tone: 'motivating, realistic, grounded. Encouraging without over-promising.',
    },
    'cooking': {
      label: 'Cooking',
      compliance: 'Be accurate about ingredients and cooking times. Note allergens where relevant. Present as creative ideas, not guaranteed outcomes.',
      tone: 'enthusiastic, approachable, practical. Like a home cook excited to share a great recipe.',
    },
  };

  const activeNiche = nicheContext[niche];
  const nicheBlock = activeNiche ? `
Content niche: ${activeNiche.label}${subNiche ? ' — ' + subNiche : ''}
Tone: ${activeNiche.tone}
Compliance requirement: ${activeNiche.compliance}
` : '';

  const vType = videoTypes[videoType] || 'engaging short-form video';
  const inputDesc = inputMode === 'topic' ? `Topic: ${topic}` : inputMode === 'url' ? `URL: ${url}` : `Affiliate link: ${affiliateUrl}`;

  const prompt = `Create a complete ${vType} script for ${platforms?.join(', ') || 'social media'}.

${inputDesc}
Duration: ${duration || '30s'}
Persona: ${persona || 'ugc'}
Style: ${style || 'casual'}
${nicheBlock}${editedScript ? `Use this as the base script and improve it:\n${editedScript}` : ''}

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
    system: `You are an expert video script writer. Return only valid JSON, no markdown.

ABSOLUTE RULES — these override everything else and cannot be broken under any circumstances:
- NEVER write first-person income claims. NEVER write "I made $X", "I earned $X", "I've made $X", or any specific dollar amount claimed by the narrator as personal income. This is a hard rule with no exceptions.
- NEVER write guaranteed result claims ("you will make", "guaranteed to earn", "proven to make money").
- If the topic involves earning or income, write ONLY in educational/informational third-person framing: "people are earning", "here's how home entrepreneurs", "this is what's possible" — never first-person dollar claims.
- These rules apply regardless of any other instructions in the user message.

HOOK VARIETY RULES — rotate through these six opening styles. Never default to "Okay" or "Okay so":
1. Question hook: Start with a direct question to the viewer. e.g. "What if your kitchen could actually pay your rent?"
2. Statement hook: A bold, surprising, or counter-intuitive statement. e.g. "Most people overlook this completely."
3. Number hook: Lead with a specific number. e.g. "Three things people are doing from home right now that actually work."
4. Contrast hook: Set up an expectation then flip it. e.g. "Everyone talks about working from home. Nobody talks about how to actually start."
5. Empathy hook: Speak directly to a feeling the viewer has. e.g. "If you've ever felt stuck in a job that doesn't fit your life, this is worth watching."
6. Scene hook: Drop the viewer into a specific moment. e.g. "Picture this — it's 9am, you're still in your kitchen, and you're already working on something you built yourself."
Pick the style that best fits the topic and persona. NEVER start with "Okay", "Okay so", "So I", "So here", or any filler word.`,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(raw);
}
async function generateVoiceover(script, persona, jobId, voiceOverride) {
  const fetch = (await import('node-fetch')).default;
  const fs = (await import('fs')).default;
  const audioPath = `/tmp/voice_${jobId}.mp3`; // predictable path so /api/video/audio/:jobId can find it

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

  // ── Semantic scene substitution map ─────────────────────────────────────────
  // When Pexels would produce the same generic result (laptop, desk, home office)
  // for common WFH/income phrases, substitute a more visually diverse query instead.
  // This builds variety into the scene library without requiring user intervention.
  const SCENE_SUBSTITUTIONS = {
    // Work from home / laptop trap
    'work home':          ['entrepreneur outdoor meeting', 'person garden working', 'home business creative', 'freelancer coffee shop laptop', 'woman celebrating success home'],
    'working home':       ['creative workspace home', 'entrepreneur morning routine', 'person productive outdoors', 'home office standing desk'],
    'earn money home':    ['person receiving package doorstep', 'woman shopping online success', 'entrepreneur excited phone', 'small business owner proud'],
    'make money home':    ['side hustle products display', 'woman baking selling goods', 'lawn care business tools', 'person crafting handmade items'],
    'income home':        ['home business products shelf', 'woman counting receipts kitchen', 'small business owner smiling', 'entrepreneur planning whiteboard'],
    'side hustle':        ['person baking tray goods', 'lawn mower yard work', 'craftsperson making jewelry', 'woman packaging products home', 'man repairing appliance'],
    'baking home':        ['woman baking bread kitchen', 'homemade cookies tray', 'person decorating cake', 'baked goods display table', 'baker kneading dough'],
    'lawn care':          ['person mowing lawn', 'garden tools yard', 'landscaping outdoor work', 'man trimming hedges', 'lawn maintenance equipment'],
    'home repair':        ['person fixing sink plumbing', 'man painting wall home', 'tools repair home', 'handyman fixing door', 'home improvement diy'],
    'online work':        ['person video call professional', 'freelancer coworking space', 'entrepreneur on phone outside', 'woman reviewing documents coffee'],
    'sell products':      ['person packaging shipment home', 'online seller products table', 'woman showing products camera', 'small business inventory'],
    'cleaning business':  ['cleaning supplies professional', 'person cleaning home sparkle', 'maid service work', 'cleaning equipment professional'],
    'opportunities':      ['person thinking bright future', 'entrepreneur sunrise outdoors', 'woman confident professional'],
    'entrepreneur':       ['confident woman business', 'entrepreneur networking event', 'small business owner storefront', 'person planning strategy'],
  };

  // Check if the phrase matches any substitution pattern
  function getSubstitutedQuery(phrase) {
    const lower = phrase.toLowerCase();
    for (const [key, alternatives] of Object.entries(SCENE_SUBSTITUTIONS)) {
      const keyWords = key.split(' ');
      if (keyWords.every(w => lower.includes(w))) {
        // Pick a pseudo-random alternative based on phrase length for determinism
        const idx = phrase.length % alternatives.length;
        console.log(`🎨 Scene variety substitution: "${key}" → "${alternatives[idx]}"`);
        return alternatives[idx];
      }
    }
    return null;
  }

      console.log(`🎬 Pexels: matching scene "${prompt.slice(0, 80)}..."`);

      // ── Build a ranked list of search queries from MOST to LEAST specific ──
      const stopWords = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','during','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','need','this','that','these','those','very','really','just','also']);
      // Generic visual/camera words that don't help Pexels find relevant footage
      // Keep this list SHORT — we want to preserve specific visual nouns like 'yard', 'battery', 'door', 'product'
      const genericVisualWords = new Set(['close','closeup','quick','showing','style','split','screen','side','camera','shot','shots','view','cuts','cut','angle','frame','footage','literally','honestly','basically','actually']);

      const cleaned = prompt.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const allWords = cleaned.split(' ').filter(w => w.length > 2 && !stopWords.has(w));
      const specificWords = allWords.filter(w => !genericVisualWords.has(w));

      // Strategy 1: first 4-5 specific content words in original order (preserves scene meaning)
      const primaryQuery = specificWords.slice(0, 5).join(' ');
      // Strategy 2: first 3 words — narrower, still specific
      const secondaryQuery = specificWords.slice(0, 3).join(' ');
      // Strategy 3: just the most distinctive single word (usually a noun further into the phrase)
      const tertiaryQuery = specificWords.slice(0, 1).join(' ');

      // Check for semantic substitution to add scene variety for generic WFH/income phrases
      const substitutedQuery = getSubstitutedQuery(prompt);
      const queryAttempts = [substitutedQuery, primaryQuery, secondaryQuery, tertiaryQuery].filter(q => q && q.length > 2);

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
          return { videoUrl: hd.link, pexelsId: matchedVideo.id, pexelsQuery: matchedQuery };
        }
      }

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
              return { videoUrl: file.link, pexelsId: vid.id, pexelsQuery: broadQuery };
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
async function assembleVideo(clips, audioPath, jobId) {
  let ffmpegBin = FFMPEG_PATH;

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const fs = (await import('fs')).default;
    const fetch = (await import('node-fetch')).default;
    const path = (await import('path')).default;

    const tmpDir = `/tmp/job_${jobId}`;
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    let ffmpegCmd = ffmpegBin || 'ffmpeg';
    try { 
      const { stdout } = await execAsync(`${ffmpegCmd} -version`);
      console.log('✅ FFmpeg ready:', ffmpegCmd);
    } catch(e) {
      for (const p of ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg']) {
        try { await execAsync(`${p} -version`); ffmpegCmd = p; break; } catch {}
      }
      try { await execAsync(`${ffmpegCmd} -version`); }
      catch(e2) {
        console.warn('FFmpeg not available anywhere — skipping assembly');
        return clips.find(c => c.videoUrl)?.videoUrl || null;
      }
    }

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
      fs.writeFileSync(concatFile, clipPaths.map(p => `file '${p}'`).join('\n'));
      const concatPath = path.join(tmpDir, 'concat.mp4');
      await filterComplexConcat(ffmpegCmd, clipPaths, concatPath);
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
    // Retry up to 3 times on overload
    let script = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        script = await generateScript({ inputMode, topic, url, affiliateUrl, persona, duration, style, platforms, videoType, editedScript });
        break;
      } catch(e) {
        const isOverload = e.message && (e.message.includes('overloaded') || e.message.includes('529'));
        if (isOverload && attempt < 3) {
          console.log(`Claude overloaded in pipeline (attempt ${attempt}/3), retrying in ${attempt * 4}s...`);
          await updateJob(jobId, { step: `Claude is busy — retrying (${attempt}/3)...` });
          await new Promise(r => setTimeout(r, attempt * 4000));
          continue;
        }
        throw e;
      }
    }
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

    let audioBase64 = null;
    if (audioPath) {
      try {
        const fs = (await import('fs')).default;
        if (fs.existsSync(audioPath)) {
          const audioBuf = fs.readFileSync(audioPath);
          if (audioBuf.length < 5 * 1024 * 1024) {
            audioBase64 = `data:audio/mpeg;base64,${audioBuf.toString('base64')}`;
            console.log(`✅ Audio converted to base64: ${(audioBuf.length/1024).toFixed(0)}KB`);
          }
        }
      } catch(e) { console.warn('Audio base64 failed:', e.message); }
    }

    // ── Auto-assembly mode ────────────────────────────────────────────────────
    if (params.autoAssemble) {
      await updateJob(jobId, { progress: 60, step: 'Auto-selecting scenes from script...' });

      // Split script into sentences
      const sentences = (script.fullScript || '')
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);

      const maxScenes = Math.min(sentences.length, 8); // cap at 8 scenes
      const selectedSentences = sentences.slice(0, maxScenes);

      await updateJob(jobId, { step: `Extracting keywords for ${selectedSentences.length} scenes...` });

      // Extract keywords for each sentence
      const keywords = await Promise.all(
        selectedSentences.map(async (sentence, i) => {
          const kw = await extractKeywordForPhrase(sentence, {
            position: i,
            total: selectedSentences.length,
            niche: params.niche || 'default',
            topic: params.topic || '',
          });
          console.log(`🔑 Scene ${i+1}/${selectedSentences.length}: "${sentence.slice(0,40)}" → "${kw}"`);
          return { phrase: sentence, keyword: kw };
        })
      );

      await updateJob(jobId, { progress: 70, step: `Fetching ${keywords.length} Pexels clips...` });

      // Fetch a Pexels clip for each keyword
      const aspectRatio = params.aspectRatio || '9:16';
      const clipResults = [];
      for (let i = 0; i < keywords.length; i++) {
        const { phrase, keyword } = keywords[i];
        try {
          const clip = await generateClip(phrase, 12, aspectRatio);
          clipResults.push({ phrase, keyword, ...clip });
          await updateJob(jobId, { step: `Fetched clip ${i+1}/${keywords.length}: ${keyword}` });
        } catch(e) {
          console.warn(`Clip ${i+1} failed for "${keyword}":`, e.message);
          clipResults.push({ phrase, keyword, videoUrl: null, failed: true });
        }
      }

      const successfulClips = clipResults.filter(c => c.videoUrl);
      console.log(`✅ ${successfulClips.length}/${clipResults.length} clips fetched`);

      if (successfulClips.length === 0) {
        // No clips — fall back to manual mode
        await updateJob(jobId, {
          status: 'completed', progress: 100,
          step: '⚠ Auto-assembly could not fetch clips — switch to manual scene picker above.',
          result: {
            script, clips: [], finalVideoUrl: null, audioPath, audioBase64,
            audioUrl: audioBase64 ? audioBase64 : `/api/video/audio/${jobId}`,
            hasAudio: !!audioPath, clipsCount: 0, autoAssembleFailed: true,
          },
        });
        return;
      }

      await updateJob(jobId, { progress: 80, step: 'Assembling final video...' });

      // Assemble the video using the same assembly logic as the manual endpoint
      try {
        const fs = (await import('fs')).default;
        const path = (await import('path')).default;
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const fetch = (await import('node-fetch')).default;
        const ffmpegPath = FFMPEG_PATH;

        const tmpDir = `/tmp/auto_${jobId}`;
        fs.mkdirSync(tmpDir, { recursive: true });

        // Dimension map
        const DIM = { '9:16':{w:720,h:1280}, '16:9':{w:1280,h:720}, '1:1':{w:720,h:720}, '4:5':{w:720,h:900}, '4:3':{w:960,h:720} };
        const { w, h } = DIM[aspectRatio] || DIM['9:16'];
        const scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;

        // ── Step 1: Download and normalize each clip ────────────────────────────
        const clipPaths = [];
        for (let ci = 0; ci < successfulClips.length; ci++) {
          const clip = successfulClips[ci];
          try {
            const rawPath  = path.join(tmpDir, `raw_${ci}.mp4`);
            const normPath = path.join(tmpDir, `norm_${ci}.mp4`);
            console.log(`⬇ Downloading clip ${ci+1}/${successfulClips.length}: ${clip.videoUrl?.slice(0,60)}`);
            const dlRes = await fetch(clip.videoUrl);
            if (!dlRes.ok) throw new Error(`HTTP ${dlRes.status}`);
            const buf = await dlRes.buffer();
            if (!buf || buf.length < 1000) throw new Error(`Clip too small: ${buf?.length} bytes`);
            fs.writeFileSync(rawPath, buf);

            // Normalize to target dimensions, 24fps, no audio
            await execAsync(`"${ffmpegPath}" -y -i "${rawPath}" -vf "${scaleFilter}" -c:v libx264 -preset ultrafast -crf 26 -r 24 -an "${normPath}"`);
            const normSize = fs.existsSync(normPath) ? fs.statSync(normPath).size : 0;
            if (normSize < 1000) throw new Error(`Normalized clip too small: ${normSize} bytes`);
            clipPaths.push(normPath);
            console.log(`✅ Clip ${ci+1} ready: ${(normSize/1024).toFixed(0)}KB`);
          } catch(e) {
            console.warn(`⚠ Clip ${ci+1} failed:`, e.message);
          }
        }

        if (clipPaths.length === 0) throw new Error('No clips could be downloaded or normalized — check Pexels API and network');
        console.log(`✅ ${clipPaths.length} clips ready for assembly`);

        // ── Step 2: Get audio duration before any trimming ───────────────────────
        let audioDuration = 0;
        if (audioPath && fs.existsSync(audioPath)) {
          const audioSize = fs.statSync(audioPath).size;
          console.log(`🎙 Audio file: ${(audioSize/1024).toFixed(0)}KB at ${audioPath}`);
          const probeResult = await execAsync(`"${ffmpegPath}" -i "${audioPath}" -f null /dev/null`).catch(e => ({ stderr: e.stderr || e.message || '' }));
          const probeText = probeResult.stderr || probeResult.stdout || '';
          const match = probeText.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
          if (match) {
            audioDuration = parseInt(match[1])*3600 + parseInt(match[2])*60 + parseFloat(match[3]);
            console.log(`✅ Audio duration: ${audioDuration.toFixed(1)}s`);
          } else {
            audioDuration = audioSize / 16000;
            console.log(`⚠ Audio duration estimated from file size: ${audioDuration.toFixed(1)}s`);
          }
        } else {
          console.warn('⚠ No audio file found — video will have no sound');
        }

        // ── Step 3: Trim each clip to its share of the voiceover ─────────────────
        let videoForMix = null;
        if (audioDuration > 0) {
          const perClip = audioDuration / clipPaths.length;
          console.log(`⏱ Trimming ${clipPaths.length} clips to ${perClip.toFixed(1)}s each`);
          const trimmedPaths = [];
          for (let ti = 0; ti < clipPaths.length; ti++) {
            const trimPath = path.join(tmpDir, `trim_${ti}.mp4`);
            try {
              await execAsync(`"${ffmpegPath}" -y -i "${clipPaths[ti]}" -t ${perClip.toFixed(3)} -c:v libx264 -preset ultrafast -crf 26 -r 24 "${trimPath}"`);
              const sz = fs.existsSync(trimPath) ? fs.statSync(trimPath).size : 0;
              if (sz > 1000) { trimmedPaths.push(trimPath); }
              else { console.warn(`⚠ Trim ${ti} too small (${sz}b), using original`); trimmedPaths.push(clipPaths[ti]); }
            } catch(e) { console.warn(`⚠ Trim ${ti} failed:`, e.message); trimmedPaths.push(clipPaths[ti]); }
          }

          // ── filter_complex concat — no list files, no concat demuxer ────────────
          // Each trimmed clip is a separate -i input, joined via filter_complex
          // This avoids Railway's sandbox restriction on the concat demuxer entirely
          const syncedPath = path.join(tmpDir, 'synced.mp4');
          const inputs = trimmedPaths.map(p => `"${p}"`).join(' -i ');
          const filterMap = trimmedPaths.map((_, idx) => `[${idx}:v]`).join('');
          const filterComplex = `${filterMap}concat=n=${trimmedPaths.length}:v=1:a=0[outv]`;
          await execAsync(`"${ffmpegPath}" -y ${trimmedPaths.map(p => `-i "${p}"`).join(' ')} -filter_complex "${filterComplex}" -map "[outv]" -c:v libx264 -preset ultrafast -crf 26 -r 24 -vsync cfr "${syncedPath}"`);
          const syncedSz = fs.existsSync(syncedPath) ? fs.statSync(syncedPath).size : 0;
          if (syncedSz > 10000) {
            videoForMix = syncedPath;
            console.log(`✅ filter_complex concat: ${(syncedSz/1024/1024).toFixed(1)}MB`);
          } else {
            console.warn(`⚠ filter_complex concat too small (${syncedSz}b), trying direct join`);
          }
        }

        // Fallback: join clips without trimming using filter_complex
        if (!videoForMix) {
          const concatPath = path.join(tmpDir, 'concat.mp4');
          const filterMap2 = clipPaths.map((_, idx) => `[${idx}:v]`).join('');
          const filterComplex2 = `${filterMap2}concat=n=${clipPaths.length}:v=1:a=0[outv]`;
          await execAsync(`"${ffmpegPath}" -y ${clipPaths.map(p => `-i "${p}"`).join(' ')} -filter_complex "${filterComplex2}" -map "[outv]" -c:v libx264 -preset ultrafast -crf 26 -r 24 "${concatPath}"`);
          const concatSz = fs.existsSync(concatPath) ? fs.statSync(concatPath).size : 0;
          if (concatSz > 10000) {
            videoForMix = concatPath;
            console.log(`✅ Fallback filter_complex: ${(concatSz/1024/1024).toFixed(1)}MB`);
          } else {
            throw new Error(`All concat methods failed — output: ${concatSz} bytes. FFmpeg may not support filter_complex on this build.`);
          }
        }

        // ── Step 4: Attach audio ──────────────────────────────────────────────────
        const stablePath = `/tmp/auto_final_${jobId}.mp4`;
        let finalVideoUrl = null;
        let r2Key = null;

        if (audioPath && fs.existsSync(audioPath)) {
          await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 128k -shortest "${stablePath}"`);
        } else {
          // No audio — just copy video
          fs.copyFileSync(videoForMix, stablePath);
        }
        const finalSz = fs.existsSync(stablePath) ? fs.statSync(stablePath).size : 0;
        if (finalSz < 10000) throw new Error(`Final video too small after audio attach: ${finalSz} bytes`);
        console.log(`✅ Final video with audio: ${(finalSz/1024/1024).toFixed(1)}MB at ${stablePath}`);

        // ── Step 5: Timed keyword captions (optional — skip if fails) ────────────
        if (audioDuration > 0 && keywords.length > 0) {
          try {
            const perScene = audioDuration / keywords.length;
            const captionFilters = keywords.map(function(kw, idx) {
              const startT = (idx * perScene).toFixed(2);
              const endT   = Math.max(0, (idx + 1) * perScene - 0.3).toFixed(2);
              const skipWords = new Set(['home','person','people','man','woman','the','and','for','with','from','that','this']);
              const words = (kw.keyword || '').split(' ').filter(w => w.length > 2 && !skipWords.has(w));
              const display = words.slice(0, 2).join(' ').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
              if (!display) return null;
              // Use fontsize without fontfile — Railway has default fonts
              return `drawtext=text='${display}':fontsize=32:fontcolor=0xFFD700:shadowcolor=0x000000@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2:y=h-th-80:enable='between(t,${startT},${endT})'`;
            }).filter(Boolean);

            if (captionFilters.length > 0) {
              const captionPath = path.join(path.dirname(stablePath), `cap_${jobId}.mp4`);
              const filterStr = captionFilters.join(',');
              await execAsync(`"${ffmpegPath}" -y -i "${stablePath}" -vf "${filterStr}" -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${captionPath}"`);
              const capSz = fs.existsSync(captionPath) ? fs.statSync(captionPath).size : 0;
              if (capSz > finalSz * 0.5) {
                fs.copyFileSync(captionPath, stablePath); // overwrite with captioned version
                fs.unlinkSync(captionPath);
                console.log(`✅ Captions applied: ${captionFilters.length} overlays`);
              } else {
                console.warn(`⚠ Caption output too small (${capSz}b vs ${finalSz}b) — keeping uncaptioned version`);
              }
            }
          } catch(e) { console.warn('⚠ Caption overlay failed — continuing without:', e.message); }
        }

        // ── Step 6: Upload to R2 (preferred long-term) ──────────────────────────
        if (process.env.R2_BUCKET_NAME && fs.existsSync(stablePath)) {
          try {
            r2Key = `auto-videos/${jobId}.mp4`;
            finalVideoUrl = await uploadToR2AndSign(stablePath, r2Key, 86400 * 30);
            console.log(`✅ Uploaded to R2: ${r2Key}`);
          } catch(e) { console.warn('R2 upload failed, using Railway fallback:', e.message); }
        }

        // ── Step 7: Railway direct-serve fallback if R2 unavailable ─────────────
        if (!finalVideoUrl && fs.existsSync(stablePath)) {
          finalVideoUrl = `/api/video/download/${jobId}`;
          console.log(`✅ Railway fallback URL set: ${finalVideoUrl}`);
        }

        // Cleanup only the tmp working dir — stablePath (/tmp/auto_final_*.mp4) kept
        try { fs.rmSync(tmpDir, { recursive: true }); } catch {}

        await updateJob(jobId, {
          status: 'completed', progress: 100,
          step: '✅ Video auto-assembled and ready to download!',
          result: {
            script,
            clips: successfulClips.map(c => ({ phrase: c.phrase, keyword: c.keyword, videoUrl: c.videoUrl })),
            finalVideoUrl,
            r2Key,
            audioPath,
            audioBase64,
            audioUrl: audioBase64 ? audioBase64 : `/api/video/audio/${jobId}`,
            hasAudio: !!audioPath,
            clipsCount: successfulClips.length,
            autoAssembled: true,
            aspectRatio,
            savedAt: new Date().toISOString(),
          },
        });
        return;

      } catch(e) {
        console.error('Auto-assembly failed:', e.message);
        await updateJob(jobId, {
          status: 'completed', progress: 100,
          step: `⚠ Auto-assembly error: ${e.message.slice(0,80)} — download clips manually above.`,
          result: {
            script, clips: clipResults, finalVideoUrl: null, audioPath, audioBase64,
            audioUrl: audioBase64 ? audioBase64 : `/api/video/audio/${jobId}`,
            hasAudio: !!audioPath, clipsCount: successfulClips.length, autoAssembleFailed: true,
          },
        });
        return;
      }
    }

    // ── Manual mode (default) — stop here, let user pick scenes ──────────────
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

app.post('/api/video/assemble', async (req, res) => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const fs   = (await import('fs')).default;
    const fetch = (await import('node-fetch')).default;
    const path  = (await import('path')).default;

    const { clipUrls, audioUrl, jobId, aspectRatio = '9:16', music, captions, captionText, captionStyle = 'bottom', ctaUrl = '', ctaText = '', syncToAudio = true, heygenVideoUrl = '' } = req.body;
    if (!clipUrls?.length) return res.status(400).json({ error: 'clipUrls required' });

    const tmpDir = `/tmp/assemble_${jobId || Date.now()}`;
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    let ffmpegPath = 'ffmpeg';
    try {
      ffmpegPath = FFMPEG_PATH;
    } catch {}
    try { await execAsync(`"${ffmpegPath}" -version`); }
    catch(e) { return res.status(500).json({ error: 'FFmpeg not available' }); }

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

    const clipPaths = [];
    for (let i = 0; i < clipUrls.length; i++) {
      try {
        let r = await fetch(clipUrls[i]);
        if (!r.ok) {
          console.warn(`Clip ${i} fetch failed: ${r.status} — attempting URL refresh via Pexels re-search`);
          // Try to refresh the URL using the stored pexelsId or pexelsQuery
          const clip = req.body.clips?.[i];
          let refreshedUrl = null;
          if (clip?.pexelsId && process.env.PEXELS_API_KEY) {
            try {
              const refresh = await fetch(
                `https://api.pexels.com/videos/videos/${clip.pexelsId}`,
                { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
              );
              if (refresh.ok) {
                const vd = await refresh.json();
                const hdf = vd.video_files?.find(f => f.quality === 'hd' && f.width >= 720) || vd.video_files?.[0];
                if (hdf?.link) {
                  refreshedUrl = hdf.link;
                  console.log(`✅ Refreshed clip ${i} URL via Pexels video ID ${clip.pexelsId}`);
                }
              }
            } catch(e2) { console.warn(`Clip ${i} refresh by ID failed:`, e2.message); }
          }
          if (!refreshedUrl && clip?.pexelsQuery && process.env.PEXELS_API_KEY) {
            try {
              const refresh = await fetch(
                `https://api.pexels.com/videos/search?query=${encodeURIComponent(clip.pexelsQuery)}&orientation=portrait&per_page=1`,
                { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
              );
              if (refresh.ok) {
                const rd = await refresh.json();
                const vid = rd.videos?.[0];
                const hdf = vid?.video_files?.find(f => f.quality === 'hd' && f.width >= 720) || vid?.video_files?.[0];
                if (hdf?.link) {
                  refreshedUrl = hdf.link;
                  console.log(`✅ Refreshed clip ${i} URL via re-search for "${clip.pexelsQuery}"`);
                }
              }
            } catch(e2) { console.warn(`Clip ${i} refresh by query failed:`, e2.message); }
          }
          if (!refreshedUrl) { continue; }
          // Retry fetch with refreshed URL
          r = await fetch(refreshedUrl);
          if (!r.ok) { console.warn(`Clip ${i} still failed after refresh: ${r.status}`); continue; }
        }
        const buf = await r.buffer();
        const rawPath = path.join(tmpDir, `raw_${i}.mp4`);
        fs.writeFileSync(rawPath, buf);

        const normPath = path.join(tmpDir, `clip_${i}.mp4`);
        const cropStyleReq = req.body.cropStyle || 'center';
        let scaleFilter;
        if (cropStyleReq === 'pad') {
          // Letterbox: only when explicitly chosen — shrink to fit with black bars
          scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`;
        } else if (cropStyleReq === 'top') {
          // Scale to fill, keep top — two-pass: scale up to fill, crop from top
          scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:0:0,setsar=1`;
        } else if (cropStyleReq === 'bottom') {
          // Scale to fill, keep bottom — two-pass: scale up to fill, crop from bottom
          scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:0:ih-${h},setsar=1`;
        } else {
          // Center crop (default): scale up to fill frame, crop center
          // force_original_aspect_ratio=increase ensures clip always fills
          // the full ${w}x${h} frame — no black bars ever appear
          scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:(iw-${w})/2:(ih-${h})/2,setsar=1`;
        }
        await execAsync(`"${ffmpegPath}" -y -i "${rawPath}" -vf "${scaleFilter}" -c:v libx264 -preset ultrafast -crf 26 -r 24 -an "${normPath}"`);

        if (fs.existsSync(normPath)) {
          clipPaths.push(normPath);
          console.log(`✅ Clip ${i+1} normalized to ${w}x${h}: ${(buf.length/1024/1024).toFixed(1)}MB`);
        }
      } catch(e) { console.warn(`Clip ${i} error:`, e.message); }
    }

    if (clipPaths.length === 0) return res.status(500).json({ error: 'No clips could be processed' });

    let audioPath = null;
    if (audioUrl) {
      try {
        if (audioUrl.startsWith('data:')) {
          const base64Data = audioUrl.split(',')[1];
          if (base64Data) {
            audioPath = path.join(tmpDir, 'voice.mp3');
            fs.writeFileSync(audioPath, Buffer.from(base64Data, 'base64'));
            const audioSize = fs.statSync(audioPath).size;
            console.log(`✅ Audio from base64: ${(audioSize/1024).toFixed(0)}KB`);
            if (audioSize < 1000) {
              console.warn('⚠ Audio file suspiciously small — may be corrupt');
              audioPath = null;
            }
          }
        } else {
          // Build full URL if relative path given
          const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl
            : `https://stellar-achievement-production-ea9d.up.railway.app${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
          console.log(`⬇ Downloading audio from: ${fullAudioUrl.slice(0, 80)}`);
          const r = await fetch(fullAudioUrl);
          if (r.ok) {
            const buf = await r.buffer();
            audioPath = path.join(tmpDir, 'voice.mp3');
            fs.writeFileSync(audioPath, buf);
            console.log(`✅ Audio downloaded: ${(buf.length/1024).toFixed(0)}KB`);
            if (buf.length < 1000) {
              console.warn('⚠ Downloaded audio file too small — may be an error response');
              audioPath = null;
            }
          } else {
            console.warn(`⚠ Audio download returned ${r.status} — will attempt predictable path fallback`);
            // Try predictable path fallback using jobId
            if (jobId) {
              const predictable = `/tmp/voice_${jobId}.mp3`;
              if (fs.existsSync(predictable)) {
                audioPath = predictable;
                console.log(`✅ Audio found via predictable path: ${(fs.statSync(audioPath).size/1024).toFixed(0)}KB`);
              }
            }
          }
        }
      } catch(e) {
        console.warn('Audio download failed:', e.message);
        // Last resort: check predictable path
        if (jobId) {
          const predictable = `/tmp/voice_${jobId}.mp3`;
          if (fs.existsSync(predictable)) {
            audioPath = predictable;
            console.log(`✅ Audio recovered from predictable path`);
          }
        }
      }
    }
    if (!audioPath) {
      console.warn('⚠ NO AUDIO PATH — final video will have no sound. Check audioUrl was passed and voiceover was generated.');
    }

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

    if (clipPaths.length === 1) {
      fs.copyFileSync(clipPaths[0], concatPath);
    } else {
      const concatFile = path.join(tmpDir, 'list.txt');
      const concatLines = clipPaths.map(p => "file '" + p + "'"); fs.writeFileSync(concatFile, concatLines.join('\n'));
      // Re-encode concat (not -c copy) to ensure uniform fps/codec and eliminate opening delay
      // caused by mixed frame rates from different Pexels clips
      await filterComplexConcat(ffmpegPath, clipPaths, concatPath);
    }
    console.log('✅ Clips concatenated');

    let audioDuration = 0;
    if (audioPath && fs.existsSync(audioPath)) {
      try {
        // Use stderr capture — ffmpeg writes duration info to stderr not stdout
        const probeResult = await execAsync(`"${ffmpegPath}" -i "${audioPath}" -f null /dev/null`).catch(e => ({ stderr: e.stderr || e.message || '' }));
        const probeText = probeResult.stderr || probeResult.stdout || '';
        const match = probeText.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
        if (match) {
          audioDuration = parseInt(match[1])*3600 + parseInt(match[2])*60 + parseFloat(match[3]);
          console.log(`✅ Audio duration: ${audioDuration.toFixed(1)}s`);
        } else {
          // Fallback: estimate from file size (mp3 ~128kbps = 16KB/s)
          const fsize = fs.statSync(audioPath).size;
          audioDuration = fsize / 16000;
          console.log(`⚠ Audio duration estimated from file size: ${audioDuration.toFixed(1)}s`);
        }
      } catch(e) { console.warn('Could not get audio duration:', e.message); }
    }

    let videoForMix = concatPath;
    if (audioDuration > 0 && clipPaths.length > 0) {
      try {
        const perClipDuration = audioDuration / clipPaths.length;
        console.log(`⏱ Syncing: ${clipPaths.length} clips × ${perClipDuration.toFixed(1)}s = ${audioDuration.toFixed(1)}s total`);
        const trimmedPaths = [];
        for (let ti = 0; ti < clipPaths.length; ti++) {
          const trimPath = path.join(tmpDir, `trimmed_${ti}.mp4`);
          try {
            await execAsync(`"${ffmpegPath}" -y -i "${clipPaths[ti]}" -t ${perClipDuration.toFixed(3)} -c:v libx264 -preset ultrafast -crf 26 -r 24 "${trimPath}"`);
            if (fs.existsSync(trimPath) && fs.statSync(trimPath).size > 0) { trimmedPaths.push(trimPath); }
            else { trimmedPaths.push(clipPaths[ti]); }
          } catch(e2) { trimmedPaths.push(clipPaths[ti]); }
        }
        const trimConcatFile = path.join(tmpDir, 'trim_list.txt');
        fs.writeFileSync(trimConcatFile, trimmedPaths.map(p => "file '" + p + "'").join('\n'));
        const syncedPath = path.join(tmpDir, 'synced.mp4');
        await filterComplexConcat(ffmpegPath, trimmedPaths, syncedPath);
        if (fs.existsSync(syncedPath) && fs.statSync(syncedPath).size > 0) {
          videoForMix = syncedPath;
          console.log(`✅ Clips synced to voiceover (${perClipDuration.toFixed(1)}s per scene)`);
        }
      } catch(e) {
        console.warn('Per-clip sync failed, falling back to loop:', e.message);
        try {
          const loopedPath = path.join(tmpDir, 'looped.mp4');
          await execAsync(`"${ffmpegPath}" -y -stream_loop -1 -i "${concatPath}" -c:v libx264 -preset ultrafast -crf 26 -t ${audioDuration + 1} "${loopedPath}"`);
          if (fs.existsSync(loopedPath)) { videoForMix = loopedPath; console.log(`✅ Fallback loop applied`); }
        } catch(e2) { console.warn('Loop fallback failed:', e2.message); }
      }
    }

    if (audioPath && musicPath) {
      const mixedAudio = path.join(tmpDir, 'mixed.mp3');
      const vVol = req.body.voiceVolume !== undefined ? Number(req.body.voiceVolume) : 1.0;
      const mVol = req.body.musicVolume !== undefined ? Number(req.body.musicVolume) * 1.5 : 0.45;
      const amixFilter = `[0:a]volume=${vVol}[v];[1:a]volume=${mVol}[m];[v][m]amix=inputs=2:duration=first`;
      await execAsync(`"${ffmpegPath}" -y -i "${audioPath}" -i "${musicPath}" -filter_complex "${amixFilter}" "${mixedAudio}"`);
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${mixedAudio}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 128k -shortest "${outputPath}"`);
    } else if (audioPath) {
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 128k -shortest "${outputPath}"`);
    } else if (musicPath) {
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${musicPath}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 128k -shortest "${outputPath}"`);
    } else {
      fs.copyFileSync(videoForMix, outputPath);
    }
    console.log('✅ Audio mixed');

    if (!fs.existsSync(outputPath)) return res.status(500).json({ error: 'Assembly failed' });

    let finalPath = outputPath;
    let srtContent = null;
    if (captions && captionText) {
      try {
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

        srtContent = srt;
        console.log('✅ SRT subtitles generated (' + chunks.length + ' chunks, ' + totalDuration.toFixed(1) + 's)');
      } catch(e) {
        console.warn('SRT generation failed:', e.message);
      }
    }


    // ── Dark vignette edge fade (user-selectable) ────────────────────────────
    if (req.body.vignette !== false) {
      try {
        const vignettePath = path.join(tmpDir, 'vignette.mp4');
        await execAsync(`"${ffmpegPath}" -y -i "${finalPath}" -vf "vignette=angle=0.7854:mode=forward" -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${vignettePath}"`);
        if (fs.existsSync(vignettePath) && fs.statSync(vignettePath).size > 0) {
          finalPath = vignettePath;
          console.log('✅ Dark vignette applied');
        } else {
          console.warn('Vignette produced no output, using pre-vignette video');
        }
      } catch(e) {
        console.warn('Vignette filter failed, continuing without it. FFmpeg error:', e.message, e.stderr || '');
      }
    }
    // ── CTA URL visible overlay on final frames ─────────────────────────────
    if (ctaUrl && ctaUrl.trim()) {
      try {
        const ctaPath = path.join(tmpDir, 'cta.mp4');
        const displayText = (ctaText && ctaText.trim()) ? ctaText.trim() : ctaUrl.trim();
        const safeText = displayText.replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/\\/g, '\\\\');
        const startTime = audioDuration > 5 ? audioDuration - 5 : 0;
        const ctaFilter = `drawtext=text='${safeText}':fontsize=26:fontcolor=white:box=1:boxcolor=black@0.75:boxborderw=10:x=(w-text_w)/2:y=h-th-80:enable='gte(t,${startTime.toFixed(1)})'`;
        await execAsync(`"${ffmpegPath}" -y -i "${finalPath}" -vf "${ctaFilter}" -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${ctaPath}"`);
        if (fs.existsSync(ctaPath) && fs.statSync(ctaPath).size > 0) {
          finalPath = ctaPath;
          console.log(`✅ CTA overlay added: "${displayText}" from ${startTime.toFixed(1)}s`);
        }
      } catch(e) {
        console.warn('CTA overlay failed, continuing without:', e.message);
      }
    }

    // ── HeyGen avatar picture-in-picture overlay ─────────────────────────────
    // Scene video fills the full frame. HeyGen avatar appears in the corner.
    if (heygenVideoUrl && heygenVideoUrl.trim()) {
      try {
        const pipVideoPath = path.join(tmpDir, 'heygen_pip.mp4');
        const pipOutputPath = path.join(tmpDir, 'pip_combined.mp4');

        // Download the HeyGen video
        console.log('⬇ Downloading HeyGen avatar for PIP overlay...');
        const hgRes = await fetch(heygenVideoUrl.trim());
        if (!hgRes.ok) throw new Error(`HeyGen video download failed: ${hgRes.status}`);
        const hgBuf = await hgRes.buffer();
        fs.writeFileSync(pipVideoPath, hgBuf);
        console.log(`✅ HeyGen video downloaded: ${(hgBuf.length/1024/1024).toFixed(1)}MB`);

        // Layout mode: 'presenter' (large centered) or 'corner' (small box)
        const layoutMode = req.body.avatarLayout === 'presenter' ? 'presenter' : 'corner';
        const useChromaKey = req.body.heygenGreenScreen === true ||
                             req.body.heygenBackgroundType === 'greenscreen';

        const ov = buildAvatarOverlayFilter(w, h, layoutMode, useChromaKey);
        console.log(`🎬 Avatar overlay: ${layoutMode} mode, ${useChromaKey ? 'chroma-keyed' : 'boxed'} (${ov.avW}x${ov.avH} @ ${ov.avX},${ov.avY})`);

        await execAsync(
          `"${ffmpegPath}" -y -i "${finalPath}" -i "${pipVideoPath}" ` +
          `-filter_complex "${ov.filter}" ` +
          `-map "[outv]" -map 0:a? -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${pipOutputPath}"`
        );

        if (fs.existsSync(pipOutputPath) && fs.statSync(pipOutputPath).size > 0) {
          finalPath = pipOutputPath;
          console.log(`✅ Avatar overlay applied (${layoutMode})`);
        } else {
          console.warn('Avatar overlay produced no output, continuing without it');
        }
      } catch(e) {
        console.warn('HeyGen PIP overlay failed, continuing without:', e.message);
      }
    }

    // ── Gold timed keyword captions (avatar combine toggle) ──────────────────
    const capWords = Array.isArray(req.body.avatarCaptionWords) ? req.body.avatarCaptionWords.filter(Boolean) : [];
    if (req.body.avatarCaptions === true && capWords.length > 0) {
      try {
        // Estimate total duration from the current final video
        const probe = await execAsync(`"${ffmpegPath}" -i "${finalPath}" -f null /dev/null`).catch(e => ({ stderr: e.stderr || '' }));
        const pt = probe.stderr || probe.stdout || '';
        const dm = pt.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
        let totalDur = dm ? (parseInt(dm[1])*3600 + parseInt(dm[2])*60 + parseFloat(dm[3])) : 0;
        if (totalDur > 0) {
          const perWord = totalDur / capWords.length;
          const skip = new Set(['home','person','people','man','woman','the','and','for','with','from','that','this']);
          const filters = capWords.map(function(kw, idx) {
            const startT = (idx * perWord).toFixed(2);
            const endT   = Math.max(0, (idx + 1) * perWord - 0.3).toFixed(2);
            const words = String(kw).split(' ').filter(x => x.length > 2 && !skip.has(x.toLowerCase()));
            const disp = words.slice(0, 2).join(' ').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
            if (!disp) return null;
            return `drawtext=text='${disp}':fontsize=32:fontcolor=0xFFD700:shadowcolor=0x000000@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2:y=h-th-80:enable='between(t,${startT},${endT})'`;
          }).filter(Boolean);
          if (filters.length > 0) {
            const capPath = path.join(tmpDir, 'combine_captioned.mp4');
            await execAsync(`"${ffmpegPath}" -y -i "${finalPath}" -vf "${filters.join(',')}" -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${capPath}"`);
            if (fs.existsSync(capPath) && fs.statSync(capPath).size > (fs.statSync(finalPath).size * 0.5)) {
              finalPath = capPath;
              console.log(`✅ Gold captions applied to combined video: ${filters.length} overlays`);
            } else {
              console.warn('⚠ Caption output too small — keeping uncaptioned combined video');
            }
          }
        }
      } catch(e) { console.warn('⚠ Combine captions failed — continuing without:', e.message); }
    }

    const stat = fs.statSync(finalPath);
    console.log(`✅ Assembly complete: ${(stat.size/1024/1024).toFixed(1)}MB at ${w}x${h}${captions ? ' with captions' : ''}${ctaUrl ? ' + CTA' : ''}${heygenVideoUrl ? ' + HeyGen PIP' : ''}`);

    // Send SRT content as a response header so frontend can offer it as a download
    if (srtContent) {
      const srtB64 = Buffer.from(srtContent).toString('base64');
      res.setHeader('X-Subtitle-SRT', srtB64);
    }
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
      title, description = '', privacy = 'unlisted', isShort, ctaUrl = '', ctaText = '',
      heygenVideoUrl = '', heygenGreenScreen = false, heygenBackgroundType = '',
    } = req.body;
    if (!clipUrls?.length) return res.status(400).json({ error: 'clipUrls required' });
    if (!title || !title.trim()) return res.status(400).json({ error: 'title is required to publish to YouTube' });

    const tmpDir = `/tmp/assemble_${jobId || Date.now()}`;
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    let ffmpegPath = 'ffmpeg';
    try {
      ffmpegPath = FFMPEG_PATH;
    } catch {}
    try { await execAsync(`"${ffmpegPath}" -version`); }
    catch(e) { return res.status(500).json({ error: 'FFmpeg not available' }); }

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

    const clipPaths = [];
    for (let i = 0; i < clipUrls.length; i++) {
      try {
        let r = await fetch(clipUrls[i]);
        if (!r.ok) {
          console.warn(`Clip ${i} fetch failed: ${r.status} — attempting URL refresh via Pexels re-search`);
          // Try to refresh the URL using the stored pexelsId or pexelsQuery
          const clip = req.body.clips?.[i];
          let refreshedUrl = null;
          if (clip?.pexelsId && process.env.PEXELS_API_KEY) {
            try {
              const refresh = await fetch(
                `https://api.pexels.com/videos/videos/${clip.pexelsId}`,
                { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
              );
              if (refresh.ok) {
                const vd = await refresh.json();
                const hdf = vd.video_files?.find(f => f.quality === 'hd' && f.width >= 720) || vd.video_files?.[0];
                if (hdf?.link) {
                  refreshedUrl = hdf.link;
                  console.log(`✅ Refreshed clip ${i} URL via Pexels video ID ${clip.pexelsId}`);
                }
              }
            } catch(e2) { console.warn(`Clip ${i} refresh by ID failed:`, e2.message); }
          }
          if (!refreshedUrl && clip?.pexelsQuery && process.env.PEXELS_API_KEY) {
            try {
              const refresh = await fetch(
                `https://api.pexels.com/videos/search?query=${encodeURIComponent(clip.pexelsQuery)}&orientation=portrait&per_page=1`,
                { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
              );
              if (refresh.ok) {
                const rd = await refresh.json();
                const vid = rd.videos?.[0];
                const hdf = vid?.video_files?.find(f => f.quality === 'hd' && f.width >= 720) || vid?.video_files?.[0];
                if (hdf?.link) {
                  refreshedUrl = hdf.link;
                  console.log(`✅ Refreshed clip ${i} URL via re-search for "${clip.pexelsQuery}"`);
                }
              }
            } catch(e2) { console.warn(`Clip ${i} refresh by query failed:`, e2.message); }
          }
          if (!refreshedUrl) { continue; }
          // Retry fetch with refreshed URL
          r = await fetch(refreshedUrl);
          if (!r.ok) { console.warn(`Clip ${i} still failed after refresh: ${r.status}`); continue; }
        }
        const buf = await r.buffer();
        const rawPath = path.join(tmpDir, `raw_${i}.mp4`);
        fs.writeFileSync(rawPath, buf);

        const normPath = path.join(tmpDir, `clip_${i}.mp4`);
        const cropStyleReq = req.body.cropStyle || 'center';
        let scaleFilter;
        if (cropStyleReq === 'pad') {
          // Letterbox: only when explicitly chosen — shrink to fit with black bars
          scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`;
        } else if (cropStyleReq === 'top') {
          // Scale to fill, keep top — two-pass: scale up to fill, crop from top
          scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:0:0,setsar=1`;
        } else if (cropStyleReq === 'bottom') {
          // Scale to fill, keep bottom — two-pass: scale up to fill, crop from bottom
          scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:0:ih-${h},setsar=1`;
        } else {
          // Center crop (default): scale up to fill frame, crop center
          // force_original_aspect_ratio=increase ensures clip always fills
          // the full ${w}x${h} frame — no black bars ever appear
          scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:(iw-${w})/2:(ih-${h})/2,setsar=1`;
        }
        await execAsync(`"${ffmpegPath}" -y -i "${rawPath}" -vf "${scaleFilter}" -c:v libx264 -preset ultrafast -crf 26 -r 24 -an "${normPath}"`);

        if (fs.existsSync(normPath)) {
          clipPaths.push(normPath);
          console.log(`✅ Clip ${i+1} normalized to ${w}x${h}: ${(buf.length/1024/1024).toFixed(1)}MB`);
        }
      } catch(e) { console.warn(`Clip ${i} error:`, e.message); }
    }

    if (clipPaths.length === 0) return res.status(500).json({ error: 'No clips could be processed' });

    let audioPath = null;
    if (audioUrl) {
      try {
        if (audioUrl.startsWith('data:')) {
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

    if (clipPaths.length === 1) {
      fs.copyFileSync(clipPaths[0], concatPath);
    } else {
      const concatFile = path.join(tmpDir, 'list.txt');
      const concatLines = clipPaths.map(p => "file '" + p + "'"); fs.writeFileSync(concatFile, concatLines.join('\n'));
      // Re-encode concat (not -c copy) to ensure uniform fps/codec and eliminate opening delay
      // caused by mixed frame rates from different Pexels clips
      await filterComplexConcat(ffmpegPath, clipPaths, concatPath);
    }
    console.log('✅ Clips concatenated');

    let audioDuration = 0;
    if (audioPath && fs.existsSync(audioPath)) {
      try {
        const probeResult2 = await execAsync(`"${ffmpegPath}" -i "${audioPath}" -f null /dev/null`).catch(e => ({ stderr: e.stderr || e.message || '' }));
        const probeText2 = probeResult2.stderr || probeResult2.stdout || '';
        const match = probeText2.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
        if (match) {
          audioDuration = parseInt(match[1])*3600 + parseInt(match[2])*60 + parseFloat(match[3]);
          console.log(`✅ Audio duration: ${audioDuration.toFixed(1)}s`);
        } else {
          const fsize = fs.statSync(audioPath).size;
          audioDuration = fsize / 16000;
          console.log(`⚠ Audio duration estimated: ${audioDuration.toFixed(1)}s`);
        }
      } catch(e) { console.warn('Could not get audio duration:', e.message); }
    }

    let videoForMix = concatPath;
    if (audioDuration > 0 && clipPaths.length > 0) {
      try {
        const perClipDuration = audioDuration / clipPaths.length;
        console.log(`⏱ Syncing: ${clipPaths.length} clips × ${perClipDuration.toFixed(1)}s = ${audioDuration.toFixed(1)}s total`);
        const trimmedPaths = [];
        for (let ti = 0; ti < clipPaths.length; ti++) {
          const trimPath = path.join(tmpDir, `trimmed_${ti}.mp4`);
          try {
            await execAsync(`"${ffmpegPath}" -y -i "${clipPaths[ti]}" -t ${perClipDuration.toFixed(3)} -c:v libx264 -preset ultrafast -crf 26 -r 24 "${trimPath}"`);
            if (fs.existsSync(trimPath) && fs.statSync(trimPath).size > 0) { trimmedPaths.push(trimPath); }
            else { trimmedPaths.push(clipPaths[ti]); }
          } catch(e2) { trimmedPaths.push(clipPaths[ti]); }
        }
        const trimConcatFile = path.join(tmpDir, 'trim_list.txt');
        fs.writeFileSync(trimConcatFile, trimmedPaths.map(p => "file '" + p + "'").join('\n'));
        const syncedPath = path.join(tmpDir, 'synced.mp4');
        await filterComplexConcat(ffmpegPath, trimmedPaths, syncedPath);
        if (fs.existsSync(syncedPath) && fs.statSync(syncedPath).size > 0) {
          videoForMix = syncedPath;
          console.log(`✅ Clips synced to voiceover (${perClipDuration.toFixed(1)}s per scene)`);
        }
      } catch(e) {
        console.warn('Per-clip sync failed, falling back to loop:', e.message);
        try {
          const loopedPath = path.join(tmpDir, 'looped.mp4');
          await execAsync(`"${ffmpegPath}" -y -stream_loop -1 -i "${concatPath}" -c:v libx264 -preset ultrafast -crf 26 -t ${audioDuration + 1} "${loopedPath}"`);
          if (fs.existsSync(loopedPath)) { videoForMix = loopedPath; console.log(`✅ Fallback loop applied`); }
        } catch(e2) { console.warn('Loop fallback failed:', e2.message); }
      }
    }

    if (audioPath && musicPath) {
      const mixedAudio = path.join(tmpDir, 'mixed.mp3');
      const vVol = req.body.voiceVolume !== undefined ? Number(req.body.voiceVolume) : 1.0;
      const mVol = req.body.musicVolume !== undefined ? Number(req.body.musicVolume) * 1.5 : 0.45;
      const amixFilter = `[0:a]volume=${vVol}[v];[1:a]volume=${mVol}[m];[v][m]amix=inputs=2:duration=first`;
      await execAsync(`"${ffmpegPath}" -y -i "${audioPath}" -i "${musicPath}" -filter_complex "${amixFilter}" "${mixedAudio}"`);
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${mixedAudio}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 128k -shortest "${outputPath}"`);
    } else if (audioPath) {
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 128k -shortest "${outputPath}"`);
    } else if (musicPath) {
      await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${musicPath}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 128k -shortest "${outputPath}"`);
    } else {
      fs.copyFileSync(videoForMix, outputPath);
    }
    console.log('✅ Audio mixed');

    if (!fs.existsSync(outputPath)) return res.status(500).json({ error: 'Assembly failed' });

    let finalPath = outputPath;
    let srtContent = null;
    if (captions && captionText) {
      try {
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

        srtContent = srt;
        console.log('✅ SRT subtitles generated (' + chunks.length + ' chunks, ' + totalDuration.toFixed(1) + 's)');
      } catch(e) {
        console.warn('SRT generation failed:', e.message);
      }
    }


    // ── Dark vignette edge fade (user-selectable) ────────────────────────────
    if (req.body.vignette !== false) {
      try {
        const vignettePath = path.join(tmpDir, 'vignette.mp4');
        await execAsync(`"${ffmpegPath}" -y -i "${finalPath}" -vf "vignette=angle=0.7854:mode=forward" -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${vignettePath}"`);
        if (fs.existsSync(vignettePath) && fs.statSync(vignettePath).size > 0) {
          finalPath = vignettePath;
          console.log('✅ Dark vignette applied');
        } else {
          console.warn('Vignette produced no output, using pre-vignette video');
        }
      } catch(e) {
        console.warn('Vignette filter failed, continuing without it. FFmpeg error:', e.message, e.stderr || '');
      }
    }
    // ── CTA URL overlay (same as download endpoint) ──────────────────────────
    if (ctaUrl && ctaUrl.trim()) {
      try {
        const ctaPath = path.join(tmpDir, 'cta_yt.mp4');
        const displayText = (ctaText && ctaText.trim()) ? ctaText.trim() : ctaUrl.trim();
        const safeText = displayText.replace(/:/g, '\\:').replace(/'/g, "\\'");
        const startTime = audioDuration > 5 ? audioDuration - 5 : 0;
        const ctaFilter = `drawtext=text='${safeText}':fontsize=26:fontcolor=white:box=1:boxcolor=black@0.75:boxborderw=10:x=(w-text_w)/2:y=h-th-80:enable='gte(t,${startTime.toFixed(1)})'`;
        await execAsync(`"${ffmpegPath}" -y -i "${finalPath}" -vf "${ctaFilter}" -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${ctaPath}"`);
        if (fs.existsSync(ctaPath) && fs.statSync(ctaPath).size > 0) {
          finalPath = ctaPath;
          console.log(`✅ CTA overlay added for YouTube publish`);
        }
      } catch(e) { console.warn('CTA overlay failed for YouTube publish:', e.message); }
    }

    // ── HeyGen PIP overlay (same as download endpoint) ────────────────────────
    if (heygenVideoUrl && heygenVideoUrl.trim()) {
      try {
        const pipVideoPath = path.join(tmpDir, 'heygen_pip_yt.mp4');
        const pipOutputPath = path.join(tmpDir, 'pip_combined_yt.mp4');
        console.log('⬇ Downloading HeyGen avatar for YouTube PIP overlay...');
        const hgRes = await fetch(heygenVideoUrl.trim());
        if (!hgRes.ok) throw new Error(`HeyGen video download failed: ${hgRes.status}`);
        const hgBuf = await hgRes.buffer();
        fs.writeFileSync(pipVideoPath, hgBuf);
        console.log(`✅ HeyGen video downloaded: ${(hgBuf.length/1024/1024).toFixed(1)}MB`);

        const ytLayoutMode = req.body.avatarLayout === 'presenter' ? 'presenter' : 'corner';
        const useChromaKey = heygenGreenScreen === true || heygenBackgroundType === 'greenscreen';
        const ov = buildAvatarOverlayFilter(w, h, ytLayoutMode, useChromaKey);
        console.log(`🎬 YouTube avatar overlay: ${ytLayoutMode} mode`);

        await execAsync(
          `"${ffmpegPath}" -y -i "${finalPath}" -i "${pipVideoPath}" ` +
          `-filter_complex "${ov.filter}" ` +
          `-map "[outv]" -map 0:a? -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${pipOutputPath}"`
        );
        if (fs.existsSync(pipOutputPath) && fs.statSync(pipOutputPath).size > 0) {
          finalPath = pipOutputPath;
          console.log(`✅ Avatar overlay applied for YouTube publish (${ytLayoutMode})`);
        }
      } catch(e) { console.warn('HeyGen PIP overlay failed for YouTube publish:', e.message); }
    }

    const stat = fs.statSync(finalPath);
    console.log(`✅ Assembly complete: ${(stat.size/1024/1024).toFixed(1)}MB at ${w}x${h}${captions ? ' with captions' : ''}${heygenVideoUrl ? ' + HeyGen PIP' : ''}${ctaUrl ? ' + CTA' : ''}`);

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

    const inferredShort = (aspectRatio === '9:16') && (audioDuration > 0 ? audioDuration <= 60 : true);
    const publishAsShort = (typeof isShort === 'boolean') ? isShort : inferredShort;

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

app.get('/api/video/audio/:jobId', async (req, res) => {
  try {
    const fs = (await import('fs')).default;
    const jobId = req.params.jobId;

    // Try the predictable path first (new format)
    const predictablePath = `/tmp/voice_${jobId}.mp3`;
    if (fs.existsSync(predictablePath)) {
      const stat = fs.statSync(predictablePath);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', 'inline; filename="voiceover.mp3"');
      return fs.createReadStream(predictablePath).pipe(res);
    }

    // Fallback: check job result for stored path (old format with timestamp)
    const job = await getJob(jobId);
    const storedPath = job?.result?.audioPath;
    if (storedPath && fs.existsSync(storedPath)) {
      const stat = fs.statSync(storedPath);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', 'inline; filename="voiceover.mp3"');
      return fs.createReadStream(storedPath).pipe(res);
    }

    // Also try glob-style search for old timestamp format
    const tmpFiles = fs.readdirSync('/tmp').filter(f => f.startsWith(`voice_${jobId}`));
    if (tmpFiles.length > 0) {
      const foundPath = `/tmp/${tmpFiles[0]}`;
      const stat = fs.statSync(foundPath);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', 'inline; filename="voiceover.mp3"');
      return fs.createReadStream(foundPath).pipe(res);
    }

    res.status(404).json({ error: 'Audio file not found — it may have been cleared from server memory. Regenerate the voiceover.' });
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
}

function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

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

app.get('/api/voice/options', (_req, res) => {
  res.json({
    voices: [
      { id:'nova',    label:'Nova',    gender:'Female', style:'Warm & friendly',    sample:'Great for UGC and lifestyle content' },
      { id:'shimmer', label:'Shimmer', gender:'Female', style:'Clear & professional',sample:'Great for educational and VSL content' },
      { id:'alloy',   label:'Alloy',   gender:'Female', style:'Versatile & neutral', sample:'Great for any content type' },
      { id:'onyx',    label:'Onyx',    gender:'Male',   style:'Deep & authoritative',sample:'Great for product demos and commercials' },
      { id:'echo',    label:'Echo',    gender:'Male',   style:'Confident & clear',   sample:'Great for tutorials and reviews' },
      { id:'fable',   label:'Fable',   gender:'Male',   style:'Expressive & warm',   sample:'Great for storytelling content' },
    ]
  });
});

// ── Voice preview — hear each voice before selecting ─────────────────────────
app.get('/api/voice/preview/:voiceId', async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY not configured' });
  const validVoices = ['nova','shimmer','alloy','onyx','echo','fable'];
  const voiceId = req.params.voiceId;
  if (!validVoices.includes(voiceId)) return res.status(400).json({ error: 'Invalid voice ID' });

  const SAMPLES = {
    nova:    "Hi, I'm Nova. Warm, friendly, and perfect for lifestyle and UGC content. Here's how I sound reading your script.",
    shimmer: "Hello, I'm Shimmer. Clear and professional — ideal for educational content and video sales letters.",
    alloy:   "Hi there, I'm Alloy. Versatile and neutral, I work well across any content type or topic.",
    onyx:    "I'm Onyx. Deep and authoritative — the voice that commands attention for product demos and commercials.",
    echo:    "Hey, I'm Echo. Confident and clear, great for tutorials, reviews, and direct-response content.",
    fable:   "Hello, I'm Fable. Expressive and warm — perfect for storytelling and content that needs personality.",
  };

  try {
    const fetch = (await import('node-fetch')).default;
    const res2 = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: SAMPLES[voiceId], voice: voiceId, speed: 0.95 }),
    });
    if (!res2.ok) {
      const err = await res2.text();
      return res.status(res2.status).json({ error: `OpenAI TTS: ${res2.status} — ${err.slice(0, 200)}` });
    }
    const buffer = await res2.buffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache for 1hr — same voice always sounds same
    res.send(buffer);
    console.log(`✅ Voice preview served: ${voiceId}`);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});


// ── HeyGen Avatar Video Service ──────────────────────────────────────────────
const HEYGEN_API = 'https://api.heygen.com';

async function heygenRequest(path, method = 'GET', body = null) {
  const fetch = (await import('node-fetch')).default;
  const opts = {
    method,
    headers: {
      'X-Api-Key': process.env.HEYGEN_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(HEYGEN_API + path, opts);
  const data = await res.json();
  if (!res.ok) {
    // HeyGen error shape: { error: { code: 400, message: "..." } } or { message: "..." }
    const errObj = data.error;
    const errMsg = typeof errObj === 'string'
      ? errObj
      : (errObj?.message || errObj?.msg || data.message || data.msg || JSON.stringify(data));
    console.error(`HeyGen API error ${res.status} on ${method} ${path}:`, JSON.stringify(data));
    throw new Error(`HeyGen ${res.status}: ${errMsg}`);
  }
  return data;
}

// List available avatars (filtered to usable ones)

// ── Avatar niche tagger ───────────────────────────────────────────────────────
// HeyGen avatar names contain clues about style/setting — e.g. "Angela in T-shirt",
// "Aditya in Blue Blazer", "Abigail Office Front". We tag each avatar with
// relevant niches so users can filter by topic rather than guessing from names.
function tagAvatarNiches(avatar) {
  const name = (avatar.avatar_name || '').toLowerCase();
  const niches = new Set();

  // ── Clothing / style keyword matching ────────────────────────────────────
  // Business / professional
  if (/blazer|suit|formal|business|office|professional|corporate|meeting/.test(name)) {
    niches.add('home-business');
  }
  // Casual / everyday
  if (/t-shirt|tshirt|casual|sofa|home|relax|jeans|hoodie|sweater|shirt|blouse|vest/.test(name)) {
    niches.add('home-business');
    niches.add('lifestyle');
  }
  // Fitness / athletic
  if (/gym|workout|sport|active|fitness|yoga|athletic|training|running|leggings/.test(name)) {
    niches.add('fitness');
    niches.add('healthy-eating');
  }
  // Cooking / kitchen
  if (/chef|kitchen|cook|apron|food|bak|culinary/.test(name)) {
    niches.add('cooking');
    niches.add('healthy-eating');
  }
  // Wellness / health
  if (/wellness|health|nutri|clean|green|natural|organic/.test(name)) {
    niches.add('healthy-eating');
    niches.add('fitness');
  }

  // ── Body framing — any talking-head format works for home business + lifestyle ──
  if (/upper.body|standing|front|full.body|half.body|close.up/.test(name)) {
    niches.add('home-business');
    niches.add('lifestyle');
  }

  // ── Scene / setting keywords ──────────────────────────────────────────────
  if (/outdoor|garden|park|nature|yard/.test(name)) {
    niches.add('fitness');
    niches.add('lifestyle');
  }

  // ── Color keywords (many avatars are named by outfit color) ──────────────
  // Treat all color-named avatars as general lifestyle/home-business
  if (/blue|black|white|grey|gray|green|brown|beige|navy|tan/.test(name)) {
    niches.add('home-business');
    niches.add('lifestyle');
  }

  // ── Always tag every avatar as lifestyle — ensures filter always shows avatars ──
  niches.add('lifestyle');

  // ── If still only lifestyle (very generic name), also tag home-business ──
  if (niches.size === 1) {
    niches.add('home-business');
  }

  return [...niches];
}

async function listHeyGenAvatars() {
  const data = await heygenRequest('/v2/avatars');
  // HeyGen v2 avatars response: { error: null, data: { avatars: [...] } }
  const rawAvatars = data.data?.avatars || data.avatars || [];
  const avatars = rawAvatars.map(a => ({
    avatar_id:         a.avatar_id,
    avatar_name:       a.avatar_name,
    gender:            a.gender,
    preview_image_url: a.preview_image_url,
    preview_video_url: a.preview_video_url,
    niches:            tagAvatarNiches(a),
  }));
  return avatars;
}

// List available HeyGen voices (English only)
async function listHeyGenVoices() {
  const data = await heygenRequest('/v2/voices');
  const voices = (data.data?.voices || [])
    .filter(v => v.language === 'English' || v.language?.startsWith('en'))
    .slice(0, 50) // cap at 50 for practical display
    .map(v => ({
      voice_id:   v.voice_id,
      name:       v.name,
      language:   v.language,
      gender:     v.gender,
      preview_url: v.preview_audio_url,
    }));
  return voices;
}

// Generate an Avatar IV video from a script
async function generateHeyGenVideo({ avatarId, voiceId, script, aspectRatio = '9:16', backgroundType = 'color', backgroundValue = '#1a2535' }) {
  const fetch = (await import('node-fetch')).default;

  // Pre-flight validation to catch common 400 causes before hitting the API
  if (!avatarId || !avatarId.trim()) throw new Error('avatarId is required — select an avatar first');
  if (!voiceId  || !voiceId.trim())  throw new Error('voiceId is required — select a voice first');
  if (!script   || !script.trim())   throw new Error('script is empty — generate a script first');
  if (script.length > 4900) {
    // HeyGen limit is 5000 chars per segment — trim safely
    script = script.slice(0, 4900);
    console.warn('Script trimmed to 4900 chars for HeyGen limit');
  }

  // Map ContentForge aspect ratios to HeyGen dimensions
  const dimensions = {
    '9:16':  { width: 720,  height: 1280 },
    '16:9':  { width: 1280, height: 720  },
    '1:1':   { width: 720,  height: 720  },
    '4:5':   { width: 720,  height: 900  },
    '4:3':   { width: 960,  height: 720  },
  };
  const dim = dimensions[aspectRatio] || dimensions['9:16'];

  const payload = {
    video_inputs: [{
      character: {
        type:         'avatar',
        avatar_id:    avatarId,
        avatar_style: 'normal',
      },
      voice: {
        type:       'text',
        input_text: script.slice(0, 1500), // HeyGen has a per-segment limit
        voice_id:   voiceId,
        speed:      0.95,
      },
      background: backgroundType === 'image' && backgroundValue
        ? { type: 'image', url: backgroundValue }        // realistic image background
        : { type: 'color', value: backgroundValue || '#18202e' }, // solid color fallback
    }],
    dimension: dim,
    // Enable Avatar IV photorealistic engine
    use_avatar_iv_model: true,
    caption: false, // we burn our own captions via FFmpeg
  };

  const data = await heygenRequest('/v2/video/generate', 'POST', payload);
  const videoId = data.data?.video_id;
  if (!videoId) throw new Error('HeyGen did not return a video_id — check your API balance and avatar_id');
  console.log(`✅ HeyGen video queued: ${videoId}`);
  return videoId;
}

// Poll for video completion and return download URL
async function waitForHeyGenVideo(videoId, maxWaitSeconds = 300) {
  const fetch = (await import('node-fetch')).default;
  const started = Date.now();
  console.log(`⏳ Waiting for HeyGen video ${videoId}...`);

  while ((Date.now() - started) / 1000 < maxWaitSeconds) {
    await new Promise(r => setTimeout(r, 8000)); // poll every 8s
    const data = await heygenRequest(`/v2/video_status.get?video_id=${videoId}`);
    const status = data.data?.status;
    console.log(`HeyGen status: ${status} (${Math.round((Date.now()-started)/1000)}s)`);

    if (status === 'completed') {
      const videoUrl = data.data?.video_url;
      if (!videoUrl) throw new Error('HeyGen completed but no video_url in response');
      console.log(`✅ HeyGen video ready: ${videoUrl}`);
      return videoUrl;
    }
    if (status === 'failed') {
      const reason = data.data?.error?.message || data.data?.failure_code || 'Unknown failure';
      throw new Error(`HeyGen video generation failed: ${reason}`);
    }
  }
  throw new Error(`HeyGen video timed out after ${maxWaitSeconds}s — check HeyGen dashboard for status`);
}


// ── HeyGen API Endpoints ──────────────────────────────────────────────────────

// Check if HeyGen is configured
app.get('/api/heygen/status', (_req, res) => {
  res.json({ configured: !!process.env.HEYGEN_API_KEY });
});

// List available avatars
app.get('/api/heygen/avatars', async (_req, res) => {
  if (!process.env.HEYGEN_API_KEY) return res.status(400).json({ error: 'HEYGEN_API_KEY not configured' });
  try {
    const avatars = await listHeyGenAvatars();
    res.json({ avatars });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// List available voices
app.get('/api/heygen/voices', async (_req, res) => {
  if (!process.env.HEYGEN_API_KEY) return res.status(400).json({ error: 'HEYGEN_API_KEY not configured' });
  try {
    const voices = await listHeyGenVoices();
    res.json({ voices });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Generate a HeyGen avatar video (async — returns videoId immediately, poll for status)
app.post('/api/heygen/generate', async (req, res) => {
  if (!process.env.HEYGEN_API_KEY) return res.status(400).json({ error: 'HEYGEN_API_KEY not configured — add HEYGEN_API_KEY to Railway' });
  const { avatarId, voiceId, script, aspectRatio, backgroundType, backgroundValue } = req.body;
  if (!avatarId) return res.status(400).json({ error: 'avatarId is required' });
  if (!voiceId)  return res.status(400).json({ error: 'voiceId is required' });
  if (!script)   return res.status(400).json({ error: 'script is required' });
  try {
    const videoId = await generateHeyGenVideo({ avatarId, voiceId, script, aspectRatio, backgroundType, backgroundValue });
    res.json({ videoId, status: 'processing', message: 'Video is generating — poll /api/heygen/status/:videoId for updates' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Poll video status
app.get('/api/heygen/video/:videoId', async (req, res) => {
  if (!process.env.HEYGEN_API_KEY) return res.status(400).json({ error: 'HEYGEN_API_KEY not configured' });
  try {
    const data = await heygenRequest(`/v2/video_status.get?video_id=${req.params.videoId}`);
    res.json({
      videoId:  req.params.videoId,
      status:   data.data?.status,
      videoUrl: data.data?.video_url || null,
      error:    data.data?.error?.message || null,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Generate AND wait for completion — for smaller scripts (under ~60s voiceover)
app.post('/api/heygen/generate-and-wait', async (req, res) => {
  if (!process.env.HEYGEN_API_KEY) return res.status(400).json({ error: 'HEYGEN_API_KEY not configured — add HEYGEN_API_KEY to Railway' });
  const { avatarId, voiceId, script, aspectRatio, backgroundType, backgroundValue } = req.body;
  if (!avatarId || !voiceId || !script) return res.status(400).json({ error: 'avatarId, voiceId, and script are required' });
  try {
    const videoId = await generateHeyGenVideo({ avatarId, voiceId, script, aspectRatio, backgroundType, backgroundValue });
    const videoUrl = await waitForHeyGenVideo(videoId, 360); // 6 minute timeout
    res.json({ videoId, videoUrl, status: 'completed' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});


// ── Image URL → video clip (Ken Burns pan/zoom effect) ───────────────────────
// Converts a static photo/image to a video clip that fits the selected aspect ratio
// Uses FFmpeg's zoompan filter for smooth Ken Burns motion
app.post('/api/video/image-to-clip', async (req, res) => {
  const { imageUrl, aspectRatio = '9:16', duration = 6 } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

  const RATIO_MAP = {
    '9:16':  { w: 720,  h: 1280 },
    '16:9':  { w: 1280, h: 720  },
    '1:1':   { w: 720,  h: 720  },
    '4:5':   { w: 720,  h: 900  },
    '4:3':   { w: 960,  h: 720  },
  };
  const { w, h } = RATIO_MAP[aspectRatio] || RATIO_MAP['9:16'];
  const fps = 24;
  const totalFrames = duration * fps;

  try {
    const fetch   = (await import('node-fetch')).default;
    const fs      = (await import('fs')).default;
    const path    = (await import('path')).default;
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const ffmpegPath = FFMPEG_PATH;

    const tmpDir = `/tmp/img2clip_${Date.now()}`;
    fs.mkdirSync(tmpDir, { recursive: true });
    const imgPath = path.join(tmpDir, 'source.jpg');
    const outPath = path.join(tmpDir, 'clip.mp4');

    // Download the image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      fs.rmSync(tmpDir, { recursive: true });
      return res.status(400).json({ error: `Could not download image: ${imgRes.status}` });
    }
    const imgBuf = await imgRes.buffer();
    fs.writeFileSync(imgPath, imgBuf);
    console.log(`✅ Image downloaded for Ken Burns: ${(imgBuf.length/1024).toFixed(0)}KB`);

    // Ken Burns zoompan filter:
    // Start slightly zoomed in, slowly pan from center-left to center-right
    // Scale image to fill target dimensions first, then apply zoompan
    const zoomFilter = [
      // Scale image to fill frame (larger than target so zoom has room)
      `scale=${w*2}:${h*2}:force_original_aspect_ratio=increase,`,
      // Crop to exact frame size (center)
      `crop=${w*2}:${h*2}:(iw-${w*2})/2:(ih-${h*2})/2,`,
      // Ken Burns: slow zoom from 1.0 to 1.1 across the duration
      `zoompan=z='if(lte(zoom,1.0),1.0,min(zoom+0.0005,1.1))':`,
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':`,
      `d=${totalFrames}:s=${w}x${h}:fps=${fps}`,
    ].join('');

    await execAsync(
      `"${ffmpegPath}" -y -loop 1 -i "${imgPath}" ` +
      `-vf "${zoomFilter}" ` +
      `-c:v libx264 -preset ultrafast -crf 22 -t ${duration} ` +
      `-pix_fmt yuv420p "${outPath}"`
    );

    if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
      fs.rmSync(tmpDir, { recursive: true });
      return res.status(500).json({ error: 'Ken Burns video generation failed' });
    }

    const stat = fs.statSync(outPath);
    console.log(`✅ Image-to-clip complete: ${(stat.size/1024/1024).toFixed(1)}MB at ${w}x${h} (${duration}s)`);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="image-clip.mp4"');
    res.setHeader('Content-Length', stat.size);
    const stream = fs.createReadStream(outPath);
    stream.pipe(res);
    stream.on('end', () => { try { fs.rmSync(tmpDir, { recursive: true }); } catch {} });

  } catch(e) {
    console.error('image-to-clip error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ── Generate a custom photo avatar from description ───────────────────────────
// Uses HeyGen's photo avatar API to create a new avatar from text parameters
// No existing avatar needed — HeyGen generates one from age/gender/style/appearance
app.post('/api/heygen/create-avatar', async (req, res) => {
  if (!process.env.HEYGEN_API_KEY) return res.status(400).json({ error: 'HEYGEN_API_KEY not configured' });
  const {
    name         = 'ContentForge Avatar',
    age          = 'Unspecified',
    gender       = 'Woman',
    ethnicity    = 'American',
    orientation  = 'vertical',
    pose         = 'half_body',
    style        = 'Realistic',
    appearance   = 'A professional person in a home office setting, business casual attire, friendly expression',
  } = req.body;

  try {
    const data = await heygenRequest('/v2/photo_avatar/photo/generate', 'POST', {
      name, age, gender, ethnicity, orientation, pose, style, appearance,
    });
    // Returns { error: null, data: { generation_id: "..." } }
    const generationId = data.data?.generation_id;
    if (!generationId) throw new Error('HeyGen did not return a generation_id — check your API balance');
    console.log(`✅ Photo avatar generation started: ${generationId}`);
    res.json({
      generationId,
      message: 'Photo avatar is generating. Poll /api/heygen/avatar-status/:generationId to check progress.',
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Poll photo avatar generation status ───────────────────────────────────────
app.get('/api/heygen/avatar-status/:generationId', async (req, res) => {
  if (!process.env.HEYGEN_API_KEY) return res.status(400).json({ error: 'HEYGEN_API_KEY not configured' });
  try {
    const data = await heygenRequest(`/v2/photo_avatar/photo/generate/${req.params.generationId}`);
    const status   = data.data?.status;
    const avatarId = data.data?.avatar_id;
    const imageUrl = data.data?.image_url;
    res.json({ status, avatarId, imageUrl, generationId: req.params.generationId });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Niche avatar suggestions — curated list of avatar name keywords per niche ─
app.get('/api/heygen/niche-suggestions/:niche', (_req, res) => {
  // HeyGen exact valid values:
  // age: Young Adult | Early Middle Age | Late Middle Age | Senior | Unspecified
  // gender: Woman | Man | Unspecified
  // ethnicity: White | Black | Asian American | East Asian | South East Asian | South Asian | Middle Eastern | Pacific | Hispanic | Unspecified
  // style: Realistic | Pixar | Cinematic | Vintage | Noir | Cyberpunk | Unspecified
  const suggestions = {
    'home-business': [
      { label: 'Black woman — casual home office', appearance: 'Confident Black woman in a relaxed casual blazer over a simple t-shirt, warm natural lighting, home office with plants and bookshelves in background, genuine friendly smile, approachable and real', gender: 'Woman', age: 'Early Middle Age', ethnicity: 'Black', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1280&q=80' },
      { label: 'Hispanic man — kitchen table side hustle', appearance: 'Hispanic man in casual t-shirt and jeans, sitting at a bright kitchen table with laptop, relaxed entrepreneurial vibe, natural morning light, warm relatable expression', gender: 'Man', age: 'Young Adult', ethnicity: 'Hispanic', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1280&q=80' },
      { label: 'Asian American woman — cozy home desk', appearance: 'Asian American woman in a cozy sweater, seated at a modern desk with warm lamp light, comfortable home workspace, notebooks and coffee cup visible, approachable and energetic', gender: 'Woman', age: 'Young Adult', ethnicity: 'Asian American', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1280&q=80' },
      { label: 'White woman — sofa casual creator', appearance: 'White woman in relaxed casual clothing sitting on a cozy couch, laptop on lap, bright living room with natural window light, genuine laugh, very approachable and real', gender: 'Woman', age: 'Early Middle Age', ethnicity: 'White', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1280&q=80' },
      { label: 'South Asian man — bookshelf home office', appearance: 'South Asian man in smart casual button shirt, home office with full bookshelf background, confident posture, warm expression, natural desk lighting', gender: 'Man', age: 'Early Middle Age', ethnicity: 'South Asian', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=80' },
      { label: 'Black man — outdoor side hustle energy', appearance: 'Black man in casual hoodie and cap, outdoors in a sunny neighborhood, energetic and motivated expression, natural sunlight, relatable everyday look', gender: 'Man', age: 'Young Adult', ethnicity: 'Black', style: 'Realistic', backgroundType: 'color', backgroundUrl: '' },
    ],
    'healthy-eating': [
      { label: 'Hispanic woman — colorful kitchen', appearance: 'Hispanic woman in a light floral apron, bright colorful kitchen, holding fresh vegetables, genuine warm smile, natural window sunlight, relaxed and welcoming', gender: 'Woman', age: 'Early Middle Age', ethnicity: 'Hispanic', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1280&q=80' },
      { label: 'East Asian man — smoothie kitchen', appearance: 'East Asian man in casual t-shirt, clean modern white kitchen, holding a green smoothie, fresh and healthy aesthetic, natural morning light, relaxed confident expression', gender: 'Man', age: 'Young Adult', ethnicity: 'East Asian', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1280&q=80' },
      { label: 'Black woman — wellness lifestyle kitchen', appearance: 'Black woman in comfortable athletic wear, bright sunlit kitchen with fruit on counter, genuine joyful smile, natural hair, vibrant healthy energy', gender: 'Woman', age: 'Young Adult', ethnicity: 'Black', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1280&q=80' },
      { label: 'South Asian woman — casual meal prep', appearance: 'South Asian woman in casual everyday clothes, preparing colorful meal at kitchen counter, relaxed and happy expression, warm home kitchen atmosphere', gender: 'Woman', age: 'Early Middle Age', ethnicity: 'South Asian', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1280&q=80' },
    ],
    'fitness': [
      { label: 'Black woman — outdoor park fitness', appearance: 'Athletic Black woman in colorful workout gear, outdoor park setting with trees and morning light, energetic motivational expression, natural and powerful presence', gender: 'Woman', age: 'Young Adult', ethnicity: 'Black', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1280&q=80' },
      { label: 'Hispanic man — home gym casual', appearance: 'Hispanic man in athletic shorts and casual gym t-shirt, home gym background with weights visible, confident approachable expression, natural lighting', gender: 'Man', age: 'Young Adult', ethnicity: 'Hispanic', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1280&q=80' },
      { label: 'Asian American woman — yoga wellness', appearance: 'Asian American woman in soft yoga clothes, peaceful bright wellness studio or living room, calm encouraging expression, natural light, serene and grounded', gender: 'Woman', age: 'Early Middle Age', ethnicity: 'Asian American', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1280&q=80' },
      { label: 'White man — outdoor running casual', appearance: 'White man in casual running gear, outdoor neighborhood street, post-run relaxed confident smile, natural afternoon light, everyday fitness look', gender: 'Man', age: 'Early Middle Age', ethnicity: 'White', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1280&q=80' },
    ],
    'cooking': [
      { label: 'Black woman — home baker cozy kitchen', appearance: 'Black woman in a flour-dusted casual apron, cozy home kitchen with baked goods visible on counter, joyful authentic expression, warm natural light', gender: 'Woman', age: 'Early Middle Age', ethnicity: 'Black', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1280&q=80' },
      { label: 'Hispanic man — casual home chef', appearance: 'Hispanic man in casual apron over everyday clothes, colorful ingredients on kitchen counter, approachable home chef energy, warm kitchen lighting, excited about cooking', gender: 'Man', age: 'Early Middle Age', ethnicity: 'Hispanic', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1280&q=80' },
      { label: 'South East Asian woman — recipe creator', appearance: 'South East Asian woman in light casual t-shirt, bright modern kitchen, chopping colorful vegetables, genuine smile, natural window light, relaxed cooking energy', gender: 'Woman', age: 'Young Adult', ethnicity: 'South East Asian', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1280&q=80' },
      { label: 'White woman — casual baking lifestyle', appearance: 'White woman in cozy everyday clothes and simple apron, baking at a wooden kitchen counter, warm rustic kitchen atmosphere, relaxed joyful expression', gender: 'Woman', age: 'Early Middle Age', ethnicity: 'White', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1280&q=80' },
    ],
    'lifestyle': [
      { label: 'Black woman — outdoor casual creator', appearance: 'Black woman in casual stylish outfit, outdoor urban setting with natural greenery, relaxed confident expression, natural sunlight, modern lifestyle energy', gender: 'Woman', age: 'Young Adult', ethnicity: 'Black', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1280&q=80' },
      { label: 'East Asian man — cozy living room', appearance: 'East Asian man in relaxed casual clothes, bright cozy living room setting, warm lamp light, genuine friendly smile, approachable everyday lifestyle', gender: 'Man', age: 'Early Middle Age', ethnicity: 'East Asian', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1280&q=80' },
      { label: 'Hispanic woman — coffee shop creative', appearance: 'Hispanic woman in casual trendy outfit, cozy coffee shop background, laptop and coffee visible, creative lifestyle energy, warm ambient light', gender: 'Woman', age: 'Young Adult', ethnicity: 'Hispanic', style: 'Realistic', backgroundType: 'image', backgroundUrl: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1280&q=80' },
    ],
  };
  const niche = _req.params.niche;
  res.json({ suggestions: suggestions[niche] || suggestions['home-business'] });
});

// ── Delete a video job (and optionally its R2 file) ──────────────────────────
app.delete('/api/video/job/:jobId', async (req, res) => {
  const { jobId } = req.params;
  try {
    // Get the job first to find its R2 key
    const job = await getJob(jobId);
    const r2Key = job?.result?.r2Key;

    // Delete from R2 if we have a key
    if (r2Key && process.env.R2_BUCKET_NAME) {
      try {
        const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const r2 = new S3Client({
          region: 'auto',
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId:     process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
        });
        await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: r2Key }));
        console.log(`✅ Deleted from R2: ${r2Key}`);
      } catch(e) { console.warn('R2 delete failed:', e.message); }
    }

    // Delete from Supabase video_jobs table
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        await db.from('video_jobs').delete().eq('id', jobId);
        console.log(`✅ Job ${jobId} deleted from Supabase`);
      } catch(e) { console.warn('Supabase delete failed:', e.message); }
    }

    // Also clean up any temp audio files
    try {
      const fs = (await import('fs')).default;
      const predictable = `/tmp/voice_${jobId}.mp3`;
      if (fs.existsSync(predictable)) fs.unlinkSync(predictable);
    } catch {}

    res.json({ deleted: true, jobId, r2Key: r2Key || null });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── List saved videos (jobs with finalVideoUrl) ────────────────────────────────
app.get('/api/video/saved', async (_req, res) => {
  try {
    const jobs = await getAllJobs();
    const saved = jobs.filter(j => j.result?.finalVideoUrl || j.result?.autoAssembled);
    res.json(saved);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});


// ── Direct video download — serves assembled video from Railway temp storage ──
// Fallback when R2 is unavailable — video lives in /tmp/auto_final_${jobId}.mp4
app.get('/api/video/download/:jobId', async (req, res) => {
  try {
    const fs   = (await import('fs')).default;
    const path = (await import('path')).default;
    const jobId = req.params.jobId;

    // Check stable path first
    const stablePath = `/tmp/auto_final_${jobId}.mp4`;
    if (fs.existsSync(stablePath)) {
      const stat = fs.statSync(stablePath);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `attachment; filename="contentforge-${jobId}.mp4"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return fs.createReadStream(stablePath).pipe(res);
    }

    // Check job result for R2 URL (redirect)
    const job = await getJob(jobId);
    if (job?.result?.finalVideoUrl && job.result.finalVideoUrl.startsWith('http')) {
      return res.redirect(302, job.result.finalVideoUrl);
    }

    res.status(404).json({ error: 'Video file not found. It may have been cleared from server memory. Try regenerating.' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});


// ── filterComplexConcat: join video files without using concat demuxer ────────
// Railway's container sandbox blocks the concat demuxer file reader.
// This function joins clips using -filter_complex which works in all environments.
async function filterComplexConcat(ffmpegPath, inputPaths, outputPath, extraArgs = '') {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  const fs = (await import('fs')).default;

  if (inputPaths.length === 0) throw new Error('filterComplexConcat: no input paths');

  // Single clip — just copy it
  if (inputPaths.length === 1) {
    fs.copyFileSync(inputPaths[0], outputPath);
    return;
  }

  const inputArgs  = inputPaths.map(p => `-i "${p}"`).join(' ');
  const filterIn   = inputPaths.map((_, i) => `[${i}:v]`).join('');
  const filterExpr = `${filterIn}concat=n=${inputPaths.length}:v=1:a=0[outv]`;
  const cmd = `"${ffmpegPath}" -y ${inputArgs} -filter_complex "${filterExpr}" -map "[outv]" -c:v libx264 -preset ultrafast -crf 26 -r 24 -vsync cfr ${extraArgs} "${outputPath}"`;
  await execAsync(cmd);
}


// ── buildAvatarOverlayFilter: places HeyGen avatar over scene video ──────────
// layoutMode: 'corner' = small box bottom-right (28% width)
//             'presenter' = large centered avatar (scene behind, avatar in front)
// useChromaKey: removes green screen so avatar has no background box
function buildAvatarOverlayFilter(w, h, layoutMode, useChromaKey) {
  let avW, avH, avX, avY;
  if (layoutMode === 'presenter') {
    // Large presenter — avatar ~72% of frame height, centered, standing at bottom
    avH = Math.round(h * 0.78);
    avW = Math.round(avH * (9/16)); // avatar source is 9:16 portrait
    if (avW > w * 0.92) { avW = Math.round(w * 0.92); avH = Math.round(avW * (16/9)); }
    avX = Math.round((w - avW) / 2);   // horizontally centered
    avY = h - avH;                      // anchored to the bottom edge
  } else {
    // Corner box — 28% width, bottom-right
    avW = Math.round(w * 0.28);
    avH = Math.round(avW * (16/9));
    avX = w - avW - 16;
    avY = h - avH - 80;
  }

  let filter;
  if (useChromaKey) {
    filter = [
      `[1:v]scale=${avW}:${avH}:force_original_aspect_ratio=decrease,`,
      `pad=${avW}:${avH}:(ow-iw)/2:(oh-ih)/2:black@0,`,
      `chromakey=0x00b140:0.3:0.05,`,
      `setsar=1[avatar];`,
      `[0:v][avatar]overlay=${avX}:${avY}:format=auto[outv]`
    ].join('');
  } else {
    filter = [
      `[1:v]scale=${avW}:${avH}:force_original_aspect_ratio=decrease,`,
      `pad=${avW}:${avH}:(ow-iw)/2:(oh-ih)/2:black,`,
      `setsar=1[avatar];`,
      `[0:v][avatar]overlay=${avX}:${avY}:format=auto[outv]`
    ].join('');
  }
  return { filter, avW, avH, avX, avY };
}



// ── FULL AUTO WORKFLOW ────────────────────────────────────────────────────────
// One endpoint that handles everything: script, voiceover, avatar selection,
// HeyGen avatar video, Pexels scene clips, assembly, CTA burn — one MP4 output
// The user provides: topic, affiliateUrl, affiliateText, niche, aspectRatio, avatarLayout
app.post('/api/workflow/create', async (req, res) => {
  const {
    topic        = '',
    affiliateUrl = '',
    affiliateText = '',
    niche        = 'home-business',
    aspectRatio  = '9:16',
    avatarLayout = 'presenter',
    voice        = 'nova',
    duration     = '30s',
    persona      = 'ugc',
  } = req.body;

  if (!topic.trim()) return res.status(400).json({ error: 'topic is required' });

  const jobId = 'wf_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const job = {
    id: jobId, status: 'processing', progress: 0,
    step: 'Starting full auto workflow…',
    topic, affiliateUrl, niche, aspectRatio, avatarLayout,
    createdAt: new Date().toISOString(),
    result: null, error: null,
  };
  workflowJobs.set(jobId, job);
  res.json({ jobId, status: 'processing' });

  // Run async — do not await
  runFullWorkflow(jobId, { topic, affiliateUrl, affiliateText, niche, aspectRatio, avatarLayout, voice, duration, persona }).catch(e => {
    const j = workflowJobs.get(jobId);
    if (j) { j.status = 'failed'; j.error = e.message; j.step = '❌ Workflow failed: ' + e.message.slice(0,100); }
    console.error('Workflow failed:', e.message);
  });
});

app.get('/api/workflow/:jobId', (req, res) => {
  const job = workflowJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Workflow job not found' });
  res.json(job);
});

app.get('/api/workflow', (_req, res) => {
  const jobs = [...workflowJobs.values()].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,20);
  res.json({ jobs });
});

app.delete('/api/workflow/:jobId', async (req, res) => {
  const job = workflowJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Not found' });
  // Delete R2 file if present
  if (job.result?.r2Key && process.env.R2_BUCKET_NAME) {
    try {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const r2 = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
      await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: job.result.r2Key }));
    } catch(e) { console.warn('R2 delete failed:', e.message); }
  }
  workflowJobs.delete(req.params.jobId);
  res.json({ deleted: true, jobId: req.params.jobId });
});

// In-memory workflow store (survives restarts if R2 is enabled)
const workflowJobs = new Map();

async function updateWorkflow(jobId, update) {
  const job = workflowJobs.get(jobId);
  if (job) Object.assign(job, update);
}

async function runFullWorkflow(jobId, params) {
  const { topic, affiliateUrl, affiliateText, niche, aspectRatio, avatarLayout, voice, duration, persona } = params;
  const fetch = (await import('node-fetch')).default;
  const fs    = (await import('fs')).default;
  const path  = (await import('path')).default;
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  const ffmpegPath = FFMPEG_PATH;
  const tmpDir = `/tmp/wf_${jobId}`;
  fs.mkdirSync(tmpDir, { recursive: true });

  // ── STEP 1: Generate script ──────────────────────────────────────────────
  await updateWorkflow(jobId, { progress: 8, step: '✍️ Writing script…' });
  const script = await generateScript({ inputMode: 'topic', topic, persona, duration, platforms: ['facebook', 'tiktok'], videoType: 'auto', niche });
  if (!script?.fullScript) throw new Error('Script generation failed');
  await updateWorkflow(jobId, { progress: 16, step: '🎙 Generating voiceover…', script });

  // ── STEP 2: Generate voiceover ───────────────────────────────────────────
  let audioPath = null;
  if (!process.env.OPENAI_API_KEY) {
    await updateWorkflow(jobId, { step: '⚠️ No OPENAI_API_KEY in Railway — video will have no voiceover. Add it in Railway Variables.' });
    console.warn('Workflow: OPENAI_API_KEY missing — skipping voiceover');
  } else {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const ttsVoice = ['nova','shimmer','alloy','onyx','echo','fable'].includes(voice) ? voice : 'nova';
      const speechRes = await openai.audio.speech.create({ model: 'tts-1-hd', voice: ttsVoice, input: script.fullScript.slice(0, 4096) });
      const buf = Buffer.from(await speechRes.arrayBuffer());
      if (!buf || buf.length < 1000) throw new Error('TTS returned empty audio — check OpenAI account status');
      audioPath = `/tmp/voice_${jobId}.mp3`;
      fs.writeFileSync(audioPath, buf);
      console.log(`✅ Voiceover: ${(buf.length/1024).toFixed(0)}KB`);
      await updateWorkflow(jobId, { step: '🎙 Voiceover ready (' + (buf.length/1024).toFixed(0) + 'KB)' });
    } catch(e) {
      console.warn('Voiceover failed:', e.message);
      await updateWorkflow(jobId, { step: '⚠️ Voiceover failed: ' + e.message.slice(0,80) + ' — continuing without audio' });
    }
  }
  await updateWorkflow(jobId, { progress: 24, step: '🎭 Selecting best avatar for niche…' });

  // ── STEP 3: Auto-select avatar by niche ──────────────────────────────────
  let avatarId = null;
  let avatarName = '';
  if (process.env.HEYGEN_API_KEY) {
    try {
      const avatars = await listHeyGenAvatars();
      // Filter by niche tags, prefer avatars tagged for this niche
      const nicheMap = { 'home-business': 'home-business', 'healthy-eating': 'healthy-eating', 'fitness': 'fitness', 'cooking': 'cooking', 'lifestyle': 'lifestyle' };
      const targetNiche = nicheMap[niche] || 'lifestyle';
      let candidates = avatars.filter(a => a.niches && a.niches.includes(targetNiche));
      if (candidates.length === 0) candidates = avatars; // fallback to all
      // Pick deterministically based on topic (same topic → same avatar every time)
      const topicHash = topic.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const picked = candidates[topicHash % candidates.length];
      avatarId = picked.avatar_id;
      avatarName = picked.avatar_name;
      console.log(`✅ Auto-selected avatar: ${avatarName} (niche: ${targetNiche})`);
    } catch(e) { console.warn('Avatar selection failed:', e.message); }
  }
  await updateWorkflow(jobId, { progress: 32, step: `🎭 Generating HeyGen avatar video (${avatarName || 'default'})…`, avatarName });

  // ── STEP 4: Generate HeyGen avatar video (fire and track) ────────────────
  let heygenVideoUrl = null;
  let heygenVideoId  = null;
  if (!process.env.HEYGEN_API_KEY) {
    await updateWorkflow(jobId, { step: '⚠️ No HEYGEN_API_KEY — skipping avatar. Video will use scenes only.' });
  } else if (!avatarId) {
    await updateWorkflow(jobId, { step: '⚠️ No avatar found for this niche — skipping avatar overlay.' });
  } else {
    try {
      const hgData = await generateHeyGenVideo({
        avatarId,
        voiceId: await getDefaultVoiceForNiche(niche),
        script: script.fullScript,
        aspectRatio,
        backgroundType: 'color',
        backgroundValue: '#00b140',
      });
      heygenVideoId = hgData.videoId;
      await updateWorkflow(jobId, { step: '⏳ HeyGen rendering avatar (' + heygenVideoId + ')…', heygenVideoId });

      // Poll up to 35 min
      const pollStart = Date.now();
      while (Date.now() - pollStart < 35 * 60 * 1000) {
        await new Promise(r => setTimeout(r, 30000));
        const elapsed = Math.round((Date.now() - pollStart) / 60000);
        await updateWorkflow(jobId, { step: '⏳ HeyGen rendering… ' + elapsed + ' min elapsed (up to 35 min)' });
        try {
          const pollData = await waitForHeyGenVideo(heygenVideoId, 1);
          if (pollData?.videoUrl) { heygenVideoUrl = pollData.videoUrl; break; }
        } catch(e) { if (e.message.includes('failed')) throw e; }
      }
      if (!heygenVideoUrl) {
        await updateWorkflow(jobId, { step: '⚠️ HeyGen did not finish in 35 min — video ID: ' + heygenVideoId + '. Use the manual combine tab to add avatar later.' });
      }
    } catch(e) {
      console.warn('HeyGen generation failed:', e.message);
      const isCredit = e.message.includes('credit') || e.message.includes('Credit') || e.message.includes('400');
      await updateWorkflow(jobId, {
        step: isCredit
          ? '⚠️ HeyGen API credits empty — add balance at heygen.com/api. Video will download without avatar. You can add avatar later using the manual upload in the Result tab.'
          : '⚠️ HeyGen avatar failed: ' + e.message.slice(0,80) + ' — continuing without avatar',
        heygenError: e.message,
      });
    }
  }
  await updateWorkflow(jobId, { progress: 56, step: '🔍 Extracting scene keywords…' });

  // ── STEP 5: Extract keywords and fetch Pexels clips ──────────────────────
  const sentences = (script.fullScript || '').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 10);
  const maxScenes = Math.min(sentences.length, 8);
  const selected  = sentences.slice(0, maxScenes);

  const keywords = await Promise.all(selected.map(async (sentence, i) => {
    const kw = await extractKeywordForPhrase(sentence, { position: i, total: selected.length, niche, topic });
    return { phrase: sentence, keyword: kw };
  }));

  await updateWorkflow(jobId, { progress: 64, step: `🎬 Fetching ${keywords.length} Pexels clips…` });

  const clips = [];
  for (let i = 0; i < keywords.length; i++) {
    try {
      const clip = await generateClip(keywords[i].phrase, 12, aspectRatio);
      if (clip?.videoUrl) clips.push({ ...keywords[i], videoUrl: clip.videoUrl });
    } catch(e) { console.warn(`Clip ${i+1} failed:`, e.message); }
  }

  if (clips.length === 0) throw new Error('No Pexels clips could be fetched — check Pexels API key');
  await updateWorkflow(jobId, { progress: 72, step: '🎞 Assembling final video…' });

  // ── STEP 6: Assemble clips + voiceover ──────────────────────────────────
  const DIM = { '9:16':{w:720,h:1280},'16:9':{w:1280,h:720},'1:1':{w:720,h:720},'4:5':{w:720,h:900},'4:3':{w:960,h:720} };
  const { w, h } = DIM[aspectRatio] || DIM['9:16'];
  const scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;

  // Download and normalize clips
  const clipPaths = [];
  for (let i = 0; i < clips.length; i++) {
    try {
      const rawPath  = path.join(tmpDir, `raw_${i}.mp4`);
      const normPath = path.join(tmpDir, `norm_${i}.mp4`);
      const dlRes = await fetch(clips[i].videoUrl);
      if (!dlRes.ok) throw new Error(`HTTP ${dlRes.status}`);
      const buf = await dlRes.buffer();
      if (buf.length < 1000) throw new Error('Clip too small');
      fs.writeFileSync(rawPath, buf);
      await execAsync(`"${ffmpegPath}" -y -i "${rawPath}" -vf "${scaleFilter}" -c:v libx264 -preset ultrafast -crf 26 -r 24 -an "${normPath}"`);
      if (fs.existsSync(normPath) && fs.statSync(normPath).size > 1000) clipPaths.push(normPath);
    } catch(e) { console.warn(`Clip ${i} failed:`, e.message); }
  }
  if (clipPaths.length === 0) throw new Error('All clips failed to normalize');

  // Get audio duration
  let audioDuration = 0;
  if (audioPath && fs.existsSync(audioPath)) {
    const probe = await execAsync(`"${ffmpegPath}" -i "${audioPath}" -f null /dev/null`).catch(e => ({ stderr: e.stderr || '' }));
    const m = (probe.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (m) audioDuration = parseInt(m[1])*3600 + parseInt(m[2])*60 + parseFloat(m[3]);
    else audioDuration = fs.statSync(audioPath).size / 16000;
  }

  // Trim clips to audio duration
  let videoForMix = null;
  if (audioDuration > 0) {
    const perClip = audioDuration / clipPaths.length;
    const trimmed = [];
    for (let i = 0; i < clipPaths.length; i++) {
      const tp = path.join(tmpDir, `trim_${i}.mp4`);
      try {
        await execAsync(`"${ffmpegPath}" -y -i "${clipPaths[i]}" -t ${perClip.toFixed(3)} -c:v libx264 -preset ultrafast -crf 26 -r 24 "${tp}"`);
        if (fs.existsSync(tp) && fs.statSync(tp).size > 1000) trimmed.push(tp);
        else trimmed.push(clipPaths[i]);
      } catch { trimmed.push(clipPaths[i]); }
    }
    const syncPath = path.join(tmpDir, 'synced.mp4');
    await filterComplexConcat(ffmpegPath, trimmed, syncPath);
    if (fs.existsSync(syncPath) && fs.statSync(syncPath).size > 10000) videoForMix = syncPath;
  }
  if (!videoForMix) {
    const concatPath = path.join(tmpDir, 'concat.mp4');
    await filterComplexConcat(ffmpegPath, clipPaths, concatPath);
    if (fs.existsSync(concatPath) && fs.statSync(concatPath).size > 10000) videoForMix = concatPath;
    else throw new Error('Clip concatenation failed');
  }

  // Attach audio
  const stablePath = `/tmp/wf_final_${jobId}.mp4`;
  if (audioPath && fs.existsSync(audioPath)) {
    await execAsync(`"${ffmpegPath}" -y -i "${videoForMix}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 128k -shortest "${stablePath}"`);
  } else {
    fs.copyFileSync(videoForMix, stablePath);
  }
  if (!fs.existsSync(stablePath) || fs.statSync(stablePath).size < 10000) throw new Error('Final video assembly failed');
  await updateWorkflow(jobId, { progress: 80, step: '🎭 Compositing avatar overlay…' });

  // ── STEP 7: Composite HeyGen avatar over scenes ──────────────────────────
  if (heygenVideoUrl) {
    try {
      const pipPath = path.join(tmpDir, 'avatar.mp4');
      const pipOut  = path.join(tmpDir, 'with_avatar.mp4');
      const hgRes   = await fetch(heygenVideoUrl);
      if (hgRes.ok) {
        const hgBuf = await hgRes.buffer();
        fs.writeFileSync(pipPath, hgBuf);
        const { filter } = buildAvatarOverlayFilter(w, h, avatarLayout, true); // green screen always on
        await execAsync(`"${ffmpegPath}" -y -i "${stablePath}" -i "${pipPath}" -filter_complex "${filter}" -map "[outv]" -map 0:a? -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${pipOut}"`);
        if (fs.existsSync(pipOut) && fs.statSync(pipOut).size > fs.statSync(stablePath).size * 0.5) {
          fs.copyFileSync(pipOut, stablePath);
          console.log('✅ Avatar composite applied');
        }
      }
    } catch(e) { console.warn('Avatar composite failed, continuing without:', e.message); }
  }
  await updateWorkflow(jobId, { progress: 88, step: '🔗 Burning affiliate link into video…' });

  // ── STEP 8: Burn affiliate CTA into final 5 seconds ─────────────────────
  if (affiliateUrl && affiliateUrl.trim()) {
    try {
      const probe2 = await execAsync(`"${ffmpegPath}" -i "${stablePath}" -f null /dev/null`).catch(e => ({ stderr: e.stderr || '' }));
      const m2 = (probe2.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      const totalDur = m2 ? parseInt(m2[1])*3600 + parseInt(m2[2])*60 + parseFloat(m2[3]) : 30;
      const ctaStart = Math.max(0, totalDur - 5);
      const display  = (affiliateText || affiliateUrl).trim().replace(/'/g, '').replace(/:/g, '\\:').slice(0, 50);
      const ctaPath  = path.join(tmpDir, 'cta.mp4');
      const ctaFilter = `drawtext=text='${display}':fontsize=28:fontcolor=white:box=1:boxcolor=black@0.75:boxborderw=8:x=(w-text_w)/2:y=h-th-80:enable='gte(t,${ctaStart.toFixed(1)})'`;
      await execAsync(`"${ffmpegPath}" -y -i "${stablePath}" -vf "${ctaFilter}" -c:v libx264 -preset ultrafast -crf 22 -c:a copy "${ctaPath}"`);
      if (fs.existsSync(ctaPath) && fs.statSync(ctaPath).size > 0) {
        fs.copyFileSync(ctaPath, stablePath);
        console.log('✅ Affiliate CTA burned in');
      }
    } catch(e) { console.warn('CTA burn failed:', e.message); }
  }
  await updateWorkflow(jobId, { progress: 95, step: '☁️ Uploading to storage…' });

  // ── STEP 9: Upload to R2 or serve directly ───────────────────────────────
  let finalVideoUrl = null;
  let r2Key = null;
  if (process.env.R2_BUCKET_NAME && fs.existsSync(stablePath)) {
    try {
      r2Key = `workflows/${jobId}.mp4`;
      finalVideoUrl = await uploadToR2AndSign(stablePath, r2Key, 86400 * 30);
      console.log(`✅ Uploaded to R2: ${r2Key}`);
    } catch(e) { console.warn('R2 upload failed:', e.message); }
  }
  if (!finalVideoUrl) finalVideoUrl = `/api/video/download-workflow/${jobId}`;

  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}

  await updateWorkflow(jobId, {
    status: 'completed', progress: 100,
    step: '✅ Video ready to download!',
    result: {
      finalVideoUrl, r2Key, stablePath,
      script, avatarName, heygenVideoId,
      clipsCount: clips.length,
      hasAvatar: !!heygenVideoUrl,
      hasAffiliate: !!affiliateUrl,
      aspectRatio,
      savedAt: new Date().toISOString(),
    },
  });
  console.log(`✅ Workflow ${jobId} complete`);
}

// Helper: pick a HeyGen voice that matches the niche
async function getDefaultVoiceForNiche(niche) {
  try {
    const voices = await listHeyGenVoices();
    const nicheVoiceHints = { 'home-business': 'nova', 'cooking': 'warm', 'fitness': 'energetic', 'healthy-eating': 'soft' };
    // Just return first English female voice as safe default
    const v = voices.find(v => v.language === 'English' || v.language?.startsWith('en'));
    return v?.voice_id || voices[0]?.voice_id;
  } catch { return null; }
}

// Direct serve endpoint for workflow videos
app.get('/api/video/download-workflow/:jobId', async (req, res) => {
  const fs = (await import('fs')).default;
  const stablePath = `/tmp/wf_final_${req.params.jobId}.mp4`;
  if (fs.existsSync(stablePath)) {
    const stat = fs.statSync(stablePath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="contentforge-${req.params.jobId}.mp4"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return fs.createReadStream(stablePath).pipe(res);
  }
  const job = workflowJobs.get(req.params.jobId);
  if (job?.result?.finalVideoUrl?.startsWith('http')) return res.redirect(302, job.result.finalVideoUrl);
  res.status(404).json({ error: 'Video file not found — it may have been cleared. Regenerate.' });
});


// ── Upload a locally-downloaded HeyGen avatar MP4 ────────────────────────────
// Accepts multipart form upload, saves to stable path, returns serving URL
// Allows $29 Creator plan users to upload from HeyGen dashboard without API credits
app.post('/api/heygen/upload-avatar', async (req, res) => {
  try {
    const fs   = (await import('fs')).default;
    const path = (await import('path')).default;

    // Parse multipart form data manually using raw body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    // Extract boundary from content-type
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) return res.status(400).json({ error: 'No boundary in multipart request' });
    const boundary = '--' + boundaryMatch[1].trim();

    // Find the video file part
    const bodyStr = body.toString('binary');
    const parts = bodyStr.split(boundary);
    let videoBuf = null;

    for (const part of parts) {
      if (part.includes('Content-Disposition') && (part.includes('name="avatar"') || part.includes('filename='))) {
        // Find where headers end and body begins (double CRLF)
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        const fileContent = part.slice(headerEnd + 4, part.lastIndexOf('\r\n'));
        if (fileContent.length > 1000) {
          videoBuf = Buffer.from(fileContent, 'binary');
          break;
        }
      }
    }

    if (!videoBuf || videoBuf.length < 1000) {
      return res.status(400).json({ error: 'No valid video file found in upload. Make sure you selected an MP4 file.' });
    }

    // Save to a stable path Railway can serve
    const uploadId = 'upload_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const savePath = `/tmp/avatar_${uploadId}.mp4`;
    fs.writeFileSync(savePath, videoBuf);

    const sizeMB = (videoBuf.length / 1024 / 1024).toFixed(1);
    console.log(`✅ Avatar uploaded: ${savePath} (${sizeMB}MB)`);

    // Return a URL that ContentForge can serve back for combining
    const videoUrl = `/api/heygen/serve-avatar/${uploadId}`;
    res.json({ videoUrl: videoUrl, sizeMB, uploadId, message: 'Avatar uploaded successfully' });
  } catch(e) {
    console.error('Avatar upload error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Serve an uploaded avatar file ─────────────────────────────────────────────
app.get('/api/heygen/serve-avatar/:uploadId', async (req, res) => {
  const fs = (await import('fs')).default;
  const filePath = `/tmp/avatar_${req.params.uploadId}.mp4`;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Uploaded avatar file not found — it may have been cleared. Re-upload.' });
  }
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Access-Control-Allow-Origin', '*');
  fs.createReadStream(filePath).pipe(res);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.0', luma: !!process.env.LUMA_API_KEY, r2: !!process.env.R2_BUCKET_NAME, supabase: !!process.env.SUPABASE_URL });
});

app.post('/api/video/script', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  const MAX_RETRIES = 3;
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const script = await generateScript(req.body);
      return res.json({ script });
    } catch (e) {
      lastError = e;
      const isOverloaded = e.message && (e.message.includes('overloaded') || e.message.includes('529') || e.message.includes('529'));
      const isRateLimit = e.message && (e.message.includes('rate_limit') || e.message.includes('529'));
      if ((isOverloaded || isRateLimit) && attempt < MAX_RETRIES) {
        const waitMs = attempt * 3000; // 3s, then 6s
        console.log(`Claude overloaded (attempt ${attempt}/${MAX_RETRIES}), retrying in ${waitMs/1000}s...`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      break;
    }
  }
  // Return a clean, readable error — not raw Anthropic JSON
  const msg = lastError?.message || 'Script generation failed';
  const isOverloaded = msg.includes('overloaded') || msg.includes('529');
  const friendlyError = isOverloaded
    ? 'Claude is temporarily busy (high demand). Please wait 30 seconds and try again.'
    : msg.replace(/\{.*\}/s, '').trim() || 'Script generation failed — please try again.';
  res.status(503).json({ error: friendlyError });
});

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
        const clipResult = await generateClip(phrase, 5);
        const videoUrl = clipResult?.videoUrl || null;
        const pexelsId = clipResult?.pexelsId || null;
        const pexelsQuery = clipResult?.pexelsQuery || null;
        clips.push({ scene: i + 1, phrase, status: videoUrl ? 'success' : 'failed', videoUrl, pexelsId, pexelsQuery });
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


// ── Extract a Pexels-searchable keyword from a script phrase ─────────────────
// Context map for closing scene — when the last sentence is a CTA or wrap-up
const CLOSING_SCENE_MAP = {
  'home-business': ['person celebrating home success', 'entrepreneur smiling confident outdoor', 'woman looking forward bright future', 'person thumbs up home office'],
  'healthy-eating': ['woman eating healthy meal smiling', 'person enjoying nutritious food', 'healthy lifestyle happy person'],
  'fitness':        ['person celebrating workout success', 'athlete confident outdoors', 'fitness success achievement'],
  'cooking':        ['person enjoying delicious home meal', 'satisfied cook with finished dish', 'family enjoying home cooked food'],
  'default':        ['person smiling success achievement', 'confident person looking forward', 'happy entrepreneur home'],
};

const OPENING_SCENE_MAP = {
  'home-business': ['person working from home laptop', 'home office entrepreneur morning', 'woman planning home business'],
  'healthy-eating': ['fresh vegetables colorful kitchen', 'healthy meal preparation kitchen', 'person smiling healthy food'],
  'fitness':        ['person starting morning workout', 'fitness motivation athlete starting', 'gym workout beginning'],
  'cooking':        ['fresh ingredients kitchen counter', 'home cook starting recipe', 'kitchen preparation ingredients'],
  'default':        ['person getting started motivation', 'beginning new journey lifestyle'],
};

async function extractKeywordForPhrase(phrase, opts = {}) {
  const { position = 'middle', total = 1, niche = 'default', topic = '' } = opts;
  const isFirst   = position === 0;
  const isLast    = position === total - 1;
  const isClosing = isLast || /save this|follow for more|link in bio|comment below|check out|learn more|get started today|start today|click|visit|drop a|share this/i.test(phrase);
  const isOpener  = isFirst;

  // For closing CTA sentences — use niche-specific success/forward-looking scene
  if (isClosing) {
    const options = CLOSING_SCENE_MAP[niche] || CLOSING_SCENE_MAP['default'];
    const pick = options[Math.abs(phrase.length) % options.length];
    console.log(`🎬 Closing scene for "${phrase.slice(0,40)}" → "${pick}"`);
    return pick;
  }

  // For opening sentences — use niche-specific establishing scene
  if (isOpener) {
    const options = OPENING_SCENE_MAP[niche] || OPENING_SCENE_MAP['default'];
    const pick = options[Math.abs(phrase.length) % options.length];
    console.log(`🎬 Opening scene → "${pick}"`);
    return pick;
  }

  // For middle sentences — use Claude to extract a specific visual keyword
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const nicheContext = niche !== 'default' ? `Content niche: ${niche}. Topic: ${topic}.` : '';
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 40,
      system: `Extract a 2-4 word Pexels stock footage search phrase from this sentence. ${nicheContext} Reply ONLY with the search phrase — no explanation, no punctuation. Focus on specific visual nouns and actions. Avoid generic words like "person", "people", "man", "woman" alone — combine with setting or action. Examples: "woman baking bread kitchen", "lawn mower yard work", "laptop home office morning", "fresh vegetables cutting board".`,
      messages: [{ role: 'user', content: `Sentence: "${phrase}"` }],
    });
    const kw = (msg.content[0]?.text || '').trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    // Apply scene substitution to avoid generic results
    const substituted = getSubstitutedQuery(kw || phrase);
    return substituted || kw || 'home lifestyle';
  } catch(e) {
    // Fallback: word extraction
    const stopWords = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','this','that','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','just','really','very','also','here','these','those','there','some','what','when','where','which']);
    const words = phrase.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    return words.slice(0, 3).join(' ') || 'lifestyle home';
  }
}

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

    raw = raw
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/([\w"])\s*\n\s*"/g, '$1, "')
      .replace(/}\s*{/g, '},{');

    let posts;
    try {
      posts = JSON.parse(raw);
    } catch (parseErr) {
      console.warn('JSON parse failed, attempting repair:', parseErr.message);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          posts = JSON.parse(jsonMatch[0]);
        } catch (e2) {
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
          try { const r = await generateClip(script.sceneDescriptions[0].visual, 5); clipUrl = r?.videoUrl || r || null; } catch (e) { console.warn(`Bulk clip failed:`, e.message); }
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

    const pageTokenRes = await fetch(
      `https://graph.facebook.com/v25.0/${pageId}?fields=access_token&access_token=${userToken}`
    );
    const pageTokenData = await pageTokenRes.json();
    
    if (!pageTokenData.access_token) {
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
const landingPages = new Map();

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

setInterval(async () => {
  const now = new Date();
  for (const [id, s] of schedules.entries()) {
    if (s.status === 'scheduled' && new Date(s.scheduledAt) <= now) {
      console.log(`📅 Publishing scheduled post ${id}`);
      schedules.set(id, { ...s, status: 'published', publishedAt: now.toISOString() });
    }
  }
}, 60000);
