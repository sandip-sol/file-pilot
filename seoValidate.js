import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CANONICAL_HOST,
  PRIORITY_SEO_ROUTES,
  SITE_URL,
  canonicalUrlForRoute,
  getNonIndexableRouteEntries,
  getRouteSeo,
  getSeoRoutes,
} from './seoRoutes.js';

const DIST_DIR = new URL('./dist/', import.meta.url);
const PUBLIC_DIR = new URL('./public/', import.meta.url);
const sitemapPath = existsSync(new URL('./sitemap.xml', DIST_DIR))
  ? new URL('./sitemap.xml', DIST_DIR)
  : new URL('./sitemap.xml', PUBLIC_DIR);
const robotsPath = existsSync(new URL('./robots.txt', DIST_DIR))
  ? new URL('./robots.txt', DIST_DIR)
  : new URL('./robots.txt', PUBLIC_DIR);
const redirectsPath = new URL('./_redirects', PUBLIC_DIR);
const errors = [];
const warnings = [];

const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

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

function validateFilesExist() {
  if (!existsSync(robotsPath)) fail('robots.txt does not exist in public/ or dist/.');
  if (!existsSync(sitemapPath)) fail('sitemap.xml does not exist in public/ or dist/.');
  if (!existsSync(new URL('./index.html', DIST_DIR))) fail('dist/index.html does not exist. Run npm run build before seo:validate.');
  if (!existsSync(new URL('./404.html', DIST_DIR))) fail('dist/404.html does not exist.');
}

function validateRobots() {
  if (!existsSync(robotsPath)) return;
  const robots = readText(robotsPath);
  if (!robots.includes(`Sitemap: ${new URL('/sitemap.xml', SITE_URL).toString()}`)) {
    fail('robots.txt does not point to the canonical sitemap URL.');
  }
  if (/Disallow:\s*\/\s*$/im.test(robots)) {
    fail('robots.txt blocks the entire production site.');
  }
}

function loadSitemapUrls() {
  if (!existsSync(sitemapPath)) return [];
  const sitemap = readText(sitemapPath);
  return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
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

function validateSitemap() {
  const urls = loadSitemapUrls();
  const indexableRoutes = new Set(getSeoRoutes());
  const nonIndexableRoutes = new Set(getNonIndexableRouteEntries().map((entry) => entry.route));
  const redirectSources = loadRedirectSources();

  if (urls.length === 0) fail('sitemap.xml has no <loc> URLs.');

  for (const url of urls) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      fail(`Invalid sitemap URL: ${url}`);
      continue;
    }

    if (parsed.protocol !== 'https:') fail(`Sitemap URL is not HTTPS: ${url}`);
    if (parsed.hostname !== CANONICAL_HOST) fail(`Sitemap URL uses a non-canonical host: ${url}`);
    if (parsed.search || parsed.hash) fail(`Sitemap URL includes query/hash data: ${url}`);
    if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) fail(`Sitemap URL does not use trailing slash canonical form: ${url}`);

    const route = routeFromCanonicalUrl(url);
    if (!route) {
      fail(`Sitemap URL is outside the canonical origin: ${url}`);
      continue;
    }

    if (!indexableRoutes.has(route)) fail(`Sitemap includes a route missing from the indexable registry: ${route}`);
    if (nonIndexableRoutes.has(route)) fail(`Sitemap includes a noindex route: ${route}`);
    if (redirectSources.has(route)) fail(`Sitemap includes a redirect source route: ${route}`);
    if (canonicalUrlForRoute(route) !== url) fail(`Sitemap URL is not canonical for ${route}: ${url}`);
  }
}

function validateRouteHtml(route) {
  const path = getHtmlPath(route);
  if (!existsSync(path)) {
    fail(`Missing prerendered HTML for ${route}: ${path}`);
    return;
  }

  const html = readFileSync(path, 'utf8');
  const seo = getRouteSeo(route);
  const canonical = canonicalUrlForRoute(route);
  const title = decodeHtml(html.match(/<title>([^<]+)<\/title>/i)?.[1]);
  const description = decodeHtml(getMetaContent(html, 'name=description'));
  const robots = getMetaContent(html, 'name=robots');
  const ogUrl = getMetaContent(html, 'property=og:url');
  const ogTitle = decodeHtml(getMetaContent(html, 'property=og:title'));
  const twitterTitle = decodeHtml(getMetaContent(html, 'name=twitter:title'));
  const canonicalTag = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];

  if (!title || title !== seo.title) fail(`${route} has missing or incorrect <title>.`);
  if (!description || description !== seo.description) fail(`${route} has missing or incorrect meta description.`);
  if (canonicalTag !== canonical) fail(`${route} has missing or incorrect canonical tag.`);
  if (robots !== 'index,follow') fail(`${route} does not declare index,follow.`);
  if (ogUrl !== canonical) fail(`${route} has missing or incorrect og:url.`);
  if (!ogTitle) fail(`${route} has no Open Graph title.`);
  if (!twitterTitle) fail(`${route} has no Twitter title.`);
  if (!/<h1[\s>]/i.test(html)) fail(`${route} initial HTML has no H1.`);
  if (/<meta\s+name="robots"\s+content="noindex/i.test(html)) fail(`${route} initial HTML contains noindex.`);
}

function validateMetadata() {
  for (const route of getSeoRoutes()) validateRouteHtml(route);
  for (const route of PRIORITY_SEO_ROUTES) validateRouteHtml(route);
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
validateMetadata();
validate404();

for (const warning of warnings) console.warn(`Warning: ${warning}`);

if (errors.length > 0) {
  console.error(`SEO validation failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`SEO validation passed for ${getSeoRoutes().length} indexable routes.`);
