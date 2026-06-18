import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { reversePDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, ArrowLeftRight, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const ReversePdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setError(null);
            setSuccess(false);
        }
    };

    const handleReverse = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await reversePDF(file);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_reversed.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to reverse PDF. The file may be corrupted or password-protected.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Reverse PDF Pages Order – Free & Private Online Tool"
                description="Reverse the page order of your PDF instantly in the browser. No uploads, 100% private and free. Great for reading books and documents in reverse."
                faqItems={[
                    { question: 'What does reversing a PDF do?', answer: 'It flips the page order so the last page becomes the first page, and vice versa.' },
                    { question: 'Is my file uploaded to a server?', answer: 'No. Everything runs locally in your browser. Your file never leaves your device.' },
                    { question: 'Is there a page limit?', answer: 'No hard limit. Very large files may take more time depending on your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
                            <ArrowLeftRight className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Reverse PDF Page Order</h1>
                    <p>Flip the page order of your PDF instantly. 100% private — files never leave your browser.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF here to reverse its pages" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center">
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

                                <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-xl text-sm text-cyan-700">
                                    <strong>How it works:</strong> The last page of your PDF will become page 1, the second-to-last becomes page 2, and so on. The content of each page is unchanged.
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        PDF reversed successfully! Check your downloads.
                                    </div>
                                )}

                                <button onClick={handleReverse} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Reversing...</>) : (<><Download className="w-6 h-6" />Reverse &amp; Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What does reversing a PDF do?', answer: 'It flips the page order so the last page becomes the first page, and vice versa.' },
                { question: 'Is my file uploaded to a server?', answer: 'No. Everything runs locally in your browser. Your file never leaves your device.' },
                { question: 'Is there a page limit?', answer: 'No hard limit. Very large files may take more time depending on your device.' },
            ]} />
        </div>
    );
};
