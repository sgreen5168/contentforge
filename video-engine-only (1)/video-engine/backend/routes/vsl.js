import { Router } from 'express';
import { generateVSLScript, generateCTAOverlays } from '../services/scriptService.js';

const router = Router();

router.post('/generate', async (req, res) => {
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

router.post('/cta', async (req, res) => {
  const { script, platform, affiliateUrl } = req.body;
  if (!script) return res.status(400).json({ error: 'script is required' });
  try {
    const overlays = await generateCTAOverlays({ script, platform: platform || 'tiktok', affiliateUrl });
    res.json({ overlays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
