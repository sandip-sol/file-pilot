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
import { SITE_URL, getRouteSeo, getSeoRoutes } from './seoRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = 4173;

const ROUTES = getSeoRoutes();

function canonicalUrlForRoute(route) {
  return new URL(route, SITE_URL).toString();
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function withRouteSeo(html, route) {
  const canonicalUrl = canonicalUrlForRoute(route);
  const { title, description } = getRouteSeo(route);
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapedDescription}">`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonicalUrl}">`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapedTitle}">`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapedDescription}">`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}">`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapedTitle}">`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapedDescription}">`);
}

function writeSeoShells() {
  const baseFile = join(DIST, 'index.html');
  const baseHtml = readFileSync(baseFile, 'utf8');

  for (const route of ROUTES) {
    const html = withRouteSeo(baseHtml, route);
    const outDir = route === '/' ? DIST : join(DIST, route);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const outFile = route === '/' ? join(DIST, 'index.html') : join(outDir, 'index.html');
    writeFileSync(outFile, html, 'utf-8');
  }

  console.log(`Wrote SEO HTML shells for ${ROUTES.length} routes.`);
}

let puppeteer;
try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  console.log('⚠ Puppeteer not installed. Writing SEO HTML shells instead.');
  writeSeoShells();
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
  writeSeoShells();

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
  writeSeoShells();
  console.error('  The build output in dist/ is still valid with route-specific title, description, and canonical tags.');
  console.error('  Install Chrome/Chromium system dependencies and allow the local preview port to enable prerendering.');
  // Exit 0 so the build doesn't fail — prerender is an enhancement, not a requirement.
  process.exit(0);
});
