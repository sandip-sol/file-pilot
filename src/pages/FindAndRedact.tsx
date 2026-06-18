import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { findAndRedact } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Search, CheckCircle, ShieldAlert } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const FindAndRedactPage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [searchText, setSearchText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const handleProcess = async () => {
        if (!file || !searchText.trim()) {
            setError('Please enter a search term to redact.');
            return;
        }
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await findAndRedact(file, searchText.trim());
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_redacted.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Failed to redact PDF. The file may be corrupted or password-protected.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Find & Redact PDF Text – Free Privacy Tool"
                description="Search for sensitive text in your PDF and redact it with black boxes. Burn redactions permanently into the PDF. 100% private — processed locally."
                faqItems={[
                    { question: 'Are redactions permanent?', answer: 'Yes. The tool draws black rectangles over matching text and burns them into the PDF output.' },
                    { question: 'Is searching case-sensitive?', answer: 'No. The search is case-insensitive by default.' },
                    { question: 'Will my file be uploaded?', answer: 'No. Everything runs locally in your browser.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-700 to-black text-white flex items-center justify-center shadow-lg">
                            <Search className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Find &amp; Redact PDF Text</h1>
                    <p>Search for sensitive words and permanently black them out. 100% private.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF here to redact text" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-700 to-black text-white flex items-center justify-center">
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

                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3 text-sm text-yellow-800">
                                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p><strong>Permanent action:</strong> Redacted text cannot be recovered. Only text-layer content is matched — scanned image PDFs may require OCR first.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Text to Redact</label>
                                    <input
                                        type="text"
                                        value={searchText}
                                        onChange={e => setSearchText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleProcess(); }}
                                        placeholder="e.g. John Doe, SSN, confidential"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                                    />
                                    <p className="mt-1.5 text-xs text-[var(--text-muted)]">Case-insensitive search. All matching text will be covered with black boxes.</p>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Text redacted and PDF saved!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing || !searchText.trim()} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Redacting...</>) : (<><Download className="w-6 h-6" />Redact &amp; Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Are redactions permanent?', answer: 'Yes. The tool draws black rectangles over matching text and burns them into the PDF output.' },
                { question: 'Is searching case-sensitive?', answer: 'No. The search is case-insensitive by default.' },
                { question: 'Will my file be uploaded?', answer: 'No. Everything runs locally in your browser.' },
            ]} />
        </div>
    );
};
