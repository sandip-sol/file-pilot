/**
 * Post-build prerender script.
 *
 * Writes a static, crawler-facing HTML body into each route's index.html —
 * title, description, canonical, JSON-LD and a real content block built from
 * `siteContent.ts` / `toolContent.ts`. The same data drives the client's
 * <PageSeo>, so the prerendered HTML and the DOM React renders agree.
 *
 * This used to also drive the app through Puppeteer and save the rendered
 * page. That pass was a no-op: `withRouteSeo` overwrites #root with the static
 * block afterwards, so the only thing Puppeteer contributed was ~120 lines of
 * runtime-injected component CSS. It was removed — it cost a Chrome launch and
 * 95 page loads per build and produced no crawlable content. Do not
 * reintroduce it without also removing the #root overwrite.
 *
 * Usage:  node prerender.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SITE_URL, canonicalUrlForRoute, getRouteSeo, getRouteSeoEntries, getSeoRoutes, getSitemapEntries, isToolRoute } from './seoRoutes.js';
import { toolContent } from './src/data/toolContent.ts';
import { comparisonContent } from './src/data/comparisons.ts';
import { GITHUB_REPO_URL, aboutSections, maintainer, pressKit } from './src/data/aboutContent.ts';
import { blogDateLabel, blogPosts, blogPostsByDate } from './src/data/blogContent.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');

const ROUTES = getSeoRoutes();
const INDEXABLE_ROBOTS = 'index,follow';
const NOINDEX_ROBOTS = 'noindex,follow';
const CATEGORY_HUBS = {
  'organize-manage': { route: '/pdf-tools', label: 'PDF Tools' },
  'edit-annotate': { route: '/pdf-tools', label: 'PDF Tools' },
  'convert-to-pdf': { route: '/pdf-tools', label: 'PDF Tools' },
  'convert-from-pdf': { route: '/pdf-tools', label: 'PDF Tools' },
  'optimize-repair': { route: '/pdf-tools', label: 'PDF Tools' },
  'secure-pdf': { route: '/pdf-tools', label: 'PDF Tools' },
  'image-tools': { route: '/image-tools', label: 'Image Tools' },
  'ai-tools': { route: '/ai-tools', label: 'AI Image Tools' },
  workflows: { route: '/image-workflows', label: 'Image Workflows' },
};
const PDF_CATEGORIES = new Set([
  'organize-manage',
  'edit-annotate',
  'convert-to-pdf',
  'convert-from-pdf',
  'optimize-repair',
  'secure-pdf',
]);
const IMAGE_CATEGORIES = new Set(['image-tools', 'workflows', 'ai-tools']);

const HOME_HUBS = ['/pdf-tools', '/image-tools', '/image-workflows', '/ai-tools'];

const STANDALONE_PAGE_ROUTES = new Set(['/support', '/privacy', '/terms']);

/**
 * Profiles that prove FilePilot-the-site is a real, distinct entity.
 *
 * "FilePilot" is a saturated name. It collides with the File Pilot Windows
 * Explorer replacement (filepilot.tech — the dominant entity, with XDA and
 * MajorGeeks coverage), a GitHub project, an iOS app, AND three sites in the
 * same category: filepilot.org, filepilot.online and filepilottools.top.
 * Google has no reason to treat this domain as distinct without corroborating
 * URLs it can crawl and match back here.
 *
 * ADD EVERY PROFILE YOU CONTROL AS YOU CREATE IT. Product Hunt, X, Reddit,
 * LinkedIn, Mastodon, an AlternativeTo listing — each one is both a `sameAs`
 * edge and a backlink, which is the Phase 2 bottleneck anyway. This list is the
 * single place to add them; the homepage Organization schema picks them up.
 */
const ORGANIZATION_PROFILES = [
  'https://github.com/sandip-sol/file-pilot',
];
const isNetlifyPreview =
  process.env.NETLIFY === 'true' && process.env.CONTEXT && process.env.CONTEXT !== 'production';
const shouldRenderBingVerification =
  Boolean(process.env.BING_SITE_VERIFICATION) &&
  (process.env.CONTEXT === 'production' || process.env.ALLOW_BING_VERIFICATION_IN_NON_PRODUCTION === 'true');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function withRouteSeo(html, route) {
  const canonicalUrl = canonicalUrlForRoute(route);
  const { title, description } = getRouteSeo(route);
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const robots = isNetlifyPreview ? NOINDEX_ROBOTS : INDEXABLE_ROBOTS;
  const staticSeo = `<div id="root">${buildStaticRouteContent(route)}</div>`;

  let nextHtml = html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapedDescription}">`)
    .replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/, `<meta name="robots" content="${robots}">`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonicalUrl}">`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapedTitle}">`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapedDescription}">`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}">`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapedTitle}">`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapedDescription}">`)
    // Tolerant of the id attribute so a re-run over an already-prerendered dist
    // replaces its own previous output instead of leaving it in place. The
    // homepage writes back to dist/index.html, which is also the template every
    // other route is built from, so this regex must match what buildJsonLd emits.
    .replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i, buildJsonLd(route))
    .replace('<div id="root"></div>', staticSeo);

  if (/<body>\s*<div id="root">[\s\S]*<\/div>\s*<noscript>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(
      /<body>\s*<div id="root">[\s\S]*<\/div>\s*<noscript>/i,
      `<body>\n  ${staticSeo}\n  <noscript>`,
    );
  } else if (/<div id="root">\s*<div data-static-seo="true" class="static-seo">[\s\S]*?<\/div>\s*<\/div>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(
      /<div id="root">\s*<div data-static-seo="true" class="static-seo">[\s\S]*?<\/div>\s*<\/div>/i,
      staticSeo,
    );
  }

  // The id="page-schema" strip that used to live here was removed: buildJsonLd
  // now emits that id itself, so stripping it would delete the only structured
  // data on the page.
  nextHtml = nextHtml
    .replace(/\n?<link\s+rel="modulepreload"[^>]*>/gi, '');

  nextHtml = withBingVerification(nextHtml);

  return nextHtml;
}

function withBingVerification(html) {
  const withoutExistingTag = html.replace(/\n?\s*<meta\s+name="msvalidate\.01"\s+content="[^"]*"\s*\/?>/g, '');
  if (!shouldRenderBingVerification) return withoutExistingTag;

  const content = escapeHtml(process.env.BING_SITE_VERIFICATION.trim());
  if (!content) return withoutExistingTag;

  return withoutExistingTag.replace('</head>', `  <meta name="msvalidate.01" content="${content}" />\n</head>`);
}

