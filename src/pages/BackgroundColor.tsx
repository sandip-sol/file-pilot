import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { addBackgroundColor } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Palette, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

const PRESETS = [
    { label: 'White', r: 255, g: 255, b: 255 },
    { label: 'Light Grey', r: 240, g: 240, b: 240 },
    { label: 'Cream', r: 255, g: 253, b: 230 },
    { label: 'Light Blue', r: 219, g: 234, b: 254 },
    { label: 'Light Green', r: 220, g: 252, b: 231 },
    { label: 'Light Yellow', r: 254, g: 249, b: 195 },
];

export const BackgroundColor = () => {
    const [file, setFile] = useState<File | null>(null);
    const [r, setR] = useState(255);
    const [g, setG] = useState(253);
    const [b, setB] = useState(230);
    const [hexColor, setHexColor] = useState('#fffde6');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const applyHex = (hex: string) => {
        setHexColor(hex);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            setR(parseInt(result[1], 16));
            setG(parseInt(result[2], 16));
            setB(parseInt(result[3], 16));
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await addBackgroundColor(file, r, g, b);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_bg.pdf`, 'application/pdf');
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
                title="Add Background Color to PDF – Change PDF Page Color Online"
                description="Add a colored background to all pages of your PDF. Choose from presets or pick a custom color. 100% private."
                faqItems={[
                    { question: 'Will this cover existing content?', answer: 'The color layer is drawn over existing content. For best results, use light, transparent-friendly colors or use the underlay mode.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center shadow-lg">
                            <Palette className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Add Background Color to PDF</h1>
                    <p>Apply a colored background to all pages of your PDF. Choose from presets or custom colors.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to add a background color" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-rose-50 p-4 rounded-xl border border-orange-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center">
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

                                <div>
                                    <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">Color Presets</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESETS.map(p => (
                                            <button
                                                key={p.label}
                                                onClick={() => { setR(p.r); setG(p.g); setB(p.b); setHexColor(`#${p.r.toString(16).padStart(2, '0')}${p.g.toString(16).padStart(2, '0')}${p.b.toString(16).padStart(2, '0')}`); }}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:border-orange-400 transition-colors"
                                            >
                                                <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: `rgb(${p.r},${p.g},${p.b})` }} />
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Custom Color</label>
                                        <input type="color" value={hexColor} onChange={e => applyHex(e.target.value)} className="w-full h-10 cursor-pointer rounded-lg border border-border" />
                                    </div>
                                    <div className="w-24 h-24 rounded-xl border-2 border-border flex items-center justify-center text-xs text-[var(--text-muted)]" style={{ backgroundColor: `rgb(${r},${g},${b})` }}>
                                        Preview
                                    </div>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Background color added!
                                    </div>
                                )}

                                <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                    {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<><Download className="w-6 h-6" />Add Background & Download</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Will this cover existing content?', answer: 'The color layer is drawn over existing content. For best results, use light colors.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
