import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { overlayPDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, X, Layers, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const OverlayPdf = () => {
    const [baseFile, setBaseFile] = useState<File | null>(null);
    const [overlayFile, setOverlayFile] = useState<File | null>(null);
    const [mode, setMode] = useState<'overlay' | 'underlay'>('overlay');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!baseFile || !overlayFile) { setError('Please select both a base and an overlay PDF.'); return; }
        setIsProcessing(true); setError(null);
        try {
            const bytes = await overlayPDF(baseFile, overlayFile, mode);
            downloadBlob(bytes, `${baseFile.name.replace('.pdf', '')}_${mode}.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not overlay PDFs. Please check your files and try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Overlay / Underlay PDFs – Stamp One PDF Over Another"
                description="Layer one PDF on top of or behind another. Perfect for adding letterheads, watermarks, or background templates. 100% private."
                faqItems={[
                    { question: 'What is the difference between overlay and underlay?', answer: 'Overlay places the second PDF on top of the base. Underlay places it behind the base content.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your files never leave your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Overlay / Underlay PDFs</h1>
                    <p>Layer one PDF on top of or beneath another — add letterheads, backgrounds, or watermarks.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Base PDF (the main document)</label>
                            {!baseFile ? (
                                <FileUploader onFilesSelected={f => { setBaseFile(f[0]); setError(null); }} multiple={false} accept=".pdf" description="Drop your base PDF here" />
                            ) : (
                                <div className="flex items-center justify-between bg-rose-50 border border-rose-100 rounded-xl p-3">
                                    <span className="text-sm font-medium">{baseFile.name}</span>
                                    <button onClick={() => setBaseFile(null)} className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"><X className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Overlay PDF (template / letterhead)</label>
                            {!overlayFile ? (
                                <FileUploader onFilesSelected={f => { setOverlayFile(f[0]); setError(null); }} multiple={false} accept=".pdf" description="Drop the overlay PDF here" />
                            ) : (
                                <div className="flex items-center justify-between bg-pink-50 border border-pink-100 rounded-xl p-3">
                                    <span className="text-sm font-medium">{overlayFile.name}</span>
                                    <button onClick={() => setOverlayFile(null)} className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"><X className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Mode</label>
                            <div className="flex gap-3">
                                {(['overlay', 'underlay'] as const).map(m => (
                                    <button key={m} onClick={() => setMode(m)}
                                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${mode === m ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-border hover:border-rose-300'}`}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                                {mode === 'overlay' ? 'The template PDF will appear on top of the base.' : 'The template PDF will appear behind the base content.'}
                            </p>
                        </div>

                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                        {success && (
                            <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> PDF {mode} created successfully!
                            </div>
                        )}

                        <button onClick={handleProcess} disabled={isProcessing || !baseFile || !overlayFile} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                            {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<><Download className="w-6 h-6" />Apply {mode.charAt(0).toUpperCase() + mode.slice(1)} & Download</>)}
                        </button>
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What is the difference between overlay and underlay?', answer: 'Overlay places the second PDF on top of the base. Underlay places it behind the base content.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your files never leave your device.' },
            ]} />
        </div>
    );
};
