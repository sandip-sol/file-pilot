import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { convertImagesToPDF, downloadBlob } from '../utils/pdfHelpers';
import type { ImageItem } from '../utils/pdfHelpers';
import { Image as ImageIcon, Loader2, Download, X, RotateCw, ArrowLeft, ArrowRight } from 'lucide-react';

export const ImagesToPdf = () => {
    const [items, setItems] = useState<ImageItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [margin, setMargin] = useState<'none' | 'small' | 'medium'>('small');

    const handleFilesSelected = (files: File[]) => {
        const newItems: ImageItem[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            rotation: 0
        }));
        setItems(prev => [...prev, ...newItems]);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
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

        try {
            const pdfBytes = await convertImagesToPDF(items, { pageSize, orientation, margin });
            downloadBlob(pdfBytes, 'images.pdf', 'application/pdf');
        } catch (error) {
            console.error(error);
            alert('Failed to generate PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container py-12 max-w-5xl">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-4">Images to PDF</h1>
                <p className="text-[var(--text-muted)]">Convert your images into a single PDF file.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4">Page Settings</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Page Size</label>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter')}
                                className="w-full p-2 border border-[var(--border)] rounded"
                            >
                                <option value="A4">A4</option>
                                <option value="Letter">Letter</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Orientation</label>
                            <select
                                value={orientation}
                                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                                className="w-full p-2 border border-[var(--border)] rounded"
                            >
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Margins</label>
                            <select
                                value={margin}
                                onChange={(e) => setMargin(e.target.value as 'none' | 'small' | 'medium')}
                                className="w-full p-2 border border-[var(--border)] rounded"
                            >
                                <option value="none">None</option>
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                            </select>
                        </div>

                        <button
                            onClick={handleConvert}
                            disabled={isProcessing || items.length === 0}
                            className={`btn btn-primary w-full py-3 ${isProcessing ? 'cursor-wait' : ''}`}
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
                    </div>
                </div>

                {/* Right: Images */}
                <div className="lg:col-span-2">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm min-h-[500px]">
                        <FileUploader
                            onFilesSelected={handleFilesSelected}
                            multiple={true}
                            accept="image/*"
                            description="Drop images here (JPG, PNG, WebP)"
                        />

                        {items.length > 0 && (
                            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in">
                                {items.map((item, index) => (
                                    <div key={item.id} className="relative group bg-gray-50 border border-[var(--border)] rounded-lg p-2 flex flex-col items-center">
                                        <div className="relative w-full aspect-[3/4] mb-2 bg-white rounded overflow-hidden flex items-center justify-center">
                                            <img
                                                src={URL.createObjectURL(item.file)}
                                                alt="preview"
                                                className="max-w-full max-h-full object-contain"
                                                style={{ transform: `rotate(${item.rotation}deg)` }}
                                            />
                                        </div>

                                        <div className="w-full flex items-center justify-between text-gray-500">
                                            <button onClick={() => moveItem(index, 'left')} disabled={index === 0} className="hover:text-[var(--primary)] disabled:opacity-30"><ArrowLeft className="w-4 h-4" /></button>

                                            <button onClick={() => rotateItem(item.id)} className="hover:text-[var(--primary)]" title="Rotate">
                                                <RotateCw className="w-4 h-4" />
                                            </button>

                                            <button onClick={() => removeItem(item.id)} className="hover:text-red-500" title="Remove">
                                                <X className="w-4 h-4" />
                                            </button>

                                            <button onClick={() => moveItem(index, 'right')} disabled={index === items.length - 1} className="hover:text-[var(--primary)] disabled:opacity-30"><ArrowRight className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {items.length === 0 && (
                            <div className="mt-12 text-center text-gray-400">
                                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>No images selected yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
