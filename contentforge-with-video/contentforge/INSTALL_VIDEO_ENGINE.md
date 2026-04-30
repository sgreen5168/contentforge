# How to Install — ContentForge + Video Engine Integration

## What you're adding
4 updated files + 2 new files go into your existing GitHub repo.
No existing features are changed — the Video Engine is a new tab.

---

## Files being changed / added

| File | Action | Location in repo |
|---|---|---|
| `App.jsx` | Updated | `frontend/src/App.jsx` |
| `Sidebar.jsx` | Updated | `frontend/src/components/Sidebar.jsx` |
| `Sidebar.module.css` | Updated | `frontend/src/components/Sidebar.module.css` |
| `App.module.css` | Updated | `frontend/src/App.module.css` |
| `VideoEngine.jsx` | NEW | `frontend/src/pages/VideoEngine.jsx` |
| `VideoEngine.module.css` | NEW | `frontend/src/pages/VideoEngine.module.css` |

---

## Step-by-step install on GitHub

### Step 1 — Go to your GitHub repo
1. Go to github.com
2. Click your contentforge repository

### Step 2 — Update App.jsx
1. Click the `frontend` folder
2. Click `src` folder
3. Click `App.jsx`
4. Click the pencil icon (Edit)
5. Select all text (Ctrl+A) and delete it
6. Paste the new App.jsx contents from the zip
7. Click "Commit changes" → "Commit changes"

### Step 3 — Update Sidebar.jsx
1. Go back to `frontend/src/components/`
2. Click `Sidebar.jsx` → pencil icon
3. Select all → delete → paste new contents
4. Commit changes

### Step 4 — Update Sidebar.module.css
1. Click `Sidebar.module.css` → pencil icon
2. Select all → delete → paste new contents
3. Commit changes

### Step 5 — Update App.module.css
1. Go back to `frontend/src/`
2. Click `App.module.css` → pencil icon
3. Scroll to the very bottom and ADD these lines
   (do not delete existing content — just append):

.videoBadge {
  font-size: 11px;
  color: #0F6E56;
  background: #E1F5EE;
  border: 1px solid rgba(15,110,86,.25);
  border-radius: 20px;
  padding: 3px 10px;
}

4. Commit changes

### Step 6 — Add VideoEngine.jsx (NEW file)
1. Go to `frontend/src/pages/`
2. Click "Add file" → "Create new file"
3. Name it exactly: VideoEngine.jsx
4. Paste the VideoEngine.jsx contents from the zip
5. Commit changes

### Step 7 — Add VideoEngine.module.css (NEW file)
1. Stay in `frontend/src/pages/`
2. Click "Add file" → "Create new file"
3. Name it exactly: VideoEngine.module.css
4. Paste the VideoEngine.module.css contents from the zip
5. Commit changes

---

## Step 8 — Add Video Engine API to Netlify

1. Go to app.netlify.com
2. Click your project → "Project configuration"
3. Click "Environment variables"
4. Add new variable:
   Name:  VITE_VIDEO_API_URL
   Value: https://your-video-engine.up.railway.app
   (You get this URL after deploying the video-engine backend to Railway)
5. Save → Trigger deploy

---

## Step 9 — Deploy Video Engine backend to Railway

1. Go to railway.app
2. Click your project → "+ New Service"
3. Click "GitHub Repo" → select contentforge
4. Set Root Directory to: video-engine/backend
   (First upload the video-engine folder to your GitHub repo)
5. Add environment variables:
   ANTHROPIC_API_KEY = your existing key
   RUNWAY_API_KEY    = from runwayml.com
   ELEVENLABS_API_KEY = from elevenlabs.io
   PORT = 3002
6. Click "Generate Domain" → copy the URL
7. Use that URL as VITE_VIDEO_API_URL in Netlify (Step 8)

---

## How to upload the video-engine folder to GitHub

1. Go to your GitHub repo root
2. Click "Add file" → "Upload files"
3. Open the video-engine-phase1.zip on your computer
4. Extract it to your Desktop
5. Drag the entire video-engine folder into the GitHub upload area
6. Click "Commit changes"

---

## Minimum working setup (script-only, no video APIs yet)

You only need ANTHROPIC_API_KEY to start.
The Video Engine will generate scripts, VSL copy, and scene descriptions.
Add RUNWAY_API_KEY and ELEVENLABS_API_KEY later for actual video output.

---

## Testing after deploy

1. Go to contentstudiohub.com
2. You should see "AI Video Engine" in the left sidebar with a "New" badge
3. Click it
4. Type a topic and click "Generate Video"
5. The script tab should work immediately with just your Anthropic key
