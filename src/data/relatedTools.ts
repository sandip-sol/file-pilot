/**
 * Single source of truth for the internal link graph between tool pages.
 *
 * There used to be two independent maps: `RELATED_ROUTES` in `seoRoutes.js`
 * (23 entries, used by the prerenderer for the crawlable "Related tools" list)
 * and `relatedToolSlugs` in `RelatedTools.tsx` (34 entries, used by the
 * client-rendered cards). They overlapped on 10 routes and disagreed on 6 of
 * them. Internal links are how link equity moves around a site, so the graph a
 * crawler reads from the HTML and the graph Google sees after rendering JS were
 * describing two different sites.
 *
 * This module has no imports on purpose: `seoRoutes.js` runs in plain Node and
 * cannot load `toolRegistry.ts` (it pulls in lucide-react icons), so both sides
 * pass in their own already-loaded tool list and share this one resolver.
 * Same function, same inputs, same output — the graphs cannot drift again.
 */

export interface RelatedToolInput {
  /** Route/slug, e.g. "/merge". */
  route: string;
  category: string;
}

/**
 * Hand-picked neighbours, used ahead of the automatic category fallback.
 *
 * Only curate where the obvious sibling is in a *different* category or where
 * a specific pairing matters (e.g. `/flatten-pdf` → `/form-filler`). Everything
 * else is better served by the fallback, which stays correct as tools are added.
 */
export const curatedRelatedTools: Record<string, string[]> = {
  // ── Organize & manage ────────────────────────────────────────────────────
  '/merge': ['/split', '/compress', '/organize-pdf', '/jpg-to-pdf'],
  '/split': ['/merge', '/extract-pages', '/delete-pages', '/organize-pdf'],
  '/organize-pdf': ['/merge', '/split', '/rotate-pdf', '/delete-pages'],
  '/combine-single-page': ['/merge', '/n-up-pdf', '/grid-combine', '/pdf-to-images'],
  '/n-up-pdf': ['/posterize-pdf', '/pdf-booklet', '/combine-single-page', '/grid-combine'],
  '/add-page-labels': ['/page-numbers', '/organize-pdf', '/bookmark', '/pdf-metadata'],

  // ── Edit & annotate ──────────────────────────────────────────────────────
  '/watermark-pdf': ['/redact-pdf', '/sign-pdf', '/add-stamp', '/header-footer'],
  '/sign-pdf': ['/annotate-pdf', '/watermark-pdf', '/flatten-pdf', '/form-filler'],
  '/flatten-pdf': ['/form-filler', '/form-creator', '/pdf-security', '/redact-pdf'],

  // ── Convert to / from PDF ────────────────────────────────────────────────
  '/jpg-to-pdf': ['/images-to-pdf', '/pdf-to-jpg', '/compress-image', '/merge'],
  '/images-to-pdf': ['/pdf-to-images', '/compress', '/merge', '/scan-images-to-pdf'],
  '/pdf-to-jpg': ['/pdf-to-images', '/jpg-to-pdf', '/compress-image', '/compress'],
  '/pdf-to-images': ['/images-to-pdf', '/compress', '/extract-text', '/pdf-to-zip'],
  '/pdf-to-cbz': ['/pdf-to-images', '/pdf-to-zip', '/extract-images', '/images-to-pdf'],
  '/pdf-to-zip': ['/split', '/merge', '/extract-pages', '/pdf-to-cbz'],
  '/extract-text': ['/pdf-to-images', '/pdf-to-markdown', '/pdf-to-json', '/extract-images'],
  '/json-to-pdf': ['/markdown-to-pdf', '/text-to-pdf', '/pdf-to-json', '/pdf-to-markdown'],
  '/markdown-to-pdf': ['/json-to-pdf', '/text-to-pdf', '/pdf-to-markdown', '/pdf-to-json'],

  // ── Optimize & repair ────────────────────────────────────────────────────
  '/compress': ['/merge', '/pdf-to-images', '/repair-pdf', '/page-dimensions'],
  '/pdf-to-greyscale': ['/compress', '/pdf-to-images', '/flatten-pdf', '/pdf-to-jpg'],
  '/posterize-pdf': ['/n-up-pdf', '/pdf-booklet', '/fix-page-size', '/crop-pdf'],

  // ── Secure ───────────────────────────────────────────────────────────────
  '/redact-pdf': ['/find-and-redact', '/sanitize-pdf', '/remove-metadata', '/pdf-security'],
  '/pdf-security': ['/sanitize-pdf', '/remove-metadata', '/redact-pdf', '/flatten-pdf'],

  // ── Image tools ──────────────────────────────────────────────────────────
  '/compress-image': ['/resize-image', '/convert-image', '/crop-image', '/image-formatter'],
  '/resize-image': ['/compress-image', '/crop-image', '/image-requirements', '/social-media-resizer'],
  '/convert-image': ['/compress-image', '/resize-image', '/image-to-svg', '/image-formatter'],
  '/crop-image': ['/resize-image', '/rotate-image', '/photo-editor', '/image-formatter'],
  '/image-to-svg': ['/convert-image', '/favicon-generator', '/pdf-to-svg', '/compress-image'],
  '/remove-image-metadata': ['/compress-image', '/blur-face', '/photo-editor', '/pdf-metadata'],
  '/blur-face': ['/remove-image-metadata', '/watermark-image', '/crop-image', '/photo-editor'],

  // ── Workflows ────────────────────────────────────────────────────────────
  '/image-requirements': ['/image-formatter', '/compress-image', '/resize-image', '/passport-photo-validator'],
  '/image-formatter': ['/social-media-resizer', '/ecommerce-image-formatter', '/compress-image', '/image-requirements'],
  '/passport-photo-validator': ['/image-requirements', '/image-formatter', '/crop-image', '/remove-image-metadata'],
  '/social-media-resizer': ['/image-formatter', '/ecommerce-image-formatter', '/crop-image', '/resize-image'],
  '/ecommerce-image-formatter': ['/image-formatter', '/social-media-resizer', '/remove-background', '/compress-image'],
  '/scan-images-to-pdf': ['/images-to-pdf', '/compress', '/organize-pdf', '/deskew-pdf'],
  '/favicon-generator': ['/image-to-svg', '/resize-image', '/crop-image', '/image-formatter'],
  '/qr-generator': ['/favicon-generator', '/image-to-svg', '/image-formatter', '/color-picker'],

  // ── AI tools ─────────────────────────────────────────────────────────────
  '/remove-background': ['/change-background', '/object-remover', '/crop-image', '/ecommerce-image-formatter'],
  '/change-background': ['/remove-background', '/ai-enhance-image', '/photo-editor', '/object-remover'],
  '/upscale-image': ['/ai-enhance-image', '/resize-image', '/compress-image', '/photo-editor'],
  '/ai-enhance-image': ['/upscale-image', '/photo-editor', '/remove-background', '/change-background'],
  '/object-remover': ['/remove-background', '/blur-face', '/crop-image', '/photo-editor'],
};

