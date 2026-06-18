import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { sanitizePDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, ShieldCheck, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const SanitizePdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const handleSanitize = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await sanitizePDF(file);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_sanitized.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Failed to sanitize PDF. The file may be corrupted or password-protected.');
        } finally {
            setIsProcessing(false);
        }
    };

    const features = [
        { label: 'Remove metadata', desc: 'Strips title, author, subject, keywords, creator, producer' },
        { label: 'Flatten forms', desc: 'Removes interactive form fields to prevent data extraction' },
        { label: 'Optimize structure', desc: 'Re-serializes with object streams for smaller, cleaner file' },
    ];

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Sanitize PDF – Remove Metadata & Hidden Data Free"
                description="Remove all metadata, hidden data, and flatten interactive elements from your PDF to protect privacy. 100% browser-based, no uploads."
                faqItems={[
                    { question: 'What does sanitizing a PDF do?', answer: 'It removes all metadata (author, creator, keywords), flattens form fields, and re-serializes the PDF structure to remove hidden data.' },
                    { question: 'Will my file content be changed?', answer: 'No. Only metadata and interactive elements are removed. The visible page content remains unchanged.' },
                    { question: 'Is my file uploaded?', answer: 'No. Everything runs locally in your browser.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 text-white flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Sanitize PDF – Remove Hidden Data</h1>
                    <p>Strip metadata and flatten forms for safe sharing. 100% private — never uploaded.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF here to sanitize it" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 text-white flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setSuccess(false); }} className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* What will be sanitized */}
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-[var(--text-secondary)]">What this does:</p>
                                    {features.map(f => (
                                        <div key={f.label} className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-green-800">{f.label}</p>
                                                <p className="text-xs text-green-700">{f.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> PDF sanitized successfully!
                                    </div>
                                )}

                                <button onClick={handleSanitize} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Sanitizing...</>) : (<><Download className="w-6 h-6" />Sanitize &amp; Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What does sanitizing a PDF do?', answer: 'It removes all metadata (author, creator, keywords), flattens form fields, and re-serializes the PDF structure to remove hidden data.' },
                { question: 'Will my file content be changed?', answer: 'No. Only metadata and interactive elements are removed. The visible page content remains unchanged.' },
                { question: 'Is my file uploaded?', answer: 'No. Everything runs locally in your browser.' },
            ]} />
        </div>
    );
};
