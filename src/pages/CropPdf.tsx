import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBytes } from '../utils/pdf/pdfOperations';
import { Crop, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { PDFDocument } from 'pdf-lib';

export const CropPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [top, setTop] = useState(0);
    const [right, setRight] = useState(0);
    const [bottom, setBottom] = useState(0);
    const [left, setLeft] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const ab = await file.arrayBuffer();
            const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
            const pages = doc.getPages();
            for (const page of pages) {
                const { width, height } = page.getSize();
                // Set CropBox
                page.setCropBox(left, bottom, width - left - right, height - top - bottom);
            }
            const bytes = await doc.save();
            downloadBytes(bytes, file.name.replace('.pdf', '_cropped.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Crop PDF Pages Online – Free & Private" description="Trim PDF margins by setting crop amounts (in points) for top, right, bottom, left. Browser-based." faqItems={[{ question: 'What unit are the crop values?', answer: 'Values are in points (72 points = 1 inch).' }, { question: 'Does cropping delete content?', answer: 'No. PDF crop boxes hide content; the original data remains embedded.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-lg"><Crop className="w-6 h-6" /></div></div>
                <h1>Crop PDF Pages</h1><p>Set crop margins (in pt) to trim all pages. 72 pt = 1 inch.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-5">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            <div className="grid grid-cols-2 gap-4">
                                {([['top', top, setTop], ['right', right, setRight], ['bottom', bottom, setBottom], ['left', left, setLeft]] as [string, number, (v: number) => void][]).map(([label, val, setter]) => (
                                    <div key={label}>
                                        <label className="block text-sm font-medium mb-2 capitalize">{label} (pt)</label>
                                        <input type="number" min={0} value={val} onChange={e => setter(Number(e.target.value))} className="w-full rounded-xl border border-border bg-muted px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                                    </div>
                                ))}
                            </div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Cropped PDF downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Cropping…</> : <><Download className="w-5 h-5" />Crop &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'What unit are crop values?', answer: 'Points — 72 pt = 1 inch. A4 = 595 × 842 pt.' }, { question: 'Does cropping delete content?', answer: 'No. PDF crop boxes visually hide content; original data stays embedded.' }]} />
        </div>
    );
};
