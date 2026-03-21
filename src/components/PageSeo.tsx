import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageSeoProps {
    title: string;
    description: string;
    image?: string;
    canonicalPath?: string;
}

const SITE_URL = 'https://pdfsolver.app';
const DEFAULT_TITLE = 'PDF & Image Tools – Resize, Compress & Convert Free Online';
const DEFAULT_DESCRIPTION =
    'Free online tools to resize images to exact pixels & KB, compress PDFs, convert formats. 100% private — files never leave your browser.';
const DEFAULT_IMAGE = `${SITE_URL}/og-banner.png`;

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

export const PageSeo = ({ title, description, image = DEFAULT_IMAGE, canonicalPath }: PageSeoProps) => {
    const location = useLocation();

    useEffect(() => {
        const pathname = canonicalPath ?? location.pathname;
        const url = new URL(pathname, SITE_URL).toString();

        document.title = title;
        upsertCanonical(url);

        upsertMeta('meta[name="description"]', { name: 'description', content: description });
        upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
        upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
        upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });
        upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
        upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
        upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
        upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });

        return () => {
            document.title = DEFAULT_TITLE;
            upsertCanonical(`${SITE_URL}/`);
            upsertMeta('meta[name="description"]', { name: 'description', content: DEFAULT_DESCRIPTION });
            upsertMeta('meta[property="og:title"]', { property: 'og:title', content: DEFAULT_TITLE });
            upsertMeta('meta[property="og:description"]', { property: 'og:description', content: DEFAULT_DESCRIPTION });
            upsertMeta('meta[property="og:url"]', { property: 'og:url', content: `${SITE_URL}/` });
            upsertMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_IMAGE });
            upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: DEFAULT_TITLE });
            upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: DEFAULT_DESCRIPTION });
            upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_IMAGE });
        };
    }, [canonicalPath, description, image, location.pathname, title]);

    return null;
};