function stripBrand(value) {
  return value
    .replace(/\s+\|\s+FilePilot$/i, '')
    .replace(/\s+-\s+FilePilot$/i, '')
    .trim();
}

function routeEntry(route) {
  return getRouteSeoEntries().find((entry) => entry.route === route);
}

function categoryHubForRoute(route) {
  return CATEGORY_HUBS[routeEntry(route)?.category];
}

function routeLabel(route) {
  const seo = getRouteSeo(route);
  return seo.h1 ?? stripBrand(seo.title);
}

function linkList(routes, limit = 5) {
  return routes
    .filter((route) => ROUTES.includes(route))
    .slice(0, limit)
    .map((route) => `<li><a href="${canonicalUrlForRoute(route)}">${escapeHtml(routeLabel(route))}</a></li>`)
    .join('');
}

function relatedRoutesFor(route) {
  const seo = getRouteSeo(route);
  const hub = categoryHubForRoute(route)?.route;
  return [...new Set([hub, ...(seo.relatedTools ?? [])])]
    .filter(Boolean)
    .filter((relatedRoute) => relatedRoute !== route && ROUTES.includes(relatedRoute))
    .slice(0, 5);
}

function getFaqItems(route) {
  // Core routes carry their own authored FAQs in siteContent.ts (the homepage
  // does). Tool routes fall through to toolContent.ts or the generic template.
  const coreFaqs = getRouteSeo(route)?.faqs;
  if (coreFaqs?.length) return coreFaqs;
  if (!isToolRoute(route)) return [];

  const seo = getRouteSeo(route);
  const content = toolContent[route];

  // Tool-specific FAQs win over the generic template. The same array is passed to
  // PageSeo on the client, so only one set of FAQ content exists per tool.
  if (content?.faqs?.length) return content.faqs;
  const title = routeLabel(route);
  const action = content?.action ?? seo.h1 ?? title.toLowerCase();
  const category = routeEntry(route)?.category ?? '';
  const isImageTool = IMAGE_CATEGORIES.has(category);
  const fileNoun = isImageTool ? 'images' : 'PDF files';

  return [
    {
      question: `Is it safe to ${action} online?`,
      answer: `${title} runs in your browser, so your ${fileNoun} stay on your device instead of being uploaded to FilePilot servers. That makes it suitable for private documents, work files, personal photos, and other sensitive material.`,
    },
    {
      question: `Are my files uploaded when I use ${title}?`,
      answer: `No. The tool uses local browser APIs and client-side libraries to process the file in memory. Closing the tab clears the working state from the browser session.`,
    },
    {
      question: `Does ${title} reduce quality?`,
      answer: category === 'optimize-repair' || route.includes('compress')
        ? `${title} is designed to reduce file size while keeping output usable. Where quality settings are available, choose a higher quality level for print or archive copies.`
        : `${title} preserves the original content wherever the operation allows it. Conversion and resizing tools may expose quality or size controls so you can choose the best output for your use case.`,
    },
    {
      question: `Can I use ${title} without installing software?`,
      answer: `Yes. FilePilot is a web app, so you can open the tool in a modern browser, complete the job, and download the result without installing a desktop PDF or image editor.`,
    },
  ];
}

