import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { MIN_ORGANIZATION_PROFILES, ORGANIZATION_PROFILES, maintainer } from './src/data/aboutContent.ts';
import { PILLAR_ROUTE, blogPosts } from './src/data/blogContent.ts';
import {
  CANONICAL_HOST,
  SITE_URL,
  canonicalUrlForRoute,
  getNonIndexableRouteEntries,
  getRouteSeo,
  getRouteSeoEntries,
  getSeoRoutes,
  getSitemapEntries,
  isToolRoute,
} from './seoRoutes.js';

const DIST_DIR = new URL('./dist/', import.meta.url);
const sitemapPath = new URL('./sitemap.xml', DIST_DIR);
const robotsPath = new URL('./robots.txt', DIST_DIR);
const redirectsPath = new URL('./_redirects', DIST_DIR);
const errors = [];
const warnings = [];

const EXPECTED_ROBOTS = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
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

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stripBrand(value) {
  return value
    .replace(/\s+\|\s+FilePilot.*$/i, '')
    .replace(/\s+-\s+FilePilot.*$/i, '')
    .trim();
}

function routeLabel(route) {
  const seo = getRouteSeo(route);
  return seo.h1 ?? stripBrand(seo.title);
}

function staticSeoBlock(html) {
  return html.match(/<div data-static-seo="true" class="static-seo">([\s\S]*?)<\/div>\s*<\/div>/i)?.[1] ?? '';
}

function htmlContainsText(html, text) {
  return html.includes(text) || html.includes(escapeHtml(text));
}

function routeFromPathname(pathname) {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized === '' ? '/' : normalized;
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

    if (!getSeoRoutes().includes(route)) fail(`Sitemap includes a route outside getSeoRoutes(): ${route}`);
    if (nonIndexableRoutes.has(route)) fail(`Sitemap includes a noindex route: ${route}`);
    if (redirectSources.has(route)) fail(`Sitemap includes a redirect source route: ${route}`);
    if (canonicalUrlForRoute(route) !== url) fail(`Sitemap URL is not canonical for ${route}: ${url}`);
  }
}

