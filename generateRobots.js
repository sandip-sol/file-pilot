import { writeFileSync } from 'node:fs';

const ROBOTS_PATH = new URL('./public/robots.txt', import.meta.url);

const robots = `User-agent: *
Allow: /

Sitemap: https://www.filepilot.space/sitemap.xml
`;

writeFileSync(ROBOTS_PATH, robots, 'utf8');
console.log('Generated public/robots.txt with the production sitemap declaration.');