function buildFaqSchema(route) {
  const faqItems = getFaqItems(route);
  if (!faqItems.length) return null;

  return {
    '@type': 'FAQPage',
    '@id': nodeId(route, 'faq'),
    // Attaches the questions to the page entity. Without this the FAQPage was a
    // second, competing page-level node for the same URL.
    mainEntityOfPage: { '@id': nodeId(route, 'webpage') },
    inLanguage: 'en',
    mainEntity: faqItems.map((item, index) => ({
      '@type': 'Question',
      '@id': nodeId(route, `faq-${index + 1}`),
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function howToStepName(text) {
  const clean = text.replace(/\s+/g, ' ').trim().replace(/[.。]$/, '');
  const commaIdx = clean.indexOf(',');
  let name = commaIdx > 10 && commaIdx < 60 ? clean.slice(0, commaIdx) : clean;
  if (name.length > 60) {
    name = name.slice(0, 60);
    const lastSpace = name.lastIndexOf(' ');
    if (lastSpace > 20) name = name.slice(0, lastSpace);
  }
  return name;
}

function buildHowToSchema(route) {
  if (!isToolRoute(route)) return null;

  const steps = toolSteps(route);
  if (!steps.length) return null;

  const seo = getRouteSeo(route);
  const title = routeLabel(route);
  const content = toolContent[route];
  const action = content?.action ?? seo.h1 ?? title.toLowerCase();
  const url = canonicalUrlForRoute(route);

  return {
    '@type': 'HowTo',
    '@id': nodeId(route, 'howto'),
    name: `How to ${action} with FilePilot`,
    description: `Step-by-step guide to ${action} privately in your browser using ${title}. Processing runs locally on your device with no file uploads.`,
    inLanguage: 'en',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    // References the real app node instead of restating the name as a bare
    // HowToTool, so the procedure has a stated subject.
    tool: { '@id': nodeId(route, 'app') },
    mainEntityOfPage: { '@id': nodeId(route, 'webpage') },
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: howToStepName(step),
      text: step,
      url: `${url}#step-${index + 1}`,
    })),
  };
}

function toolIntro(route) {
  const seo = getRouteSeo(route);
  const entry = routeEntry(route);
  const content = toolContent[route];
  const title = routeLabel(route);
  const hub = categoryHubForRoute(route);
  const relatedLabels = relatedRoutesFor(route).map(routeLabel).filter((label) => label !== title).slice(0, 3);
  const useCases = content?.useCases?.slice(0, 4) ?? [];
  const baseIntro = content?.intro ?? `${title} helps you ${seo.description.replace(/\.$/, '').toLowerCase()} from a browser tab.`;
  const categoryText = hub
    ? `${title} sits in FilePilot's ${hub.label.toLowerCase()} collection, so it is easy to move between this task and nearby tools such as ${relatedLabels.join(', ') || 'related conversion and editing tools'}.`
    : `${title} is part of FilePilot's privacy-first browser toolkit.`;
  const useCaseText = useCases.length
    ? `It is useful when you need to ${useCases.map((item) => item.replace(/\.$/, '').toLowerCase()).join('; ')}.`
    : `It is useful for preparing files for email, archiving, review, printing, publishing, or sharing without routing the original through a remote upload queue.`;
  const privacyText = `The work happens locally in your browser using client-side processing, which keeps your files on your device and gives crawlers a clear plain-text description of what this page does before the interactive app loads.`;
  const workflowText = content?.steps?.length
    ? `The workflow is straightforward: ${content.steps.map((step) => step.replace(/\.$/, '').toLowerCase()).join('; ')}.`
    : `Choose your file, review the available settings, preview the result where the tool supports it, and download the finished file when you are ready.`;

  return [baseIntro, categoryText, useCaseText, workflowText, privacyText]
    .filter(Boolean)
    .join(' ');
}

function toolSteps(route) {
  const content = toolContent[route];
  if (content?.steps?.length) return content.steps.slice(0, 5);

  const title = routeLabel(route);
  return [
    `Choose the file or files you want to use with ${title}.`,
    'Adjust the available settings for page order, quality, size, format, or output options.',
    'Preview the result where available and make any final changes.',
    'Download the finished file from your browser.',
  ];
}

function toolUseCases(route) {
  return toolContent[route]?.useCases?.slice(0, 5) ?? [
    'Prepare files for email, upload forms, print workflows, or internal review.',
    'Clean up documents before sharing them with clients, colleagues, or family.',
    'Convert, organize, or optimize files without installing a separate desktop app.',
  ];
}

function faqList(route) {
  return getFaqItems(route)
    .map((item) => `<li><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.answer)}</p></li>`)
    .join('');
}

function orderedList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function stepsList(items) {
  return items
    .map((item, index) => `<li id="step-${index + 1}">${escapeHtml(item)}</li>`)
    .join('');
}

function comparisonSection(route) {
  const comparison = toolContent[route]?.comparison;
  if (!comparison) return '';

  return `
      <section>
        <h2>${escapeHtml(comparison.heading)}</h2>
        <p>${escapeHtml(comparison.body)}</p>
      </section>`;
}

function categoryToolRoutesForHub(route) {
  const entries = getRouteSeoEntries().filter((entry) => entry.category);
  if (route === '/pdf-tools') return entries.filter((entry) => PDF_CATEGORIES.has(entry.category)).map((entry) => entry.route);
  if (route === '/image-tools') return entries.filter((entry) => IMAGE_CATEGORIES.has(entry.category)).map((entry) => entry.route);
  if (route === '/image-workflows') return entries.filter((entry) => entry.category === 'workflows').map((entry) => entry.route);
  if (route === '/ai-tools') return entries.filter((entry) => entry.category === 'ai-tools').map((entry) => entry.route);
  return [];
}

/** Dates come from the post data; dateModified from the git-derived sitemap lastmod. */
function articleDates(route) {
  const published = blogPosts[route]?.published;
  // The author-declared revision date wins over the git-derived sitemap lastmod:
  // a commit that only touches links is not a content update.
  const lastmod = getSitemapEntries().find((entry) => entry.route === route)?.lastmod;
  let modified = blogPosts[route]?.updated ?? lastmod;

  // The sitemap lastmod is git's `%cs` — a bare date. When it lands on the same
  // day the post was published, it is the same commit, so the published
  // timestamp restores the time component without asserting anything new.
  if (modified && published && modified === published.slice(0, 10)) modified = published;

  return {
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
  };
}

/**
 * ---------------------------------------------------------------------------
 * JSON-LD graph
 * ---------------------------------------------------------------------------
 *
 * Every page emits the same "spine" nodes — Organization, WebSite, the
 * suite-level SoftwareApplication, the OG image, and the maintainer Person when
 * one is configured — followed by page-specific nodes built on top.
 *
 * INVARIANT: an `{ '@id': X }` reference may only point at a spine id or at an
 * id minted for the route currently being built. Structured data is evaluated
 * per URL, so a reference to a node defined on some *other* page resolves to
 * nothing. That is what used to be broken here: 109 of 110 pages pointed
 * `isPartOf` and `publisher` at `#website` / `#organization`, two nodes that
 * only ever existed on the homepage. Cross-page pointers use a plain URL
 * string, which is always resolvable, or emit a stub node for the target.
 */

const ORG_ID = `${SITE_URL}#organization`;
const WEBSITE_ID = `${SITE_URL}#website`;
const SUITE_APP_ID = `${SITE_URL}#app`;
const LOGO_ID = `${SITE_URL}#logo`;
const OG_IMAGE_ID = `${SITE_URL}#og`;
const PERSON_ID = `${SITE_URL}#person`;

const HUB_ROUTES = ['/pdf-tools', '/image-tools', '/image-workflows', '/ai-tools'];

/** Google's least-specific classification is the same for all 84 tools; this narrows it. */
const APPLICATION_SUBCATEGORY = {
  'organize-manage': 'PDF organiser',
  'edit-annotate': 'PDF editor',
  'convert-to-pdf': 'PDF converter',
  'convert-from-pdf': 'PDF converter',
  'optimize-repair': 'PDF optimiser',
  'secure-pdf': 'PDF security',
  'image-tools': 'Image editor',
  workflows: 'Image workflow',
  'ai-tools': 'AI image tool',
};

/** Fragment-scoped node id, so no @id is hand-typed anywhere below. */
function nodeId(route, fragment) {
  return `${canonicalUrlForRoute(route)}#${fragment}`;
}

/**
 * Tool routes whose category maps to `hubRoute`, using the same CATEGORY_HUBS
 * mapping the breadcrumbs use — so a tool's hub ItemList membership and its
 * breadcrumb trail can never disagree.
 *
 * Deliberately not `categoryToolRoutesForHub`, which buckets all image
 * categories under /image-tools for the HTML link lists.
 */
function toolsForHub(hubRoute) {
  return getRouteSeoEntries()
    .filter((entry) => entry.category && CATEGORY_HUBS[entry.category]?.route === hubRoute)
    .filter((entry) => ROUTES.includes(entry.route))
    .map((entry) => entry.route);
}

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'FilePilot',
    alternateName: ['FilePilot File Tools', 'filepilot.space'],
    url: SITE_URL,
    // Google's logo guidance accepts .jpg/.png/.gif only. This was an SVG, so
    // the property was being dropped and the site had no logo association.
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: `${SITE_URL}icon-512.png`,
      contentUrl: `${SITE_URL}icon-512.png`,
      width: 512,
      height: 512,
      caption: 'FilePilot',
    },
    image: { '@id': LOGO_ID },
    description: 'FilePilot is a free, privacy-first web app offering browser-based PDF, image, and file tools that process files locally on your device without uploads. It is a website, not a desktop application, and is not affiliated with the File Pilot Windows file manager, the FilePilot iOS app, or any similarly named file-tool site.',
    // The property built for entities that collide by name. "FilePilot" competes
    // with a Windows file manager, an iOS app and three positioning clones.
    disambiguatingDescription: 'A free web app at filepilot.space for browser-based PDF and image editing. Not the File Pilot Windows file manager at filepilot.tech, not the FilePilot iOS app, and not affiliated with filepilot.org, filepilot.online or filepilottools.top.',
    knowsAbout: [
      'browser-based PDF editing',
      'client-side image processing',
      'privacy-preserving file conversion',
      'WebAssembly document processing',
    ],
    // sameAs is how Google links this site to a known entity. Without it the
    // "FilePilot" name is ambiguous — it collides with a Windows file
    // manager, an iOS app and several other file-tool sites.
    sameAs: ORGANIZATION_PROFILES,
    foundingDate: '2026',
    contactPoint: {
      '@type': 'ContactPoint',
      '@id': `${SITE_URL}#contact`,
      contactType: 'customer support',
      url: canonicalUrlForRoute('/support'),
      availableLanguage: 'en',
    },
    termsOfService: canonicalUrlForRoute('/terms'),
    ...(maintainer ? { founder: { '@id': PERSON_ID } } : {}),
    // A URL string, not an @id: the /about page node does not exist in this graph.
    mainEntityOfPage: canonicalUrlForRoute('/about'),
  };
}

function webSiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: 'FilePilot',
    alternateName: 'filepilot.space',
    description: getRouteSeo('/').description,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
    copyrightHolder: { '@id': ORG_ID },
    // No potentialAction/SearchAction: there is no /search?q= route. Declaring a
    // sitelinks searchbox that resolves to a 404 causes the feature to be withheld.
  };
}

/** The suite. Every per-tool app node declares `isPartOf` this, which is what
 *  turns 84 otherwise-orphan tool pages into one product family. */
function suiteAppNode() {
  return {
    '@type': ['SoftwareApplication', 'WebApplication'],
    '@id': SUITE_APP_ID,
    name: 'FilePilot',
    url: SITE_URL,
    description: getRouteSeo('/').description,
    applicationCategory: 'UtilityApplication',
    applicationSubCategory: 'Document and image editing',
    operatingSystem: 'Web browser (Chrome, Edge, Firefox, Safari)',
    browserRequirements: 'Requires JavaScript and a browser with WebAssembly support.',
    permissions: "No account required. No file upload. Files are read into browser memory and processed on the user's own device.",
    isAccessibleForFree: true,
    inLanguage: 'en',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    featureList: HOME_HUBS.map((hub) => routeLabel(hub)),
    screenshot: { '@id': OG_IMAGE_ID },
    provider: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    // No aggregateRating. Self-authored ratings for your own product have been
    // ineligible for rich results since 2019 and inventing counts is a
    // manual-action risk. Add it only when real third-party reviews exist.
  };
}

function ogImageNode() {
  return {
    '@type': 'ImageObject',
    '@id': OG_IMAGE_ID,
    url: `${SITE_URL}og-image.png`,
    contentUrl: `${SITE_URL}og-image.png`,
    width: 1200,
    height: 630,
    caption: 'FilePilot — private, browser-based PDF and image tools that never upload your files',
  };
}

/**
 * Blog posts point at their own artwork when they have some and at the shared
 * brand card when they do not. The fallback is deliberate rather than lazy: a
 * generic card at least resolves to a real ImageObject with dimensions, whereas
 * a bare URL string carries nothing a validator can check. It illustrates
 * nothing, though, so it buys no image-search or Discover placement — set
 * `image` in blogContent.ts per post to fix that.
 */
function articleImageId(route) {
  return blogPosts[route]?.image ? nodeId(route, 'image') : OG_IMAGE_ID;
}

/** The node itself, emitted only for posts that carry their own art. */
function articleImageNode(route) {
  const image = blogPosts[route]?.image;
  if (!image) return [];

  const url = `${SITE_URL}${image.src.replace(/^\//, '')}`;
  return [{
    '@type': 'ImageObject',
    '@id': nodeId(route, 'image'),
    url,
    contentUrl: url,
    width: image.width,
    height: image.height,
    caption: image.caption,
  }];
}

/**
 * A named person is the strongest E-E-A-T signal an anonymous utility site can
 * add, and doubles as entity disambiguation from the other "FilePilot"
 * products. Emitted only when a real maintainer is configured — never faked.
 */
function personNode() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: maintainer.name,
    jobTitle: maintainer.role,
    description: maintainer.bio[0],
    url: canonicalUrlForRoute('/about'),
    ...(maintainer.email ? { email: maintainer.email } : {}),
    ...(maintainer.profiles?.length
      ? { sameAs: maintainer.profiles.map((profile) => profile.url) }
      : {}),
    knowsAbout: [
      'client-side document processing',
      'PDF file format internals',
      'WebAssembly',
      'browser privacy',
    ],
    worksFor: { '@id': ORG_ID },
  };
}

/** Present on all 110 pages, so every reference below resolves. */
function spineNodes() {
  return [
    organizationNode(),
    webSiteNode(),
    suiteAppNode(),
    ogImageNode(),
    ...(maintainer ? [personNode()] : []),
  ];
}

/** `trail` is [{ name, route }]; the last entry omits `item` per Google's guidance. */
function breadcrumbNode(route, trail) {
  return {
    '@type': 'BreadcrumbList',
    '@id': nodeId(route, 'breadcrumb'),
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(index < trail.length - 1 ? { item: canonicalUrlForRoute(crumb.route) } : {}),
    })),
  };
}

function pageNode(route, type, extra = {}) {
  const seo = getRouteSeo(route);
  return {
    '@type': type,
    '@id': nodeId(route, 'webpage'),
    url: canonicalUrlForRoute(route),
    name: routeLabel(route),
    description: seo.description,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    primaryImageOfPage: { '@id': OG_IMAGE_ID },
    inLanguage: 'en',
    ...extra,
  };
}

/** Compact SoftwareApplication for a tool, used both on its own page and inside
 *  a hub's ItemList — same @id both times, so it is one entity, not two. */
