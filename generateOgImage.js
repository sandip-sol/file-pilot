/**
 * Generates the 1200×630 social preview image (public/og-image.png).
 *
 * Social/directory previews (Product Hunt, Twitter/X, LinkedIn, Slack, Facebook)
 * expect a landscape 1200×630 image; the previous og:image was a 512×512 square
 * logo that renders cropped or letterboxed everywhere. Run this whenever the
 * wordmark, tagline, or brand colours change:
 *
 *   node generateOgImage.js
 */
import { writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const OUT = new URL('./public/og-image.png', import.meta.url);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: radial-gradient(1200px 700px at 78% -10%, #10403c 0%, #0f0f0f 55%);
    color: #fff; width: 1200px; height: 630px; position: relative; overflow: hidden;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(22,202,187,.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(22,202,187,.06) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(900px 600px at 80% 0%, #000 0%, transparent 70%);
  }
  .wrap { position: relative; height: 100%; padding: 84px 88px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 20px; }
  .logo {
    width: 76px; height: 76px; border-radius: 20px;
    background: linear-gradient(135deg, #16CABB, #0e8f84);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 40px rgba(22,202,187,.35);
  }
  .logo svg { width: 40px; height: 40px; }
  .brand-name { font-size: 44px; font-weight: 800; letter-spacing: -0.5px; }
  .headline {
    margin-top: auto; font-size: 74px; line-height: 1.06; font-weight: 800;
    letter-spacing: -2px; max-width: 900px;
  }
  .headline .accent { color: #16CABB; }
  .sub { margin-top: 26px; font-size: 30px; line-height: 1.35; color: #b9c4c2; max-width: 780px; }
  .row { margin-top: 40px; display: flex; gap: 16px; }
  .pill {
    font-size: 24px; font-weight: 600; padding: 12px 22px; border-radius: 999px;
    border: 1px solid rgba(22,202,187,.35); background: rgba(22,202,187,.10); color: #7fe9dd;
    display: flex; align-items: center; gap: 10px;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #16CABB; box-shadow: 0 0 12px #16CABB; }
  .url { position: absolute; right: 88px; bottom: 84px; font-size: 26px; font-weight: 600; color: #7d8b89; }
</style></head><body>
  <div class="grid"></div>
  <div class="wrap">
    <div class="brand">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none"><path d="M14 3v4a1 1 0 0 0 1 1h4" stroke="#052b28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="#052b28" stroke-width="2" stroke-linejoin="round"/><path d="M9 13l2 2 4-4" stroke="#052b28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="brand-name">FilePilot</div>
    </div>

    <div class="headline">Private <span class="accent">PDF &amp; image</span> tools that never upload your files</div>
    <div class="sub">Merge, convert, compress, edit and organise — all processed locally in your browser.</div>

    <div class="row">
      <div class="pill"><span class="dot"></span> No uploads</div>
      <div class="pill"><span class="dot"></span> 100% in-browser</div>
      <div class="pill"><span class="dot"></span> Free &amp; no signup</div>
    </div>
  </div>
  <div class="url">filepilot.space</div>
</body></html>`;

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buffer = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  writeFileSync(OUT, buffer);
  console.log(`Generated public/og-image.png (${(buffer.length / 1024).toFixed(0)} KB, 1200×630).`);
} finally {
  await browser.close();
}
