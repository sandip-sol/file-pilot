import { useState } from 'react';
// The user asked for clean/modern. Reordering is required.
// Let's use simple manual list rendering with up/down utils for now to keep it "Simple".

import { FileUploader } from '../components/FileUploader';
import { mergePDFs, downloadBlob } from '../utils/pdfHelpers';
import { ArrowUp, ArrowDown, X, FileText, Loader2, Download } from 'lucide-react';

export const Merge = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFilesSelected = (newFiles: File[]) => {
        // Append new files
        setFiles(prev => [...prev, ...newFiles]);
        setError(null);
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
        } catch (err) {
            console.error(err);
            setError('Failed to merge PDFs. One of the files might be corrupted or encrypted.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container py-12 max-w-4xl">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-4">Merge PDF Files</h1>
                <p className="text-[var(--text-muted)]">Combine multiple PDFs into one file in the order you want.</p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
                <FileUploader
                    onFilesSelected={handleFilesSelected}
                    multiple={true}
                    accept=".pdf"
                    description="Drop PDF files here to merge"
                />

                {files.length > 0 && (
                    <div className="mt-8 animate-fade-in">
                        <h3 className="font-semibold mb-4 flex items-center justify-between">
                            <span>Selected Files ({files.length})</span>
                            <button onClick={() => setFiles([])} className="text-sm text-red-500 hover:text-red-700">Clear All</button>
                        </h3>

                        <div className="space-y-3 mb-8">
                            {files.map((file, index) => (
                                <div key={`${file.name}-${index}`} className="flex items-center gap-3 bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                                    <FileText className="w-5 h-5 text-[var(--primary)] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => moveFile(index, 'up')}
                                            disabled={index === 0}
                                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                                            title="Move Up"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveFile(index, 'down')}
                                            disabled={index === files.length - 1}
                                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                                            title="Move Down"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="p-1 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded ml-2"
                                            title="Remove"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">
                                {error}
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
                                    Merge PDFs
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
