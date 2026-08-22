/**
 * Post-deploy indexability crawler (Phase 0.1).
 *
 * `seoValidate.js` checks dist/ before a deploy. This checks the deployed site,
 * which is where a different class of failure shows up: a route that builds
 * fine but 404s in production, a redirect that fires on a canonical URL, a
 * CDN-level `X-Robots-Tag: noindex`, or an HTML file that never got published.
 *
 * It does NOT replace Google Search Console. GSC tells you what Google chose to
 * index; this tells you whether Google *can*. Run this first — if a URL fails
 * here, no amount of "Request Indexing" will help.
 *
 *   npm run seo:crawl                  # every sitemap URL on production
 *   npm run seo:crawl -- --tail        # just the Phase 1 focus tools
 *   npm run seo:crawl -- --base https://deploy-preview-42--filepilot.netlify.app
 */

import {
  CANONICAL_HOST,
  PRIORITY_SEO_ROUTES,
  PRIORITY_TAIL_ROUTES,
  SITE_URL,
  canonicalUrlForRoute,
  getRouteSeo,
  getSeoRoutes,
  isToolRoute,
} from './seoRoutes.js';
import { comparisonContent } from './src/data/comparisons.ts';
import { blogPosts } from './src/data/blogContent.ts';

const args = process.argv.slice(2);
const baseArg = args.find((arg) => arg.startsWith('--base='))?.slice('--base='.length)
  ?? (args.includes('--base') ? args[args.indexOf('--base') + 1] : null);
const BASE = (baseArg ?? SITE_URL).replace(/\/+$/, '');
const CONCURRENCY = 6;
const TIMEOUT_MS = 20000;

const routes = args.includes('--tail')
  ? PRIORITY_TAIL_ROUTES
  : args.includes('--priority')
    ? PRIORITY_SEO_ROUTES
    : getSeoRoutes();

const decode = (value) =>
  value
    ?.replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");

const urlForRoute = (route) => canonicalUrlForRoute(route).replace(SITE_URL.replace(/\/+$/, ''), BASE);

/**
 * Verifies the structured data each page type is supposed to ship (Phase 0.2).
 * seoValidate gates this at build time; checking it live catches the case where
 * the deployed HTML is older than the build that passed.
 */
function schemaProblems(route, html) {
  const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!raw) return ['no JSON-LD on the page'];

  let types;
  try {
    const parsed = JSON.parse(raw);
    types = new Set((parsed['@graph'] ?? [parsed]).map((node) => node['@type']));
  } catch (error) {
    return [`JSON-LD does not parse: ${error.message}`];
  }

  return expectedSchema(route).filter((type) => !types.has(type)).map((type) => `schema is missing ${type}`);
}

/**
 * Derived from the same modules that generate the pages rather than a local list.
 * This function previously carried its own hardcoded set of hubs and legal pages,
 * written before the comparison pages and /about existed — so it demanded HowTo
 * schema of them and reported five healthy pages as broken.
 */
function expectedSchema(route) {
  if (route === '/') return ['WebSite', 'Organization', 'SoftwareApplication', 'FAQPage'];
  if (route === '/about') return ['BreadcrumbList', 'AboutPage'];
  if (route === '/blog') return ['BreadcrumbList', 'CollectionPage'];
  if (blogPosts[route]) return ['BreadcrumbList', 'BlogPosting'];
  if (comparisonContent[route]) return ['BreadcrumbList', 'WebPage'];
  if (!isToolRoute(route)) return ['BreadcrumbList'];
  return ['BreadcrumbList', 'SoftwareApplication', 'FAQPage', 'HowTo'];
}

async function checkRoute(route) {
  const url = urlForRoute(route);
  const problems = [];

  let response;
  try {
    response = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': 'FilePilot-SEO-Crawler' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    return { route, url, problems: [`request failed: ${error.message}`] };
  }

  if (response.status !== 200) {
    const location = response.headers.get('location');
    problems.push(
      `expected 200, got ${response.status}${location ? ` → ${location}` : ''}`
        + ' (a canonical, sitemapped URL must not redirect or error)',
    );
    return { route, url, problems };
  }

  // A CDN header silently overrides the meta tag and is easy to miss.
  const xRobots = response.headers.get('x-robots-tag');
  if (xRobots && /noindex/i.test(xRobots)) problems.push(`X-Robots-Tag header says "${xRobots}"`);

  const html = await response.text();
  const seo = getRouteSeo(route);

  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1]);
  if (title !== seo.title) problems.push(`title is "${title}", expected "${seo.title}"`);

  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  const expectedCanonical = canonicalUrlForRoute(route);
  if (canonical !== expectedCanonical) {
    problems.push(`canonical is "${canonical}", expected "${expectedCanonical}"`);
  }

  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1];
  if (!robots) problems.push('no robots meta tag');
  else if (/noindex/i.test(robots)) problems.push(`robots meta says "${robots}"`);

  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1Count === 0) problems.push('no H1 in the served HTML');
  else if (h1Count > 1) problems.push(`${h1Count} H1 tags in the served HTML`);

  problems.push(...schemaProblems(route, html));

  const staticBlock = html.match(/<div data-static-seo="true" class="static-seo">([\s\S]*?)<\/div>\s*<\/div>/i)?.[1];
  if (!staticBlock) {
    problems.push('no prerendered content block — the deploy is serving the raw app shell');
  } else {
    const words = staticBlock.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (words < 50) problems.push(`only ${words} words of prerendered content`);
  }

  return { route, url, problems };
}

async function run() {
  if (BASE !== SITE_URL.replace(/\/+$/, '')) {
    console.log(`Crawling ${routes.length} routes against ${BASE} (not ${CANONICAL_HOST}).`);
    console.log('Canonical/title checks still compare against production values.\n');
  } else {
    console.log(`Crawling ${routes.length} routes against ${BASE}\n`);
  }

  const results = [];
  const queue = [...routes];

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) {
        const route = queue.shift();
        const result = await checkRoute(route);
        results.push(result);
        process.stdout.write(result.problems.length ? '✗' : '.');
      }
    }),
  );

  console.log('\n');

  const failed = results.filter((result) => result.problems.length).sort((a, b) => a.route.localeCompare(b.route));
  for (const { url, problems } of failed) {
    console.error(`✗ ${url}`);
    for (const problem of problems) console.error(`    ${problem}`);
  }

  console.log(`${results.length - failed.length}/${results.length} routes are crawlable and indexable.`);

  if (failed.length) {
    console.error(`\n${failed.length} route${failed.length === 1 ? '' : 's'} would be invisible to search engines.`);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('Crawl failed:', error.message);
  process.exitCode = 1;
});
