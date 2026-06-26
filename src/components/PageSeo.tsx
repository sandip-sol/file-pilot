import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface FaqItem {
    question: string;
    answer: string;
}

interface PageSeoProps {
    title: string;
    description: string;
    image?: string;
    canonicalPath?: string;
    faqItems?: FaqItem[];
    robots?: 'index,follow' | 'noindex,follow';
}

const SITE_URL = 'https://www.filepilot.space/';
const DEFAULT_TITLE = 'FilePilot - PDF, Image and File Tools';
const DEFAULT_DESCRIPTION =
    'Edit, convert, compress, organise and optimise PDFs, images and files with FilePilot. Your files are processed privately in your browser.';
const DEFAULT_IMAGE = `${SITE_URL}icon-512.png`;

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
    faqItems,
    robots = 'index,follow',
}: PageSeoProps) => {
    const location = useLocation();

    useEffect(() => {
        const pathname = canonicalPath ?? location.pathname;
        const url = canonicalUrlForPath(pathname);
        const isHome = pathname === '/';
        const schema = {
            "@context": "https://schema.org",
            "@graph": isHome
                ? [
                    {
                        "@type": "WebSite",
                        "@id": `${SITE_URL}#website`,
                        "url": SITE_URL,
                        "name": "FilePilot",
                        "description": description,
                        "inLanguage": "en",
                    },
                    {
                        "@type": "Organization",
                        "@id": `${SITE_URL}#organization`,
                        "name": "FilePilot",
                        "url": SITE_URL,
                        "logo": `${SITE_URL}filepilot_logo.svg`,
                    },
                    {
                        "@type": "WebApplication",
                        "name": "FilePilot",
                        "url": SITE_URL,
                        "description": description,
                        "applicationCategory": "UtilityApplication",
                        "operatingSystem": "Any",
                        "isAccessibleForFree": true,
                    },
                ]
                : [
                    {
                        "@type": "WebApplication",
                        "name": title,
                        "url": url,
                        "description": description,
                        "applicationCategory": "UtilityApplication",
                        "operatingSystem": "Any",
                        "isAccessibleForFree": true,
                    },
                ],
        };
        let scriptTag = document.head.querySelector('#page-schema') as HTMLScriptElement | null;
        if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.id = 'page-schema';
            scriptTag.type = 'application/ld+json';
            document.head.appendChild(scriptTag);
        }
        scriptTag.textContent = JSON.stringify(schema);

        // FAQ schema
        let faqScript = document.head.querySelector('#faq-schema') as HTMLScriptElement | null;
        if (faqItems && faqItems.length > 0) {
            const faqSchema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqItems.map(item => ({
                    "@type": "Question",
                    "name": item.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": item.answer,
                    },
                })),
            };
            if (!faqScript) {
                faqScript = document.createElement('script');
                faqScript.id = 'faq-schema';
                faqScript.type = 'application/ld+json';
                document.head.appendChild(faqScript);
            }
            faqScript.textContent = JSON.stringify(faqSchema);
        } else if (faqScript) {
            faqScript.remove();
        }

        document.title = title;
        upsertCanonical(url);

        upsertMeta('meta[name="description"]', { name: 'description', content: description });
        upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
        upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'FilePilot' });
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
            const faqTag = document.head.querySelector('#faq-schema');
            if (faqTag) faqTag.remove();
            upsertMeta('meta[name="description"]', { name: 'description', content: DEFAULT_DESCRIPTION });
            upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow' });
            upsertMeta('meta[property="og:title"]', { property: 'og:title', content: DEFAULT_TITLE });
            upsertMeta('meta[property="og:description"]', { property: 'og:description', content: DEFAULT_DESCRIPTION });
            upsertMeta('meta[property="og:url"]', { property: 'og:url', content: SITE_URL });
            upsertMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_IMAGE });
            upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
            upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: DEFAULT_TITLE });
            upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: DEFAULT_DESCRIPTION });
            upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_IMAGE });
        };
    }, [canonicalPath, description, faqItems, image, location.pathname, robots, title]);

    return null;
};
