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
import { SITE_URL, canonicalUrlForRoute, getRouteSeo, getRouteSeoEntries, getSeoRoutes } from './seoRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = 4173;

const ROUTES = getSeoRoutes();
const INDEXABLE_ROBOTS = 'index,follow';
const NOINDEX_ROBOTS = 'noindex,follow';
const isNetlifyPreview =
  process.env.NETLIFY === 'true' && process.env.CONTEXT && process.env.CONTEXT !== 'production';
const shouldRenderBingVerification =
  Boolean(process.env.BING_SITE_VERIFICATION) &&
  (process.env.CONTEXT === 'production' || process.env.ALLOW_BING_VERIFICATION_IN_NON_PRODUCTION === 'true');

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
  const robots = isNetlifyPreview ? NOINDEX_ROBOTS : INDEXABLE_ROBOTS;

  let nextHtml = html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapedDescription}">`)
    .replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/, `<meta name="robots" content="${robots}">`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonicalUrl}">`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapedTitle}">`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapedDescription}">`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}">`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapedTitle}">`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapedDescription}">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, buildJsonLd(route))
    .replace('<div id="root"></div>', `<div id="root">${buildStaticRouteContent(route)}</div>`);

  nextHtml = withBingVerification(nextHtml);

  return nextHtml;
}

function withBingVerification(html) {
  const withoutExistingTag = html.replace(/\n?\s*<meta\s+name="msvalidate\.01"\s+content="[^"]*"\s*\/?>/g, '');
  if (!shouldRenderBingVerification) return withoutExistingTag;

  const content = escapeHtml(process.env.BING_SITE_VERIFICATION.trim());
  if (!content) return withoutExistingTag;

  return withoutExistingTag.replace('</head>', `  <meta name="msvalidate.01" content="${content}" />\n</head>`);
}

function stripBrand(value) {
  return value
    .replace(/\s+\|\s+FilePilot$/i, '')
    .replace(/\s+-\s+FilePilot$/i, '')
    .trim();
}

function routeLabel(route) {
  const seo = getRouteSeo(route);
  return seo.h1 ?? stripBrand(seo.title);
}

function linkList(routes) {
  return routes
    .filter((route) => ROUTES.includes(route))
    .slice(0, 5)
    .map((route) => `<li><a href="${canonicalUrlForRoute(route)}">${escapeHtml(routeLabel(route))}</a></li>`)
    .join('');
}

function buildJsonLd(route) {
  const seo = getRouteSeo(route);
  const url = canonicalUrlForRoute(route);
  const graph = [];

  if (route === '/') {
    graph.push(
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        url,
        name: 'FilePilot',
        description: seo.description,
        inLanguage: 'en',
      },
      {
        '@type': 'Organization',
        '@id': `${url}#organization`,
        name: 'FilePilot',
        url,
        logo: 'https://www.filepilot.space/filepilot_logo.svg',
      },
      {
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        name: 'FilePilot',
        url,
        description: seo.description,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
      },
    );
  } else if (['/pdf-tools', '/image-tools', '/image-workflows', '/ai-tools', '/blog'].includes(route)) {
    graph.push(
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'FilePilot', item: canonicalUrlForRoute('/') },
          { '@type': 'ListItem', position: 2, name: routeLabel(route), item: url },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: routeLabel(route),
        url,
        description: seo.description,
        isPartOf: { '@id': `${SITE_URL}#website` },
      },
    );
  } else if (!route.startsWith('/blog') && !['/privacy', '/terms'].includes(route)) {
    const entry = getRouteSeoEntries().find((e) => e.route === route);
    const category = entry?.category;
    const CATEGORY_HUBS = {
      'organize-manage': { route: '/pdf-tools', label: 'PDF Tools' },
      'edit-annotate': { route: '/pdf-tools', label: 'PDF Tools' },
      'convert-to-pdf': { route: '/pdf-tools', label: 'PDF Tools' },
      'convert-from-pdf': { route: '/pdf-tools', label: 'PDF Tools' },
      'optimize-repair': { route: '/pdf-tools', label: 'PDF Tools' },
      'secure-pdf': { route: '/pdf-tools', label: 'PDF Tools' },
      'image-tools': { route: '/image-tools', label: 'Image Tools' },
      'ai-tools': { route: '/ai-tools', label: 'AI Image Tools' },
      'workflows': { route: '/image-workflows', label: 'Image Workflows' },
    };
    const hub = CATEGORY_HUBS[category];
    const breadcrumbItems = [
      { '@type': 'ListItem', position: 1, name: 'FilePilot', item: canonicalUrlForRoute('/') },
    ];
    if (hub) {
      breadcrumbItems.push({ '@type': 'ListItem', position: 2, name: hub.label, item: canonicalUrlForRoute(hub.route) });
      breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: routeLabel(route), item: url });
    } else {
      breadcrumbItems.push({ '@type': 'ListItem', position: 2, name: routeLabel(route), item: url });
    }

    graph.push(
      { '@type': 'BreadcrumbList', itemListElement: breadcrumbItems },
      {
        '@type': 'WebApplication',
        name: routeLabel(route),
        url,
        description: seo.description,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    );
  }

  if (graph.length === 0) return '';

  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

