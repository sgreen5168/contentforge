import fetch from 'node-fetch';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const ELEVEN_API = 'https://api.elevenlabs.io/v1';
const API_KEY = process.env.ELEVENLABS_API_KEY;
const OUTPUT_DIR = process.env.OUTPUT_DIR || './output';

// ── Persona voice mappings ─────────────────────────────────────────────────────
const PERSONA_VOICES = {
  testimonial: 'EXAVITQu4vr4xnSDxMaL', // Sarah — warm, relatable female
  demo:        'VR6AewLTigWG4xSOukaG', // Arnold — clear, professional male
  influencer:  'pFZP5JQG7iQjIQuC4Bku', // Lily — energetic, young female
  educator:    'onwK4e9ZLuTAKqWW03F9', // Daniel — authoritative male
  ugc:         'EXAVITQu4vr4xnSDxMaL', // Sarah — natural, casual
};

// Voice settings per persona
const VOICE_SETTINGS = {
  testimonial: { stability: 0.5, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
  demo:        { stability: 0.7, similarity_boost: 0.7, style: 0.1, use_speaker_boost: true },
  influencer:  { stability: 0.3, similarity_boost: 0.9, style: 0.8, use_speaker_boost: true },
  educator:    { stability: 0.8, similarity_boost: 0.6, style: 0.0, use_speaker_boost: true },
  ugc:         { stability: 0.4, similarity_boost: 0.8, style: 0.4, use_speaker_boost: true },
};

// ── Generate voiceover audio ──────────────────────────────────────────────────
export async function generateVoiceover({ script, persona, jobId }) {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  const voiceId = PERSONA_VOICES[persona] || PERSONA_VOICES.ugc;
  const settings = VOICE_SETTINGS[persona] || VOICE_SETTINGS.ugc;

  const res = await fetch(`${ELEVEN_API}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: script,
      model_id: 'eleven_turbo_v2',
      voice_settings: settings,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`ElevenLabs error: ${err.detail?.message || res.status}`);
  }

  // Save audio file
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const audioPath = join(OUTPUT_DIR, `voice_${jobId}.mp3`);

  await new Promise((resolve, reject) => {
    const fileStream = createWriteStream(audioPath);
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`🎙️ Voiceover saved: ${audioPath}`);
  return { audioPath, voiceId, persona };
}

// ── Get available voices ───────────────────────────────────────────────────────
export async function getAvailableVoices() {
  if (!API_KEY) return Object.keys(PERSONA_VOICES).map(k => ({ id: k, name: k }));

  const res = await fetch(`${ELEVEN_API}/voices`, {
    headers: { 'xi-api-key': API_KEY },
  });
  const data = await res.json();
  return data.voices || [];
}

// ── Estimate voiceover cost ────────────────────────────────────────────────────
export function estimateVoiceoverCost(scriptLength) {
  const chars = scriptLength;
  const costPer1000 = 0.30;
  return ((chars / 1000) * costPer1000).toFixed(4);
}
