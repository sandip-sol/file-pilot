import { Link } from 'react-router-dom';
import { Files, Scissors, Image, Minimize2, ArrowRight, ShieldCheck, Sparkles, SlidersHorizontal, Lock, Zap } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';

export const Home = () => {
    return (
        <div className="hero-pattern">
            <PageSeo
                title="PDF & Image Tools – Resize, Compress & Convert Free Online"
                description="Free online tools to resize images to exact pixels & KB, compress PDFs, convert formats. 100% private — files never leave your browser."
            />
            {/* Hero Section */}
            <div className="container py-16 md:py-24">
                <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>100% Free & Private</span>
                    </div>

                    <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight text-[var(--text)] mb-6 leading-tight">
                        PDF & Image Tools That
                        <span className="gradient-text"> Respect Your Privacy</span>
                    </h1>

                    <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
                        Fast, secure PDF and image editing right in your browser. Resize, compress, and convert files without uploads.
                        Your files never leave your device.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/merge" className="btn btn-primary text-base md:text-lg px-6 md:px-8 py-3 md:py-4">
                            Get Started Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="#tools" className="btn btn-outline text-base md:text-lg px-6 md:px-8 py-3 md:py-4">
                            Explore Tools
                        </a>
                    </div>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-12 md:mt-16 text-sm text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                        <span>End-to-End Privacy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                        <span>Lightning Fast</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                        <span>No Account Needed</span>
                    </div>
                </div>
            </div>

            {/* Tools Section */}
            <div className="container pb-16 md:pb-20" id="tools">
                <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-4xl font-bold mb-4">Powerful PDF & Image Tools</h2>
                    <p className="text-[var(--text-secondary)] text-base md:text-lg">Everything you need to work with PDFs and images</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <Link to="/merge" className="card group animate-fade-in delay-100" style={{ animationFillMode: 'backwards' }}>
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                            <Files className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2">Merge PDFs</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">Combine multiple PDF files into one organized document.</p>
                        <div className="mt-4 text-foreground font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Try now <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>

                    <Link to="/split" className="card group animate-fade-in delay-200" style={{ animationFillMode: 'backwards' }}>
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                            <Scissors className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2">Split PDF</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">Extract pages or split documents into separate files.</p>
                        <div className="mt-4 text-foreground font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Try now <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>

                    <Link to="/images-to-pdf" className="card group animate-fade-in delay-300" style={{ animationFillMode: 'backwards' }}>
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                            <Image className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2">Images to PDF</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">Convert JPG, PNG, and WebP images into PDF documents.</p>
                        <div className="mt-4 text-foreground font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Try now <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>

                    <Link to="/compress" className="card group animate-fade-in delay-400" style={{ animationFillMode: 'backwards' }}>
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                            <Minimize2 className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2">Compress PDF</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">Reduce file size while maintaining quality.</p>
                        <div className="mt-4 text-foreground font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Try now <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>

                    <Link to="/image-requirements" className="card group animate-fade-in delay-400" style={{ animationFillMode: 'backwards' }}>
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                            <SlidersHorizontal className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2">Image Formatter</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">Resize image to exact pixels, reduce file size to KB limit, and convert format.</p>
                        <div className="mt-4 text-foreground font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Try now <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Privacy Section */}
            <div className="container pb-16 md:pb-20">
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl md:rounded-3xl p-6 md:p-12 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl md:text-4xl font-bold mb-4">Privacy First. Always.</h2>
                            <p className="text-white/80 text-base md:text-lg mb-6">
                                Unlike other tools, we don't upload your files to any server.
                                All processing happens locally on your device using secure browser technology.
                                Your sensitive documents stay private.
                            </p>
                            <Link to="/privacy" className="inline-flex items-center gap-2 text-white font-medium hover:underline">
                                Learn more about our privacy guarantee
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full flex items-center justify-center animate-float backdrop-blur-sm">
                            <ShieldCheck className="w-12 h-12 md:w-16 md:h-16 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
