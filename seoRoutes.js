import { readFileSync } from 'node:fs';

const TOOL_REGISTRY_PATH = new URL('./src/data/toolRegistry.ts', import.meta.url);

export const SITE_URL = 'https://www.filepilot.space';

const CORE_ROUTES = ['/', '/privacy', '/terms'];

const extractSet = (source, name) => {
  const match = source.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/'([^']+)'/g)].map(([, slug]) => slug));
};

const extractAliasSlugs = (source) => {
  const toolBlocks = source.match(/\{\s*slug: '[^']+'[\s\S]*?\n  \}/g) ?? [];
  return new Set(
    toolBlocks
      .filter((block) => block.includes("visibility: 'alias'"))
      .map((block) => block.match(/slug: '([^']+)'/)?.[1])
      .filter(Boolean),
  );
};

const uniqueRoutes = (routes) => [...new Set(routes)];

export const getSeoRoutes = () => {
  const source = readFileSync(TOOL_REGISTRY_PATH, 'utf8');
  const toolSlugs = [...source.matchAll(/slug: '([^']+)'/g)].map(([, slug]) => slug);
  const hiddenSlugs = extractSet(source, 'hiddenToolSlugs');
  const comingSoonSlugs = extractSet(source, 'comingSoonToolSlugs');
  const aliasSlugs = extractAliasSlugs(source);

  const discoverableToolSlugs = toolSlugs.filter(
    (slug) => !hiddenSlugs.has(slug) && !comingSoonSlugs.has(slug) && !aliasSlugs.has(slug),
  );

  return uniqueRoutes(['/', ...discoverableToolSlugs, '/privacy', '/terms']);
};

export const getSitemapEntries = () => {
  const today = new Date().toISOString().slice(0, 10);

  return getSeoRoutes().map((route) => {
    if (route === '/') {
      return { route, lastmod: today, changefreq: 'weekly', priority: '1.0' };
    }

    if (CORE_ROUTES.includes(route)) {
      return { route, lastmod: today, changefreq: 'yearly', priority: '0.3' };
    }

    return {
      route,
      lastmod: today,
      changefreq: 'monthly',
      priority: route === '/image-requirements' ? '0.9' : '0.8',
    };
  });
};
