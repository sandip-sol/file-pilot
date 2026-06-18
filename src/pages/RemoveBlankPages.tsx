import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBytes } from '../utils/pdf/pdfOperations';
import { FileMinus2, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { PDFDocument } from 'pdf-lib';

async function detectAndRemoveBlankPages(file: File, threshold = 98): Promise<Uint8Array> {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const ab = await file.arrayBuffer();
    const pdfJs = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    const src = await PDFDocument.load(ab, { ignoreEncryption: true });
    const numPages = pdfJs.numPages;
    const keepIndices: number[] = [];

    for (let i = 1; i <= numPages; i++) {
        const page = await pdfJs.getPage(i);
        const vp = page.getViewport({ scale: 0.5 }); // small scale for speed
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport: vp, canvas }).promise;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let whitePixels = 0;
        for (let j = 0; j < data.length; j += 4) {
            if (data[j] > 240 && data[j + 1] > 240 && data[j + 2] > 240) whitePixels++;
        }
        const totalPixels = canvas.width * canvas.height;
        const pct = (whitePixels / totalPixels) * 100;
        if (pct < threshold) keepIndices.push(i - 1); // 0-based
    }

    const result = await PDFDocument.create();
    const copied = await result.copyPages(src, keepIndices);
    copied.forEach(p => result.addPage(p));
    return result.save();
}

export const RemoveBlankPages = () => {
    const [file, setFile] = useState<File | null>(null);
    const [threshold, setThreshold] = useState(98);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await detectAndRemoveBlankPages(file, threshold);
            downloadBytes(bytes, file.name.replace('.pdf', '_no_blanks.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Remove Blank PDF Pages Online – Free & Private" description="Automatically detect and remove blank pages from a PDF. Adjust sensitivity. Browser-based." faqItems={[{ question: 'How is a blank page detected?', answer: 'Pages are rendered and analysed; those with over 98% white pixels are considered blank.' }, { question: 'What if a near-blank page is removed?', answer: 'Lower the sensitivity slider to keep pages with light content.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-600 text-white flex items-center justify-center shadow-lg"><FileMinus2 className="w-6 h-6" /></div></div>
                <h1>Remove Blank PDF Pages</h1><p>Automatically detect and strip blank pages from a PDF document.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-5">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            <div>
                                <label className="block text-sm font-medium mb-2">Blank threshold: {threshold}% white pixels</label>
                                <input type="range" min={85} max={100} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full accent-rose-500" />
                                <p className="text-xs text-[var(--text-muted)] mt-1">Higher = only remove fully white pages. Lower = also remove near-blank pages.</p>
                            </div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />PDF without blank pages downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Analysing &amp; removing…</> : <><Download className="w-5 h-5" />Remove Blanks &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'How is blank detected?', answer: 'Pages are rendered; those with >threshold% white pixels are removed.' }, { question: 'What if a valid page is removed?', answer: 'Lower the threshold slider to preserve light-content pages.' }]} />
        </div>
    );
};
