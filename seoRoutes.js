import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { BRAND_SUFFIX, toolContent } from './src/data/toolContent.ts';
import { siteContent } from './src/data/siteContent.ts';

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

// Phase 1 SEO focus set: low-competition, winnable long-tail tools.
// These are boosted in the sitemap and can be submitted to IndexNow via
// `npm run indexnow:submit:tail`. See docs/PRIORITY_TOOLS.md for the
// target keyword for each route and the rationale. Keep this list to the
// dozen tools we are actively optimizing so the priority signal stays meaningful.
export const PRIORITY_TAIL_ROUTES = [
  '/pdf-to-cbz',
  '/posterize-pdf',
  '/n-up-pdf',
  '/add-page-labels',
  '/image-to-svg',
  '/combine-single-page',
  '/pdf-to-greyscale',
  '/remove-image-metadata',
  '/flatten-pdf',
  '/json-to-pdf',
  '/markdown-to-pdf',
  '/pdf-to-zip',
];

const PRIORITY_TAIL_ROUTE_SET = new Set(PRIORITY_TAIL_ROUTES);

// Sitemap priority for the focus tools. Above the 0.8 tool default but below
// the 0.9 category hubs, so the relative importance ordering stays honest.
const PRIORITY_TAIL_SITEMAP_PRIORITY = '0.85';

// Title, description, H1 and intro for every non-tool route live in
// src/data/siteContent.ts so the prerenderer and each page's <PageSeo> render
// identical values. Only the crawl hints (lastmod/changefreq/priority) are
// build-time concerns and stay here.
const fromSiteContent = (route) => {
  const entry = siteContent[route];
  if (!entry) throw new Error(`seoRoutes: no siteContent entry for "${route}"`);
  return {
    title: entry.title,
    description: entry.description,
    h1: entry.h1,
    ...(entry.intro ? { shortIntro: entry.intro } : {}),
    ...(entry.faqs ? { faqs: entry.faqs } : {}),
  };
};

const CORE_ROUTE_SEO = {
  '/': { ...fromSiteContent('/'), changefreq: 'weekly', priority: '1.0' },
  '/pdf-tools': { ...fromSiteContent('/pdf-tools'), changefreq: 'weekly', priority: '0.9' },
  '/image-tools': { ...fromSiteContent('/image-tools'), changefreq: 'weekly', priority: '0.9' },
  '/image-workflows': { ...fromSiteContent('/image-workflows'), changefreq: 'weekly', priority: '0.75' },
  '/ai-tools': { ...fromSiteContent('/ai-tools'), changefreq: 'weekly', priority: '0.75' },
  '/blog': { ...fromSiteContent('/blog'), changefreq: 'monthly', priority: '0.6' },
  '/support': { ...fromSiteContent('/support'), changefreq: 'monthly', priority: '0.4' },
  '/privacy': { ...fromSiteContent('/privacy'), changefreq: 'yearly', priority: '0.3' },
  '/terms': { ...fromSiteContent('/terms'), changefreq: 'yearly', priority: '0.3' },
};

