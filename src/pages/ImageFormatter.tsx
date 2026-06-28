import { useState, useEffect, useCallback } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { ToolUsageTracker } from '../components/ToolUsageTracker';
import { RelatedTools } from '../components/RelatedTools';
import { toast } from 'sonner';
import {
  imageFormatterPresets,
  type FormatterPreset,
} from '../data/imageFormatterPresets';
import {
  type FitMode,
  type BatchProcessOptions,
  type BatchOutputItem,
  processOneImage,
  downloadAsZip,
  downloadBlob,
  savedPercentage,
  formatFileSize,
} from '../utils/image/batchExport';
import { getFormatLabel } from '../utils/image/support';
import { extractMetadata, type ImageMetadataInfo } from '../utils/image/metadata';
import { FAQSection } from '../components/FAQSection';
import {
  Sparkles,
  Download,
  Loader2,
  Trash2,
  Archive,
  RefreshCw,
  Lock,
  Unlock,
  Info,
  CheckCircle,
  Image as ImageIcon,
  SlidersHorizontal,
  X,
  Palette,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Local types                                                        */
/* ------------------------------------------------------------------ */

type OutputFormatOption = 'original' | 'image/jpeg' | 'image/png' | 'image/webp';
type DimensionMode = 'pixels' | 'percentage';

interface UploadedImage {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  previewUrl: string;
  metadata: ImageMetadataInfo | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let nextId = 0;
function uid(): string {
  nextId += 1;
  return `img-${Date.now()}-${nextId}`;
}

async function loadImageMeta(file: File): Promise<UploadedImage> {
  const bitmap = await createImageBitmap(file);
  const previewUrl = URL.createObjectURL(file);
  let metadata: ImageMetadataInfo | null = null;
  try {
    metadata = await extractMetadata(file);
  } catch {
    // Metadata extraction is best-effort
  }
  const item: UploadedImage = {
    id: uid(),
    file,
    name: file.name,
    type: file.type || 'image/jpeg',
    size: file.size,
    width: bitmap.width,
    height: bitmap.height,
    previewUrl,
    metadata,
  };
  bitmap.close();
  return item;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const ImageFormatter = () => {
  /* ── uploaded files ── */
  const [images, setImages] = useState<UploadedImage[]>([]);

  /* ── preset / custom ── */
  const [activePreset, setActivePreset] = useState<FormatterPreset | null>(null);

  /* ── output dimensions ── */
  const [dimensionMode, setDimensionMode] = useState<DimensionMode>('pixels');
  const [targetW, setTargetW] = useState(1200);
  const [targetH, setTargetH] = useState(800);
  const [percentage, setPercentage] = useState(100);
  const [aspectLocked, setAspectLocked] = useState(false);
  const [baseAspect, setBaseAspect] = useState<number | null>(null);

  /* ── fit mode ── */
  const [fitMode, setFitMode] = useState<FitMode>('contain');

  /* ── background colour ── */
  const [bgColor, setBgColor] = useState('#ffffff');

  /* ── output format & quality ── */
  const [outputFormat, setOutputFormat] = useState<OutputFormatOption>('original');
  const [quality, setQuality] = useState(0.85);

  /* ── target file size ── */
  const [targetSizeKB, setTargetSizeKB] = useState('');

  /* ── grayscale ── */
  const [grayscale, setGrayscale] = useState(false);

  /* ── metadata removal ── */
  const [removeMetadata, setRemoveMetadata] = useState(true);

  /* ── filename prefix/suffix ── */
  const [filenamePrefix, setFilenamePrefix] = useState('');
  const [filenameSuffix, setFilenameSuffix] = useState('');

  /* ── processing state ── */
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [results, setResults] = useState<BatchOutputItem[]>([]);

  /* ── cleanup object URLs on unmount ── */
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      results.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── derived ── */
  const showQualitySlider = outputFormat === 'image/jpeg' || outputFormat === 'image/webp';
  const showBgColor = fitMode === 'contain' || outputFormat === 'image/jpeg';
  const firstImage = images[0] ?? null;

  /* ── file upload ── */
  const handleFilesSelected = useCallback(
    async (selected: File[]) => {
      const loaded: UploadedImage[] = [];
      for (const file of selected) {
        try {
          const meta = await loadImageMeta(file);
          loaded.push(meta);
        } catch {
          toast.error(`Failed to load ${file.name}`);
        }
      }
      if (loaded.length > 0) {
        setImages((prev) => {
          const merged = [...prev, ...loaded];
          // set base aspect from first image if none yet
          if (prev.length === 0 && loaded.length > 0) {
            setBaseAspect(loaded[0].width / loaded[0].height);
          }
          return merged;
        });
        // clear previous results
        results.forEach((r) => URL.revokeObjectURL(r.previewUrl));
        setResults([]);
      }
    },
    [results],
  );

  /* ── remove single image ── */
  const removeImage = useCallback(
    (id: string) => {
      setImages((prev) => {
        const removed = prev.find((img) => img.id === id);
        if (removed) URL.revokeObjectURL(removed.previewUrl);
        const remaining = prev.filter((img) => img.id !== id);
        if (remaining.length === 0) setBaseAspect(null);
        else if (removed && prev.indexOf(removed) === 0 && remaining.length > 0) {
          setBaseAspect(remaining[0].width / remaining[0].height);
        }
        return remaining;
      });
      results.forEach((r) => URL.revokeObjectURL(r.previewUrl));
      setResults([]);
    },
    [results],
  );

  /* ── aspect-ratio-aware dimension changes ── */
  const handleWidthChange = useCallback(
    (w: number) => {
      setTargetW(w);
      if (aspectLocked && baseAspect && baseAspect > 0) {
        setTargetH(Math.round(w / baseAspect));
      }
    },
    [aspectLocked, baseAspect],
  );

  const handleHeightChange = useCallback(
    (h: number) => {
      setTargetH(h);
      if (aspectLocked && baseAspect && baseAspect > 0) {
        setTargetW(Math.round(h * baseAspect));
      }
    },
    [aspectLocked, baseAspect],
  );

  /* ── apply a preset ── */
  const applyPreset = useCallback((preset: FormatterPreset) => {
    setActivePreset(preset);
    setDimensionMode('pixels');
    setTargetW(preset.width);
    setTargetH(preset.height);
    setAspectLocked(false);
    if (preset.format !== 'original') {
      setOutputFormat(preset.format);
    } else {
      setOutputFormat('original');
    }
    if (preset.maxKB) {
      setTargetSizeKB(String(preset.maxKB));
    } else {
      setTargetSizeKB('');
    }
    toast.success(`Preset applied: ${preset.name}`);
  }, []);

  /* ── select "Custom" ── */
  const selectCustom = useCallback(() => {
    setActivePreset(null);
  }, []);

  /* ── compute target dimensions per image ── */
  const computeDimensions = useCallback(
    (img: UploadedImage): { w: number; h: number } => {
      if (dimensionMode === 'percentage') {
        const scale = percentage / 100;
        return {
          w: Math.max(1, Math.round(img.width * scale)),
          h: Math.max(1, Math.round(img.height * scale)),
        };
      }
      return { w: targetW, h: targetH };
    },
    [dimensionMode, percentage, targetW, targetH],
  );

  /* ── process all images ── */
  const handleProcess = useCallback(async () => {
    if (images.length === 0) return;

    if (dimensionMode === 'pixels' && (targetW < 1 || targetH < 1)) {
      toast.error('Width and height must be at least 1 pixel.');
      return;
    }
    if (dimensionMode === 'percentage' && percentage <= 0) {
      toast.error('Percentage must be greater than 0.');
      return;
    }

    const parsedTarget = targetSizeKB.trim() === '' ? undefined : parseFloat(targetSizeKB);
    if (parsedTarget !== undefined && (isNaN(parsedTarget) || parsedTarget <= 0)) {
      toast.error('Target file size must be a positive number.');
      return;
    }

    setIsProcessing(true);
    setProgressIndex(0);
    results.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    setResults([]);

    const processed: BatchOutputItem[] = [];

    for (let i = 0; i < images.length; i++) {
      setProgressIndex(i + 1);
      const img = images[i];
      const { w, h } = computeDimensions(img);

      const options: BatchProcessOptions = {
        width: w,
        height: h,
        fitMode,
        format: outputFormat,
        quality,
        bgColor,
        grayscale,
        targetSizeKB: parsedTarget,
        filenamePrefix,
        filenameSuffix,
      };

      try {
        const result = await processOneImage(img.file, img.id, options);
        processed.push(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Processing failed';
        toast.error(`Failed: ${img.name} - ${msg}`);
      }
    }

    setResults(processed);
    setIsProcessing(false);

    if (processed.length > 0) {
      toast.success(`Formatted ${processed.length} image${processed.length > 1 ? 's' : ''} successfully`);
    }
  }, [
    images, dimensionMode, targetW, targetH, percentage, targetSizeKB,
    fitMode, outputFormat, quality, bgColor, grayscale,
    filenamePrefix, filenameSuffix, results, computeDimensions,
  ]);

  /* ── download handlers ── */
  const handleDownloadSingle = useCallback((item: BatchOutputItem) => {
    downloadBlob(item.outputBlob, item.outputFilename);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0) return;
    const entries = results.map((r) => ({
      filename: r.outputFilename,
      blob: r.outputBlob,
    }));
    await downloadAsZip(entries, 'formatted-images.zip');
    toast.success('ZIP downloaded');
  }, [results]);

  /* ── reset everything ── */
  const handleReset = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    results.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    setImages([]);
    setResults([]);
    setActivePreset(null);
    setDimensionMode('pixels');
    setTargetW(1200);
    setTargetH(800);
    setPercentage(100);
    setAspectLocked(false);
    setBaseAspect(null);
    setFitMode('contain');
    setBgColor('#ffffff');
    setOutputFormat('original');
    setQuality(0.85);
    setTargetSizeKB('');
    setGrayscale(false);
    setRemoveMetadata(true);
    setFilenamePrefix('');
    setFilenameSuffix('');
  }, [images, results]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const faqItems = [
    { question: "Can I format multiple images at once?", answer: "Yes. FilePilot supports batch formatting, allowing you to upload and process multiple images simultaneously. All images are formatted with the same settings and can be downloaded individually or as a ZIP file." },
    { question: "What output dimensions and formats are available?", answer: "You can set exact pixel dimensions or scale by percentage, and export as JPEG, PNG, or WebP. You can also set a target file size in KB, adjust quality, and choose between contain, cover, or stretch fit modes." },
    { question: "Are there preset templates available?", answer: "Yes. Built-in presets cover common use cases with pre-configured dimensions. You can also create custom dimensions and lock the aspect ratio to maintain proportions." },
    { question: "Is my data private?", answer: "Yes. All image processing happens entirely in your browser. Your files are never uploaded to any server, and EXIF metadata (including GPS data) is stripped by default during re-export." },
  ];

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Image Formatter — Resize, Convert & Optimize Images Online"
        description="Format images to exact dimensions, convert formats, set file size targets, and batch export. Free, private, browser-based."
        faqItems={faqItems}
      />
      <ToolUsageTracker />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
          </div>
          <h1>Image Formatter</h1>
          <p>Resize, convert, and optimize images to exact specifications.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Your files are processed locally in your browser and are not uploaded.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Upload / Image List */}
          {images.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple
                description="Drop images here to format"
                hint="Supports JPEG, PNG, WebP, and more"
              />
            </div>
          ) : (
            <>
              {/* Image cards */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">
                    {images.length} image{images.length !== 1 ? 's' : ''} selected
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.onchange = () => {
                          if (input.files) handleFilesSelected(Array.from(input.files));
                        };
                        input.click();
                      }}
                      className="btn btn-outline text-sm py-2 px-3"
                    >
                      Add More
                    </button>
                    <button
                      onClick={handleReset}
                      className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-[var(--error)]"
                      title="Clear All"
                      aria-label="Clear all images"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2 border border-border"
                    >
                      <img
                        src={img.previewUrl}
                        alt={img.name}
                        className="w-11 h-11 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text)] truncate">{img.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getFormatLabel(img.type)} &middot; {img.width} x {img.height} px &middot; {formatFileSize(img.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="p-1.5 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-[var(--error)] shrink-0"
                        title="Remove"
                        aria-label={`Remove ${img.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6">
                <h2 className="text-lg font-bold">Format Settings</h2>

                {/* ── Presets ── */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                    Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {imageFormatterPresets.map((preset) => {
                      const isActive = activePreset?.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => applyPreset(preset)}
                          className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                            isActive
                              ? 'border-foreground bg-muted shadow-sm'
                              : 'border-border hover:border-muted-foreground bg-background'
                          }`}
                          title={preset.description}
                        >
                          <p className="text-sm font-semibold truncate">{preset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {preset.width} x {preset.height}
                            {preset.maxKB ? ` / ${preset.maxKB}KB` : ''}
                          </p>
                        </button>
                      );
                    })}
                    <button
                      onClick={selectCustom}
                      className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                        activePreset === null
                          ? 'border-foreground bg-muted shadow-sm'
                          : 'border-border hover:border-muted-foreground bg-background'
                      }`}
                    >
                      <p className="text-sm font-semibold">Custom</p>
                      <p className="text-xs text-muted-foreground">Set your own</p>
                    </button>
                  </div>
                </div>

                {/* ── Metadata warnings ── */}
                {images.some((img) => img.metadata && (img.metadata.hasGps || img.metadata.hasExif || img.metadata.warnings.length > 0)) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-2 min-w-0 flex-1">
                        <p className="text-sm font-semibold text-amber-800">Metadata detected in uploaded images</p>
                        <div className="space-y-1.5">
                          {images.filter((img) => img.metadata?.hasGps).length > 0 && (
                            <p className="text-xs text-amber-700 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              GPS / location data may be present in {images.filter((img) => img.metadata?.hasGps).length} file{images.filter((img) => img.metadata?.hasGps).length !== 1 ? 's' : ''}
                            </p>
                          )}
                          {images.filter((img) => img.metadata?.cameraMake || img.metadata?.cameraModel).length > 0 && (
                            <p className="text-xs text-amber-700 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 shrink-0" />
                              Camera / device information detected
                            </p>
                          )}
                          {images.filter((img) => img.metadata?.dateTime).length > 0 && (
                            <p className="text-xs text-amber-700 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 shrink-0" />
                              Creation date information detected
                            </p>
                          )}
                          {images.filter((img) => img.metadata?.software).length > 0 && (
                            <p className="text-xs text-amber-700 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 shrink-0" />
                              Software information detected
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          A newly rendered image copy is created without the standard metadata commonly retained in the original file.
                          Canvas-based export strips EXIF data by default.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Dimension mode toggle ── */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                    Dimension Input
                  </label>
                  <div className="flex gap-3">
                    {([
                      { value: 'pixels' as const, label: 'Pixels' },
                      { value: 'percentage' as const, label: 'Percentage' },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDimensionMode(opt.value);
                          setResults([]);
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm ${
                          dimensionMode === opt.value
                            ? 'border-foreground bg-muted text-foreground'
                            : 'border-border hover:border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Pixel dimensions with aspect lock ── */}
                {dimensionMode === 'pixels' ? (
                  <div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label htmlFor="fmt-width" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                          Width (px)
                        </label>
                        <input
                          id="fmt-width"
                          type="number"
                          min={1}
                          max={10000}
                          value={targetW}
                          onChange={(e) => {
                            handleWidthChange(Math.max(1, parseInt(e.target.value) || 1));
                            setResults([]);
                          }}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const next = !aspectLocked;
                          setAspectLocked(next);
                          if (next && firstImage) {
                            setBaseAspect(firstImage.width / firstImage.height);
                          }
                        }}
                        className={`p-3 rounded-xl border-2 transition-all mb-0 ${
                          aspectLocked
                            ? 'border-foreground bg-muted text-foreground'
                            : 'border-border text-muted-foreground hover:border-muted-foreground'
                        }`}
                        title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                        aria-label={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                      >
                        {aspectLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>

                      <div className="flex-1">
                        <label htmlFor="fmt-height" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                          Height (px)
                        </label>
                        <input
                          id="fmt-height"
                          type="number"
                          min={1}
                          max={10000}
                          value={targetH}
                          onChange={(e) => {
                            handleHeightChange(Math.max(1, parseInt(e.target.value) || 1));
                            setResults([]);
                          }}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>
                    </div>
                    {firstImage && (
                      <p className="text-xs text-muted-foreground mt-2">
                        First image: {firstImage.width} x {firstImage.height} px
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="fmt-percentage" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      Scale (%)
                    </label>
                    <input
                      id="fmt-percentage"
                      type="number"
                      min={1}
                      max={1000}
                      value={percentage}
                      onChange={(e) => {
                        setPercentage(Math.max(1, parseInt(e.target.value) || 1));
                        setResults([]);
                      }}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                    {firstImage && (
                      <p className="text-xs text-muted-foreground mt-2">
                        First image: {firstImage.width} x {firstImage.height} px &rarr;{' '}
                        {Math.round(firstImage.width * (percentage / 100))} x{' '}
                        {Math.round(firstImage.height * (percentage / 100))} px
                      </p>
                    )}
                  </div>
                )}

                {/* ── Fit mode ── */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                    Fit Mode
                  </label>
                  <div className="flex gap-3">
                    {([
                      { value: 'contain' as const, label: 'Contain', desc: 'Fits inside target, adds padding if needed' },
                      { value: 'cover' as const, label: 'Cover', desc: 'Fills target completely, crops overflow' },
                      { value: 'stretch' as const, label: 'Stretch', desc: 'Stretches to exact size, may distort' },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFitMode(opt.value);
                          setResults([]);
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm ${
                          fitMode === opt.value
                            ? 'border-foreground bg-muted text-foreground'
                            : 'border-border hover:border-muted-foreground text-muted-foreground'
                        }`}
                        title={opt.desc}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {fitMode === 'contain' && 'Image fits inside the target dimensions with padding (background colour fills empty space).'}
                    {fitMode === 'cover' && 'Image fills the target dimensions completely; edges are cropped to fit.'}
                    {fitMode === 'stretch' && 'Image is stretched to exactly match target dimensions. May distort.'}
                  </p>
                </div>

                {/* ── Background colour ── */}
                {showBgColor && (
                  <div className="animate-fade-in">
                    <label htmlFor="fmt-bg-color" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5">
                        <Palette className="w-4 h-4" />
                        Background Colour
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      {fitMode === 'contain'
                        ? 'Fills the padding area in contain mode.'
                        : 'Replaces transparency for JPEG export.'}
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        id="fmt-bg-color"
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground font-medium">{bgColor}</span>
                    </div>
                  </div>
                )}

                {/* ── Output format ── */}
                <div>
                  <label htmlFor="fmt-output-format" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                    Output Format
                  </label>
                  <select
                    id="fmt-output-format"
                    value={outputFormat}
                    onChange={(e) => {
                      setOutputFormat(e.target.value as OutputFormatOption);
                      setResults([]);
                    }}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="original">Keep Original</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </div>

                {/* ── Quality slider ── */}
                {showQualitySlider && (
                  <div className="animate-fade-in">
                    <label htmlFor="fmt-quality" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      Quality: {Math.round(quality * 100)}%
                    </label>
                    <input
                      id="fmt-quality"
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={Math.round(quality * 100)}
                      onChange={(e) => setQuality(parseInt(e.target.value) / 100)}
                      className="w-full accent-foreground"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>10% (smallest)</span>
                      <span>100% (best quality)</span>
                    </div>
                  </div>
                )}

                {/* ── Target file size ── */}
                <div>
                  <label htmlFor="fmt-target-size" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                    Target File Size (KB)
                    <span className="font-normal text-muted-foreground ml-1">- optional</span>
                  </label>
                  <input
                    id="fmt-target-size"
                    type="number"
                    min={1}
                    placeholder="Leave empty for no target"
                    value={targetSizeKB}
                    onChange={(e) => setTargetSizeKB(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  {outputFormat === 'image/png' && targetSizeKB.trim() !== '' && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      PNG is lossless -- target file size cannot be enforced for PNG output.
                    </p>
                  )}
                </div>

                {/* ── Grayscale toggle ── */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={grayscale}
                    onChange={(e) => {
                      setGrayscale(e.target.checked);
                      setResults([]);
                    }}
                    className="w-5 h-5 rounded border-border accent-foreground cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text)]">
                    Convert to grayscale
                  </span>
                </label>

                {/* ── Metadata removal toggle ── */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={removeMetadata}
                    onChange={(e) => setRemoveMetadata(e.target.checked)}
                    className="w-5 h-5 rounded border-border accent-foreground cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text)]">
                      Remove metadata
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Re-exporting strips EXIF, GPS, and camera data by default
                    </p>
                  </div>
                </label>

                {/* ── Filename prefix / suffix ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fmt-prefix" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      Filename Prefix
                    </label>
                    <input
                      id="fmt-prefix"
                      type="text"
                      placeholder="e.g. formatted"
                      value={filenamePrefix}
                      onChange={(e) => setFilenamePrefix(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="fmt-suffix" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      Filename Suffix
                    </label>
                    <input
                      id="fmt-suffix"
                      type="text"
                      placeholder="e.g. web"
                      value={filenameSuffix}
                      onChange={(e) => setFilenameSuffix(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                </div>

                {/* ── Preview dimensions ── */}
                {images.length > 0 && dimensionMode === 'percentage' && (
                  <div className="bg-muted/40 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Output Preview</span>
                    </div>
                    <div className="space-y-1.5">
                      {images.slice(0, 5).map((img) => {
                        const { w, h } = computeDimensions(img);
                        return (
                          <div key={img.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate max-w-[200px] font-medium">{img.name}</span>
                            <span>{img.width} x {img.height}</span>
                            <span>&rarr;</span>
                            <span className="font-semibold text-foreground">{w} x {h}</span>
                          </div>
                        );
                      })}
                      {images.length > 5 && (
                        <p className="text-xs text-muted-foreground">...and {images.length - 5} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || images.length === 0}
                    className={`btn btn-primary flex-1 py-4 text-base ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing {progressIndex} of {images.length}...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5" />
                        Format {images.length > 1 ? `${images.length} Images` : 'Image'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn btn-outline py-4 text-base sm:flex-none sm:px-6"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Clear All
                  </button>
                </div>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold">
                      Results ({results.length})
                    </h2>
                  </div>

                  {/* Summary stats */}
                  {results.length > 1 && (
                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-100">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-violet-600/70 block text-xs font-medium">Original Total</span>
                          <span className="font-bold text-violet-900">
                            {formatFileSize(results.reduce((s, r) => s + r.originalSize, 0))}
                          </span>
                        </div>
                        <div>
                          <span className="text-violet-600/70 block text-xs font-medium">Output Total</span>
                          <span className="font-bold text-violet-900">
                            {formatFileSize(results.reduce((s, r) => s + r.outputSize, 0))}
                          </span>
                        </div>
                        <div>
                          <span className="text-violet-600/70 block text-xs font-medium">Size Change</span>
                          <span className="font-bold text-violet-900">
                            {savedPercentage(
                              results.reduce((s, r) => s + r.originalSize, 0),
                              results.reduce((s, r) => s + r.outputSize, 0),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Per-file results */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {results.map((result) => {
                      const original = images.find((img) => img.id === result.id);
                      const increased = result.outputSize > result.originalSize;
                      return (
                        <div
                          key={result.id}
                          className="flex items-start gap-4 bg-muted/40 rounded-xl p-3 border border-border"
                        >
                          {/* Thumbnails: before / after */}
                          <div className="flex gap-1.5 shrink-0">
                            {original && (
                              <img
                                src={original.previewUrl}
                                alt={`Before: ${original.name}`}
                                className="w-12 h-12 rounded-lg object-cover border border-border opacity-60"
                              />
                            )}
                            <img
                              src={result.previewUrl}
                              alt={`After: ${result.outputFilename}`}
                              className="w-12 h-12 rounded-lg object-cover border-2 border-emerald-400"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{result.outputFilename}</p>
                            <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                              <p>
                                {result.originalWidth} x {result.originalHeight} &rarr;{' '}
                                <span className="font-semibold text-foreground">
                                  {result.outputWidth} x {result.outputHeight}
                                </span>
                              </p>
                              <p>
                                {formatFileSize(result.originalSize)} &rarr;{' '}
                                <span className="font-semibold text-foreground">
                                  {formatFileSize(result.outputSize)}
                                </span>
                                <span className={`ml-2 font-semibold ${increased ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {savedPercentage(result.originalSize, result.outputSize)}
                                </span>
                              </p>
                              <p>
                                Format: {getFormatLabel(result.outputFormat)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDownloadSingle(result)}
                            className="btn btn-outline text-sm shrink-0 py-2 px-3"
                            aria-label={`Download ${result.outputFilename}`}
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline ml-1">Download</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Download actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {results.length > 1 && (
                      <button
                        onClick={handleDownloadAll}
                        className="btn btn-primary flex-1 py-4 text-base"
                      >
                        <Archive className="w-5 h-5" />
                        Download All as ZIP
                      </button>
                    )}
                    {results.length === 1 && (
                      <button
                        onClick={() => handleDownloadSingle(results[0])}
                        className="btn btn-primary flex-1 py-4 text-base"
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
                      Start Over
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <FAQSection items={faqItems} />
      <RelatedTools />
    </div>
  );
};
