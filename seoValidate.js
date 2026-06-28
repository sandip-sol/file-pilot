import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CANONICAL_HOST,
  SITEMAP_ROUTES,
  SITE_URL,
  canonicalUrlForRoute,
  getNonIndexableRouteEntries,
  getRouteSeo,
  getSitemapEntries,
} from './seoRoutes.js';

const DIST_DIR = new URL('./dist/', import.meta.url);
const sitemapPath = new URL('./sitemap.xml', DIST_DIR);
const robotsPath = new URL('./robots.txt', DIST_DIR);
const redirectsPath = new URL('./_redirects', DIST_DIR);
const errors = [];

const EXPECTED_ROBOTS = `User-agent: *
Allow: /

Sitemap: https://www.filepilot.space/sitemap.xml
`;

const fail = (message) => errors.push(message);
const readText = (url) => readFileSync(url, 'utf8');

function routeFromCanonicalUrl(value) {
  const parsed = new URL(value);
  if (parsed.origin !== new URL(SITE_URL).origin) return null;
  const pathname = parsed.pathname.replace(/\/+$/, '');
  return pathname === '' ? '/' : pathname;
}

function getHtmlPath(route) {
  return route === '/'
    ? join(DIST_DIR.pathname, 'index.html')
    : join(DIST_DIR.pathname, route.slice(1), 'index.html');
}

function getMetaContent(html, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = selector.startsWith('property=')
    ? new RegExp(`<meta\\s+property="${escapedSelector.slice(9)}"\\s+content="([^"]+)"`, 'i')
    : new RegExp(`<meta\\s+name="${escapedSelector.slice(5)}"\\s+content="([^"]+)"`, 'i');
  return html.match(pattern)?.[1];
}

function decodeHtml(value) {
  if (!value) return value;
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function loadRedirectSources() {
  if (!existsSync(redirectsPath)) return new Set();
  const redirects = readText(redirectsPath);
  return new Set(
    redirects
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split(/\s+/)[0])
      .filter((source) => source.startsWith('/'))
      .map((source) => source.replace(/\/+$/, '') || '/'),
  );
}

function validateFilesExist() {
  if (!existsSync(new URL('./index.html', DIST_DIR))) {
    fail('dist/index.html does not exist. Run npm run build before npm run seo:validate.');
  }
  if (!existsSync(sitemapPath)) fail('dist/sitemap.xml does not exist in the final publish directory.');
  if (!existsSync(robotsPath)) fail('dist/robots.txt does not exist in the final publish directory.');
  if (!existsSync(redirectsPath)) fail('dist/_redirects does not exist in the final publish directory.');
  if (!existsSync(new URL('./404.html', DIST_DIR))) fail('dist/404.html does not exist.');
}

function validateRobots() {
  if (!existsSync(robotsPath)) return;
  const robots = readText(robotsPath);
  if (robots !== EXPECTED_ROBOTS) {
    fail('dist/robots.txt does not match the required crawler policy exactly.');
  }
  if (/Disallow:\s*\/\s*$/im.test(robots)) {
    fail('dist/robots.txt blocks the entire site.');
  }
}

function loadSitemapUrls() {
  if (!existsSync(sitemapPath)) return [];
  const sitemap = readText(sitemapPath);

  if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    fail('dist/sitemap.xml must begin with the XML declaration followed by <urlset>.');
  }
  if (/<\/?html[\s>]/i.test(sitemap) || /<!doctype\s+html/i.test(sitemap)) {
    fail('dist/sitemap.xml contains HTML markup.');
  }
  if (/<script[\s>]/i.test(sitemap) || /<div\s+id=["']root["']/i.test(sitemap) || /data-static-seo/i.test(sitemap)) {
    fail('dist/sitemap.xml appears to contain app-shell content instead of XML.');
  }
  if (/FilePilot - Free Private PDF, Image and File Tools/i.test(sitemap)) {
    fail('dist/sitemap.xml appears to contain homepage HTML content.');
  }

  return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
}

