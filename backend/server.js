import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── CORS — allow ALL origins ──────────────────────────────────────────────────
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());

// ── Health / root ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ status: 'ContentForge API v2.0 running' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0' }));

// ── Helper: fetch URL content ─────────────────────────────────────────────────
async function fetchUrlContent(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContentForge/2.0)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Could not fetch URL: HTTP ${response.status}`);
  const html = await response.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);
}

// ── Generate posts ────────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { inputMode, topic, url, style, platforms, affiliate } = req.body;

  if (!inputMode || !style || !platforms?.length)
    return res.status(400).json({ error: 'Missing required fields' });
  if (inputMode === 'topic' && !topic?.trim())
    return res.status(400).json({ error: 'Topic is required' });
  if ((inputMode === 'url' || inputMode === 'affiliate') && !url?.trim())
    return res.status(400).json({ error: 'URL is required' });

  const PM = { facebook: 'Facebook', instagram: 'Instagram', reddit: 'Reddit' };
  const platList = platforms.map(p => PM[p]).join(', ');
  const affNote = affiliate ? ' Naturally embed [AFFILIATE_LINK] where it converts best.' : '';

  let subject;
  try {
    if (inputMode === 'topic') {
      subject = `Topic: "${topic}"`;
    } else if (inputMode === 'url') {
      const content = await fetchUrlContent(url);
      subject = `Repurpose this webpage content:\n\n"${content}"`;
    } else {
      subject = `Promote this affiliate product/link: ${url}\nFocus on benefits and natural call-to-action.`;
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const prompt = `You are an expert social media copywriter. Write platform-optimised posts for: ${platList}.

${subject}
Style: ${style}${affNote}

Reply with ONLY a raw JSON object:
{
  ${platforms.map(p => `"${p}": {"text": "post text here", "compliant": true, "note": "compliance note"}`).join(',\n  ')}
}

Platform rules:
- facebook: conversational, 1-3 paragraphs, emojis optional, no clickbait
- instagram: visual language, 10-20 hashtags, line breaks for readability
- reddit: honest/authentic, no hype, community-appropriate
- all: FTC-compliant if promotional`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      system: 'Reply with valid JSON only — no markdown, no backticks.',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content
      .map(b => (b.type === 'text' ? b.text : '')).join('').trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error('Could not parse AI response');
    }
    res.json({ posts: parsed });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Brand voice learning ──────────────────────────────────────────────────────
app.post('/api/brand/learn', async (req, res) => {
  const { post } = req.body;
  if (!post?.trim()) return res.status(400).json({ error: 'Post content required' });
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 800,
      system: 'You are a brand voice analyst. Reply with valid JSON only.',
      messages: [{
        role: 'user',
        content: `Analyse this post and extract brand voice as JSON:\n\n"${post}"\n\nStructure:\n{"tone":{"conversational":0,"professional":0,"humorous":0,"direct":0,"empathetic":0},"style":{"emojiUse":0,"hashtags":0,"ctaStrength":0,"postLength":0,"storytelling":0},"phrases":[],"hashtags":[],"topics":[]}`,
      }],
    });
    const raw = message.content[0].text.trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ ContentForge API v2.0 on port ${PORT}`));
