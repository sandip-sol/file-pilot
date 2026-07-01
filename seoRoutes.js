import { readFileSync } from 'node:fs';

const TOOL_REGISTRY_PATH = new URL('./src/data/toolRegistry.ts', import.meta.url);

export const SITE_URL = 'https://www.filepilot.space/';
export const CANONICAL_HOST = new URL(SITE_URL).hostname;

export const PRIORITY_SEO_ROUTES = [
  '/',
  '/pdf-tools',
  '/image-tools',
  '/merge',
  '/split',
  '/compress',
  '/jpg-to-pdf',
  '/pdf-to-jpg',
  '/compress-image',
  '/resize-image',
  '/convert-image',
  '/crop-image',
  '/image-formatter',
  '/qr-generator',
  '/blog',
  '/support',
  '/privacy',
  '/terms',
];

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
    lastmod: '2026-06-28',
    changefreq: 'weekly',
    priority: '0.9',
  },
  '/image-tools': {
    title: 'Free Online Image Tools - Private Browser-Based Tools | FilePilot',
    description:
      'Compress, resize, crop, convert, watermark, optimize, and edit images with free browser-based tools that do not upload your files.',
    h1: 'Free Online Image Tools',
    lastmod: '2026-06-28',
    changefreq: 'weekly',
    priority: '0.9',
  },
  '/image-workflows': {
    title: 'Image Workflow Tools - Format, Validate and Prepare Images | FilePilot',
    description:
      'Prepare images for social media, ecommerce, passport photos, favicons, QR codes, and PDF workflows with private browser-based tools.',
    h1: 'Image Workflow Tools',
    shortIntro: 'Focused image workflow tools for real output requirements, processed privately in your browser.',
    lastmod: '2026-06-28',
    changefreq: 'weekly',
    priority: '0.75',
  },
  '/ai-tools': {
    title: 'AI Image Tools - Private Browser-Based Editing | FilePilot',
    description:
      'Remove backgrounds, enhance images, upscale photos, and clean edits with AI-assisted tools that run in your browser where supported.',
    h1: 'AI Image Tools',
    shortIntro: 'AI-assisted image tools for background removal, cleanup, enhancement, and upscaling with privacy-first browser processing.',
    lastmod: '2026-06-28',
    changefreq: 'weekly',
    priority: '0.75',
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
  '/support': {
    title: 'Support FilePilot | Keep private file tools free',
    description:
      'Support FilePilot and help keep private, browser-based file tools free, ad-free and improving.',
    h1: 'Support FilePilot',
    shortIntro:
      'Help keep FilePilot free, private and ad-free while funding new tools, performance improvements and maintenance.',
    lastmod: '2026-06-29',
    changefreq: 'monthly',
    priority: '0.5',
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

const DEFAULT_RELATED_ROUTES = ['/pdf-tools', '/image-tools', '/merge', '/compress', '/compress-image'];

const RELATED_ROUTES = {
  '/': ['/pdf-tools', '/image-tools', '/merge', '/compress-image', '/blog'],
  '/pdf-tools': ['/merge', '/split', '/compress', '/jpg-to-pdf', '/pdf-to-jpg'],
  '/image-tools': ['/compress-image', '/resize-image', '/convert-image', '/image-workflows', '/ai-tools'],
  '/image-workflows': ['/image-formatter', '/social-media-resizer', '/ecommerce-image-formatter', '/qr-generator', '/favicon-generator'],
  '/ai-tools': ['/remove-background', '/upscale-image', '/ai-enhance-image', '/object-remover', '/change-background'],
  '/merge': ['/split', '/compress', '/organize-pdf', '/jpg-to-pdf'],
  '/split': ['/merge', '/extract-pages', '/delete-pages', '/organize-pdf'],
  '/compress': ['/merge', '/pdf-to-jpg', '/pdf-tools', '/repair-pdf'],
  '/jpg-to-pdf': ['/images-to-pdf', '/pdf-to-jpg', '/compress-image', '/merge'],
  '/pdf-to-jpg': ['/pdf-to-images', '/jpg-to-pdf', '/compress-image', '/compress'],
  '/compress-image': ['/resize-image', '/convert-image', '/crop-image', '/image-formatter'],
  '/resize-image': ['/compress-image', '/crop-image', '/social-media-resizer', '/image-formatter'],
  '/convert-image': ['/compress-image', '/resize-image', '/image-to-svg', '/image-formatter'],
  '/crop-image': ['/resize-image', '/rotate-image', '/image-formatter', '/compress-image'],
  '/image-formatter': ['/social-media-resizer', '/ecommerce-image-formatter', '/compress-image', '/image-requirements'],
  '/qr-generator': ['/favicon-generator', '/image-to-svg', '/image-formatter', '/image-workflows'],
  '/blog': ['/blog/why-files-stay-in-browser', '/blog/privacy-risks-online-pdf-tools', '/privacy', '/pdf-tools'],
  '/support': ['/pdf-tools', '/image-tools', '/privacy', '/blog'],
  '/privacy': ['/pdf-tools', '/image-tools', '/blog/how-filepilot-keeps-documents-private'],
  '/terms': ['/privacy', '/pdf-tools', '/image-tools'],
};

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

const schemaTypeForRoute = (route, category) => {
  if (route === '/') return 'WebSite';
  if (route.startsWith('/blog/')) return 'Article';
  if (route === '/blog') return 'CollectionPage';
  if (['/privacy', '/terms', '/support'].includes(route)) return 'WebPage';
  if (['/pdf-tools', '/image-tools', '/image-workflows', '/ai-tools'].includes(route)) return 'CollectionPage';
  if (category) return 'WebApplication';
  return 'WebPage';
};

const withSeoFields = (entry) => ({
  ...entry,
  path: entry.route,
  indexable: entry.indexable ?? true,
  canonicalUrl: canonicalUrlForRoute(entry.canonicalRoute ?? entry.route),
  shortIntro: entry.shortIntro ?? entry.description,
  relatedTools: entry.relatedTools ?? RELATED_ROUTES[entry.route] ?? DEFAULT_RELATED_ROUTES,
  schemaType: entry.schemaType ?? schemaTypeForRoute(entry.route, entry.category),
  sitemapPriority: entry.sitemapPriority ?? entry.priority ?? '0.8',
});

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
        indexable: true,
        title: INDEXABLE_ALIAS_ROUTE_SEO[route]?.title ?? toToolSeoTitle(title),
        description: INDEXABLE_ALIAS_ROUTE_SEO[route]?.description ?? toToolDescription({ title, description, category }),
        h1: INDEXABLE_ALIAS_ROUTE_SEO[route]?.h1 ?? title,
        shortIntro: INDEXABLE_ALIAS_ROUTE_SEO[route]?.description ?? description,
        category,
        canonicalRoute: isAlias ? route : canonicalSlug ?? route,
        relatedTools: RELATED_ROUTES[route],
        schemaType: 'WebApplication',
        lastmod: '2026-06-28',
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
].map(withSeoFields);

export const getRouteSeo = (route) => {
  const normalizedRoute = normalizeRoute(route);
  return getRouteSeoEntries().find((entry) => entry.route === normalizedRoute) ?? CORE_ROUTE_SEO['/'];
};

export const getSitemapEntries = () => {
  return getRouteSeoEntries().map((seo) => ({
    route: seo.route,
    loc: canonicalUrlForRoute(seo.route),
    lastmod: seo.lastmod,
    changefreq: seo.changefreq ?? 'monthly',
    priority: seo.sitemapPriority ?? seo.priority ?? '0.8',
  }));
};

export const getPrioritySitemapEntries = () => {
  const sitemapEntries = getSitemapEntries();
  return PRIORITY_SEO_ROUTES.map((route) => sitemapEntries.find((entry) => entry.route === route)).filter(Boolean);
};

export const getNonIndexableRouteEntries = () => {
  const source = readFileSync(TOOL_REGISTRY_PATH, 'utf8');
  const hiddenSlugs = extractSet(source, 'hiddenToolSlugs');
  const comingSoonSlugs = extractSet(source, 'comingSoonToolSlugs');
  const indexableRoutes = new Set(getSeoRoutes());
  const toolBlocks = source.match(/\{\s*slug: '[^']+'[\s\S]*?\n  \}/g) ?? [];

  return toolBlocks
    .map((block) => {
      const route = getBlockValue(block, 'slug');
      const title = getBlockValue(block, 'title');
      const canonicalSlug = getBlockValue(block, 'canonicalSlug');
      const isAlias = block.includes("visibility: 'alias'");
      if (!route || indexableRoutes.has(route)) return null;

      return {
        route,
        title,
        indexable: false,
        reason: hiddenSlugs.has(route)
          ? 'hidden'
          : comingSoonSlugs.has(route)
            ? 'coming-soon'
            : isAlias
              ? `duplicate alias of ${canonicalSlug}`
              : 'not in indexable registry',
        canonicalRoute: canonicalSlug,
      };
    })
    .filter(Boolean);
};
