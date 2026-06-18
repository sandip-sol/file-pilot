import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { alternateMerge } from '../utils/pdf/pdfOperations';
import { Loader2, Download, X, FileText, Shuffle, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const AlternateMerge = () => {
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
        if (files.length < 2) { setError('Please add at least 2 PDF files.'); return; }
        setIsProcessing(true); setError(null);
        try {
            const bytes = await alternateMerge(files);
            downloadBlob(bytes, 'alternate_merge.pdf', 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not merge PDFs. Please check your files and try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Alternate Merge PDFs – Interleave Pages from Multiple PDFs"
                description="Interleave pages from two or more PDFs in alternating order. Perfect for combining front and back scans. 100% private — browser only."
                faqItems={[
                    { question: 'What is alternate merge?', answer: 'It interleaves pages from multiple PDFs: page 1 of doc 1, page 1 of doc 2, page 2 of doc 1, etc. — perfect for merging duplex scans.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your files never leave your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
                            <Shuffle className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Alternate Merge PDFs</h1>
                    <p>Interleave pages from multiple PDFs in alternating order — perfect for duplex scan combining.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        <FileUploader onFilesSelected={handleFilesSelected} multiple={true} accept=".pdf" description="Drop 2 or more PDFs to interleave" />

                        {files.length > 0 && (
                            <div className="mt-6 space-y-3 animate-fade-in">
                                <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">PDFs to interleave ({files.length})</h3>
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between bg-background border border-border rounded-xl p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
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

                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium mt-4">{error}</div>}
                        {success && (
                            <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2 mt-4">
                                <CheckCircle className="w-5 h-5" /> PDFs merged successfully!
                            </div>
                        )}

                        <button onClick={handleProcess} disabled={isProcessing || files.length < 2} className={`btn btn-primary w-full py-4 mt-6 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                            {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Merging...</>) : (<><Download className="w-6 h-6" />Alternate Merge & Download</>)}
                        </button>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex gap-3">
                        <FileText className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-purple-800"><strong>Tip:</strong> Add your front-sides PDF first, then your back-sides PDF. The result will have pages interleaved in reading order.</p>
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What is alternate merge?', answer: 'It interleaves pages from multiple PDFs: page 1 of doc 1, page 1 of doc 2, page 2 of doc 1, etc. — perfect for merging duplex scans.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your files never leave your device.' },
            ]} />
        </div>
    );
};
