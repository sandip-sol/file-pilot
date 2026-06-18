import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { signPDF } from '../utils/pdf/pdfOperations';
import { useRef } from 'react';
import { Loader2, Download, RefreshCw, FileText, PenLine, X, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const SignPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [page, setPage] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) { setFile(files[0]); setError(null); setSuccess(false); }
    };

    const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    };

    const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        setIsDrawing(true);
        lastPos.current = getPos(e);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext('2d')!;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        lastPos.current = pos;
    };

    const stopDraw = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            setSignatureData(canvasRef.current.toDataURL('image/png'));
        }
    };

    const clearCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')!;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setSignatureData(null);
        }
    };

    const handleProcess = async () => {
        if (!file || !signatureData) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await signPDF(file, signatureData, { page, x: 50, y: 50, width: 200, height: 80 });
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_signed.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not sign this PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Sign PDF – Add Signature to PDF Online Free"
                description="Draw your signature and add it to any PDF page. 100% private — all processing done in your browser."
                faqItems={[
                    { question: 'Is this a legally binding signature?', answer: 'This draws an image of your signature on the PDF — it is not a cryptographic digital signature. For legal binding, you need a certified CA-backed digital signature.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                            <PenLine className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Sign PDF</h1>
                    <p>Draw your signature and embed it into your PDF. 100% private — no uploads.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* File Upload */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4">1. Upload PDF</h3>
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to sign" />
                        ) : (
                            <div className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-violet-500" />
                                    <div>
                                        <p className="font-medium text-sm">{file.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(0)} KB</p>
                                    </div>
                                </div>
                                <button onClick={() => { setFile(null); setSuccess(false); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"><RefreshCw className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>

                    {/* Signature Pad */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">2. Draw Signature</h3>
                            <button onClick={clearCanvas} className="text-sm text-[var(--error)] hover:underline flex items-center gap-1">
                                <X className="w-3.5 h-3.5" />Clear
                            </button>
                        </div>
                        <canvas
                            ref={canvasRef}
                            width={560}
                            height={140}
                            className="w-full border-2 border-dashed border-border rounded-xl bg-white cursor-crosshair touch-none"
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={stopDraw}
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-2">Draw your signature above</p>
                    </div>

                    {/* Page Selection & Sign */}
                    {file && signatureData && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
                            <h3 className="font-semibold">3. Choose Page & Sign</h3>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Place signature on page</label>
                                <input type="number" min="1" value={page} onChange={e => setPage(parseInt(e.target.value) || 1)} className="w-32" />
                            </div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                            {success && (
                                <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" /> PDF signed successfully!
                                </div>
                            )}
                            <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Signing...</>) : (<><Download className="w-6 h-6" />Sign PDF & Download</>)}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <FAQSection items={[
                { question: 'Is this a legally binding signature?', answer: 'This draws an image of your signature on the PDF — it is not a cryptographic digital signature. For legal binding, check local regulations.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
