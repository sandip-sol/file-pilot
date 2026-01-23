import { ShieldCheck } from 'lucide-react';

export const Privacy = () => {
    return (
        <div className="container py-12 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-8 flex items-start gap-4">
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
                <div>
                    <h2 className="text-xl font-semibold text-emerald-800 mb-2">Our Core Promise</h2>
                    <p className="text-emerald-700">
                        Your files never leave your device. All processing happens locally in your browser using secure WebAssembly technology. We do not have servers that store or view your documents.
                    </p>
                </div>
            </div>

            <div className="prose prose-indigo max-w-none text-[var(--text-muted)] space-y-6">
                <section>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-2">1. Local Processing</h3>
                    <p>
                        PDFBuddy operates entirely on the client-side (in your browser). When you "upload" a file, it is loaded into your browser's memory, processed, and then provided back to you as a download. No file data is transmitted to us or any third party.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-2">2. Data Collection</h3>
                    <p>
                        We do not collect any personal data, IP addresses, or usage logs. We do not use cookies for tracking or advertising.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-2">3. No Warranties</h3>
                    <p>
                        Since processing happens locally, the speed and success of operations depend on your device's capabilities. Large files might cause the browser to become unresponsive. We are not responsible for any data loss or corruption.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-2">4. Changes</h3>
                    <p>
                        We may update this privacy statement from time to time. Since we don't collect user info, we advise checking this page for updates.
                    </p>
                </section>

                <div className="pt-8 border-t border-[var(--border)] mt-8">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};
