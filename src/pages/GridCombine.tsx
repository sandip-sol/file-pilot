import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { gridCombinePDFs } from '../utils/pdf/pdfOperations';
import { Loader2, Download, X, Grid, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const GridCombine = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [cols, setCols] = useState(2);
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
            const bytes = await gridCombinePDFs(files, cols);
            downloadBlob(bytes, 'grid_combine.pdf', 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not combine PDFs. Please check your files and try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Grid Combine PDFs – Arrange Multiple PDFs in a Grid Layout"
                description="Arrange first pages of multiple PDFs in a grid layout. Create comparison sheets or overviews. 100% private — browser only."
                faqItems={[
                    { question: 'What does Grid Combine do?', answer: 'It takes the first page of each PDF you upload and arranges them in a grid layout on a single page, like a comparison sheet.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your files never leave your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
                            <Grid className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Grid Combine PDFs</h1>
                    <p>Arrange the first page of each PDF into a grid — perfect for comparison sheets and overviews.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                        <FileUploader onFilesSelected={handleFilesSelected} multiple={true} accept=".pdf" description="Drop 2 or more PDFs to arrange in a grid" />

                        {files.length > 0 && (
                            <div className="space-y-3 animate-fade-in">
                                <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">PDFs ({files.length})</h3>
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between bg-background border border-border rounded-xl p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                            <p className="font-medium text-sm">{f.name}</p>
                                        </div>
                                        <button onClick={() => removeFile(i)} className="p-1.5 hover:text-[var(--error)] text-[var(--text-muted)] transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Columns</label>
                            <select value={cols} onChange={e => setCols(parseInt(e.target.value))}>
                                <option value="2">2 columns</option>
                                <option value="3">3 columns</option>
                                <option value="4">4 columns</option>
                            </select>
                        </div>

                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                        {success && (
                            <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Grid PDF created!
                            </div>
                        )}

                        <button onClick={handleProcess} disabled={isProcessing || files.length < 2} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                            {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<><Download className="w-6 h-6" />Create Grid PDF</>)}
                        </button>
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What does Grid Combine do?', answer: 'It takes the first page of each PDF you upload and arranges them in a grid layout on a single page, like a comparison sheet.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your files never leave your device.' },
            ]} />
        </div>
    );
};
