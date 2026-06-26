import { readFileSync } from 'node:fs';

const TOOL_REGISTRY_PATH = new URL('./src/data/toolRegistry.ts', import.meta.url);

export const SITE_URL = 'https://www.filepilot.space/';

const CORE_ROUTE_SEO = {
  '/': {
    title: 'FilePilot - Free Private PDF, Image and File Tools',
    description:
      'Free browser-based PDF, image, and file tools. Edit, convert, compress, organize, and optimize files privately without uploads.',
    h1: 'FilePilot',
    lastmod: '2026-06-26',
    changefreq: 'weekly',
    priority: '1.0',
  },
  '/pdf-tools': {
    title: 'Free Online PDF Tools - Private Browser-Based Tools | FilePilot',
    description:
      'Merge, split, compress, convert, annotate, redact, sign, and organize PDFs with free tools that run privately in your browser.',
    h1: 'Free Online PDF Tools',
    changefreq: 'weekly',
    priority: '0.9',
  },
  '/image-tools': {
    title: 'Free Online Image Tools - Private Browser-Based Tools | FilePilot',
    description:
      'Compress, resize, crop, convert, watermark, optimize, and edit images with free browser-based tools that do not upload your files.',
    h1: 'Free Online Image Tools',
    changefreq: 'weekly',
    priority: '0.9',
  },
  '/blog': {
    title: 'FilePilot Blog - Privacy, PDFs and Image Tools',
    description:
      'Articles about privacy-first file processing, browser-based PDF tools, image tools, and why files should stay on your device.',
    h1: 'FilePilot Blog',
    lastmod: '2026-06-26',
    changefreq: 'monthly',
    priority: '0.6',
  },
  '/privacy': {
    title: 'Privacy Policy | FilePilot',
    description:
      'Learn how FilePilot protects files with browser-based processing and no server uploads for supported tools.',
    h1: 'Privacy Policy',
    lastmod: '2026-06-19',
    changefreq: 'yearly',
    priority: '0.3',
  },
  '/terms': {
    title: 'Terms of Service | FilePilot',
    description: 'Read the terms for using FilePilot browser-based PDF, image, and file tools.',
    h1: 'Terms of Service',
    lastmod: '2026-06-19',
    changefreq: 'yearly',
    priority: '0.3',
  },
};

const BLOG_ROUTE_SEO = {
  '/blog/why-files-stay-in-browser': {
    title: 'Why Your Files Should Never Leave Your Browser | FilePilot',
    description:
      'Learn why browser-based file processing avoids server uploads, reduces privacy risks, and keeps sensitive documents under your control.',
    h1: 'Why Your Files Should Never Leave Your Browser',
    lastmod: '2026-06-26',
    changefreq: 'yearly',
    priority: '0.5',
  },
  '/blog/privacy-risks-online-pdf-tools': {
    title: 'The Hidden Privacy Risks of Online PDF Tools | FilePilot',
    description:
      'Understand the privacy risks of uploading PDFs to server-based tools and how local browser processing reduces exposure.',
    h1: 'The Hidden Privacy Risks of Online PDF Tools',
    lastmod: '2026-06-26',
    changefreq: 'yearly',
    priority: '0.5',
  },
  '/blog/how-filepilot-keeps-documents-private': {
    title: 'How FilePilot Keeps Your Documents Private | FilePilot',
    description:
      'A practical look at FilePilot privacy architecture: browser memory, WebAssembly, Canvas APIs, and zero document uploads.',
    h1: 'How FilePilot Keeps Your Documents Private',
    lastmod: '2026-06-26',
    changefreq: 'yearly',
    priority: '0.5',
  },
};

const INDEXABLE_ALIAS_ROUTE_SEO = {
  '/jpg-to-pdf': {
    title: 'JPG to PDF Online - Free and Private | FilePilot',
    description:
      'Convert JPG and JPEG photos into a PDF in your browser. Arrange images, choose page size, and download privately without uploads.',
    h1: 'JPG to PDF Online',
    changefreq: 'monthly',
    priority: '0.8',
  },
  '/pdf-to-jpg': {
    title: 'PDF to JPG Online - Free and Private | FilePilot',
    description:
      'Convert PDF pages to JPG images locally in your browser with DPI and quality controls. Download pages as a private ZIP file.',
    h1: 'PDF to JPG Online',
    changefreq: 'monthly',
    priority: '0.8',
  },
};

const CORE_ROUTES = Object.keys(CORE_ROUTE_SEO);
const BLOG_ROUTES = Object.keys(BLOG_ROUTE_SEO);
const INDEXABLE_ALIAS_ROUTES = Object.keys(INDEXABLE_ALIAS_ROUTE_SEO);

