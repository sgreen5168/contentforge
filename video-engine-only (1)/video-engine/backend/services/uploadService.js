import fetch from 'node-fetch';
import FormData from 'form-data';
import { createReadStream, statSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// ── TikTok Upload ─────────────────────────────────────────────────────────────
export async function uploadToTikTok({ videoPath, title, description, hashtags }) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) throw new Error('TIKTOK_ACCESS_TOKEN not set');

  const fileSize = statSync(videoPath).size;
  const captionText = `${description}\n\n${hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`.slice(0, 2200);

  // Step 1: Init upload
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: title.slice(0, 150),
        description: captionText,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        privacy_level: 'PUBLIC_TO_EVERYONE',
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: fileSize,
        chunk_size: fileSize,
        total_chunk_count: 1,
      },
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(`TikTok init error: ${err.error?.message || initRes.status}`);
  }

  const initData = await initRes.json();
  const { publish_id, upload_url } = initData.data;

  // Step 2: Upload video file
  const fileStream = createReadStream(videoPath);
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': fileSize,
      'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
    },
    body: fileStream,
  });

  if (!uploadRes.ok) throw new Error(`TikTok upload error: ${uploadRes.status}`);

  console.log(`✅ TikTok upload complete. Publish ID: ${publish_id}`);
  return { platform: 'tiktok', publishId: publish_id, status: 'uploaded' };
}

// ── Instagram Reels Upload ────────────────────────────────────────────────────
export async function uploadToInstagram({ videoPath, caption, hashtags, coverUrl }) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_USER_ID;
  if (!accessToken || !igUserId) throw new Error('Instagram credentials not set');

  const fullCaption = `${caption}\n\n${hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`.slice(0, 2200);

  // Note: Instagram requires a publicly accessible video URL, not a local file
  // In production, upload to S3/Cloudflare first, then pass the URL
  const videoUrl = process.env.VIDEO_BASE_URL
    ? `${process.env.VIDEO_BASE_URL}/${videoPath.split('/').pop()}`
    : null;

  if (!videoUrl) throw new Error('VIDEO_BASE_URL required for Instagram upload. Host your video publicly first.');

  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.instagram.com/v19.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: videoUrl,
        caption: fullCaption,
        share_to_feed: true,
        access_token: accessToken,
      }),
    }
  );

  if (!containerRes.ok) {
    const err = await containerRes.json().catch(() => ({}));
    throw new Error(`Instagram container error: ${err.error?.message || containerRes.status}`);
  }

  const container = await containerRes.json();
  const containerId = container.id;

  // Step 2: Poll until video is processed
  await pollInstagramMedia(containerId, accessToken);

  // Step 3: Publish
  const publishRes = await fetch(
    `https://graph.instagram.com/v19.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (!publishRes.ok) {
    const err = await publishRes.json().catch(() => ({}));
    throw new Error(`Instagram publish error: ${err.error?.message || publishRes.status}`);
  }

  const published = await publishRes.json();
  console.log(`✅ Instagram Reel published: ${published.id}`);
  return { platform: 'instagram', mediaId: published.id, status: 'published' };
}

async function pollInstagramMedia(containerId, accessToken, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5000);
    const res = await fetch(
      `https://graph.instagram.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error('Instagram media processing failed');
    console.log(`⏳ Instagram processing: ${data.status_code}`);
  }
  throw new Error('Instagram media processing timed out');
}

// ── YouTube Shorts Upload ─────────────────────────────────────────────────────
export async function uploadToYouTube({ videoPath, title, description, hashtags, accessToken }) {
  const token = accessToken || process.env.YOUTUBE_ACCESS_TOKEN;
  if (!token) throw new Error('YouTube access token not set');

  const fileSize = statSync(videoPath).size;
  const tags = hashtags.map(h => h.replace('#', ''));
  const fullDescription = `${description}\n\n${hashtags.join(' ')}\n\n#Shorts`;

  // Step 1: Initialize resumable upload
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': fileSize,
      },
      body: JSON.stringify({
        snippet: {
          title: `${title} #Shorts`.slice(0, 100),
          description: fullDescription.slice(0, 5000),
          tags: tags.slice(0, 500),
          categoryId: '22',
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      }),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(`YouTube init error: ${err.error?.message || initRes.status}`);
  }

  const uploadUrl = initRes.headers.get('location');

  // Step 2: Upload video
  const fileStream = createReadStream(videoPath);
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': fileSize,
    },
    body: fileStream,
  });

  if (!uploadRes.ok && uploadRes.status !== 308) {
    throw new Error(`YouTube upload error: ${uploadRes.status}`);
  }

  const uploaded = await uploadRes.json().catch(() => ({}));
  console.log(`✅ YouTube Short uploaded: ${uploaded.id}`);
  return { platform: 'youtube', videoId: uploaded.id, status: 'published', url: `https://youtube.com/shorts/${uploaded.id}` };
}

// ── Upload to all selected platforms ─────────────────────────────────────────
export async function uploadToAllPlatforms({ videoPath, script, platforms }) {
  const results = [];

  for (const platform of platforms) {
    try {
      let result;
      const params = {
        videoPath,
        title: script.title,
        description: script.description,
        hashtags: script.hashtags || [],
        caption: script.description,
      };

      if (platform === 'tiktok') result = await uploadToTikTok(params);
      else if (platform === 'instagram') result = await uploadToInstagram(params);
      else if (platform === 'youtube') result = await uploadToYouTube(params);

      results.push(result);
      console.log(`✅ Uploaded to ${platform}`);
    } catch (err) {
      console.error(`❌ ${platform} upload failed:`, err.message);
      results.push({ platform, status: 'failed', error: err.message });
    }
  }

  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
