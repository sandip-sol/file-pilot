import { useState, useEffect, useCallback } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import {
  loadImageFile,
  generateResponsiveVariants,
  revokeImageUrls,
  calculateAspectRatio,
} from '../utils/image/processing';
import {
  getSupportedExportFormats,
  getFormatLabel,
  formatFileSize,
  stripBasename,
} from '../utils/image/support';
import { downloadBlobFile, downloadZipFromEntries } from '../utils/pdf/export';
import type { ImageFormat, ImageFileInfo, ResponsiveVariant } from '../utils/image/types';
import {
  Globe,
  Sparkles,
  Download,
  Loader2,
  Trash2,
  Archive,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  Image as ImageIcon,
  Monitor,
  Smartphone,
} from 'lucide-react';

type QualityTarget = 'high' | 'balanced' | 'lightweight';

interface Preset {
  id: string;
  label: string;
  icon: typeof Globe;
  displayWidth: number;
  responsiveWidths: number[];
}

const PRESETS: Preset[] = [
  { id: 'hero', label: 'Hero / Banner', icon: Monitor, displayWidth: 1920, responsiveWidths: [640, 1024, 1280, 1920] },
  { id: 'blog', label: 'Blog Image', icon: ImageIcon, displayWidth: 800, responsiveWidths: [320, 640, 800] },
  { id: 'product-card', label: 'Product Card', icon: Smartphone, displayWidth: 400, responsiveWidths: [320, 400] },
  { id: 'product-gallery', label: 'Product Gallery', icon: ImageIcon, displayWidth: 1200, responsiveWidths: [640, 768, 1200] },
  { id: 'avatar', label: 'Avatar / Profile', icon: Smartphone, displayWidth: 200, responsiveWidths: [100, 200] },
  { id: 'logo', label: 'Logo / Transparent', icon: ImageIcon, displayWidth: 300, responsiveWidths: [150, 300] },
  { id: 'og', label: 'Social Preview / OG', icon: Globe, displayWidth: 1200, responsiveWidths: [600, 1200] },
];

const ALL_RESPONSIVE_WIDTHS = [320, 640, 768, 1024, 1280, 1600, 1920];

const QUALITY_MAP: Record<QualityTarget, number> = {
  high: 0.9,
  balanced: 0.75,
  lightweight: 0.6,
};

const OUTPUT_FORMATS: ImageFormat[] = ['image/jpeg', 'image/webp', 'image/avif'];

