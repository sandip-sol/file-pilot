import { writeFileSync } from 'node:fs';
import { blogPostsByDate } from './src/data/blogContent.ts';
import { SITE_URL, canonicalUrlForRoute } from './seoRoutes.js';

const RSS_PATH = new URL('./public/rss.xml', import.meta.url);
const FEED_URL = `${SITE_URL}rss.xml`;

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const rfc822 = (value) => new Date(value).toUTCString();

const posts = blogPostsByDate();

// Derived from the posts, not the clock, so an unchanged blog produces an unchanged feed.
const lastChange = posts
  .flatMap((post) => [post.published, post.updated].filter(Boolean))
  .sort((a, b) => new Date(b) - new Date(a))[0];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  '  <channel>',
  '    <title>FilePilot Blog</title>',
  `    <link>${escapeXml(canonicalUrlForRoute('/blog'))}</link>`,
  '    <description>Guides to working with PDFs and images privately, in your browser.</description>',
  '    <language>en</language>',
  `    <lastBuildDate>${rfc822(lastChange)}</lastBuildDate>`,
  `    <atom:link href="${escapeXml(FEED_URL)}" rel="self" type="application/rss+xml" />`,
  ...posts.map((post) => {
    const url = escapeXml(canonicalUrlForRoute(post.route));
    return [
      '    <item>',
      `      <title>${escapeXml(post.h1)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${rfc822(post.published)}</pubDate>`,
      `      <description>${escapeXml(post.description)}</description>`,
      '    </item>',
    ].join('\n');
  }),
  '  </channel>',
  '</rss>',
  '',
].join('\n');

writeFileSync(RSS_PATH, xml, 'utf8');
console.log(`Generated public/rss.xml with ${posts.length} posts.`);
