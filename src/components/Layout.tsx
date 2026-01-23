import { ShieldCheck } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="privacy-banner">
                <ShieldCheck className="w-4 h-4" />
                <span>Your files are processed locally. Nothing is uploaded to any server.</span>
            </div>
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
};
