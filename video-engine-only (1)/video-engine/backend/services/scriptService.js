import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Generate video script from topic/URL/affiliate ────────────────────────────
export async function generateVideoScript({
  inputMode, topic, url, affiliateUrl, persona, duration, style, platforms
}) {
  const durationMap = { '15s': 15, '30s': 30, '60s': 60 };
  const secs = durationMap[duration] || 30;
  const platList = platforms.join(', ');

  const personaInstructions = {
    testimonial: 'Write as a genuine user sharing their personal experience. First-person, emotional, relatable. Start with a problem you had.',
    demo: 'Write as a product demonstrator. Clear, step-by-step, focus on features and how to use them. Direct and informative.',
    influencer: 'Write as a social media influencer. Trendy, energetic, use current slang. Hook immediately, keep energy high throughout.',
    educator: 'Write as an expert teaching something valuable. Share a tip, insight, or how-to. Authoritative but approachable.',
    ugc: 'Write as authentic user-generated content. Casual, unscripted feel, honest review tone. Like a friend recommending something.',
  };

  const subject = inputMode === 'topic'
    ? `Topic: "${topic}"`
    : inputMode === 'url'
    ? `Product/content from this URL: ${url}`
    : `Affiliate product: ${affiliateUrl}`;

  const prompt = `You are an expert short-form video scriptwriter for ${platList}.

${subject}
Persona style: ${persona} — ${personaInstructions[persona] || personaInstructions.ugc}
Video duration: ${secs} seconds
Visual style: ${style}

Write a complete video script optimized for ${secs}-second ${platList} content.

Return ONLY a JSON object:
{
  "hook": "Opening line (first 3 seconds — must stop the scroll)",
  "problem": "Pain point or setup (seconds 3-8)",
  "solution": "Main content/value/product showcase (seconds 8-${secs-7})",
  "cta": "Call to action (last 5 seconds)",
  "fullScript": "Complete word-for-word voiceover script",
  "sceneDescriptions": [
    {"scene": 1, "duration": 3, "visual": "What to show on screen", "text": "Overlay text if any"},
    {"scene": 2, "duration": 5, "visual": "What to show on screen", "text": "Overlay text if any"}
  ],
  "hashtags": ["#tag1", "#tag2"],
  "title": "Video title for upload",
  "description": "Platform description/caption",
  "estimatedDuration": ${secs}
}`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: 'You are a short-form video script expert. Reply with valid JSON only.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  return JSON.parse(raw);
}

// ── Generate VSL script (Video Sales Letter) ──────────────────────────────────
export async function generateVSLScript({
  product, price, audience, pain, solution, duration, affiliateUrl
}) {
  const prompt = `You are an expert direct-response copywriter specializing in Video Sales Letters (VSLs).

Product: ${product}
Price: ${price}
Target audience: ${audience}
Main pain point: ${pain}
Solution offered: ${solution}
Duration: ${duration} seconds
${affiliateUrl ? `Affiliate link: ${affiliateUrl}` : ''}

Write a high-converting VSL script using this structure:
1. Pattern interrupt hook (grabs attention in 3 seconds)
2. Agitate the problem (emotional pain)
3. Introduce the solution
4. Social proof / credibility
5. Features → Benefits
6. Urgency / scarcity
7. Strong CTA

Return ONLY a JSON object:
{
  "hook": "Opening pattern interrupt",
  "problemAgitation": "Emotional problem deepening",
  "solutionReveal": "Product introduction",
  "socialProof": "Testimonial or credibility statement",
  "benefitsList": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "urgency": "Scarcity or urgency statement",
  "cta": "Call to action with link",
  "fullScript": "Complete VSL word-for-word script",
  "sceneDescriptions": [
    {"scene": 1, "duration": 5, "visual": "Visual description", "text": "Overlay text"}
  ],
  "estimatedDuration": ${duration},
  "title": "VSL title",
  "description": "Platform caption"
}`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 3000,
    system: 'You are a VSL copywriting expert. Reply with valid JSON only.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  return JSON.parse(raw);
}

// ── Generate CTA overlay text ─────────────────────────────────────────────────
export async function generateCTAOverlays({ script, platform, affiliateUrl }) {
  const prompt = `Generate CTA overlay text for a ${platform} video.

Script: "${script.hook} ... ${script.cta}"
${affiliateUrl ? `Affiliate URL: ${affiliateUrl}` : ''}

Return ONLY a JSON array of CTA overlays:
[
  {"timestamp": 0, "text": "Hook text", "style": "hook", "duration": 3},
  {"timestamp": 25, "text": "CTA button text", "style": "cta", "duration": 5},
  {"timestamp": 28, "text": "Link in bio / swipe up", "style": "link", "duration": 5}
]`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    system: 'Reply with valid JSON only.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  return JSON.parse(raw);
}
