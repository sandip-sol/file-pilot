/**
 * SEO drift detection — git for the SEO surface (Phase 4.4).
 *
 *   npm run seo:drift            compare the current build against the baseline
 *   npm run seo:drift -- --save  accept the current build as the new baseline
 *
 * `seoValidate.js` enforces invariants: a title must exist, a canonical must be
 * self-referential, a tool page must carry HowTo schema. It cannot tell you that
 * a title *changed* — every rule still passes when a refactor silently rewrites
 * 40 of them.
 *
 * That is the failure this catches. It snapshots the SEO-critical fields of
 * every route into `seo-baseline.json`, which is committed, so a diff shows up
 * in code review like any other change. Intentional edits are accepted with
 * `--save`; unintentional ones get noticed before they ship.
 *
 * Every rewrite in this codebase's history would have shown here as a diff:
 * the July title regression, the eight core routes whose client and prerendered
 * titles disagreed, the blog index that quietly listed three posts instead of
 * twelve.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { getSeoRoutes, canonicalUrlForRoute } from './seoRoutes.js';

const BASELINE = new URL('./seo-baseline.json', import.meta.url);
const DIST = new URL('./dist/', import.meta.url);
const save = process.argv.includes('--save');

const htmlPath = (route) =>
  new URL(route === '/' ? './index.html' : `.${route}/index.html`, DIST);

const decode = (value) =>
  value?.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"').replaceAll('&#39;', "'");

/** The fields that decide how a page is understood and ranked. */
function fingerprint(route) {
  const path = htmlPath(route);
  if (!existsSync(path)) return { missing: true };

  const html = readFileSync(path, 'utf8');
  let schemaTypes = [];
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (jsonLd) {
    try {
      const parsed = JSON.parse(jsonLd);
      schemaTypes = (parsed['@graph'] ?? [parsed]).map((node) => node['@type']).sort();
    } catch {
      schemaTypes = ['<unparseable>'];
    }
  }

  const staticBlock = html.match(/<div data-static-seo="true" class="static-seo">([\s\S]*?)<\/div>\s*<\/div>/i)?.[1] ?? '';
  const text = staticBlock.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean);

  return {
    title: decode(html.match(/<title>([^<]*)<\/title>/i)?.[1]) ?? null,
    description: decode(html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]) ?? null,
    canonical: html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? null,
    robots: html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1] ?? null,
    h1: decode(html.match(/<h1[^>]*>([^<]*)<\/h1>/i)?.[1]) ?? null,
    schemaTypes,
    words: text.length,
    // Outbound internal links, sorted — catches a navigation or related-links change.
    links: [...new Set([...staticBlock.matchAll(/href="(https:\/\/www\.filepilot\.space\/[^"]*)"/g)].map(([, href]) => href))].sort(),
  };
}

const current = {};
for (const route of getSeoRoutes()) current[route] = fingerprint(route);

if (save || !existsSync(BASELINE)) {
  writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
  console.log(
    existsSync(BASELINE) && !save
      ? `Created seo-baseline.json for ${Object.keys(current).length} routes. Commit it.`
      : `Saved seo-baseline.json for ${Object.keys(current).length} routes. Commit it.`,
  );
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const changes = [];

/** Word count moves with every copy edit; only a large swing is worth reporting. */
const WORD_TOLERANCE = 0.2;

for (const route of new Set([...Object.keys(baseline), ...Object.keys(current)])) {
  const before = baseline[route];
  const after = current[route];

  if (!before) { changes.push({ route, severity: 'new', field: 'route', from: null, to: 'added' }); continue; }
  if (!after) { changes.push({ route, severity: 'high', field: 'route', from: 'present', to: 'REMOVED' }); continue; }
  if (after.missing) { changes.push({ route, severity: 'high', field: 'html', from: 'present', to: 'MISSING' }); continue; }

  for (const field of ['title', 'description', 'canonical', 'robots', 'h1']) {
    if (before[field] !== after[field]) {
      changes.push({ route, severity: 'high', field, from: before[field], to: after[field] });
    }
  }

  const beforeSchema = (before.schemaTypes ?? []).join(',');
  const afterSchema = (after.schemaTypes ?? []).join(',');
  if (beforeSchema !== afterSchema) {
    changes.push({ route, severity: 'high', field: 'schema', from: beforeSchema, to: afterSchema });
  }

  const lost = (before.links ?? []).filter((link) => !(after.links ?? []).includes(link));
  if (lost.length) {
    changes.push({ route, severity: 'medium', field: 'internal links', from: `${before.links.length} links`, to: `${after.links.length} (lost ${lost.length})` });
  }

  const drift = before.words ? Math.abs(after.words - before.words) / before.words : 0;
  if (drift > WORD_TOLERANCE) {
    changes.push({ route, severity: 'medium', field: 'content length', from: `${before.words} words`, to: `${after.words} words` });
  }
}

if (!changes.length) {
  console.log(`\nNo SEO drift across ${Object.keys(current).length} routes.\n`);
  process.exit(0);
}

const order = { high: 0, medium: 1, new: 2 };
changes.sort((a, b) => order[a.severity] - order[b.severity] || a.route.localeCompare(b.route));

console.log(`\n${changes.length} change${changes.length === 1 ? '' : 's'} since the baseline:\n`);
for (const change of changes) {
  const mark = { high: '!!', medium: ' ~', new: ' +' }[change.severity];
  console.log(`${mark} ${change.route}  [${change.field}]`);
  if (change.severity !== 'new') {
    console.log(`     was: ${change.from}`);
    console.log(`     now: ${change.to}`);
  }
}

const high = changes.filter((change) => change.severity === 'high').length;
console.log(`\n${high} high-severity, ${changes.length - high} other.`);
console.log('If these are intended: npm run seo:drift -- --save, then commit seo-baseline.json.\n');

// Reporting only — an intentional rewrite is not a build failure.
process.exit(0);
