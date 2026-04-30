import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const RUNWAY_API = 'https://api.dev.runwayml.com/v1';
const API_KEY = process.env.RUNWAY_API_KEY;

// ── Generate video clip from text prompt using RunwayML ───────────────────────
export async function generateVideoClip({ prompt, duration = 4, ratio = '9:16' }) {
  if (!API_KEY) throw new Error('RUNWAY_API_KEY not set');

  // Create generation task
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
      ratio: ratio,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`RunwayML error: ${err.message || createRes.status}`);
  }

  const task = await createRes.json();
  const taskId = task.id;

  // Poll until complete
  return await pollTaskCompletion(taskId, 120);
}

// ── Poll RunwayML task until done ─────────────────────────────────────────────
async function pollTaskCompletion(taskId, maxSeconds = 120) {
  const start = Date.now();
  while ((Date.now() - start) / 1000 < maxSeconds) {
    await sleep(3000);

    const res = await fetch(`${RUNWAY_API}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!res.ok) throw new Error(`Poll error: ${res.status}`);
    const task = await res.json();

    if (task.status === 'SUCCEEDED') {
      return {
        videoUrl: task.output?.[0],
        taskId,
        status: 'success',
        duration: task.duration,
      };
    }
    if (task.status === 'FAILED') {
      throw new Error(`Video generation failed: ${task.failure || 'Unknown error'}`);
    }
    console.log(`⏳ Task ${taskId}: ${task.status} (${task.progress || 0}%)`);
  }
  throw new Error('Video generation timed out after 120 seconds');
}

// ── Generate multiple scene clips ─────────────────────────────────────────────
export async function generateSceneClips(scenes) {
  const clips = [];
  for (const scene of scenes) {
    console.log(`🎬 Generating scene ${scene.scene}: ${scene.visual}`);
    try {
      const clip = await generateVideoClip({
        prompt: scene.visual,
        duration: Math.min(scene.duration, 10),
        ratio: '9:16',
      });
      clips.push({ ...scene, ...clip });
    } catch (err) {
      console.error(`Scene ${scene.scene} failed:`, err.message);
      clips.push({ ...scene, status: 'failed', error: err.message });
    }
  }
  return clips;
}

// ── Build video prompt from scene description ─────────────────────────────────
export function buildVideoPrompt(scene, persona, style) {
  const styleMap = {
    cinematic: 'cinematic lighting, professional camera movement, film quality',
    ugc: 'authentic handheld camera, natural lighting, real environment, casual feel',
    studio: 'clean white background, professional studio lighting, product focus',
    lifestyle: 'bright airy lifestyle setting, natural light, aspirational feel',
    talking_head: 'person talking to camera, eye contact, professional but approachable',
  };

  return `${scene.visual}. Style: ${styleMap[style] || styleMap.ugc}. Vertical 9:16 format optimized for mobile. ${persona === 'testimonial' ? 'Real person authentically speaking' : ''} High quality, engaging, ${scene.duration} second clip.`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