const extractSet = (source, name) => {
  const match = source.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/'([^']+)'/g)].map(([, slug]) => slug));
};

const CATEGORY_LABELS = {
  'organize-manage': 'PDF organization',
  'edit-annotate': 'PDF editing',
  'convert-to-pdf': 'PDF conversion',
  'convert-from-pdf': 'PDF export',
  'optimize-repair': 'PDF optimization',
  'secure-pdf': 'PDF privacy',
  'image-tools': 'image editing',
  'ai-tools': 'AI image',
  workflows: 'image workflow',
};

const getBlockValue = (block, key) => block.match(new RegExp(`${key}: '([^']+)'`))?.[1];

const normalizeRoute = (route) => {
  if (!route || route === '/') return '/';
  return route.startsWith('/') ? route.replace(/\/+$/, '') : `/${route.replace(/\/+$/, '')}`;
};

export const canonicalUrlForRoute = (route) => {
  const normalizedRoute = normalizeRoute(route);
  if (normalizedRoute === '/') return SITE_URL;
  return new URL(`${normalizedRoute.slice(1)}/`, SITE_URL).toString();
};

const toToolSeoTitle = (title) => {
  const normalizedTitle = title
    .replace(/PDFs\b/g, 'PDF')
    .replace(/Images\b/g, 'Image')
    .replace(/\s+/g, ' ')
    .trim();

  return `${normalizedTitle} Online - Free and Private | FilePilot`;
};

const toToolDescription = ({ title, description, category }) => {
  const categoryLabel = CATEGORY_LABELS[category] ?? 'file';
  const cleanDescription = description.replace(/\.$/, '');

  return `${cleanDescription}. Use this free ${categoryLabel} tool in your browser with local processing and no file uploads.`;
};

const extractToolEntries = (source) => {
  const hiddenSlugs = extractSet(source, 'hiddenToolSlugs');
  const comingSoonSlugs = extractSet(source, 'comingSoonToolSlugs');
  const toolBlocks = source.match(/\{\s*slug: '[^']+'[\s\S]*?\n  \}/g) ?? [];

  return toolBlocks
    .map((block) => {
      const route = getBlockValue(block, 'slug');
      const title = getBlockValue(block, 'title');
      const description = getBlockValue(block, 'description');
      const category = getBlockValue(block, 'category');
      const canonicalSlug = getBlockValue(block, 'canonicalSlug');
      const isAlias = block.includes("visibility: 'alias'");

      if (!route || !title || !description) return null;
      if (hiddenSlugs.has(route) || comingSoonSlugs.has(route)) {
        return null;
      }
      if (isAlias && !INDEXABLE_ALIAS_ROUTES.includes(route)) return null;

      return {
        route,
        title: INDEXABLE_ALIAS_ROUTE_SEO[route]?.title ?? toToolSeoTitle(title),
        description: INDEXABLE_ALIAS_ROUTE_SEO[route]?.description ?? toToolDescription({ title, description, category }),
        h1: INDEXABLE_ALIAS_ROUTE_SEO[route]?.h1 ?? title,
        category,
        canonicalRoute: isAlias ? route : canonicalSlug ?? route,
        changefreq: INDEXABLE_ALIAS_ROUTE_SEO[route]?.changefreq ?? 'monthly',
        priority: INDEXABLE_ALIAS_ROUTE_SEO[route]?.priority ?? (route === '/image-requirements' ? '0.9' : '0.8'),
      };
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

  return uniqueRoutes([...CORE_ROUTES, ...discoverableToolSlugs, ...BLOG_ROUTES]);
};

export const getRouteSeoEntries = () => [
  ...CORE_ROUTES.map((route) => ({ route, ...CORE_ROUTE_SEO[route] })),
  ...getDiscoverableToolEntries(),
  ...BLOG_ROUTES.map((route) => ({ route, ...BLOG_ROUTE_SEO[route] })),
];

export const getRouteSeo = (route) => {
  const normalizedRoute = normalizeRoute(route);
  return getRouteSeoEntries().find((entry) => entry.route === normalizedRoute) ?? CORE_ROUTE_SEO['/'];
};

export const getSitemapEntries = () => {
  const routeSeoEntries = getRouteSeoEntries();

  return getSeoRoutes().map((route) => {
    const seo = routeSeoEntries.find((entry) => entry.route === route) ?? {};
    return {
      route,
      loc: canonicalUrlForRoute(route),
      lastmod: seo.lastmod,
      changefreq: seo.changefreq ?? 'monthly',
      priority: seo.priority ?? '0.8',
    };
  });
};
