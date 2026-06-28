import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { ToolStateMessage } from '../components/ToolStateMessage';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, formatFileSize, getFormatExtension, stripBasename } from '../utils/image/support';
import { canvasToBlob } from '../utils/image/canvas';
import { downloadBlobFile } from '../utils/pdf/export';
import { removeImageBackground } from '../utils/ai/backgroundRemoval';
import { detectAiCapabilities, checkImageSizeLimit } from '../utils/ai/capabilities';
import { MAX_INPUT_PIXELS } from '../utils/ai/types';
import type { AiProgress, AiProcessingStatus } from '../utils/ai/types';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import { FAQSection } from '../components/FAQSection';
import {
  CircleOff, Download, Loader2, RefreshCw, AlertTriangle,
  Info, Sliders, Eye,
} from 'lucide-react';

type OutputFormatOption = 'image/png' | 'image/webp' | 'image/jpeg';

export const RemoveBackground = () => {
  const [file, setFile] = useState<ImageFileInfo | null>(null);
  const [status, setStatus] = useState<AiProcessingStatus>('idle');
  const [progress, setProgress] = useState<AiProgress>({ stage: '', progress: 0 });
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const [outputFormat, setOutputFormat] = useState<OutputFormatOption>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [feather, setFeather] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [sliderWidth, setSliderWidth] = useState<number | null>(null);

  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [isCapable, setIsCapable] = useState<boolean | null>(null);
  const [capabilityReason, setCapabilityReason] = useState<string | null>(null);

  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
    detectAiCapabilities().then((caps) => {
      setIsCapable(caps.suitable);
      if (!caps.suitable) setCapabilityReason(caps.reason ?? 'Device not supported');
    });
  }, []);

  useEffect(() => {
    return () => {
      if (file) revokeImageUrls([file]);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [file, resultUrl]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const updateWidth = () => setSliderWidth(slider.offsetWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(slider);
    return () => observer.disconnect();
  }, [resultUrl]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    setError(null);
    setResultBlob(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setStatus('idle');
    setProcessingTime(null);

    try {
      const info = await loadImageFile(files[0]);
      const sizeErr = checkImageSizeLimit(info.width, info.height, MAX_INPUT_PIXELS);
      if (sizeErr) { setError(sizeErr); revokeImageUrls([info]); return; }
      if (file) revokeImageUrls([file]);
      setFile(info);
    } catch {
      setError('Could not load this image. Please try a different file.');
    }
  }, [file, resultUrl]);

  const handleRemoveBackground = useCallback(async () => {
    if (!file) return;
    setError(null);
    setStatus('loading-model');

    const start = performance.now();
    try {
      const blob = await removeImageBackground(file.file, (p) => {
        setProgress(p);
        if (p.stage === 'processing') setStatus('processing');
      });

      let finalBlob = blob;
      if (outputFormat === 'image/jpeg' || feather > 0) {
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d')!;

        if (feather > 0) {
          ctx.filter = `blur(${feather}px)`;
          ctx.drawImage(bitmap, 0, 0);
          ctx.filter = 'none';
          ctx.globalCompositeOperation = 'source-in';
          ctx.drawImage(bitmap, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
        }

        if (outputFormat === 'image/jpeg') {
          const bg = document.createElement('canvas');
          bg.width = bitmap.width;
          bg.height = bitmap.height;
          const bgCtx = bg.getContext('2d')!;
          bgCtx.fillStyle = bgColor;
          bgCtx.fillRect(0, 0, bg.width, bg.height);
          bgCtx.drawImage(feather > 0 ? canvas : bitmap, 0, 0);
          finalBlob = await canvasToBlob(bg, 'image/jpeg', quality);
        } else if (feather > 0) {
          finalBlob = await canvasToBlob(canvas, outputFormat, outputFormat === 'image/png' ? undefined : quality);
        }
        bitmap.close();
      }

      if (outputFormat === 'image/webp' && finalBlob === blob) {
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
        bitmap.close();
        finalBlob = await canvasToBlob(canvas, 'image/webp', quality);
      }

      const url = URL.createObjectURL(finalBlob);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(finalBlob);
      setResultUrl(url);
      setStatus('complete');
      setProcessingTime(Math.round(performance.now() - start));
      toast.success('Background removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove background');
      setStatus('error');
    }
  }, [file, outputFormat, quality, bgColor, feather, resultUrl]);

  const handleDownload = useCallback(() => {
    if (!resultBlob || !file) return;
    const ext = getFormatExtension(outputFormat);
    const name = `${stripBasename(file.name)}_no-bg.${ext}`;
    downloadBlobFile(resultBlob, name);
  }, [resultBlob, file, outputFormat]);

  const handleReset = useCallback(() => {
    if (file) revokeImageUrls([file]);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultBlob(null);
    setResultUrl(null);
    setStatus('idle');
    setError(null);
    setProcessingTime(null);
  }, [file, resultUrl]);

  const handleSliderDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const isProcessing = status === 'loading-model' || status === 'processing';

  const faqItems = [
    { question: "How accurate is the AI background removal?", answer: "The AI model uses a neural network trained on millions of images to detect foreground subjects with high accuracy. It works well with portraits, products, pets, and distinct objects, though results may vary with complex edges, transparent objects, or similar foreground and background colours." },
    { question: "What image types are supported?", answer: "FilePilot supports JPEG, PNG, and WebP images for background removal. The AI model is downloaded to your browser on first use (approximately 40 MB) and processes images locally." },
    { question: "Can I get a transparent PNG output?", answer: "Yes, the default output format is PNG with a transparent background. You can also export as WebP with transparency or JPEG with a solid background colour of your choice." },
    { question: "Is my image uploaded to a server?", answer: "No. All processing happens entirely in your browser using a local AI model. Your images are never uploaded to any server, ensuring complete privacy." },
  ];

  return (
    <main className="container max-w-4xl py-8 px-4">
      <PageSeo
        title="Remove Background — Free AI Background Remover | FilePilot"
        description="Remove image backgrounds automatically using AI, directly in your browser. No upload needed — your images stay private."
        faqItems={faqItems}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white">
            <CircleOff className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Remove Background</h1>
        </div>
        <p className="text-muted-foreground">
          Automatically detect the foreground subject and remove the background using AI.
          Works with portraits, products, pets, and objects.
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
          description="Upload an image to remove its background"
          hint="Supports JPEG, PNG, and WebP. The AI model will be downloaded to your browser on first use (~40 MB)."
        />
      )}

      {file && (
        <div className="space-y-6">
          {/* Before/after comparison */}
          {resultUrl && status === 'complete' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Result</h2>
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  {showOriginal ? 'Show result' : 'Show original'}
                </button>
              </div>

              {/* Comparison slider */}
              <div
                ref={sliderRef}
                className="relative overflow-hidden rounded-lg border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] cursor-col-resize select-none"
                style={{ maxHeight: 500 }}
                onMouseMove={(e) => { if (e.buttons === 1) handleSliderDrag(e); }}
                onMouseDown={handleSliderDrag}
                onTouchMove={handleSliderDrag}
                role="slider"
                aria-label="Before/after comparison"
                aria-valuenow={Math.round(sliderPos)}
                tabIndex={0}
              >
                <img
                  src={file.previewUrl}
                  alt="Original"
                  className="block w-full h-auto"
                  style={{ maxHeight: 500, objectFit: 'contain' }}
                  draggable={false}
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={resultUrl}
                    alt="Background removed"
                    className="block h-full object-contain"
                    style={{ maxHeight: 500, width: sliderWidth ?? 'auto' }}
                    draggable={false}
                  />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <Sliders className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-muted-foreground">Original</p>
                  <p className="font-medium">{file.width} × {file.height} · {formatFileSize(file.originalSize)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-muted-foreground">Result</p>
                  <p className="font-medium">{resultBlob ? formatFileSize(resultBlob.size) : '—'}</p>
                  {processingTime && <p className="text-xs text-muted-foreground">{(processingTime / 1000).toFixed(1)}s</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <img
                src={file.previewUrl}
                alt="Preview"
                className="block w-full h-auto"
                style={{ maxHeight: 400, objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <ToolStateMessage state="loading" title={progress.message ?? 'Processing...'}>
              <div className="mt-2 h-2 rounded-full bg-blue-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </ToolStateMessage>
          )}

          {error && (
            <ToolStateMessage state="error" title="Error">
              {error}
            </ToolStateMessage>
          )}

          {/* Controls */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Output Settings</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormatOption)}
                  disabled={isProcessing}
                >
                  <option value="image/png">PNG (transparent)</option>
                  {supportedFormats?.['image/webp'] && <option value="image/webp">WebP (transparent)</option>}
                  <option value="image/jpeg">JPEG (with background colour)</option>
                </select>
              </div>

              {outputFormat === 'image/jpeg' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Background Colour</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-border"
                      disabled={isProcessing}
                    />
                    <span className="text-sm text-muted-foreground">{bgColor}</span>
                  </div>
                </div>
              )}

              {outputFormat !== 'image/png' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Quality: {Math.round(quality * 100)}%</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.01"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full"
                    disabled={isProcessing}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Edge Feather: {feather}px</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={feather}
                  onChange={(e) => setFeather(parseInt(e.target.value))}
                  className="w-full"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {status !== 'complete' && (
              <button
                onClick={handleRemoveBackground}
                disabled={isProcessing || isCapable === false}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleOff className="h-4 w-4" />}
                {isProcessing ? 'Processing…' : 'Remove Background'}
              </button>
            )}

            {status === 'complete' && (
              <>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={handleRemoveBackground}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-process
                </button>
              </>
            )}

            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition"
            >
              Upload New Image
            </button>
          </div>

          {/* Notices */}
          <div className="space-y-2 text-sm">
            <ToolStateMessage state="hint">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Images are processed locally in your browser and are not uploaded. The AI model is downloaded to your device on first use.</p>
              </div>
            </ToolStateMessage>
            <ToolStateMessage state="hint">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Results can vary with complex edges, transparent objects, similar foreground/background colours, or multiple subjects.</p>
              </div>
            </ToolStateMessage>
          </div>
        </div>
      )}

      <FAQSection items={faqItems} />
    </main>
  );
};
