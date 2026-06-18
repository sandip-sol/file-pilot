import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob2 } from '../utils/pdf/pdfOperations';
import { extractImagesFromPDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Images, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const ExtractImages = () => {
    const [file, setFile] = useState<File | null>(null);
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
            const blob = await extractImagesFromPDF(file, (pct) => setProgress(Math.round(pct)));
            await downloadBlob2(blob, `${file.name.replace('.pdf', '')}_images.zip`);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not extract images from this PDF. Please try another file.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Extract Images from PDF – Export PDF Pages as PNG Images"
                description="Extract and download all pages of a PDF as PNG images in a ZIP archive. 100% private — browser only."
                faqItems={[
                    { question: 'What format are the extracted images?', answer: 'Each PDF page is rendered as a PNG image at 2× resolution for high quality, then packed into a ZIP archive.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg">
                            <Images className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Extract Images from PDF</h1>
                    <p>Export all PDF pages as high-resolution PNG images in a ZIP archive.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to extract images from each page" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center">
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

                                <div className="p-4 bg-pink-50 border border-pink-100 rounded-xl text-sm text-pink-800">
                                    Each PDF page will be rendered as a <strong>PNG image at 2× scale</strong> for crisp quality. All images will be bundled in a ZIP file.
                                </div>

                                {isProcessing && (
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[var(--text-secondary)]">Rendering pages...</span>
                                            <span className="font-medium">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-pink-100 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-pink-500 to-rose-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Images extracted and downloaded!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Extracting...</>) : (<><Download className="w-6 h-6" />Extract Images as ZIP</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What format are the extracted images?', answer: 'Each PDF page is rendered as a PNG image at 2× resolution for high quality, then packed into a ZIP archive.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
