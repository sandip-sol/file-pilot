import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { posterizePDF, downloadBytes } from '../utils/pdf/pdfOperations';
import { TableColumnsSplit, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const DividePages = () => {
    const [file, setFile] = useState<File | null>(null);
    const [direction, setDirection] = useState<'horizontal' | 'vertical'>('vertical');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            // Split each page in half: vertical = 2 cols x 1 row, horizontal = 1 col x 2 rows
            const bytes = direction === 'vertical'
                ? await posterizePDF(file, 2, 1)
                : await posterizePDF(file, 1, 2);
            downloadBytes(bytes, file.name.replace('.pdf', `_divided_${direction}.pdf`));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Divide PDF Pages Online – Free & Private" description="Split each PDF page in half horizontally or vertically. Browser-based, no uploads." faqItems={[{ question: 'What does Divide do?', answer: 'Each page is split into two halves, doubling the page count.' }, { question: 'Which direction should I choose?', answer: 'Vertical splits pages left/right; Horizontal splits top/bottom.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 text-white flex items-center justify-center shadow-lg"><TableColumnsSplit className="w-6 h-6" /></div></div>
                <h1>Divide PDF Pages</h1><p>Split each page in half — ideal for double-page scans. Fully browser-based.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-5">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            <div>
                                <label className="block text-sm font-medium mb-3">Split Direction</label>
                                <div className="flex gap-3">
                                    {(['vertical', 'horizontal'] as const).map(d => (
                                        <button key={d} onClick={() => setDirection(d)} className={`flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-colors ${direction === d ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border hover:bg-muted'}`}>
                                            {d === 'vertical' ? '◫ Vertical (left/right)' : '⬒ Horizontal (top/bottom)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Divided PDF downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Dividing…</> : <><Download className="w-5 h-5" />Divide &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'What does Divide do?', answer: 'Each page is split into two halves, doubling the page count.' }, { question: 'Which direction?', answer: 'Vertical splits left/right; Horizontal splits top/bottom.' }]} />
        </div>
    );
};
