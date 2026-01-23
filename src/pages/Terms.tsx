export const Terms = () => {
    return (
        <div className="container py-12 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

            <div className="prose prose-indigo max-w-none text-[var(--text-muted)] space-y-6">
                <section>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-2">1. Acceptance of Terms</h3>
                    <p>
                        By using pdf-buddy, you agree to these Terms of Service. If you do not agree, please do not use the service.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-2">2. Use of Service</h3>
                    <p>
                        You are free to use our tools for personal or commercial purposes. You agree not to use the service for any illegal activities or to process illegal content.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-2">3. Limitation of Liability</h3>
                    <p>
                        The service is provided "as is" without any warranty of any kind. We are not liable for any damages arising from the use of our tools, including but not limited to data loss or business interruption.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-2">4. Intellectual Property</h3>
                    <p>
                        The code and design of PDFBuddy are protected by copyright. However, files you process using our tools remain your property.
                    </p>
                </section>
            </div>
        </div>
    );
};