function buildStaticRouteContent(route) {
  const seo = getRouteSeo(route);
  const title = escapeHtml(routeLabel(route));
  const description = escapeHtml(seo.shortIntro ?? seo.description);
  const relatedRoutes = seo.relatedTools ?? (route === '/'
    ? ['/pdf-tools', '/image-tools', '/merge', '/split', '/compress']
    : route === '/pdf-tools'
      ? ['/merge', '/split', '/compress', '/pdf-to-jpg', '/jpg-to-pdf']
      : route === '/image-tools'
        ? ['/compress-image', '/resize-image', '/convert-image', '/crop-image', '/image-formatter']
        : route.startsWith('/blog')
          ? ['/blog', '/privacy', '/pdf-tools', '/image-tools']
          : ['/merge', '/split', '/compress', '/pdf-to-jpg', '/jpg-to-pdf']);

  const isToolRoute = !['/', '/pdf-tools', '/image-tools', '/image-workflows', '/ai-tools', '/blog', '/privacy', '/terms'].includes(route) && !route.startsWith('/blog/');
  const body = isToolRoute
    ? `
      <nav aria-label="Breadcrumb"><a href="${canonicalUrlForRoute('/')}">FilePilot</a> / <span>${title}</span></nav>
      <h1>${title}</h1>
      <p>${description}</p>
      <section>
        <h2>How it works</h2>
        <ol>
          <li>Select your file or files from your device.</li>
          <li>Choose the settings for this tool and preview the result where available.</li>
          <li>Download the finished file. Processing happens in your browser, so files are not uploaded to FilePilot.</li>
        </ol>
      </section>
      <section>
        <h2>Common uses</h2>
        <p>Use ${title} for everyday document and image workflows such as preparing files for email, organizing scanned pages, creating shareable downloads, reducing file size, or converting content into a format that is easier to archive and send.</p>
      </section>
      <section>
        <h2>Related FilePilot tools</h2>
        <ul>${linkList(relatedRoutes)}</ul>
      </section>
    `
    : `
      <h1>${title}</h1>
      <p>${description}</p>
      <section>
        <h2>Private browser-based tools</h2>
        <p>FilePilot keeps file processing local whenever a tool handles your documents or images. Your browser performs the work on your device, which avoids upload queues, reduces privacy exposure, and lets you keep control of sensitive files.</p>
      </section>
      <section>
        <h2>Explore FilePilot</h2>
        <ul>${linkList(relatedRoutes)}</ul>
      </section>
    `;

  return `<div data-static-seo="true" class="static-seo">${body}${buildJsonLd(route)}</div>`;
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

  write404Shell(baseHtml);
  console.log(`Wrote SEO HTML shells for ${ROUTES.length} routes.`);
}

function write404Shell(baseHtml) {
  const notFoundHtml = baseHtml
    .replace(/<title>[^<]*<\/title>/, '<title>Page Not Found | FilePilot</title>')
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, '<meta name="description" content="The requested FilePilot page could not be found.">')
    .replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/, '<meta name="robots" content="noindex,follow">')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${SITE_URL}">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
    .replace(
      '<div id="root"></div>',
      `<div id="root"><main class="static-seo"><h1>Page not found</h1><p>The page you requested does not exist. Use the links below to return to FilePilot tools.</p><ul><li><a href="${canonicalUrlForRoute('/')}">FilePilot home</a></li><li><a href="${canonicalUrlForRoute('/pdf-tools')}">PDF tools</a></li><li><a href="${canonicalUrlForRoute('/image-tools')}">Image tools</a></li></ul></main></div>`,
    );

  writeFileSync(join(DIST, '404.html'), withBingVerification(notFoundHtml), 'utf-8');
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
    html = withRouteSeo(html, route);

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