function validateNoScriptLinks(html, route) {
  const noscriptBlocks = [...html.matchAll(/<noscript\b[^>]*>([\s\S]*?)<\/noscript>/gi)].map((match) => match[1]);
  if (!noscriptBlocks.length) return;

  const seoRoutes = new Set(getSeoRoutes());
  const redirectSources = loadRedirectSources();
  const nonIndexableRoutes = new Set(getNonIndexableRouteEntries().map((entry) => entry.route));
  const canonicalOrigin = new URL(SITE_URL).origin;

  for (const block of noscriptBlocks) {
    const hrefs = [...block.matchAll(/href="([^"]+)"/gi)].map((match) => match[1]);

    for (const href of hrefs) {
      if (href.startsWith('/')) {
        const linkedRoute = routeFromPathname(href.split(/[?#]/, 1)[0]);
        if (seoRoutes.has(linkedRoute) || redirectSources.has(linkedRoute) || nonIndexableRoutes.has(linkedRoute)) {
          fail(`${route} noscript links to non-canonical relative app route: ${href}`);
        }
        continue;
      }

      let parsed;
      try {
        parsed = new URL(href);
      } catch {
        continue;
      }

      if (parsed.origin !== canonicalOrigin) continue;

      const linkedRoute = routeFromPathname(parsed.pathname);
      if (redirectSources.has(linkedRoute)) {
        fail(`${route} noscript links to redirect source route: ${href}`);
      }
      if (nonIndexableRoutes.has(linkedRoute)) {
        fail(`${route} noscript links to non-indexable route: ${href}`);
      }
      if (seoRoutes.has(linkedRoute) && href !== canonicalUrlForRoute(linkedRoute)) {
        fail(`${route} noscript links to non-canonical URL for ${linkedRoute}: ${href}`);
      }
    }
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
  validateNoScriptLinks(html, route);

  const staticBlock = staticSeoBlock(html);
  const label = routeLabel(route);
  if (!staticBlock) fail(`${route} initial HTML is missing the static SEO body block.`);
  if (route !== '/' && /<h1>FilePilot<\/h1>/i.test(staticBlock)) {
    fail(`${route} static SEO body contains the homepage H1 instead of route-specific content.`);
  }
  if (route !== '/' && !htmlContainsText(staticBlock || html, label)) {
    fail(`${route} static SEO body does not include the route label "${label}".`);
  }
  if (isToolRoute(route)) {
    // Tool app nodes are multi-typed ["SoftwareApplication","WebApplication"],
    // so match SoftwareApplication in either the string or the array form.
    if (!/"@type":(?:"SoftwareApplication"|\[[^\]]*"SoftwareApplication"[^\]]*\])/.test(html)) fail(`${route} schema must include SoftwareApplication.`);
    if (!/"operatingSystem":"Web[^"]*"/.test(html)) fail(`${route} schema must declare a Web operatingSystem.`);
    if (!/"@type":"FAQPage"/.test(html)) fail(`${route} schema must include FAQPage.`);
    if (!/"@type":"HowTo"/.test(html)) fail(`${route} schema must include HowTo.`);
    if (!/Frequently asked questions/i.test(staticBlock)) fail(`${route} static SEO body must include visible FAQ text.`);
    if (!/Related tools/i.test(staticBlock)) fail(`${route} static SEO body must include related tool links.`);
  }
  if (['/pdf-tools', '/image-tools', '/image-workflows', '/ai-tools'].includes(route)) {
    const categoryLinks = getRouteSeoEntries().filter((entry) => {
      if (!entry.category) return false;
      if (route === '/pdf-tools') return ['organize-manage', 'edit-annotate', 'convert-to-pdf', 'convert-from-pdf', 'optimize-repair', 'secure-pdf'].includes(entry.category);
      if (route === '/image-tools') return ['image-tools', 'workflows', 'ai-tools'].includes(entry.category);
      if (route === '/image-workflows') return entry.category === 'workflows';
      if (route === '/ai-tools') return entry.category === 'ai-tools';
      return false;
    });
    for (const entry of categoryLinks) {
      if (!staticBlock.includes(canonicalUrlForRoute(entry.route))) {
        fail(`${route} static SEO hub is missing category link for ${entry.route}.`);
      }
    }
  }
}

function validateSitemapRouteHtml() {
  for (const route of getSeoRoutes()) validateRouteHtml(route);
}

function validate404() {
  const htmlPath = new URL('./404.html', DIST_DIR);
  if (!existsSync(htmlPath)) return;
  const html = readText(htmlPath);
  if (!/<meta\s+name="robots"\s+content="noindex,follow"/i.test(html)) {
    fail('dist/404.html must include noindex,follow.');
  }
}


/**
 * Static guard against client/prerender SEO drift.
 *
 * The prerendered <title> is validated against seoRoutes above, but Google
 * renders JavaScript, so whatever <PageSeo> sets at runtime is what actually
 * gets indexed. When a routed page passes its own literal title instead of
 * reading the shared data, the two silently disagree and the prerendered copy
 * is wasted — that is exactly what had happened to the homepage, both tool
 * hubs, /privacy, /terms and all three blog posts.
 *
 * Every routed page must therefore spread toolSeo()/siteSeo() into PageSeo.
 */
function validateNoInlinePageSeo() {
  const appSource = readFileSync(new URL('./src/App.tsx', import.meta.url), 'utf8');
  const routedComponents = new Set(
    [...appSource.matchAll(/element=\{<([A-Za-z0-9_]+)\s*\/?>/g)].map(([, name]) => name),
  );

  const tsxIn = (dir) => {
    if (!existsSync(new URL(`./${dir}/`, import.meta.url))) return [];
    return readdirSync(new URL(`./${dir}/`, import.meta.url))
      .filter((name) => name.endsWith('.tsx'))
      .map((name) => `${dir}/${name}`);
  };
  const pageFiles = [...tsxIn('src/pages'), ...tsxIn('src/pages/blog')];

  // /404 has no sitemap route, so it has no shared SEO entry to read from.
  const EXEMPT = new Set(['src/pages/NotFound.tsx']);

  for (const file of pageFiles) {
    if (EXEMPT.has(file)) continue;
    const source = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
    const exported = [...source.matchAll(/export const ([A-Za-z0-9_]+)\s*[=:]/g)].map(([, name]) => name);
    if (!exported.some((name) => routedComponents.has(name))) continue; // unrouted/dead component

    for (const [match] of source.matchAll(/<PageSeo\b[^>]*?\/>/gs)) {
      if (/\btitle\s*=\s*["'{]/.test(match) && !/\{\s*\.\.\.(toolSeo|siteSeo)\(/.test(match)) {
        fail(`${file} passes a literal title to <PageSeo>. Use {...toolSeo(route)} or {...siteSeo(route)} so the client and the prerenderer cannot drift.`);
      }
    }
  }
}


/**
 * Every route the app serves must resolve for a crawler hitting it cold.
 *
 * `/image-requirements` did not: it was routed in App.tsx, linked from
 * RelatedTools, and given sitemap priority 0.9 in seoRoutes.js — but it was
 * never added to the tool registry, so no static HTML was written and no
 * redirect covered it. In-app navigation worked (react-router handled it
 * client-side) while every direct hit and every crawler got a hard 404. The
 * page was invisible for months without anything failing.
 *
 * A route is acceptable if it is in the sitemap, has a prerendered shell
 * (noindex variants do), or is a redirect source.
 */
function validateNoOrphanRoutes() {
  const appSource = readFileSync(new URL('./src/App.tsx', import.meta.url), 'utf8');
  const appRoutes = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map(([, path]) => path)
    .filter((path) => path !== '*');

  const sitemapRoutes = new Set(getSeoRoutes());
  const redirectSources = loadRedirectSources();

  for (const route of appRoutes) {
    if (sitemapRoutes.has(route)) continue;
    if (redirectSources.has(route)) continue;
    if (existsSync(getHtmlPath(route))) continue;
    fail(`${route} is routed in App.tsx but has no prerendered HTML, no sitemap entry and no redirect — a direct hit or a crawler gets a 404.`);
  }
}


/**
 * Internal links are how authority moves between pages, so the "Related tools"
 * block on each tool page has to point at genuine topical siblings.
 *
 * 61 of 84 tool pages used to fall back to a flat list of `/pdf-tools`,
 * `/image-tools`, `/merge`, `/compress` and `/compress-image` — funnelling the
 * whole site's internal link equity into five head-term pages it cannot win,
 * while the long-tail pages that *are* winnable got no topical context at all.
 */
function validateRelatedToolLinks() {
  const HEAD_TERM_ROUTES = new Set(['/pdf-tools', '/image-tools', '/merge', '/compress', '/compress-image']);
  const indexableRoutes = new Set(getSeoRoutes());

  for (const entry of getRouteSeoEntries()) {
    if (!isToolRoute(entry.route)) continue;

    const related = entry.relatedTools ?? [];
    if (related.length < 3) {
      fail(`${entry.route} has only ${related.length} related-tool links; expected at least 3.`);
      continue;
    }
    if (related.every((route) => HEAD_TERM_ROUTES.has(route))) {
      fail(`${entry.route} links only to head-term pages (${related.join(', ')}) instead of topical siblings.`);
    }
    for (const route of related) {
      if (route === entry.route) fail(`${entry.route} lists itself as a related tool.`);
      else if (!indexableRoutes.has(route)) {
        fail(`${entry.route} links to ${route}, which is not an indexable route.`);
      }
    }

    const staticBlock = staticSeoBlock(readFileSync(getHtmlPath(entry.route), 'utf8')) ?? '';
    for (const route of related.slice(0, 4)) {
      if (!staticBlock.includes(canonicalUrlForRoute(route))) {
        fail(`${entry.route} static SEO body is missing its related-tool link to ${route}.`);
      }
    }
  }
}


/**
 * A page in the sitemap that nothing links to is a page Google will discount.
 *
 * The Phase 1.3 comparison pages were exactly this risk: registered, built and
 * sitemapped, but reachable only by typing the URL. Sitemap inclusion is a hint;
 * internal links are the actual signal.
 */
function validateNoOrphanedFromLinks() {
  const linked = new Set();
  for (const route of getSeoRoutes()) {
    const html = readFileSync(getHtmlPath(route), 'utf8');
    const block = staticSeoBlock(html) ?? '';
    for (const [, href] of block.matchAll(/href="([^"]+)"/g)) linked.add(href);
  }

  for (const route of getSeoRoutes()) {
    if (route === '/') continue; // reachable as the site root
    if (!linked.has(canonicalUrlForRoute(route))) {
      fail(`${route} is in the sitemap but no other page's prerendered HTML links to it.`);
    }
  }
}

/**
 * Warning, not a failure: /about is useful without a named maintainer, but the
 * E-E-A-T signal Google actually weighs — a real person accountable for the site
 * — is missing until one is set. Deliberately never auto-filled: a fabricated
 * identity on an About page is worse than an absent one.
 */
function warnIfAnonymous() {
  if (maintainer) return;
  warnings.push(
    '/about has no maintainer configured, so it ships no Person schema and no named author. '
    + 'Google discounts anonymous utility sites, and the Phase 2.3 outreach template says "I maintain FilePilot" — '
    + 'a recipient who follows up finds nobody. Set `maintainer` in src/data/aboutContent.ts.',
  );
}


/**
 * Warning, not a failure: no amount of markup can manufacture corroboration.
 * `sameAs` is how Google triangulates that this domain is a distinct entity from
 * the File Pilot Windows file manager and the three positioning clones, and it
 * only works with URLs that exist. This cannot be fixed in code — it is outreach
 * — but it stays visible on every build so it is not quietly forgotten.
 */
function warnIfThinSameAs() {
  if (ORGANIZATION_PROFILES.length >= MIN_ORGANIZATION_PROFILES) return;
  warnings.push(
    `Organization sameAs has ${ORGANIZATION_PROFILES.length} `
    + `profile${ORGANIZATION_PROFILES.length === 1 ? '' : 's'}, below the ${MIN_ORGANIZATION_PROFILES} `
    + 'needed to disambiguate a colliding brand name. "FilePilot" resolves to the Windows file manager '
    + 'at filepilot.tech until more corroborating URLs exist. Each profile you create is also a backlink — '
    + 'add it to `ORGANIZATION_PROFILES` in src/data/aboutContent.ts.',
  );
}

/**
 * Cluster integrity and the anti-cannibalisation rule (Phase 3.1).
 *
 * A hub-and-spoke cluster only works if the links actually form one: the pillar
 * must reach every spoke and every spoke must point back, or it is just a pile
 * of posts. Separately, a post must never target the same keyword as a tool
 * page — `/pdf-to-cbz` already owns "pdf to cbz" with HowTo schema, and a post
 * competing for it would split the signal instead of adding to it.
 */
function validateBlogCluster() {
  const routes = Object.keys(blogPosts);
  const indexable = new Set(getSeoRoutes());

  const pillar = blogPosts[PILLAR_ROUTE];
  if (!pillar) {
    fail(`Blog cluster has no pillar: ${PILLAR_ROUTE} is not in blogContent.ts.`);
    return;
  }

  const pillarText = JSON.stringify(pillar);
  const toolTitles = new Map(
    getRouteSeoEntries()
      .filter((entry) => isToolRoute(entry.route))
      .map((entry) => [stripBrand(entry.title).toLowerCase().trim(), entry.route]),
  );

  for (const route of routes) {
    const post = blogPosts[route];

    if (!post.primaryTool) fail(`${route} has no primaryTool — every post must hand the reader to a tool.`);
    else if (!indexable.has(post.primaryTool)) fail(`${route} primaryTool ${post.primaryTool} is not an indexable route.`);

    // Cannibalisation: a post title must not duplicate a tool page's title.
    const clash = toolTitles.get(stripBrand(post.title).toLowerCase().trim());
    if (clash) fail(`${route} has the same title as the tool page ${clash} — they would compete for the same query.`);

    if (route === PILLAR_ROUTE) continue;

    if (!pillarText.includes(route)) fail(`Pillar ${PILLAR_ROUTE} does not link to spoke ${route}.`);
    const linksBack = post.related.includes(PILLAR_ROUTE) || JSON.stringify(post.blocks).includes(PILLAR_ROUTE);
    if (!linksBack) fail(`${route} does not link back to the cluster pillar ${PILLAR_ROUTE}.`);
  }

  // The handoff has to survive into the HTML a crawler reads, not just the data.
  for (const route of routes) {
    const block = staticSeoBlock(readFileSync(getHtmlPath(route), 'utf8')) ?? '';
    const target = canonicalUrlForRoute(blogPosts[route].primaryTool);
    if (!block.includes(target)) {
      fail(`${route} prerendered HTML does not link to its primaryTool ${blogPosts[route].primaryTool}.`);
    }
  }
}

validateFilesExist();
validateRobots();
validateSitemap();
validateRedirects();
validateSitemapRouteHtml();
validateNoInlinePageSeo();
validateNoOrphanRoutes();
validateRelatedToolLinks();
validateNoOrphanedFromLinks();
validateBlogCluster();
warnIfAnonymous();
warnIfThinSameAs();
validate404();

if (errors.length > 0) {
  console.error(`SEO validation failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`SEO validation passed for ${getSitemapEntries().length} sitemap URLs in dist/sitemap.xml.`);

for (const warning of warnings) console.warn(`  ⚠  ${warning}`);
