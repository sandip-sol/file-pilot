import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { mergePDFs, downloadBlob } from '../utils/pdfHelpers';
import { ArrowUp, ArrowDown, X, FileText, Loader2, Download, CheckCircle, Files } from 'lucide-react';

export const Merge = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFilesSelected = (newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles]);
        setError(null);
        setSuccess(false);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const moveFile = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === files.length - 1) return;

        setFiles(prev => {
            const newFiles = [...prev];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
            return newFiles;
        });
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            setError('Please select at least 2 PDF files to merge.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const mergedPdfBytes = await mergePDFs(files);
            downloadBlob(mergedPdfBytes, 'merged.pdf', 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to merge PDFs. One of the files might be corrupted or encrypted.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            {/* Page Header */}
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                            <Files className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Merge PDF Files</h1>
                    <p>Combine multiple PDFs into one document in your preferred order.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
                        <FileUploader
                            onFilesSelected={handleFilesSelected}
                            multiple={true}
                            accept=".pdf"
                            description="Drop PDF files here to merge"
                        />

                        {files.length > 0 && (
                            <div className="mt-8 animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-[var(--text)]">
                                        Selected Files <span className="text-[var(--text-muted)]">({files.length})</span>
                                    </h3>
                                    <button
                                        onClick={() => setFiles([])}
                                        className="text-sm text-[var(--error)] hover:underline font-medium"
                                    >
                                        Clear All
                                    </button>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {files.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="file-item">
                                            <div className="file-icon">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate text-[var(--text)]">{file.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => moveFile(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-2 hover:bg-[var(--background)] rounded-lg disabled:opacity-30 transition-colors"
                                                    title="Move Up"
                                                >
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => moveFile(index, 'down')}
                                                    disabled={index === files.length - 1}
                                                    className="p-2 hover:bg-[var(--background)] rounded-lg disabled:opacity-30 transition-colors"
                                                    title="Move Down"
                                                >
                                                    <ArrowDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="p-2 hover:bg-[var(--error-light)] text-[var(--text-muted)] hover:text-[var(--error)] rounded-lg ml-2 transition-colors"
                                                    title="Remove"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {error && (
                                    <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl mb-6 text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        PDF merged successfully! Check your downloads.
                                    </div>
                                )}

                                <button
                                    onClick={handleMerge}
                                    disabled={isProcessing || files.length < 2}
                                    className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Merging PDFs...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-6 h-6" />
                                            Merge & Download
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
