// ─────────────────────────────────────────────────────────────────────────────
// Video Builder — clean standalone backend
// Does ONE thing: topic → script → voiceover → clips → MP4
// ~250 lines, no shared state with ContentForge main server
// ─────────────────────────────────────────────────────────────────────────────
import express    from 'express';
import cors       from 'cors';
import path       from 'path';
import fs         from 'fs';
import { exec }   from 'child_process';
import { promisify } from 'util';
import Anthropic  from '@anthropic-ai/sdk';
import { createRequire } from 'module';

const execAsync = promisify(exec);
const app  = express();
const PORT = process.env.PORT || 8081;
app.use(cors());
app.use(express.json());

// ── FFmpeg path ───────────────────────────────────────────────────────────────
let FFMPEG = 'ffmpeg';
try {
  await execAsync('ffmpeg -version');
  console.log('✅ System FFmpeg found');
} catch {
  const require = createRequire(import.meta.url);
  FFMPEG = require('ffmpeg-static');
  console.log('✅ ffmpeg-static:', FFMPEG);
}

// ── Job store ─────────────────────────────────────────────────────────────────
const jobs = new Map();
function upd(id, data) { const j = jobs.get(id); if (j) Object.assign(j, data); }

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, service: 'video-builder' }));

// ── Status ────────────────────────────────────────────────────────────────────
app.get('/status', (_req, res) => res.json({
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  openai:    !!process.env.OPENAI_API_KEY,
  pexels:    !!process.env.PEXELS_API_KEY,
  youtube:   !!process.env.YOUTUBE_REFRESH_TOKEN,
}));

// ── Create video ──────────────────────────────────────────────────────────────
app.post('/video/create', async (req, res) => {
  const { topic='', voice='nova', duration='30s', music='uplifting', ratio='9:16' } = req.body;
  if (!topic.trim()) return res.status(400).json({ error: 'topic is required' });
  const id = 'vb_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  jobs.set(id, { id, status:'processing', progress:0, step:'Starting…', topic, createdAt: new Date().toISOString(), result:null, error:null });
  res.json({ id });
  buildVideo(id, { topic:topic.trim(), voice, duration, music, ratio }).catch(e => {
    upd(id, { status:'failed', step:'❌ '+e.message, error:e.message });
    console.error('['+id+'] failed:', e.message);
  });
});

// ── Poll status ───────────────────────────────────────────────────────────────
app.get('/video/:id', (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j) return res.status(404).json({ error:'not found' });
  res.json(j);
});

// ── Download file ─────────────────────────────────────────────────────────────
app.get('/video/:id/file', (req, res) => {
  const p = `/tmp/vb_${req.params.id}.mp4`;
  if (!fs.existsSync(p)) return res.status(404).json({ error:'file not found — may have expired, regenerate' });
  const stat = fs.statSync(p);
  res.setHeader('Content-Type','video/mp4');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition',`attachment; filename="video-${req.params.id}.mp4"`);
  res.setHeader('Access-Control-Allow-Origin','*');
  fs.createReadStream(p).pipe(res);
});

