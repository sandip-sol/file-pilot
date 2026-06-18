import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { addHeaderFooter } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, AlignVerticalJustifyCenter, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const HeaderFooter = () => {
    const [file, setFile] = useState<File | null>(null);
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState('');
    const [fontSize, setFontSize] = useState(11);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const handleProcess = async () => {
        if (!file) return;
        if (!headerText.trim() && !footerText.trim()) {
            setError('Please enter at least a header or footer text.');
            return;
        }
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await addHeaderFooter(file, {
                headerText: headerText.trim() || undefined,
                footerText: footerText.trim() || undefined,
                fontSize,
            });
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_header-footer.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to add header/footer. The file may be corrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Add Header & Footer to PDF – Free Online Tool"
                description="Add custom header and footer text to every page of your PDF. Works entirely in your browser — no uploads, 100% private."
                faqItems={[
                    { question: 'Will my file be uploaded?', answer: 'No. Everything runs locally in your browser.' },
                    { question: 'Can I add just a header or just a footer?', answer: 'Yes! You can fill in only the header field, only the footer field, or both.' },
                    { question: 'Is the header/footer centered?', answer: 'Yes, both header and footer text are centered horizontally on the page.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
                            <AlignVerticalJustifyCenter className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Add Header &amp; Footer to PDF</h1>
                    <p>Insert custom header and footer text on every page. 100% private.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF here to add header/footer" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center">
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

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Header Text</label>
                                    <input type="text" value={headerText} onChange={e => setHeaderText(e.target.value)}
                                        placeholder="e.g. CONFIDENTIAL"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Footer Text</label>
                                    <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)}
                                        placeholder="e.g. Company Name · 2024"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Font Size: {fontSize}pt</label>
                                    <input type="range" min={8} max={24} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                                        className="w-full accent-teal-500" />
                                    <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                                        <span>8pt</span><span>24pt</span>
                                    </div>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Header/footer added successfully!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<><Download className="w-6 h-6" />Add Header/Footer &amp; Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Will my file be uploaded?', answer: 'No. Everything runs locally in your browser.' },
                { question: 'Can I add just a header or just a footer?', answer: 'Yes! You can fill in only the header field, only the footer field, or both.' },
                { question: 'Is the header/footer centered?', answer: 'Yes, both header and footer text are centered horizontally on the page.' },
            ]} />
        </div>
    );
};
