import { writeFileSync } from 'node:fs';
import { SITE_URL, canonicalUrlForRoute, getRouteSeoEntries } from './seoRoutes.js';

const LLMS_PATH = new URL('./public/llms.txt', import.meta.url);

const CATEGORY_SECTIONS = {
  'organize-manage': 'PDF Organization Tools',
  'edit-annotate': 'PDF Editing Tools',
  'convert-to-pdf': 'Convert to PDF',
  'convert-from-pdf': 'Convert from PDF',
  'optimize-repair': 'PDF Optimization Tools',
  'secure-pdf': 'PDF Privacy & Security Tools',
  'image-tools': 'Image Editing Tools',
  'ai-tools': 'AI Image Tools',
  'workflows': 'Image Workflow Tools',
};

const entries = getRouteSeoEntries();
const formatEntry = ({ route, title, description }) =>
  `- [${title}](${canonicalUrlForRoute(route)}): ${description}`;

const coreRoutes = entries.filter(({ category }) => !category);
const grouped = {};
for (const entry of entries) {
  if (!entry.category) continue;
  (grouped[entry.category] ??= []).push(entry);
}

const lines = [
  '# FilePilot',
  '',
  '> Free, privacy-first, browser-based tools for PDF, image, and file conversion. All processing happens locally in the browser — no files are uploaded to any server.',
  '',
  `Canonical site: ${SITE_URL}`,
  `Sitemap: ${new URL('/sitemap.xml', SITE_URL).toString()}`,
  `Robots: ${new URL('/robots.txt', SITE_URL).toString()}`,
  '',
  '## Main Pages',
  '',
  ...coreRoutes.map(formatEntry),
  '',
];

for (const [category, label] of Object.entries(CATEGORY_SECTIONS)) {
  const tools = grouped[category];
  if (!tools?.length) continue;
  lines.push(`## ${label}`, '', ...tools.map(formatEntry), '');
}

writeFileSync(LLMS_PATH, lines.join('\n'), 'utf8');
console.log(`Generated public/llms.txt with ${entries.length} entries.`);
