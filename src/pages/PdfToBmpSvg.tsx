import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { FileImage, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { toolFaqs, toolSeo } from '../data/toolContent';

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
            <PageSeo {...toolSeo('/pdf-to-svg')} />
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
            <FAQSection items={toolFaqs('/pdf-to-svg')} />
        </div>
    );
};
