import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Generate social posts ─────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { inputMode, topic, url, style, platforms, affiliate } = req.body;

  if (!inputMode || !style || !platforms?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (inputMode === 'topic' && !topic?.trim()) {
    return res.status(400).json({ error: 'Topic is required' });
  }
  if ((inputMode === 'url' || inputMode === 'affiliate') && !url?.trim()) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const PM = { facebook: 'Facebook', instagram: 'Instagram', reddit: 'Reddit' };
  const platList = platforms.map(p => PM[p]).join(', ');
  const affNote = affiliate
    ? ' Naturally embed [AFFILIATE_LINK] where it converts best without violating platform rules.'
    : '';
  const subject =
    inputMode === 'topic'
      ? `Topic: "${topic}"`
      : inputMode === 'url'
      ? `Repurpose content from this URL: ${url}`
      : `Write posts promoting this affiliate product/link: ${url}`;

  const userPrompt = `You are an expert social media copywriter. Write platform-optimised posts for: ${platList}.

${subject}
Style: ${style}${affNote}

Reply with ONLY a raw JSON object — no markdown, no code fences, no extra text:
{
  ${platforms.map(p => `"${p}": {"text": "post text here", "compliant": true, "note": "compliance note"}`).join(',\n  ')}
}

Platform rules:
- facebook: conversational, 1-3 paragraphs, emojis optional, no clickbait
- instagram: visual language, 10-20 relevant hashtags, line breaks for readability
- reddit: honest/authentic, no hype, minimal self-promotion, community-appropriate
- all: FTC-compliant if promotional, no misleading claims`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      system:
        'You are a social media content expert. Always reply with valid JSON only — no markdown, no backticks, no preamble.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = message.content
      .map(b => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('Could not parse AI response');
    }

    res.json({ posts: parsed });
  } catch (err) {
    console.error('Generation error:', err.message);
    res.status(500).json({ error: err.message || 'Generation failed' });
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
      messages: [
        {
          role: 'user',
          content: `Analyse this social media post and extract brand voice attributes as JSON:

"${post}"

Reply with this exact structure (numbers 0-100):
{
  "tone": {"conversational":0,"professional":0,"humorous":0,"direct":0,"empathetic":0},
  "style": {"emojiUse":0,"hashtags":0,"ctaStrength":0,"postLength":0,"storytelling":0},
  "phrases": ["phrase1","phrase2","phrase3"],
  "hashtags": ["#tag1","#tag2","#tag3"],
  "topics": ["topic1","topic2"]
}`,
        },
      ],
    });

    const raw = message.content[0].text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅  ContentForge API running on http://localhost:${PORT}`));
