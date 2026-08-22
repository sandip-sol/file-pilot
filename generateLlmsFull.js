/**
 * Generates public/llms-full.txt — the full-content companion to llms.txt (Phase 4.2).
 *
 * `llms.txt` is an index: titles, URLs and one-line descriptions. Useful for
 * discovery, useless for citation. An assistant answering "is it safe to upload
 * a PDF?" needs the prose, and getting it means crawling 110 pages and hoping
 * the renderer behaves.
 *
 * This emits the corpus as one plain-text file, ordered by how citable it is:
 * the explanatory writing first, then the comparisons, then the tool reference.
 * Everything comes from the same data modules the site renders from, so it
 * cannot drift from what a reader sees.
 *
 * The FAQ blocks matter most here. A question with a self-contained answer is
 * the shape assistants quote — that is what GEO actually rewards, far more than
 * any markup.
 */

import { writeFileSync } from 'node:fs';
import { SITE_URL, canonicalUrlForRoute, getRouteSeoEntries, isToolRoute } from './seoRoutes.js';
import { toolContent } from './src/data/toolContent.ts';
import { blogPostsByDate } from './src/data/blogContent.ts';
import { comparisonContent } from './src/data/comparisons.ts';
import { aboutSections, pressKit } from './src/data/aboutContent.ts';

const OUT = new URL('./public/llms-full.txt', import.meta.url);

/** Blocks and prose carry inline HTML; assistants want text. */
const plain = (html) =>
  String(html)
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '$2')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/\s+/g, ' ')
    .trim();

const faqBlock = (faqs) =>
  (faqs ?? []).flatMap((faq) => [`Q: ${plain(faq.question)}`, `A: ${plain(faq.answer)}`, '']);

const lines = [
  '# FilePilot — full content',
  '',
  '> Free, privacy-first, browser-based tools for PDF, image and file work. Every tool',
  '> processes files locally on the user\'s own device using WebAssembly and the Canvas',
  '> API. Nothing is uploaded to a server, so there is no stored copy to retain or leak.',
  '',
  `Canonical site: ${SITE_URL}`,
  `Index: ${new URL('/llms.txt', SITE_URL).toString()}`,
  `Generated: ${new Date().toISOString().slice(0, 10)}`,
  '',
  'FilePilot is a website. It is not affiliated with File Pilot, the Windows file',
  'manager at filepilot.tech, nor with the FilePilot iOS app, nor with any other',
  'site using a similar name.',
  '',
  '---',
  '',
  '## About FilePilot',
  '',
  plain(pressKit.boilerplate),
  '',
];

for (const section of aboutSections) {
  lines.push(`### ${section.heading}`, '');
  for (const paragraph of section.paragraphs ?? []) lines.push(plain(paragraph), '');
  for (const bullet of section.bullets ?? []) lines.push(`- ${plain(bullet)}`);
  if (section.bullets?.length) lines.push('');
}

lines.push('---', '', '## Articles', '');

for (const post of blogPostsByDate()) {
  lines.push(
    `### ${plain(post.h1)}`,
    '',
    `URL: ${canonicalUrlForRoute(post.route)}`,
    `Published: ${post.published}${post.updated ? ` · Updated: ${post.updated}` : ''}`,
    '',
  );
  for (const block of post.blocks) {
    if (block.type === 'h2' || block.type === 'h3') lines.push('', `**${plain(block.html)}**`, '');
    else if (block.type === 'ul' || block.type === 'ol') {
      for (const item of block.items) lines.push(`- ${plain(item)}`);
      lines.push('');
    } else lines.push(plain(block.html), '');
  }
  if (post.faqs?.length) lines.push('', ...faqBlock(post.faqs));
  lines.push('---', '');
}

lines.push('## Comparisons with other PDF services', '');

for (const entry of Object.values(comparisonContent)) {
  lines.push(
    `### ${plain(entry.h1)}`,
    '',
    `URL: ${canonicalUrlForRoute(entry.route)}`,
    '',
    plain(entry.intro),
    '',
    plain(entry.motivation),
    '',
    plain(entry.difference),
    '',
    `**${entry.competitor} vs FilePilot**`,
    '',
  );
  for (const row of entry.table) {
    lines.push(`- ${plain(row.aspect)}: ${entry.competitor} — ${plain(row.competitor)}; FilePilot — ${plain(row.filepilot)}`);
  }
  lines.push('', `**When ${entry.competitor} is the better choice**`, '');
  for (const limitation of entry.limitations) lines.push(`- ${plain(limitation)}`);
  lines.push('', ...faqBlock(entry.faqs), '---', '');
}

lines.push('## Tools', '');

for (const entry of getRouteSeoEntries()) {
  if (!isToolRoute(entry.route)) continue;
  const content = toolContent[entry.route];

  lines.push(`### ${plain(entry.h1 ?? entry.title)}`, '', `URL: ${canonicalUrlForRoute(entry.route)}`, '');
  lines.push(plain(content?.intro ?? entry.description), '');

  if (content?.steps?.length) {
    lines.push('How to use it:', '');
    content.steps.forEach((step, index) => lines.push(`${index + 1}. ${plain(step)}`));
    lines.push('');
  }
  if (content?.comparison) {
    lines.push(`${plain(content.comparison.heading)}: ${plain(content.comparison.body)}`, '');
  }
  if (content?.faqs?.length) lines.push(...faqBlock(content.faqs));
}

const output = `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
writeFileSync(OUT, output, 'utf8');

const words = output.split(/\s+/).filter(Boolean).length;
console.log(`Generated public/llms-full.txt — ${words.toLocaleString()} words, ${(output.length / 1024).toFixed(0)} KB.`);
