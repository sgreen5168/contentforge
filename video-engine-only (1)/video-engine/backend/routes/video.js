import { Router } from 'express';
import { generateVideoScript } from '../services/scriptService.js';
import { generateSceneClips, buildVideoPrompt } from '../services/runwayService.js';
import { generateVoiceover } from '../services/elevenLabsService.js';
import { assembleVideo, generateSRT } from '../services/ffmpegService.js';
import { processAffiliateUrl } from '../services/affiliateService.js';
import { createJob, getJob, updateJob, getAllJobs } from '../queues/jobQueue.js';

const router = Router();

// ── POST /api/video/generate ──────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  const {
    inputMode = 'topic',
    topic,
    url,
    affiliateUrl,
    persona = 'ugc',
    duration = '30s',
    style = 'ugc',
    platforms = ['tiktok'],
    autoUpload = false,
  } = req.body;

  if (!topic && !url && !affiliateUrl) {
    return res.status(400).json({ error: 'topic, url, or affiliateUrl is required' });
  }

  // Create job
  const job = createJob({ inputMode, topic, url, affiliateUrl, persona, duration, style, platforms, autoUpload });
  res.json({ jobId: job.id, status: 'queued', message: 'Video generation started' });

  // Run async
  runVideoGeneration(job.id, req.body).catch(err => {
    updateJob(job.id, { status: 'failed', error: err.message });
    console.error('Video generation error:', err);
  });
});

// ── Async video generation pipeline ──────────────────────────────────────────
async function runVideoGeneration(jobId, params) {
  const {
    inputMode, topic, url, affiliateUrl, persona,
    duration, style, platforms, autoUpload
  } = params;

  try {
    // Step 1: Process affiliate URL if provided
    let processedAffiliate = null;
    if (affiliateUrl) {
      updateJob(jobId, { status: 'processing', progress: 5, step: 'Processing affiliate link...' });
      processedAffiliate = await processAffiliateUrl(affiliateUrl, 'video');
    }

    // Step 2: Generate script with Claude
    updateJob(jobId, { progress: 15, step: 'Writing video script with AI...' });
    const script = await generateVideoScript({
      inputMode, topic, url,
      affiliateUrl: processedAffiliate?.short || affiliateUrl,
      persona, duration, style, platforms,
    });

    updateJob(jobId, { progress: 30, step: 'Script ready — generating voiceover...', script });

    // Step 3: Generate voiceover with ElevenLabs
    let voiceover = null;
    try {
      voiceover = await generateVoiceover({
        script: script.fullScript,
        persona,
        jobId,
      });
    } catch (err) {
      console.warn('Voiceover failed (continuing without audio):', err.message);
      updateJob(jobId, { step: 'Voiceover unavailable — continuing with video...' });
    }

    // Step 4: Generate video scenes with RunwayML
    updateJob(jobId, { progress: 45, step: 'Generating video scenes with AI...' });
    let clips = [];
    try {
      const enrichedScenes = script.sceneDescriptions.map(scene => ({
        ...scene,
        visual: buildVideoPrompt(scene, persona, style),
      }));
      clips = await generateSceneClips(enrichedScenes);
    } catch (err) {
      console.warn('Video generation failed (script-only mode):', err.message);
      updateJob(jobId, { step: 'Video generation unavailable — saving script only...' });
    }

    // Step 5: Assemble final video with FFmpeg
    let finalVideo = null;
    if (clips.some(c => c.videoUrl)) {
      updateJob(jobId, { progress: 75, step: 'Assembling final video...' });
      try {
        finalVideo = await assembleVideo({
          clips: clips.filter(c => c.videoUrl),
          audioPath: voiceover?.audioPath,
          jobId,
          outputFilename: `contentforge_${jobId}.mp4`,
        });
      } catch (err) {
        console.warn('Assembly failed:', err.message);
      }
    }

    // Step 6: Generate SRT captions
    const captions = generateSRT(script.sceneDescriptions);

    // Step 7: Auto-upload if requested
    let uploadResults = [];
    if (autoUpload && finalVideo && platforms.length > 0) {
      updateJob(jobId, { progress: 90, step: 'Uploading to platforms...' });
      const { uploadToAllPlatforms } = await import('../services/uploadService.js');
      uploadResults = await uploadToAllPlatforms({
        videoPath: finalVideo.outputPath,
        script,
        platforms,
      });
    }

    // Complete
    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      step: 'Complete!',
      result: {
        script,
        voiceover: voiceover ? { audioPath: voiceover.audioPath } : null,
        clips: clips.map(c => ({ scene: c.scene, videoUrl: c.videoUrl, status: c.status })),
        finalVideo: finalVideo ? {
          path: finalVideo.outputPath,
          filename: finalVideo.filename,
          url: `/output/${finalVideo.filename}`,
        } : null,
        captions,
        uploadResults,
        affiliateData: processedAffiliate,
      },
    });

  } catch (err) {
    updateJob(jobId, { status: 'failed', error: err.message, progress: 0 });
    throw err;
  }
}

// ── GET /api/video/job/:id ────────────────────────────────────────────────────
router.get('/job/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// ── GET /api/video/jobs ───────────────────────────────────────────────────────
router.get('/jobs', (_req, res) => {
  res.json(getAllJobs().slice(0, 20));
});

// ── GET /api/video/job/:id/stream — SSE progress stream ──────────────────────
router.get('/job/:id/stream', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify(job)}\n\n`);

  const { onJobUpdate } = require('../queues/jobQueue.js');
  const cleanup = onJobUpdate(req.params.id, (updatedJob) => {
    res.write(`data: ${JSON.stringify(updatedJob)}\n\n`);
    if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
      res.end();
      cleanup();
    }
  });

  req.on('close', cleanup);
});

export default router;
