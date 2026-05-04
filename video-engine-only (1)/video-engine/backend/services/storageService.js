import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, existsSync } from 'fs';
import { basename } from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Cloudflare R2 is S3-compatible so we use the AWS SDK
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'contentforge-videos';

// ── Upload a file to R2 ───────────────────────────────────────────────────────
export async function uploadToR2(localPath, key) {
  if (!existsSync(localPath)) throw new Error(`File not found: ${localPath}`);
  if (!process.env.R2_ACCOUNT_ID) throw new Error('R2 not configured');

  const stream = createReadStream(localPath);
  const ext = localPath.split('.').pop().toLowerCase();
  const contentType = ext === 'mp4' ? 'video/mp4' : ext === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: stream,
    ContentType: contentType,
  }));

  // Return public URL if custom domain is set, otherwise signed URL
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }

  const signed = await getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 604800 }); // 7 days
  return signed;
}

// ── Upload video and audio for a job ─────────────────────────────────────────
export async function uploadJobFiles(jobId, { videoPath, audioPath }) {
  const results = {};

  if (videoPath && existsSync(videoPath)) {
    const key = `videos/${jobId}/final.mp4`;
    results.videoUrl = await uploadToR2(videoPath, key);
    console.log(`☁️ Video uploaded to R2: ${key}`);
  }

  if (audioPath && existsSync(audioPath)) {
    const key = `audio/${jobId}/voice.mp3`;
    results.audioUrl = await uploadToR2(audioPath, key);
    console.log(`☁️ Audio uploaded to R2: ${key}`);
  }

  return results;
}

// ── Check if R2 is configured ─────────────────────────────────────────────────
export function isR2Configured() {
  return !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
}
