import { Link } from 'react-router-dom';
import { Files, Scissors, Image, Minimize2, ArrowRight } from 'lucide-react';

export const Home = () => {
    return (
        <div className="container py-12 animate-fade-in">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text)] mb-6">
                    Review, Edit, and Manage PDFs <br />
                    <span className="text-[var(--primary)]">Right in Your Browser</span>
                </h1>
                <p className="text-xl text-[var(--text-muted)] mb-8">
                    Fast, private PDF tools — your files never leave your device.
                    No servers, no uploads, 100% secure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/merge" className="btn btn-primary text-lg px-8 py-3">
                        Start Handling PDFs <ArrowRight className="w-5 h-5" />
                    </Link>
                    <a href="#tools" className="btn btn-outline text-lg px-8 py-3">
                        Explore Tools
                    </a>
                </div>
            </div>

            {/* Tools Section */}
            <h2 id="tools" className="text-2xl font-bold mb-8 text-center text-[var(--text)]">Everything You Need</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/merge" className="card group hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 text-[var(--primary)] flex items-center justify-center mb-4 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                        <Files className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Merge PDFs</h3>
                    <p className="text-[var(--text-muted)] text-sm">Combine multiple PDF files into one simple document.</p>
                </Link>

                <Link to="/split" className="card group hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Scissors className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Split PDF</h3>
                    <p className="text-[var(--text-muted)] text-sm">Extract pages or split a document into separate files.</p>
                </Link>

                <Link to="/images-to-pdf" className="card group hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Image className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Images to PDF</h3>
                    <p className="text-[var(--text-muted)] text-sm">Convert JPG, PNG, and WebP images into a single PDF.</p>
                </Link>

                <Link to="/compress" className="card group hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Minimize2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Compress PDF</h3>
                    <p className="text-[var(--text-muted)] text-sm">Reduce file size while keeping good quality.</p>
                </Link>
            </div>

            {/* Privacy Highlight */}
            <div className="mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-4">Privacy First. Always.</h2>
                    <p className="text-[var(--text-muted)] mb-6 text-lg">
                        Unlike other tools, we don't upload your files to any server.
                        All processing happens locally on your device using WebAssembly technology.
                        Your sensitive documents stay private.
                    </p>
                    <Link to="/privacy" className="text-[var(--primary)] font-medium hover:underline">
                        Read our privacy guarantee &rarr;
                    </Link>
                </div>
                <div className="w-full md:w-1/3 flex justify-center">
                    <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center text-[var(--primary)]">
                        <ShieldCheck className="w-16 h-16" />
                    </div>
                </div>
            </div>
        </div>
    );
};

import { ShieldCheck } from 'lucide-react';
