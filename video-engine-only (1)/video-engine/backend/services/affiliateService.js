import fetch from 'node-fetch';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Extract affiliate data from URL ───────────────────────────────────────────
export async function extractAffiliateData(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContentForge/1.0)' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Could not fetch: HTTP ${res.status}`);
    const html = await res.text();

    // Extract text content
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);

    // Parse URL for existing params
    const parsed = new URL(url);
    const existingParams = Object.fromEntries(parsed.searchParams);
    const affiliateId = existingParams.tag || existingParams.ref || existingParams.aff_id ||
      existingParams.affiliate || existingParams.partner || null;

    // Use Claude to extract product details
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 600,
      system: 'You are a product data extractor. Reply with valid JSON only.',
      messages: [{
        role: 'user',
        content: `Extract product information from this webpage content for video marketing:

URL: ${url}
Content: "${text}"

Return JSON:
{
  "productName": "...",
  "price": "...",
  "mainBenefit": "...",
  "targetAudience": "...",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "category": "...",
  "brand": "...",
  "affiliateId": "${affiliateId || 'not found'}",
  "platform": "amazon/clickbank/shareasale/cj/other"
}`,
      }],
    });

    const raw = message.content[0].text.trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    const productData = JSON.parse(raw);
    return { ...productData, originalUrl: url, existingParams };

  } catch (err) {
    throw new Error(`Affiliate extraction failed: ${err.message}`);
  }
}

// ── Build UTM-tagged URL ───────────────────────────────────────────────────────
export function buildUTMUrl(url, params = {}) {
  try {
    const parsed = new URL(url);
    const utmDefaults = {
      utm_source: params.source || 'contentforge',
      utm_medium: params.medium || 'video',
      utm_campaign: params.campaign || 'ai_video',
      utm_content: params.content || params.platform || 'video',
      utm_term: params.term || '',
    };

    Object.entries(utmDefaults).forEach(([k, v]) => {
      if (v) parsed.searchParams.set(k, v);
    });

    return parsed.toString();
  } catch {
    return url;
  }
}

// ── Shorten URL using TinyURL ─────────────────────────────────────────────────
export async function shortenUrl(url) {
  try {
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return url;
    const short = await res.text();
    return short.startsWith('http') ? short.trim() : url;
  } catch {
    return url;
  }
}

// ── Full affiliate URL pipeline ────────────────────────────────────────────────
export async function processAffiliateUrl(url, platform = 'video') {
  const utmUrl = buildUTMUrl(url, { platform, source: 'contentforge_video' });
  const shortUrl = await shortenUrl(utmUrl);
  return { original: url, utm: utmUrl, short: shortUrl };
}
