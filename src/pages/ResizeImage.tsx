import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import {
  loadImageFile,
  resizeImage,
  revokeImageUrls,
  calculateAspectRatio,
  type ResizeMode,
} from '../utils/image/processing';
import type {
  ImageFormat,
  ImageFileInfo,
  ProcessedImageResult,
  ResizePreset,
} from '../utils/image/types';
import {
  getSupportedExportFormats,
  getFormatLabel,
  formatFileSize,
} from '../utils/image/support';
import { downloadBlobFile, downloadZipFromEntries } from '../utils/pdf/export';
import { FAQSection } from '../components/FAQSection';
import {
  Scaling,
  Sparkles,
  Download,
  Loader2,
  Trash2,
  Archive,
  RefreshCw,
  Lock,
  Unlock,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

type DimensionMode = 'pixels' | 'percentage';
type FormatOption = 'original' | ImageFormat;

const PRESETS: ResizePreset[] = [
  { label: 'Instagram Post', width: 1080, height: 1080, category: 'Social' },
  { label: 'Instagram Portrait', width: 1080, height: 1350, category: 'Social' },
  { label: 'Instagram Story', width: 1080, height: 1920, category: 'Social' },
  { label: 'Facebook Post', width: 1200, height: 630, category: 'Social' },
  { label: 'LinkedIn Post', width: 1200, height: 627, category: 'Social' },
  { label: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Video' },
  { label: 'Website Hero', width: 1920, height: 1080, category: 'Web' },
  { label: 'Product Image', width: 1200, height: 1200, category: 'E-commerce' },
  { label: 'Profile Photo', width: 800, height: 800, category: 'General' },
];

export const ResizeImage = () => {
  const [files, setFiles] = useState<ImageFileInfo[]>([]);
  const [resizeMode, setResizeMode] = useState<ResizeMode>('fit');
  const [dimensionMode, setDimensionMode] = useState<DimensionMode>('pixels');
  const [targetW, setTargetW] = useState(1080);
  const [targetH, setTargetH] = useState(1080);
  const [percentage, setPercentage] = useState(100);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [doNotUpscale, setDoNotUpscale] = useState(true);
  const [formatOption, setFormatOption] = useState<FormatOption>('original');
  const [quality, setQuality] = useState(0.85);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [results, setResults] = useState<ProcessedImageResult[]>([]);
  const filesRef = useRef<ImageFileInfo[]>([]);
  const resultsRef = useRef<ProcessedImageResult[]>([]);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
  }, []);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    return () => {
      revokeImageUrls(filesRef.current);
      revokeImageUrls(resultsRef.current);
    };
  }, []);

  const resolveFormat = useCallback(
    (info: ImageFileInfo): ImageFormat => {
      if (formatOption === 'original') {
        const mime = info.mimeType as ImageFormat;
        if (
          mime === 'image/jpeg' ||
          mime === 'image/png' ||
          mime === 'image/webp' ||
          mime === 'image/avif'
        ) {
          return mime;
        }
        return 'image/png';
      }
      return formatOption;
    },
    [formatOption],
  );

  const showQualitySlider =
    formatOption === 'image/jpeg' || formatOption === 'image/webp';

  const showBgColorPicker =
    resizeMode === 'fit' ||
    (formatOption === 'image/jpeg' && files.some((f) => f.hasTransparency));

  const firstFile = files[0] ?? null;

  const handleFilesSelected = async (selected: File[]) => {
    const loaded: ImageFileInfo[] = [];
    for (const f of selected) {
      try {
        const info = await loadImageFile(f);
        loaded.push(info);
      } catch {
        toast.error(`Failed to load ${f.name}`);
      }
    }
    if (loaded.length === 0) return;

    setFiles((prev) => [...prev, ...loaded]);
    setResults([]);

    if (files.length === 0 && loaded.length > 0 && dimensionMode === 'pixels' && aspectLocked) {
      const first = loaded[0];
      setTargetW(first.width);
      setTargetH(first.height);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed) revokeImageUrls([removed]);
      return prev.filter((f) => f.id !== id);
    });
    setResults([]);
  };

  const handleWidthChange = (w: number) => {
    setTargetW(w);
    if (aspectLocked && firstFile && firstFile.width > 0) {
      const ratio = firstFile.height / firstFile.width;
      setTargetH(Math.round(w * ratio));
    }
  };

  const handleHeightChange = (h: number) => {
    setTargetH(h);
    if (aspectLocked && firstFile && firstFile.height > 0) {
      const ratio = firstFile.width / firstFile.height;
      setTargetW(Math.round(h * ratio));
    }
  };

  const applyPreset = (preset: ResizePreset) => {
    setDimensionMode('pixels');
    setTargetW(preset.width);
    setTargetH(preset.height);
    setAspectLocked(false);
    setResults([]);
    toast.success(`Preset applied: ${preset.label}`);
  };

  const computeTargetDimensions = (
    info: ImageFileInfo,
  ): { w: number; h: number } => {
    if (dimensionMode === 'percentage') {
      const scale = percentage / 100;
      return {
        w: Math.max(1, Math.round(info.width * scale)),
        h: Math.max(1, Math.round(info.height * scale)),
      };
    }
    return { w: targetW, h: targetH };
  };

  const handleResize = async () => {
    if (files.length === 0) return;

    if (dimensionMode === 'pixels' && (targetW < 1 || targetH < 1)) {
      toast.error('Width and height must be at least 1 pixel.');
      return;
    }
    if (dimensionMode === 'percentage' && percentage <= 0) {
      toast.error('Percentage must be greater than 0.');
      return;
    }

    setIsProcessing(true);
    setProgressIndex(0);
    revokeImageUrls(results);
    setResults([]);

    const processed: ProcessedImageResult[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgressIndex(i + 1);
      const info = files[i];
      const { w, h } = computeTargetDimensions(info);
      const fmt = resolveFormat(info);

      try {
        const result = await resizeImage(
          info,
          w,
          h,
          resizeMode,
          fmt,
          quality,
          bgColor,
          doNotUpscale,
        );
        processed.push(result);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Failed to resize ${info.name}: ${msg}`);
      }
    }

    setResults(processed);
    setIsProcessing(false);

    if (processed.length > 0) {
      toast.success(
        `Resized ${processed.length} image${processed.length > 1 ? 's' : ''} successfully`,
      );
    }
  };

  const handleDownloadSingle = (result: ProcessedImageResult) => {
    downloadBlobFile(result.blob, result.filename);
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    const entries = results.map((r) => ({
      filename: r.filename,
      data: r.blob,
    }));
    await downloadZipFromEntries(entries, 'resized-images.zip');
    toast.success('ZIP downloaded');
  };

  const handleReset = () => {
    revokeImageUrls(files);
    revokeImageUrls(results);
    setFiles([]);
    setResults([]);
    setTargetW(1080);
    setTargetH(1080);
    setPercentage(100);
    setAspectLocked(true);
    setDoNotUpscale(true);
    setFormatOption('original');
    setQuality(0.85);
    setBgColor('#ffffff');
    setResizeMode('fit');
    setDimensionMode('pixels');
  };

  const faqItems = [
    { question: "Can I maintain the aspect ratio when resizing?", answer: "Yes. The aspect ratio lock is enabled by default. When locked, changing the width automatically adjusts the height proportionally, and vice versa." },
    { question: "What dimensions can I resize to?", answer: "You can resize by exact pixel values up to 10,000 px or by percentage scale. Preset sizes for social media, web, and e-commerce are also available." },
    { question: "Does resizing reduce image quality?", answer: "Downscaling generally preserves quality well. Upscaling may reduce sharpness, which is why the 'Do not upscale' option is enabled by default to prevent enlarging smaller images." },
    { question: "Is my image uploaded to a server?", answer: "No. All resizing is performed locally in your browser. Your images are never uploaded, ensuring complete privacy." },
  ];

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Resize Image Online - Free Browser-Based Tool"
        description="Resize images by pixels or percentage. Fit, fill, or stretch to exact dimensions. Free, private, browser-based."
        faqItems={faqItems}
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Scaling className="w-6 h-6" />
            </div>
          </div>
          <h1>Resize Image</h1>
          <p>Adjust image dimensions by pixels or percentage.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Processed locally in your browser. No uploads.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-4xl mx-auto space-y-6">

          {files.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple
                description="Drop images here to resize"
              />
            </div>
          ) : (
            <>
              {/* File List */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">
                    Images ({files.length})
                  </h2>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.files) {
                          handleFilesSelected(Array.from(target.files));
                        }
                      };
                      input.click();
                    }}
                    className="btn btn-outline text-sm"
                  >
                    Add More
                  </button>
                </div>

                <div className="space-y-3">
                  {files.map((info) => (
                    <div
                      key={info.id}
                      className="flex items-center gap-4 bg-muted/40 rounded-xl p-3 border border-border"
                    >
                      <img
                        src={info.previewUrl}
                        alt={info.name}
                        className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {info.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {info.width} x {info.height} px &middot;{' '}
                          {formatFileSize(info.originalSize)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(info.id)}
                        className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resize Settings */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                <h2 className="text-lg font-bold">Resize Settings</h2>

                {/* Resize Mode */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                    Resize Mode
                  </label>
                  <div className="flex gap-3">
                    {(
                      [
                        { value: 'fit', label: 'Fit' },
                        { value: 'fill', label: 'Fill & Crop' },
                        { value: 'stretch', label: 'Stretch' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setResizeMode(opt.value);
                          setResults([]);
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm ${
                          resizeMode === opt.value
                            ? 'border-foreground bg-muted text-foreground'
                            : 'border-border hover:border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {resizeMode === 'fit' &&
                      'Fits the image inside the target dimensions, maintaining aspect ratio. Adds padding if needed.'}
                    {resizeMode === 'fill' &&
                      'Fills the target dimensions completely, cropping any overflow while maintaining aspect ratio.'}
                    {resizeMode === 'stretch' &&
                      'Stretches the image to exactly match target dimensions. May distort the image.'}
                  </p>
                </div>

                {/* Dimension Mode Toggle */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                    Dimension Input
                  </label>
                  <div className="flex gap-3">
                    {(
                      [
                        { value: 'pixels', label: 'Pixels' },
                        { value: 'percentage', label: 'Percentage' },
                      ] as const
                    ).map((opt) => (
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

                {/* Dimension Inputs */}
                {dimensionMode === 'pixels' ? (
                  <div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          value={targetW}
                          onChange={(e) => {
                            handleWidthChange(
                              Math.max(1, parseInt(e.target.value) || 1),
                            );
                            setResults([]);
                          }}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>

                      <button
                        onClick={() => setAspectLocked(!aspectLocked)}
                        className={`p-3 rounded-xl border-2 transition-all mb-0 ${
                          aspectLocked
                            ? 'border-foreground bg-muted text-foreground'
                            : 'border-border text-muted-foreground hover:border-muted-foreground'
                        }`}
                        title={
                          aspectLocked
                            ? 'Unlock aspect ratio'
                            : 'Lock aspect ratio'
                        }
                      >
                        {aspectLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          value={targetH}
                          onChange={(e) => {
                            handleHeightChange(
                              Math.max(1, parseInt(e.target.value) || 1),
                            );
                            setResults([]);
                          }}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>
                    </div>
                    {firstFile && (
                      <p className="text-xs text-muted-foreground mt-2">
                        First image aspect ratio:{' '}
                        {calculateAspectRatio(firstFile.width, firstFile.height)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      Scale (%)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={percentage}
                      onChange={(e) => {
                        setPercentage(
                          Math.max(1, parseInt(e.target.value) || 1),
                        );
                        setResults([]);
                      }}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                    {firstFile && (
                      <p className="text-xs text-muted-foreground mt-2">
                        First image: {firstFile.width} x {firstFile.height} px
                        &rarr;{' '}
                        {Math.round(firstFile.width * (percentage / 100))} x{' '}
                        {Math.round(firstFile.height * (percentage / 100))} px
                      </p>
                    )}
                  </div>
                )}

                {/* Preset Sizes */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                    Preset Sizes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESETS.map((preset) => {
                      const isActive =
                        dimensionMode === 'pixels' &&
                        targetW === preset.width &&
                        targetH === preset.height;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => applyPreset(preset)}
                          className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                            isActive
                              ? 'border-foreground bg-muted shadow-sm'
                              : 'border-border hover:border-muted-foreground bg-background'
                          }`}
                        >
                          <p className="text-sm font-semibold truncate">
                            {preset.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {preset.width} x {preset.height}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Do Not Upscale */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={doNotUpscale}
                    onChange={(e) => {
                      setDoNotUpscale(e.target.checked);
                      setResults([]);
                    }}
                    className="w-5 h-5 rounded border-border accent-foreground cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text)]">
                    Do not upscale smaller images
                  </span>
                </label>
                {!doNotUpscale && (
                  <div className="bg-amber-50 text-amber-700 px-4 py-2.5 rounded-lg flex items-start gap-2 text-xs border border-amber-200 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    Upscaling may reduce image quality. Images smaller than the
                    target will be enlarged.
                  </div>
                )}

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                    Output Format
                  </label>
                  <select
                    value={formatOption}
                    onChange={(e) => {
                      setFormatOption(e.target.value as FormatOption);
                      setResults([]);
                    }}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="original">Keep Original</option>
                    <option value="image/jpeg">
                      JPEG
                    </option>
                    <option value="image/png">
                      PNG
                    </option>
                    {supportedFormats?.['image/webp'] && (
                      <option value="image/webp">
                        WebP
                      </option>
                    )}
                  </select>
                </div>

                {/* Quality Slider */}
                {showQualitySlider && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      Quality: {Math.round(quality * 100)}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={Math.round(quality * 100)}
                      onChange={(e) =>
                        setQuality(parseInt(e.target.value) / 100)
                      }
                      className="w-full accent-foreground"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>10%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* Background Color */}
                {showBgColorPicker && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      Background Color
                      <span className="font-normal text-muted-foreground ml-1">
                        — {resizeMode === 'fit' ? 'fills padding area in contain mode' : 'replaces transparency for JPEG'}
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground font-medium">
                        {bgColor}
                      </span>
                    </div>
                  </div>
                )}

                {/* Preview of target dimensions */}
                {files.length > 0 && (
                  <div className="bg-muted/40 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        Preview Dimensions
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {files.slice(0, 5).map((info) => {
                        const { w, h } = computeTargetDimensions(info);
                        return (
                          <div
                            key={info.id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <span className="truncate max-w-[200px] font-medium">
                              {info.name}
                            </span>
                            <span>
                              {info.width} x {info.height}
                            </span>
                            <span>&rarr;</span>
                            <span className="font-semibold text-foreground">
                              {w} x {h}
                            </span>
                          </div>
                        );
                      })}
                      {files.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ...and {files.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleResize}
                    disabled={isProcessing || files.length === 0}
                    className={`btn btn-primary flex-1 py-4 text-base ${
                      isProcessing ? 'opacity-75 cursor-wait' : ''
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Resizing {progressIndex} of {files.length}...
                      </>
                    ) : (
                      <>
                        <Scaling className="w-5 h-5" />
                        Resize {files.length > 1 ? `${files.length} Images` : 'Image'}
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
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 mb-5">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold">
                      Results ({results.length})
                    </h2>
                  </div>

                  <div className="space-y-3 mb-5">
                    {results.map((result) => {
                      const original = files.find(
                        (f) => f.id === result.id,
                      );
                      return (
                        <div
                          key={result.id}
                          className="flex items-center gap-4 bg-muted/40 rounded-xl p-3 border border-border"
                        >
                          <img
                            src={result.previewUrl}
                            alt={result.filename}
                            className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">
                              {result.filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {original
                                ? `${original.width} x ${original.height}`
                                : '?'}{' '}
                              &rarr; {result.width} x {result.height}
                              <span className="mx-1.5">&middot;</span>
                              {formatFileSize(result.originalSize)} &rarr;{' '}
                              {formatFileSize(result.outputSize)}
                              <span className="mx-1.5">&middot;</span>
                              {getFormatLabel(result.format)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownloadSingle(result)}
                            className="btn btn-outline text-sm shrink-0"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {results.length > 1 && (
                    <button
                      onClick={handleDownloadAll}
                      className="btn btn-primary w-full py-4 text-base"
                    >
                      <Archive className="w-5 h-5" />
                      Download All as ZIP
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <FAQSection items={faqItems} />
      </div>
    </div>
  );
};
