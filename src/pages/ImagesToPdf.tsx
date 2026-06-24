import { useEffect, useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { convertImagesToPDF, downloadBlob } from '../utils/pdfHelpers';
import type { ImageItem } from '../utils/pdfHelpers';
import { Image as ImageIcon, Loader2, Download, X, RotateCw, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { Link } from 'react-router-dom';

export const ImagesToPdf = () => {
    const [items, setItems] = useState<ImageItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [margin, setMargin] = useState<'none' | 'small' | 'medium'>('small');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        };
    }, [items]);

    const handleFilesSelected = (files: File[]) => {
        const newItems: ImageItem[] = files.map(file => ({
            id: crypto.randomUUID(),
            file,
            rotation: 0,
            previewUrl: URL.createObjectURL(file),
        }));
        setItems(prev => [...prev, ...newItems]);
        setSuccess(false);
        setError(null);
    };

    const removeItem = (id: string) => {
        setItems(prev => {
            const itemToRemove = prev.find((item) => item.id === id);
            if (itemToRemove) {
                URL.revokeObjectURL(itemToRemove.previewUrl);
            }

            return prev.filter(item => item.id !== id);
        });
    };

    const rotateItem = (id: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, rotation: (item.rotation + 90) % 360 };
            }
            return item;
        }));
    };

    const moveItem = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index === 0) return;
        if (direction === 'right' && index === items.length - 1) return;

        setItems(prev => {
            const newItems = [...prev];
            const targetIndex = direction === 'left' ? index - 1 : index + 1;
            [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
            return newItems;
        });
    };

    const handleConvert = async () => {
        if (items.length === 0) return;
        setIsProcessing(true);
        setError(null);

        try {
            const pdfBytes = await convertImagesToPDF(items, { pageSize, orientation, margin });
            downloadBlob(pdfBytes, 'images.pdf', 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            setError('Failed to generate PDF. One or more images may be unsupported or corrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Convert Images to PDF – JPG, PNG, WebP, SVG, BMP to PDF"
                description="Convert JPG, PNG, WebP, SVG, BMP, HEIC, and TIFF images to a single PDF with page size, orientation, and margin controls. Free & private."
                canonicalPath="/images-to-pdf"
                faqItems={[
                    { question: "Does converting images to PDF upload my files?", answer: "No. All conversion happens in your browser. Your images never leave your device." },
                    { question: "What image formats are supported?", answer: "JPG, JPEG, PNG, WebP, SVG, and BMP are supported in modern browsers. HEIC/HEIF and TIFF support depends on whether your browser can decode the files." },
                    { question: "Can I choose the page size and orientation?", answer: "Yes. You can select A4 or Letter page size and choose portrait or landscape orientation before converting." },
                    { question: "Can I reorder or rotate images before converting?", answer: "Yes. Use the arrow buttons to reorder and the rotate button to adjust each image before generating the PDF." },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Convert Images to PDF</h1>
                    <p>Convert JPG, PNG, WebP, SVG, BMP, and browser-supported HEIC or TIFF images to one PDF with custom page size and orientation.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Left: Settings */}
                    <div className="lg:col-span-1">
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
                            <h3 className="font-bold text-lg mb-6">Page Settings</h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Page Size</label>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter')}
                                    >
                                        <option value="A4">A4 (210 × 297 mm)</option>
                                        <option value="Letter">Letter (8.5 × 11 in)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Orientation</label>
                                    <select
                                        value={orientation}
                                        onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                                    >
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Margins</label>
                                    <select
                                        value={margin}
                                        onChange={(e) => setMargin(e.target.value as 'none' | 'small' | 'medium')}
                                    >
                                        <option value="none">None</option>
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                    </select>
                                </div>

                            </div>

                            {success && (
                                <div className="bg-[var(--success-light)] text-[var(--success)] p-3 rounded-xl mt-6 text-sm font-medium flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    PDF created!
                                </div>
                            )}

                            {error && (
                                <div className="bg-[var(--error-light)] text-[var(--error)] p-3 rounded-xl mt-6 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleConvert}
                                disabled={isProcessing || items.length === 0}
                                className={`btn btn-primary w-full py-4 mt-6 ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Convert to PDF
                                    </>
                                )}
                            </button>

                            <div className="mt-6 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                                <p>Need the reverse workflow?</p>
                                <Link to="/pdf-to-images" className="mt-2 inline-flex items-center gap-2 font-medium text-foreground hover:underline">
                                    Open PDF to Images
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right: Images */}
                    <div className="lg:col-span-2">
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <FileUploader
                                onFilesSelected={handleFilesSelected}
                                multiple={true}
                                accept="image/*,.svg,.bmp,.heic,.heif,.tif,.tiff"
                                description="Drop images here"
                            />

                            {items.length > 0 && (
                                <div className="mt-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold">Images ({items.length})</h3>
                                        <button onClick={() => setItems([])} className="text-sm text-[var(--error)] hover:underline">Clear All</button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in">
                                        {items.map((item, index) => (
                                            <div key={item.id} className="relative group bg-background border border-border rounded-xl p-2 hover:border-foreground transition-colors">
                                                <div className="relative w-full aspect-[3/4] mb-2 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                                                    <img
                                                        src={item.previewUrl}
                                                        alt={item.file.name}
                                                        className="max-w-full max-h-full object-contain transition-transform"
                                                        style={{ transform: `rotate(${item.rotation}deg)` }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between text-[var(--text-muted)]">
                                                    <button onClick={() => moveItem(index, 'left')} disabled={index === 0} className="p-1 hover:text-foreground disabled:opacity-30"><ArrowLeft className="w-4 h-4" /></button>
                                                    <button onClick={() => rotateItem(item.id)} className="p-1 hover:text-foreground" title="Rotate"><RotateCw className="w-4 h-4" /></button>
                                                    <button onClick={() => removeItem(item.id)} className="p-1 hover:text-[var(--error)]" title="Remove"><X className="w-4 h-4" /></button>
                                                    <button onClick={() => moveItem(index, 'right')} disabled={index === items.length - 1} className="p-1 hover:text-foreground disabled:opacity-30"><ArrowRight className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {items.length === 0 && (
                                <div className="mt-12 text-center text-[var(--text-muted)]">
                                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p>No images selected yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: "Does converting images to PDF upload my files?", answer: "No. All conversion happens in your browser. Your images never leave your device." },
                { question: "What image formats are supported?", answer: "JPG, JPEG, PNG, WebP, SVG, and BMP work in modern browsers. HEIC/HEIF and TIFF files are accepted when the browser can decode them." },
                { question: "Can I choose the page size and orientation?", answer: "Yes. You can select A4 or Letter page size and choose portrait or landscape orientation before converting." },
                { question: "Can I reorder or rotate images before converting?", answer: "Yes. Use the arrow buttons to reorder and the rotate button to adjust each image before generating the PDF." },
            ]} />
        </div>
    );
};
