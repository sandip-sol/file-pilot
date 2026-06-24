import { FileText, Scale, Shield, Copyright } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';

export const Terms = () => {
    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Terms of Service – FilePilot"
                description="Read the terms for using FilePilot's private browser-based PDF, image and file tools."
            />
            <div className="page-header">
                <div className="container">
                    <h1>Terms of Service</h1>
                    <p>Clear terms for using FilePilot</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    {/* Quick Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                        <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Free to Use</h3>
                                <p className="text-sm text-[var(--text-muted)]">Use our tools for any personal or commercial purpose</p>
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Your Files, Your Property</h3>
                                <p className="text-sm text-[var(--text-muted)]">You own all files you process through FilePilot</p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
                        <section>
                            <div className="flex items-center gap-3 mb-3">
                                <Scale className="w-5 h-5 text-foreground" />
                                <h3 className="text-xl font-bold text-[var(--text)]">1. Acceptance of Terms</h3>
                            </div>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                By using FilePilot, you agree to these Terms of Service. If you do not agree, please do not use the service.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-3">
                                <FileText className="w-5 h-5 text-foreground" />
                                <h3 className="text-xl font-bold text-[var(--text)]">2. Use of Service</h3>
                            </div>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                You are free to use our tools for personal or commercial purposes. You agree not to use the service for any illegal activities or to process illegal content.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-3">
                                <Shield className="w-5 h-5 text-foreground" />
                                <h3 className="text-xl font-bold text-[var(--text)]">3. Limitation of Liability</h3>
                            </div>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                The service is provided "as is" without any warranty. We are not liable for any damages arising from the use of our tools, including data loss or business interruption.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-3">
                                <Copyright className="w-5 h-5 text-foreground" />
                                <h3 className="text-xl font-bold text-[var(--text)]">4. Intellectual Property</h3>
                            </div>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                The code and design of FilePilot are protected by copyright. Files you process using our tools remain your property.
                            </p>
                        </section>

                        <div className="pt-6 border-t border-[var(--border-light)] text-sm text-[var(--text-muted)]">
                            <p>Last updated: June 19, 2026</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
