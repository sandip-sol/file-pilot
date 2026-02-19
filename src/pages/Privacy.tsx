import { ShieldCheck, Lock, Eye, Server } from 'lucide-react';

export const Privacy = () => {
    return (
        <div className="min-h-[calc(100vh-200px)]">
            <div className="page-header">
                <div className="container">
                    <h1>Privacy Policy</h1>
                    <p>How we protect your data (spoiler: we never see it)</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    {/* Hero Promise */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-8 mb-12 text-white">
                        <div className="flex items-start gap-4">
                            <ShieldCheck className="w-10 h-10 shrink-0" />
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Our Core Promise</h2>
                                <p className="text-white/90 text-lg">
                                    Your files never leave your device. All processing happens locally in your browser using secure technology. We have no servers that store or view your documents.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-card border border-border rounded-xl p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold mb-2">Local Processing</h3>
                            <p className="text-sm text-[var(--text-muted)]">Files are processed entirely in your browser</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                                <Eye className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold mb-2">No Tracking</h3>
                            <p className="text-sm text-[var(--text-muted)]">We don't track, store, or analyze your usage</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                                <Server className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold mb-2">No Storage</h3>
                            <p className="text-sm text-[var(--text-muted)]">Files are never uploaded to any server</p>
                        </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
                        <section>
                            <h3 className="text-xl font-bold text-[var(--text)] mb-3">1. How It Works</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                When you "upload" a file, it is loaded into your browser's memory, processed using JavaScript, and then provided back to you as a download. No file data is transmitted to us or any third party.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-[var(--text)] mb-3">2. Data Collection</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                We do not collect any personal data, IP addresses, or usage logs. We do not use cookies for tracking or advertising.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-[var(--text)] mb-3">3. Third Parties</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                We do not share any data with third parties because we don't collect any data to share.
                            </p>
                        </section>

                        <div className="pt-6 border-t border-[var(--border-light)] text-sm text-[var(--text-muted)]">
                            <p>Last updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
