import { writeFileSync } from 'node:fs';

const ROBOTS_PATH = new URL('./public/robots.txt', import.meta.url);
const isNetlifyPreview =
  process.env.NETLIFY === 'true' && process.env.CONTEXT && process.env.CONTEXT !== 'production';

const productionRobots = `User-agent: *
Allow: /

Sitemap: https://www.filepilot.space/sitemap.xml
`;

const previewRobots = `User-agent: *
Disallow: /
`;

writeFileSync(ROBOTS_PATH, isNetlifyPreview ? previewRobots : productionRobots, 'utf8');
console.log(`Generated public/robots.txt for ${isNetlifyPreview ? 'non-production' : 'production/local'} indexing.`);
