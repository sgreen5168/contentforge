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
    return data.posts;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot reach the server. Please check your internet connection and try again.');
    }
    throw err;
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
      throw new Error('Cannot reach the server. Please check your internet connection and try again.');
    }
    throw err;
  }
}
