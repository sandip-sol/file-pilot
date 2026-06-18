import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { posterizePDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Maximize2, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const PosterizePdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [cols, setCols] = useState(2);
    const [rows, setRows] = useState(2);
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
            const bytes = await posterizePDF(file, cols, rows);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_posterized.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not process this PDF. Please try another file.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Posterize PDF – Tile Large Pages for Poster Printing"
                description="Split each PDF page into a grid of tiles for large-format poster printing. 100% private — browser only."
                faqItems={[
                    { question: 'What is posterizing a PDF?', answer: 'It tiles each page into multiple smaller sheets so you can print large formats by assembling the tiles.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                            <Maximize2 className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Posterize PDF Pages</h1>
                    <p>Tile each PDF page into a grid of smaller sheets for large-format poster printing.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to posterize its pages" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Columns</label>
                                        <select value={cols} onChange={e => setCols(parseInt(e.target.value))}>
                                            <option value="2">2 columns</option>
                                            <option value="3">3 columns</option>
                                            <option value="4">4 columns</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Rows</label>
                                        <select value={rows} onChange={e => setRows(parseInt(e.target.value))}>
                                            <option value="2">2 rows</option>
                                            <option value="3">3 rows</option>
                                            <option value="4">4 rows</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                                    Each page will be split into <strong>{cols * rows} tiles</strong> ({cols} × {rows}). Print and assemble them for a large poster.
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Posterized PDF created!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<><Download className="w-6 h-6" />Posterize & Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What is posterizing a PDF?', answer: 'It tiles each page into multiple smaller sheets so you can print large formats by assembling the tiles.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
