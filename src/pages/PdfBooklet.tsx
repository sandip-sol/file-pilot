import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { createBooklet } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, BookOpen, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const PdfBooklet = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await createBooklet(file);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_booklet.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not create booklet from this PDF. Please try another file.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="PDF Booklet – Create Saddle-Stitch Booklet Layout"
                description="Rearrange PDF pages into a booklet layout that you can print, fold, and staple. 100% private — browser only."
                faqItems={[
                    { question: 'What is a booklet layout?', answer: 'A booklet layout reorders pages so that when you print double-sided, fold, and staple, the pages appear in the correct reading order.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-lg">
                            <BookOpen className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Create PDF Booklet</h1>
                    <p>Rearrange PDF pages into a saddle-stitch booklet layout for folding and stapling.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to create a booklet layout" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setSuccess(false); }} className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 space-y-2">
                                    <p><strong>How to use:</strong></p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Download the booklet PDF</li>
                                        <li>Print double-sided (flip on long edge)</li>
                                        <li>Fold the stack in half</li>
                                        <li>Staple in the center</li>
                                    </ol>
                                    <p className="text-xs mt-2 text-emerald-600">For best results, the page count should be a multiple of 4. Blank pages are added automatically if needed.</p>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Booklet created!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<><Download className="w-6 h-6" />Create Booklet & Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What is a booklet layout?', answer: 'A booklet layout reorders pages so that when you print double-sided, fold, and staple, the pages appear in the correct reading order.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
