// Run this in Railway Console to add the /api/page/:slug endpoint
// Copy and paste this entire file content into the Railway Console

const fs = require('fs');
const src = fs.readFileSync('server.js', 'utf8');

// Check if endpoint already exists
if (src.includes("app.get('/api/page/:slug'")) {
  console.log('Endpoint already exists');
  process.exit(0);
}

const newEndpoint = `
app.get('/api/page/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const db = await getNichrouteClient();
    if (!db) return res.status(500).send('DB not configured');
    const { data, error } = await db.from('submissions').select('*').eq('slug', slug).single();
    if (error || !data) return res.status(404).send('Page not found');
    const title = (data.title || slug).replace(/\\*\\*/g,'').replace(/^#+\\s*/,'').trim();
    const body = data.body || '';
    const affUrl = data.affiliate_url || '';
    const niche = data.niche || '';
    const heroImage = data.hero_image || '';
    const inlineImage = data.inline_image || '';
    const paragraphs = body.split('\\n\\n').filter(p => p.trim()).map(p => p.replace(/\\*\\*/g,'').replace(/^#+\\s*/,'').trim());
    const heroStyle = heroImage
      ? 'background:linear-gradient(rgba(11,24,41,.72),rgba(11,24,41,.82)),url(' + heroImage + ') center/cover no-repeat;color:#fff;padding:90px 24px 70px;text-align:center;min-height:320px;display:flex;align-items:center;justify-content:center;flex-direction:column'
      : 'background:linear-gradient(135deg,#0B1829 0%,#112240 100%);color:#fff;padding:90px 24px 70px;text-align:center;min-height:320px;display:flex;align-items:center;justify-content:center;flex-direction:column';
    const ogTag = heroImage ? '<meta property="og:image" content="' + heroImage + '">' : '';
    const parasHtml = paragraphs.map((p, i) => {
      const img = (i === 1 && inlineImage) ? '<div style="margin:24px 0;border-radius:12px;overflow:hidden"><img src="' + inlineImage + '" alt="' + title + '" style="width:100%;height:auto;display:block" loading="lazy"></div>' : '';
      return '<p style="margin-bottom:18px;font-size:16px;line-height:1.85;color:#374151">' + p + '</p>' + img;
    }).join('');
    const ctaHtml = affUrl ? '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:28px;margin:32px 0;text-align:center"><p style="font-weight:700;font-size:17px;margin-bottom:12px;color:#166534">Ready to explore this further?</p><a href="' + affUrl + '" target="_blank" rel="noopener" style="display:inline-block;padding:14px 36px;background:#16a34a;color:#fff;border-radius:9px;text-decoration:none;font-weight:700">View Recommended Resource &rarr;</a></div>' : '';
    const year = new Date().getFullYear();
    const dateStr = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + ' &mdash; NichRoute</title><meta name="description" content="' + (paragraphs[0]||title).slice(0,160) + '"><meta property="og:title" content="' + title + '">' + ogTag + '<link rel="canonical" href="https://nichroute.com/content.html?slug=' + slug + '"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#fff}.hero{' + heroStyle + '}.badge{display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:20px;padding:5px 16px;font-size:12px;font-weight:500;margin-bottom:18px;text-transform:uppercase}h1{font-size:clamp(26px,5vw,46px);font-weight:800;line-height:1.15;max-width:800px;text-shadow:0 2px 12px rgba(0,0,0,.3);margin-bottom:12px}.hero-meta{font-size:14px;opacity:.75}.content{max-width:740px;margin:0 auto;padding:48px 24px}.byline{font-size:13px;color:#9ca3af;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid #e5e7eb}footer{text-align:center;padding:28px 24px;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;margin-top:40px;line-height:1.8}footer a{color:#16a34a;text-decoration:none}@media(max-width:640px){.content{padding:32px 18px}}</style></head><body><div class="hero"><div class="badge">&#10022; ' + (niche||'Featured') + '</div><h1>' + title + '</h1><div class="hero-meta">' + dateStr + ' &middot; Article</div></div><div class="content"><div class="byline">NichRoute &middot; <a href="https://nichroute.com">nichroute.com</a></div>' + ctaHtml + parasHtml + ctaHtml + '</div><footer><p><a href="https://nichroute.com">NichRoute</a> &middot; &copy; ' + year + '</p><p style="margin-top:6px">This page contains affiliate links. We may earn a commission at no extra cost to you.</p></footer></body></html>';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch(e) { res.status(500).send('Error: ' + e.message); }
});
`;

// Inject before health endpoint
const updated = src.replace("app.get('/health',", newEndpoint + "\napp.get('/health',");
fs.writeFileSync('server.js', updated);
console.log('✅ Endpoint added. Restart server to apply.');
