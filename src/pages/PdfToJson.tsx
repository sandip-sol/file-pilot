import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { pdfToJSON } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, FileJson, CheckCircle, Copy } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const PdfToJson = () => {
    const [file, setFile] = useState<File | null>(null);
    const [jsonData, setJsonData] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); setJsonData(null); }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const data = await pdfToJSON(file);
            const json = JSON.stringify(data, null, 2);
            setJsonData(json);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${file.name.replace('.pdf', '')}.json`; a.click();
            URL.revokeObjectURL(url);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not convert this PDF. Please try another file.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = async () => {
        if (jsonData) {
            await navigator.clipboard.writeText(jsonData);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="PDF to JSON – Extract PDF Content as JSON Data"
                description="Extract text and metadata from your PDF and download it as a structured JSON file. 100% private — browser only."
                faqItems={[
                    { question: 'What data is extracted?', answer: 'The JSON contains metadata, page count, and the extracted text from each page.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
                            <FileJson className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>PDF to JSON</h1>
                    <p>Extract text and metadata from your PDF as structured JSON data.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to extract as JSON" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 text-white flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setJsonData(null); }} className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> JSON extracted and downloaded!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Extracting...</>) : (<><Download className="w-6 h-6" />Extract as JSON</>)}
                                </button>
                            </div>
                        )}
                    </div>

                    {jsonData && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-fade-in">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold">JSON Preview</h3>
                                <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-foreground transition-colors">
                                    <Copy className="w-4 h-4" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <pre className="text-xs bg-slate-50 border border-border rounded-xl p-4 overflow-auto max-h-64 text-[var(--text)]">{jsonData.slice(0, 2000)}{jsonData.length > 2000 ? '\n... (truncated for preview)' : ''}</pre>
                        </div>
                    )}
                </div>
            </div>

            <FAQSection items={[
                { question: 'What data is extracted?', answer: 'The JSON contains metadata, page count, and the extracted text from each page.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
