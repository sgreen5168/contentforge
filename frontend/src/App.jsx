import React, { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import Composer from './pages/Composer.jsx';
import VideoEngine from './pages/VideoEngine.jsx';
import ContentCalendar from './pages/ContentCalendar.jsx';
import ScriptWriter from './pages/ScriptWriter.jsx';
import Scheduler from './pages/Scheduler.jsx';
import BulkGenerator from './pages/BulkGenerator.jsx';
import EmailSettings from './pages/EmailSettings.jsx';
import Analytics from './pages/Analytics.jsx';
import { Brand, Compliance } from './pages/OtherPages.jsx';
import LandingPageBuilder from './pages/LandingPageBuilder.jsx';
import ImageGenerator from './pages/ImageGenerator.jsx';
import MediaLibrary from './pages/MediaLibrary.jsx';
import PostSubmitter from './pages/PostSubmitter.jsx';
import styles from './App.module.css';

// ── Inline Tutorial — no separate file needed ─────────────────────────────────
const TUTORIAL_DATA = [
  { id:'start', icon:'🚀', label:'Getting started', topics:[
    { title:'Logging in', desc:'ContentForge is password protected.',
      steps:['Go to contentstudiohub.com','Type: ContentForge2026','Press Enter or tap Sign in','You stay logged in until you sign out'],
      tip:'On mobile tap ☰ top-left to open the navigation menu.' },
    { title:'Navigation', desc:'9 sections in the sidebar. On mobile it slides in.',
      steps:['Desktop: sidebar always visible on the left','Mobile: tap ☰ to open','Tap any section to navigate','Tap outside to close the menu'],
      tip:'Add to home screen: Share → Add to Home Screen on iPhone.' },
  ]},
  { id:'composer', icon:'✦', label:'AI Composer', topics:[
    { title:'Writing social posts', desc:'Claude writes a unique post for each platform.',
      steps:['Click AI Composer','Type your topic','Select platforms','Choose tone','Click Generate Posts ⚡','Click Copy to use the post'],
      tip:'Instagram gets hashtags. Reddit gets conversational tone. Facebook gets longer format.' },
  ]},
  { id:'video', icon:'▶', label:'AI Video Engine', topics:[
    { title:'3 input modes', desc:'Topic, URL, or affiliate link.',
      steps:['TOPIC — type any subject: "morning productivity"','URL — paste a product page, Claude reads it','AFFILIATE — paste tracking link, Claude adds it to CTA'],
      tip:'Affiliate mode auto-adds your link to every call-to-action.' },
    { title:'Smart Mode', desc:'Claude picks the best format automatically.',
      steps:['Smart Mode ON (default) — Claude picks the format','Smart Mode OFF — choose from 7 types manually','Toggle at the top of the left panel'],
      tip:'Keep Smart Mode ON when starting out.' },
    { title:'7 video types', desc:'Each has a different script structure.',
      steps:['UGC Persona — authentic first-person review','AI VSL — Hook → Problem → Solution → CTA','Hybrid VSL — avatar + B-roll footage','Reel Ads — short punchy vertical ads','Product Ads — direct-response e-commerce','Commercial — cinematic brand story','Competitor Replicator — original content in competitor structure'],
      tip:'UGC Persona works best for affiliate. VSL works best for high-ticket products.' },
    { title:'Duration and cost', desc:'Drag slider to set length. Cost updates live.',
      steps:['Drag slider: 10 seconds to 10 minutes','Preset buttons: 15s, 30s, 45s, 60s','Dollar amount = your API cost to generate','Platform limits enforced automatically','Orange warning if duration exceeds a platform limit'],
      tip:'Start with 15s to test cheaply before longer videos.' },
    { title:'Generating results', desc:'Click Generate then watch the pipeline run.',
      steps:['Click Generate Video ⚡','Click the Result tab','Script in ~5 seconds','Voiceover in ~10 seconds','Video clips in 3–5 minutes','Download button when ready'],
      tip:'You always get a full script even without RunwayML connected.' },
  ]},
  { id:'vsl', icon:'💰', label:'VSL Builder', topics:[
    { title:'Building a VSL', desc:'High-converting Video Sales Letter scripts.',
      steps:['AI Video Engine → VSL Builder tab','Enter product name and price','Describe target audience specifically','Describe the pain point — be specific','Describe your solution','Paste affiliate link (optional)','Set duration 30–90s','Click Generate VSL Script ⚡'],
      tip:'Specificity converts — "struggling with dry skin despite $100 creams" beats "has dry skin".' },
  ]},
  { id:'bulk', icon:'⚡', label:'Bulk Generator', topics:[
    { title:'Auto-generate mode', desc:'One topic becomes up to 10 unique variations.',
      steps:['Click Bulk Generator','Select Auto-generate variations','Type a base topic','Choose count: 3, 5, 7, or 10','Click ✦ Generate','Review and edit topics','Set persona, duration, platforms, concurrency','Click Generate X Videos ⚡','Watch progress in the Progress tab'],
      tip:'Concurrency 2 halves total time without overloading APIs.' },
  ]},
  { id:'scheduler', icon:'📅', label:'Video Scheduler', topics:[
    { title:'Scheduling a post', desc:'Railway posts your video automatically at the exact time.',
      steps:['Click Video Scheduler','Select a completed video','Choose platforms','Click an optimal time slot','Pick the date','Click Schedule Post 📅','Fires automatically at scheduled time'],
      tip:'Railway stellar-achievement must be Online for auto-posting.' },
    { title:'Peak times', desc:'Best engagement windows per platform.',
      steps:['TikTok: 7pm — Tuesday 8pm is best','Instagram: 11am — Wednesday 11am','YouTube: 3pm — Saturday 11am','Facebook: 1pm — Wednesday 1pm','Reddit: 8am ET — Monday 8am ET'],
      tip:'Check your own analytics after a few weeks for your audience peak times.' },
  ]},
  { id:'analytics', icon:'◎', label:'Analytics', topics:[
    { title:'4 analytics tabs', desc:'Live data — every video appears here automatically.',
      steps:['Overview — daily chart, status donut, breakdowns','Videos — full list with hook previews and downloads','Platforms — usage charts and timing reference','Costs — API spend and monthly projections','Click Refresh ↻ to pull latest data'],
      tip:'Data persists in Supabase even if Railway restarts.' },
  ]},
  { id:'email', icon:'📧', label:'Email Notifications', topics:[
    { title:'Setting up alerts', desc:'Emails when videos finish, batches complete, posts publish.',
      steps:['Sign up free at resend.com','Create API Key → copy the re_ key','Railway → stellar-achievement → Variables → add RESEND_API_KEY and NOTIFY_EMAIL','Email Notifications → Send test email'],
      tip:'3 types: video complete, bulk done, scheduled post published.' },
  ]},
  { id:'mobile', icon:'📱', label:'Using on mobile', topics:[
    { title:'Mobile navigation', desc:'Fully optimised for phones.',
      steps:['Open contentstudiohub.com','Log in','Tap ☰ to open menu','Tap section — menu closes automatically','All buttons sized for finger taps'],
      tip:'Add to home screen for app-like access.' },
    { title:'Generating on mobile', desc:'Full pipeline works on mobile.',
      steps:['Tap AI Video Engine','Type topic','Set duration and platforms','Tap Generate Video ⚡','Watch Result tab — 3–5 minutes','Check Job History for completed videos'],
      tip:'Keep screen on — some browsers pause when locked.' },
  ]},
  { id:'overview', icon:'🗺', label:'Platform overview', topics:[
    { title:'How ContentForge connects everything',
      desc:'ContentForge is a complete content pipeline — each tool connects to the next in a logical workflow.',
      steps:[
        'STEP 1 — Create: AI Composer writes platform-specific posts · AI Video Engine generates scripts and videos · VSL Builder creates sales scripts',
        'STEP 2 — Enhance: Media Library adds images and videos · Landing Page Builder creates hosted mini-pages · AI Image Generator creates SEO-optimized visuals',
        'STEP 3 — Check: Compliance Checker scans every post for policy violations before publishing',
        'STEP 4 — Publish: Post Submitter sends directly to Facebook and Instagram · Video Scheduler auto-posts at peak times · Bulk Generator creates 10 videos at once',
        'STEP 5 — Track: Analytics dashboard shows performance · Email Notifications alert you when content publishes',
      ],
      tip:'The most powerful workflow: AI Composer → Landing Page Builder → Post Submitter. Your post links to your landing page which links to your affiliate offer.' },
    { title:'The affiliate funnel workflow',
      desc:'The recommended 4-step funnel for affiliate marketing with ContentForge.',
      steps:[
        'STEP 1 — Go to Landing Page Builder → enter your product and affiliate URL → click Generate → click Publish → copy your landing page URL',
        'STEP 2 — Go to AI Composer → paste your landing page URL as the affiliate link → enable Embed affiliate link → choose Keyword mode → type your anchor text → click Generate Posts',
        'STEP 3 — Posts now link to your landing page instead of directly to the affiliate link — this avoids platform penalties for direct affiliate links',
        'STEP 4 — Visitor clicks post → lands on your branded page → reads benefits → clicks CTA → goes to affiliate offer → you earn commission',
      ],
      tip:'Direct affiliate links get flagged by Facebook and Instagram. A landing page in the middle improves trust, increases conversions, and avoids platform restrictions.' },
    { title:'Platform connection status',
      desc:'Which platforms are connected and what each one can do in ContentForge.',
      steps:[
        'FACEBOOK ✅ Connected — Post Submitter can publish text posts and videos directly to Make Money from Home page',
        'INSTAGRAM ✅ Connected — Post Submitter can publish Reels and images to @sgreen5168',
        'YOUTUBE ⏳ Pending — add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN to Railway',
        'PINTEREST ⏳ Pending — add PINTEREST_ACCESS_TOKEN to Railway after app approval',
        'TIKTOK ⏳ Pending — add TIKTOK_ACCESS_TOKEN after developer app review',
        'REDDIT ❌ Removed — account was blocked, not currently connected',
      ],
      tip:'You only need Facebook and Instagram connected to start publishing. Add YouTube and Pinterest when you are ready to expand your reach.' },
    { title:'Image workflow — manual vs automatic',
      desc:'ContentForge offers two ways to add images to your content.',
      steps:[
        'AUTOMATIC: In AI Composer toggle on Auto-generate image — Claude generates a relevant image from your post keywords automatically when you click Generate',
        'MANUAL: In Media Library generate multiple AI images and pick the best one, upload your own product photos, or add a video from your PC',
        'EDIT: In Media Library click Edit prompt to describe a change — generates a variation of the selected image',
        'SEO: All images get descriptive alt text and keyword-rich file names automatically — important for Pinterest and Google image search',
        'SIZES: AI Image Generator has platform-specific sizes — select Facebook, Instagram, Pinterest, YouTube or TikTok to get the exact right dimensions',
      ],
      tip:'For affiliate marketing your own product photos outperform AI images. Use Media Library to upload the product image and place it on your landing page for the highest conversion rate.' },
  ]},
  { id:'heygen', icon:'🎭', label:'HeyGen Avatar Video', topics:[
    { title:'What is HeyGen Avatar IV',
      desc:'HeyGen generates a photorealistic AI avatar that reads your script aloud with natural lip-sync, eye movement, and facial expressions. Avatar IV is their most advanced model — skin texture, micro-expressions, and lip-sync are nearly indistinguishable from real video at normal playback speed.',
      steps:[
        'HeyGen is an optional add-on to ContentForge — your Pexels scene clips work without it',
        'Avatar IV videos cost $0.50–$2 per video from your HeyGen API balance',
        'Generation takes 10–30 minutes — HeyGen queues jobs on their servers',
        'The avatar reads your ContentForge-generated script word for word',
        'The finished avatar video can be downloaded standalone OR combined with your scene clips as a picture-in-picture overlay',
        'ContentForge uses your HeyGen API key (stored in Railway) — no HeyGen dashboard needed',
      ],
      tip:'HeyGen API key lives in Railway as HEYGEN_API_KEY. Your $15 API balance pays per video. The free plan watermark does not appear on API-generated videos.' },
    { title:'Step 1 — Generate your script first',
      desc:'The HeyGen Avatar Video panel needs a script before it can do anything. Always generate your script first.',
      steps:[
        'Go to AI Video Engine → Generate tab',
        'Optional: select a content niche (🏠 Make Money from Home, 🥗 Healthy Eating, 💪 Fitness, 👨‍🍳 Cooking)',
        'Click a starter hook to auto-fill your topic — these are pre-written compliant openers for each niche',
        'Set Video type, Persona, Duration, Platform',
        'Click Generate Video ⚡',
        'Wait for script to appear — usually 5–10 seconds',
        'Click the Result tab — the HeyGen Avatar Video panel is at the bottom',
      ],
      tip:'The niche selector shapes your script tone and compliance. "Make Money from Home" scripts avoid income claims and use educational framing automatically.' },
    { title:'Step 2 — Load and choose an avatar',
      desc:'Browse HeyGen's full avatar library filtered by niche, gender, and keyword.',
      steps:[
        'In the Result tab scroll down to 🎭 HeyGen Avatar Video',
        'Click Load Avatar Options — fetches all avatars from your HeyGen account',
        'Use the niche tabs: 👥 All · 🏠 Home Biz · 💪 Fitness · 🥗 Healthy · 👨‍🍳 Cooking · ✨ Lifestyle',
        'Use the search bar — search by keyword: "office", "casual", "chef", "blazer", "t-shirt"',
        'Use ♂ Male / ♀ Female gender filters',
        'Scroll through pages with Prev / Next pagination',
        'Click any avatar card to select it — a green ✓ appears',
        'A preview panel shows the selected avatar photo + your script — review before generating',
        'Click ✕ Change avatar to deselect and choose a different one',
      ],
      tip:'No avatar is pre-selected — you must manually click a card. This prevents the wrong avatar appearing in your video accidentally.' },
    { title:'Step 3 — Create a custom niche avatar',
      desc:'If no existing avatar fits your content, describe exactly what you want and HeyGen generates a new one.',
      steps:[
        'Click a niche tab — a green suggestions panel appears with 4–6 pre-written avatar descriptions',
        'Each suggestion shows: ethnicity · age · setting — e.g. "Black woman — casual home office"',
        'Click any suggestion — the creator panel opens automatically with all fields pre-filled',
        'Review the appearance description — edit it if needed to be more specific',
        'Adjust Gender (Woman / Man / Non-binary)',
        'Adjust Age: Young Adult · Early Middle Age · Late Middle Age · Senior · Unspecified',
        'Adjust Ethnicity: White · Black · Asian American · East Asian · South East Asian · South Asian · Middle Eastern · Pacific · Hispanic · Unspecified',
        'Adjust Style: Realistic (recommended) · Cinematic · Natural',
        'Click ✨ Generate custom avatar — takes 1–3 minutes',
        'When done click ↻ Refresh Avatars — your new avatar appears in the grid',
        'Click it to select it',
      ],
      tip:'The appearance description is the most important field. Be specific: "Hispanic woman in light casual t-shirt, bright kitchen with colorful ingredients, warm smile, natural window light" produces much better results than "woman in kitchen".' },
    { title:'Step 4 — Choose a voice',
      desc:'Pick the HeyGen AI voice that will read your script. The avatar lip-syncs to this voice.',
      steps:[
        'Under the avatar grid find the Choose voice dropdown',
        'Scroll through the list — it shows all English voices from your HeyGen account',
        'Voice names include gender in brackets — (male) or (female)',
        'Some voices have style descriptors: "Broadcaster", "Lifelike", "Excited"',
        'Select a voice that matches your avatar's look and your content tone',
        'Casual lifestyle content: pick a warm conversational voice',
        'Professional business content: pick a clear confident voice',
        'Your selection is confirmed in the dropdown automatically',
      ],
      tip:'Match voice gender to avatar gender for the most natural result. A deep male voice on a female avatar creates an uncanny mismatch that viewers notice.' },
    { title:'Step 5 — Background removal (green screen)',
      desc:'Remove the avatar's background so they float transparently over your scene clips.',
      steps:[
        'Find the Transparent background (green screen) toggle below the voice dropdown',
        'Click to enable — a green checkmark appears',
        'When enabled: HeyGen generates the avatar with a bright green (#00b140) background',
        'When you click Combine — FFmpeg automatically removes the green and composites the avatar transparently over your Pexels scene video',
        'The avatar appears as a floating presence in the bottom-right corner with no box around them',
        'Leave disabled if you want a solid dark background box behind the avatar in the corner',
      ],
      tip:'Green screen mode works best with avatars that have clear edges. Avatars with loose hair or complex backgrounds may show slight edge artifacts — try a different avatar if this happens.' },
    { title:'Step 6 — Generate the avatar video',
      desc:'Submit your script to HeyGen for Avatar IV generation.',
      steps:[
        'Confirm the preview panel shows your chosen avatar and script',
        'Click 🎭 Generate Avatar IV Video',
        'The button shows: "Sending to HeyGen… checking for 2.5 min then showing dashboard link"',
        'ContentForge polls HeyGen every 30 seconds for 2.5 minutes',
        'If the video finishes within 2.5 min — it appears automatically with a preview player and download button',
        'If not finished — a yellow panel appears: ⏳ Video is generating on HeyGen's servers',
        'Click Open HeyGen Projects → to go directly to app.heygen.com/projects',
        'Your video will be there when HeyGen finishes (10–30 minutes)',
        'Come back to ContentForge — the video URL is not needed for combining (see Step 7)',
      ],
      tip:'HeyGen generation time depends on their server queue. Weekday peak hours (9am–5pm EST) are slowest. Weekend and late night generation is typically faster.' },
    { title:'Step 7 — Combine avatar with scene clips (Option B)',
      desc:'Merge your HeyGen avatar video with your Pexels scene clips into one final MP4.',
      steps:[
        'First: select phrases from your script in the Pick scenes panel and match Pexels clips',
        'The Combine section shows a green banner: 🎭 HeyGen avatar ready — will appear as PIP overlay',
        'If no banner appears: paste the HeyGen video URL into the heygenVideoUrl field manually',
        'Set your aspect ratio (9:16 for Facebook/TikTok/Instagram, 16:9 for YouTube)',
        'Optionally add a CTA URL — it burns into the last 5 seconds of the video as visible text',
        'Click ⬇ Combine & Download Final Video',
        'Railway downloads your HeyGen video, assembles your Pexels clips, composites the PIP overlay, and streams back the final MP4',
        'The download starts automatically — save it to your device',
        'Post it to Facebook, TikTok, Instagram, or YouTube manually',
      ],
      tip:'The combined video has: Pexels scenes filling the full frame + HeyGen avatar in the bottom-right corner (28% of frame width) + your voiceover audio + optional CTA text overlay. It is one complete self-contained MP4.' },
    { title:'Step 8 — Publish avatar video to YouTube (Option C)',
      desc:'Skip downloading — push the combined video directly to your YouTube channel.',
      steps:[
        'Complete all steps above through Step 6 (avatar generated)',
        'In the Result tab scroll up to the Combine & Publish section',
        'Fill in YouTube Title (required)',
        'Fill in YouTube Description (optional but recommended for SEO)',
        'Set Privacy: Public · Unlisted · Private',
        'Click ▶ Publish to YouTube',
        'Railway assembles the combined video (scenes + avatar PIP overlay) and uploads directly to your YouTube channel',
        'You receive a confirmation with the YouTube video ID when complete',
        'The video appears in your YouTube Studio dashboard',
      ],
      tip:'YouTube publishing requires YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN in Railway Variables. If these are not set the publish button shows an error — use Option B (download) instead.' },
    { title:'Compliance rules for avatar content',
      desc:'ContentForge enforces specific compliance rules in all scripts — especially for the Make Money from Home niche.',
      steps:[
        'NEVER claim personal income — "I made $300" or "I earned $X" are prohibited in all scripts',
        'NEVER make guaranteed result claims — "you will definitely earn" or "proven to make money"',
        'USE educational framing — "here is what people are doing" not "here is what I did"',
        'HOOKS rotate between 6 styles — question, statement, number, contrast, empathy, scene — never default "Okay so..."',
        'FACEBOOK POLICY: no income claims, no before/after comparisons, no urgency manipulation',
        'FTC RULES: affiliate content must be disclosed — add "this video contains affiliate links" to descriptions',
        'If Claude generates a non-compliant script — edit it directly in the script panel before approving',
      ],
      tip:'The compliance rules are built into Claude's system prompt as absolute constraints. If a generated script still contains an income claim, regenerate — do not post it as-is.' },
  ]},
  { id:'scenepicker', icon:'🎬', label:'Scene Picker & Clips', topics:[
    { title:'How the phrase picker works',
      desc:'The phrase picker lets you select exactly which sentences from your script become video scenes, then matches each one to a Pexels stock clip.',
      steps:[
        'After generating a script go to Result tab → Pick scenes from your script',
        'Your script appears as individual sentences — click any sentence to select it',
        'A green highlight appears and a keyword is auto-suggested for that scene',
        'Edit the keyword to be more specific — e.g. change "home" to "woman baking kitchen"',
        'Click Re-match to find a new Pexels clip using your edited keyword',
        'Situation chips appear below the keyword — click any chip to append it to the search',
        'Niche-relevant chips are highlighted in green and appear first',
        'Select 4–8 phrases for a 30-second video, 8–12 for a 60-second video',
        'Each selected phrase becomes one scene clip in the final video',
      ],
      tip:'Be specific with keywords. "Woman baking bread kitchen" finds better clips than "home". "Person laptop outdoor park" is more specific than "working".' },
    { title:'Scene sync — how clips stay in time with voiceover',
      desc:'ContentForge automatically times each clip to match the voiceover duration.',
      steps:[
        'The voiceover duration is calculated from your script length',
        'That total duration is divided equally across all selected phrases',
        'Example: 36-second voiceover with 6 selected phrases = 6 seconds per scene',
        'Each clip is trimmed to exactly its allocated time, then re-concatenated',
        'This keeps each scene in sync with the words being spoken at that moment',
        'If a clip is shorter than its allocated time it repeats to fill the gap',
        'A fallback loop covers the full video if individual trimming fails',
      ],
      tip:'For best sync: select the same number of phrases as natural script pauses. A 6-sentence script works perfectly with 6 selected phrases — one clip per sentence.' },
    { title:'Scene variety — how to break out of generic clips',
      desc:'ContentForge has a substitution system that replaces generic WFH queries with diverse visual searches.',
      steps:[
        'Generic phrases like "make money from home" would normally return laptop/desk clips every time',
        'The scene substitution map detects these phrases and replaces them with more visual alternatives',
        'Examples: "side hustle" → "person baking goods" or "lawn care tools" or "craftsperson jewelry"',
        '"baking home" → "homemade cookies tray" or "baker kneading dough"',
        '"lawn care" → "person mowing lawn" or "garden tools yard"',
        'The substitution rotates alternatives based on phrase length — same phrase always gets same clip style',
        'You can always override by editing the keyword manually and clicking Re-match',
      ],
      tip:'If you keep getting the same clip style, manually edit the scene keyword to something more specific and visual. "Woman celebrating success home office" gives very different results than "home office".' },
    { title:'Photo to video clip converter',
      desc:'Convert any image URL into a video clip with a Ken Burns pan/zoom effect, sized to your aspect ratio.',
      steps:[
        'In the Result tab find the Photo → video clip card above the phrase picker',
        'Paste any public image URL — must be a direct image link ending in .jpg, .png, .webp etc.',
        'The selected aspect ratio (9:16, 16:9, 1:1 etc.) is shown automatically',
        'Click ⬇ Convert to [ratio] video clip',
        'FFmpeg downloads the image and applies a slow zoom — the image gradually enlarges over 6 seconds',
        'The clip downloads as an MP4 sized exactly to your chosen ratio',
        'Use it in your editing app alongside ContentForge clips',
      ],
      tip:'Use this for product photos, infographics, or personal photos that you want to include as a video scene. Any image becomes a professional-looking animated clip.' },
  ]},
  { id:'nichesystem', icon:'🏠', label:'Content Niche System', topics:[
    { title:'What the niche system does',
      desc:'Selecting a content niche before generating a script changes three things: the compliance rules Claude follows, the hook styles it uses, and the scene situation chips shown in the phrase picker.',
      steps:[
        'The niche selector appears at the top of the Generate tab as a 4-button grid',
        '🏠 Make Money from Home — side hustles, home income, entrepreneurship',
        '🥗 Healthy Eating — nutrition, wellness, clean eating',
        '💪 Fitness & Wellness — exercise, mindset, healthy living',
        '👨‍🍳 Cooking — recipes, techniques, food content',
        'Click any niche to activate it — sub-categories appear below',
        'Click a sub-category to focus further: e.g. "Baking from Home" within the home income niche',
        'Starter hooks appear — click any hook to auto-fill your topic field',
        'A compliance note shows what rules apply to that niche',
      ],
      tip:'The niche system is optional but strongly recommended. Scripts generated with a niche selected are more focused, more compliant, and require less editing before posting.' },
    { title:'Make Money from Home — compliance rules',
      desc:'This niche has the strictest compliance requirements due to Facebook and FTC advertising policies.',
      steps:[
        'PROHIBITED: "I made $X", "I earned $300", "I've made $300 so far" — any personal dollar amounts',
        'PROHIBITED: "guaranteed to earn", "proven income", "you will definitely make money"',
        'REQUIRED: educational third-person framing — "here are ways people earn from home"',
        'REQUIRED: honest, informational content — share what is possible, not personal claims',
        'ALLOWED: "people are earning from home doing this", "this side hustle is growing fast"',
        'ALLOWED: "here is what starting a home baking business actually looks like"',
        'FACEBOOK POLICY: content that implies guaranteed financial outcomes can cause page suspension',
        'FTC RULES: if you personally earn from promoting something it must be disclosed',
      ],
      tip:'The most effective approach: position yourself as someone sharing research and information, not personal results. "I've been looking into ways people earn from home and here's what I found" is compliant and authentic.' },
    { title:'Hook variety — 6 styles Claude uses',
      desc:'Scripts never start with "Okay" or "Okay so". Claude rotates through 6 different opening styles.',
      steps:[
        '1. QUESTION HOOK — "What if your kitchen could actually pay your rent?"',
        '2. STATEMENT HOOK — "Most people completely overlook this home income idea."',
        '3. NUMBER HOOK — "Three things people are doing from home right now that actually work."',
        '4. CONTRAST HOOK — "Everyone talks about working from home. Nobody explains how to actually start."',
        '5. EMPATHY HOOK — "If you've ever felt stuck in a job that doesn't fit your life, this is worth watching."',
        '6. SCENE HOOK — "Picture this — it's 9am, you're still in your kitchen, and you're already working on something you built yourself."',
        'Claude picks whichever style fits the topic and persona best',
        'Regenerating the same topic will often produce a different hook style',
      ],
      tip:'The number hook and contrast hook tend to perform best for the Make Money from Home niche because they create immediate curiosity without making any personal claims.' },
  ]},
  { id:'voicepreview', icon:'🎙', label:'Voice Selection & Preview', topics:[
    { title:'Previewing voices before generating',
      desc:'Hear exactly how each voice sounds before committing to it for your video.',
      steps:[
        'In the Generate tab scroll to the Voiceover section',
        'Voices are split into Female (Nova, Shimmer, Alloy) and Male (Onyx, Echo, Fable)',
        'Click any voice name to select it for your video',
        'Click the ▶ button on the right of any voice to hear a preview sample',
        'Each voice introduces itself with a sentence describing its style',
        'The button changes to ■ while playing — click ■ to stop early',
        'Try all 6 before deciding — the difference between voices is significant',
        'Your selected voice shows as ✓ Selected with a green border',
        'The voice you select is used for the OpenAI TTS-1 HD voiceover in your video',
      ],
      tip:'Nova and Shimmer are the most versatile for lifestyle content. Onyx works best for authoritative product demos. Fable is the most expressive for storytelling content.' },
    { title:'Matching voice to content type',
      desc:'Different voices suit different content styles and audiences.',
      steps:[
        'NOVA (Female, Warm & friendly) — UGC lifestyle, home income, casual tutorials',
        'SHIMMER (Female, Professional) — educational content, health and wellness, clean eating',
        'ALLOY (Female, Versatile) — any content type, neutral and adaptable',
        'ONYX (Male, Deep & authoritative) — product demos, business content, serious topics',
        'ECHO (Male, Confident & clear) — tutorials, reviews, direct-response content',
        'FABLE (Male, Expressive & warm) — storytelling, motivational content, fitness',
        'For Make Money from Home: Nova or Echo — warm and relatable without sounding salesy',
        'For Cooking: Nova or Fable — expressive and enthusiastic',
        'For Fitness: Echo or Fable — energetic and motivating',
      ],
      tip:'Your voice choice directly affects how viewers perceive your content. A warm voice on educational content builds trust. A confident voice on product content increases conversions.' },
  ]},
  { id:'brandvoice', icon:'◈', label:'Brand Voice Memory', topics:[
    { title:'What is Brand Voice Memory', desc:'Brand Voice Memory teaches Claude your unique writing style so every post and script sounds like you — not like a generic AI.',
      steps:[
        'Without Brand Voice: Claude writes in its default style — clear and professional but generic',
        'With Brand Voice: Claude learns your tone, vocabulary, sentence length, personality, and content style',
        'The more examples you give it the more accurately it replicates your voice',
        'Brand Voice applies automatically to every post generated in the AI Composer',
        'It also influences script writing in the Video Engine when persona matches your style',
      ],
      tip:'Think of Brand Voice Memory as training Claude to be your personal ghostwriter who understands exactly how you communicate.' },
    { title:'Setting up your Brand Voice', desc:'Train Claude on your style by providing examples of your best-performing content.',
      steps:[
        'Click Brand Voice in the sidebar',
        'Paste 3 to 5 examples of your own posts or captions in the input field — these are your style samples',
        'Include a mix: a story post, a tips post, a promotional post, and a casual update',
        'Write a short description of your tone — e.g. "casual and direct, uses short sentences, occasionally funny, never corporate"',
        'Describe your audience — e.g. "entrepreneurs aged 25-40 interested in passive income"',
        'Click Save Brand Voice — Claude now uses these samples as reference for every generation',
      ],
      tip:'Use your top-performing posts as examples — if they resonated with your audience they represent your best voice.' },
    { title:'What Brand Voice controls', desc:'Brand Voice Memory influences multiple aspects of how Claude writes for you.',
      steps:[
        'TONE: formal vs casual, serious vs playful, authoritative vs conversational',
        'VOCABULARY: the specific words and phrases you naturally use vs avoid',
        'SENTENCE LENGTH: short punchy sentences vs longer detailed explanations',
        'CONTENT STRUCTURE: whether you lead with questions, stories, stats, or statements',
        'EMOJI USAGE: whether you use them, how many, and which ones fit your brand',
        'HASHTAG STYLE: broad popular tags vs niche specific tags vs no hashtags at all',
        'CALL TO ACTION: your specific CTA phrasing vs generic "click the link" language',
      ],
      tip:'Even small details matter. If you never use exclamation marks tell Claude that. If you always start posts with a question include examples that show this pattern.' },
    { title:'Brand Voice for video scripts', desc:'Your brand voice also shapes the scripts Claude writes for your videos.',
      steps:[
        'In the AI Video Engine your Brand Voice influences the hook style and opening line',
        'The persona you select (UGC, Educator, Influencer etc.) blends with your brand voice',
        'A UGC persona with a casual brand voice produces authentic-feeling ad scripts',
        'An Educator persona with an authoritative brand voice produces expert tip videos',
        'You can override brand voice for any individual video using the script editor before approving',
        'After generating — edit the script directly in the Review & Edit panel before clicking Approve',
      ],
      tip:'The script review step lets you apply your brand voice manually if the AI version is not quite right. Edit any line before approving and sending to video generation.' },
    { title:'Improving your Brand Voice over time', desc:'Brand Voice Memory gets better as you refine it with more examples and feedback.',
      steps:[
        'After generating posts — note which ones sound most like you and which do not',
        'Go back to Brand Voice and add examples of the posts that sounded best',
        'Remove examples that led to off-brand results',
        'Update your tone description to be more specific over time',
        'Add examples of content you would NEVER post to teach Claude what to avoid',
        'Re-generate the same topic after updating Brand Voice and compare the two versions',
      ],
      tip:'Brand Voice is not set-and-forget. Update it monthly with your newest best-performing content to keep it current with how your style evolves.' },
  ]},
  { id:'publishing', icon:'📤', label:'Publishing workflow', topics:[
    { title:'How content gets posted', desc:'ContentForge uses a 5-stage workflow to take your content from idea to published post on every platform.',
      steps:[
        'STAGE 1 — Input: you provide a topic, URL, or affiliate link in the AI Composer or Video Engine',
        'STAGE 2 — Generation: Claude AI writes the script or post, ElevenLabs records the voiceover, fal.ai generates the video clips',
        'STAGE 3 — Assembly: the backend stitches audio and video together and uploads the finished file to Cloudflare R2 for permanent storage',
        'STAGE 4 — Scheduling: you choose to post immediately or schedule for a peak engagement time using the Video Scheduler',
        'STAGE 5 — Publishing: Railway automatically calls each platform API at the scheduled time and posts your content',
      ],
      tip:'Every completed video gets a permanent Cloudflare R2 URL. Even if Railway restarts your videos are never lost.' },
    { title:'Posting social media text posts', desc:'The AI Composer sends finished posts directly to your connected social accounts.',
      steps:[
        'Click AI Composer in the sidebar',
        'Type your topic and select your platforms — Facebook, Instagram, Reddit',
        'Click Generate Posts ⚡ — Claude writes a unique version for each platform',
        'Review the posts — each shows character count and compliance status',
        'Click Copy under any post to copy it to your clipboard',
        'Open the platform app on your phone and paste — or use Auto-upload if credentials are connected',
        'For scheduled posting: go to Video Scheduler, select the post, pick a time, click Schedule Post',
      ],
      tip:'Instagram posts include hashtags automatically. Reddit posts are written in a community-authentic tone. Facebook posts are longer and more conversational.' },
    { title:'Posting videos to social media', desc:'The Video Engine generates and publishes videos through a fully automated pipeline.',
      steps:[
        'STEP 1 — Generate: AI Video Engine creates script, voiceover, and video clips (3–5 minutes total)',
        'STEP 2 — Storage: finished video uploads automatically to Cloudflare R2 and you get a permanent download URL',
        'STEP 3 — Manual post: click Download Video and upload directly to TikTok, Instagram, YouTube, Facebook, or Reddit',
        'STEP 4 — Auto-post: toggle Auto-upload ON before generating — Railway posts directly to connected platforms using their APIs',
        'STEP 5 — Scheduled post: go to Video Scheduler, select the completed video, choose platforms, pick an optimal time, click Schedule Post 📅',
      ],
      tip:'Auto-upload requires platform API tokens added to Railway Variables. Without them you get the video file to post manually — which works perfectly.' },
    { title:'Scheduling for peak times', desc:'The Video Scheduler posts your content automatically at the exact time you choose.',
      steps:[
        'Go to Video Scheduler in the sidebar',
        'Select a completed video from the dropdown — only completed jobs appear here',
        'Choose which platforms to post to — you can select multiple',
        'Click any Optimal time suggestion to auto-fill the best posting time for that platform',
        'Or set a custom date and time using the date and time pickers',
        'Review the preview showing exactly when and where it will post',
        'Click Schedule Post 📅 — the post appears in the Upcoming tab',
        'At the exact scheduled time Railway fires the API call and publishes automatically',
        'You receive an email confirmation when the post goes live (if email notifications are set up)',
      ],
      tip:'Railway stellar-achievement must stay Online for scheduled posts to fire. If it restarts it picks up pending schedules automatically within 1 minute.' },
    { title:'Platform-by-platform publishing guide', desc:'Each platform has different requirements and optimal strategies.',
      steps:[
        'TIKTOK: max 10 minutes, 9:16 vertical format, post at 7pm for best reach — add TIKTOK_ACCESS_TOKEN to Railway for auto-posting',
        'INSTAGRAM REELS: max 90 seconds, 9:16 vertical, post at 11am Wednesday for highest reach — add INSTAGRAM_ACCESS_TOKEN to Railway',
        'YOUTUBE SHORTS: max 60 seconds, 9:16 vertical, post at 3pm Saturday — add YOUTUBE_ACCESS_TOKEN to Railway',
        'FACEBOOK REELS: max 90 seconds, 9:16 vertical, post at 1pm Wednesday — add FACEBOOK_ACCESS_TOKEN to Railway',
        'FACEBOOK FEED: max 4 hours, any ratio, post at 9am Thursday — uses same FACEBOOK_ACCESS_TOKEN',
        'REDDIT: max 15 minutes, any ratio, post at 8am ET Monday — add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to Railway',
      ],
      tip:'You do not need all platform tokens to use ContentForge. Without a token the system generates the video and you post it manually. Add tokens one platform at a time.' },
    { title:'Connecting platform accounts', desc:'Add API tokens to Railway to enable automatic posting to each platform.',
      steps:[
        'Go to railway.app → stellar-achievement → Variables → Raw Editor',
        'Add your platform tokens one per line in the format: VARIABLE_NAME=your_token_value',
        'TIKTOK_ACCESS_TOKEN — get from developers.tiktok.com → your app → Access Token',
        'INSTAGRAM_ACCESS_TOKEN — get from developers.facebook.com → your Instagram Basic Display app',
        'FACEBOOK_ACCESS_TOKEN — get from developers.facebook.com → your app → User Access Token',
        'YOUTUBE_ACCESS_TOKEN — get from console.cloud.google.com → OAuth 2.0 credentials',
        'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET — get from reddit.com/prefs/apps → create script app',
        'Click Save — Railway restarts and the new tokens are live within 30 seconds',
      ],
      tip:'Facebook and Instagram use the same developer app. Create one app at developers.facebook.com and you get tokens for both platforms at once.' },
  ]},
];

const QUICK_REF = {
  '🎭 HeyGen Avatar IV': [
    ['Generate avatar video','Result tab → Load Avatars → pick avatar → pick voice → Generate Avatar IV Video'],
    ['Create custom avatar','Niche tab → click suggestion → edit description → Generate custom avatar'],
    ['Combine with scenes','Select phrases → match clips → Combine & Download (green banner = avatar ready)'],
    ['Publish to YouTube','Fill YouTube title → Publish to YouTube (requires YouTube tokens in Railway)'],
    ['Avatar timed out','Check app.heygen.com/projects — video will be there when HeyGen finishes'],
    ['Green screen mode','Enable Transparent background toggle before generating — avatar floats over scenes'],
    ['Avatar not selectable','Click a card manually — no auto-selection, you must click to choose'],
    ['Filter avatars by niche','Load Avatars → click 🏠 Home Biz / 💪 Fitness / 🥗 Healthy / 👨‍🍳 Cooking tabs'],
    ['Search avatars','Type in search bar: "office", "casual", "chef", "blazer", "t-shirt"'],
    ['Change avatar','Click ✕ Change avatar in the preview panel to deselect and choose again'],
  ],
  '⚡ Quick actions': [
    ['Generate a video','AI Video Engine → topic → Generate ⚡'],
    ['Generate 10 videos','Bulk Generator → base topic → Generate X Videos'],
    ['Schedule a post','Video Scheduler → video → time → Schedule Post 📅'],
    ['Write social posts','AI Composer → topic → platforms → Generate Posts ⚡'],
    ['Build a VSL','AI Video Engine → VSL Builder → Generate VSL ⚡'],
    ['Post immediately','Generate → Download → upload to platform app manually'],
    ['Auto-post video','Enable Auto-upload toggle → Generate → Railway posts automatically'],
    ['Check analytics','Analytics → Overview / Videos / Platforms / Costs'],
    ['Set up emails','Email Notifications → Resend key → test'],
    ['Connect a platform','Railway → stellar-achievement → Variables → add platform token'],
    ['Sign out','Sidebar bottom → Sign out'],
  ],
  '📤 Publishing tokens': [
    ['TikTok','TIKTOK_ACCESS_TOKEN — developers.tiktok.com'],
    ['Instagram','INSTAGRAM_ACCESS_TOKEN — developers.facebook.com'],
    ['Facebook','FACEBOOK_ACCESS_TOKEN — developers.facebook.com'],
    ['YouTube','YOUTUBE_ACCESS_TOKEN — console.cloud.google.com'],
  ],
  '📱 Platform limits': [
    ['TikTok','10 min · 4GB · 9:16'],
    ['Instagram Reels','90 sec · 1GB · 9:16'],
    ['YouTube Shorts','60 sec · 256GB · 9:16'],
    ['Facebook Reels','90 sec · 4GB · 9:16'],
    ['Facebook Feed','4 hours · 10GB · any'],
    ['Reddit','15 min · 1GB · any'],
  ],
  '💵 API costs': [
    ['Claude script','$0.01/video'],
    ['ElevenLabs voice','$0.05/30sec'],
    ['RunwayML clips','$0.05/second'],
    ['30-sec video','~$1.56 total'],
    ['10-video bulk','~$3.10 total'],
  ],
  '🔧 Troubleshooting': [
    ['"Failed to fetch"','Check stellar-achievement is Online at railway.app'],
    ['"Connection error"','ANTHROPIC_API_KEY missing in Railway Variables'],
    ['"ElevenLabs 401"','Remove prefix text from ElevenLabs key in Railway'],
    ['No video clips','RUNWAY_API_KEY missing or credits empty'],
    ['Password not working','F12 → Application → Local Storage → delete cf_auth_v2'],
    ['Netlify not updating','Deploys → Clear cache and deploy site'],
  ],
};

function TutorialPage() {
  const [sec, setSec] = useState(0);
  const [top, setTop] = useState(0);
  const [done, setDone] = useState(new Set());
  const [view, setView] = useState('guide');
  const [q, setQ] = useState('');

  const S = TUTORIAL_DATA[sec];
  const T = S.topics[top];
  const pct = Math.round(done.size / TUTORIAL_DATA.length * 100);
  const isFirst = sec === 0 && top === 0;
  const isLast = sec === TUTORIAL_DATA.length - 1 && top === S.topics.length - 1;

  function goNext() { if (top < S.topics.length-1) setTop(top+1); else if (sec < TUTORIAL_DATA.length-1) { setSec(sec+1); setTop(0); } }
  function goPrev() { if (top > 0) setTop(top-1); else if (sec > 0) { setSec(sec-1); setTop(TUTORIAL_DATA[sec-1].topics.length-1); } }
  function mark() { const n = new Set(done); n.has(sec) ? n.delete(sec) : n.add(sec); setDone(n); }

  const hits = q.trim() ? TUTORIAL_DATA.flatMap((s,si) => s.topics.flatMap((t,ti) =>
    [t.title,t.desc,...t.steps,t.tip].join(' ').toLowerCase().includes(q.toLowerCase())
      ? [{si,ti,icon:s.icon,sec:s.label,top:t.title}] : [])) : [];

  return (
    <div style={{ padding:24, maxWidth:1100, fontFamily:'inherit' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:500, color:'#E8F4F0', display:'flex', alignItems:'center', gap:8 }}>
            📖 Tutorial
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(29,158,117,.2)', color:'#5DCAA5' }}>Interactive</span>
          </div>
          <div style={{ fontSize:13, color:'#7BAAA0', marginTop:4 }}>Complete guide to every ContentForge feature</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
            style={{ padding:'7px 11px', border:'1px solid rgba(29,158,117,.25)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'rgba(255,255,255,.05)', color:'#E8F4F0', outline:'none', width:150 }} />
          {['guide','ref'].map(v => (
            <button key={v} onClick={() => { setView(v); setQ(''); }}
              style={{ padding:'6px 12px', border:'1px solid rgba(29,158,117,.25)', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                background: view===v&&!q ? 'rgba(29,158,117,.2)' : 'transparent',
                color: view===v&&!q ? '#5DCAA5' : '#7BAAA0' }}>
              {v === 'guide' ? 'Step-by-step' : 'Quick ref'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <div style={{ flex:1, height:4, background:'rgba(255,255,255,.08)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:pct+'%', background:'#1D9E75', borderRadius:2, transition:'width .4s' }} />
        </div>
        <span style={{ fontSize:11, color:'#7BAAA0', flexShrink:0 }}>{done.size}/{TUTORIAL_DATA.length} done</span>
      </div>

      {q.trim() !== '' && (
        <div style={{ border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', marginBottom:14, background:'rgba(255,255,255,.04)' }}>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(29,158,117,.15)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>
            {hits.length} result{hits.length!==1?'s':''} for "{q}"
          </div>
          {hits.length === 0
            ? <div style={{ padding:20, textAlign:'center', color:'#7BAAA0', fontSize:13 }}>No results found</div>
            : hits.map((h,i) => (
              <div key={i} onClick={() => { setSec(h.si); setTop(h.ti); setQ(''); setView('guide'); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom: i<hits.length-1 ? '1px solid rgba(29,158,117,.1)' : 'none' }}>
                <span>{h.icon}</span>
                <div style={{ flex:1, fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{h.sec} → {h.top}</div>
                <span style={{ fontSize:12, color:'#5DCAA5' }}>Go →</span>
              </div>
            ))
          }
        </div>
      )}

      {!q.trim() && view === 'guide' && (
        <div style={{ display:'grid', gridTemplateColumns:'175px 1fr', gap:14 }}>
          <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {TUTORIAL_DATA.map((s,i) => (
              <button key={s.id} onClick={() => { setSec(i); setTop(0); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', minHeight:42,
                  border: i===sec ? '1px solid rgba(29,158,117,.4)' : '1px solid transparent',
                  background: i===sec ? 'rgba(29,158,117,.1)' : 'transparent' }}>
                <span style={{ fontSize:14 }}>{s.icon}</span>
                <span style={{ fontSize:12, color:'#E8F4F0', flex:1 }}>{s.label}</span>
                {done.has(i) && <span style={{ fontSize:11, color:'#1D9E75' }}>✓</span>}
              </button>
            ))}
          </nav>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', border:'1px solid rgba(29,158,117,.2)', borderRadius:10, background:'rgba(255,255,255,.04)' }}>
              <span style={{ fontSize:22 }}>{S.icon}</span>
              <span style={{ fontSize:15, fontWeight:500, color:'#E8F4F0', flex:1 }}>{S.label}</span>
              <button onClick={mark}
                style={{ padding:'5px 11px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit',
                  border:'1px solid rgba(29,158,117,.3)',
                  background: done.has(sec) ? 'rgba(29,158,117,.2)' : 'transparent',
                  color: done.has(sec) ? '#5DCAA5' : '#7BAAA0' }}>
                {done.has(sec) ? '✓ Done' : 'Mark done'}
              </button>
            </div>

            {S.topics.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {S.topics.map((t,i) => (
                  <button key={i} onClick={() => setTop(i)}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'inherit',
                      border: `1px solid ${i===top ? '#1D9E75' : 'rgba(29,158,117,.2)'}`,
                      background: i===top ? 'rgba(29,158,117,.15)' : 'transparent',
                      color: i===top ? '#5DCAA5' : '#7BAAA0', fontWeight: i===top ? 500 : 400 }}>
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            <div style={{ padding:'16px 18px', border:'1px solid rgba(29,158,117,.2)', borderRadius:12, background:'rgba(255,255,255,.04)' }}>
              <div style={{ fontSize:15, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>{T.title}</div>
              <div style={{ fontSize:13, color:'#7BAAA0', marginBottom:14, lineHeight:1.6 }}>{T.desc}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                {T.steps.map((step,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, background:'rgba(29,158,117,.18)', color:'#5DCAA5' }}>{i+1}</div>
                    <div style={{ fontSize:13, color:'#E8F4F0', lineHeight:1.6 }}>{step}</div>
                  </div>
                ))}
              </div>
              {T.tip && (
                <div style={{ display:'flex', gap:10, background:'rgba(29,158,117,.08)', border:'1px solid rgba(29,158,117,.2)', borderRadius:8, padding:'10px 12px' }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>💡</span>
                  <div style={{ fontSize:13, color:'#5DCAA5', lineHeight:1.6 }}>{T.tip}</div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button onClick={goPrev} disabled={isFirst}
                style={{ padding:'7px 14px', borderRadius:8, fontSize:12, cursor:isFirst?'not-allowed':'pointer', fontFamily:'inherit', border:'1px solid rgba(29,158,117,.2)', background:'transparent', color:'#7BAAA0', opacity:isFirst?.35:1 }}>
                ← Previous
              </button>
              <span style={{ fontSize:11, color:'#7BAAA0' }}>{sec+1}/{TUTORIAL_DATA.length} · {top+1}/{S.topics.length}</span>
              <button onClick={goNext} disabled={isLast}
                style={{ padding:'7px 18px', borderRadius:8, fontSize:12, fontWeight:500, cursor:isLast?'not-allowed':'pointer', fontFamily:'inherit', border:'none', background:'#1D9E75', color:'white', opacity:isLast?.35:1 }}>
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {!q.trim() && view === 'ref' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {Object.entries(QUICK_REF).map(([h, rows]) => (
            <div key={h} style={{ border:'1px solid rgba(29,158,117,.2)', borderRadius:12, overflow:'hidden', background:'rgba(255,255,255,.04)' }}>
              <div style={{ padding:'11px 15px', borderBottom:'1px solid rgba(29,158,117,.12)', fontSize:13, fontWeight:500, color:'#E8F4F0' }}>{h}</div>
              <div style={{ padding:'4px 15px' }}>
                {rows.map(([k,v],i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:i<rows.length-1?'1px solid rgba(29,158,117,.08)':'none' }}>
                    <span style={{ fontSize:13, fontWeight:500, color:'#E8F4F0', flex:1 }}>{k}</span>
                    <span style={{ fontSize:12, color:'#7BAAA0', textAlign:'right', flex:1 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Auth ───────────────────────────────────────────────────────────────────────
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'ContentForge2026';
function checkAuth() {
  try { return localStorage.getItem('cf_auth_v2') === 'true'; }
  catch { return false; }
}

const PAGE_LABELS = {
  composer:'AI Composer', video:'AI Video Engine', scheduler:'Video Scheduler',
  bulk:'Bulk Generator', email:'Email Notifications', analytics:'Analytics',
  tutorial:'Tutorial',
  landing:'Landing Page Builder',
  images:'AI Image Generator',
  media:'Media Library',
  submitter:'Post Submitter',
  reddit:'Reddit Integration', brand:'Brand Voice', compliance:'Compliance',
};

export default function App() {
  const [authed, setAuthed]       = useState(checkAuth);
  const [page, setPage]           = useState('composer');
  const [platforms, setPlatforms] = useState({ facebook:true, instagram:true, reddit:true });
  const [sidebarOpen, setSidebar] = useState(false);

  useEffect(() => {
    const onFocus = () => setAuthed(checkAuth());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  function navigateTo(p) { setPage(p); setSidebar(false); }
  function handleLogout() {
    localStorage.removeItem('cf_auth_v2');
    localStorage.removeItem('cf_auth');
    setAuthed(false);
  }

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <div className={styles.app}>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebar(false)} />}
      <Sidebar page={page} setPage={navigateTo} platforms={platforms} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebar(false)} />
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebar(true)} aria-label="Open menu">☰</button>
          <div className={styles.topbarTitle}>{PAGE_LABELS[page]}</div>
          <div className={styles.topbarRight}>
            <div className={styles.statusPill}><span className={styles.dot} /> Claude Live</div>
            {['video','scheduler','bulk'].includes(page) && <div className={styles.videoBadge}>▶ Video Engine</div>}
            <button onClick={handleLogout} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:'transparent', color:'#888', cursor:'pointer', fontFamily:'inherit' }}>Sign out</button>
          </div>
        </header>
        <main>
          {page === 'composer'   && <Composer onPlatformsChange={setPlatforms} />}
          {page === 'video'      && <VideoEngine />}
          {page === 'scheduler'  && <Scheduler />}
          {page === 'bulk'       && <BulkGenerator />}
          {page === 'email'      && <EmailSettings />}
          {page === 'analytics'  && <Analytics />}
          {page === 'tutorial'   && <TutorialPage />}
          {page === 'landing'    && <LandingPageBuilder />}
          {page === 'images'     && <ImageGenerator />}
          {page === 'media'      && <MediaLibrary />}
          {page === 'submitter'  && <PostSubmitter />}
          {page === 'brand'      && <Brand />}
          {page === 'compliance' && <Compliance />}
          {page === 'calendar'   && <ContentCalendar />}
          {page === 'scriptwriter' && <ScriptWriter />}
        </main>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setTimeout(() => {
      if (password.trim() === CORRECT_PASSWORD.trim()) {
        localStorage.setItem('cf_auth_v2', 'true');
        onLogin();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0D2137', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#102D4F', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:16, padding:'36px 32px', width:'100%', maxWidth:380, textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'#1D9E75', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>⚡</div>
        </div>
        <div style={{ fontSize:22, fontWeight:500, color:'#E8F4F0', marginBottom:6 }}>ContentForge</div>
        <div style={{ fontSize:13, color:'#7BAAA0', marginBottom:24 }}>Social AI Engine — Private Access</div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:10, textAlign:'left' }}>
          <label style={{ fontSize:11, color:'#4A7A72', fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Password</label>
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password" autoFocus autoComplete="off" data-form-type="other"
            style={{ width:'100%', border:'0.5px solid rgba(29,158,117,.25)', borderRadius:8, padding:'11px 13px', fontSize:15, fontFamily:'inherit', color:'#E8F4F0', background:'#163D6A', outline:'none', boxSizing:'border-box' }} />
          {error && <div style={{ fontSize:12, color:'#F09595', background:'rgba(226,75,74,.1)', border:'0.5px solid rgba(226,75,74,.3)', borderRadius:6, padding:'8px 10px' }}>{error}</div>}
          <button type="submit" disabled={loading || !password.trim()}
            style={{ background:'#1D9E75', color:'white', border:'none', borderRadius:8, padding:12, fontSize:15, fontWeight:500, cursor:'pointer', fontFamily:'inherit', marginTop:4, opacity: loading||!password.trim() ? 0.5 : 1 }}>
            {loading ? '⏳ Checking…' : 'Sign in →'}
          </button>
        </form>
        <div style={{ fontSize:11, color:'#4A7A72', marginTop:20 }}>Private — not publicly accessible</div>
      </div>
    </div>
  );
}
