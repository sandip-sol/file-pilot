import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { extractPDFPages, downloadBytes } from '../utils/pdf/pdfOperations';
import { Ungroup, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const ExtractPages = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pageInput, setPageInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const parsePages = (input: string): number[] => {
        const nums = new Set<number>();
        input.split(',').forEach(part => {
            const range = part.trim().split('-');
            if (range.length === 2) { const s = parseInt(range[0]), e = parseInt(range[1]); if (!isNaN(s) && !isNaN(e)) for (let i = s; i <= e; i++) nums.add(i); }
            else { const n = parseInt(part.trim()); if (!isNaN(n)) nums.add(n); }
        });
        return Array.from(nums).sort((a, b) => a - b);
    };

    const handleProcess = async () => {
        if (!file || !pageInput.trim()) return;
        setIsProcessing(true); setError(null);
        try {
            const pages = parsePages(pageInput);
            if (!pages.length) { setError('No valid page numbers.'); setIsProcessing(false); return; }
            const bytes = await extractPDFPages(file, pages);
            downloadBytes(bytes, file.name.replace('.pdf', '_extracted.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Extract PDF Pages Online – Free & Private" description="Pull out specific pages from a PDF into a new document. Browser-based, private." faqItems={[{ question: 'What format do I enter pages?', answer: 'Comma-separated numbers or ranges: 1,3,5-8.' }, { question: 'Does the original file change?', answer: 'No. A new PDF is created with only the extracted pages.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg"><Ungroup className="w-6 h-6" /></div></div>
                <h1>Extract PDF Pages Online</h1><p>Pull specific pages out of a PDF into a new file. Enter page numbers or ranges.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in">
                            <p className="text-sm mb-3"><strong>{file.name}</strong></p>
                            <label className="block text-sm font-medium mb-2">Pages to extract (e.g. 1,3,5-8)</label>
                            <input type="text" value={pageInput} onChange={e => setPageInput(e.target.value)} placeholder="1,3,5-8" className="w-full rounded-xl border border-border bg-muted px-4 py-3 mb-5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl mb-4 text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl mb-4 text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Extracted PDF downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing || !pageInput.trim()} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Extracting…</> : <><Download className="w-5 h-5" />Extract &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'What format do I use?', answer: 'Comma-separated numbers or ranges: 1,3,5-8.' }, { question: 'Does the original change?', answer: 'No. A new PDF is created with only the extracted pages.' }]} />
        </div>
    );
};
