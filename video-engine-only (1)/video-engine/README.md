# ⚡ ContentForge AI Video Engine — Phase 1 MVP

A complete short-form video generation system that turns any topic, URL, or affiliate link into publish-ready videos for TikTok, Instagram Reels, and YouTube Shorts.

---

## Architecture

```
video-engine/
├── backend/
│   ├── server.js                    # Express server — main entry point
│   ├── routes/
│   │   ├── video.js                 # POST /api/video/generate + job polling
│   │   ├── persona.js               # GET /api/persona — persona configs
│   │   ├── vsl.js                   # POST /api/vsl/generate — VSL scripts
│   │   ├── upload.js                # POST /api/upload/platforms
│   │   └── affiliate.js             # POST /api/affiliate/extract + shorten
│   ├── services/
│   │   ├── scriptService.js         # Claude AI — generates video scripts
│   │   ├── runwayService.js         # RunwayML — AI video clip generation
│   │   ├── elevenLabsService.js     # ElevenLabs — voiceover generation
│   │   ├── ffmpegService.js         # FFmpeg — assembles final video
│   │   ├── uploadService.js         # TikTok / Instagram / YouTube upload
│   │   └── affiliateService.js      # URL extraction, UTM, shortening
│   └── queues/
│       └── jobQueue.js              # In-memory job queue with SSE events
└── frontend/
    └── src/pages/
        ├── VideoEngine.jsx          # Full UI — Generate, VSL, Jobs, Upload tabs
        └── VideoEngine.module.css   # Styles
```

---

## Video Generation Pipeline

```
User Input
    │
    ▼
1. Affiliate URL Processing (if provided)
   └── Extract product data with Claude
   └── Build UTM parameters
   └── Shorten with TinyURL

    ▼
2. Script Generation (Claude AI)
   └── Hook, Problem, Solution, CTA
   └── Scene-by-scene descriptions
   └── Platform-optimised hashtags + title

    ▼
3. Voiceover Generation (ElevenLabs)
   └── Persona-matched voice selection
   └── Optimised voice settings per style
   └── MP3 saved to output/

    ▼
4. Scene Video Generation (RunwayML)
   └── Text-to-video per scene
   └── Polling until completion
   └── Downloads to output/

    ▼
5. Video Assembly (FFmpeg)
   └── Concatenates scene clips
   └── Merges with voiceover audio
   └── Scales to 1080x1920 (9:16)
   └── Adds captions (SRT)

    ▼
6. Auto-Upload (optional)
   └── TikTok API
   └── Instagram Graph API
   └── YouTube Data API v3
```

---

## Quick Start

### 1. Install dependencies

```bash
cd backend && npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

| Key | Where to get it | Cost |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | ~$0.01/script |
| `RUNWAY_API_KEY` | runwayml.com | ~$0.05/sec video |
| `ELEVENLABS_API_KEY` | elevenlabs.io | $5-22/mo |
| `TIKTOK_ACCESS_TOKEN` | developers.tiktok.com | Free |
| `INSTAGRAM_ACCESS_TOKEN` | developers.facebook.com | Free |
| `YOUTUBE_ACCESS_TOKEN` | console.cloud.google.com | Free |

### 3. Run the server

```bash
npm run dev   # Development with auto-reload
npm start     # Production
```

Server runs on `http://localhost:3002`

---

## API Reference

### Generate Video
```http
POST /api/video/generate
{
  "inputMode": "topic",           // "topic" | "url" | "affiliate"
  "topic": "morning productivity habits",
  "persona": "ugc",               // testimonial|demo|influencer|educator|ugc
  "duration": "30s",              // "15s" | "30s" | "60s"
  "style": "lifestyle",           // ugc|cinematic|lifestyle|studio|talking_head
  "platforms": ["tiktok", "instagram"],
  "autoUpload": false
}
→ { "jobId": "uuid", "status": "queued" }
```

### Poll Job Status
```http
GET /api/video/job/:jobId
→ { "status": "processing", "progress": 45, "step": "Generating scenes..." }
```

### Generate VSL Script
```http
POST /api/vsl/generate
{
  "product": "ProSkin Serum",
  "price": "$49.99",
  "audience": "Women 25-45 with dry skin",
  "pain": "Dull, dry skin despite trying many products",
  "solution": "24-hour hydration formula",
  "duration": 60
}
```

### Extract Affiliate Data
```http
POST /api/affiliate/extract
{ "url": "https://amazon.com/dp/B08N5WRWNW?tag=mysite-20" }
→ { "data": { "productName": "...", "price": "...", "mainBenefit": "..." } }
```

---

## Integrating with ContentForge

Add the Video Engine as a second service alongside your existing ContentForge backend:

```
contentstudiohub.com          → Netlify (frontend)
api.contentstudiohub.com      → Railway (ContentForge backend, port 3001)
video.contentstudiohub.com    → Railway (Video Engine backend, port 3002)
```

In your frontend, add a "Video" tab that points to the VideoEngine component.

### Add to existing frontend

```jsx
// In App.jsx, add Video Engine tab
import VideoEngine from './pages/VideoEngine.jsx';

// Add to nav
{ id: 'video', label: 'AI Video Engine', icon: '▶' }

// Add to page routing
page === 'video' && <VideoEngine />
```

---

## Minimum Viable Setup (No API Keys Yet)

The system works in **script-only mode** if you don't have RunwayML or ElevenLabs yet:

- Claude generates the full script, scene descriptions, hashtags, title ✅
- VSL Builder works fully ✅
- Affiliate extraction and URL shortening works ✅
- Video assembly and upload requires the paid APIs ⚡

---

## Platform API Setup Guides

### TikTok
1. Go to developers.tiktok.com
2. Create app → Request "Video Upload" scope
3. Implement OAuth flow → get access token
4. Set `TIKTOK_ACCESS_TOKEN` in .env

### Instagram Reels
1. Go to developers.facebook.com
2. Create app → Add Instagram Basic Display + Content Publishing
3. Get long-lived user token
4. Set `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_USER_ID` in .env
5. Set `VIDEO_BASE_URL` (Instagram requires public video URL, not local file)

### YouTube Shorts
1. Go to console.cloud.google.com
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Complete OAuth flow → get access token
5. Set `YOUTUBE_ACCESS_TOKEN` in .env

---

## Estimated Costs Per Video

| Component | 30-sec video | Notes |
|---|---|---|
| Script (Claude) | ~$0.01 | Per generation |
| Voiceover (ElevenLabs) | ~$0.05 | ~150 words |
| Video clips (RunwayML) | ~$1.50 | 6 × 5-sec clips |
| Assembly (FFmpeg) | $0 | Free, runs on your server |
| Upload (platforms) | $0 | Free APIs |
| **Total** | **~$1.56** | Per finished video |

At $5/mo ElevenLabs + $10 RunwayML credits = approximately 6 videos/month to start.
