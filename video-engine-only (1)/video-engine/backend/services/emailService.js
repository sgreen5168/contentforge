import dotenv from 'dotenv';
dotenv.config();

const RESEND_API = 'https://api.resend.com';

// ── Send email via Resend ─────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const API_KEY = process.env.RESEND_API_KEY;
  if (!API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return null;
  }

  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`${RESEND_API}/emails`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'ContentForge <notifications@contentstudiohub.com>',
      to: [to || process.env.NOTIFY_EMAIL],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn('Email send failed:', err.message || res.status);
    return null;
  }

  const data = await res.json();
  console.log(`📧 Email sent: ${subject} → ${to || process.env.NOTIFY_EMAIL}`);
  return data;
}

// ── Video completed notification ──────────────────────────────────────────────
export async function sendVideoCompleteEmail({ jobId, script, clipUrl, audioUrl, topic, persona, duration, platforms }) {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return null;

  const platformList = (platforms || []).join(', ') || 'TikTok';
  const hasVideo = !!clipUrl;
  const hasAudio = !!audioUrl;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0D2137; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: #102D4F; border: 1px solid rgba(29,158,117,.2); border-radius: 12px; overflow: hidden; }
    .header { background: #163D6A; padding: 24px 28px; border-bottom: 1px solid rgba(29,158,117,.15); }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .logo-icon { width: 32px; height: 32px; background: #1D9E75; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .logo-text { font-size: 16px; font-weight: 600; color: #E8F4F0; }
    h1 { font-size: 22px; font-weight: 500; color: #E8F4F0; margin: 0 0 6px; }
    .sub { font-size: 13px; color: #7BAAA0; }
    .body { padding: 24px 28px; }
    .badge { display: inline-block; background: rgba(29,158,117,.2); color: #5DCAA5; font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 500; margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .meta-item { background: #163D6A; border-radius: 8px; padding: 10px 12px; }
    .meta-label { font-size: 10px; color: #4A7A72; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
    .meta-value { font-size: 13px; color: #E8F4F0; font-weight: 500; }
    .script-box { background: #163D6A; border: 1px solid rgba(29,158,117,.15); border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .script-label { font-size: 10px; color: #5DCAA5; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; font-weight: 600; }
    .script-text { font-size: 14px; color: #E8F4F0; line-height: 1.6; font-style: italic; }
    .assets { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .asset-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .asset-ok { background: rgba(29,158,117,.2); color: #5DCAA5; }
    .asset-no { background: rgba(74,122,114,.15); color: #4A7A72; }
    .cta-btn { display: block; background: #1D9E75; color: white; text-decoration: none; text-align: center; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-bottom: 12px; }
    .hashtags { font-size: 12px; color: #5DCAA5; margin-top: 8px; }
    .footer { padding: 16px 28px; border-top: 1px solid rgba(29,158,117,.1); text-align: center; }
    .footer-text { font-size: 11px; color: #4A7A72; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">
          <div class="logo-icon">⚡</div>
          <span class="logo-text">ContentForge</span>
        </div>
        <h1>🎬 Your video is ready!</h1>
        <p class="sub">AI Video Engine has finished generating your content</p>
      </div>
      <div class="body">
        <span class="badge">✅ Generation complete</span>

        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Topic</div>
            <div class="meta-value">${topic || 'Video'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Persona</div>
            <div class="meta-value">${persona || 'UGC'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Duration</div>
            <div class="meta-value">${duration || '30s'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Platforms</div>
            <div class="meta-value">${platformList}</div>
          </div>
        </div>

        ${script?.hook ? `
        <div class="script-box">
          <div class="script-label">Hook</div>
          <div class="script-text">"${script.hook}"</div>
          ${script.cta ? `
          <div class="script-label" style="margin-top:10px">CTA</div>
          <div class="script-text">"${script.cta}"</div>
          ` : ''}
          ${script.hashtags?.length ? `<div class="hashtags">${script.hashtags.slice(0,5).join(' ')}</div>` : ''}
        </div>
        ` : ''}

        <div class="assets">
          <span class="asset-pill ${hasVideo ? 'asset-ok' : 'asset-no'}">${hasVideo ? '✅' : '○'} Video clip</span>
          <span class="asset-pill ${hasAudio ? 'asset-ok' : 'asset-no'}">${hasAudio ? '✅' : '○'} Voiceover</span>
          <span class="asset-pill asset-ok">✅ Script ready</span>
        </div>

        <a href="https://contentstudiohub.com" class="cta-btn">View in ContentForge →</a>

        ${clipUrl ? `<a href="${clipUrl}" style="display:block;text-align:center;font-size:12px;color:#5DCAA5;text-decoration:none;margin-top:8px">Download video clip ↗</a>` : ''}
      </div>
      <div class="footer">
        <p class="footer-text">ContentForge · contentstudiohub.com · You're receiving this because you enabled video notifications</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `🎬 Video ready: "${topic || 'Your video'}" — ContentForge`,
    html,
  });
}

// ── Bulk batch completed notification ─────────────────────────────────────────
export async function sendBulkCompleteEmail({ batchId, completed, failed, total, topics }) {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return null;

  const successRate = Math.round((completed / total) * 100);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0D2137; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: #102D4F; border: 1px solid rgba(29,158,117,.2); border-radius: 12px; overflow: hidden; }
    .header { background: #163D6A; padding: 24px 28px; border-bottom: 1px solid rgba(29,158,117,.15); }
    .logo-text { font-size: 16px; font-weight: 600; color: #E8F4F0; }
    h1 { font-size: 22px; font-weight: 500; color: #E8F4F0; margin: 0 0 6px; }
    .sub { font-size: 13px; color: #7BAAA0; margin: 0; }
    .body { padding: 24px 28px; }
    .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .stat { background: #163D6A; border-radius: 8px; padding: 14px; text-align: center; }
    .stat-val { font-size: 28px; font-weight: 500; }
    .stat-lbl { font-size: 11px; color: #7BAAA0; margin-top: 4px; }
    .ok { color: #5DCAA5; }
    .fail { color: #F09595; }
    .neutral { color: #E8F4F0; }
    .topic-list { background: #163D6A; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
    .topic-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid rgba(29,158,117,.08); font-size: 12px; color: #E8F4F0; }
    .topic-item:last-child { border: none; }
    .cta-btn { display: block; background: #1D9E75; color: white; text-decoration: none; text-align: center; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; }
    .footer { padding: 16px 28px; border-top: 1px solid rgba(29,158,117,.1); text-align: center; font-size: 11px; color: #4A7A72; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <p class="logo-text">⚡ ContentForge</p>
        <h1>⚡ Bulk batch complete!</h1>
        <p class="sub">${successRate}% success rate — ${completed} of ${total} videos generated</p>
      </div>
      <div class="body">
        <div class="stats">
          <div class="stat"><div class="stat-val ok">${completed}</div><div class="stat-lbl">Completed</div></div>
          <div class="stat"><div class="stat-val fail">${failed}</div><div class="stat-lbl">Failed</div></div>
          <div class="stat"><div class="stat-val neutral">${total}</div><div class="stat-lbl">Total</div></div>
        </div>

        <div class="topic-list">
          ${(topics || []).slice(0, 10).map((t, i) => `
            <div class="topic-item">
              <span style="color:#5DCAA5;font-weight:500;width:18px;flex-shrink:0">${i + 1}</span>
              ${t}
            </div>
          `).join('')}
        </div>

        <a href="https://contentstudiohub.com" class="cta-btn">View all videos in ContentForge →</a>
      </div>
      <div class="footer">ContentForge · contentstudiohub.com</div>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `⚡ Bulk batch done: ${completed}/${total} videos ready — ContentForge`,
    html,
  });
}

// ── Scheduled post published notification ────────────────────────────────────
export async function sendScheduledPostEmail({ platforms, scheduledAt, script }) {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; background: #0D2137; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: #102D4F; border: 1px solid rgba(29,158,117,.2); border-radius: 12px; overflow: hidden; }
    .header { background: #163D6A; padding: 24px 28px; }
    h1 { font-size: 20px; color: #E8F4F0; margin: 0 0 6px; }
    .sub { font-size: 13px; color: #7BAAA0; margin: 0; }
    .body { padding: 24px 28px; }
    .plats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .plat { background: rgba(29,158,117,.15); color: #5DCAA5; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .hook { background: #163D6A; border-radius: 8px; padding: 14px; font-size: 14px; color: #E8F4F0; font-style: italic; line-height: 1.6; margin-bottom: 16px; }
    .cta { display: block; background: #1D9E75; color: white; text-decoration: none; text-align: center; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 500; }
    .footer { padding: 16px 28px; text-align: center; font-size: 11px; color: #4A7A72; border-top: 1px solid rgba(29,158,117,.1); }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>📅 Scheduled post published!</h1>
        <p class="sub">Your video was automatically posted at the scheduled time</p>
      </div>
      <div class="body">
        <div class="plats">
          ${(platforms || []).map(p => `<span class="plat">✅ ${p}</span>`).join('')}
        </div>
        ${script?.hook ? `<div class="hook">"${script.hook}"</div>` : ''}
        <a href="https://contentstudiohub.com" class="cta">View in ContentForge →</a>
      </div>
      <div class="footer">ContentForge · contentstudiohub.com</div>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `📅 Posted to ${(platforms||[]).join(', ')} — ContentForge`,
    html,
  });
}

export { sendEmail };
