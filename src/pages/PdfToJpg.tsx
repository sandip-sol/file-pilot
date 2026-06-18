import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { rasterizePDF, downloadBlob2 } from '../utils/pdf/pdfOperations';
import { FileImage, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const PdfToJpg = () => {
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
            const blob = await rasterizePDF(file, 'jpeg', dpi, p => setProgress(p));
            await downloadBlob2(blob, file.name.replace('.pdf', '_images.zip'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="PDF to JPG Online – Free & Private" description="Convert every page of a PDF to JPG images. Download as a ZIP. 100% browser-based." faqItems={[{ question: 'How do I get individual JPG files?', answer: 'All pages are converted and packed into a ZIP for easy download.' }, { question: 'What DPI should I use?', answer: '150 DPI is good for web; 300 DPI for print-quality images.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white flex items-center justify-center shadow-lg"><FileImage className="w-6 h-6" /></div></div>
                <h1>PDF to JPG Online</h1><p>Convert every page to a JPG image and download as a ZIP file.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); setProgress(0); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-4">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            <div><label className="block text-sm font-medium mb-2">Resolution: {dpi} DPI</label>
                                <input type="range" min={72} max={300} step={10} value={dpi} onChange={e => setDpi(Number(e.target.value))} className="w-full accent-orange-500" /></div>
                            {isProcessing && <div className="space-y-2"><div className="flex justify-between text-sm"><span>Converting…</span><span>{Math.round(progress)}%</span></div><div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 transition-all" style={{ width: `${progress}%` }} /></div></div>}
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />ZIP downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Converting…</> : <><Download className="w-5 h-5" />Convert to JPG &amp; Download ZIP</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'How do I get individual files?', answer: 'All pages are zipped for easy download.' }, { question: 'What DPI is best?', answer: '150 DPI for web; 300 DPI for print.' }]} />
        </div>
    );
};
