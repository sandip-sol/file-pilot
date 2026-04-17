import { useMemo, useState } from 'react';
import { Copy, Download, FileText, Loader2, ScanText, Trash2 } from 'lucide-react';
import { FileUploader } from '../components/FileUploader';
import { FAQSection } from '../components/FAQSection';
import { PageSeo } from '../components/PageSeo';
import { Textarea } from '../components/ui/textarea';
import { extractTextFromFiles } from '../utils/textExtraction';
import { terminateOcrWorker } from '../utils/ocrHelpers';

interface ExtractedEntry {
    fileName: string;
    text: string;
}

const buildCombinedText = (entries: ExtractedEntry[]) =>
    entries
        .map((entry) => `=== ${entry.fileName} ===\n${entry.text || '[No text detected]'}`)
        .join('\n\n');

export const ExtractText = () => {
    const [results, setResults] = useState<ExtractedEntry[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const combinedText = useMemo(() => buildCombinedText(results), [results]);

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setError(null);
        setStatus('Preparing extraction...');
        setCopied(false);

        try {
            const extracted = await extractTextFromFiles(files, ({ fileIndex, totalFiles, fileName, stage }) => {
                setStatus(`${stage} • ${fileName} (${fileIndex}/${totalFiles})`);
            });
            setResults(extracted);
            setStatus(`Extracted text from ${extracted.length} file${extracted.length === 1 ? '' : 's'}.`);
        } catch (caughtError) {
            console.error(caughtError);
            setError('Failed to extract text from one or more files. Some PDFs may be image-only or the file may be unsupported.');
            setStatus(null);
        } finally {
            setIsProcessing(false);
            await terminateOcrWorker();
        }
    };

    const handleCopy = async () => {
        if (!combinedText) return;

        await navigator.clipboard.writeText(combinedText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!combinedText) return;

        const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'extracted-text.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const clearResults = () => {
        setResults([]);
        setError(null);
        setStatus(null);
        setCopied(false);
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Extract Text from PDF or Images – OCR Tool"
                description="Extract text from PDFs, scanned PDFs, JPG, PNG, and WebP images in your browser. Copy or download the detected text privately."
                faqItems={[
                    { question: "Can I extract text from both PDFs and images?", answer: "Yes. Upload PDFs, JPG, JPEG, PNG, or WebP files. Text-based PDFs are read directly, and scanned files use OCR in the browser." },
                    { question: "Does this upload my files?", answer: "No. Text extraction happens locally in your browser. Your files are not uploaded to any server." },
                    { question: "Can I copy the extracted text?", answer: "Yes. After extraction, you can copy the text directly or download it as a .txt file." },
                    { question: "Will scanned PDFs work?", answer: "Yes, for many scanned PDFs. The tool falls back to OCR when a PDF page does not already contain selectable text." },
                ]}
            />

            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
                            <ScanText className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Extract Text from PDF or Images</h1>
                    <p>Pull text out of PDFs, scanned PDFs, and images with browser-based OCR and direct PDF text reading.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div className="lg:col-span-1">
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
                            <h3 className="font-bold text-lg mb-4">How It Works</h3>
                            <div className="space-y-4 text-sm text-[var(--text-secondary)]">
                                <p>Upload one or more PDFs or images. Text PDFs are parsed directly.</p>
                                <p>Scanned PDFs and images use OCR to detect text while keeping everything on your device.</p>
                                <p>When extraction finishes, copy the text or download it as a plain text file.</p>
                            </div>

                            {status && (
                                <div className="bg-muted text-[var(--text-secondary)] p-3 rounded-xl mt-6 text-sm font-medium">
                                    {status}
                                </div>
                            )}

                            {error && (
                                <div className="bg-[var(--error-light)] text-[var(--error)] p-3 rounded-xl mt-6 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    onClick={handleCopy}
                                    disabled={!combinedText || isProcessing}
                                    className="btn btn-primary"
                                >
                                    <Copy className="w-4 h-4" />
                                    {copied ? 'Copied' : 'Copy Text'}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={!combinedText || isProcessing}
                                    className="btn btn-outline"
                                >
                                    <Download className="w-4 h-4" />
                                    Download TXT
                                </button>
                                <button
                                    onClick={clearResults}
                                    disabled={(results.length === 0 && !error && !status) || isProcessing}
                                    className="btn btn-outline"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <FileUploader
                                onFilesSelected={handleFilesSelected}
                                multiple={true}
                                accept=".pdf,image/*"
                                description="Drop PDF or image files here"
                            />

                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">Extracted Text</h3>
                                    {isProcessing && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </div>
                                    )}
                                </div>

                                {results.length > 0 ? (
                                    <div className="space-y-5 animate-fade-in">
                                        {results.map((entry) => (
                                            <div key={entry.fileName} className="rounded-xl border border-border bg-background p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                                                    <p className="text-sm font-medium">{entry.fileName}</p>
                                                </div>
                                                <Textarea
                                                    value={entry.text || '[No text detected]'}
                                                    readOnly
                                                    className="min-h-[220px] resize-y"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-12 text-center text-[var(--text-muted)]">
                                        <ScanText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p>No extracted text yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: "Can I extract text from both PDFs and images?", answer: "Yes. Upload PDFs, JPG, JPEG, PNG, or WebP files. Text-based PDFs are read directly, and scanned files use OCR in the browser." },
                { question: "Does this upload my files?", answer: "No. Text extraction happens locally in your browser. Your files are not uploaded to any server." },
                { question: "Can I copy the extracted text?", answer: "Yes. After extraction, you can copy the text directly or download it as a .txt file." },
                { question: "Will scanned PDFs work?", answer: "Yes, for many scanned PDFs. The tool falls back to OCR when a PDF page does not already contain selectable text." },
            ]} />
        </div>
    );
};
