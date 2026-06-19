import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBytes } from '../utils/pdf/pdfOperations';
import { List, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

async function generateTOC(file: File, title: string): Promise<Uint8Array> {
    GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    const ab = await file.arrayBuffer();
    const pdfJs = await getDocument({ data: new Uint8Array(ab) }).promise;
    const src = await PDFDocument.load(ab, { ignoreEncryption: true });
    const numPages = pdfJs.numPages;

    // Create a new TOC page and prepend it
    const toc = await PDFDocument.create();
    const font = await toc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await toc.embedFont(StandardFonts.Helvetica);
    const tocPage = toc.addPage([595, 842]); // A4
    const { width, height } = tocPage.getSize();

    tocPage.drawText(title || 'Table of Contents', { x: 50, y: height - 80, size: 24, font, color: rgb(0.1, 0.1, 0.4) });
    tocPage.drawLine({ start: { x: 50, y: height - 95 }, end: { x: width - 50, y: height - 95 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });

    const lineH = 22;
    let y = height - 130;
    for (let i = 1; i <= numPages && y > 60; i++) {
        const label = `Page ${i}`;
        const pageLabel = String(i);
        tocPage.drawText(label, { x: 60, y, size: 11, font: bodyFont, color: rgb(0.2, 0.2, 0.2) });
        tocPage.drawText(pageLabel, { x: width - 80, y, size: 11, font: bodyFont, color: rgb(0.2, 0.2, 0.2) });
        // Dotted leader
        const dotsWidth = width - 60 - 80 - label.length * 5.5 - 20;
        for (let d = 0; d < dotsWidth; d += 6) {
            tocPage.drawText('.', { x: 60 + label.length * 5.5 + 10 + d, y, size: 11, font: bodyFont, color: rgb(0.6, 0.6, 0.6) });
        }
        y -= lineH;
    }

    // Merge TOC + original
    const merged = await PDFDocument.create();
    const [tocEmbed] = await merged.copyPages(toc, [0]);
    merged.addPage(tocEmbed);
    const srcPages = await merged.copyPages(src, src.getPageIndices());
    srcPages.forEach(p => merged.addPage(p));
    return merged.save();
}

export const TableOfContents = () => {
    const [file, setFile] = useState<File | null>(null);
    const [tocTitle, setTocTitle] = useState('Table of Contents');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await generateTOC(file, tocTitle);
            downloadBytes(bytes, file.name.replace('.pdf', '_with_toc.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Add Table of Contents to PDF – Free & Private" description="Prepend an auto-generated table of contents page to any PDF. Browser-based." faqItems={[{ question: 'What headings are detected?', answer: 'A page-by-page TOC is generated listing each page number.' }, { question: 'Is the TOC with hyperlinks?', answer: 'Basic page-number listing is generated; full hyperlink TOC requires a desktop app.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-700 text-white flex items-center justify-center shadow-lg"><List className="w-6 h-6" /></div></div>
                <h1>Add Table of Contents to PDF</h1><p>Auto-generate a TOC page with page numbers and prepend it to your PDF.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-4">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            <div>
                                <label className="block text-sm font-medium mb-2">TOC Page Title</label>
                                <input type="text" value={tocTitle} onChange={e => setTocTitle(e.target.value)} className="w-full rounded-xl border border-border bg-muted px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            </div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />PDF with TOC downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Generating TOC…</> : <><Download className="w-5 h-5" />Add TOC &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'What headings are detected?', answer: 'A page-by-page listing is generated. Semantic heading extraction requires desktop tools.' }, { question: 'Are hyperlinks included?', answer: 'Page number references are listed; clickable links require a desktop PDF editor.' }]} />
        </div>
    );
};
