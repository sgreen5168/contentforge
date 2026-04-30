# ⚡ ContentForge — Social AI Engine

A full-stack SaaS platform that uses Claude AI to turn any topic, URL, or affiliate link into platform-ready posts for Facebook, Instagram, and Reddit.

---

## Project Structure

```
contentforge/
├── backend/          # Express API server (Node.js + Anthropic SDK)
│   ├── server.js     # Main server — all API routes
│   ├── package.json
│   └── .env.example  # Copy to .env and add your API key
│
├── frontend/         # React + Vite UI
│   ├── src/
│   │   ├── App.jsx              # Root layout + routing
│   │   ├── components/
│   │   │   └── Sidebar.jsx      # Navigation sidebar
│   │   ├── pages/
│   │   │   ├── Composer.jsx     # AI post generation (core feature)
│   │   │   └── OtherPages.jsx   # Scheduler, Brand Voice, Analytics, Compliance
│   │   └── lib/
│   │       └── api.js           # Typed fetch wrappers for the backend
│   └── vite.config.js           # Dev proxy: /api → localhost:3001
│
└── package.json      # Root scripts (install all, dev, build)
```

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd contentforge
npm install          # installs concurrently at root
npm run install:all  # installs backend + frontend deps
```

### 2. Add your Anthropic API key

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set ANTHROPIC_API_KEY=sk-ant-...
```

Get your key at: https://console.anthropic.com

### 3. Run in development

```bash
npm run dev
# Backend:  http://localhost:3001
# Frontend: http://localhost:5173
```

Open http://localhost:5173 — type a topic and hit **Generate Posts ⚡**

---

## Features

| Feature | Status |
|---|---|
| AI Topic Composer (Facebook, Instagram, Reddit) | ✅ Live |
| URL Content Extractor | ✅ Live |
| Affiliate Link Enhancer | ✅ Live |
| Post style selector (Short, Long, Humorous, etc.) | ✅ Live |
| Brand Voice Learning (AI-powered) | ✅ Live |
| Compliance Engine (per-platform rules) | ✅ Live |
| Auto-Scheduler UI | ✅ UI ready |
| Analytics Dashboard | ✅ UI ready |

---

## API Endpoints

### `POST /api/generate`
Generate platform-optimised posts using Claude.

**Body:**
```json
{
  "inputMode": "topic",        // "topic" | "url" | "affiliate"
  "topic": "remote work tips", // required if inputMode=topic
  "url": "",                   // required if inputMode=url or affiliate
  "style": "Casual",           // Short | Long | Humorous | Educational | Casual | Promotional
  "platforms": ["facebook","instagram","reddit"],
  "affiliate": false
}
```

**Response:**
```json
{
  "posts": {
    "facebook":  { "text": "...", "compliant": true,  "note": "..." },
    "instagram": { "text": "...", "compliant": true,  "note": "..." },
    "reddit":    { "text": "...", "compliant": false, "note": "Disclose affiliation" }
  }
}
```

### `POST /api/brand/learn`
Analyse a post and extract brand voice attributes.

**Body:** `{ "post": "your post text here" }`

**Response:** Tone scores, style signals, phrases, hashtags, topics.

---

## Deployment

### Backend (Railway / Render / Fly.io)
```bash
cd backend
# Set ANTHROPIC_API_KEY and FRONTEND_URL env vars in your host dashboard
npm start
```

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build   # outputs to dist/
# Point VITE_API_URL to your deployed backend URL
# Update vite.config.js proxy target for production
```

### Environment Variables

| Variable | Where | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | backend/.env | Your Anthropic API key |
| `PORT` | backend/.env | Backend port (default: 3001) |
| `FRONTEND_URL` | backend/.env | Allowed CORS origin |

---

## Tech Stack

- **Backend:** Node.js, Express, `@anthropic-ai/sdk`
- **Frontend:** React 18, Vite, CSS Modules
- **AI:** Claude claude-opus-4-5 via Anthropic API
- **No database required** — stateless API, extend with Postgres/Redis as needed

---

## Extending

To add real scheduling (publishing to Facebook/Instagram/Reddit APIs):
1. Add OAuth flows per platform in `backend/`
2. Store scheduled posts in a database (Postgres recommended)
3. Add a cron job (node-cron or external) to call the platform APIs at scheduled times
