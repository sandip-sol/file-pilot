import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob2 } from '../utils/pdf/pdfOperations';
import { rasterizePDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Aperture, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const RasterizePdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
    const [dpi, setDpi] = useState(150);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); setProgress(0); }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null); setProgress(0);
        try {
            const blob = await rasterizePDF(file, format, dpi, (pct) => setProgress(Math.round(pct)));
            await downloadBlob2(blob, `${file.name.replace('.pdf', '')}_rasterized.zip`);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not rasterize this PDF. Please try another file.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Rasterize PDF – Convert PDF Pages to High-DPI Images"
                description="Render PDF pages to high-resolution images in PNG, JPG, or WebP format. Download as a ZIP archive. 100% private."
                faqItems={[
                    { question: 'What is rasterization?', answer: 'Rasterization converts vector PDF content into pixel-based images at a specified resolution (DPI).' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
                            <Aperture className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Rasterize PDF</h1>
                    <p>Convert PDF pages to high-resolution PNG, JPEG, or WebP images — download as ZIP.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to rasterize to images" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setSuccess(false); setProgress(0); }} className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Output Format</label>
                                        <select value={format} onChange={e => setFormat(e.target.value as 'png' | 'jpeg' | 'webp')}>
                                            <option value="png">PNG (lossless)</option>
                                            <option value="jpeg">JPEG (smaller)</option>
                                            <option value="webp">WebP (modern)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">DPI (Resolution)</label>
                                        <select value={dpi} onChange={e => setDpi(parseInt(e.target.value))}>
                                            <option value="72">72 DPI (screen)</option>
                                            <option value="96">96 DPI (default)</option>
                                            <option value="150">150 DPI (good)</option>
                                            <option value="300">300 DPI (print quality)</option>
                                        </select>
                                    </div>
                                </div>

                                {isProcessing && (
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[var(--text-secondary)]">Rendering pages...</span>
                                            <span className="font-medium">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-cyan-100 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Images downloaded as ZIP!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Rasterizing...</>) : (<><Download className="w-6 h-6" />Rasterize & Download ZIP</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What is rasterization?', answer: 'Rasterization converts vector PDF content into pixel-based images at a specified resolution (DPI).' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
