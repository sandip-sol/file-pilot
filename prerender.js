/**
 * Post-build prerender script.
 * Spins up a local server for dist/, visits each route with Puppeteer,
 * and saves the fully-rendered HTML so crawlers see complete meta/SEO tags.
 *
 * Usage:  node prerender.js
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SITE_URL, canonicalUrlForRoute, getRouteSeo, getRouteSeoEntries, getSeoRoutes } from './seoRoutes.js';
import { toolContent } from './src/data/toolContent.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = 4173;

const ROUTES = getSeoRoutes();
const INDEXABLE_ROBOTS = 'index,follow';
const NOINDEX_ROBOTS = 'noindex,follow';
const TOOL_ROUTE_EXCLUSIONS = new Set([
  '/',
  '/pdf-tools',
  '/image-tools',
  '/image-workflows',
  '/ai-tools',
  '/blog',
  '/support',
  '/privacy',
  '/terms',
]);
const CATEGORY_HUBS = {
  'organize-manage': { route: '/pdf-tools', label: 'PDF Tools' },
  'edit-annotate': { route: '/pdf-tools', label: 'PDF Tools' },
  'convert-to-pdf': { route: '/pdf-tools', label: 'PDF Tools' },
  'convert-from-pdf': { route: '/pdf-tools', label: 'PDF Tools' },
  'optimize-repair': { route: '/pdf-tools', label: 'PDF Tools' },
  'secure-pdf': { route: '/pdf-tools', label: 'PDF Tools' },
  'image-tools': { route: '/image-tools', label: 'Image Tools' },
  'ai-tools': { route: '/ai-tools', label: 'AI Image Tools' },
  workflows: { route: '/image-workflows', label: 'Image Workflows' },
};
const PDF_CATEGORIES = new Set([
  'organize-manage',
  'edit-annotate',
  'convert-to-pdf',
  'convert-from-pdf',
  'optimize-repair',
  'secure-pdf',
]);
const IMAGE_CATEGORIES = new Set(['image-tools', 'workflows', 'ai-tools']);
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
  const staticSeo = `<div id="root">${buildStaticRouteContent(route)}</div>`;

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
    .replace('<div id="root"></div>', staticSeo);

  if (/<body>\s*<div id="root">[\s\S]*<\/div>\s*<noscript>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(
      /<body>\s*<div id="root">[\s\S]*<\/div>\s*<noscript>/i,
      `<body>\n  ${staticSeo}\n  <noscript>`,
    );
  } else if (/<div id="root">\s*<div data-static-seo="true" class="static-seo">[\s\S]*?<\/div>\s*<\/div>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(
      /<div id="root">\s*<div data-static-seo="true" class="static-seo">[\s\S]*?<\/div>\s*<\/div>/i,
      staticSeo,
    );
  }

  nextHtml = nextHtml
    .replace(/\n?<link\s+rel="modulepreload"[^>]*>/gi, '')
    .replace(/\n?<script\s+id="(?:page-schema|faq-schema)"\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

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

function routeEntry(route) {
  return getRouteSeoEntries().find((entry) => entry.route === route);
}

function isToolRoute(route) {
  return !TOOL_ROUTE_EXCLUSIONS.has(route) && !route.startsWith('/blog/');
}

function categoryHubForRoute(route) {
  return CATEGORY_HUBS[routeEntry(route)?.category];
}

function routeLabel(route) {
  const seo = getRouteSeo(route);
  return seo.h1 ?? stripBrand(seo.title);
}

function linkList(routes, limit = 5) {
  return routes
    .filter((route) => ROUTES.includes(route))
    .slice(0, limit)
    .map((route) => `<li><a href="${canonicalUrlForRoute(route)}">${escapeHtml(routeLabel(route))}</a></li>`)
    .join('');
}

function relatedRoutesFor(route) {
  const seo = getRouteSeo(route);
  const hub = categoryHubForRoute(route)?.route;
  return [...new Set([hub, ...(seo.relatedTools ?? [])])]
    .filter(Boolean)
    .filter((relatedRoute) => relatedRoute !== route && ROUTES.includes(relatedRoute))
    .slice(0, 5);
}

function getFaqItems(route) {
  if (!isToolRoute(route)) return [];

  const seo = getRouteSeo(route);
  const content = toolContent[route];
  const title = routeLabel(route);
  const action = content?.action ?? seo.h1 ?? title.toLowerCase();
  const category = routeEntry(route)?.category ?? '';
  const isImageTool = IMAGE_CATEGORIES.has(category);
  const fileNoun = isImageTool ? 'images' : 'PDF files';

  return [
    {
      question: `Is it safe to ${action} online?`,
      answer: `${title} runs in your browser, so your ${fileNoun} stay on your device instead of being uploaded to FilePilot servers. That makes it suitable for private documents, work files, personal photos, and other sensitive material.`,
    },
    {
      question: `Are my files uploaded when I use ${title}?`,
      answer: `No. The tool uses local browser APIs and client-side libraries to process the file in memory. Closing the tab clears the working state from the browser session.`,
    },
    {
      question: `Does ${title} reduce quality?`,
      answer: category === 'optimize-repair' || route.includes('compress')
        ? `${title} is designed to reduce file size while keeping output usable. Where quality settings are available, choose a higher quality level for print or archive copies.`
        : `${title} preserves the original content wherever the operation allows it. Conversion and resizing tools may expose quality or size controls so you can choose the best output for your use case.`,
    },
    {
      question: `Can I use ${title} without installing software?`,
      answer: `Yes. FilePilot is a web app, so you can open the tool in a modern browser, complete the job, and download the result without installing a desktop PDF or image editor.`,
    },
  ];
}

function buildFaqSchema(route) {
  const faqItems = getFaqItems(route);
  if (!faqItems.length) return null;

  return {
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function howToStepName(text) {
  const clean = text.replace(/\s+/g, ' ').trim().replace(/[.。]$/, '');
  const commaIdx = clean.indexOf(',');
  let name = commaIdx > 10 && commaIdx < 60 ? clean.slice(0, commaIdx) : clean;
  if (name.length > 60) {
    name = name.slice(0, 60);
    const lastSpace = name.lastIndexOf(' ');
    if (lastSpace > 20) name = name.slice(0, lastSpace);
  }
  return name;
}

function buildHowToSchema(route) {
  if (!isToolRoute(route)) return null;

  const steps = toolSteps(route);
  if (!steps.length) return null;

  const seo = getRouteSeo(route);
  const title = routeLabel(route);
  const content = toolContent[route];
  const action = content?.action ?? seo.h1 ?? title.toLowerCase();
  const url = canonicalUrlForRoute(route);

  return {
    '@type': 'HowTo',
    name: `How to ${action} with FilePilot`,
    description: `Step-by-step guide to ${action} privately in your browser using ${title}. Processing runs locally on your device with no file uploads.`,
    inLanguage: 'en',
    tool: { '@type': 'HowToTool', name: title },
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: howToStepName(step),
      text: step,
      url: `${url}#step-${index + 1}`,
    })),
  };
}

function toolIntro(route) {
  const seo = getRouteSeo(route);
  const entry = routeEntry(route);
  const content = toolContent[route];
  const title = routeLabel(route);
  const hub = categoryHubForRoute(route);
  const relatedLabels = relatedRoutesFor(route).map(routeLabel).filter((label) => label !== title).slice(0, 3);
  const useCases = content?.useCases?.slice(0, 4) ?? [];
  const baseIntro = content?.intro ?? `${title} helps you ${seo.description.replace(/\.$/, '').toLowerCase()} from a browser tab.`;
  const categoryText = hub
    ? `${title} sits in FilePilot's ${hub.label.toLowerCase()} collection, so it is easy to move between this task and nearby tools such as ${relatedLabels.join(', ') || 'related conversion and editing tools'}.`
    : `${title} is part of FilePilot's privacy-first browser toolkit.`;
  const useCaseText = useCases.length
    ? `It is useful when you need to ${useCases.map((item) => item.replace(/\.$/, '').toLowerCase()).join('; ')}.`
    : `It is useful for preparing files for email, archiving, review, printing, publishing, or sharing without routing the original through a remote upload queue.`;
  const privacyText = `The work happens locally in your browser using client-side processing, which keeps your files on your device and gives crawlers a clear plain-text description of what this page does before the interactive app loads.`;
  const workflowText = content?.steps?.length
    ? `The workflow is straightforward: ${content.steps.map((step) => step.replace(/\.$/, '').toLowerCase()).join('; ')}.`
    : `Choose your file, review the available settings, preview the result where the tool supports it, and download the finished file when you are ready.`;

  return [baseIntro, categoryText, useCaseText, workflowText, privacyText]
    .filter(Boolean)
    .join(' ');
}

function toolSteps(route) {
  const content = toolContent[route];
  if (content?.steps?.length) return content.steps.slice(0, 5);

  const title = routeLabel(route);
  return [
    `Choose the file or files you want to use with ${title}.`,
    'Adjust the available settings for page order, quality, size, format, or output options.',
    'Preview the result where available and make any final changes.',
    'Download the finished file from your browser.',
  ];
}

function toolUseCases(route) {
  return toolContent[route]?.useCases?.slice(0, 5) ?? [
    'Prepare files for email, upload forms, print workflows, or internal review.',
    'Clean up documents before sharing them with clients, colleagues, or family.',
    'Convert, organize, or optimize files without installing a separate desktop app.',
  ];
}

function faqList(route) {
  return getFaqItems(route)
    .map((item) => `<li><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.answer)}</p></li>`)
    .join('');
}

function orderedList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function stepsList(items) {
  return items
    .map((item, index) => `<li id="step-${index + 1}">${escapeHtml(item)}</li>`)
    .join('');
}

function categoryToolRoutesForHub(route) {
  const entries = getRouteSeoEntries().filter((entry) => entry.category);
  if (route === '/pdf-tools') return entries.filter((entry) => PDF_CATEGORIES.has(entry.category)).map((entry) => entry.route);
  if (route === '/image-tools') return entries.filter((entry) => IMAGE_CATEGORIES.has(entry.category)).map((entry) => entry.route);
  if (route === '/image-workflows') return entries.filter((entry) => entry.category === 'workflows').map((entry) => entry.route);
  if (route === '/ai-tools') return entries.filter((entry) => entry.category === 'ai-tools').map((entry) => entry.route);
  return [];
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
        alternateName: 'FilePilot File Tools',
        url,
        logo: 'https://www.filepilot.space/filepilot_logo.svg',
        description: 'FilePilot is a free, privacy-first web app offering browser-based PDF, image, and file tools that process files locally on your device without uploads.',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${url}#app`,
        name: 'FilePilot',
        url,
        description: seo.description,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web',
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
  } else if (route === '/support') {
    graph.push(
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'FilePilot', item: canonicalUrlForRoute('/') },
          { '@type': 'ListItem', position: 2, name: routeLabel(route), item: url },
        ],
      },
      {
        '@type': 'WebPage',
        name: routeLabel(route),
        url,
        description: seo.description,
        isPartOf: { '@id': `${SITE_URL}#website` },
      },
    );
  } else if (isToolRoute(route)) {
    const entry = getRouteSeoEntries().find((e) => e.route === route);
    const category = entry?.category;
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
        '@type': 'SoftwareApplication',
        name: routeLabel(route),
        url,
        description: seo.description,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    );
  }

  const faqSchema = buildFaqSchema(route);
  if (faqSchema) graph.push(faqSchema);

  const howToSchema = buildHowToSchema(route);
  if (howToSchema) graph.push(howToSchema);

  if (graph.length === 0) return '';

  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

function buildStaticRouteContent(route) {
  const seo = getRouteSeo(route);
  const title = escapeHtml(routeLabel(route));
  const description = escapeHtml(seo.shortIntro ?? seo.description);
  const relatedRoutes = relatedRoutesFor(route).length ? relatedRoutesFor(route) : (route === '/'
    ? ['/pdf-tools', '/image-tools', '/merge', '/split', '/compress']
    : route === '/pdf-tools'
      ? ['/merge', '/split', '/compress', '/pdf-to-jpg', '/jpg-to-pdf']
      : route === '/image-tools'
        ? ['/compress-image', '/resize-image', '/convert-image', '/crop-image', '/image-formatter']
        : route.startsWith('/blog')
          ? ['/blog', '/privacy', '/pdf-tools', '/image-tools']
          : ['/merge', '/split', '/compress', '/pdf-to-jpg', '/jpg-to-pdf']);

  const categoryToolRoutes = categoryToolRoutesForHub(route);
  const body = isToolRoute(route)
    ? `
      <nav aria-label="Breadcrumb"><a href="${canonicalUrlForRoute('/')}">FilePilot</a>${categoryHubForRoute(route) ? ` / <a href="${canonicalUrlForRoute(categoryHubForRoute(route).route)}">${escapeHtml(categoryHubForRoute(route).label)}</a>` : ''} / <span>${title}</span></nav>
      <h1>${title}</h1>
      <p>${escapeHtml(toolIntro(route))}</p>
      <section>
        <h2>How it works</h2>
        <ol>${stepsList(toolSteps(route))}</ol>
      </section>
      <section>
        <h2>Frequently asked questions</h2>
        <ul>${faqList(route)}</ul>
      </section>
      <section>
        <h2>Common uses</h2>
        <ul>${orderedList(toolUseCases(route))}</ul>
      </section>
      <section>
        <h2>Related tools</h2>
        <ul>${linkList(relatedRoutes)}</ul>
      </section>
    `
    : categoryToolRoutes.length
      ? `
      <nav aria-label="Breadcrumb"><a href="${canonicalUrlForRoute('/')}">FilePilot</a> / <span>${title}</span></nav>
      <h1>${title}</h1>
      <p>${description}</p>
      <section>
        <h2>All tools in this category</h2>
        <ul>${linkList(categoryToolRoutes, categoryToolRoutes.length)}</ul>
      </section>
      <section>
        <h2>Explore FilePilot</h2>
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

  return `<div data-static-seo="true" class="static-seo">${body}</div>`;
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
    const requestPath = decodeURIComponent(new URL(req.url ?? '/', `http://localhost:${PORT}`).pathname);
    const candidates = requestPath === '/'
      ? [join(DIST, 'index.html')]
      : [
          join(DIST, requestPath),
          join(DIST, requestPath, 'index.html'),
          join(DIST, 'index.html'),
        ];
    const filePath = candidates.find((candidate) => existsSync(candidate) && extname(candidate)) ?? join(DIST, 'index.html');
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
