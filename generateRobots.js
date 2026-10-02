import { writeFileSync } from 'node:fs';

const ROBOTS_PATH = new URL('./public/robots.txt', import.meta.url);

// Query strings and /index.html only ever produce duplicates of canonical pages
// (no route reads URL parameters), so keep crawlers off them. Every named agent
// needs the rules repeated: a crawler obeys only its most specific group.
const DUPLICATE_URL_RULES = `Disallow: /*?
Disallow: /index.html
Allow: /`;

const agents = ['*', 'GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'];

const robots = `${agents.map((agent) => `User-agent: ${agent}\n${DUPLICATE_URL_RULES}`).join('\n\n')}

Sitemap: https://www.filepilot.space/sitemap.xml
`;

writeFileSync(ROBOTS_PATH, robots, 'utf8');
console.log('Generated public/robots.txt with the production sitemap declaration.');