function toolAppNode(route, { full }) {
  const seo = getRouteSeo(route);
  const category = getRouteSeoEntries().find((entry) => entry.route === route)?.category;
  const base = {
    '@type': ['SoftwareApplication', 'WebApplication'],
    '@id': nodeId(route, 'app'),
    // Short tool label only, never the <title>. Two nodes disagreeing about this
    // (the label vs. "… – Free & Private | FilePilot") was the duplicate-schema bug.
    name: routeLabel(route),
    url: canonicalUrlForRoute(route),
    description: seo.description,
    applicationCategory: 'UtilityApplication',
    ...(APPLICATION_SUBCATEGORY[category] ? { applicationSubCategory: APPLICATION_SUBCATEGORY[category] } : {}),
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    isPartOf: { '@id': SUITE_APP_ID },
  };

  if (!full) return { ...base, operatingSystem: 'Web browser' };

  return {
    ...base,
    operatingSystem: 'Web browser (Chrome, Edge, Firefox, Safari)',
    browserRequirements: 'Requires JavaScript and a browser with WebAssembly support.',
    permissions: 'No account required. No file upload. Files are processed locally in the browser.',
    inLanguage: 'en',
    provider: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@id': nodeId(route, 'webpage') },
  };
}

/** Full on /blog (with the post list); a stub on a post page so that post's
 *  `isPartOf` has something to resolve to. */
function blogNode({ full }) {
  const route = '/blog';
  const base = {
    '@type': 'Blog',
    '@id': nodeId(route, 'blog'),
    name: 'FilePilot Blog',
    url: canonicalUrlForRoute(route),
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  };

  if (!full) return base;

  return {
    ...base,
    description: getRouteSeo(route).intro ?? getRouteSeo(route).description,
    isPartOf: { '@id': WEBSITE_ID },
    blogPost: blogPostsByDate()
      .filter((post) => ROUTES.includes(post.route))
      .map((post) => ({
        '@type': 'BlogPosting',
        '@id': nodeId(post.route, 'article'),
        headline: getRouteSeo(post.route).h1 ?? routeLabel(post.route),
        url: canonicalUrlForRoute(post.route),
        image: { '@id': articleImageId(post.route) },
        ...(articleDates(post.route)),
        author: maintainer ? { '@id': PERSON_ID } : { '@id': ORG_ID },
      })),
  };
}

