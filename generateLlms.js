import { writeFileSync } from 'node:fs';
import { SITE_URL, getRouteSeoEntries } from './seoRoutes.js';

const LLMS_PATH = new URL('./public/llms.txt', import.meta.url);

const absoluteUrl = (route) => new URL(route, SITE_URL).toString();

const lines = [
  '# FilePilot',
  '',
  '> Free browser-based PDF, image, and file tools. Files are processed locally in the browser for supported tools.',
  '',
  `Canonical site: ${SITE_URL}`,
  `Sitemap: ${new URL('/sitemap.xml', SITE_URL).toString()}`,
  `Robots: ${new URL('/robots.txt', SITE_URL).toString()}`,
  '',
  '## Indexable Tools and Pages',
  '',
  ...getRouteSeoEntries().map(
    ({ route, title, description }) => `- [${title}](${absoluteUrl(route)}): ${description}`,
  ),
  '',
].join('\n');

writeFileSync(LLMS_PATH, lines, 'utf8');
console.log(`Generated public/llms.txt with ${getRouteSeoEntries().length} entries.`);
