import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { fixPageSize } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Maximize2, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

type PageSizeOption = 'A4' | 'Letter' | 'A3' | 'Legal';

const PAGE_SIZES: { value: PageSizeOption; label: string; desc: string }[] = [
    { value: 'A4', label: 'A4', desc: '210 × 297 mm' },
    { value: 'Letter', label: 'US Letter', desc: '8.5 × 11 in' },
    { value: 'A3', label: 'A3', desc: '297 × 420 mm' },
    { value: 'Legal', label: 'US Legal', desc: '8.5 × 14 in' },
];

export const FixPageSize = () => {
    const [file, setFile] = useState<File | null>(null);
    const [targetSize, setTargetSize] = useState<PageSizeOption>('A4');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await fixPageSize(file, targetSize);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_${targetSize.toLowerCase()}.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to resize pages. The file may be corrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Fix PDF Page Size – Resize to A4, Letter, A3, Legal Free"
                description="Resize all pages of your PDF to A4, US Letter, A3, or Legal size. Scales content to fit. 100% private — no uploads."
                faqItems={[
                    { question: 'Will my page content be cropped?', answer: 'No. Content is scaled proportionally to fit the new page size with equal margins.' },
                    { question: 'Does this change the orientation?', answer: 'No. The tool scales the existing content to fit the target size, preserving orientation.' },
                    { question: 'Is my file uploaded?', answer: 'No. Everything runs locally in your browser.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
                            <Maximize2 className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Fix PDF Page Size</h1>
                    <p>Resize all PDF pages to A4, Letter, A3, or Legal. 100% private.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to resize its pages" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center">
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
                                    <label className="block text-sm font-semibold mb-3 text-[var(--text-secondary)]">Target Page Size</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {PAGE_SIZES.map(s => (
                                            <button key={s.value} onClick={() => setTargetSize(s.value)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${targetSize === s.value ? 'border-sky-500 bg-sky-50' : 'border-border hover:border-sky-300'}`}>
                                                <p className={`font-bold ${targetSize === s.value ? 'text-sky-700' : 'text-[var(--text)]'}`}>{s.label}</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Pages resized successfully!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Resizing...</>) : (<><Download className="w-6 h-6" />Resize to {targetSize} &amp; Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Will my page content be cropped?', answer: 'No. Content is scaled proportionally to fit the new page size with equal margins.' },
                { question: 'Does this change the orientation?', answer: 'No. The tool scales the existing content to fit the target size, preserving orientation.' },
                { question: 'Is my file uploaded?', answer: 'No. Everything runs locally in your browser.' },
            ]} />
        </div>
    );
};
