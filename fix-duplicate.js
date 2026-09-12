// Run in Railway Console to fix duplicate paragraph on landing pages
const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

const old = `    const bodyHtml = bodyParas.map((p, i) => {
      const img = (i === 1 && inlineImage)
        ? '<div style="margin:28px 0;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)"><img src="' + inlineImage + '" alt="' + title + '" style="width:100%;height:auto;display:block" loading="lazy"></div>'
        : '';
      return '<p style="font-size:17px;line-height:1.9;color:#374151;margin-bottom:22px">' + p + '</p>' + img;
    }).join('');`;

const fix = `    const bodyRemaining = bodyParas.slice(1);
    const bodyHtml = bodyRemaining.map((p, i) => {
      const img = (i === 0 && inlineImage)
        ? '<div style="margin:28px 0;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)"><img src="' + inlineImage + '" alt="' + title + '" style="width:100%;height:auto;display:block" loading="lazy"></div>'
        : '';
      return '<p style="font-size:17px;line-height:1.9;color:#374151;margin-bottom:22px">' + p + '</p>' + img;
    }).join('');`;

if (src.includes(old)) {
  src = src.replace(old, fix);
  fs.writeFileSync('server.js', src);
  console.log('✅ Duplicate paragraph fixed — restart server to apply');
} else {
  console.log('Pattern not found — checking if already fixed...');
  console.log('bodyRemaining present:', src.includes('bodyRemaining'));
}
