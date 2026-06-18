import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { repairPDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Wrench, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const RepairPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const handleRepair = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await repairPDF(file);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_repaired.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not repair this PDF. The file may be too severely corrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Repair Corrupted PDF – Free Online PDF Fix Tool"
                description="Repair a broken or corrupted PDF file instantly in your browser. Re-serializes the PDF structure to fix common errors. 100% private — no uploads."
                faqItems={[
                    { question: 'What kind of PDF errors can this fix?', answer: 'It can fix structural issues like cross-reference table errors, invalid objects, and malformed metadata by completely re-serializing the PDF.' },
                    { question: 'Will it fix encrypted or password-protected PDFs?', answer: 'It attempts to open and re-save even encrypted PDFs, which can resolve some structural issues.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg">
                            <Wrench className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Repair Corrupted PDF</h1>
                    <p>Fix structural errors in broken PDF files. 100% private — processed locally in your browser.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a corrupted PDF here to repair it" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center">
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

                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
                                    <strong>How it works:</strong> The repair tool completely re-parses and re-serializes the PDF structure using pdf-lib. This fixes many common corruption issues like broken cross-reference tables and invalid objects.
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> PDF repaired successfully!
                                    </div>
                                )}

                                <button onClick={handleRepair} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Repairing...</>) : (<><Download className="w-6 h-6" />Repair &amp; Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What kind of PDF errors can this fix?', answer: 'It can fix structural issues like cross-reference table errors, invalid objects, and malformed metadata by completely re-serializing the PDF.' },
                { question: 'Will it fix encrypted or password-protected PDFs?', answer: 'It attempts to open and re-save even encrypted PDFs, which can resolve some structural issues.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
