import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { createNUp } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, LayoutGrid, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

const LAYOUTS = [
    { value: 2, label: '2-Up (2 pages per sheet)', desc: '2 columns × 1 row' },
    { value: 4, label: '4-Up (4 pages per sheet)', desc: '2 columns × 2 rows' },
    { value: 6, label: '6-Up (6 pages per sheet)', desc: '3 columns × 2 rows' },
    { value: 9, label: '9-Up (9 pages per sheet)', desc: '3 columns × 3 rows' },
];

export const NUpPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [n, setN] = useState<2 | 4 | 6 | 9>(4);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await createNUp(file, n);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_${n}up.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not process this PDF. Please try another file.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="N-Up PDF – Multiple Pages Per Sheet Online Free"
                description="Combine 2, 4, 6, or 9 PDF pages onto a single sheet. Save paper and create compact handouts. 100% private — browser only."
                faqItems={[
                    { question: 'What is N-Up printing?', answer: 'N-Up combines multiple pages onto a single sheet. 4-Up places 4 pages on one sheet, great for printing handouts.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>N-Up PDF Pages</h1>
                    <p>Combine multiple PDF pages onto a single sheet — 2, 4, 6, or 9 pages per page.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to create N-Up layout" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center">
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
                                    <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">Layout</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {LAYOUTS.map(l => (
                                            <button
                                                key={l.value}
                                                onClick={() => setN(l.value as 2 | 4 | 6 | 9)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${n === l.value ? 'border-amber-500 bg-amber-50' : 'border-border hover:border-amber-300'}`}
                                            >
                                                <p className="font-semibold text-sm">{l.label}</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-1">{l.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> N-Up PDF created!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<><Download className="w-6 h-6" />Create {n}-Up PDF</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What is N-Up printing?', answer: 'N-Up combines multiple pages onto a single sheet. 4-Up places 4 pages on one sheet, great for printing handouts.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
