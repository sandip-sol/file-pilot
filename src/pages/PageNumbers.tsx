import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { addPageNumbers, downloadBytes } from '../utils/pdf/pdfOperations';
import { ListOrdered, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

const POSITIONS = ['bottom-center', 'bottom-right', 'bottom-left', 'top-center', 'top-right', 'top-left'] as const;
type Position = typeof POSITIONS[number];

export const PageNumbers = () => {
    const [file, setFile] = useState<File | null>(null);
    const [position, setPosition] = useState<Position>('bottom-center');
    const [startNumber, setStartNumber] = useState(1);
    const [fontSize, setFontSize] = useState(12);
    const [prefix, setPrefix] = useState('');
    const [suffix, setSuffix] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await addPageNumbers(file, { position, startNumber, fontSize, prefix, suffix });
            downloadBytes(bytes, file.name.replace('.pdf', '_numbered.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Add Page Numbers to PDF – Free & Private" description="Add customizable page numbers to any PDF. Choose position, start number, font size, and prefix/suffix." faqItems={[{ question: 'Can I start numbering from a custom number?', answer: 'Yes. Set the start number field to any value.' }, { question: 'Can I add a prefix like "Page"?', answer: 'Yes. Enter text in the Prefix field, e.g. "Page ".' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center shadow-lg"><ListOrdered className="w-6 h-6" /></div></div>
                <h1>Add Page Numbers to PDF</h1><p>Customize position, start number, font size, prefix and suffix.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-5">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            <div>
                                <label className="block text-sm font-medium mb-2">Position</label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {POSITIONS.map(p => (
                                        <button key={p} onClick={() => setPosition(p)} className={`rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${position === p ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border hover:bg-muted'}`}>{p.replace('-', ' ')}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Start Number</label><input type="number" min={1} value={startNumber} onChange={e => setStartNumber(Number(e.target.value))} className="w-full rounded-lg border border-border bg-muted px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
                                <div><label className="block text-sm font-medium mb-1">Font Size</label><input type="number" min={6} max={36} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full rounded-lg border border-border bg-muted px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
                                <div><label className="block text-sm font-medium mb-1">Prefix</label><input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="Page " className="w-full rounded-lg border border-border bg-muted px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
                                <div><label className="block text-sm font-medium mb-1">Suffix</label><input type="text" value={suffix} onChange={e => setSuffix(e.target.value)} placeholder=" of 10" className="w-full rounded-lg border border-border bg-muted px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
                            </div>
                            <div className="pt-2 text-sm text-[var(--text-muted)]">Preview: <strong>{prefix}{startNumber}{suffix}</strong>, {prefix}{startNumber + 1}{suffix}, &hellip;</div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />PDF with page numbers downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Adding numbers…</> : <><Download className="w-5 h-5" />Add Numbers &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'Can I start numbering from a custom number?', answer: 'Yes – set any start number in the field.' }, { question: 'Can I add a prefix?', answer: 'Yes – enter text in the Prefix field, e.g. "Page ".' }]} />
        </div>
    );
};
