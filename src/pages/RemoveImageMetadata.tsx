import { useState, useEffect, useCallback } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, formatFileSize, getFormatLabel } from '../utils/image/support';
import { generateOutputFilename } from '../utils/image/canvas';
import { extractMetadata, removeMetadataByReencoding, type ImageMetadataInfo } from '../utils/image/metadata';
import { downloadBlobFile, downloadZipFromEntries } from '../utils/pdf/export';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import { FAQSection } from '../components/FAQSection';
import {
  EyeOff, Sparkles, Download, Loader2, Trash2, Archive, RefreshCw,
  AlertTriangle, Info, ShieldCheck, MapPin, Camera, CheckCircle, XCircle,
} from 'lucide-react';

interface FileEntry {
  info: ImageFileInfo;
  metadata: ImageMetadataInfo | null;
  isInspecting: boolean;
}

interface CleanedResult {
  id: string;
  filename: string;
  blob: Blob;
  originalSize: number;
  outputSize: number;
  width: number;
  height: number;
}

export const RemoveImageMetadata = () => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [bgColor, setBgColor] = useState('#ffffff');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [results, setResults] = useState<CleanedResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
  }, []);

  useEffect(() => {
    return () => {
      revokeImageUrls(files.map((f) => f.info));
    };
  }, [files]);

  const handleFilesSelected = useCallback(async (selected: File[]) => {
    setError(null);
    setResults([]);

    const entries: FileEntry[] = [];
    for (const f of selected) {
      try {
        const info = await loadImageFile(f);
        entries.push({ info, metadata: null, isInspecting: true });
      } catch {
        toast.error(`Failed to load ${f.name}`);
      }
    }

    if (entries.length > 0) {
      setFiles((prev) => [...prev, ...entries]);

      // Inspect metadata in background
      for (const entry of entries) {
        try {
          const meta = await extractMetadata(entry.info.file);
          setFiles((prev) =>
            prev.map((f) =>
              f.info.id === entry.info.id ? { ...f, metadata: meta, isInspecting: false } : f,
            ),
          );
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.info.id === entry.info.id
                ? {
                    ...f,
                    metadata: {
                      hasExif: false,
                      hasGps: false,
                      cameraMake: null,
                      cameraModel: null,
                      orientation: null,
                      dateTime: null,
                      software: null,
                      colorProfile: null,
                      warnings: ['Could not inspect metadata.'],
                    },
                    isInspecting: false,
                  }
                : f,
            ),
          );
        }
      }
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.info.id === id);
      if (removed) revokeImageUrls([removed.info]);
      return prev.filter((f) => f.info.id !== id);
    });
    setResults((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleRemoveMetadata = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);
    setError(null);
    setResults([]);

    try {
      const cleaned: CleanedResult[] = [];

      for (let i = 0; i < files.length; i++) {
        setProcessedCount(i + 1);
        const { info } = files[i];

        const isSvg = info.mimeType.includes('svg');
        if (isSvg) {
          toast.warning(`${info.name}: SVG files cannot be re-encoded through Canvas.`);
          continue;
        }

        const { blob, width, height } = await removeMetadataByReencoding(
          info.file,
          outputFormat,
          quality,
          bgColor,
        );
        const filename = generateOutputFilename(info.name, '_clean', outputFormat);
        cleaned.push({
          id: info.id,
          filename,
          blob,
          originalSize: info.originalSize,
          outputSize: blob.size,
          width,
          height,
        });
      }

      setResults(cleaned);
      toast.success(`${cleaned.length} image${cleaned.length !== 1 ? 's' : ''} cleaned`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Processing failed';
      setError(msg);
      toast.error('Metadata removal failed');
    } finally {
      setIsProcessing(false);
    }
  }, [files, outputFormat, quality, bgColor]);

  const handleDownloadSingle = useCallback((result: CleanedResult) => {
    downloadBlobFile(result.blob, result.filename);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0) return;
    await downloadZipFromEntries(
      results.map((r) => ({ filename: r.filename, data: r.blob })),
      'metadata-removed-images.zip',
    );
  }, [results]);

  const handleReset = useCallback(() => {
    revokeImageUrls(files.map((f) => f.info));
    setFiles([]);
    setResults([]);
    setError(null);
  }, [files]);

  const faqItems = [
    { question: "What metadata is removed from my images?", answer: "The tool strips EXIF data, GPS location coordinates, camera make and model, date/time stamps, software tags, and orientation metadata by re-rendering the image through the Canvas API." },
    { question: "Why should I remove image metadata?", answer: "Image metadata can contain sensitive information like your GPS location, camera serial number, and the date a photo was taken. Removing it before sharing online protects your privacy." },
    { question: "Are my images uploaded to a server?", answer: "No. All metadata inspection and removal is performed locally in your browser. Your images never leave your device, ensuring complete privacy." },
    { question: "What image formats are supported?", answer: "You can process JPEG, PNG, WebP, and most other raster image formats. The cleaned output can be exported as JPEG, PNG, or WebP." },
  ];

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Remove Image Metadata Online - Strip EXIF, GPS & Camera Data"
        description="Inspect and remove EXIF, GPS location, and camera metadata from images for privacy. Free, private, no uploads."
        faqItems={faqItems}
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500 to-slate-700 text-white flex items-center justify-center shadow-lg">
              <EyeOff className="w-6 h-6" />
            </div>
          </div>
          <h1>Metadata Remover</h1>
          <p>Inspect and remove EXIF, GPS, and camera metadata from images.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Files are processed locally in your browser and are not uploaded.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Upload */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            {files.length === 0 ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple
                description="Drop images to inspect and clean"
              />
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{files.length} image{files.length !== 1 ? 's' : ''}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                        input.onchange = () => { if (input.files) handleFilesSelected(Array.from(input.files)); };
                        input.click();
                      }}
                      className="btn btn-outline text-sm py-2 px-3"
                    >Add More</button>
                    <button onClick={handleReset} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-[var(--error)]" title="Clear All">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* File list with metadata */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {files.map(({ info, metadata, isInspecting }) => (
                    <div key={info.id} className="bg-muted/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <img src={info.previewUrl} alt={info.name} className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{info.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getFormatLabel(info.mimeType)} &middot; {info.width}×{info.height} &middot; {formatFileSize(info.originalSize)}
                          </p>
                        </div>
                        <button onClick={() => removeFile(info.id)} className="p-1.5 hover:bg-background rounded-full text-muted-foreground hover:text-[var(--error)] shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {isInspecting ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Inspecting metadata...
                        </div>
                      ) : metadata ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <MetadataRow label="EXIF" value={metadata.hasExif ? 'Present' : 'Not found'} present={metadata.hasExif} />
                            <MetadataRow label="GPS / Location" value={metadata.hasGps ? 'Detected' : 'Not found'} present={metadata.hasGps} warn={metadata.hasGps} />
                            <MetadataRow label="Camera Make" value={metadata.cameraMake ?? 'Not available'} present={!!metadata.cameraMake} />
                            <MetadataRow label="Camera Model" value={metadata.cameraModel ?? 'Not available'} present={!!metadata.cameraModel} />
                            <MetadataRow label="Date/Time" value={metadata.dateTime ?? 'Not available'} present={!!metadata.dateTime} />
                            <MetadataRow label="Software" value={metadata.software ?? 'Not available'} present={!!metadata.software} />
                            <MetadataRow label="Orientation" value={metadata.orientation != null ? `Tag ${metadata.orientation}` : 'Not available'} present={metadata.orientation != null} />
                          </div>

                          {metadata.warnings.length > 0 && (
                            <div className="space-y-1.5">
                              {metadata.warnings.map((w, i) => (
                                <div key={i} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                                  w.includes('location') || w.includes('Camera')
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {w.includes('location') ? <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                                   w.includes('Camera') ? <Camera className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                                   <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                                  <span>{w}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          {files.length > 0 && results.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-blue-100">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">How metadata removal works</p>
                  <p className="mt-1 text-xs">
                    A newly rendered image copy is created without the standard metadata retained in the original file.
                    Re-exporting through Canvas strips most EXIF, GPS, and camera data.
                    Note that re-encoding may slightly affect color profiles or format-specific information.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Output Format</label>
                  <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as ImageFormat)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20">
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    {supportedFormats?.['image/webp'] && <option value="image/webp">WebP</option>}
                  </select>
                </div>
                {outputFormat !== 'image/png' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Quality: {Math.round(quality * 100)}%</label>
                    <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full accent-foreground" />
                  </div>
                )}
              </div>

              {outputFormat === 'image/jpeg' && files.some((f) => f.info.hasTransparency) && (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-amber-200">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p>Transparent areas will be filled with a background color.</p>
                    <div className="flex items-center gap-3 mt-2">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" aria-label="Background color" />
                      <span className="text-sm font-medium">{bgColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRemoveMetadata}
                  disabled={isProcessing || files.some((f) => f.isInspecting)}
                  className={`btn btn-primary flex-1 py-4 text-base ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing {processedCount}/{files.length}...</>
                  ) : (
                    <><EyeOff className="w-5 h-5" /> Remove Metadata & Export</>
                  )}
                </button>
                <button onClick={handleReset} className="btn btn-outline py-4 text-base sm:flex-none sm:px-6">
                  <RefreshCw className="w-5 h-5" /> Clear All
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold">Cleaned Images</h2>
              </div>

              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 text-sm">
                <p className="font-medium">Metadata removed successfully</p>
                <p className="mt-1 text-xs">
                  A newly rendered image copy has been created without the standard metadata retained in the original file.
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(r.originalSize)} &rarr; {formatFileSize(r.outputSize)}
                        &nbsp;&middot;&nbsp;{r.width}×{r.height}
                      </p>
                    </div>
                    <button onClick={() => handleDownloadSingle(r)} className="p-2 hover:bg-background rounded-full text-muted-foreground hover:text-foreground shrink-0" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {results.length > 1 && (
                  <button onClick={handleDownloadAll} className="btn btn-primary flex-1 py-4 text-base">
                    <Archive className="w-5 h-5" /> Download All as ZIP
                  </button>
                )}
                {results.length === 1 && (
                  <button onClick={() => handleDownloadSingle(results[0])} className="btn btn-primary flex-1 py-4 text-base">
                    <Download className="w-5 h-5" /> Download
                  </button>
                )}
                <button onClick={handleReset} className="btn btn-outline py-4 text-base sm:flex-none sm:px-6">
                  <RefreshCw className="w-5 h-5" /> Start Over
                </button>
              </div>
            </div>
          )}
        </div>

        <FAQSection items={faqItems} />
      </div>
    </div>
  );
};

function MetadataRow({ label, value, present, warn }: { label: string; value: string; present: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {warn ? (
        <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" />
      ) : present ? (
        <CheckCircle className="w-3 h-3 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="w-3 h-3 shrink-0 text-muted-foreground/50" />
      )}
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium truncate ${present ? 'text-foreground' : 'text-muted-foreground/60'}`}>{value}</span>
    </div>
  );
}
