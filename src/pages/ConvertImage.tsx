import { useState, useEffect, useCallback } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import { downloadBlobFile, downloadZipFromEntries } from '../utils/pdf/export';
import { loadImageFile, convertImage, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, getFormatLabel, formatFileSize } from '../utils/image/support';
import type { ImageFormat, ImageFileInfo, ProcessedImageResult } from '../utils/image/types';
import {
  Replace,
  Sparkles,
  Download,
  Loader2,
  Trash2,
  Archive,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  ImageIcon,
  Layers,
  Globe,
  Zap,
} from 'lucide-react';

interface FormatCard {
  format: ImageFormat;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FORMAT_CARDS: FormatCard[] = [
  { format: 'image/jpeg', label: 'JPEG', description: 'Best for photos and compatibility', icon: ImageIcon },
  { format: 'image/png', label: 'PNG', description: 'Transparency and crisp graphics', icon: Layers },
  { format: 'image/webp', label: 'WebP', description: 'Smaller files for web performance', icon: Globe },
  { format: 'image/avif', label: 'AVIF', description: 'Advanced compression (if supported)', icon: Zap },
];

const FORMAT_NOTES: Record<ImageFormat, string> = {
  'image/jpeg': 'JPEG does not support transparency — transparent areas will be filled with a background color.',
  'image/png': 'PNG preserves transparency and is lossless. File sizes may be larger.',
  'image/webp': 'WebP offers good compression with transparency support.',
  'image/avif': 'AVIF provides the strongest compression but browser support varies.',
};

export const ConvertImage = () => {
  const [files, setFiles] = useState<ImageFileInfo[]>([]);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('image/png');
  const [quality, setQuality] = useState(0.85);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [keepOriginalDims, setKeepOriginalDims] = useState(true);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [formatSupport, setFormatSupport] = useState<Record<ImageFormat, boolean> | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ProcessedImageResult[]>([]);

  useEffect(() => {
    getSupportedExportFormats().then(setFormatSupport);
  }, []);

  const cleanup = useCallback(() => {
    revokeImageUrls(files);
    revokeImageUrls(results);
  }, [files, results]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const hasTransparency = files.some((f) => f.hasTransparency);
  const showBgPicker = outputFormat === 'image/jpeg' && hasTransparency;
  const showQualitySlider = outputFormat !== 'image/png';

  const handleFilesSelected = async (selected: File[]) => {
    const loaded: ImageFileInfo[] = [];
    for (const file of selected) {
      try {
        const info = await loadImageFile(file);
        loaded.push(info);
      } catch {
        toast.error(`Failed to load ${file.name}`);
      }
    }
    if (loaded.length > 0) {
      setFiles((prev) => [...prev, ...loaded]);
      setResults([]);
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

  const handleConvert = async () => {
    if (files.length === 0) return;

    if (!keepOriginalDims) {
      const w = parseInt(customWidth, 10);
      const h = parseInt(customHeight, 10);
      if (!w || !h || w <= 0 || h <= 0) {
        toast.error('Please enter valid width and height values.');
        return;
      }
    }

    setIsProcessing(true);
    setProcessProgress({ current: 0, total: files.length });
    revokeImageUrls(results);
    setResults([]);

    const converted: ProcessedImageResult[] = [];

    for (let i = 0; i < files.length; i++) {
      setProcessProgress({ current: i + 1, total: files.length });
      try {
        const resizeTo = keepOriginalDims
          ? undefined
          : { width: parseInt(customWidth, 10), height: parseInt(customHeight, 10) };
        const result = await convertImage(files[i], outputFormat, quality, bgColor, resizeTo);
        converted.push(result);
      } catch {
        toast.error(`Failed to convert ${files[i].name}`);
      }
    }

    setResults(converted);
    setIsProcessing(false);

    if (converted.length > 0) {
      toast.success(`Converted ${converted.length} image${converted.length > 1 ? 's' : ''} successfully.`);
    }
  };

  const downloadSingle = (result: ProcessedImageResult) => {
    downloadBlobFile(result.blob, result.filename);
  };

  const downloadAll = async () => {
    const entries = results.map((r) => ({ filename: r.filename, data: r.blob }));
    await downloadZipFromEntries(entries, `converted-images.zip`);
  };

  const handleReset = () => {
    cleanup();
    setFiles([]);
    setResults([]);
    setOutputFormat('image/png');
    setQuality(0.85);
    setBgColor('#ffffff');
    setKeepOriginalDims(true);
    setCustomWidth('');
    setCustomHeight('');
    setStripMetadata(true);
    setProcessProgress({ current: 0, total: 0 });
  };

  const getReductionPercent = (original: number, output: number): string => {
    const pct = ((original - output) / original) * 100;
    if (pct > 0) return `-${pct.toFixed(1)}%`;
    if (pct < 0) return `+${Math.abs(pct).toFixed(1)}%`;
    return '0%';
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Convert Image — JPEG, PNG, WebP, AVIF | FilePilot"
        description="Convert images between JPEG, PNG, WebP, and AVIF formats. Processed locally in your browser — no uploads, 100% private."
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
              <Replace className="w-6 h-6" />
            </div>
          </div>
          <h1>Convert Image</h1>
          <p>Convert images between JPEG, PNG, WebP, and AVIF formats.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />Processed locally in your browser. No uploads.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Upload */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <FileUploader
              onFilesSelected={handleFilesSelected}
              accept="image/*"
              multiple
              description="Drop images here to convert"
              hint="Supports JPEG, PNG, WebP, AVIF, GIF, BMP, and more."
            />
          </div>

          {/* Uploaded file cards */}
          {files.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Uploaded Images ({files.length})
              </h2>

              <div className="space-y-3">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-4 bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-100"
                  >
                    <img
                      src={f.previewUrl}
                      alt={f.name}
                      className="w-12 h-12 rounded-lg object-cover border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text)] truncate">{f.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-700 px-2 py-0.5 text-xs font-medium">
                          {getFormatLabel(f.mimeType)}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {f.width} x {f.height}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatFileSize(f.originalSize)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(f.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {files.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-semibold text-[var(--text)]">Conversion Settings</h2>

              {/* Format recommendation cards */}
              {formatSupport && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                    Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {FORMAT_CARDS.map((card) => {
                      const supported = formatSupport[card.format];
                      const selected = outputFormat === card.format;
                      const Icon = card.icon;
                      return (
                        <button
                          key={card.format}
                          disabled={!supported}
                          onClick={() => setOutputFormat(card.format)}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                            !supported
                              ? 'opacity-50 cursor-not-allowed border-border bg-muted'
                              : selected
                                ? 'border-violet-500 bg-violet-50 shadow-sm'
                                : 'border-border bg-background hover:border-violet-300 hover:bg-violet-50/50 cursor-pointer'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${selected ? 'text-violet-600' : 'text-[var(--text-muted)]'}`} />
                          <span className={`text-sm font-semibold ${selected ? 'text-violet-700' : 'text-[var(--text)]'}`}>
                            {card.label}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] leading-tight">
                            {!supported ? 'Not supported in this browser' : card.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* JPEG background color picker */}
              {showBgPicker && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                    Background Color (replaces transparency)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                  <div className="mt-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-lg flex items-start gap-2 text-xs border border-amber-200">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Some uploaded images have transparency. JPEG does not support transparency, so transparent
                      areas will be filled with this color.
                    </span>
                  </div>
                </div>
              )}

              {/* Quality slider */}
              {showQualitySlider && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                    Quality: {Math.round(quality * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                    <span>10% (smallest)</span>
                    <span>100% (best quality)</span>
                  </div>
                </div>
              )}

              {/* Keep original dimensions toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Keep original dimensions
                  </label>
                  <button
                    onClick={() => setKeepOriginalDims(!keepOriginalDims)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      keepOriginalDims ? 'bg-violet-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        keepOriginalDims ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {!keepOriginalDims && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[var(--text-muted)]">Width (px)</label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        placeholder="e.g. 1920"
                        min="1"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[var(--text-muted)]">Height (px)</label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(e.target.value)}
                        placeholder="e.g. 1080"
                        min="1"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata removal toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Remove metadata
                  </label>
                  <button
                    onClick={() => setStripMetadata(!stripMetadata)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      stripMetadata ? 'bg-violet-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        stripMetadata ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Canvas export strips EXIF and other metadata by default. This is always on for browser-based conversion.
                </p>
              </div>

              {/* Format behavior explanation */}
              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-blue-100">
                <Info className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{FORMAT_NOTES[outputFormat]}</span>
              </div>

              {/* Convert button */}
              <button
                onClick={handleConvert}
                disabled={isProcessing || files.length === 0}
                className="btn btn-primary w-full"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Converting {processProgress.current} of {processProgress.total}...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Replace className="w-4 h-4" />
                    Convert {files.length} Image{files.length > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  Conversion Complete ({results.length} file{results.length > 1 ? 's' : ''})
                </h2>
              </div>

              <div className="space-y-3">
                {results.map((result) => {
                  const sourceFile = files.find((f) => f.id === result.id);
                  const sourceLabel = sourceFile ? getFormatLabel(sourceFile.mimeType) : '?';
                  const outputLabel = getFormatLabel(result.format);
                  const reduction = getReductionPercent(result.originalSize, result.outputSize);

                  return (
                    <div
                      key={result.id}
                      className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={result.previewUrl}
                          alt={result.filename}
                          className="w-12 h-12 rounded-lg object-cover border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--text)] truncate">{result.filename}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-1">
                              <span className="rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 font-medium">
                                {sourceLabel}
                              </span>
                              <span>&#8594;</span>
                              <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-medium">
                                {outputLabel}
                              </span>
                            </span>
                            <span>{result.width} x {result.height}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                            <span>{formatFileSize(result.originalSize)}</span>
                            <span>&#8594;</span>
                            <span className="font-medium text-emerald-700">{formatFileSize(result.outputSize)}</span>
                            <span className={`font-medium ${result.outputSize <= result.originalSize ? 'text-emerald-600' : 'text-amber-600'}`}>
                              ({reduction})
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadSingle(result)}
                          className="btn btn-outline flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {results.length > 1 && (
                <button
                  onClick={downloadAll}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Download All as ZIP
                </button>
              )}

              <button
                onClick={handleReset}
                className="btn btn-outline w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
