import { Router } from 'express';
import { uploadToAllPlatforms } from '../services/uploadService.js';

const router = Router();

router.post('/platforms', async (req, res) => {
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

router.get('/credentials', (_req, res) => {
  res.json({
    tiktok:    { connected: !!process.env.TIKTOK_ACCESS_TOKEN,    setupUrl: 'https://developers.tiktok.com/' },
    instagram: { connected: !!process.env.INSTAGRAM_ACCESS_TOKEN, setupUrl: 'https://developers.facebook.com/' },
    youtube:   { connected: !!process.env.YOUTUBE_ACCESS_TOKEN,   setupUrl: 'https://console.cloud.google.com/' },
  });
});

export default router;
