import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { addStamp } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Stamp, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

const PRESET_STAMPS = [
    { label: 'DRAFT', color: '#2563eb' },
    { label: 'CONFIDENTIAL', color: '#dc2626' },
    { label: 'APPROVED', color: '#16a34a' },
    { label: 'REJECTED', color: '#dc2626' },
    { label: 'VOID', color: '#9333ea' },
    { label: 'COPY', color: '#d97706' },
];

export const AddStamp = () => {
    const [file, setFile] = useState<File | null>(null);
    const [stampText, setStampText] = useState('DRAFT');
    const [color, setColor] = useState('#dc2626');
    const [opacity, setOpacity] = useState(0.25);
    const [fontSize, setFontSize] = useState(48);
    const [pageTarget, setPageTarget] = useState<'all' | 'first' | 'custom'>('all');
    const [customPages, setCustomPages] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const parsePages = (input: string): number[] => {
        const pages: number[] = [];
        for (const part of input.split(',')) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [s, e] = trimmed.split('-').map(Number);
                if (!isNaN(s) && !isNaN(e)) for (let i = s; i <= e; i++) pages.push(i);
            } else {
                const n = parseInt(trimmed, 10);
                if (!isNaN(n)) pages.push(n);
            }
        }
        return [...new Set(pages)];
    };

    const hexToRgb = (hex: string): [number, number, number] => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b];
    };

    const handleProcess = async () => {
        if (!file || !stampText.trim()) { setError('Please enter a stamp text.'); return; }
        let pages: number[] | undefined;
        if (pageTarget === 'first') pages = [1];
        else if (pageTarget === 'custom') pages = parsePages(customPages);

        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await addStamp(file, stampText.trim(), {
                color: hexToRgb(color),
                fontSize,
                opacity,
                pages,
            });
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_stamped.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to add stamp. The file may be corrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Add Stamp to PDF – DRAFT, CONFIDENTIAL & Custom Stamps Free"
                description="Add watermark stamps like DRAFT, CONFIDENTIAL, APPROVED to your PDF. Custom text, color, opacity. 100% private — processed locally."
                faqItems={[
                    { question: 'Will my file be uploaded?', answer: 'No. All processing happens in your browser.' },
                    { question: 'Can I use custom text for the stamp?', answer: 'Yes! Type any text you like into the stamp field.' },
                    { question: 'Can I control the stamp opacity?', answer: 'Yes, use the opacity slider — lower values make the stamp more transparent.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg">
                            <Stamp className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Add Stamp to PDF</h1>
                    <p>Apply DRAFT, CONFIDENTIAL, or custom stamps to your PDF. 100% private.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to add a stamp" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center">
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

                                {/* Preset stamps */}
                                <div>
                                    <label className="block text-sm font-semibold mb-3 text-[var(--text-secondary)]">Preset Stamps</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PRESET_STAMPS.map(s => (
                                            <button key={s.label}
                                                onClick={() => { setStampText(s.label); setColor(s.color); }}
                                                style={{ color: s.color, borderColor: stampText === s.label ? s.color : undefined }}
                                                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${stampText === s.label ? 'bg-opacity-10' : 'border-border'}`}
                                                aria-label={`Set stamp to ${s.label}`}>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom text */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Stamp Text</label>
                                    <input type="text" value={stampText} onChange={e => setStampText(e.target.value.toUpperCase())}
                                        placeholder="CUSTOM STAMP"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-rose-400" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Color</label>
                                        <div className="flex items-center gap-3">
                                            <input type="color" value={color} onChange={e => setColor(e.target.value)}
                                                className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
                                            <span className="text-sm font-mono text-[var(--text-muted)]">{color}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Font Size: {fontSize}pt</label>
                                        <input type="range" min={24} max={96} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                                            className="w-full mt-1 accent-rose-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Opacity: {Math.round(opacity * 100)}%</label>
                                    <input type="range" min={5} max={100} value={Math.round(opacity * 100)} onChange={e => setOpacity(Number(e.target.value) / 100)}
                                        className="w-full accent-rose-500" />
                                    <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1"><span>5% (ghost)</span><span>100% (solid)</span></div>
                                </div>

                                {/* Page target */}
                                <div>
                                    <label className="block text-sm font-semibold mb-3 text-[var(--text-secondary)]">Apply To</label>
                                    <div className="flex gap-2">
                                        {(['all', 'first', 'custom'] as const).map(t => (
                                            <button key={t} onClick={() => setPageTarget(t)}
                                                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${pageTarget === t ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-border text-[var(--text-muted)]'}`}>
                                                {t === 'all' ? 'All Pages' : t === 'first' ? 'First Page' : 'Custom…'}
                                            </button>
                                        ))}
                                    </div>
                                    {pageTarget === 'custom' && (
                                        <input type="text" value={customPages} onChange={e => setCustomPages(e.target.value)} placeholder="e.g. 1, 3-5"
                                            className="mt-3 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
                                    )}
                                </div>

                                {/* Preview */}
                                <div className="flex items-center justify-center p-6 bg-gray-50 border border-border rounded-xl">
                                    <span style={{ color, opacity, fontSize: `${Math.round(fontSize * 0.4)}px`, fontWeight: 900, fontFamily: 'Helvetica, Arial, sans-serif', transform: 'rotate(-30deg)', display: 'inline-block', letterSpacing: '0.05em' }}>
                                        {stampText || 'STAMP'}
                                    </span>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Stamp added successfully!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Stamping...</>) : (<><Download className="w-6 h-6" />Add Stamp &amp; Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Will my file be uploaded?', answer: 'No. All processing happens in your browser.' },
                { question: 'Can I use custom text for the stamp?', answer: 'Yes! Type any text you like into the stamp field.' },
                { question: 'Can I control the stamp opacity?', answer: 'Yes, use the opacity slider — lower values make the stamp more transparent.' },
            ]} />
        </div>
    );
};
