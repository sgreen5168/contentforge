from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, List, Optional
import anthropic
import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ContentForge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

PLATFORM_LABELS = {"facebook": "Facebook", "instagram": "Instagram", "reddit": "Reddit"}

# ── Models ────────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    inputMode: Literal["topic", "url", "affiliate"]
    topic: Optional[str] = ""
    url: Optional[str] = ""
    style: str
    platforms: List[Literal["facebook", "instagram", "reddit"]]
    affiliate: bool = False

class BrandLearnRequest(BaseModel):
    post: str

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}

# ── Generate posts ────────────────────────────────────────────────────────────

@app.post("/api/generate")
def generate(req: GenerateRequest):
    if not req.platforms:
        raise HTTPException(400, "At least one platform required")
    if req.inputMode == "topic" and not (req.topic or "").strip():
        raise HTTPException(400, "Topic is required")
    if req.inputMode in ("url", "affiliate") and not (req.url or "").strip():
        raise HTTPException(400, "URL is required")

    plat_list = ", ".join(PLATFORM_LABELS[p] for p in req.platforms)
    aff_note  = " Naturally embed [AFFILIATE_LINK] where it converts best." if req.affiliate else ""

    if req.inputMode == "topic":
        subject = f'Topic: "{req.topic}"'
    elif req.inputMode == "url":
        subject = f"Repurpose content from this URL: {req.url}"
    else:
        subject = f"Write posts promoting this affiliate product/link: {req.url}"

    plat_template = ", ".join(
        f'"{p}": {{"text": "post text here", "compliant": true, "note": "compliance note"}}'
        for p in req.platforms
    )

    prompt = f"""You are an expert social media copywriter. Write platform-optimised posts for: {plat_list}.

{subject}
Style: {req.style}{aff_note}

Reply with ONLY a raw JSON object — no markdown, no code fences, no extra text:
{{{plat_template}}}

Platform rules:
- facebook: conversational, 1-3 paragraphs, emojis optional, no clickbait
- instagram: visual language, 10-20 relevant hashtags, line breaks for readability
- reddit: honest/authentic, no hype, minimal self-promotion, community-appropriate
- all: FTC-compliant if promotional, no misleading claims"""

    try:
        message = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1500,
            system="You are a social media content expert. Always reply with valid JSON only — no markdown, no backticks, no preamble.",
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw).strip()

        try:
            posts = json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", raw)
            if match:
                posts = json.loads(match.group())
            else:
                raise HTTPException(500, "Could not parse AI response — please try again")

        return {"posts": posts}

    except anthropic.APIError as e:
        raise HTTPException(500, str(e))

# ── Brand voice learning ──────────────────────────────────────────────────────

@app.post("/api/brand/learn")
def brand_learn(req: BrandLearnRequest):
    if not req.post.strip():
        raise HTTPException(400, "Post content required")

    prompt = f"""Analyse this social media post and extract brand voice attributes as JSON:

"{req.post}"

Reply with this exact structure (all numbers 0-100):
{{
  "tone": {{"conversational":0,"professional":0,"humorous":0,"direct":0,"empathetic":0}},
  "style": {{"emojiUse":0,"hashtags":0,"ctaStrength":0,"postLength":0,"storytelling":0}},
  "phrases": ["phrase1","phrase2","phrase3"],
  "hashtags": ["#tag1","#tag2","#tag3"],
  "topics": ["topic1","topic2"]
}}"""

    try:
        message = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=800,
            system="You are a brand voice analyst. Reply with valid JSON only.",
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw).strip()

        return json.loads(raw)

    except (anthropic.APIError, json.JSONDecodeError) as e:
        raise HTTPException(500, str(e))
