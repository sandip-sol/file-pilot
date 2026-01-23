import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        <footer className="border-t border-[var(--border)] bg-[var(--background)] py-8 mt-auto">
            <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
                <p>&copy; {new Date().getFullYear()} PDFBuddy. All rights reserved.</p>
                <div className="flex gap-6">
                    <Link to="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy</Link>
                    <Link to="/terms" className="hover:text-[var(--text)] transition-colors">Terms</Link>
                </div>
                <p className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
                    Processed locally in browser
                </p>
            </div>
        </footer>
    );
};
