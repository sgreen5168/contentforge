const BASE = 'https://contentforge-production-6e13.up.railway.app/api';

export async function generatePosts({ inputMode, topic, url, style, platforms, affiliate }) {
  try {
    const res = await fetch(`${BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputMode, topic, url, style, platforms, affiliate }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    // Return both posts and the shortened URL if one was generated
    return { posts: data.posts, shortUrl: data.shortUrl || null };
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot reach the server. Please check your internet connection.');
    }
    throw err;
  }
}

export async function shortenUrl(url) {
  try {
    const res = await fetch(`${BASE}/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Shortening failed');
    return data.shortened;
  } catch (err) {
    throw new Error('Could not shorten URL: ' + err.message);
  }
}

export async function learnBrandVoice(post) {
  try {
    const res = await fetch(`${BASE}/brand/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot reach the server. Please check your internet connection.');
    }
    throw err;
  }
}
