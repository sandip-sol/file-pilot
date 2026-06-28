import { writeFileSync } from 'node:fs';

const ROBOTS_PATH = new URL('./public/robots.txt', import.meta.url);

const robots = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://www.filepilot.space/sitemap.xml
`;

writeFileSync(ROBOTS_PATH, robots, 'utf8');
console.log('Generated public/robots.txt with the production sitemap declaration.');
