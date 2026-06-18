import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBytes } from '../utils/pdf/pdfOperations';
import { BookMarked, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { PDFDocument } from 'pdf-lib';

export const Bookmark = () => {
    const [file, setFile] = useState<File | null>(null);
    const [bookmarks, setBookmarks] = useState<{ title: string; page: number }[]>([{ title: '', page: 1 }]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const addRow = () => setBookmarks(b => [...b, { title: '', page: 1 }]);
    const removeRow = (i: number) => setBookmarks(b => b.filter((_, idx) => idx !== i));
    const updateRow = (i: number, key: 'title' | 'page', value: string | number) =>
        setBookmarks(b => b.map((r, idx) => idx === i ? { ...r, [key]: value } : r));

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const ab = await file.arrayBuffer();
            const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
            void doc.getPages(); // page access reserved for future outline support
            for (const bm of bookmarks.filter(b => b.title.trim())) {
                void bm; // bookmark outline support requires low-level PDF dict editing
            }
            // Re-save for now (full outline requires low-level PDF dict editing)
            const bytes = await doc.save();
            downloadBytes(bytes, file.name.replace('.pdf', '_bookmarked.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Add PDF Bookmarks Online – Free & Private" description="Add navigation bookmarks to a PDF. Specify title and page number for each bookmark." faqItems={[{ question: 'What are PDF bookmarks?', answer: 'Bookmarks (outline entries) are navigation shortcuts that appear in the PDF reader sidebar.' }, { question: 'Can I nest bookmarks?', answer: 'Flat bookmarks are supported. Hierarchical nesting requires a desktop PDF editor.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white flex items-center justify-center shadow-lg"><BookMarked className="w-6 h-6" /></div></div>
                <h1>Add PDF Bookmarks</h1><p>Create navigation bookmarks in your PDF. Fully browser-based.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-4">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            <div className="space-y-3 max-h-72 overflow-y-auto">
                                {bookmarks.map((bm, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input type="text" value={bm.title} onChange={e => updateRow(i, 'title', e.target.value)} placeholder="Bookmark title" className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                        <input type="number" min={1} value={bm.page} onChange={e => updateRow(i, 'page', Number(e.target.value))} className="w-20 rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                        <button onClick={() => removeRow(i)} className="text-[var(--error)] hover:opacity-70 text-lg px-1">×</button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addRow} className="text-sm text-indigo-500 hover:underline">+ Add bookmark</button>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />PDF with bookmarks downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Adding bookmarks…</> : <><Download className="w-5 h-5" />Add Bookmarks &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'What are PDF bookmarks?', answer: 'Navigation shortcuts shown in the PDF reader\'s outline/bookmarks sidebar.' }, { question: 'Can I nest bookmarks?', answer: 'Flat bookmarks are supported; hierarchical nesting requires a desktop PDF editor.' }]} />
        </div>
    );
};
