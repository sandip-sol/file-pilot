/**
 * Post-build prerender script.
 * Spins up a local server for dist/, visits each route with Puppeteer,
 * and saves the fully-rendered HTML so crawlers see complete meta/SEO tags.
 *
 * Usage:  node prerender.js
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SITE_URL, getSeoRoutes } from './seoRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = 4173;

const ROUTES = getSeoRoutes();

function canonicalUrlForRoute(route) {
  return new URL(route, SITE_URL).toString();
}

function withRouteCanonical(html, route) {
  const canonicalUrl = canonicalUrlForRoute(route);

  return html
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonicalUrl}">`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}">`);
}

function writeCanonicalShells() {
  const baseFile = join(DIST, 'index.html');
  const baseHtml = readFileSync(baseFile, 'utf8');

  for (const route of ROUTES) {
    const html = withRouteCanonical(baseHtml, route);
    const outDir = route === '/' ? DIST : join(DIST, route);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const outFile = route === '/' ? join(DIST, 'index.html') : join(outDir, 'index.html');
    writeFileSync(outFile, html, 'utf-8');
  }

  console.log(`Wrote canonical HTML shells for ${ROUTES.length} routes.`);
}

let puppeteer;
try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  console.log('⚠ Puppeteer not installed. Writing canonical HTML shells instead.');
  writeCanonicalShells();
  process.exit(0);
}

/** Tiny static file server that falls back to index.html (SPA behaviour). */
function startServer() {
  const mime = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.txt': 'text/plain',
    '.xml': 'text/xml',
  };

  const server = createServer((req, res) => {
    let filePath = join(DIST, req.url === '/' ? '/index.html' : req.url);
    if (!existsSync(filePath) || !filePath.includes('.')) {
      filePath = join(DIST, 'index.html');
    }
    const ext = '.' + filePath.split('.').pop();
    const contentType = mime[ext] || 'application/octet-stream';
    try {
      const data = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function prerender() {
  console.log('Starting prerender...');
  writeCanonicalShells();

  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route}`;
    console.log(`  Rendering ${route} ...`);

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    // Give React a moment to finish client-side useEffect for meta tags / JSON-LD
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));

    let html = await page.content();

    // Clean up: remove extra data-* attrs Puppeteer may insert
    html = html.replace(/ data-reactroot=""/g, '');

    // Write the rendered HTML
    const outDir = route === '/' ? DIST : join(DIST, route);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outFile = route === '/' ? join(DIST, 'index.html') : join(outDir, 'index.html');
    writeFileSync(outFile, html, 'utf-8');
    console.log(`  ✓ Saved ${outFile.replace(DIST, 'dist')}`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('Prerender complete!');
}

prerender().catch((err) => {
  console.error('⚠ Prerender skipped:', err.message);
  writeCanonicalShells();
  console.error('  The build output in dist/ is still valid with self-referencing route canonicals.');
  console.error('  Install Chrome/Chromium system dependencies and allow the local preview port to enable prerendering.');
  // Exit 0 so the build doesn't fail — prerender is an enhancement, not a requirement.
  process.exit(0);
});
