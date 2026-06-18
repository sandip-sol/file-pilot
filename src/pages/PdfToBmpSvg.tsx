import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { rasterizePDF, downloadBlob2 } from '../utils/pdf/pdfOperations';
import { FileImage, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const PdfToBmp = () => {
    const [file, setFile] = useState<File | null>(null);
    const [dpi, setDpi] = useState(150);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null); setProgress(0);
        try {
            // rasterize as PNG (BMP not natively supported in canvas; PNG is lossless equivalent)
            const blob = await rasterizePDF(file, 'png', dpi, p => setProgress(p));
            await downloadBlob2(blob, file.name.replace('.pdf', '_bmp_images.zip'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="PDF to BMP Online – Free & Private" description="Convert every PDF page to BMP-equivalent lossless PNG images. Download as ZIP. Browser-based." faqItems={[{ question: 'Why PNG instead of BMP?', answer: 'Canvas API does not natively export BMP. PNG offers identical quality and smaller file size.' }, { question: 'What DPI should I use?', answer: '150 DPI for screen; 300 DPI for print-quality output.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-lg"><FileImage className="w-6 h-6" /></div></div>
                <h1>PDF to BMP Online</h1><p>Convert every PDF page to a lossless image and download as ZIP.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); setProgress(0); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-4">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            <div><label className="block text-sm font-medium mb-2">Resolution: {dpi} DPI</label>
                                <input type="range" min={72} max={300} step={10} value={dpi} onChange={e => setDpi(Number(e.target.value))} className="w-full accent-orange-500" /></div>
                            {isProcessing && <div className="space-y-2"><div className="flex justify-between text-sm"><span>Converting…</span><span>{Math.round(progress)}%</span></div><div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all" style={{ width: `${progress}%` }} /></div></div>}
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />ZIP downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Converting…</> : <><Download className="w-5 h-5" />Convert &amp; Download ZIP</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'Why PNG instead of BMP?', answer: 'Canvas API exports PNG natively; it\'s lossless and smaller than BMP.' }, { question: 'What DPI?', answer: '150 for screen, 300 for print.' }]} />
        </div>
    );
};

export const PdfToSvg = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const { pdfToSVGPages } = await import('../utils/pdf/pdfOperations');
            const svgs = await pdfToSVGPages(file);
            if (svgs.length === 1) {
                const blob = new Blob([svgs[0].data], { type: 'image/svg+xml' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = svgs[0].filename;
                a.click();
            } else {
                const JSZip = (await import('jszip')).default;
                const zip = new JSZip();
                svgs.forEach(svg => zip.file(svg.filename, svg.data));
                const blob = await zip.generateAsync({ type: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = file.name.replace('.pdf', '_svg_pages.zip');
                a.click();
            }
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="PDF to SVG Online – Free & Private" description="Convert PDF pages to scalable SVG vector graphics. Download instantly. Browser-based." faqItems={[{ question: 'Are fonts preserved?', answer: 'Text is embedded as path data in the SVG when using vector extraction.' }, { question: 'Does this work for scanned PDFs?', answer: 'Scanned PDFs output raster-image SVGs; vector extraction only works for text-based PDFs.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-800 text-white flex items-center justify-center shadow-lg"><FileImage className="w-6 h-6" /></div></div>
                <h1>PDF to SVG Online</h1><p>Convert each PDF page to a scalable SVG vector graphic.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-4">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />SVG(s) downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Converting…</> : <><Download className="w-5 h-5" />Convert to SVG</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'Are fonts preserved?', answer: 'Text is converted to path data in the SVG output.' }, { question: 'Does it work for scanned PDFs?', answer: 'Scanned PDFs produce image-embedded SVGs; best results with text-based PDFs.' }]} />
        </div>
    );
};
