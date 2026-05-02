import fetch from 'node-fetch';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const OUTPUT_DIR = process.env.OUTPUT_DIR || './output';

// ── Persona voice mappings ─────────────────────────────────────────────────────
// OpenAI TTS voices
const OPENAI_VOICES = {
  testimonial: 'nova',      // warm, relatable female
  demo:        'onyx',      // clear, professional male
  influencer:  'shimmer',   // energetic female
  educator:    'echo',      // authoritative male
  ugc:         'alloy',     // natural, casual
};

// ElevenLabs voice IDs (used if ELEVENLABS_API_KEY is set)
const ELEVEN_VOICES = {
  testimonial: 'EXAVITQu4vr4xnSDxMaL',
  demo:        'VR6AewLTigWG4xSOukaG',
  influencer:  'pFZP5JQG7iQjIQuC4Bku',
  educator:    'onwK4e9ZLuTAKqWW03F9',
  ugc:         'EXAVITQu4vr4xnSDxMaL',
};

// ── Generate voiceover — tries ElevenLabs first, falls back to OpenAI TTS ────
export async function generateVoiceover({ script, persona, jobId }) {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  // Try ElevenLabs first
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      return await generateElevenLabs({ script, persona, jobId });
    } catch (err) {
      console.warn('ElevenLabs failed, trying OpenAI TTS:', err.message);
    }
  }

  // Try OpenAI TTS
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateOpenAITTS({ script, persona, jobId });
    } catch (err) {
      console.warn('OpenAI TTS failed, trying Google TTS:', err.message);
    }
  }

  // Try Google TTS
  if (process.env.GOOGLE_TTS_KEY) {
    try {
      return await generateGoogleTTS({ script, persona, jobId });
    } catch (err) {
      console.warn('Google TTS failed:', err.message);
    }
  }

  // Try PlayHT
  if (process.env.PLAYHT_API_KEY) {
    try {
      return await generatePlayHT({ script, persona, jobId });
    } catch (err) {
      console.warn('PlayHT failed:', err.message);
    }
  }

  throw new Error('No voiceover API key found. Add OPENAI_API_KEY, ELEVENLABS_API_KEY, GOOGLE_TTS_KEY, or PLAYHT_API_KEY to your environment variables.');
}

// ── OpenAI TTS ────────────────────────────────────────────────────────────────
async function generateOpenAITTS({ script, persona, jobId }) {
  const voice = OPENAI_VOICES[persona] || 'alloy';
  const audioPath = join(OUTPUT_DIR, `voice_${jobId}.mp3`);

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: script,
      voice: voice,
      response_format: 'mp3',
      speed: persona === 'influencer' ? 1.1 : 1.0,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI TTS error: ${err.error?.message || res.status}`);
  }

  await new Promise((resolve, reject) => {
    const fileStream = createWriteStream(audioPath);
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`🎙️ OpenAI TTS voiceover saved: ${audioPath}`);
  return { audioPath, provider: 'openai', voice, persona };
}

// ── ElevenLabs TTS ────────────────────────────────────────────────────────────
async function generateElevenLabs({ script, persona, jobId }) {
  const voiceId = ELEVEN_VOICES[persona] || ELEVEN_VOICES.ugc;
  const audioPath = join(OUTPUT_DIR, `voice_${jobId}.mp3`);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: script,
      model_id: 'eleven_turbo_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3 },
    }),
  });

  if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);

  await new Promise((resolve, reject) => {
    const fileStream = createWriteStream(audioPath);
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`🎙️ ElevenLabs voiceover saved: ${audioPath}`);
  return { audioPath, provider: 'elevenlabs', voiceId, persona };
}

// ── Google Cloud TTS ──────────────────────────────────────────────────────────
async function generateGoogleTTS({ script, persona, jobId }) {
  const audioPath = join(OUTPUT_DIR, `voice_${jobId}.mp3`);
  const voices = {
    testimonial: { name: 'en-US-Neural2-F', ssmlGender: 'FEMALE' },
    demo:        { name: 'en-US-Neural2-D', ssmlGender: 'MALE' },
    influencer:  { name: 'en-US-Neural2-G', ssmlGender: 'FEMALE' },
    educator:    { name: 'en-US-Neural2-J', ssmlGender: 'MALE' },
    ugc:         { name: 'en-US-Neural2-A', ssmlGender: 'MALE' },
  };

  const voice = voices[persona] || voices.ugc;
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: script },
        voice: { languageCode: 'en-US', ...voice },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Google TTS error: ${res.status}`);
  const data = await res.json();
  const buffer = Buffer.from(data.audioContent, 'base64');

  const { writeFileSync } = await import('fs');
  writeFileSync(audioPath, buffer);

  console.log(`🎙️ Google TTS voiceover saved: ${audioPath}`);
  return { audioPath, provider: 'google', persona };
}

// ── PlayHT TTS ────────────────────────────────────────────────────────────────
async function generatePlayHT({ script, persona, jobId }) {
  const audioPath = join(OUTPUT_DIR, `voice_${jobId}.mp3`);

  const res = await fetch('https://api.play.ht/api/v2/tts/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PLAYHT_API_KEY}`,
      'X-User-ID': process.env.PLAYHT_USER_ID || '',
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: script,
      voice: 'en-US-JennyNeural',
      output_format: 'mp3',
      voice_engine: 'PlayHT2.0',
    }),
  });

  if (!res.ok) throw new Error(`PlayHT error: ${res.status}`);

  await new Promise((resolve, reject) => {
    const fileStream = createWriteStream(audioPath);
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`🎙️ PlayHT voiceover saved: ${audioPath}`);
  return { audioPath, provider: 'playht', persona };
}

// ── Utilities ─────────────────────────────────────────────────────────────────
export async function getAvailableVoices() {
  return Object.keys(OPENAI_VOICES).map(k => ({
    id: k, name: k, provider: 'openai', voice: OPENAI_VOICES[k]
  }));
}

export function estimateVoiceoverCost(scriptLength) {
  const chars = scriptLength;
  const costPer1000 = 0.015; // OpenAI TTS pricing
  return ((chars / 1000) * costPer1000).toFixed(4);
}
