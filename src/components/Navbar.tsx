import { Link } from 'react-router-dom';

export const Navbar = () => {
    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
            <div className="container h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                    <img src="/logo.png" alt="PDFBuddy" className="h-10" />
                </Link>
                <div className="flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
                    <Link to="/merge" className="hover:text-[var(--primary)] transition-colors">Merge</Link>
                    <Link to="/split" className="hover:text-[var(--primary)] transition-colors">Split</Link>
                    <Link to="/images-to-pdf" className="hover:text-[var(--primary)] transition-colors">Images to PDF</Link>
                    <Link to="/compress" className="hover:text-[var(--primary)] transition-colors">Compress</Link>
                </div>
            </div>
        </nav>
    );
};
