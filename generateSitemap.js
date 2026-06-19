import { writeFileSync } from 'node:fs';
import { SITE_URL, getSitemapEntries } from './seoRoutes.js';

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
  ...getSitemapEntries().map(({ route, lastmod, changefreq, priority }) => {
    const loc = new URL(route, SITE_URL).toString();
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n');
  }),
  '</urlset>',
  '',
].join('\n');

writeFileSync(SITEMAP_PATH, xml, 'utf8');
console.log(`Generated public/sitemap.xml with ${getSitemapEntries().length} URLs.`);