// ── Publish to YouTube ────────────────────────────────────────────────────────
app.post('/video/:id/publish-youtube', async (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j?.result) return res.status(404).json({ error:'video not ready' });
  const filePath = `/tmp/vb_${req.params.id}.mp4`;
  if (!fs.existsSync(filePath)) return res.status(404).json({ error:'video file not found' });
  if (!process.env.YOUTUBE_REFRESH_TOKEN) return res.status(400).json({ error:'YOUTUBE_REFRESH_TOKEN not set in Railway Variables' });
  try {
    // Refresh access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ client_id: process.env.YOUTUBE_CLIENT_ID, client_secret: process.env.YOUTUBE_CLIENT_SECRET, refresh_token: process.env.YOUTUBE_REFRESH_TOKEN, grant_type:'refresh_token' }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(401).json({ error:'YouTube auth failed — refresh token may be expired' });
    const accessToken = tokenData.access_token;
    const title = (j.result.hook || j.topic).slice(0,100);
    const desc  = (j.result.script || '') + '\n\n' + (j.result.hashtags || '');
    // Upload video
    const videoData = fs.readFileSync(filePath);
    const uploadRes = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=media&part=snippet,status`,
      {
        method:'POST',
        headers:{ Authorization:'Bearer '+accessToken, 'Content-Type':'video/mp4', 'Content-Length': videoData.length },
        body: videoData,
      }
    );
    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error:'YouTube upload failed: '+err.slice(0,200) });
    }
    const uploadData = await uploadRes.json();
    const videoId = uploadData.id;
    // Set metadata
    await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', {
      method:'PUT',
      headers:{ Authorization:'Bearer '+accessToken, 'Content-Type':'application/json' },
      body: JSON.stringify({ id:videoId, snippet:{ title, description:desc, categoryId:'22', tags:['shorts','homebusiness','sidehustle'] }, status:{ privacyStatus: req.body.privacy||'public', selfDeclaredMadeForKids:false } }),
    });
    res.json({ success:true, videoId, youtubeUrl:`https://youtube.com/shorts/${videoId}` });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Delete job ────────────────────────────────────────────────────────────────
app.delete('/video/:id', (req, res) => {
  const p = `/tmp/vb_${req.params.id}.mp4`;
  try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  jobs.delete(req.params.id);
  res.json({ deleted:true });
});

// ── List recent jobs ──────────────────────────────────────────────────────────
app.get('/videos', (_req, res) => {
  const list = [...jobs.values()].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,20);
  res.json({ videos: list });
});

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
async function buildVideo(id, { topic, voice, duration, music, ratio }) {
  const tmp = `/tmp/vbdir_${id}`;
  fs.mkdirSync(tmp, { recursive:true });
  const DIM = { '9:16':{w:720,h:1280},'16:9':{w:1280,h:720},'1:1':{w:720,h:720},'4:5':{w:720,h:900} };
  const { w, h } = DIM[ratio]||DIM['9:16'];
  const ff = FFMPEG;

  try {
    // ── Step 1: Script via Claude ───────────────────────────────────────────
    upd(id, { progress:10, step:'✍️ Writing script…' });
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const secs = duration==='60s'?60:duration==='45s'?45:30;
    const words = Math.round(secs * 2.3);
    const scriptMsg = await claude.messages.create({
      model:'claude-sonnet-4-6', max_tokens:600,
      system:`You write short social video scripts for Facebook and TikTok. Write a ${secs}-second script (~${words} words) on the topic given. Format: HOOK (first sentence, grabs attention), then 3-4 short punchy sentences, then a CTA. Return only the script text, no labels, no markdown.`,
      messages:[{ role:'user', content:`Topic: ${topic}` }],
    });
    const scriptText = scriptMsg.content[0].text.trim();
    if (!scriptText) throw new Error('Script generation failed');
    // Generate hook and hashtags
    const hook = scriptText.split(/[.!?]/)[0].trim();
    const tags = '#homebusiness #sidehustle #workfromhome #makemoneyonline #entrepreneur';
    upd(id, { progress:20, step:'🎙 Generating voiceover…', result:{ script:scriptText, hook, hashtags:tags } });

    // ── Step 2: Voiceover via OpenAI TTS ───────────────────────────────────
    const audioFile = path.join(tmp, 'voice.mp3');
    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method:'POST',
      headers:{ Authorization:'Bearer '+process.env.OPENAI_API_KEY, 'Content-Type':'application/json' },
      body: JSON.stringify({ model:'tts-1', voice, input:scriptText }),
    });
    if (!ttsRes.ok) throw new Error('TTS failed HTTP '+ttsRes.status+': '+(await ttsRes.text()).slice(0,100));
    const ttsBuf = Buffer.from(await ttsRes.arrayBuffer());
    if (!ttsBuf||ttsBuf.length<500) throw new Error('TTS returned empty audio');
    fs.writeFileSync(audioFile, ttsBuf);
    console.log('['+id+'] ✅ Voiceover:', ttsBuf.length, 'bytes');
    upd(id, { progress:30, step:'🔍 Planning scenes…' });

    // ── Step 3: Keywords via Claude ─────────────────────────────────────────
    const sentences = scriptText.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>8).slice(0,6);
    const kwMsg = await claude.messages.create({
      model:'claude-sonnet-4-6', max_tokens:200,
      system:'Return a JSON array of Pexels search phrases — one per sentence. Each phrase: 3-5 words, specific visual action and setting. Examples: "woman baking bread kitchen", "person laptop home office morning", "entrepreneur excited phone notification". Reply JSON array only.',
      messages:[{ role:'user', content:`Topic: "${topic}"\nSentences:\n${sentences.map((s,i)=>`${i+1}. ${s}`).join('\n')}` }],
    });
    let keywords = sentences.map((_,i)=>['home business person','person working laptop','entrepreneur success home','small business owner','person happy phone','side hustle products'][i]||'person home success');
    try {
      const raw = kwMsg.content[0].text.replace(/```json|```/g,'').trim();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length>0) keywords = parsed.map(k=>String(k).slice(0,60));
    } catch {}
    console.log('['+id+'] Keywords:', keywords);
    upd(id, { progress:40, step:`🎬 Fetching ${keywords.length} video clips…` });

    // ── Step 4: Pexels clips ────────────────────────────────────────────────
    const pKey = process.env.PEXELS_API_KEY;
    if (!pKey) throw new Error('PEXELS_API_KEY not set in Railway Variables');
    const orient = ratio==='16:9' ? 'landscape' : 'portrait';
    const clipPaths = [];

    for (let i=0; i<keywords.length; i++) {
      try {
        const q = encodeURIComponent(keywords[i]);
        const pr = await fetch(`https://api.pexels.com/videos/search?query=${q}&per_page=3&orientation=${orient}`,
          { headers:{ Authorization:pKey } });
        if (!pr.ok) { console.warn('['+id+'] Pexels HTTP',pr.status,'for',keywords[i]); continue; }
        const pd = await pr.json();
        // Pick best quality file
        let url = null;
        for (const vid of (pd.videos||[])) {
          const files = (vid.video_files||[]).sort((a,b)=>(b.width||0)-(a.width||0));
          const f = files.find(f=>f.link) || files[0];
          if (f?.link) { url=f.link; break; }
        }
        if (!url) { console.warn('['+id+'] No file for',keywords[i]); continue; }
        // Download
        const cr = await fetch(url);
        if (!cr.ok) continue;
        const cb = Buffer.from(await cr.arrayBuffer());
        if (!cb||cb.length<5000) continue;
        const raw  = path.join(tmp, `raw_${i}.mp4`);
        const norm = path.join(tmp, `norm_${i}.mp4`);
        fs.writeFileSync(raw, cb);
        // Normalize: scale to target, remove audio, 24fps
        await execAsync(`"${ff}" -y -i "${raw}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}" -c:v libx264 -preset ultrafast -crf 26 -r 24 -an "${norm}"`);
        if (fs.existsSync(norm) && fs.statSync(norm).size>1000) {
          clipPaths.push(norm);
          console.log('['+id+'] ✅ Clip '+(i+1)+':',Math.round(fs.statSync(norm).size/1024)+'KB');
        }
      } catch(e) { console.warn('['+id+'] Clip '+(i+1)+' error:',e.message); }
      upd(id, { step:`🎬 Clip ${i+1}/${keywords.length} fetched` });
      await new Promise(r=>setTimeout(r,200));
    }
    if (clipPaths.length===0) throw new Error('No video clips downloaded — check PEXELS_API_KEY in Railway Variables');
    upd(id, { progress:60, step:`🎞 Assembling ${clipPaths.length} clips…` });

    // ── Step 5: Get audio duration ──────────────────────────────────────────
    let audioDur = 30;
    try {
      const pr = await execAsync(`"${ff}" -i "${audioFile}" -f null /dev/null`).catch(e=>({stderr:e.stderr||''}));
      const m = (pr.stderr||'').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (m) audioDur = parseInt(m[1])*3600+parseInt(m[2])*60+parseFloat(m[3]);
    } catch {}
    console.log('['+id+'] Audio duration:', audioDur.toFixed(1)+'s');

    // ── Step 6: Trim each clip to equal share of audio duration ─────────────
    const perClip = audioDur / clipPaths.length;
    const trimPaths = [];
    for (let ti=0; ti<clipPaths.length; ti++) {
      const tp = path.join(tmp, `trim_${ti}.mp4`);
      try {
        await execAsync(`"${ff}" -y -i "${clipPaths[ti]}" -t ${perClip.toFixed(2)} -c:v libx264 -preset ultrafast -crf 26 -r 24 "${tp}"`);
        trimPaths.push(fs.existsSync(tp)&&fs.statSync(tp).size>500 ? tp : clipPaths[ti]);
      } catch { trimPaths.push(clipPaths[ti]); }
    }

    // ── Step 7: Concatenate ─────────────────────────────────────────────────
    const concatPath = path.join(tmp, 'concat.mp4');
    if (trimPaths.length===1) {
      fs.copyFileSync(trimPaths[0], concatPath);
    } else {
      const fi = trimPaths.map((_,i)=>`[${i}:v]`).join('');
      const fe = `${fi}concat=n=${trimPaths.length}:v=1:a=0[outv]`;
      await execAsync(`"${ff}" -y ${trimPaths.map(p=>`-i "${p}"`).join(' ')} -filter_complex "${fe}" -map "[outv]" -c:v libx264 -preset ultrafast -crf 26 -r 24 "${concatPath}"`);
    }
    if (!fs.existsSync(concatPath)||fs.statSync(concatPath).size<1000) throw new Error('Clip concatenation failed');
    upd(id, { progress:75, step:'🎙 Mixing audio…' });

    // ── Step 8: ONE encode — video + voiceover + optional music ─────────────
    // This is the only FFmpeg command that touches audio
    // No -c:a copy anywhere — full re-encode ensures audio stream exists
    const finalPath = `/tmp/vb_${id}.mp4`;
    const MUSIC_URLS = {
      uplifting:'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
      calm:     'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb749bc13.mp3',
      energetic:'https://cdn.pixabay.com/audio/2023/06/08/audio_b509cd8ba1.mp3',
      corporate:'https://cdn.pixabay.com/audio/2022/10/25/audio_946b4a68ec.mp3',
    };

    let musicPath = null;
    if (music && music !== 'none') {
      try {
        const mRes = await fetch(MUSIC_URLS[music]||MUSIC_URLS.uplifting);
        if (mRes.ok) {
          const mBuf = Buffer.from(await mRes.arrayBuffer());
          if (mBuf&&mBuf.length>5000) {
            musicPath = path.join(tmp, 'music.mp3');
            fs.writeFileSync(musicPath, mBuf);
            console.log('['+id+'] ✅ Music:', Math.round(mBuf.length/1024)+'KB');
          }
        }
      } catch(e) { console.warn('['+id+'] Music skipped:', e.message); }
    }

    // Build final command
    let cmd;
    if (musicPath) {
      // Three inputs: video, voiceover, music
      // Mix voice at 100% + music at 10%, use -shortest to match audio length
      cmd = `"${ff}" -y -i "${concatPath}" -i "${audioFile}" -stream_loop -1 -i "${musicPath}" `+
            `-filter_complex "[1:a]volume=1.0[v];[2:a]volume=0.10[m];[v][m]amix=inputs=2:duration=first[aout]" `+
            `-map 0:v -map "[aout]" -c:v libx264 -preset ultrafast -crf 24 -r 24 -c:a aac -b:a 128k -shortest "${finalPath}"`;
    } else {
      // Two inputs: video + voiceover only
      cmd = `"${ff}" -y -i "${concatPath}" -i "${audioFile}" `+
            `-map 0:v -map 1:a -c:v libx264 -preset ultrafast -crf 24 -r 24 -c:a aac -b:a 128k -shortest "${finalPath}"`;
    }
    console.log('['+id+'] Final encode (music:', !!musicPath, ')');
    await execAsync(cmd);

    const finalSz = fs.existsSync(finalPath) ? fs.statSync(finalPath).size : 0;
    if (finalSz<10000) throw new Error('Final encode produced empty file ('+finalSz+' bytes)');
    console.log('['+id+'] ✅ Final video:', Math.round(finalSz/1024/1024*10)/10+'MB');

    // Verify audio stream exists
    const probe = await execAsync(`"${ff}" -i "${finalPath}" -f null /dev/null`).catch(e=>({stderr:e.stderr||''}));
    const hasAudio = (probe.stderr||'').includes('Audio:');
    console.log('['+id+'] 🔊 Audio stream:', hasAudio?'YES ✅':'NO ❌');

    // Cleanup tmp dir — keep final file
    try { fs.rmSync(tmp, { recursive:true }); } catch {}

    upd(id, {
      status:'completed', progress:100,
      step:'✅ Video ready!',
      result:{
        script:scriptText, hook, hashtags:tags,
        fileUrl:`/video/${id}/file`,
        clipsCount:clipPaths.length,
        hasAudio, ratio,
        duration: audioDur.toFixed(1),
        savedAt: new Date().toISOString(),
      },
    });

  } catch(e) {
    try { fs.rmSync(tmp, { recursive:true }); } catch {}
    throw e;
  }
}

app.listen(PORT, () => console.log(`🎬 Video Builder running on port ${PORT}`));
