import { Router } from 'express';
import { extractAffiliateData, processAffiliateUrl, shortenUrl } from '../services/affiliateService.js';

const router = Router();

router.post('/extract', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const data = await extractAffiliateData(url);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/process', async (req, res) => {
  const { url, platform } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const result = await processAffiliateUrl(url, platform);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const shortened = await shortenUrl(url);
    res.json({ original: url, shortened });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