export const WebsiteImageOptimiser = () => {
  const [sourceFile, setSourceFile] = useState<ImageFileInfo | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [displayWidth, setDisplayWidth] = useState(1200);
  const [dpr, setDpr] = useState(1);
  const [qualityTarget, setQualityTarget] = useState<QualityTarget>('balanced');
  const [selectedFormats, setSelectedFormats] = useState<ImageFormat[]>(['image/webp']);
  const [selectedWidths, setSelectedWidths] = useState<number[]>([640, 1024, 1280]);
  const [customWidthInput, setCustomWidthInput] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processTotal, setProcessTotal] = useState(0);
  const [results, setResults] = useState<ResponsiveVariant[]>([]);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  useEffect(() => {
    getSupportedExportFormats().then((formats) => {
      setSupportedFormats(formats);
      const defaults: ImageFormat[] = [];
      if (formats['image/webp']) defaults.push('image/webp');
      if (defaults.length === 0 && formats['image/jpeg']) defaults.push('image/jpeg');
      setSelectedFormats(defaults);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (sourceFile) revokeImageUrls([sourceFile]);
    };
  }, [sourceFile]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      if (sourceFile) revokeImageUrls([sourceFile]);
      const info = await loadImageFile(file);
      setSourceFile(info);
      setResults([]);
    } catch {
      toast.error(`Failed to load ${file.name}`);
    }
  }, [sourceFile]);

  const applyPreset = useCallback((preset: Preset) => {
    setSelectedPreset(preset.id);
    setDisplayWidth(preset.displayWidth);
    setSelectedWidths(preset.responsiveWidths);
  }, []);

  const toggleFormat = useCallback((format: ImageFormat) => {
    setSelectedFormats((prev) => {
      if (prev.includes(format)) {
        if (prev.length <= 1) {
          toast.error('At least one output format must be selected');
          return prev;
        }
        return prev.filter((f) => f !== format);
      }
      return [...prev, format];
    });
  }, []);

  const toggleWidth = useCallback((width: number) => {
    setSelectedWidths((prev) => {
      if (prev.includes(width)) return prev.filter((w) => w !== width);
      return [...prev, width].sort((a, b) => a - b);
    });
  }, []);

  const addCustomWidth = useCallback(() => {
    const val = parseInt(customWidthInput, 10);
    if (isNaN(val) || val <= 0 || val > 7680) {
      toast.error('Enter a valid width between 1 and 7680');
      return;
    }
    if (selectedWidths.includes(val)) {
      toast.error('This width is already selected');
      return;
    }
    setSelectedWidths((prev) => [...prev, val].sort((a, b) => a - b));
    setCustomWidthInput('');
  }, [customWidthInput, selectedWidths]);

  const effectiveWidths = selectedWidths.map((w) => w * dpr);

  const sourceTooBig = sourceFile
    ? sourceFile.width > displayWidth * 3
    : false;

  const sourceTooSmall = sourceFile
    ? sourceFile.width < displayWidth * dpr
    : false;

  const estimatedLargeFile = sourceFile
    ? sourceFile.originalSize > 2 * 1024 * 1024
    : false;

  const handleGenerate = useCallback(async () => {
    if (!sourceFile || selectedWidths.length === 0 || selectedFormats.length === 0) return;

    setIsProcessing(true);
    setResults([]);
    setProcessProgress(0);

    const widthsToProcess = effectiveWidths.filter((w) => w <= sourceFile.width);

    if (widthsToProcess.length === 0) {
      toast.error('All selected widths exceed source image dimensions');
      setIsProcessing(false);
      return;
    }

    const totalCombinations = widthsToProcess.length * selectedFormats.length;
    setProcessTotal(totalCombinations);

    const quality = QUALITY_MAP[qualityTarget];
    const qualityMap: Record<string, number> = {};
    for (const fmt of selectedFormats) {
      qualityMap[fmt] = quality;
    }

    try {
      const variants = await generateResponsiveVariants(
        sourceFile,
        widthsToProcess,
        selectedFormats,
        qualityMap,
        '#ffffff',
      );

      setProcessProgress(totalCombinations);
      setResults(variants);
      toast.success(`Generated ${variants.length} variant${variants.length !== 1 ? 's' : ''}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [sourceFile, selectedWidths, selectedFormats, effectiveWidths, qualityTarget]);

  const handleDownloadSingle = useCallback((variant: ResponsiveVariant) => {
    downloadBlobFile(variant.blob, variant.filename);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0) return;
    const baseName = sourceFile ? stripBasename(sourceFile.name) : 'optimised';
    const entries = results.map((v) => ({ filename: v.filename, data: v.blob }));
    await downloadZipFromEntries(entries, `${baseName}-web-optimised.zip`);
  }, [results, sourceFile]);

  const handleReset = useCallback(() => {
    if (sourceFile) revokeImageUrls([sourceFile]);
    setSourceFile(null);
    setResults([]);
    setSelectedPreset(null);
    setDisplayWidth(1200);
    setDpr(1);
    setQualityTarget('balanced');
    setSelectedWidths([640, 1024, 1280]);
    setCustomWidthInput('');
    setProcessProgress(0);
    setProcessTotal(0);
  }, [sourceFile]);

  const handleCopySnippet = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSnippet(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const generatePictureSnippet = (): string => {
    if (results.length === 0 || !sourceFile) return '';

    const baseName = stripBasename(sourceFile.name);
    const formatGroups: Record<string, ResponsiveVariant[]> = {};

    for (const v of results) {
      if (!formatGroups[v.format]) formatGroups[v.format] = [];
      formatGroups[v.format].push(v);
    }

    const mimeOrder: string[] = ['image/avif', 'image/webp', 'image/jpeg'];
    const sortedFormats = Object.keys(formatGroups).sort(
      (a, b) => mimeOrder.indexOf(a) - mimeOrder.indexOf(b),
    );

    let html = '<picture>\n';

    for (const fmt of sortedFormats) {
      const variants = formatGroups[fmt].sort((a, b) => a.width - b.width);
      const srcsetParts = variants.map((v) => `${v.filename} ${v.width}w`);
      html += `  <source\n    type="${fmt}"\n    srcset="${srcsetParts.join(',\n           ')}"\n  />\n`;
    }

    const fallbackFormat = sortedFormats.includes('image/jpeg')
      ? 'image/jpeg'
      : sortedFormats[sortedFormats.length - 1];
    const fallbackVariants = formatGroups[fallbackFormat];
    const largest = fallbackVariants
      ? [...fallbackVariants].sort((a, b) => b.width - a.width)[0]
      : null;

    const fallbackSrc = largest ? largest.filename : `${baseName}.jpg`;
    const fallbackWidth = largest ? largest.width : displayWidth;
    const fallbackHeight = largest ? largest.height : Math.round(displayWidth * (sourceFile.height / sourceFile.width));

    html += `  <img\n    src="${fallbackSrc}"\n    width="${fallbackWidth}"\n    height="${fallbackHeight}"\n    alt=""\n    loading="lazy"\n    decoding="async"\n  />\n`;
    html += '</picture>';

    return html;
  };

  const generateSrcsetSnippet = (): string => {
    if (results.length === 0) return '';

    const preferredFormat = results.find((v) => v.format === 'image/webp')
      ? 'image/webp'
      : results[0].format;

    const variants = results
      .filter((v) => v.format === preferredFormat)
      .sort((a, b) => a.width - b.width);

    return variants.map((v) => `${v.filename} ${v.width}w`).join(', ');
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Website Image Optimiser - Responsive Images for the Web"
        description="Generate optimised, responsive image variants for your website. Create WebP, AVIF, and JPEG versions at multiple sizes with ready-to-use HTML snippets. Free, private, no uploads."
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
          </div>
          <h1>Website Image Optimiser</h1>
          <p>Generate optimised, responsive image variants for your website.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Processed locally in your browser. No uploads.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Upload Card */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            {!sourceFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple
                description="Drop an image here"
              />
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Source Image</h2>
                  <button
                    onClick={handleReset}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-[var(--error)]"
                    title="Remove"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-start gap-4 bg-muted/40 rounded-xl p-4">
                  <img
                    src={sourceFile.previewUrl}
                    alt={sourceFile.name}
                    className="w-20 h-20 rounded-lg object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{sourceFile.name}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Dimensions: {sourceFile.width} x {sourceFile.height}</span>
                      <span>File size: {formatFileSize(sourceFile.originalSize)}</span>
                      <span>Format: {getFormatLabel(sourceFile.mimeType)}</span>
                      <span>Aspect ratio: {calculateAspectRatio(sourceFile.width, sourceFile.height)}</span>
                      <span className="flex items-center gap-1">
                        Transparency: {sourceFile.hasTransparency ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          'None'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preset Cards */}
          {sourceFile && results.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-4">
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Use Case Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const active = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm ${
                        active
                          ? 'border-foreground bg-muted text-foreground'
                          : 'border-border hover:border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold text-center leading-tight">{preset.label}</span>
                      <span className="text-xs opacity-70">{preset.displayWidth}px</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Configuration Panel */}
          {sourceFile && results.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6">

              {/* Display Width */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Display Width (px)
                </label>
                <input
                  type="number"
                  min={1}
                  max={7680}
                  value={displayWidth}
                  onChange={(e) => {
                    setDisplayWidth(parseInt(e.target.value, 10) || 0);
                    setSelectedPreset(null);
                  }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              {/* Device Pixel Ratio */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Device Pixel Ratio
                </label>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setDpr(ratio)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        dpr === ratio
                          ? 'bg-foreground text-background shadow-md'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {ratio}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Target */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Quality Target
                </label>
                <div className="flex gap-2">
                  {([
                    { key: 'high' as QualityTarget, label: 'High', value: 0.9 },
                    { key: 'balanced' as QualityTarget, label: 'Balanced', value: 0.75 },
                    { key: 'lightweight' as QualityTarget, label: 'Lightweight', value: 0.6 },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setQualityTarget(opt.key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        qualityTarget === opt.key
                          ? 'bg-foreground text-background shadow-md'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {opt.label} ({Math.round(opt.value * 100)}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Formats */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Output Formats
                </label>
                <div className="flex flex-wrap gap-3">
                  {OUTPUT_FORMATS.map((fmt) => {
                    const supported = supportedFormats?.[fmt] ?? false;
                    const checked = selectedFormats.includes(fmt);
                    return (
                      <label
                        key={fmt}
                        className={`flex items-center gap-2 cursor-pointer ${
                          !supported ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!supported}
                          onChange={() => toggleFormat(fmt)}
                          className="w-4 h-4 rounded border-border accent-foreground cursor-pointer"
                        />
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                          {getFormatLabel(fmt)}
                          {!supported && ' (unsupported)'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Responsive Widths */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Responsive Widths (px)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ALL_RESPONSIVE_WIDTHS.map((w) => {
                    const checked = selectedWidths.includes(w);
                    return (
                      <label key={w} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWidth(w)}
                          className="w-4 h-4 rounded border-border accent-foreground cursor-pointer"
                        />
                        <span className="text-sm text-[var(--text-secondary)]">{w}</span>
                      </label>
                    );
                  })}
                </div>
                {selectedWidths.filter((w) => !ALL_RESPONSIVE_WIDTHS.includes(w)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedWidths
                      .filter((w) => !ALL_RESPONSIVE_WIDTHS.includes(w))
                      .map((w) => (
                        <span
                          key={w}
                          className="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                        >
                          {w}px
                          <button
                            onClick={() => toggleWidth(w)}
                            className="hover:text-[var(--error)] transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={7680}
                    placeholder="Custom width"
                    value={customWidthInput}
                    onChange={(e) => setCustomWidthInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addCustomWidth();
                    }}
                    className="w-40 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  <button onClick={addCustomWidth} className="btn btn-outline text-sm py-2 px-4">
                    Add
                  </button>
                </div>
              </div>

              {/* Warnings */}
              {sourceTooBig && (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-blue-100 animate-fade-in">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    Source is {sourceFile.width} x {sourceFile.height}, much larger than the display target.
                    The tool will resize automatically.
                  </p>
                </div>
              )}

              {sourceTooSmall && (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-amber-200 animate-fade-in">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    Source image ({sourceFile.width}px) is too small for {dpr}x output at this display width.
                    Output will be limited to source dimensions.
                  </p>
                </div>
              )}

              {estimatedLargeFile && (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-amber-200 animate-fade-in">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    Source file is {formatFileSize(sourceFile.originalSize)}, which is large for web use.
                    The optimised variants should be significantly smaller.
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isProcessing || selectedWidths.length === 0 || selectedFormats.length === 0}
                  className={`btn btn-primary flex-1 py-4 text-base ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating {processProgress} of {processTotal}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Variants
                    </>
                  )}
                </button>
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

          {/* Results */}
          {results.length > 0 && sourceFile && (
            <>
              {/* Results Table Card */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold">Generated Variants</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 pr-4 font-semibold text-[var(--text-secondary)]">Filename</th>
                        <th className="pb-3 pr-4 font-semibold text-[var(--text-secondary)]">Source Dims</th>
                        <th className="pb-3 pr-4 font-semibold text-[var(--text-secondary)]">Output Dims</th>
                        <th className="pb-3 pr-4 font-semibold text-[var(--text-secondary)]">Format</th>
                        <th className="pb-3 pr-4 font-semibold text-[var(--text-secondary)]">Original</th>
                        <th className="pb-3 pr-4 font-semibold text-[var(--text-secondary)]">Output</th>
                        <th className="pb-3 pr-4 font-semibold text-[var(--text-secondary)]">Saved</th>
                        <th className="pb-3 font-semibold text-[var(--text-secondary)]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((variant, idx) => {
                        const savedPercent =
                          sourceFile.originalSize > 0
                            ? (((sourceFile.originalSize - variant.outputSize) / sourceFile.originalSize) * 100).toFixed(1)
                            : '0';
                        const increased = variant.outputSize > sourceFile.originalSize;
                        return (
                          <tr key={idx} className="border-b border-border/50 last:border-0">
                            <td className="py-3 pr-4 font-medium text-[var(--text)] truncate max-w-[200px]">
                              {variant.filename}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {sourceFile.width} x {sourceFile.height}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {variant.width} x {variant.height}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {getFormatLabel(variant.format)}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatFileSize(sourceFile.originalSize)}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatFileSize(variant.outputSize)}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`font-semibold ${increased ? 'text-amber-600' : 'text-emerald-600'}`}
                              >
                                {increased ? '+' : ''}{parseFloat(savedPercent).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => handleDownloadSingle(variant)}
                                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Download All */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleDownloadAll} className="btn btn-primary flex-1 py-4 text-base">
                    <Archive className="w-5 h-5" />
                    Download All as ZIP
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn btn-outline py-4 text-base sm:flex-none sm:px-6"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Start Over
                  </button>
                </div>
              </div>

              {/* HTML Snippets Card */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6">
                <div className="flex items-center gap-2.5">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold">Generated HTML Snippets</h2>
                </div>

                {/* Picture Element */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                      &lt;picture&gt; Element
                    </label>
                    <button
                      onClick={() => handleCopySnippet(generatePictureSnippet(), 'picture')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-muted text-muted-foreground"
                    >
                      {copiedSnippet === 'picture' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto">
                    {generatePictureSnippet()}
                  </pre>
                </div>

                {/* srcset Attribute */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                      srcset Attribute
                    </label>
                    <button
                      onClick={() => handleCopySnippet(generateSrcsetSnippet(), 'srcset')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-muted text-muted-foreground"
                    >
                      {copiedSnippet === 'srcset' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto">
                    {generateSrcsetSnippet()}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
