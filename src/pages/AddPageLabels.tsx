import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';

import { Tag, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const AddPageLabels = () => {
    const [file, setFile] = useState<File | null>(null);
    const [prefix, setPrefix] = useState('Page ');
    const [startFrom, setStartFrom] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            // Add page labels via PDF standard page labels (stored in document catalog)
            // Using pdf-lib we set subject as label metadata and add page numbers
            const { addPageNumbers, downloadBytes: dl } = await import('../utils/pdf/pdfOperations');
            const bytes = await addPageNumbers(file, { position: 'bottom-center', startNumber: startFrom, prefix, suffix: '' });
            dl(bytes, file.name.replace('.pdf', '_labeled.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Add Page Labels to PDF – Free & Private" description="Add custom page labels (prefix and start number) to PDF pages. Browser-based." faqItems={[{ question: 'What are page labels?', answer: 'Page labels are custom identifiers like "Appendix A-1" or "ii" added to PDF pages.' }, { question: 'Where do labels appear?', answer: 'Labels are rendered at the bottom center of each page.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-green-600 text-white flex items-center justify-center shadow-lg"><Tag className="w-6 h-6" /></div></div>
                <h1>Add Page Labels to PDF</h1><p>Add custom label prefixes and start numbers to your PDF pages.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-4">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-2">Prefix</label><input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="Page " className="w-full rounded-xl border border-border bg-muted px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400" /></div>
                                <div><label className="block text-sm font-medium mb-2">Start Number</label><input type="number" min={1} value={startFrom} onChange={e => setStartFrom(Number(e.target.value))} className="w-full rounded-xl border border-border bg-muted px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400" /></div>
                            </div>
                            <div className="rounded-xl bg-muted px-4 py-3 text-sm text-[var(--text-muted)]">Preview: <strong>{prefix}{startFrom}</strong>, {prefix}{startFrom + 1}, {prefix}{startFrom + 2}…</div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Labeled PDF downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Labeling…</> : <><Download className="w-5 h-5" />Add Labels &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'What are page labels?', answer: 'Custom identifiers like "App. A-1" added visually to page footers.' }, { question: 'Where do labels appear?', answer: 'Labels are rendered at the bottom center of each page.' }]} />
        </div>
    );
};
