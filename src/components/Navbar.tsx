import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { primaryNavTools } from '../data/toolRegistry';

export const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="container h-14 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                    <img src="/logo.png" alt="PDF Solver" className="h-10 w-auto object-contain" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    {primaryNavTools.slice(0, 8).map((tool) => (
                        <Link key={tool.slug} to={tool.slug} className="hover:text-foreground transition-colors">
                            {tool.shortTitle}
                        </Link>
                    ))}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden bg-background border-t border-border animate-fade-in">
                    <div className="container py-4 flex flex-col gap-3">
                        {primaryNavTools.map((tool) => (
                            <Link
                                key={tool.slug}
                                to={tool.slug}
                                onClick={() => setIsMenuOpen(false)}
                                className="py-2 px-3 rounded-lg hover:bg-muted text-muted-foreground font-medium"
                            >
                                {tool.title}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};
