import { useState } from 'react';
import JSZip from 'jszip';
import { FileUploader } from '../components/FileUploader';
import { countPDFPages, splitPDFRange, splitPDFSeparate, downloadBlob } from '../utils/pdfHelpers';
import { FileText, Loader2, Scissors, Download, RefreshCw } from 'lucide-react';

export const Split = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [separatePages, setSeparatePages] = useState(false);
    const [range, setRange] = useState({ start: 1, end: 1 });
    const [error, setError] = useState<string | null>(null);

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            setFile(selectedFile);
            setError(null);

            try {
                const count = await countPDFPages(selectedFile);
                setPageCount(count);
                setRange({ start: 1, end: count });
            } catch (err) {
                console.error(err);
                setError('Failed to load PDF. It might be encrypted or corrupted.');
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
                // Range validation
                if (range.start < 1 || range.end > pageCount || range.start > range.end) {
                    setError(`Invalid page range. Must be between 1 and ${pageCount}.`);
                    setIsProcessing(false);
                    return;
                }

                const bytes = await splitPDFRange(file, range.start, range.end);
                downloadBlob(bytes, `${file.name.replace('.pdf', '')}_split_${range.start}-${range.end}.pdf`, 'application/pdf');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to split PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container py-12 max-w-4xl">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-4">Split PDF File</h1>
                <p className="text-[var(--text-muted)]">Extract pages or split your document into separate files.</p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
                {!file ? (
                    <FileUploader
                        onFilesSelected={handleFileSelected}
                        multiple={false}
                        accept=".pdf"
                        description="Drop a PDF file here to split"
                    />
                ) : (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-8">
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-[var(--primary)]" />
                                <div>
                                    <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                    <p className="text-sm text-[var(--text-muted)]">{pageCount} Pages • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFile(null); setPageCount(0); }}
                                className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-red-500"
                                title="Change File"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="separate"
                                    checked={separatePages}
                                    onChange={(e) => setSeparatePages(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-[var(--primary)] rounded border-[var(--border)]"
                                />
                                <label htmlFor="separate" className="cursor-pointer">
                                    <p className="font-medium text-[var(--text)]">Extract every page into separate files</p>
                                    <p className="text-sm text-[var(--text-muted)]">Download a ZIP file containing each page as a separate PDF.</p>
                                </label>
                            </div>

                            {!separatePages && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">From Page</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={pageCount}
                                            value={range.start}
                                            onChange={(e) => setRange(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                                            className="w-full p-2 border border-[var(--border)] rounded focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">To Page</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={pageCount}
                                            value={range.end}
                                            onChange={(e) => setRange(prev => ({ ...prev, end: parseInt(e.target.value) || 1 }))}
                                            className="w-full p-2 border border-[var(--border)] rounded focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">
                                {error}
                            </div>
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
                                    {separatePages ? <Download className="w-6 h-6" /> : <Scissors className="w-6 h-6" />}
                                    {separatePages ? 'Download All Pages' : 'Split PDF'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
