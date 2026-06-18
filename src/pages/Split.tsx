import { useState } from 'react';
import JSZip from 'jszip';
import { FileUploader } from '../components/FileUploader';
import { FileReadinessPanel } from '../components/pdf/FileReadinessPanel';
import { ToolStateMessage } from '../components/ToolStateMessage';
import { countPDFPages, splitPDFRange, splitPDFSeparate, downloadBlob } from '../utils/pdfHelpers';
import { getPdfRecoveryMessage } from '../utils/pdf/errorMessages';
import { FileText, Loader2, Scissors, Download, RefreshCw } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const Split = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [separatePages, setSeparatePages] = useState(false);
    const [range, setRange] = useState({ start: 1, end: 1 });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            setFile(selectedFile);
            setError(null);
            setSuccess(false);

            try {
                const count = await countPDFPages(selectedFile);
                setPageCount(count);
                setRange({ start: 1, end: count });
            } catch (err) {
                console.error(err);
                setError(getPdfRecoveryMessage(err, 'load'));
                setFile(null);
            }
        }
    };

    const handleSplit = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);

        try {
            if (separatePages) {
                const parts = await splitPDFSeparate(file);
                if (parts.length === 0) return;

                const zip = new JSZip();
                parts.forEach(part => {
                    zip.file(part.filename, part.data);
                });

                const content = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(content);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${file.name.replace('.pdf', '')}_split.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                if (range.start < 1 || range.end > pageCount || range.start > range.end) {
                    setError(`Invalid page range. Must be between 1 and ${pageCount}.`);
                    setIsProcessing(false);
                    return;
                }

                const bytes = await splitPDFRange(file, range.start, range.end);
                downloadBlob(bytes, `${file.name.replace('.pdf', '')}_pages_${range.start}-${range.end}.pdf`, 'application/pdf');
            }
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError(getPdfRecoveryMessage(err, 'split'));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Split PDF Online – Extract Pages Free"
                description="Split PDF documents or extract specific pages. Fast, free, and secure browser-based tool."
                faqItems={[
                    { question: "Does splitting a PDF upload my file?", answer: "No. All splitting happens in your browser using JavaScript. Your file never leaves your device." },
                    { question: "Can I extract a specific page range from a PDF?", answer: "Yes. Enter the start and end page numbers and the tool will extract only those pages into a new PDF." },
                    { question: "Can I split a PDF into individual pages?", answer: "Yes. Toggle the 'Separate pages' option and every page will be saved as its own PDF, downloaded together in a ZIP file." },
                    { question: "Is there a page limit for splitting?", answer: "No. The tool works in your browser, so it can handle PDFs with hundreds of pages — speed depends on your device." },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white flex items-center justify-center shadow-lg">
                            <Scissors className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Split PDF Online – Extract Pages Free</h1>
                    <p>Extract specific pages or split a PDF into separate files. Fast, free, and private in your browser.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader
                                onFilesSelected={handleFileSelected}
                                multiple={false}
                                accept=".pdf"
                                description="Drop a PDF file here to split"
                                hint="Upload first, then choose one page range or separate every page."
                            />
                        ) : (
                            <div className="animate-fade-in">
                                <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-rose-50 p-4 rounded-xl border border-orange-100 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                <span className="font-medium text-orange-600">{pageCount} pages</span> • {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setFile(null); setPageCount(0); setSuccess(false); }}
                                        className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]"
                                        title="Change File"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <FileReadinessPanel files={[file]} showPreview />
                                </div>

                                <div className="space-y-6 mb-8">
                                    <label className="flex items-start gap-4 p-4 border-2 border-border rounded-xl cursor-pointer hover:border-foreground transition-colors has-[:checked]:border-foreground has-[:checked]:bg-muted">
                                        <input
                                            type="checkbox"
                                            checked={separatePages}
                                            onChange={(e) => setSeparatePages(e.target.checked)}
                                            className="mt-1"
                                        />
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">Extract every page into separate files</p>
                                            <p className="text-sm text-[var(--text-muted)]">Download a ZIP file containing each page as a separate PDF.</p>
                                        </div>
                                    </label>

                                    {!separatePages && (
                                        <div className="bg-background p-6 rounded-xl">
                                            <p className="font-medium mb-4">Select page range</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">From Page</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={pageCount}
                                                        value={range.start}
                                                        onChange={(e) => setRange(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">To Page</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={pageCount}
                                                        value={range.end}
                                                        onChange={(e) => setRange(prev => ({ ...prev, end: parseInt(e.target.value) || 1 }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <ToolStateMessage state="error" title="Split failed" className="mb-6">
                                        {error}
                                    </ToolStateMessage>
                                )}

                                {success && (
                                    <ToolStateMessage state="success" title="PDF ready" className="mb-6">
                                        PDF split successfully! Check your downloads.
                                    </ToolStateMessage>
                                )}

                                <button
                                    onClick={handleSplit}
                                    disabled={isProcessing}
                                    className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-6 h-6" />
                                            {separatePages ? 'Download All Pages' : 'Split & Download'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: "Does splitting a PDF upload my file?", answer: "No. All splitting happens in your browser using JavaScript. Your file never leaves your device." },
                { question: "Can I extract a specific page range from a PDF?", answer: "Yes. Enter the start and end page numbers and the tool will extract only those pages into a new PDF." },
                { question: "Can I split a PDF into individual pages?", answer: "Yes. Toggle the 'Separate pages' option and every page will be saved as its own PDF, downloaded together in a ZIP file." },
                { question: "Is there a page limit for splitting?", answer: "No. The tool works in your browser, so it can handle PDFs with hundreds of pages — speed depends on your device." },
            ]} />
        </div>
    );
};
