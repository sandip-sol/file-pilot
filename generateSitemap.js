import { writeFileSync } from 'node:fs';
import { getSitemapEntries } from './seoRoutes.js';

const SITEMAP_PATH = new URL('./public/sitemap.xml', import.meta.url);

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...getSitemapEntries().map(({ loc, lastmod, changefreq, priority }) => {
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].filter(Boolean).join('\n');
  }),
  '</urlset>',
  '',
].join('\n');

writeFileSync(SITEMAP_PATH, xml, 'utf8');
console.log(`Generated public/sitemap.xml with ${getSitemapEntries().length} URLs.`);
