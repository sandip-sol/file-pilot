import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob2 } from '../utils/pdf/pdfOperations';
import { packagePDFsToZip } from '../utils/pdf/pdfOperations';
import { Loader2, Download, X, Archive, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const PdfToZip = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFilesSelected = (selected: File[]) => {
        setFiles(prev => [...prev, ...selected]);
        setError(null); setSuccess(false);
    };

    const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

    const handleProcess = async () => {
        if (files.length === 0) { setError('Please add at least 1 PDF file.'); return; }
        setIsProcessing(true); setError(null);
        try {
            const blob = await packagePDFsToZip(files);
            await downloadBlob2(blob, 'pdfs.zip');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not create ZIP. Please check your files.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="PDF to ZIP – Package Multiple PDFs into a ZIP Archive"
                description="Bundle multiple PDF files into a single compressed ZIP archive for easy sharing and downloading. 100% private."
                faqItems={[
                    { question: 'Can I add any number of PDFs?', answer: 'Yes. Add as many PDFs as you like. They will all be compressed into a single ZIP file.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your files never leave your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white flex items-center justify-center shadow-lg">
                            <Archive className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Package PDFs to ZIP</h1>
                    <p>Bundle multiple PDF files into a single ZIP archive for easy sharing.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                        <FileUploader onFilesSelected={handleFilesSelected} multiple={true} accept=".pdf" description="Drop PDFs to package into a ZIP" />

                        {files.length > 0 && (
                            <div className="space-y-3 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">Files ({files.length})</h3>
                                    <button onClick={() => setFiles([])} className="text-sm text-[var(--error)] hover:underline">Clear all</button>
                                </div>
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between bg-background border border-border rounded-xl p-3">
                                        <div className="flex items-center gap-3">
                                            <Archive className="w-5 h-5 text-amber-500" />
                                            <div>
                                                <p className="font-medium text-sm">{f.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{(f.size / 1024).toFixed(0)} KB</p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFile(i)} className="p-1.5 hover:text-[var(--error)] text-[var(--text-muted)] transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                        {success && (
                            <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> ZIP archive created!
                            </div>
                        )}

                        <button onClick={handleProcess} disabled={isProcessing || files.length === 0} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                            {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Creating ZIP...</>) : (<><Download className="w-6 h-6" />Create ZIP Archive</>)}
                        </button>
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Can I add any number of PDFs?', answer: 'Yes. Add as many PDFs as you like. They will all be compressed into a single ZIP file.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your files never leave your device.' },
            ]} />
        </div>
    );
};