function buildJsonLd(route) {
  const seo = getRouteSeo(route);
  const url = canonicalUrlForRoute(route);
  const graph = spineNodes();
  const home = { name: 'FilePilot', route: '/' };

  if (route === '/') {
    graph.push(
      pageNode(route, 'WebPage', {
        about: { '@id': SUITE_APP_ID },
        mainEntity: { '@id': SUITE_APP_ID },
      }),
      {
        '@type': 'ItemList',
        '@id': nodeId(route, 'hubs'),
        name: 'FilePilot tool categories',
        numberOfItems: HOME_HUBS.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: HOME_HUBS.map((hub, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: routeLabel(hub),
          url: canonicalUrlForRoute(hub),
        })),
      },
    );
  } else if (HUB_ROUTES.includes(route)) {
    const tools = toolsForHub(route);
    graph.push(
      breadcrumbNode(route, [home, { name: routeLabel(route) }]),
      pageNode(route, 'CollectionPage', {
        breadcrumb: { '@id': nodeId(route, 'breadcrumb') },
        about: { '@id': SUITE_APP_ID },
        // A CollectionPage that collects nothing is a contradiction in terms;
        // this is the only machine-readable statement of what the hub contains.
        mainEntity: { '@id': nodeId(route, 'tools') },
      }),
      {
        '@type': 'ItemList',
        '@id': nodeId(route, 'tools'),
        name: routeLabel(route),
        numberOfItems: tools.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: tools.map((toolRoute, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: routeLabel(toolRoute),
          url: canonicalUrlForRoute(toolRoute),
          // Same @id the tool page publishes: one entity described in two places.
          item: toolAppNode(toolRoute, { full: false }),
        })),
      },
    );
  } else if (route === '/blog') {
    graph.push(
      breadcrumbNode(route, [home, { name: routeLabel(route) }]),
      pageNode(route, 'CollectionPage', {
        breadcrumb: { '@id': nodeId(route, 'breadcrumb') },
        mainEntity: { '@id': nodeId(route, 'blog') },
      }),
      blogNode({ full: true }),
    );
  } else if (route.startsWith('/blog/')) {
    graph.push(
      breadcrumbNode(route, [home, { name: 'Blog', route: '/blog' }, { name: routeLabel(route) }]),
      pageNode(route, 'WebPage', {
        breadcrumb: { '@id': nodeId(route, 'breadcrumb') },
        mainEntity: { '@id': nodeId(route, 'article') },
        primaryImageOfPage: { '@id': articleImageId(route) },
      }),
      blogNode({ full: false }),
      ...articleImageNode(route),
      {
        '@type': 'BlogPosting',
        '@id': nodeId(route, 'article'),
        headline: seo.h1 ?? routeLabel(route),
        description: seo.description,
        url,
        mainEntityOfPage: { '@id': nodeId(route, 'webpage') },
        image: { '@id': articleImageId(route) },
        inLanguage: 'en',
        // Was the dangling `#website`; now the Blog stub emitted just above.
        isPartOf: { '@id': nodeId('/blog', 'blog') },
        // A named author is a stronger E-E-A-T signal than a corporate byline,
        // but it must be a real person — falls back to the Organization until one
        // is configured in aboutContent.ts.
        author: maintainer ? { '@id': PERSON_ID } : { '@id': ORG_ID },
        publisher: { '@id': ORG_ID },
        ...(blogPosts[route]?.readTime ? { timeRequired: `PT${parseInt(blogPosts[route].readTime, 10) || 5}M` } : {}),
        ...(articleDates(route)),
      },
    );
  } else if (route === '/about') {
    graph.push(
      breadcrumbNode(route, [home, { name: 'About FilePilot' }]),
      pageNode(route, 'AboutPage', {
        breadcrumb: { '@id': nodeId(route, 'breadcrumb') },
        // Points at the spine Organization node rather than redeclaring it, so
        // Google reads one entity described in two places.
        mainEntity: { '@id': ORG_ID },
        about: { '@id': ORG_ID },
      }),
      {
        // The public repo is the site's verifiable claim — an entity, not a link.
        '@type': 'SoftwareSourceCode',
        '@id': nodeId(route, 'source'),
        name: 'FilePilot source code',
        codeRepository: GITHUB_REPO_URL,
        programmingLanguage: ['TypeScript', 'JavaScript'],
        targetProduct: { '@id': SUITE_APP_ID },
        about: { '@id': SUITE_APP_ID },
      },
    );
  } else if (comparisonContent[route]) {
    const entry = comparisonContent[route];
    const equivalents = entry.toolMap.filter((item) => ROUTES.includes(item.route));
    graph.push(
      breadcrumbNode(route, [
        home,
        { name: routeLabel('/pdf-tools'), route: '/pdf-tools' },
        { name: entry.h1 },
      ]),
      {
        // Deliberately WebPage, not Review/AggregateRating: FilePilot has no
        // ratings to report and inventing them is a manual-action risk.
        ...pageNode(route, 'WebPage', {
          name: entry.h1,
          breadcrumb: { '@id': nodeId(route, 'breadcrumb') },
          // The page is about OUR app and MENTIONS theirs, not the reverse.
          about: { '@id': SUITE_APP_ID },
          mentions: { '@id': nodeId(route, 'competitor') },
          mainEntity: { '@id': nodeId(route, 'alternatives') },
        }),
      },
      {
        '@type': 'SoftwareApplication',
        '@id': nodeId(route, 'competitor'),
        name: entry.competitor,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web browser',
        // No sameAs to their domain and no claims about their product.
      },
      {
        '@type': 'ItemList',
        '@id': nodeId(route, 'alternatives'),
        name: `FilePilot tools that replace ${entry.competitor}`,
        numberOfItems: equivalents.length,
        itemListElement: equivalents.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: routeLabel(item.route),
          url: canonicalUrlForRoute(item.route),
          item: toolAppNode(item.route, { full: false }),
        })),
      },
    );
  } else if (STANDALONE_PAGE_ROUTES.has(route)) {
    graph.push(
      breadcrumbNode(route, [home, { name: routeLabel(route) }]),
      pageNode(route, 'WebPage', {
        // Was '@type': 'PrivacyPolicy' for /privacy, which is not a schema.org
        // type — the node was unrecognised and silently discarded, on the one
        // page carrying the site's central claim. There is no `privacyPolicy`
        // property either; WebPage + about is the correct modelling.
        breadcrumb: { '@id': nodeId(route, 'breadcrumb') },
        about: { '@id': SUITE_APP_ID },
        ...(route === '/support'
          ? {
            potentialAction: {
              '@type': 'DonateAction',
              name: 'Support FilePilot',
              recipient: { '@id': ORG_ID },
              target: url,
            },
          }
          : {}),
      }),
    );
  } else if (isToolRoute(route)) {
    const entry = getRouteSeoEntries().find((e) => e.route === route);
    const hub = CATEGORY_HUBS[entry?.category];
    const trail = [home];
    if (hub) trail.push({ name: hub.label, route: hub.route });
    trail.push({ name: routeLabel(route) });

    graph.push(
      breadcrumbNode(route, trail),
      pageNode(route, 'WebPage', {
        breadcrumb: { '@id': nodeId(route, 'breadcrumb') },
        mainEntity: { '@id': nodeId(route, 'app') },
        about: { '@id': nodeId(route, 'app') },
      }),
      toolAppNode(route, { full: true }),
    );
  } else {
    // Anything routed that matches no archetype above still needs a page node,
    // or the FAQ/HowTo appended below would reference a #webpage that does not exist.
    graph.push(
      breadcrumbNode(route, [home, { name: routeLabel(route) }]),
      pageNode(route, 'WebPage', {
        breadcrumb: { '@id': nodeId(route, 'breadcrumb') },
      }),
    );
  }

  const faqSchema = buildFaqSchema(route);
  if (faqSchema) graph.push(faqSchema);

  const howToSchema = buildHowToSchema(route);
  if (howToSchema) graph.push(howToSchema);

  // Stable id so client-side route changes can address this block. PageSeo no
  // longer writes schema at all, so this is the single JSON-LD block per page.
  return `<script id="page-schema" type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}


/**
 * Renders a post's blocks as static HTML.
 *
 * This replaced a regex that scraped prose out of each post's JSX. That worked
 * while there were three posts written by hand; it was never going to survive
 * twelve. Blocks now come from blogContent.ts, which the React renderer reads
 * too, so the prerendered article and the rendered one are the same text by
 * construction rather than by a parser keeping up.
 */
function renderBlocks(blocks) {
  return blocks.map((block) => {
    if (block.type === 'ul' || block.type === 'ol') {
      return `<${block.type}>${block.items.map((item) => `<li>${withCanonicalLinks(item)}</li>`).join('')}</${block.type}>`;
    }
    if (block.type === 'callout') return `<blockquote><p>${withCanonicalLinks(block.html)}</p></blockquote>`;
    return `<${block.type}>${withCanonicalLinks(block.html)}</${block.type}>`;
  }).join('');
}

/**
 * Post prose links to routes as `/merge`. The prerendered HTML has to carry the
 * absolute, trailing-slash canonical form, or the internal-link gate in
 * seoValidate cannot match them and crawlers follow a redirect on every hop.
 */
function withCanonicalLinks(html) {
  return html.replace(/href="(\/[^"#]*)"/g, (match, route) => {
    const normalized = route.replace(/\/+$/, '') || '/';
    if (!getSeoRoutes().includes(normalized)) return match;
    return `href="${canonicalUrlForRoute(normalized)}"`;
  });
}

function blogPostContent(route) {
  const post = blogPosts[route];
  const byline = [
    maintainer ? `By ${escapeHtml(maintainer.name)}` : null,
    `Published ${escapeHtml(blogDateLabel(post.published))}`,
    post.updated && post.updated !== post.published ? `Updated ${escapeHtml(blogDateLabel(post.updated))}` : null,
    escapeHtml(post.readTime),
  ].filter(Boolean).join(' · ');

  return `
      <nav aria-label="Breadcrumb"><a href="${canonicalUrlForRoute('/')}">FilePilot</a> / <a href="${canonicalUrlForRoute('/blog')}">Blog</a> / <span>${escapeHtml(post.h1)}</span></nav>
      <h1>${escapeHtml(post.h1)}</h1>
      <p>${byline}</p>
      ${renderBlocks(post.blocks)}
      <section>
        <h2>Try it yourself</h2>
        <p><a href="${canonicalUrlForRoute(post.primaryTool)}">${escapeHtml(routeLabel(post.primaryTool))}</a> — runs in your browser, nothing is uploaded.</p>
      </section>
      ${post.faqs?.length ? `<section>
        <h2>Frequently asked questions</h2>
        <ul>${faqList(route)}</ul>
      </section>` : ''}
      <section>
        <h2>Keep reading</h2>
        <ul>${linkList(post.related, post.related.length)}</ul>
      </section>
    `;
}

function homeStaticContent() {
  const seo = getRouteSeo('/');
  const popular = [
    '/merge', '/split', '/compress', '/organize-pdf', '/images-to-pdf', '/pdf-to-images',
    '/extract-text', '/redact-pdf', '/compress-image', '/resize-image', '/convert-image',
    '/remove-background',
  ].filter((route) => getSeoRoutes().includes(route));

  return `
      <h1>${escapeHtml(seo.h1)}</h1>
      <p>${escapeHtml(seo.shortIntro ?? seo.description)}</p>
      <section>
        <h2>Your files never leave your device</h2>
        <p>Most online PDF and image tools upload your document to their servers, process it there, and send a copy back. That means your file is stored — however briefly — on hardware you do not control, handled by code you cannot audit, under a retention policy you have to take on trust. FilePilot works differently: it reads your file into browser memory and processes it locally using WebAssembly, the Canvas API and Web Workers. Nothing is transmitted, so there is no upload queue, no server-side copy and no account to create. You can verify it yourself in your browser's Network tab.</p>
      </section>
      <section>
        <h2>Browse tools by category</h2>
        <ul>${linkList(HOME_HUBS, HOME_HUBS.length)}</ul>
      </section>
      <section>
        <h2>Most-used tools</h2>
        <ul>${linkList(popular, popular.length)}</ul>
      </section>
      <section>
        <h2>Frequently asked questions</h2>
        <ul>${faqList('/')}</ul>
      </section>
      <section>
        <h2>Comparisons</h2>
        <ul>${linkList(Object.keys(comparisonContent), 4)}</ul>
      </section>
      <section>
        <h2>Read more</h2>
        <ul>${linkList(['/about', '/blog', '/blog/why-files-stay-in-browser', '/privacy', '/terms', '/support'], 6)}</ul>
      </section>
    `;
}


/** The blog index listed only two of the three posts, via the generic fallback. */
function blogIndexContent() {
  const seo = getRouteSeo('/blog');

  return `
      <nav aria-label="Breadcrumb"><a href="${canonicalUrlForRoute('/')}">FilePilot</a> / <span>${escapeHtml(routeLabel('/blog'))}</span></nav>
      <h1>${escapeHtml(seo.h1)}</h1>
      <p>${escapeHtml(seo.shortIntro ?? seo.description)}</p>
      <section>
        <h2>Start here</h2>
        <ul>${blogPostsByDate().filter((post) => post.cluster === 'pillar').map((post) => `<li><a href="${canonicalUrlForRoute(post.route)}">${escapeHtml(post.h1)}</a> — ${escapeHtml(post.description)}</li>`).join('')}</ul>
      </section>
      <section>
        <h2>All articles</h2>
        <ul>${blogPostsByDate().filter((post) => post.cluster !== 'pillar').map((post) => `<li><a href="${canonicalUrlForRoute(post.route)}">${escapeHtml(post.h1)}</a> — ${escapeHtml(blogDateLabel(post.published))} · ${escapeHtml(post.readTime)} — ${escapeHtml(post.description)}</li>`).join('')}</ul>
      </section>
      <section>
        <h2>Explore FilePilot</h2>
        <ul>${linkList(['/pdf-tools', '/image-tools', '/privacy'], 3)}</ul>
      </section>
    `;
}

/** Hub "Explore" links must not just repeat the category listing above them. */
function hubSiblings(route, relatedRoutes, categoryToolRoutes) {
  const filtered = relatedRoutes.filter((related) => !categoryToolRoutes.includes(related));
  if (filtered.length) return filtered;
  return [...HOME_HUBS.filter((hub) => hub !== route), '/blog'];
}


/**
 * Prerendered body for the "alternative to X" pages (Phase 1.3).
 *
 * These target commercial-intent keywords ("smallpdf alternative"), so the
 * comparison table, the honest limitations and the task→tool links all have to
 * be in the crawlable HTML rather than only in the React render.
 */
function comparisonStaticContent(route) {
  const entry = comparisonContent[route];
  const cell = (value) => escapeHtml(value);

  const tableRows = entry.table
    .map((row) => `<tr><th scope="row">${cell(row.aspect)}</th><td>${cell(row.competitor)}</td><td>${cell(row.filepilot)}</td></tr>`)
    .join('');

  return `
      <nav aria-label="Breadcrumb"><a href="${canonicalUrlForRoute('/')}">FilePilot</a> / <a href="${canonicalUrlForRoute('/pdf-tools')}">Free Online PDF Tools</a> / <span>${escapeHtml(entry.h1)}</span></nav>
      <h1>${escapeHtml(entry.h1)}</h1>
      <p>${escapeHtml(entry.intro)}</p>
      <section>
        <h2>Why people look for a ${escapeHtml(entry.competitor)} alternative</h2>
        <p>${escapeHtml(entry.motivation)}</p>
      </section>
      <section>
        <h2>The difference: where your file is processed</h2>
        <p>${escapeHtml(entry.difference)}</p>
      </section>
      <section>
        <h2>${escapeHtml(entry.competitor)} vs FilePilot</h2>
        <table><thead><tr><th scope="col">Aspect</th><th scope="col">${cell(entry.competitor)}</th><th scope="col">FilePilot</th></tr></thead><tbody>${tableRows}</tbody></table>
      </section>
      <section>
        <h2>When ${escapeHtml(entry.competitor)} is the better choice</h2>
        <ul>${entry.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      <section>
        <h2>${escapeHtml(entry.competitor)} tasks and the FilePilot tool that replaces them</h2>
        <ul>${entry.toolMap.map((item) => `<li><a href="${canonicalUrlForRoute(item.route)}">${escapeHtml(item.task)}</a> — ${escapeHtml(routeLabel(item.route))}</li>`).join('')}</ul>
      </section>
      <section>
        <h2>Frequently asked questions</h2>
        <ul>${faqList(route)}</ul>
      </section>
      <section>
        <h2>Related tools</h2>
        <ul>${linkList(relatedRoutesFor(route))}</ul>
      </section>
    `;
}


/**
 * Prerendered body for /about. E-E-A-T signals are worth nothing if they only
 * exist after JavaScript runs, and the press-kit block is specifically there for
 * writers and crawlers that never execute it.
 */
function aboutStaticContent() {
  const seo = getRouteSeo('/about');

  const section = (heading, paragraphs = [], bullets = []) => `
      <section>
        <h2>${escapeHtml(heading)}</h2>
        ${paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}
        ${bullets.length ? `<ul>${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
      </section>`;

  const maintainerBlock = maintainer
    ? section(
      'Who builds FilePilot',
      [`${maintainer.name} — ${maintainer.role}${maintainer.location ? `, ${maintainer.location}` : ''}.`, ...maintainer.bio],
      [
        ...(maintainer.email ? [`Contact: ${maintainer.email}`] : []),
        ...(maintainer.profiles ?? []).map((profile) => `${profile.label}: ${profile.url}`),
      ],
    )
    : '';

  return `
      <nav aria-label="Breadcrumb"><a href="${canonicalUrlForRoute('/')}">FilePilot</a> / <span>About FilePilot</span></nav>
      <h1>${escapeHtml(seo.h1)}</h1>
      <p>${escapeHtml(seo.shortIntro ?? seo.description)}</p>
      ${maintainerBlock}
      ${aboutSections.map((entry) => section(entry.heading, entry.paragraphs ?? [], entry.bullets ?? [])).join('')}
      <section>
        <h2>Source code</h2>
        <p>FilePilot is developed in the open. The repository is at <a href="${GITHUB_REPO_URL}">${escapeHtml(GITHUB_REPO_URL)}</a>.</p>
      </section>
      <section>
        <h2>For press and reviewers</h2>
        <p>${escapeHtml(pressKit.boilerplate)}</p>
        <ul>${pressKit.linkablePages.map((page) => `<li><a href="${canonicalUrlForRoute(page.route)}">${escapeHtml(page.label)}</a></li>`).join('')}</ul>
      </section>
      <section>
        <h2>Frequently asked questions</h2>
        <ul>${faqList('/about')}</ul>
      </section>
    `;
}

function buildStaticRouteContent(route) {
  const seo = getRouteSeo(route);
  const title = escapeHtml(routeLabel(route));
  const description = escapeHtml(seo.shortIntro ?? seo.description);
  const relatedRoutes = relatedRoutesFor(route).length ? relatedRoutesFor(route) : (route === '/'
    ? ['/pdf-tools', '/image-tools', '/merge', '/split', '/compress']
    : route === '/pdf-tools'
      ? ['/merge', '/split', '/compress', '/pdf-to-jpg', '/jpg-to-pdf']
      : route === '/image-tools'
        ? ['/compress-image', '/resize-image', '/convert-image', '/crop-image', '/image-formatter']
        : route.startsWith('/blog')
          ? ['/blog', '/privacy', '/pdf-tools', '/image-tools']
          : ['/merge', '/split', '/compress', '/pdf-to-jpg', '/jpg-to-pdf']);

  const categoryToolRoutes = categoryToolRoutesForHub(route);
  const body = isToolRoute(route)
    ? `
      <nav aria-label="Breadcrumb"><a href="${canonicalUrlForRoute('/')}">FilePilot</a>${categoryHubForRoute(route) ? ` / <a href="${canonicalUrlForRoute(categoryHubForRoute(route).route)}">${escapeHtml(categoryHubForRoute(route).label)}</a>` : ''} / <span>${title}</span></nav>
      <h1>${title}</h1>
      <p>${escapeHtml(toolIntro(route))}</p>
      <section>
        <h2>How it works</h2>
        <ol>${stepsList(toolSteps(route))}</ol>
      </section>
      <section>
        <h2>Frequently asked questions</h2>
        <ul>${faqList(route)}</ul>
      </section>
      <section>
        <h2>Common uses</h2>
        <ul>${orderedList(toolUseCases(route))}</ul>
      </section>
      ${comparisonSection(route)}
      <section>
        <h2>Related tools</h2>
        <ul>${linkList(relatedRoutes)}</ul>
      </section>
    `
    : categoryToolRoutes.length
      ? `
      <nav aria-label="Breadcrumb"><a href="${canonicalUrlForRoute('/')}">FilePilot</a> / <span>${title}</span></nav>
      <h1>${title}</h1>
      <p>${description}</p>
      <section>
        <h2>All tools in this category</h2>
        <ul>${linkList(categoryToolRoutes, categoryToolRoutes.length)}</ul>
      </section>
      ${route === '/pdf-tools' ? `<section>
        <h2>Coming from another PDF tool?</h2>
        <ul>${Object.values(comparisonContent).map((entry) => `<li><a href="${canonicalUrlForRoute(entry.route)}">A ${escapeHtml(entry.competitor)} alternative</a> — ${escapeHtml(entry.description)}</li>`).join('')}</ul>
      </section>` : ''}
      <section>
        <h2>Explore FilePilot</h2>
        <ul>${linkList(hubSiblings(route, relatedRoutes, categoryToolRoutes))}</ul>
      </section>
    `
    : route === '/about'
      ? aboutStaticContent()
      : comparisonContent[route]
        ? comparisonStaticContent(route)
        : route === '/'
          ? homeStaticContent()
          : route === '/blog'
            ? blogIndexContent()
            : blogPosts[route]
              ? blogPostContent(route)
            : `
      <h1>${title}</h1>
      <p>${description}</p>
      <section>
        <h2>Private browser-based tools</h2>
        <p>FilePilot keeps file processing local whenever a tool handles your documents or images. Your browser performs the work on your device, which avoids upload queues, reduces privacy exposure, and lets you keep control of sensitive files.</p>
      </section>
      <section>
        <h2>Explore FilePilot</h2>
        <ul>${linkList(relatedRoutes)}</ul>
      </section>
    `;

  return `<div data-static-seo="true" class="static-seo">${body}</div>`;
}

function writeSeoShells() {
  const baseFile = join(DIST, 'index.html');
  const baseHtml = readFileSync(baseFile, 'utf8');

  for (const route of ROUTES) {
    const html = withRouteSeo(baseHtml, route);
    const outDir = route === '/' ? DIST : join(DIST, route);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const outFile = route === '/' ? join(DIST, 'index.html') : join(outDir, 'index.html');
    writeFileSync(outFile, html, 'utf-8');
  }

  write404Shell(baseHtml);
  console.log(`Wrote SEO HTML shells for ${ROUTES.length} routes.`);
}

function write404Shell(baseHtml) {
  const notFoundHtml = baseHtml
    .replace(/<title>[^<]*<\/title>/, '<title>Page Not Found | FilePilot</title>')
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, '<meta name="description" content="The requested FilePilot page could not be found.">')
    .replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/, '<meta name="robots" content="noindex,follow">')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${SITE_URL}">`)
    .replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(
      '<div id="root"></div>',
      `<div id="root"><main class="static-seo"><h1>Page not found</h1><p>The page you requested does not exist. Use the links below to return to FilePilot tools.</p><ul><li><a href="${canonicalUrlForRoute('/')}">FilePilot home</a></li><li><a href="${canonicalUrlForRoute('/pdf-tools')}">PDF tools</a></li><li><a href="${canonicalUrlForRoute('/image-tools')}">Image tools</a></li></ul></main></div>`,
    );

  writeFileSync(join(DIST, '404.html'), withBingVerification(notFoundHtml), 'utf-8');
}

writeSeoShells();