const MAX_RELATED = 4;

/**
 * Resolves the related tools for a route.
 *
 * Curated neighbours first, then same-category siblings to fill the remaining
 * slots. Siblings are taken from the tools that follow this one in registry
 * order, wrapping around, so links spread evenly across a category instead of
 * every page in it pointing at whichever tool happens to be listed first.
 *
 * The previous behaviour for uncurated tools — 61 of 84 of them — was a flat
 * fallback to `/pdf-tools`, `/image-tools`, `/merge`, `/compress` and
 * `/compress-image`. That funnelled the whole site's internal link equity into
 * five head-term pages it cannot win, and gave the long-tail pages no topical
 * context at all.
 */
export const resolveRelatedTools = (
  route: string,
  tools: RelatedToolInput[],
  limit: number = MAX_RELATED,
): string[] => {
  const known = new Set(tools.map((tool) => tool.route));
  const related: string[] = [];

  const add = (candidate: string) => {
    if (related.length >= limit) return;
    if (candidate === route) return;
    if (related.includes(candidate)) return;
    if (!known.has(candidate)) return;
    related.push(candidate);
  };

  for (const candidate of curatedRelatedTools[route] ?? []) add(candidate);

  const index = tools.findIndex((tool) => tool.route === route);
  if (index !== -1) {
    const category = tools[index].category;
    for (let offset = 1; offset <= tools.length && related.length < limit; offset += 1) {
      const sibling = tools[(index + offset) % tools.length];
      if (sibling.category === category) add(sibling.route);
    }
  }

  return related;
};
