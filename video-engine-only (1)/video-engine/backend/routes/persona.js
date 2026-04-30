import { Router } from 'express';
import { generateVSLScript, generateCTAOverlays } from '../services/scriptService.js';
import { extractAffiliateData, processAffiliateUrl, shortenUrl } from '../services/affiliateService.js';
import { getAvailableVoices, estimateVoiceoverCost } from '../services/elevenLabsService.js';
import { uploadToAllPlatforms } from '../services/uploadService.js';

// ── PERSONA ROUTES ─────────────────────────────────────────────────────────────
export const personaRouter = Router();

const PERSONAS = [
  {
    id: 'testimonial',
    name: 'Testimonial',
    description: 'Authentic user sharing personal experience',
    bestFor: ['product reviews', 'case studies', 'before/after'],
    tone: 'emotional, relatable, first-person',
    voiceStyle: 'warm, conversational',
  },
  {
    id: 'demo',
    name: 'Product Demo',
    description: 'Clear step-by-step product demonstration',
    bestFor: ['software', 'physical products', 'tutorials'],
    tone: 'clear, instructional, professional',
    voiceStyle: 'clear, authoritative',
  },
  {
    id: 'influencer',
    name: 'Influencer Style',
    description: 'High-energy trendy social content',
    bestFor: ['fashion', 'lifestyle', 'beauty', 'tech'],
    tone: 'energetic, trendy, aspirational',
    voiceStyle: 'upbeat, enthusiastic',
  },
  {
    id: 'educator',
    name: 'Educator / Expert',
    description: 'Share knowledge and establish authority',
    bestFor: ['courses', 'B2B', 'how-to content', 'tips'],
    tone: 'authoritative, helpful, credible',
    voiceStyle: 'measured, confident',
  },
  {
    id: 'ugc',
    name: 'UGC Creator',
    description: 'Raw authentic user-generated content feel',
    bestFor: ['CPG products', 'apps', 'services', 'any niche'],
    tone: 'casual, authentic, unscripted',
    voiceStyle: 'natural, real',
  },
];

personaRouter.get('/', (_req, res) => res.json({ personas: PERSONAS }));

personaRouter.get('/voices', async (_req, res) => {
  try {
    const voices = await getAvailableVoices();
    res.json({ voices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

personaRouter.post('/estimate', (req, res) => {
  const { scriptLength } = req.body;
  const cost = estimateVoiceoverCost(scriptLength || 500);
  res.json({ estimatedCostUSD: cost, charactersCount: scriptLength });
});

// ── VSL ROUTES ────────────────────────────────────────────────────────────────
export const vslRouter = Router();

vslRouter.post('/generate', async (req, res) => {
  const { product, price, audience, pain, solution, duration = 30, affiliateUrl } = req.body;

  if (!product || !audience || !pain) {
    return res.status(400).json({ error: 'product, audience, and pain are required' });
  }

  try {
    const script = await generateVSLScript({ product, price, audience, pain, solution, duration, affiliateUrl });
    res.json({ script });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

vslRouter.post('/cta', async (req, res) => {
  const { script, platform, affiliateUrl } = req.body;
  if (!script) return res.status(400).json({ error: 'script is required' });
  try {
    const overlays = await generateCTAOverlays({ script, platform: platform || 'tiktok', affiliateUrl });
    res.json({ overlays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPLOAD ROUTES ─────────────────────────────────────────────────────────────
export const uploadRouter = Router();

uploadRouter.post('/platforms', async (req, res) => {
  const { videoPath, script, platforms } = req.body;
  if (!videoPath || !script || !platforms?.length) {
    return res.status(400).json({ error: 'videoPath, script, and platforms required' });
  }
  try {
    const results = await uploadToAllPlatforms({ videoPath, script, platforms });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

uploadRouter.get('/credentials', (_req, res) => {
  res.json({
    tiktok: {
      connected: !!process.env.TIKTOK_ACCESS_TOKEN,
      setupUrl: 'https://developers.tiktok.com/',
    },
    instagram: {
      connected: !!process.env.INSTAGRAM_ACCESS_TOKEN,
      setupUrl: 'https://developers.facebook.com/',
    },
    youtube: {
      connected: !!process.env.YOUTUBE_ACCESS_TOKEN,
      setupUrl: 'https://console.cloud.google.com/',
    },
  });
});

// ── AFFILIATE ROUTES ──────────────────────────────────────────────────────────
export const affiliateRouter = Router();

affiliateRouter.post('/extract', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const data = await extractAffiliateData(url);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

affiliateRouter.post('/process', async (req, res) => {
  const { url, platform } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const result = await processAffiliateUrl(url, platform);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

affiliateRouter.post('/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const shortened = await shortenUrl(url);
    res.json({ original: url, shortened });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Re-export for server.js
export default affiliateRouter;