function validateSitemap() {
  const urls = loadSitemapUrls();
  const expectedUrls = getSitemapEntries().map((entry) => entry.loc);
  const expectedUrlSet = new Set(expectedUrls);
  const nonIndexableRoutes = new Set(getNonIndexableRouteEntries().map((entry) => entry.route));
  const redirectSources = loadRedirectSources();
  const seenUrls = new Set();

  if (urls.length === 0) fail('dist/sitemap.xml has no <loc> URLs.');
  if (urls.length !== expectedUrls.length) {
    fail(`dist/sitemap.xml has ${urls.length} URLs, expected ${expectedUrls.length}.`);
  }

  for (const expectedUrl of expectedUrls) {
    if (!urls.includes(expectedUrl)) fail(`dist/sitemap.xml is missing expected URL: ${expectedUrl}`);
  }

  for (const url of urls) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      fail(`Invalid sitemap URL: ${url}`);
      continue;
    }

    if (seenUrls.has(url)) fail(`Duplicate sitemap URL: ${url}`);
    seenUrls.add(url);

    if (!url.startsWith(SITE_URL)) fail(`Sitemap URL must begin with ${SITE_URL}: ${url}`);
    if (parsed.protocol !== 'https:') fail(`Sitemap URL is not HTTPS: ${url}`);
    if (parsed.hostname !== CANONICAL_HOST) fail(`Sitemap URL uses a non-canonical host: ${url}`);
    if (parsed.search || parsed.hash) fail(`Sitemap URL includes query/hash data: ${url}`);
    if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) fail(`Sitemap URL does not use trailing slash canonical form: ${url}`);
    if (!expectedUrlSet.has(url)) fail(`Sitemap includes a URL outside the curated sitemap registry: ${url}`);

    const route = routeFromCanonicalUrl(url);
    if (!route) {
      fail(`Sitemap URL is outside the canonical origin: ${url}`);
      continue;
    }

    if (!SITEMAP_ROUTES.includes(route)) fail(`Sitemap includes a route outside SITEMAP_ROUTES: ${route}`);
    if (nonIndexableRoutes.has(route)) fail(`Sitemap includes a noindex route: ${route}`);
    if (redirectSources.has(route)) fail(`Sitemap includes a redirect source route: ${route}`);
    if (canonicalUrlForRoute(route) !== url) fail(`Sitemap URL is not canonical for ${route}: ${url}`);
  }
}

function validateRedirects() {
  if (!existsSync(redirectsPath)) return;
  const redirects = readText(redirectsPath);
  const activeLines = redirects
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  for (const line of activeLines) {
    const [source, target, status] = line.split(/\s+/);
    if (source === '/*' && target === '/index.html' && status === '200') {
      fail('dist/_redirects contains a catch-all SPA rewrite that can intercept crawler files.');
    }
    if (['/sitemap.xml', '/robots.txt', '/favicon.svg', '/site.webmanifest'].includes(source)) {
      fail(`dist/_redirects contains an unnecessary static-file redirect for ${source}.`);
    }
  }
}

function validateRouteHtml(route) {
  const path = getHtmlPath(route);
  if (!existsSync(path)) {
    fail(`Missing prerendered HTML for sitemap route ${route}: ${path}`);
    return;
  }

  const html = readFileSync(path, 'utf8');
  const seo = getRouteSeo(route);
  const canonical = canonicalUrlForRoute(route);
  const title = decodeHtml(html.match(/<title>([^<]+)<\/title>/i)?.[1]);
  const description = decodeHtml(getMetaContent(html, 'name=description'));
  const robots = getMetaContent(html, 'name=robots');
  const ogUrl = getMetaContent(html, 'property=og:url');
  const canonicalTag = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];

  if (!title || title !== seo.title) fail(`${route} has missing or incorrect <title>.`);
  if (!description || description !== seo.description) fail(`${route} has missing or incorrect meta description.`);
  if (canonicalTag !== canonical) fail(`${route} has missing or incorrect canonical tag.`);
  if (robots !== 'index,follow') fail(`${route} does not declare index,follow.`);
  if (ogUrl !== canonical) fail(`${route} has missing or incorrect og:url.`);
  if (!/<h1[\s>]/i.test(html)) fail(`${route} initial HTML has no H1.`);
  if (/<meta\s+name="robots"\s+content="noindex/i.test(html)) fail(`${route} initial HTML contains noindex.`);
}

function validateSitemapRouteHtml() {
  for (const route of SITEMAP_ROUTES) validateRouteHtml(route);
}

function validate404() {
  const htmlPath = new URL('./404.html', DIST_DIR);
  if (!existsSync(htmlPath)) return;
  const html = readText(htmlPath);
  if (!/<meta\s+name="robots"\s+content="noindex,follow"/i.test(html)) {
    fail('dist/404.html must include noindex,follow.');
  }
}

validateFilesExist();
validateRobots();
validateSitemap();
validateRedirects();
validateSitemapRouteHtml();
validate404();

if (errors.length > 0) {
  console.error(`SEO validation failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`SEO validation passed for ${getSitemapEntries().length} sitemap URLs in dist/sitemap.xml.`);
