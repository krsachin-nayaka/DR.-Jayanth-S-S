const https = require('https');

async function check() {
  const res = await fetch("https://share.google/ngFEFvWuzwTjT2xAh", {
    redirect: 'follow',
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  console.log("Final URL:", res.url);
  const text = await res.text();
  console.log("HTML length:", text.length);
  // find any place details or scripts
  const scripts = text.match(/window\.location\s*=\s*['"]([^'"]+)['"]/);
  if (scripts) console.log("Window location redirect:", scripts[1]);
  const links = text.match(/https:\/\/(www\.)?google\.[a-z.]+\/maps\/[^\s"'<>]+/g);
  if (links) console.log("Maps links:", links);
  const metaRefresh = text.match(/url=([^"'>]+)/i);
  if (metaRefresh) console.log("Meta refresh:", metaRefresh[1]);
  // Look for any clinic or business strings
  const titleMatch = text.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) console.log("Title:", titleMatch[1]);
  // Look for data strings
  const stringMatches = text.match(/["']([A-Za-z0-9\s,\.\-]{10,60})["']/g);
  const sample = stringMatches ? stringMatches.slice(0, 30) : [];
  console.log("Sample strings:", sample);
}

check().catch(console.error);
