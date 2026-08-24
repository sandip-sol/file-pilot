import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Client-side head management for routed pages: title, description, canonical,
 * robots and the Open Graph / Twitter tags.
 *
 * DELIBERATELY DOES NOT EMIT JSON-LD. `prerender.js` writes the structured data
 * for every route into the static HTML as a single `#page-schema` block, built
 * from `siteContent.ts` / `toolContent.ts` / `comparisons.ts` with the route's
 * category, hub membership and tool steps in hand — none of which this component
 * can see.
 *
 * When this component also emitted schema, every rendered page carried three
 * `application/ld+json` blocks: the prerendered graph, plus a `#page-schema` and
 * a `#faq-schema` that React appended on hydration because the prerendered
 * script had no id to match. That shipped duplicate `FAQPage` nodes and two
 * anonymous `SoftwareApplication` nodes disagreeing about the tool's name (the
 * short label vs. the full `<title>`), which left Google to pick one at random.
 *
 * Do not reintroduce schema here. Add it to `buildJsonLd()` in prerender.js.
 */

interface PageSeoProps {
    title: string;
    description: string;
    image?: string;
    canonicalPath?: string;
    robots?: 'index,follow' | 'noindex,follow';
    /**
     * Mirrors what prerender.js writes into the static HTML. Social scrapers read
     * that and never run this, so the only thing this fixes is the tag going
     * stale across client-side navigation — a post would otherwise leave
     * `article` behind on the next page. Defaults to the site-wide 'website'.
     */
    ogType?: 'website' | 'article';
}

const SITE_URL = 'https://www.filepilot.space/';
const DEFAULT_TITLE = 'FilePilot - PDF, Image and File Tools';
const DEFAULT_DESCRIPTION =
    'Edit, convert, compress, organise and optimise PDFs, images and files with FilePilot. Your files are processed privately in your browser.';
const DEFAULT_IMAGE = `${SITE_URL}og-image.png`;

const canonicalUrlForPath = (pathname: string) => {
    const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    if (normalizedPath === '/') return SITE_URL;
    return new URL(`${normalizedPath.slice(1)}/`, SITE_URL).toString();
};

const upsertMeta = (selector: string, attributes: Record<string, string>) => {
    let meta = document.head.querySelector(selector) as HTMLMetaElement | null;
    if (!meta) {
        meta = document.createElement('meta');
        document.head.appendChild(meta);
    }

    Object.entries(attributes).forEach(([key, value]) => {
        meta?.setAttribute(key, value);
    });
};

const upsertCanonical = (href: string) => {
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
    }

    link.href = href;
};

export const PageSeo = ({
    title,
    description,
    image = DEFAULT_IMAGE,
    canonicalPath,
    robots = 'index,follow',
    ogType = 'website',
}: PageSeoProps) => {
    const location = useLocation();

    useEffect(() => {
        const pathname = canonicalPath ?? location.pathname;
        const url = canonicalUrlForPath(pathname);

        document.title = title;
        upsertCanonical(url);

        upsertMeta('meta[name="description"]', { name: 'description', content: description });
        upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
        upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'FilePilot' });
        upsertMeta('meta[property="og:type"]', { property: 'og:type', content: ogType });
        upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
        upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
        upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });
        upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
        upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
        upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
        upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
        upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });

        return () => {
            document.title = DEFAULT_TITLE;
            upsertCanonical(SITE_URL);
            upsertMeta('meta[name="description"]', { name: 'description', content: DEFAULT_DESCRIPTION });
            upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow' });
            upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
            upsertMeta('meta[property="og:title"]', { property: 'og:title', content: DEFAULT_TITLE });
            upsertMeta('meta[property="og:description"]', { property: 'og:description', content: DEFAULT_DESCRIPTION });
            upsertMeta('meta[property="og:url"]', { property: 'og:url', content: SITE_URL });
            upsertMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_IMAGE });
            upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
            upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: DEFAULT_TITLE });
            upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: DEFAULT_DESCRIPTION });
            upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_IMAGE });
        };
    }, [canonicalPath, description, image, location.pathname, ogType, robots, title]);

    return null;
};
