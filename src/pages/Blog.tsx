import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';

interface BlogPost {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    readTime: string;
}

const posts: BlogPost[] = [
    {
        slug: '/blog/why-files-stay-in-browser',
        title: 'Why Your Files Should Never Leave Your Browser',
        date: 'June 26, 2026',
        excerpt:
            'Uploading sensitive documents to remote servers introduces risks most people never consider. Learn why client-side processing is the safer, faster, and more private alternative.',
        readTime: '5 min read',
    },
    {
        slug: '/blog/privacy-risks-online-pdf-tools',
        title: 'The Hidden Privacy Risks of Online PDF Tools',
        date: 'June 26, 2026',
        excerpt:
            'Every time you upload a PDF to an online tool, your data may be stored, scanned, or shared with third parties. Here is what actually happens behind the scenes.',
        readTime: '5 min read',
    },
    {
        slug: '/blog/how-filepilot-keeps-documents-private',
        title: 'How FilePilot Keeps Your Documents Private',
        date: 'June 26, 2026',
        excerpt:
            'A deep dive into the architecture that makes FilePilot truly private: WebAssembly, Canvas API, ONNX Runtime, and zero server involvement.',
        readTime: '5 min read',
    },
];

export const Blog = () => {
    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="FilePilot Blog — Privacy, PDFs & Image Tools"
                description="Articles about privacy-first file processing, browser-based PDF tools, and why your documents should never leave your device."
                canonicalPath="/blog"
            />

            <div className="page-header">
                <div className="container">
                    <h1>Blog</h1>
                    <p>Privacy-first file processing, explained</p>
                </div>
            </div>

            <div className="container pb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {posts.map((post) => (
                        <Link
                            key={post.slug}
                            to={post.slug}
                            className="group bg-card/60 border border-border rounded-2xl p-6 flex flex-col transition-colors hover:bg-muted"
                        >
                            <p className="text-xs text-muted-foreground mb-3">
                                {post.date} &middot; {post.readTime}
                            </p>
                            <h2 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                                {post.title}
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                                {post.excerpt}
                            </p>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                                Read article
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};
