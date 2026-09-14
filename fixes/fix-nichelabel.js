const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

// Add nicheLabel declaration after niche is defined
const old = "    const year = new Date().getFullYear();";
const fix = "    const year = new Date().getFullYear();\n    const nicheLabel = (niche||'guide').replace(/-/g,' ');";

if (src.includes(fix)) {
  console.log('✅ Already fixed');
} else if (src.includes(old)) {
  // Only replace in the /api/page/:slug endpoint context
  // Find the second occurrence (first is elsewhere)
  const idx = src.indexOf(old, src.indexOf("app.get('/api/page/:slug'"));
  if (idx > 0) {
    src = src.slice(0, idx) + fix + src.slice(idx + old.length);
    fs.writeFileSync('server.js', src);
    console.log('✅ nicheLabel fix applied');
  } else {
    console.log('❌ Could not find location');
  }
} else {
  console.log('❌ Pattern not found');
}
