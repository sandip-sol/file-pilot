import { useState, useEffect, useCallback } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import {
  loadImageFile,
  compressImage,
  revokeImageUrls,
} from '../utils/image/processing';
import {
  getSupportedExportFormats,
  formatFileSize,
} from '../utils/image/support';
import { downloadBlobFile, downloadZipFromEntries } from '../utils/pdf/export';
import type { ImageFormat, ImageFileInfo, ProcessedImageResult } from '../utils/image/types';
import {
  ImageMinus,
  Sparkles,
  Download,
  Loader2,
  Trash2,
  Archive,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

type CompressionPreset = 'high' | 'balanced' | 'small' | 'custom';
type OutputFormatOption = 'keep' | 'image/jpeg' | 'image/png' | 'image/webp';

const PRESETS: { key: CompressionPreset; label: string; quality: number }[] = [
  { key: 'high', label: 'High Quality', quality: 0.92 },
  { key: 'balanced', label: 'Balanced', quality: 0.75 },
  { key: 'small', label: 'Small File', quality: 0.5 },
  { key: 'custom', label: 'Custom', quality: 0.75 },
];

function resolveOutputFormat(option: OutputFormatOption, sourceType: string): ImageFormat {
  if (option !== 'keep') return option;
  const supported: ImageFormat[] = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (supported.includes(sourceType as ImageFormat)) return sourceType as ImageFormat;
  return 'image/jpeg';
}

export const CompressImage = () => {
  const [files, setFiles] = useState<ImageFileInfo[]>([]);
  const [preset, setPreset] = useState<CompressionPreset>('balanced');
  const [customQuality, setCustomQuality] = useState(0.75);
  const [targetSizeKB, setTargetSizeKB] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<OutputFormatOption>('keep');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [results, setResults] = useState<ProcessedImageResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
  }, []);

  useEffect(() => {
    return () => {
      revokeImageUrls(files);
      revokeImageUrls(results);
    };
  }, [files, results]);

  const quality = preset === 'custom' ? customQuality : PRESETS.find((p) => p.key === preset)!.quality;

  const showTransparencyWarning =
    outputFormat === 'image/jpeg' && files.some((f) => f.hasTransparency);

  const handleFilesSelected = useCallback(
    async (selected: File[]) => {
      setError(null);
      const newInfos: ImageFileInfo[] = [];
      for (const file of selected) {
        try {
          const info = await loadImageFile(file);
          newInfos.push(info);
        } catch {
          toast.error(`Failed to load ${file.name}`);
        }
      }
      if (newInfos.length > 0) {
        setFiles((prev) => [...prev, ...newInfos]);
        revokeImageUrls(results);
        setResults([]);
      }
    },
    [results],
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const removed = prev.find((f) => f.id === id);
        if (removed) revokeImageUrls([removed]);
        return prev.filter((f) => f.id !== id);
      });
      revokeImageUrls(results);
      setResults([]);
    },
    [results],
  );

  const handleCompress = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);
    setError(null);
    revokeImageUrls(results);
    setResults([]);

    const compressed: ProcessedImageResult[] = [];
    const target = targetSizeKB.trim() === '' ? null : parseFloat(targetSizeKB);

    if (target !== null && (isNaN(target) || target <= 0)) {
      setError('Target file size must be a positive number.');
      setIsProcessing(false);
      return;
    }

    try {
      for (let i = 0; i < files.length; i++) {
        setProcessedCount(i + 1);
        const info = files[i];
        const fmt = resolveOutputFormat(outputFormat, info.mimeType);
        const result = await compressImage(info, fmt, quality, target, bgColor);
        compressed.push(result);
      }
      setResults(compressed);
      toast.success(`Compressed ${compressed.length} image${compressed.length > 1 ? 's' : ''}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      toast.error('Compression failed');
      revokeImageUrls(compressed);
    } finally {
      setIsProcessing(false);
    }
  }, [files, outputFormat, quality, targetSizeKB, bgColor, results]);

  const handleDownloadSingle = useCallback((result: ProcessedImageResult) => {
    downloadBlobFile(result.blob, result.filename);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0) return;
    const entries = results.map((r) => ({
      filename: r.filename,
      data: r.blob,
    }));
    await downloadZipFromEntries(entries, 'compressed-images.zip');
  }, [results]);

  const handleReset = useCallback(() => {
    revokeImageUrls(files);
    revokeImageUrls(results);
    setFiles([]);
    setResults([]);
    setError(null);
    setProcessedCount(0);
  }, [files, results]);

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.outputSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const totalPercent = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Compress Image Online - Reduce Image File Size"
        description="Compress JPEG, PNG, and WebP images in your browser. Reduce file size while preserving quality. Free, private, no uploads."
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
              <ImageMinus className="w-6 h-6" />
            </div>
          </div>
          <h1>Compress Image</h1>
          <p>Reduce image file size while preserving quality.</p>
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
            {files.length === 0 ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple
                description="Drop images here"
              />
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    {files.length} image{files.length !== 1 ? 's' : ''} selected
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
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((info) => (
                    <div
                      key={info.id}
                      className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2"
                    >
                      <img
                        src={info.previewUrl}
                        alt={info.name}
                        className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text)] truncate">{info.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(info.originalSize)} &middot; {info.width} x {info.height}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(info.id)}
                        className="p-1.5 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-[var(--error)] shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Card */}
          {files.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6">

              {/* Compression Preset */}
              <div>
                <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                  Compression Level
                </label>
                <div className="flex flex-wrap gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPreset(p.key)}
                      className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm ${
                        preset === p.key
                          ? 'border-foreground bg-muted text-foreground'
                          : 'border-border hover:border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Quality Slider */}
              {preset === 'custom' && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                    Quality: {Math.round(customQuality * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={customQuality}
                    onChange={(e) => setCustomQuality(parseFloat(e.target.value))}
                    className="w-full accent-foreground"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>10% (smallest)</span>
                    <span>100% (best quality)</span>
                  </div>
                </div>
              )}

              {/* Target File Size */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Target File Size (KB)
                  <span className="font-normal text-muted-foreground ml-1">- optional</span>
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Leave empty for no target"
                  value={targetSizeKB}
                  onChange={(e) => setTargetSizeKB(e.target.value)}
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
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormatOption)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  <option value="keep">Keep Original</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  {supportedFormats?.['image/webp'] && <option value="image/webp">WebP</option>}
                </select>
              </div>

              {/* Transparency Warning */}
              {showTransparencyWarning && (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-amber-200 animate-fade-in">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      Some images have transparency, which JPEG does not support.
                    </p>
                    <p className="mt-1 text-xs">
                      Transparent areas will be filled with the background color below.
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <span className="text-sm font-medium">{bgColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Strip Metadata Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={stripMetadata}
                  onChange={(e) => setStripMetadata(e.target.checked)}
                  className="w-5 h-5 rounded border-border accent-foreground cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text)]">
                    Strip metadata (EXIF, GPS, etc.)
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Canvas-based export strips EXIF data by default for privacy and smaller file size.
                  </p>
                </div>
              </label>

              {/* PNG Info Note */}
              {(outputFormat === 'image/png' ||
                (outputFormat === 'keep' && files.every((f) => f.mimeType === 'image/png'))) && (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-blue-100 animate-fade-in">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    PNG uses lossless compression -- quality slider settings do not affect PNG file size.
                    For smaller files, try <strong>WebP</strong> or <strong>JPEG</strong>.
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCompress}
                  disabled={isProcessing || files.length === 0}
                  className={`btn btn-primary flex-1 py-4 text-base ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Compressing {processedCount} of {files.length}...
                    </>
                  ) : (
                    <>
                      <ImageMinus className="w-5 h-5" />
                      Compress {files.length > 1 ? `${files.length} Images` : 'Image'}
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
          )}

          {/* Results Card */}
          {results.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold">Compression Results</h2>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-emerald-600/70 block text-xs font-medium">Original Total</span>
                    <span className="font-bold text-emerald-900">{formatFileSize(totalOriginal)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-600/70 block text-xs font-medium">Compressed Total</span>
                    <span className="font-bold text-emerald-900">{formatFileSize(totalCompressed)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-600/70 block text-xs font-medium">Space Saved</span>
                    <span className="font-bold text-emerald-900">{formatFileSize(Math.max(0, totalSaved))}</span>
                  </div>
                  <div>
                    <span className="text-emerald-600/70 block text-xs font-medium">Reduction</span>
                    <span className="font-bold text-emerald-900">{totalPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Per-file Results */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.map((result) => {
                  const reduction =
                    result.originalSize > 0
                      ? (((result.originalSize - result.outputSize) / result.originalSize) * 100).toFixed(1)
                      : '0';
                  const increased = result.outputSize > result.originalSize;
                  return (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5"
                    >
                      <img
                        src={result.previewUrl}
                        alt={result.filename}
                        className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text)] truncate">{result.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(result.originalSize)} &rarr; {formatFileSize(result.outputSize)}
                          <span
                            className={`ml-2 font-semibold ${increased ? 'text-amber-600' : 'text-emerald-600'}`}
                          >
                            {increased ? '+' : '-'}
                            {Math.abs(parseFloat(reduction))}%
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadSingle(result)}
                        className="p-2 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-foreground shrink-0"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Download Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {results.length > 1 && (
                  <button onClick={handleDownloadAll} className="btn btn-primary flex-1 py-4 text-base">
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
        </div>
      </div>
    </div>
  );
};
