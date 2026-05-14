import dotenv from 'dotenv';
dotenv.config();

const GRAPH_API = 'https://graph.facebook.com/v25.0';

// ── Post video to Facebook Page ───────────────────────────────────────────────
export async function postVideoToFacebook({ videoUrl, title, description }) {
  const fetch = (await import('node-fetch')).default;
  const pageId    = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!pageId || !pageToken) throw new Error('FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN missing in Railway');

  console.log(`📘 Posting video to Facebook Page: "${title}"`);

  // Step 1 — Initialize upload session
  const initRes = await fetch(`${GRAPH_API}/${pageId}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_url:    videoUrl,
      title:       title?.slice(0, 255) || 'New Video',
      description: description?.slice(0, 2200) || '',
      published:   true,
      access_token: pageToken,
    }),
  });

  const result = await initRes.json();
  console.log('Facebook video post result:', JSON.stringify(result).slice(0, 200));

  if (!initRes.ok || result.error) {
    throw new Error(`Facebook video post failed: ${result.error?.message || initRes.status}`);
  }

  const postUrl = `https://www.facebook.com/${pageId}/videos/${result.id}`;
  console.log(`✅ Facebook video posted: ${postUrl}`);
  return { success: true, id: result.id, url: postUrl, platform: 'facebook' };
}

// ── Post text to Facebook Page ────────────────────────────────────────────────
export async function postTextToFacebook({ message, link }) {
  const fetch = (await import('node-fetch')).default;
  const pageId    = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!pageId || !pageToken) throw new Error('FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN missing in Railway');

  console.log(`📘 Posting text to Facebook Page`);

  const body = {
    message:      message?.slice(0, 63206) || '',
    access_token: pageToken,
    published:    true,
  };
  if (link) body.link = link;

  const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await res.json();
  if (!res.ok || result.error) throw new Error(`Facebook text post failed: ${result.error?.message || res.status}`);

  const postUrl = `https://www.facebook.com/${result.id?.replace('_', '/posts/')}`;
  console.log(`✅ Facebook text posted: ${postUrl}`);
  return { success: true, id: result.id, url: postUrl, platform: 'facebook' };
}

// ── Verify Facebook credentials ───────────────────────────────────────────────
export async function verifyFacebookCredentials() {
  const fetch = (await import('node-fetch')).default;
  const pageId    = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!pageId || !pageToken) return { connected: false, error: 'Missing FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN' };

  try {
    const res = await fetch(`${GRAPH_API}/${pageId}?fields=id,name,followers_count&access_token=${pageToken}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    console.log(`✅ Facebook connected: ${data.name} (${data.followers_count || 0} followers)`);
    return { connected: true, pageId: data.id, pageName: data.name, followers: data.followers_count || 0 };
  } catch (e) {
    return { connected: false, error: e.message };
  }
}
