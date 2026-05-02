import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const RUNWAY_API = 'https://api.dev.runwayml.com/v1';
const API_KEY = process.env.RUNWAY_API_KEY;

// ── Generate video clip from text prompt using RunwayML Gen-3 ─────────────────
export async function generateVideoClip({ prompt, duration = 5, ratio = '720:1280' }) {
  if (!API_KEY) throw new Error('RUNWAY_API_KEY not set');

  console.log(`🎬 RunwayML: generating clip — "${prompt.slice(0, 60)}..."`);

  const createRes = await fetch(`${RUNWAY_API}/text_to_video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model: 'gen4_turbo',
      promptText: prompt,
      duration: Math.min(duration, 10),
      ratio: ratio,
      watermark: false,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    // Try fallback to gen3a_turbo if gen4 not available
    console.warn('Gen4 failed, trying Gen3:', err.message || createRes.status);
    return await generateWithGen3({ prompt, duration, ratio });
  }

  const task = await createRes.json();
  console.log(`⏳ RunwayML task created: ${task.id}`);
  return await pollTaskCompletion(task.id, 180);
}

// ── Fallback to Gen3a Turbo ───────────────────────────────────────────────────
async function generateWithGen3({ prompt, duration, ratio }) {
  const createRes = await fetch(`${RUNWAY_API}/image_to_video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model: 'gen3a_turbo',
      promptText: prompt,
      duration: Math.min(duration, 10),
      ratio: ratio === '720:1280' ? '9:16' : ratio,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`RunwayML Gen3 error: ${err.message || createRes.status}`);
  }

  const task = await createRes.json();
  return await pollTaskCompletion(task.id, 180);
}

// ── Poll RunwayML task until done ─────────────────────────────────────────────
async function pollTaskCompletion(taskId, maxSeconds = 180) {
  const start = Date.now();
  let attempts = 0;

  while ((Date.now() - start) / 1000 < maxSeconds) {
    await sleep(4000);
    attempts++;

    try {
      const res = await fetch(`${RUNWAY_API}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!res.ok) {
        console.warn(`Poll attempt ${attempts} failed: ${res.status}`);
        continue;
      }

      const task = await res.json();
      console.log(`⏳ Task ${taskId}: ${task.status} (attempt ${attempts})`);

      if (task.status === 'SUCCEEDED') {
        const videoUrl = task.output?.[0] || task.artifacts?.[0]?.url;
        if (!videoUrl) throw new Error('No video URL in completed task');
        console.log(`✅ RunwayML clip ready: ${videoUrl}`);
        return { videoUrl, taskId, status: 'success' };
      }

      if (task.status === 'FAILED') {
        throw new Error(`RunwayML task failed: ${task.failure || task.failureCode || 'Unknown'}`);
      }

    } catch (err) {
      if (err.message.includes('FAILED') || err.message.includes('No video URL')) {
        throw err;
      }
      console.warn(`Poll error (attempt ${attempts}):`, err.message);
    }
  }

  throw new Error('RunwayML timed out after 3 minutes');
}

// ── Generate multiple scene clips ─────────────────────────────────────────────
export async function generateSceneClips(scenes) {
  const clips = [];
  for (const scene of scenes) {
    console.log(`🎬 Generating scene ${scene.scene}/${scenes.length}`);
    try {
      const clip = await generateVideoClip({
        prompt: scene.visual,
        duration: Math.min(scene.duration || 5, 10),
        ratio: '720:1280',
      });
      clips.push({ ...scene, ...clip });
      console.log(`✅ Scene ${scene.scene} done`);
    } catch (err) {
      console.error(`❌ Scene ${scene.scene} failed:`, err.message);
      clips.push({ ...scene, status: 'failed', error: err.message });
    }
  }
  return clips;
}

// ── Build enriched video prompt ───────────────────────────────────────────────
export function buildVideoPrompt(scene, persona, style) {
  const styleMap = {
    cinematic:    'cinematic lighting, professional camera, film quality, dramatic',
    ugc:          'authentic handheld camera, natural lighting, real person, casual UGC style',
    studio:       'clean white background, professional studio lighting, product focused',
    lifestyle:    'bright airy lifestyle setting, natural light, aspirational, warm tones',
    talking_head: 'person talking directly to camera, eye contact, professional but friendly',
  };

  const personaMap = {
    testimonial: 'real person sharing authentic experience, emotional, relatable',
    demo:        'clear product demonstration, step by step, informative',
    influencer:  'trendy social media style, high energy, modern aesthetic',
    educator:    'expert presenter, clean visual, authoritative',
    ugc:         'authentic everyday person, genuine reaction, unscripted feel',
  };

  return `${scene.visual}. ${styleMap[style] || styleMap.ugc}. ${personaMap[persona] || personaMap.ugc}. Vertical 9:16 mobile format. High quality, engaging, realistic.`.slice(0, 500);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
