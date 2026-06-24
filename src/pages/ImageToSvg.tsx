import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { RelatedTools } from '../components/RelatedTools';
import { ToolUsageTracker } from '../components/ToolUsageTracker';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { formatFileSize } from '../utils/image/support';
import { downloadBlobFile } from '../utils/pdf/export';
import type { ImageFileInfo } from '../utils/image/types';
import {
  vectorizeImage,
  fileToImageData,
  checkImageSize,
  defaultVectorizeOptions,
  type VectorizeOptions,
  type VectorizeResult,
} from '../utils/svg/vectorizeImage';
import {
  sanitizeSvg,
  optimizeSvg,
  svgToBlob,
  copySvgToClipboard,
  svgToPngBlob,
} from '../utils/svg/svgExport';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible';
import {
  ImageIcon,
  Download,
  Loader2,
  RefreshCw,
  Info,
  AlertTriangle,
  ChevronDown,
  Copy,
  ZoomIn,
  ZoomOut,
  Settings2,
  FileCode2,
  Sparkles,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ConversionMode = 'monochrome' | 'lineart' | 'color';

interface ModeOption {
  value: ConversionMode;
  label: string;
  description: string;
}

const MODES: ModeOption[] = [
  {
    value: 'monochrome',
    label: 'Black & White',
    description: 'Threshold to B&W, trace outlines',
  },
  {
    value: 'lineart',
    label: 'Line Art / Outline',
    description: 'Edge detection, trace line outlines',
  },
  {
    value: 'color',
    label: 'Multi-Color Vector',
    description: 'Quantize to N colors, trace each layer',
  },
];

const COLOR_COUNT_PRESETS = [2, 4, 8, 16];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const ImageToSvg = () => {
  /* ---------- source image ---------- */
  const [sourceImage, setSourceImage] = useState<ImageFileInfo | null>(null);

  /* ---------- conversion settings ---------- */
  const [mode, setMode] = useState<ConversionMode>('monochrome');
  const [threshold, setThreshold] = useState(defaultVectorizeOptions.threshold);
  const [invert, setInvert] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [smoothing, setSmoothing] = useState(defaultVectorizeOptions.smoothing);
  const [simplifyTolerance, setSimplifyTolerance] = useState(
    defaultVectorizeOptions.simplifyTolerance,
  );
  const [minShapeSize, setMinShapeSize] = useState(
    defaultVectorizeOptions.minShapeSize,
  );
  const [strokeMode, setStrokeMode] = useState(false);
  const [colorCount, setColorCount] = useState(8);
  const [customColorCount, setCustomColorCount] = useState<number | null>(null);

  /* ---------- processing state ---------- */
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /* ---------- result ---------- */
  const [result, setResult] = useState<VectorizeResult | null>(null);
  const [sanitizedSvg, setSanitizedSvg] = useState<string>('');
  const [svgBlobSize, setSvgBlobSize] = useState(0);

  /* ---------- preview ---------- */
  const [zoom, setZoom] = useState(100);
  const [settingsOpen, setSettingsOpen] = useState(true);

  /* ---------- refs ---------- */
  const svgPreviewRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  /* ---------- cleanup ---------- */
  useEffect(() => {
    return () => {
      if (sourceImage) {
        revokeImageUrls([sourceImage]);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- derived ---------- */
  const effectiveColorCount = customColorCount ?? colorCount;
  const showMonochromeControls = mode === 'monochrome' || mode === 'lineart';
  const showColorControls = mode === 'color';

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setError(null);
      setResult(null);
      setSanitizedSvg('');
      setSvgBlobSize(0);

      // Revoke old preview URL
      if (sourceImage) {
        revokeImageUrls([sourceImage]);
      }

      try {
        const info = await loadImageFile(file);
        const sizeCheck = checkImageSize(info.width, info.height);

        if (!sizeCheck.ok) {
          toast.error(sizeCheck.warning);
          revokeImageUrls([info]);
          return;
        }

        if (sizeCheck.warning) {
          toast.warning(sizeCheck.warning);
        }

        setSourceImage(info);
      } catch {
        toast.error(`Failed to load ${file.name}`);
      }
    },
    [sourceImage],
  );

  const buildOptions = useCallback((): VectorizeOptions => {
    return {
      mode: mode === 'color' ? 'color' : mode,
      threshold,
      colorCount: effectiveColorCount,
      smoothing,
      simplifyTolerance,
      minShapeSize,
      invert,
      removeBackground,
      strokeMode,
    };
  }, [
    mode,
    threshold,
    effectiveColorCount,
    smoothing,
    simplifyTolerance,
    minShapeSize,
    invert,
    removeBackground,
    strokeMode,
  ]);

  const handleConvert = useCallback(async () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);
    setSanitizedSvg('');
    setSvgBlobSize(0);
    abortRef.current = false;

    try {
      const imageData = await fileToImageData(sourceImage.file);
      const options = buildOptions();

      const vectorResult = await vectorizeImage(
        imageData,
        options,
        (pct) => {
          if (!abortRef.current) setProgress(pct);
        },
      );

      if (abortRef.current) return;

      // Sanitize and optimize
      const safe = sanitizeSvg(vectorResult.svgString);
      const optimized = optimizeSvg(safe);

      const blob = svgToBlob(optimized);

      setResult(vectorResult);
      setSanitizedSvg(optimized);
      setSvgBlobSize(blob.size);
      setProgress(100);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Vectorization failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [sourceImage, buildOptions]);

  const handleDownloadSvg = useCallback(() => {
    if (!sanitizedSvg || !sourceImage) return;
    const blob = svgToBlob(sanitizedSvg);
    const baseName = sourceImage.name.replace(/\.[^.]+$/, '');
    downloadBlobFile(blob, `${baseName}-vector.svg`);
    toast.success('SVG downloaded');
  }, [sanitizedSvg, sourceImage]);

  const handleCopySvg = useCallback(async () => {
    if (!sanitizedSvg) return;
    const ok = await copySvgToClipboard(sanitizedSvg);
    if (ok) {
      toast.success('SVG code copied to clipboard');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  }, [sanitizedSvg]);

  const handleDownloadPng = useCallback(async () => {
    if (!sanitizedSvg || !result || !sourceImage) return;
    try {
      const pngBlob = await svgToPngBlob(
        sanitizedSvg,
        result.width,
        result.height,
      );
      const baseName = sourceImage.name.replace(/\.[^.]+$/, '');
      downloadBlobFile(pngBlob, `${baseName}-vector-preview.png`);
      toast.success('PNG preview downloaded');
    } catch {
      toast.error('Failed to export PNG');
    }
  }, [sanitizedSvg, result, sourceImage]);

  const handleReset = useCallback(() => {
    abortRef.current = true;
    if (sourceImage) {
      revokeImageUrls([sourceImage]);
    }
    setSourceImage(null);
    setResult(null);
    setSanitizedSvg('');
    setSvgBlobSize(0);
    setError(null);
    setProgress(0);
    setIsProcessing(false);
    setZoom(100);
    setThreshold(defaultVectorizeOptions.threshold);
    setInvert(false);
    setRemoveBackground(false);
    setSmoothing(defaultVectorizeOptions.smoothing);
    setSimplifyTolerance(defaultVectorizeOptions.simplifyTolerance);
    setMinShapeSize(defaultVectorizeOptions.minShapeSize);
    setStrokeMode(false);
    setColorCount(8);
    setCustomColorCount(null);
    setMode('monochrome');
  }, [sourceImage]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const svgLargerThanOriginal =
    sourceImage && svgBlobSize > sourceImage.originalSize;
  const highPathCount = result && result.pathCount > 1000;

  return (
    <div>
      <PageSeo
        title="Image to SVG Converter — FilePilot"
        description="Convert raster images into editable SVG vector graphics. Supports monochrome, line art, and multi-color vectorization. Free, private, browser-based."
      />
      <ToolUsageTracker />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
              <FileCode2 className="w-6 h-6" />
            </div>
          </div>
          <h1>Image to SVG Converter</h1>
          <p>Convert images into editable SVG vector graphics</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Best for logos, icons, signatures, line art and simple illustrations.
            Detailed photographs may produce large or inaccurate SVG files.
          </p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Your files are processed locally in your browser and are not
            uploaded.
          </p>
        </div>
      </div>

      <div className="container py-8 max-w-5xl mx-auto">
        <div className="space-y-6">
          {/* Upload */}
          {!sourceImage ? (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                description="Drop an image here to convert to SVG"
                hint="Supports JPG, PNG, WebP, BMP, and GIF."
              />
            </div>
          ) : (
            <>
              {/* Source info */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Source Image</h2>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn btn-outline text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Change Image
                  </button>
                </div>
                <div className="flex items-center gap-4 bg-muted/40 rounded-xl p-3 border border-border">
                  <img
                    src={sourceImage.previewUrl}
                    alt={sourceImage.name}
                    className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {sourceImage.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sourceImage.width} &times; {sourceImage.height} px
                      &middot; {formatFileSize(sourceImage.originalSize)}
                      {sourceImage.hasTransparency && (
                        <span className="ml-2 text-emerald-600">
                          Has transparency
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode selector */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold">Conversion Mode</h2>
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    This is a vector trace, not a perfect conversion. Results
                    vary by image complexity.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setMode(opt.value);
                        setResult(null);
                        setSanitizedSvg('');
                      }}
                      className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm text-left ${
                        mode === opt.value
                          ? 'border-foreground bg-muted text-foreground'
                          : 'border-border hover:border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      <span className="block">{opt.label}</span>
                      <span className="block text-xs font-normal mt-0.5 opacity-80">
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <Collapsible
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between p-6 md:px-8 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-muted-foreground" />
                      <h2 className="text-lg font-bold">Settings</h2>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        settingsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-6 pb-6 md:px-8 md:pb-8 space-y-5">
                      {/* Monochrome / Line Art controls */}
                      {showMonochromeControls && (
                        <div className="space-y-4">
                          {/* Threshold */}
                          <div>
                            <label className="block text-sm font-medium mb-2 text-muted-foreground">
                              Threshold: {threshold}
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={255}
                              step={1}
                              value={threshold}
                              onChange={(e) =>
                                setThreshold(parseInt(e.target.value))
                              }
                              className="w-full accent-foreground"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>0 (more detail)</span>
                              <span>255 (less detail)</span>
                            </div>
                          </div>

                          {/* Invert */}
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={invert}
                              onChange={(e) => setInvert(e.target.checked)}
                              className="w-4 h-4 rounded border-border accent-foreground"
                            />
                            <span className="text-sm font-medium">
                              Invert colors
                            </span>
                          </label>

                          {/* Stroke vs Fill */}
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={strokeMode}
                              onChange={(e) => setStrokeMode(e.target.checked)}
                              className="w-4 h-4 rounded border-border accent-foreground"
                            />
                            <span className="text-sm font-medium">
                              Output as strokes (outlines) instead of fills
                            </span>
                          </label>
                        </div>
                      )}

                      {/* Multi-Color controls */}
                      {showColorControls && (
                        <div className="space-y-4">
                          {/* Color count */}
                          <div>
                            <label className="block text-sm font-medium mb-2 text-muted-foreground">
                              Color Count
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {COLOR_COUNT_PRESETS.map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => {
                                    setColorCount(n);
                                    setCustomColorCount(null);
                                  }}
                                  className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                                    customColorCount === null && colorCount === n
                                      ? 'border-foreground bg-muted text-foreground'
                                      : 'border-border hover:border-muted-foreground text-muted-foreground'
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  Custom:
                                </span>
                                <input
                                  type="number"
                                  min={2}
                                  max={32}
                                  value={customColorCount ?? ''}
                                  placeholder="2-32"
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (
                                      !isNaN(val) &&
                                      val >= 2 &&
                                      val <= 32
                                    ) {
                                      setCustomColorCount(val);
                                    } else if (e.target.value === '') {
                                      setCustomColorCount(null);
                                    }
                                  }}
                                  className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Palette preview */}
                          {result && result.colors.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                Detected Palette
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {result.colors.map((color, idx) => (
                                  <div
                                    key={idx}
                                    className="w-8 h-8 rounded-md border border-border shadow-sm"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Common controls */}
                      <div className="space-y-4 border-t border-border pt-4">
                        {/* Remove background */}
                        {(mode === 'color' || mode === 'monochrome') && (
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={removeBackground}
                              onChange={(e) =>
                                setRemoveBackground(e.target.checked)
                              }
                              className="w-4 h-4 rounded border-border accent-foreground"
                            />
                            <span className="text-sm font-medium">
                              Remove background
                            </span>
                          </label>
                        )}

                        {/* Smoothing */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-muted-foreground">
                            Path Smoothing: {smoothing}
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            step={1}
                            value={smoothing}
                            onChange={(e) =>
                              setSmoothing(parseInt(e.target.value))
                            }
                            className="w-full accent-foreground"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0 (sharp corners)</span>
                            <span>10 (very smooth)</span>
                          </div>
                        </div>

                        {/* Simplify */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-muted-foreground">
                            Path Simplification: {simplifyTolerance}
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={20}
                            step={0.5}
                            value={simplifyTolerance}
                            onChange={(e) =>
                              setSimplifyTolerance(parseFloat(e.target.value))
                            }
                            className="w-full accent-foreground"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0 (no simplification)</span>
                            <span>20 (maximum)</span>
                          </div>
                        </div>

                        {/* Min shape size */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-muted-foreground">
                            Min Shape Size (speckle removal):{' '}
                            {minShapeSize}
                          </label>
                          <input
                            type="range"
                            min={1}
                            max={100}
                            step={1}
                            value={minShapeSize}
                            onChange={(e) =>
                              setMinShapeSize(parseInt(e.target.value))
                            }
                            className="w-full accent-foreground"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>1 (keep tiny shapes)</span>
                            <span>100 (remove small shapes)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Convert + Reset buttons */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className={`btn btn-primary flex-1 py-4 text-base ${
                      isProcessing ? 'opacity-75 cursor-wait' : ''
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Converting... {progress}%
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5" />
                        Convert to SVG
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn btn-outline py-4 text-base sm:flex-none sm:px-6"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reset
                  </button>
                </div>

                {/* Progress bar */}
                {isProcessing && (
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-foreground h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 text-center">
                      Processing image...
                    </p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              {/* Result */}
              {result && sanitizedSvg && (
                <>
                  {/* Preview area */}
                  <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold">Preview</h2>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) => Math.max(25, z - 25))
                          }
                          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                          aria-label="Zoom out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-muted-foreground min-w-[3.5rem] text-center">
                          {zoom}%
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) => Math.min(400, z + 25))
                          }
                          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                          aria-label="Zoom in"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Before / After panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Original */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Original
                        </p>
                        <div className="border border-border rounded-xl overflow-hidden bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)_0_0/20px_20px] flex items-center justify-center p-2 min-h-[200px]">
                          <img
                            src={sourceImage.previewUrl}
                            alt="Original"
                            style={{
                              maxWidth: `${zoom}%`,
                              maxHeight: '400px',
                            }}
                            className="object-contain"
                          />
                        </div>
                      </div>

                      {/* SVG result */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          SVG Vector
                        </p>
                        <div
                          ref={svgPreviewRef}
                          className="border border-border rounded-xl overflow-hidden bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)_0_0/20px_20px] flex items-center justify-center p-2 min-h-[200px]"
                        >
                          <div
                            style={{
                              maxWidth: `${zoom}%`,
                              maxHeight: '400px',
                            }}
                            className="overflow-hidden"
                            dangerouslySetInnerHTML={{
                              __html: sanitizedSvg,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Output info */}
                  <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-4 animate-fade-in">
                    <h2 className="text-lg font-bold">Output Info</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-muted/40 rounded-xl p-3 border border-border">
                        <p className="text-xs text-muted-foreground">Paths</p>
                        <p className="text-lg font-bold">
                          {result.pathCount}
                        </p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-3 border border-border">
                        <p className="text-xs text-muted-foreground">Colors</p>
                        <p className="text-lg font-bold">
                          {result.colors.length}
                        </p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-3 border border-border">
                        <p className="text-xs text-muted-foreground">
                          SVG Size
                        </p>
                        <p className="text-lg font-bold">
                          {formatFileSize(svgBlobSize)}
                        </p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-3 border border-border">
                        <p className="text-xs text-muted-foreground">
                          Dimensions
                        </p>
                        <p className="text-lg font-bold">
                          {result.width}&times;{result.height}
                        </p>
                      </div>
                    </div>

                    {/* Warnings */}
                    {svgLargerThanOriginal && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          The SVG file ({formatFileSize(svgBlobSize)}) is larger
                          than the original image (
                          {formatFileSize(sourceImage.originalSize)}). This is
                          common with photographs or complex images. Consider
                          reducing colors or increasing simplification.
                        </p>
                      </div>
                    )}
                    {highPathCount && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          High path count ({result.pathCount.toLocaleString()}{' '}
                          paths). This may cause slow rendering in some
                          applications. Try increasing simplification or reducing
                          colors.
                        </p>
                      </div>
                    )}

                    {/* Color palette */}
                    {result.colors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Color Palette
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.colors.map((color, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-2 py-1 border border-border"
                            >
                              <div
                                className="w-5 h-5 rounded border border-border"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs font-mono text-muted-foreground">
                                {color}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Export buttons */}
                  <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in">
                    <h2 className="text-lg font-bold mb-4">Export</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={handleDownloadSvg}
                        className="btn btn-primary py-3 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download SVG
                      </button>
                      <button
                        type="button"
                        onClick={handleCopySvg}
                        className="btn btn-outline py-3 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy SVG Code
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPng}
                        className="btn btn-outline py-3 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download PNG Preview
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Privacy note */}
              <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <p>
                  All processing happens locally in your browser. Your images
                  are never uploaded to any server. Close this tab and
                  everything is gone.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <RelatedTools />
    </div>
  );
};
