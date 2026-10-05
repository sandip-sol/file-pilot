import { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { toolRegistry } from '../data/toolRegistry';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { RelatedTools } from './RelatedTools';
import { ToolUsageTracker } from './ToolUsageTracker';
import { DotGrid } from './DotGrid';

// The tool article copy (`toolContent.ts`) is the largest module in the app.
// Imported statically here it landed in the entry chunk and every page —
// homepage, blog, hubs — downloaded it before rendering anything. It is only
// ever shown on tool routes, so load it there and only there.
const ToolContentSection = lazy(() =>
    import('./ToolContentSection').then((m) => ({ default: m.ToolContentSection })),
);
const toolSlugs = new Set(toolRegistry.map((tool) => tool.slug));

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const { pathname } = useLocation();
    const isToolRoute = toolSlugs.has(pathname.replace(/\/$/, '') || '/');

    return (
        <>
        <DotGrid />
        <div className="min-h-screen flex flex-col relative z-[1]">
            <div className="privacy-banner">
                <ShieldCheck className="w-4 h-4" />
                <span>Your files are processed locally. Nothing is uploaded to any server.</span>
            </div>
            <Navbar />
            <main className="flex-1">
                <ToolUsageTracker />
                {children}
                {isToolRoute && (
                    <Suspense fallback={null}>
                        <ToolContentSection />
                    </Suspense>
                )}
                <RelatedTools />
            </main>
            <Footer />
        </div>
        </>
    );
};
