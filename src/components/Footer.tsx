import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="border-t border-border bg-background/80 backdrop-blur-sm py-12 mt-auto">
            <div className="container">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-3">
                        <img src="/filepilot_logo.svg" alt="FilePilot logo" className="h-12 w-auto max-w-[240px] object-contain" />
                    </div>

                    <div className="flex items-center gap-8 text-sm text-muted-foreground">
                        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                    </div>
                </div>

                {/* Internal Links for SEO */}
                <div className="border-t border-border py-8">
                    <p className="text-sm font-semibold text-foreground mb-4 text-center md:text-left">Popular Tools</p>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <Link to="/pdf-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">PDF Tools</Link>
                        <Link to="/image-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Image Tools</Link>
                        <Link to="/image-workflows" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Image Workflows</Link>
                        <Link to="/ai-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Tools</Link>
                        <Link to="/merge" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Merge PDF</Link>
                        <Link to="/split" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Split PDF</Link>
                        <Link to="/compress" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Compress PDF</Link>
                        <Link to="/images-to-pdf" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Images to PDF</Link>
                        <Link to="/extract-text" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Extract Text</Link>
                        <Link to="/image-formatter" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Image Formatter</Link>
                    </div>
                </div>

                <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} FilePilot. All processing happens in your browser.</p>

                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <span>Made with</span>
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span>for privacy</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
