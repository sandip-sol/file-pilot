import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { rotatePDF, downloadBytes } from '../utils/pdf/pdfOperations';
import { RotateCw, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const RotatePdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [angle, setAngle] = useState<90 | 180 | 270>(90);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await rotatePDF(file, angle);
            downloadBytes(bytes, file.name.replace('.pdf', `_rotated${angle}.pdf`));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            setError('Failed to rotate PDF. ' + (e instanceof Error ? e.message : ''));
        } finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Rotate PDF Pages Online – Free & Private" description="Rotate all pages of a PDF by 90, 180, or 270 degrees. 100% browser-based, no uploads." faqItems={[{ question: 'Does rotating modify the original file?', answer: 'No. A new rotated PDF is downloaded while your original stays untouched.' }, { question: 'Can I rotate only some pages?', answer: 'For per-page control, use Organize PDF tool.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg"><RotateCw className="w-6 h-6" /></div></div>
                <h1>Rotate PDF Pages Online</h1><p>Rotate all pages by 90°, 180°, or 270°. Private &amp; instant in your browser.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF to rotate" />
                    {file && (
                        <div className="mt-6 animate-fade-in">
                            <p className="text-sm font-medium mb-4 text-[var(--text)]">Selected: <span className="font-semibold">{file.name}</span></p>
                            <div className="flex gap-3 mb-6 flex-wrap">
                                {([90, 180, 270] as const).map(a => (
                                    <button key={a} onClick={() => setAngle(a)} className={`px-5 py-2 rounded-xl font-medium border transition-colors ${angle === a ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border text-[var(--text-muted)] hover:bg-muted'}`}>{a}°</button>
                                ))}
                            </div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl mb-4 text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl mb-4 text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Rotated PDF downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Rotating…</> : <><Download className="w-5 h-5" />Rotate &amp; Download</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'Does rotating modify the original file?', answer: 'No. A new PDF is downloaded; your original is untouched.' }, { question: 'Can I rotate only some pages?', answer: 'For per-page control, use the Organize PDF tool.' }]} />
        </div>
    );
};
