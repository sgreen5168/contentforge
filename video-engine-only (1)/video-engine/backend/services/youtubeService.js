import dotenv from 'dotenv';
dotenv.config();

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YT_API    = 'https://www.googleapis.com/upload/youtube/v3';
const YT_DATA   = 'https://www.googleapis.com/youtube/v3';

// ── Get fresh access token using refresh token ────────────────────────────────
async function getAccessToken() {
  const fetch = (await import('node-fetch')).default;
  const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;

  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    throw new Error('Missing YouTube credentials — add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN to Railway');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: YOUTUBE_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`YouTube auth failed: ${data.error_description || data.error}`);
  console.log('✅ YouTube access token obtained');
  return data.access_token;
}

// ── Upload video to YouTube ───────────────────────────────────────────────────
export async function uploadVideoToYouTube({ videoUrl, title, description, tags, category, privacy }) {
  const fetch = (await import('node-fetch')).default;
  const token = await getAccessToken();

  console.log(`▶ Uploading video to YouTube: "${title}"`);

  // Step 1 — Download video from URL
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoRes.status}`);
  const videoBuffer = await videoRes.buffer();
  console.log(`✅ Video downloaded: ${(videoBuffer.length/1024/1024).toFixed(1)}MB`);

  // Step 2 — Upload to YouTube using resumable upload
  const metadata = {
    snippet: {
      title:       (title || 'ContentForge Video').slice(0, 100),
      description: (description || '').slice(0, 5000),
      tags:        tags || [],
      categoryId:  category || '22', // 22 = People & Blogs
    },
    status: {
      privacyStatus:           privacy || 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  // Initiate resumable upload
  const initRes = await fetch(`${YT_API}/videos?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: {
      'Authorization':   `Bearer ${token}`,
      'Content-Type':    'application/json',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': videoBuffer.length,
    },
    body: JSON.stringify(metadata),
  });

  if (!initRes.ok) {
    const err = await initRes.json();
    throw new Error(`YouTube upload init failed: ${err.error?.message || initRes.status}`);
  }

  const uploadUrl = initRes.headers.get('location');
  console.log(`⏳ YouTube resumable upload URL obtained`);

  // Upload video bytes
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization':  `Bearer ${token}`,
      'Content-Type':   'video/mp4',
      'Content-Length': videoBuffer.length,
    },
    body: videoBuffer,
  });

  const result = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(`YouTube upload failed: ${result.error?.message || uploadRes.status}`);

  const videoId  = result.id;
  const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`✅ YouTube video uploaded: ${videoLink}`);

  return {
    success:  true,
    videoId,
    url:      videoLink,
    title:    result.snippet?.title,
    platform: 'youtube',
  };
}

// ── Upload YouTube Short ──────────────────────────────────────────────────────
export async function uploadYouTubeShort({ videoUrl, title, description, tags, privacy }) {
  // Shorts are just vertical videos — same upload with #Shorts in description
  const shortDescription = `${description || ''}\n\n#Shorts #ContentForge`.trim();
  const shortTitle = title?.slice(0, 100) || 'ContentForge Short';
  return uploadVideoToYouTube({
    videoUrl,
    title:       shortTitle,
    description: shortDescription,
    tags:        [...(tags || []), 'Shorts'],
    category:    '22',
    privacy:     privacy || 'unlisted',
  });
}

// ── Delete a video from YouTube ───────────────────────────────────────────────
// Note: this requires the broader 'https://www.googleapis.com/auth/youtube'
// OAuth scope. If the refresh token was only granted 'youtube.upload', this
// will fail with an insufficient-permissions error from Google — that's a
// scope issue, not a bug, and would require re-authorizing with the wider scope.
export async function deleteYouTubeVideo(videoId) {
  const fetch = (await import('node-fetch')).default;
  if (!videoId) throw new Error('videoId is required to delete a video');

  const token = await getAccessToken();
  console.log(`🗑 Deleting YouTube video: ${videoId}`);

  const res = await fetch(`${YT_DATA}/videos?id=${encodeURIComponent(videoId)}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (res.status === 204) {
    console.log(`✅ YouTube video deleted: ${videoId}`);
    return { success: true, videoId };
  }

  let detail = '';
  try {
    const err = await res.json();
    detail = err.error?.message || JSON.stringify(err.error || {});
  } catch (e) {
    detail = await res.text().catch(() => '');
  }

  if (res.status === 403) {
    throw new Error(
      `YouTube refused the delete (403 — insufficient permission). ` +
      `This usually means the connected account's OAuth token doesn't have ` +
      `the 'youtube' scope (delete requires more than 'youtube.upload'). ` +
      `Detail: ${detail}`
    );
  }
  if (res.status === 404) {
    throw new Error(`Video not found on YouTube (already deleted, or wrong videoId). Detail: ${detail}`);
  }
  throw new Error(`YouTube delete failed: HTTP ${res.status} — ${detail}`);
}

// ── Verify YouTube credentials ────────────────────────────────────────────────
export async function verifyYouTubeCredentials() {
  const fetch = (await import('node-fetch')).default;

  if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_REFRESH_TOKEN) {
    return { connected: false, error: 'Missing YouTube credentials in Railway' };
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(`${YT_DATA}/channels?part=snippet,statistics&mine=true`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Failed to fetch channel');

    const channel = data.items?.[0];
    if (!channel) throw new Error('No YouTube channel found for this account');

    console.log(`✅ YouTube connected: ${channel.snippet.title} (${channel.statistics.subscriberCount} subscribers)`);
    return {
      connected:     true,
      channelId:     channel.id,
      channelName:   channel.snippet.title,
      subscribers:   channel.statistics.subscriberCount || 0,
      totalVideos:   channel.statistics.videoCount || 0,
      channelUrl:    `https://www.youtube.com/channel/${channel.id}`,
    };
  } catch (e) {
    return { connected: false, error: e.message };
  }
}
