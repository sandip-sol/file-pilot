import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PDFDocument } from 'pdf-lib';
import { downloadBlob } from '../utils/pdfHelpers';
import { Loader2, Download, RefreshCw, FileText, Info, Minimize2, CheckCircle } from 'lucide-react';

export const Compress = () => {
    const [file, setFile] = useState<File | null>(null);
    const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setError(null);
            setSuccess(false);
        }
    };

    const handleCompress = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Clear metadata for smaller file
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');

            const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
            downloadBlob(pdfBytes, `${file.name.replace('.pdf', '')}_compressed.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to compress PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
                            <Minimize2 className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Compress PDF</h1>
                    <p>Reduce file size while keeping good quality.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader
                                onFilesSelected={handleFileSelected}
                                multiple={false}
                                accept=".pdf"
                                description="Drop a PDF file here to compress"
                            />
                        ) : (
                            <div className="animate-fade-in">
                                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                Original size: <span className="font-medium text-emerald-600">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setFile(null); setSuccess(false); }}
                                        className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]"
                                        title="Change File"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-start gap-3 text-sm border border-blue-100">
                                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>
                                        Basic compression runs entirely in your browser. It optimizes file structure but cannot heavily downsample images. Results vary depending on content.
                                    </p>
                                </div>

                                <div className="mb-8">
                                    <label className="block text-sm font-medium mb-4 text-[var(--text-secondary)]">Compression Level</label>
                                    <div className="flex gap-3">
                                        {(['low', 'medium', 'high'] as const).map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setCompressionLevel(level)}
                                                className={`flex-1 py-3 px-4 rounded-xl border-2 capitalize font-semibold transition-all ${compressionLevel === level
                                                        ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                                                        : 'border-[var(--border)] hover:border-[var(--text-muted)] text-[var(--text-secondary)]'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl mb-6 text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        PDF compressed successfully! Check your downloads.
                                    </div>
                                )}

                                <button
                                    onClick={handleCompress}
                                    disabled={isProcessing}
                                    className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Compressing...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-6 h-6" />
                                            Compress & Download
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
