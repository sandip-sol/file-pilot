import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { deskewPDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, ScanLine, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const DeskewPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); setProgress(0); }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null); setProgress(0);
        try {
            const bytes = await deskewPDF(file, (pct) => setProgress(Math.round(pct)));
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_deskewed.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not deskew this PDF. Please try another file.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Deskew PDF – Straighten Skewed Scanned Documents"
                description="Automatically straighten skewed or tilted pages from scanned PDFs. 100% private — browser only."
                faqItems={[
                    { question: 'How does deskewing work?', answer: 'Each page is rendered to a canvas and re-embedded straight into a new PDF, correcting minor tilt from scanning.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
                            <ScanLine className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Deskew PDF</h1>
                    <p>Straighten skewed or tilted pages from scanned PDFs for better readability.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a scanned PDF to deskew" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setSuccess(false); setProgress(0); }} className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800">
                                    <strong>Note:</strong> This is a best-effort deskew that re-renders each page as a straight image. For heavy skew correction, a specialized OCR pipeline is recommended.
                                </div>

                                {isProcessing && (
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[var(--text-secondary)]">Processing pages...</span>
                                            <span className="font-medium">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-indigo-100 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> PDF deskewed successfully!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Deskewing...</>) : (<><Download className="w-6 h-6" />Deskew & Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'How does deskewing work?', answer: 'Each page is rendered to a canvas and re-embedded straight into a new PDF, correcting minor tilt from scanning.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
