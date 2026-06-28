import { useState, useEffect, useCallback } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { ToolStateMessage } from '../components/ToolStateMessage';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, formatFileSize, getFormatExtension, stripBasename } from '../utils/image/support';
import { canvasToBlob } from '../utils/image/canvas';
import { downloadBlobFile } from '../utils/pdf/export';
import { upscaleImage, isUpscaleModelAvailable } from '../utils/ai/upscale';
import { detectAiCapabilities, checkImageSizeLimit } from '../utils/ai/capabilities';
import { MAX_UPSCALE_INPUT_PIXELS } from '../utils/ai/types';
import type { AiProgress, AiProcessingStatus } from '../utils/ai/types';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import { FAQSection } from '../components/FAQSection';
import {
  ImagePlus, Download, Loader2, RefreshCw, AlertTriangle,
  Info, ZoomIn, Eye,
} from 'lucide-react';

type UpscaleScale = 2 | 4;
type OutputFormatOption = 'image/png' | 'image/webp' | 'image/jpeg';

export const UpscaleImage = () => {
  const [file, setFile] = useState<ImageFileInfo | null>(null);
  const [status, setStatus] = useState<AiProcessingStatus>('idle');
  const [progress, setProgress] = useState<AiProgress>({ stage: '', progress: 0 });
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const [scale, setScale] = useState<UpscaleScale>(2);
  const [outputFormat, setOutputFormat] = useState<OutputFormatOption>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [isCapable, setIsCapable] = useState<boolean | null>(null);
  const [capabilityReason, setCapabilityReason] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState<100 | 200>(100);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
    detectAiCapabilities().then((caps) => {
      const modelOk = isUpscaleModelAvailable();
      setIsCapable(caps.suitable && modelOk);
      if (!caps.suitable) setCapabilityReason(caps.reason ?? 'Browser not supported');
      else if (!modelOk) setCapabilityReason('WebAssembly is required for AI upscaling.');
    });
  }, []);

  useEffect(() => {
    return () => {
      if (file) revokeImageUrls([file]);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [file, resultUrl]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    setError(null);
    setWarnings([]);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setResultDims(null);
    setStatus('idle');
    try {
      const info = await loadImageFile(files[0]);
      const sizeErr = checkImageSizeLimit(info.width, info.height, MAX_UPSCALE_INPUT_PIXELS);
      if (sizeErr) { setError(sizeErr); revokeImageUrls([info]); return; }
      if (file) revokeImageUrls([file]);
      setFile(info);
    } catch {
      setError('Could not load this image.');
    }
  }, [file, resultUrl]);

  const handleUpscale = useCallback(async () => {
    if (!file) return;
    setError(null);
    setWarnings([]);
    setStatus('loading-model');
    const start = performance.now();

    try {
      const { canvas, warnings: w } = await upscaleImage(file.file, scale, (p) => {
        setProgress(p);
        if (p.stage === 'processing') setStatus('processing');
      });

      setWarnings(w);
      const blob = await canvasToBlob(canvas, outputFormat, outputFormat === 'image/png' ? undefined : quality);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultBlob(blob);
      setResultDims({ w: canvas.width, h: canvas.height });
      setStatus('complete');
      setProcessingTime(Math.round(performance.now() - start));
      toast.success(`Image upscaled ${scale}x successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upscaling failed');
      setStatus('error');
    }
  }, [file, scale, outputFormat, quality, resultUrl]);

  const handleDownload = useCallback(() => {
    if (!resultBlob || !file) return;
    const ext = getFormatExtension(outputFormat);
    downloadBlobFile(resultBlob, `${stripBasename(file.name)}_${scale}x.${ext}`);
  }, [resultBlob, file, outputFormat, scale]);

  const handleReset = useCallback(() => {
    if (file) revokeImageUrls([file]);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setResultBlob(null);
    setResultDims(null);
    setStatus('idle');
    setError(null);
    setWarnings([]);
    setProcessingTime(null);
  }, [file, resultUrl]);

  const isProcessing = status === 'loading-model' || status === 'processing';
  const megapixels = file ? ((file.width * file.height) / 1e6).toFixed(1) : '0';
  const outputMp = file ? ((file.width * scale * file.height * scale) / 1e6).toFixed(1) : '0';

  const faqItems = [
    { question: "What is the maximum upscale factor?", answer: "FilePilot supports 2x and 4x upscaling. 4x upscaling produces the largest output but requires significantly more memory and processing time. The maximum input size is 4 megapixels." },
    { question: "How does AI super-resolution work?", answer: "The AI model uses a neural network to intelligently add detail and sharpness when enlarging images, rather than simple pixel stretching. This produces much cleaner results, though it cannot perfectly recover details missing from the original." },
    { question: "What image formats are supported?", answer: "You can upload JPEG, PNG, and WebP images. Output can be saved as PNG (lossless), WebP, or JPEG with adjustable quality. All processing happens locally in your browser." },
    { question: "How long does upscaling take?", answer: "Processing time depends on image size, upscale factor, and your device's hardware. A typical 2x upscale takes a few seconds, while 4x may take longer. The AI model is downloaded once on first use and cached in your browser." },
  ];

  return (
    <main className="container max-w-4xl py-8 px-4">
      <PageSeo
        title="Upscale Image — AI Super-Resolution | FilePilot"
        description="Enlarge images using AI super-resolution directly in your browser. Increase resolution while preserving detail — no upload needed."
        faqItems={faqItems}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <ImagePlus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Upscale Image</h1>
        </div>
        <p className="text-muted-foreground">
          Increase image resolution using AI super-resolution. Uses a neural network model to add detail, not simple stretching.
        </p>
      </div>

      {isCapable === false && (
        <ToolStateMessage state="error" title="Browser Not Supported">
          {capabilityReason}
        </ToolStateMessage>
      )}

      {!file && isCapable !== false && (
        <FileUploader
          onFilesSelected={handleFileSelected}
          accept="image/*"
          description="Upload an image to upscale"
          hint="Supports JPEG, PNG, and WebP. Maximum input size: 4 megapixels. The AI model downloads to your browser on first use."
        />
      )}

      {file && (
        <div className="space-y-6">
          {/* Source info */}
          <div className="rounded-lg border border-border p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground">Dimensions</span><p className="font-medium">{file.width} × {file.height}</p></div>
              <div><span className="text-muted-foreground">Megapixels</span><p className="font-medium">{megapixels} MP</p></div>
              <div><span className="text-muted-foreground">File Size</span><p className="font-medium">{formatFileSize(file.originalSize)}</p></div>
              <div><span className="text-muted-foreground">Format</span><p className="font-medium">{file.mimeType.split('/')[1]?.toUpperCase()}</p></div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border text-sm">
              <span className="font-medium">{resultUrl && !showOriginal ? `Result (${resultDims?.w} × ${resultDims?.h})` : 'Original'}</span>
              <div className="flex gap-2">
                {resultUrl && (
                  <button onClick={() => setShowOriginal(!showOriginal)} className="inline-flex items-center gap-1 text-xs hover:text-foreground text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> {showOriginal ? 'Show result' : 'Show original'}
                  </button>
                )}
                {resultUrl && (
                  <div className="flex gap-1 text-xs">
                    <button onClick={() => setZoom(100)} className={`px-1.5 py-0.5 rounded ${zoom === 100 ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>100%</button>
                    <button onClick={() => setZoom(200)} className={`px-1.5 py-0.5 rounded ${zoom === 200 ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>200%</button>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-auto" style={{ maxHeight: 450 }}>
              <img
                src={showOriginal ? file.previewUrl : (resultUrl ?? file.previewUrl)}
                alt={showOriginal ? 'Original' : 'Preview'}
                className="block"
                style={{
                  maxWidth: zoom === 200 ? 'none' : '100%',
                  width: zoom === 200 ? `${(resultDims?.w ?? file.width)}px` : undefined,
                  imageRendering: zoom === 200 ? 'pixelated' : undefined,
                }}
                draggable={false}
              />
            </div>
          </div>

          {isProcessing && (
            <ToolStateMessage state="loading" title={progress.message ?? 'Processing...'}>
              <div className="mt-2 h-2 rounded-full bg-blue-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress.progress}%` }} />
              </div>
            </ToolStateMessage>
          )}

          {error && <ToolStateMessage state="error" title="Error">{error}</ToolStateMessage>}

          {warnings.map((w, i) => (
            <ToolStateMessage key={i} state="hint">
              <div className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /><p>{w}</p></div>
            </ToolStateMessage>
          ))}

          {status === 'complete' && processingTime && (
            <ToolStateMessage state="success" title="Upscaling Complete">
              <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                <div><span className="text-muted-foreground">Original</span><p className="font-medium">{file.width} × {file.height} · {formatFileSize(file.originalSize)}</p></div>
                <div><span className="text-muted-foreground">Upscaled</span><p className="font-medium">{resultDims?.w} × {resultDims?.h} · {resultBlob ? formatFileSize(resultBlob.size) : '—'}</p></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Processed in {(processingTime / 1000).toFixed(1)}s</p>
            </ToolStateMessage>
          )}

          {/* Controls */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Upscale Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Scale Factor</label>
                <div className="flex gap-2">
                  {([2, 4] as UpscaleScale[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      disabled={isProcessing}
                      className={`flex-1 rounded-lg border-2 py-3 text-center transition ${
                        scale === s ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/50'
                      }`}
                    >
                      <span className="text-lg font-bold">{s}×</span>
                      <p className="text-xs mt-0.5 opacity-75">
                        {file.width * s} × {file.height * s}
                      </p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Output: {outputMp} MP</p>
                {scale === 4 && (
                  <p className="text-xs text-amber-600 mt-1">
                    4× upscaling uses significant memory and processing time.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Output Format</label>
                  <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as OutputFormatOption)} disabled={isProcessing}>
                    <option value="image/png">PNG (lossless)</option>
                    {supportedFormats?.['image/webp'] && <option value="image/webp">WebP</option>}
                    <option value="image/jpeg">JPEG</option>
                  </select>
                </div>
                {outputFormat !== 'image/png' && (
                  <div>
                    <label className="block text-sm mb-1">Quality: {Math.round(quality * 100)}%</label>
                    <input type="range" min="0.1" max="1" step="0.01" value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full" disabled={isProcessing} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {status !== 'complete' && (
              <button
                onClick={handleUpscale}
                disabled={isProcessing || isCapable === false}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ZoomIn className="h-4 w-4" />}
                {isProcessing ? 'Upscaling…' : `Upscale ${scale}×`}
              </button>
            )}

            {status === 'complete' && (
              <>
                <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition">
                  <Download className="h-4 w-4" /> Download
                </button>
                <button onClick={handleUpscale} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition">
                  <RefreshCw className="h-4 w-4" /> Re-process
                </button>
              </>
            )}

            <button onClick={handleReset} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition">
              Upload New Image
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <ToolStateMessage state="hint">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Images are processed locally in your browser and are not uploaded. The AI super-resolution model is downloaded once on first use.</p>
              </div>
            </ToolStateMessage>
            <ToolStateMessage state="hint">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Upscaling improves appearance but cannot perfectly recover missing original detail. Unreadable text, heavily blurred areas, and very small faces may not improve significantly.</p>
              </div>
            </ToolStateMessage>
          </div>
        </div>
      )}

      <FAQSection items={faqItems} />
    </main>
  );
};
