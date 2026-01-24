import { Link } from 'react-router-dom';
import { Github, Heart } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="border-t border-[var(--border)] bg-white py-12 mt-auto">
            <div className="container">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="PDFBuddy" className="h-8" />
                    </div>

                    <div className="flex items-center gap-8 text-sm text-[var(--text-secondary)]">
                        <Link to="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-[var(--primary)] transition-colors">Terms</Link>
                        <a href="https://github.com/sandip-sol/pdfbuddy-web" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] transition-colors flex items-center gap-1">
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <span>Made with</span>
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span>for Privacy</span>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-[var(--border-light)] text-center text-sm text-[var(--text-muted)]">
                    <p>&copy; {new Date().getFullYear()} PDFBuddy. All processing happens in your browser.</p>
                </div>
            </div>
        </footer>
    );
};
