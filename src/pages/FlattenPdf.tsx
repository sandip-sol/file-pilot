import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { flattenPDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Layers, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const FlattenPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const handleFlatten = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await flattenPDF(file);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_flattened.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to flatten PDF. The file may be corrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Flatten PDF Forms – Make Forms Non-Editable Free"
                description="Flatten interactive PDF forms to make them non-editable. Embed form field values as permanent text. 100% browser-based, no uploads."
                faqItems={[
                    { question: 'What does flattening a PDF do?', answer: 'It converts interactive form fields into static text/graphics, making the PDF non-editable.' },
                    { question: 'Will form data be preserved?', answer: 'Yes. The values you filled into the form fields will be preserved as static content.' },
                    { question: 'Is my file uploaded?', answer: 'No. Everything runs locally in your browser.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Flatten PDF Forms</h1>
                    <p>Lock your PDF forms — embed field values as static content. 100% private.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF with forms to flatten" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center">
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

                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800">
                                    <strong>What happens:</strong> All interactive form fields (text boxes, checkboxes, dropdowns) are converted into static page content. The resulting PDF cannot be edited and is safe to share.
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> PDF flattened successfully!
                                    </div>
                                )}

                                <button onClick={handleFlatten} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Flattening...</>) : (<><Download className="w-6 h-6" />Flatten &amp; Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What does flattening a PDF do?', answer: 'It converts interactive form fields into static text/graphics, making the PDF non-editable.' },
                { question: 'Will form data be preserved?', answer: 'Yes. The values you filled into the form fields will be preserved as static content.' },
                { question: 'Is my file uploaded?', answer: 'No. Everything runs locally in your browser.' },
            ]} />
        </div>
    );
};
