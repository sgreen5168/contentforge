import ffmpeg from 'fluent-ffmpeg';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import fetch from 'node-fetch';
import { createWriteStream } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const OUTPUT_DIR = process.env.OUTPUT_DIR || './output';

// ── Download video from URL to local file ─────────────────────────────────────
export async function downloadVideo(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const dest = join(OUTPUT_DIR, filename);
  if (!existsSync(dirname(dest))) mkdirSync(dirname(dest), { recursive: true });
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(dest);
    res.body.pipe(stream);
    res.body.on('error', reject);
    stream.on('finish', resolve);
  });
  return dest;
}

// ── Merge video clips with audio and captions ─────────────────────────────────
export async function assembleVideo({ clips, audioPath, captions, ctaOverlays, jobId, outputFilename }) {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputPath = join(OUTPUT_DIR, outputFilename || `video_${jobId}.mp4`);

  // Download all clip files
  const localClips = [];
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    if (clip.videoUrl) {
      const localPath = await downloadVideo(clip.videoUrl, `clip_${jobId}_${i}.mp4`);
      localClips.push(localPath);
    }
  }

  if (localClips.length === 0) {
    throw new Error('No valid clips to assemble');
  }

  // Create concat file for ffmpeg
  const concatFile = join(OUTPUT_DIR, `concat_${jobId}.txt`);
  const concatContent = localClips.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  writeFileSync(concatFile, concatContent);

  return new Promise((resolve, reject) => {
    let command = ffmpeg();

    if (localClips.length > 1) {
      command = command
        .input(concatFile)
        .inputOptions(['-f concat', '-safe 0']);
    } else {
      command = command.input(localClips[0]);
    }

    // Add voiceover audio if provided
    if (audioPath && existsSync(audioPath)) {
      command = command.input(audioPath);
    }

    command
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-shortest',
        '-movflags +faststart',
        '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
      ])
      .output(outputPath)
      .on('start', cmd => console.log(`🎬 FFmpeg started: ${cmd}`))
      .on('progress', p => console.log(`⏳ Processing: ${Math.round(p.percent || 0)}%`))
      .on('end', () => {
        console.log(`✅ Video assembled: ${outputPath}`);
        resolve({ outputPath, filename: outputFilename || `video_${jobId}.mp4` });
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err.message);
        reject(err);
      })
      .run();
  });
}

// ── Generate SRT captions from script ─────────────────────────────────────────
export function generateSRT(scenes) {
  let srt = '';
  let index = 1;
  let currentTime = 0;

  for (const scene of scenes) {
    if (scene.text) {
      const startTime = formatSRTTime(currentTime);
      const endTime = formatSRTTime(currentTime + scene.duration);
      srt += `${index}\n${startTime} --> ${endTime}\n${scene.text}\n\n`;
      index++;
    }
    currentTime += scene.duration;
  }
  return srt;
}

function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function pad(n, len = 2) { return String(n).padStart(len, '0'); }

// ── Get video metadata ─────────────────────────────────────────────────────────
export function getVideoInfo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const stream = metadata.streams.find(s => s.codec_type === 'video');
      resolve({
        duration: metadata.format.duration,
        width: stream?.width,
        height: stream?.height,
        size: metadata.format.size,
        format: metadata.format.format_name,
      });
    });
  });
}
