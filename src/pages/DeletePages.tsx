import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { deletePDFPages } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Trash2, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const DeletePages = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pageInput, setPageInput] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            const f = files[0];
            setFile(f);
            setError(null);
            setSuccess(false);
            try {
                const { PDFDocument } = await import('pdf-lib');
                const ab = await f.arrayBuffer();
                const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
                setTotalPages(doc.getPageCount());
            } catch {
                setTotalPages(0);
            }
        }
    };

    const parsePages = (input: string, total: number): number[] => {
        const pages: number[] = [];
        for (const part of input.split(',')) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [s, e] = trimmed.split('-').map(Number);
                if (!isNaN(s) && !isNaN(e)) {
                    for (let i = s; i <= e && i <= total; i++) if (i >= 1) pages.push(i);
                }
            } else {
                const n = parseInt(trimmed, 10);
                if (!isNaN(n) && n >= 1 && n <= total) pages.push(n);
            }
        }
        return [...new Set(pages)];
    };

    const handleDelete = async () => {
        if (!file || !pageInput.trim()) return;
        const pages = parsePages(pageInput, totalPages);
        if (pages.length === 0) {
            setError('No valid pages specified.');
            return;
        }
        if (pages.length >= totalPages) {
            setError('You cannot delete all pages from a PDF.');
            return;
        }
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await deletePDFPages(file, pages);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_edited.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to delete pages. The file may be corrupted or password-protected.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Delete PDF Pages Online – Free & Private"
                description="Remove specific pages from your PDF instantly in the browser. Enter page numbers or ranges. 100% private — no uploads."
                faqItems={[
                    { question: 'Will my file be uploaded?', answer: 'No. Processing happens entirely in your browser with no server involved.' },
                    { question: 'How do I specify pages to delete?', answer: 'Enter page numbers separated by commas. Use hyphens for ranges, e.g. "1, 3-5, 8".' },
                    { question: 'Can I delete all pages?', answer: 'No — you cannot delete all pages because a PDF must have at least one page.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-lg">
                            <Trash2 className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Delete PDF Pages</h1>
                    <p>Remove unwanted pages from your PDF instantly. 100% private — never uploaded.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF here to delete pages" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{totalPages} pages · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setSuccess(false); setTotalPages(0); }} className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">
                                        Pages to Delete {totalPages > 0 && <span className="text-[var(--text-muted)] font-normal">(1–{totalPages})</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={pageInput}
                                        onChange={e => setPageInput(e.target.value)}
                                        placeholder="e.g. 1, 3-5, 8"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                    />
                                    <p className="mt-1.5 text-xs text-[var(--text-muted)]">Separate page numbers with commas. Use hyphens for ranges.</p>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Pages deleted successfully! Check your downloads.
                                    </div>
                                )}

                                <button onClick={handleDelete} disabled={isProcessing || !pageInput.trim()} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Deleting Pages...</>) : (<><Download className="w-6 h-6" />Delete &amp; Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Will my file be uploaded?', answer: 'No. Processing happens entirely in your browser with no server involved.' },
                { question: 'How do I specify pages to delete?', answer: 'Enter page numbers separated by commas. Use hyphens for ranges, e.g. "1, 3-5, 8".' },
                { question: 'Can I delete all pages?', answer: 'No — you cannot delete all pages because a PDF must have at least one page.' },
            ]} />
        </div>
    );
};
