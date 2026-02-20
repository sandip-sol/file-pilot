import { useEffect } from 'react';

interface PageSeoProps {
    title: string;
    description: string;
}

/**
 * Lightweight per-page SEO component.
 * Sets document.title and the meta description tag without
 * adding a react-helmet dependency.
 */
export const PageSeo = ({ title, description }: PageSeoProps) => {
    useEffect(() => {
        // Set page title
        document.title = title;

        // Set or update meta description
        let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
        if (meta) {
            meta.setAttribute('content', description);
        } else {
            meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = description;
            document.head.appendChild(meta);
        }

        // Cleanup: restore defaults when component unmounts
        return () => {
            document.title = 'PDF & Image Tools – Resize, Compress & Convert Free Online';
            const m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
            if (m) {
                m.setAttribute(
                    'content',
                    'Free online tools to resize images to exact pixels & KB, compress PDFs, convert formats. 100% private — files never leave your browser.',
                );
            }
        };
    }, [title, description]);

    return null;
};