const BLOG_ROUTE_SEO = {
  '/blog/why-files-stay-in-browser': { ...fromSiteContent('/blog/why-files-stay-in-browser'), changefreq: 'yearly', priority: '0.5' },
  '/blog/privacy-risks-online-pdf-tools': { ...fromSiteContent('/blog/privacy-risks-online-pdf-tools'), changefreq: 'yearly', priority: '0.5' },
  '/blog/how-filepilot-keeps-documents-private': { ...fromSiteContent('/blog/how-filepilot-keeps-documents-private'), changefreq: 'yearly', priority: '0.5' },
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

/**
 * `lastmod` is derived from git rather than hand-maintained.
 *
 * It used to be a hard-coded date per route, which silently went stale: the
 * July content rewrite changed every tool page's title, H1, FAQs and HowTo
 * schema while the sitemap kept telling crawlers "unchanged since 2026-06-28".
 * A wrong-but-old lastmod actively suppresses recrawls, so it is worse than
 * none. Now each route reports the commit date of the files its copy comes from.
 */
const gitLastModified = (relativePaths) => {
  let newest = null;
  for (const relativePath of relativePaths) {
    try {
      const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', relativePath], {
        cwd: new URL('./', import.meta.url),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (date && (!newest || date > newest)) newest = date;
    } catch {
      // git unavailable (tarball export, shallow checkout without history)
    }
  }
  return newest;
};

const TODAY = new Date().toISOString().slice(0, 10);
const lastmodCache = new Map();

const lastmodForRoute = (route) => {
  const sources = route.startsWith('/blog/')
    ? ['src/data/siteContent.ts', `src/pages/blog/${BLOG_COMPONENTS[route] ?? ''}`]
    : CORE_ROUTE_SEO[route]
      ? ['src/data/siteContent.ts', 'seoRoutes.js']
      : ['src/data/toolContent.ts', 'src/data/toolRegistry.ts'];

  const key = sources.join('|');
  if (!lastmodCache.has(key)) lastmodCache.set(key, gitLastModified(sources.filter(Boolean)) ?? TODAY);
  return lastmodCache.get(key);
};

const BLOG_COMPONENTS = {
  '/blog/why-files-stay-in-browser': 'WhyFilesStayInBrowser.tsx',
  '/blog/privacy-risks-online-pdf-tools': 'PrivacyRisksOnlinePdfTools.tsx',
  '/blog/how-filepilot-keeps-documents-private': 'HowFilepilotKeepsDocumentsPrivate.tsx',
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
  // Phase 1 focus tools: curated topical siblings instead of the generic
  // DEFAULT_RELATED_ROUTES fallback, so link equity flows between genuinely
  // related tools rather than back to the same head-term pages every time.
  '/pdf-to-cbz': ['/pdf-to-images', '/pdf-to-zip', '/extract-images', '/images-to-pdf'],
  '/posterize-pdf': ['/n-up-pdf', '/pdf-booklet', '/fix-page-size', '/crop-pdf'],
  '/n-up-pdf': ['/posterize-pdf', '/pdf-booklet', '/combine-single-page', '/grid-combine'],
  '/add-page-labels': ['/page-numbers', '/organize-pdf', '/bookmark', '/pdf-metadata'],
  '/image-to-svg': ['/convert-image', '/favicon-generator', '/pdf-to-svg', '/compress-image'],
  '/combine-single-page': ['/merge', '/n-up-pdf', '/grid-combine', '/pdf-to-images'],
  '/pdf-to-greyscale': ['/compress', '/pdf-to-images', '/flatten-pdf', '/pdf-to-jpg'],
  '/remove-image-metadata': ['/pdf-metadata', '/compress-image', '/blur-face', '/privacy'],
  '/flatten-pdf': ['/form-filler', '/form-creator', '/pdf-security', '/redact-pdf'],
  '/json-to-pdf': ['/markdown-to-pdf', '/text-to-pdf', '/pdf-to-json', '/pdf-to-markdown'],
  '/markdown-to-pdf': ['/json-to-pdf', '/text-to-pdf', '/pdf-to-markdown', '/pdf-to-json'],
  '/pdf-to-zip': ['/split', '/merge', '/extract-pages', '/pdf-to-cbz'],

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
  sitemapPriority: PRIORITY_TAIL_ROUTE_SET.has(entry.route)
    ? PRIORITY_TAIL_SITEMAP_PRIORITY
    : entry.sitemapPriority ?? entry.priority ?? '0.8',
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

      // toolContent is the shared source of truth: PageSeo (client) reads the same
      // seoTitle/seoDescription via toolSeo(), so the prerendered <title> and the
      // title React sets at runtime stay identical instead of fighting each other.
      const sharedContent = toolContent[route];
      const sharedTitle = sharedContent?.seoTitle ? `${sharedContent.seoTitle}${BRAND_SUFFIX}` : null;

      return {
        route,
        indexable: true,
        title: INDEXABLE_ALIAS_ROUTE_SEO[route]?.title ?? sharedTitle ?? toToolSeoTitle(title),
        description:
          INDEXABLE_ALIAS_ROUTE_SEO[route]?.description
          ?? sharedContent?.seoDescription
          ?? toToolDescription({ title, description, category }),
        h1: INDEXABLE_ALIAS_ROUTE_SEO[route]?.h1 ?? sharedContent?.h1 ?? title,
        shortIntro: INDEXABLE_ALIAS_ROUTE_SEO[route]?.description ?? description,
        category,
        canonicalRoute: isAlias ? route : canonicalSlug ?? route,
        relatedTools: RELATED_ROUTES[route],
        schemaType: 'WebApplication',
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
    lastmod: seo.lastmod ?? lastmodForRoute(seo.route),
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
