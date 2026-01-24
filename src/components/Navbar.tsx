import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
            <div className="container h-14 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                    <img src="/logo.png" alt="PDF Solver" className="h-10 w-auto object-contain" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
                    <Link to="/merge" className="hover:text-[var(--primary)] transition-colors">Merge</Link>
                    <Link to="/split" className="hover:text-[var(--primary)] transition-colors">Split</Link>
                    <Link to="/images-to-pdf" className="hover:text-[var(--primary)] transition-colors">Images to PDF</Link>
                    <Link to="/compress" className="hover:text-[var(--primary)] transition-colors">Compress</Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--primary)]"
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-[var(--border)] animate-fade-in">
                    <div className="container py-4 flex flex-col gap-3">
                        <Link to="/merge" onClick={() => setIsMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[var(--primary-light)] text-[var(--text-secondary)] font-medium">Merge PDFs</Link>
                        <Link to="/split" onClick={() => setIsMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[var(--primary-light)] text-[var(--text-secondary)] font-medium">Split PDF</Link>
                        <Link to="/images-to-pdf" onClick={() => setIsMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[var(--primary-light)] text-[var(--text-secondary)] font-medium">Images to PDF</Link>
                        <Link to="/compress" onClick={() => setIsMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[var(--primary-light)] text-[var(--text-secondary)] font-medium">Compress PDF</Link>
                    </div>
                </div>
            )}
        </nav>
    );
};
