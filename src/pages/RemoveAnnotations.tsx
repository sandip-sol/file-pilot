import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { flattenPDF, removeMetadata, downloadBytes } from '../utils/pdf/pdfOperations';
import { Eraser, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const RemoveAnnotations = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            // Flatten removes interactive form elements and flattens annotations into static content
            const bytes = await flattenPDF(file);
            downloadBytes(bytes, file.name.replace('.pdf', '_no_annotations.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Remove PDF Annotations Online – Free & Private" description="Strip all comments, highlights, form fields, and interactive annotations from a PDF." faqItems={[{ question: 'What annotations are removed?', answer: 'Form fields, comments, highlights, links, and other interactive elements are flattened or removed.' }, { question: 'Is the content affected?', answer: 'Static text and images remain; only interactive layers are removed.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center shadow-lg"><Eraser className="w-6 h-6" /></div></div>
                <h1>Remove PDF Annotations</h1><p>Strip all comments, highlights, and form fields from a PDF. Browser-based.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-4">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Clean PDF downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Removing…</> : <><Download className="w-5 h-5" />Remove &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'What annotations are removed?', answer: 'Form fields, comments, highlights and links are flattened.' }, { question: 'Is content affected?', answer: 'Static pages remain intact; only interactive layers are removed.' }]} />
        </div>
    );
};
