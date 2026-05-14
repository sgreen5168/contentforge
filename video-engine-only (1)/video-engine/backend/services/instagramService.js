import dotenv from 'dotenv';
dotenv.config();

const GRAPH_API = 'https://graph.facebook.com/v25.0';

// ── Post Reel/video to Instagram ──────────────────────────────────────────────
export async function postVideoToInstagram({ videoUrl, caption }) {
  const fetch = (await import('node-fetch')).default;
  const igId  = process.env.INSTAGRAM_ACCOUNT_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!igId || !token) throw new Error('INSTAGRAM_ACCOUNT_ID or INSTAGRAM_ACCESS_TOKEN missing in Railway');

  console.log(`📷 Posting Reel to Instagram: "${caption?.slice(0, 50)}..."`);

  // Step 1 — Create media container
  const containerRes = await fetch(`${GRAPH_API}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type:   'REELS',
      video_url:    videoUrl,
      caption:      caption?.slice(0, 2200) || '',
      share_to_feed: true,
      access_token: token,
    }),
  });

  const container = await containerRes.json();
  console.log('Instagram container:', JSON.stringify(container).slice(0, 200));

  if (!containerRes.ok || container.error) {
    throw new Error(`Instagram container failed: ${container.error?.message || containerRes.status}`);
  }

  const containerId = container.id;
  console.log(`⏳ Instagram container created: ${containerId} — waiting for processing...`);

  // Step 2 — Wait for video to process
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`${GRAPH_API}/${containerId}?fields=status_code&access_token=${token}`);
    const status = await statusRes.json();
    console.log(`Instagram status: ${status.status_code} (${i + 1}/30)`);

    if (status.status_code === 'FINISHED') break;
    if (status.status_code === 'ERROR') throw new Error('Instagram video processing failed');
  }

  // Step 3 — Publish the container
  const publishRes = await fetch(`${GRAPH_API}/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id:  containerId,
      access_token: token,
    }),
  });

  const published = await publishRes.json();
  if (!publishRes.ok || published.error) {
    throw new Error(`Instagram publish failed: ${published.error?.message || publishRes.status}`);
  }

  const postUrl = `https://www.instagram.com/p/${published.id}`;
  console.log(`✅ Instagram Reel posted: ${postUrl}`);
  return { success: true, id: published.id, url: postUrl, platform: 'instagram' };
}

// ── Post image to Instagram ───────────────────────────────────────────────────
export async function postImageToInstagram({ imageUrl, caption }) {
  const fetch = (await import('node-fetch')).default;
  const igId  = process.env.INSTAGRAM_ACCOUNT_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!igId || !token) throw new Error('INSTAGRAM_ACCOUNT_ID or INSTAGRAM_ACCESS_TOKEN missing in Railway');

  // Step 1 — Create container
  const containerRes = await fetch(`${GRAPH_API}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url:    imageUrl,
      caption:      caption?.slice(0, 2200) || '',
      access_token: token,
    }),
  });

  const container = await containerRes.json();
  if (!containerRes.ok || container.error) throw new Error(`Instagram image container failed: ${container.error?.message}`);

  // Step 2 — Publish
  const publishRes = await fetch(`${GRAPH_API}/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });

  const published = await publishRes.json();
  if (!publishRes.ok || published.error) throw new Error(`Instagram publish failed: ${published.error?.message}`);

  console.log(`✅ Instagram image posted`);
  return { success: true, id: published.id, platform: 'instagram' };
}

// ── Verify Instagram credentials ──────────────────────────────────────────────
export async function verifyInstagramCredentials() {
  const fetch = (await import('node-fetch')).default;
  const igId  = process.env.INSTAGRAM_ACCOUNT_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!igId || !token) return { connected: false, error: 'Missing INSTAGRAM_ACCOUNT_ID or INSTAGRAM_ACCESS_TOKEN' };

  try {
    const res = await fetch(`${GRAPH_API}/${igId}?fields=id,username,followers_count,media_count&access_token=${token}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    console.log(`✅ Instagram connected: @${data.username} (${data.followers_count || 0} followers)`);
    return { connected: true, accountId: data.id, username: data.username, followers: data.followers_count || 0, posts: data.media_count || 0 };
  } catch (e) {
    return { connected: false, error: e.message };
  }
}
