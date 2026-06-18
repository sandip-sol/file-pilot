import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { addBlankPage } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, FilePlus, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const AddBlankPage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [position, setPosition] = useState<'before' | 'after'>('after');
    const [customPage, setCustomPage] = useState('');

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const pos = customPage ? parseInt(customPage) : position;
            const bytes = await addBlankPage(file, pos as 'before' | 'after' | number);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_with_blank.pdf`, 'application/pdf');
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
                title="Add Blank Page to PDF – Insert Empty Page Online Free"
                description="Insert a blank page at the beginning, end, or any position in your PDF. 100% private — processed in your browser."
                faqItems={[
                    { question: 'Can I insert a blank page at any position?', answer: 'Yes. You can insert before the first page, after the last page, or specify a page number to insert after.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center shadow-lg">
                            <FilePlus className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Add Blank Page to PDF</h1>
                    <p>Insert an empty blank page at the beginning, end, or a specific position. 100% private.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF here to add a blank page" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-sky-50 to-cyan-50 p-4 rounded-xl border border-sky-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center">
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

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Insert Position</label>
                                        <select value={position} onChange={e => { setPosition(e.target.value as 'before' | 'after'); setCustomPage(''); }}>
                                            <option value="before">Before first page</option>
                                            <option value="after">After last page</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Or insert after page number</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 3 — inserts after page 3"
                                            value={customPage}
                                            onChange={e => setCustomPage(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Blank page added successfully!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<><Download className="w-6 h-6" />Add Blank Page & Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Can I insert a blank page at any position?', answer: 'Yes. You can insert before the first page, after the last page, or specify a page number to insert after.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
