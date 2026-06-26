import { readFileSync } from 'node:fs';

const TOOL_REGISTRY_PATH = new URL('./src/data/toolRegistry.ts', import.meta.url);

export const SITE_URL = 'https://www.filepilot.space';

const CORE_ROUTES = ['/', '/privacy', '/terms'];
const CORE_ROUTE_SEO = {
  '/': {
    title: 'FilePilot',
    description:
      'Free browser-based PDF, image, and file tools. Edit, convert, compress, organize, and optimize files privately without uploads.',
  },
  '/privacy': {
    title: 'Privacy Policy',
    description:
      'Learn how FilePilot protects files with browser-based processing and no server uploads for supported tools.',
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'Read the terms for using FilePilot browser-based PDF, image, and file tools.',
  },
};

const extractSet = (source, name) => {
  const match = source.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/'([^']+)'/g)].map(([, slug]) => slug));
};

const extractToolEntries = (source) => {
  const hiddenSlugs = extractSet(source, 'hiddenToolSlugs');
  const comingSoonSlugs = extractSet(source, 'comingSoonToolSlugs');
  const toolBlocks = source.match(/\{\s*slug: '[^']+'[\s\S]*?\n  \}/g) ?? [];

  return toolBlocks
    .map((block) => {
      const route = block.match(/slug: '([^']+)'/)?.[1];
      const title = block.match(/title: '([^']+)'/)?.[1];
      const description = block.match(/description: '([^']+)'/)?.[1];

      if (!route || !title || !description) return null;
      if (hiddenSlugs.has(route) || comingSoonSlugs.has(route) || block.includes("visibility: 'alias'")) {
        return null;
      }

      return { route, title, description };
    })
    .filter(Boolean);
};

const uniqueRoutes = (routes) => [...new Set(routes)];

export const getDiscoverableToolEntries = () => {
  const source = readFileSync(TOOL_REGISTRY_PATH, 'utf8');
  return extractToolEntries(source);
};

export const getSeoRoutes = () => {
  const source = readFileSync(TOOL_REGISTRY_PATH, 'utf8');
  const discoverableToolSlugs = extractToolEntries(source).map(({ route }) => route);

  return uniqueRoutes(['/', ...discoverableToolSlugs, '/privacy', '/terms']);
};

export const getRouteSeoEntries = () => [
  { route: '/', ...CORE_ROUTE_SEO['/'] },
  ...getDiscoverableToolEntries(),
  { route: '/privacy', ...CORE_ROUTE_SEO['/privacy'] },
  { route: '/terms', ...CORE_ROUTE_SEO['/terms'] },
];

export const getRouteSeo = (route) => {
  const normalizedRoute = route === '' ? '/' : route;
  return getRouteSeoEntries().find((entry) => entry.route === normalizedRoute) ?? CORE_ROUTE_SEO['/'];
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
