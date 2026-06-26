import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { toast } from 'sonner';
import {
    loadImage,
    drawToCanvasCover,
    drawToCanvasContain,
    applyGrayscale,
    encodeWithTargetSize,
    type OutputFormat,
} from '../utils/imageHelpers';
import { presetCategories, type ImagePreset } from '../utils/imagePresets';
import {
    Loader2,
    Download,
    RefreshCw,
    ImageIcon,
    Info,
    Sparkles,
    CheckCircle,
    AlertTriangle,
    SlidersHorizontal,
    X,

    LayoutTemplate,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { PageSeo } from '../components/PageSeo';

type ResizeMode = 'cover' | 'contain';

interface OutputState {
    url: string;
    blob: Blob;
    width: number;
    height: number;
    finalKB: number;
    format: string;
    qualityUsed: number | null;
}

export const ImageRequirements = () => {
    /* ── source state ── */
    const [file, setFile] = useState<File | null>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [sourceDims, setSourceDims] = useState<{ w: number; h: number } | null>(null);

    /* ── requirements ── */
    const [targetW, setTargetW] = useState<string>('600');
    const [targetH, setTargetH] = useState<string>('600');
    const [maxKB, setMaxKB] = useState<string>('100');
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/jpeg');
    const [resizeMode, setResizeMode] = useState<ResizeMode>('cover');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [grayscale, setGrayscale] = useState(false);
    const [allowUpscale, setAllowUpscale] = useState(false);

    /* ── preset state ── */
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [activePreset, setActivePreset] = useState<ImagePreset | null>(null);
    const uploadRef = useRef<HTMLDivElement>(null);

    /* ── processing state ── */
    const [isProcessing, setIsProcessing] = useState(false);
    const [output, setOutput] = useState<OutputState | null>(null);
    const [error, setError] = useState<string | null>(null);

    /* ── cleanup object URLs ── */
    const revokeUrls = useCallback(() => {
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        if (output?.url) URL.revokeObjectURL(output.url);
    }, [sourceUrl, output]);

    useEffect(() => {
        return () => revokeUrls();
    }, [revokeUrls]);

    /* ── SEO JSON-LD ── */
    useEffect(() => {
        const schema = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "WebApplication",
                    "name": "Image Formatter",
                    "url": "https://filepilot.space/image-requirements",
                    "description": "Resize image to exact pixels, reduce file size to KB limit, and convert formats locally in browser.",
                    "applicationCategory": "ImageEditor",
                    "operatingSystem": "Any",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD"
                    }
                },
                {
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "How to resize an image to specific pixel dimensions?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Upload your image, enter the exact width and height in pixels (e.g., 600x600), and download. The tool automatically resizes it."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "How to reduce image file size to 100KB?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Set the 'Max File Size' field to 100 KB. The tool will adjust quality to ensure the file stays under this limit."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "Is my image uploaded to a server?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "No. All processing happens locally in your browser. Your photos never leave your device, ensuring 100% privacy."
                            }
                        }
                    ]
                }
            ]
        };

        const script = document.createElement('script');
        script.type = "application/ld+json";
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    /* ── preset selected ── */
    const handlePresetSelect = (preset: ImagePreset) => {
        setActivePreset(preset);
        setTargetW(String(preset.width));
        setTargetH(String(preset.height));
        setMaxKB(String(preset.maxKB));
        setOutputFormat(preset.format);
        setOutput(null);
        setError(null);
        toast.success(`Preset applied: ${preset.label}`);
        // Scroll to upload area smoothly
        setTimeout(() => {
            uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const clearPreset = () => {
        setActivePreset(null);
    };

    /* ── filtered presets ── */
    const filteredCategories =
        activeCategory === 'all'
            ? presetCategories
            : presetCategories.filter((c) => c.id === activeCategory);

    /* ── file selected ── */
    const handleFileSelected = async (files: File[]) => {
        if (files.length === 0) return;
        revokeUrls();
        setOutput(null);
        setError(null);
        const f = files[0];
        setFile(f);
        const url = URL.createObjectURL(f);
        setSourceUrl(url);
        try {
            const bmp = await loadImage(f);
            setSourceDims({ w: bmp.width, h: bmp.height });
            bmp.close();
        } catch {
            setSourceDims(null);
        }
    };

    /* ── validation ── */
    const validate = (): string | null => {
        const w = parseInt(targetW);
        const h = parseInt(targetH);
        const kb = parseFloat(maxKB);
        if (!w || w <= 0) return 'Width must be greater than 0.';
        if (!h || h <= 0) return 'Height must be greater than 0.';
        if (!kb || kb <= 0) return 'Max file size must be greater than 0.';
        if (w > 10000 || h > 10000) return 'Maximum dimension is 10 000 px.';
        return null;
    };

    /* ── generate ── */
    const handleGenerate = async () => {
        if (!file) return;
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsProcessing(true);
        setError(null);
        if (output?.url) URL.revokeObjectURL(output.url);
        setOutput(null);

        try {
            const w = parseInt(targetW);
            const h = parseInt(targetH);
            const kb = parseFloat(maxKB);

            const img = await loadImage(file);

            // Upscale guard
            if (!allowUpscale && (img.width < w || img.height < h)) {
                img.close();
                setError(
                    `Source image (${img.width}×${img.height}) is smaller than the requested ${w}×${h}. ` +
                    `Enable "Allow upscale" or reduce the target dimensions.`,
                );
                setIsProcessing(false);
                return;
            }

            // Draw to canvas
            const canvas =
                resizeMode === 'cover'
                    ? drawToCanvasCover(img, w, h)
                    : drawToCanvasContain(img, w, h, bgColor);

            img.close();

            // Grayscale
            if (grayscale) {
                applyGrayscale(canvas);
            }

            // Encode
            const result = await encodeWithTargetSize(canvas, outputFormat, kb);

            const outUrl = URL.createObjectURL(result.blob);
            setOutput({
                url: outUrl,
                blob: result.blob,
                width: w,
                height: h,
                finalKB: result.finalKB,
                format: outputFormat,
                qualityUsed: result.qualityUsed,
            });
            toast.success('Output generated successfully');
        } catch (err) {
            const msg = typeof err === 'string' ? err : (err as Error).message || 'An unexpected error occurred.';
            setError(msg);
            toast.error('Could not generate output');
        } finally {
            setIsProcessing(false);
        }
    };

    /* ── download ── */
    const handleDownload = () => {
        if (!output) return;
        const ext = output.format === 'image/jpeg' ? 'jpg' : output.format === 'image/png' ? 'png' : 'webp';
        const baseName = file?.name.replace(/\.[^.]+$/, '') ?? 'output';
        const a = document.createElement('a');
        a.href = output.url;
        a.download = `${baseName}_${output.width}x${output.height}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    /* ── reset ── */
    const handleReset = () => {
        revokeUrls();
        setFile(null);
        setSourceUrl(null);
        setSourceDims(null);
        setOutput(null);
        setError(null);
    };

    /* ── format label ── */
    const fmtLabel = (f: OutputFormat) =>
        f === 'image/jpeg' ? 'JPG' : f === 'image/png' ? 'PNG' : 'WebP';

    /* ============ RENDER ============ */
    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Resize Image to Exact Size & KB – Free Online Tool"
                description="Resize image to exact pixels, reduce file size to KB limit, convert to JPG/PNG/WebP. Free, private, browser-based."
            />
            {/* ── Header ── */}
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
                            <SlidersHorizontal className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Image Formatter</h1>
                    <p>Resize + compress to match exact upload requirements.</p>
                    <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
                        <Sparkles className="w-4 h-4" />
                        Processed locally in your browser. No uploads.
                    </p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* ═══════════ PRESET PICKER ═══════════ */}
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-5">
                            <LayoutTemplate className="w-5 h-5 text-foreground" />
                            <h2 className="text-lg font-bold">Quick Presets</h2>
                            <span className="text-xs text-muted-foreground ml-auto">or enter values manually below</span>
                        </div>

                        {/* Category pills */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === 'all'
                                    ? 'bg-foreground text-background shadow-md'
                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                                    }`}
                            >
                                All
                            </button>
                            {presetCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat.id
                                        ? 'bg-foreground text-background shadow-md'
                                        : 'bg-muted text-muted-foreground hover:bg-accent'
                                        }`}
                                >
                                    {cat.emoji} {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Preset grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredCategories.flatMap((cat) =>
                                cat.presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => handlePresetSelect(preset)}
                                        className={`preset-card text-left px-4 py-3.5 rounded-xl border-2 transition-all group ${activePreset?.id === preset.id
                                            ? 'border-foreground bg-muted shadow-md'
                                            : 'border-border hover:border-muted-foreground hover:shadow-sm bg-background'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl leading-none mt-0.5">{preset.emoji}</span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-[var(--text)] truncate">
                                                    {preset.label}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {preset.width}×{preset.height} · ≤{preset.maxKB} KB
                                                </p>
                                                <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
                                                    {preset.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )),
                            )}
                        </div>
                    </div>

                    {/* ═══════════ MAIN CARD ═══════════ */}
                    <div ref={uploadRef} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">

                        {/* Active preset badge */}
                        {activePreset && (
                            <div className="flex items-center gap-2 mb-5 animate-fade-in">
                                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold border border-emerald-200">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Using: {activePreset.emoji} {activePreset.label}
                                    <button
                                        onClick={clearPreset}
                                        className="ml-1 p-0.5 rounded-full hover:bg-emerald-200/60 transition-colors"
                                        title="Clear preset"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Upload ── */}
                        {!file ? (
                            <FileUploader
                                onFilesSelected={handleFileSelected}
                                accept="image/*"
                                multiple={false}
                                description="Drop an image here"
                            />
                        ) : (
                            <div className="animate-fade-in space-y-8">
                                {/* Source info bar */}
                                <div className="flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                {(file.size / 1024).toFixed(1)} KB
                                                {sourceDims && (
                                                    <span className="ml-2 font-medium text-cyan-600">
                                                        {sourceDims.w} × {sourceDims.h} px
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]"
                                        title="Change Image"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* ── Requirements Form ── */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Width */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                                            Required Width (px)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={10000}
                                            value={targetW}
                                            onChange={(e) => { setTargetW(e.target.value); setActivePreset(null); }}
                                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                                        />
                                    </div>

                                    {/* Height */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                                            Required Height (px)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={10000}
                                            value={targetH}
                                            onChange={(e) => { setTargetH(e.target.value); setActivePreset(null); }}
                                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                                        />
                                    </div>

                                    {/* Max KB */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                                            Max File Size (KB)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={maxKB}
                                            onChange={(e) => { setMaxKB(e.target.value); setActivePreset(null); }}
                                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                                        />
                                    </div>

                                    {/* Output Format */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                                            Output Format
                                        </label>
                                        <select
                                            value={outputFormat}
                                            onChange={(e) => { setOutputFormat(e.target.value as OutputFormat); setActivePreset(null); }}
                                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                                        >
                                            <option value="image/jpeg">JPG</option>
                                            <option value="image/png">PNG</option>
                                            <option value="image/webp">WebP</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Resize mode */}
                                <div>
                                    <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                                        Resize Mode
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setResizeMode('cover')}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm ${resizeMode === 'cover'
                                                ? 'border-foreground bg-muted text-foreground'
                                                : 'border-border hover:border-muted-foreground text-muted-foreground'
                                                }`}
                                        >
                                            Crop to fit (Cover)
                                        </button>
                                        <button
                                            onClick={() => setResizeMode('contain')}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm ${resizeMode === 'contain'
                                                ? 'border-foreground bg-muted text-foreground'
                                                : 'border-border hover:border-muted-foreground text-muted-foreground'
                                                }`}
                                        >
                                            Fit with padding (Contain)
                                        </button>
                                    </div>
                                </div>

                                {/* Background color (contain only) */}
                                {resizeMode === 'contain' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                                            Background Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                            />
                                            <span className="text-sm text-[var(--text-muted)] font-medium">{bgColor}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Toggles */}
                                <div className="flex flex-col gap-4">
                                    {/* Grayscale toggle */}
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={grayscale}
                                            onChange={(e) => setGrayscale(e.target.checked)}
                                            className="w-5 h-5 rounded border-border accent-foreground cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text)]">
                                            Convert to black & white (grayscale)
                                        </span>
                                    </label>

                                    {/* Upscale toggle */}
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={allowUpscale}
                                            onChange={(e) => setAllowUpscale(e.target.checked)}
                                            className="w-5 h-5 rounded border-border accent-foreground cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text)]">
                                            Allow upscale if image is smaller
                                        </span>
                                    </label>
                                    {allowUpscale && (
                                        <div className="bg-amber-50 text-amber-700 px-4 py-2.5 rounded-lg flex items-start gap-2 text-xs border border-amber-200 animate-fade-in">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            Upscaling may reduce image quality. The output will match the target dimensions.
                                        </div>
                                    )}
                                </div>

                                {/* PNG warning */}
                                {outputFormat === 'image/png' && (
                                    <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-blue-100 animate-fade-in">
                                        <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p>
                                            PNG uses lossless compression — file size cannot be reduced by lowering quality.
                                            If the output exceeds your KB limit, try <strong>WebP</strong> or <strong>JPG</strong>.
                                        </p>
                                    </div>
                                )}

                                {/* Metadata note */}
                                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5" />
                                    EXIF metadata is not preserved for privacy and smaller file size.
                                </div>

                                {/* ── Previews ── */}
                                {(sourceUrl || output) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {sourceUrl && (
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Before</p>
                                                <div className="rounded-xl border border-border overflow-hidden bg-muted/40 flex items-center justify-center aspect-square">
                                                    <img
                                                        src={sourceUrl}
                                                        alt="Source"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {output && (
                                            <div className="animate-fade-in">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">After</p>
                                                <div className="rounded-xl border border-border overflow-hidden bg-muted/40 flex items-center justify-center aspect-square">
                                                    <img
                                                        src={output.url}
                                                        alt="Output"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Output details ── */}
                                {output && (
                                    <div className="animate-fade-in bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            <span className="text-sm font-semibold text-emerald-700">Output Ready</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <span className="text-[var(--text-muted)] block text-xs">Dimensions</span>
                                                <span className="font-semibold">{output.width} × {output.height}</span>
                                            </div>
                                            <div>
                                                <span className="text-[var(--text-muted)] block text-xs">File Size</span>
                                                <span className="font-semibold">{output.finalKB.toFixed(1)} KB</span>
                                            </div>
                                            <div>
                                                <span className="text-[var(--text-muted)] block text-xs">Format</span>
                                                <span className="font-semibold">{fmtLabel(output.format as OutputFormat)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[var(--text-muted)] block text-xs">Quality</span>
                                                <span className="font-semibold">
                                                    {output.qualityUsed !== null
                                                        ? `${Math.round(output.qualityUsed * 100)}%`
                                                        : 'Lossless'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Error ── */}
                                {error && (
                                    <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* ── Action buttons ── */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isProcessing}
                                        className={`btn btn-primary flex-1 py-4 text-base ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Generating…
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate Output
                                            </>
                                        )}
                                    </button>

                                    {output && (
                                        <button
                                            onClick={handleDownload}
                                            className="btn btn-outline flex-1 py-4 text-base"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download
                                        </button>
                                    )}

                                    <button
                                        onClick={handleReset}
                                        className="btn btn-outline py-4 text-base sm:flex-none sm:px-6"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="container pb-16">
                {/* ── How It Works ── */}
                <div className="max-w-4xl mx-auto mb-16">
                    <h2 className="text-2xl font-bold mb-8 text-center">How to Resize & Compress Images Online</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">1</div>
                            <h3 className="font-semibold mb-2">Upload Image</h3>
                            <p className="text-[var(--text-muted)] text-sm">Select any JPG, PNG, or WebP image. Your file stays private and is processed locally.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">2</div>
                            <h3 className="font-semibold mb-2">Set Requirements</h3>
                            <p className="text-[var(--text-muted)] text-sm">Enter exact pixel dimensions (e.g. 600x600) and max file size (e.g. 50KB).</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">3</div>
                            <h3 className="font-semibold mb-2">Download</h3>
                            <p className="text-[var(--text-muted)] text-sm">Get your perfectly formatted image instantly. Ready for upload to any portal.</p>
                        </div>
                    </div>
                </div>

                {/* ── FAQ ── */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <FAQItem
                            q="How to resize an image to specific pixel dimensions?"
                            a="Simply upload your image and enter the desired width and height in the fields above. You can choose to crop (cover) or add padding (contain) to fit the aspect ratio."
                        />
                        <FAQItem
                            q="How to reduce image file size to specific KB?"
                            a="Enter your target limit (e.g., 50KB, 100KB, 2MB) in the 'Max File Size' field. Our tool uses smart compression to reach that size while maintaining the best possible quality."
                        />
                        <FAQItem
                            q="Which format should I choose: JPG, PNG, or WebP?"
                            a="JPG is best for photos and small file sizes. PNG is best for graphics with text or transparent backgrounds (but file size is larger). WebP offers the best balance of quality and compression for web use."
                        />
                        <FAQItem
                            q="Is this tool safe for passport photos and ID documents?"
                            a="Yes, absolutely. Unlike other online tools, we process your images entirely within your browser. Your sensitive documents are never uploaded to our servers or seen by anyone."
                        />
                        <FAQItem
                            q="Can I resize images for Instagram, LinkedIn, or Twitter?"
                            a="Yes! Use the 'Quick Presets' above to instantly select the correct dimensions for social media posts, profile pictures, and banners."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const FAQItem = ({ q, a }: { q: string; a: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
            >
                {q}
                {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-[var(--text-secondary)] text-sm leading-relaxed border-t border-border/50 bg-muted/20">
                    {a}
                </div>
            )}
        </div>
    );
};
