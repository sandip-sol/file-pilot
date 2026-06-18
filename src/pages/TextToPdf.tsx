import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { textToPDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, FileText, FileType2, AlignLeft } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const TextToPdf = () => {
    const [text, setText] = useState('');
    const [txtFile, setTxtFile] = useState<File | null>(null);
    const [fontSize, setFontSize] = useState(12);
    const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [mode, setMode] = useState<'type' | 'upload'>('type');

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            const f = files[0];
            setTxtFile(f);
            const content = await f.text();
            setText(content);
            setError(null);
            setSuccess(false);
        }
    };

    const handleConvert = async () => {
        const content = text.trim();
        if (!content) { setError('Please enter some text or upload a .txt file.'); return; }
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await textToPDF(content, { fontSize, pageSize });
            const baseName = txtFile ? txtFile.name.replace(/\.[^.]+$/, '') : 'text-document';
            downloadBlob(bytes, `${baseName}.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to convert text to PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Text to PDF – Convert TXT to PDF Free Online"
                description="Convert plain text or .txt files to PDF instantly in your browser. Custom font size and page size. 100% private — no uploads."
                faqItems={[
                    { question: 'Can I paste text directly?', answer: 'Yes! Switch to the "Type / Paste" tab and paste your text directly.' },
                    { question: 'What formats can I upload?', answer: 'You can upload .txt plain text files.' },
                    { question: 'Is my text uploaded to a server?', answer: 'No. Everything runs locally in your browser using JavaScript.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center shadow-lg">
                            <FileType2 className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Text to PDF Converter</h1>
                    <p>Convert plain text or .txt files to PDF. 100% private — never uploaded.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                        {/* Mode toggle */}
                        <div className="flex bg-muted p-1 rounded-xl">
                            <button
                                onClick={() => setMode('type')}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'type' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
                            >
                                <AlignLeft className="w-4 h-4" /> Type / Paste Text
                            </button>
                            <button
                                onClick={() => setMode('upload')}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'upload' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
                            >
                                <FileText className="w-4 h-4" /> Upload .txt File
                            </button>
                        </div>

                        {mode === 'upload' && !txtFile && (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".txt" description="Drop a .txt file here" />
                        )}

                        {(mode === 'type' || txtFile) && (
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">
                                    {txtFile ? `Content from ${txtFile.name}` : 'Your Text'}
                                </label>
                                <textarea
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    rows={12}
                                    placeholder="Paste or type your text here…"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y"
                                />
                                <p className="mt-1 text-xs text-[var(--text-muted)]">{text.length.toLocaleString()} characters · ~{Math.ceil(text.split('\n').length / 40)} page(s)</p>
                            </div>
                        )}

                        {(mode === 'type' || txtFile) && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Page Size</label>
                                    <div className="flex gap-2">
                                        {(['A4', 'Letter'] as const).map(s => (
                                            <button key={s} onClick={() => setPageSize(s)}
                                                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${pageSize === s ? 'border-slate-500 bg-slate-50 text-slate-700' : 'border-border text-[var(--text-muted)]'}`}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Font Size: {fontSize}pt</label>
                                    <input type="range" min={8} max={24} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                                        className="w-full mt-1 accent-slate-500" />
                                    <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1"><span>8pt</span><span>24pt</span></div>
                                </div>
                            </div>
                        )}

                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                        {success && (
                            <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium">
                                ✅ PDF created successfully!
                            </div>
                        )}

                        {(mode === 'type' || txtFile) && (
                            <button onClick={handleConvert} disabled={isProcessing || !text.trim()} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Converting...</>) : (<><Download className="w-6 h-6" />Convert to PDF &amp; Download</>)}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Can I paste text directly?', answer: 'Yes! Switch to the "Type / Paste" tab and paste your text directly.' },
                { question: 'What formats can I upload?', answer: 'You can upload .txt plain text files.' },
                { question: 'Is my text uploaded to a server?', answer: 'No. Everything runs locally in your browser using JavaScript.' },
            ]} />
        </div>
    );
};
