import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { ToolStateMessage } from '../components/ToolStateMessage';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, getFormatExtension, stripBasename } from '../utils/image/support';
import { canvasToBlob } from '../utils/image/canvas';
import { downloadBlobFile } from '../utils/pdf/export';
import { enhanceImage, type EnhanceMode, type EnhanceIntensity } from '../utils/ai/enhance';
import { checkImageSizeLimit } from '../utils/ai/capabilities';
import { MAX_INPUT_PIXELS } from '../utils/ai/types';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import { FAQSection } from '../components/FAQSection';
import {
  Sparkles, Download, Loader2, AlertTriangle, Info,
  Sun, Droplet, Focus, Palette, ImageIcon, Sliders, Undo2,
} from 'lucide-react';

type OutputFormatOption = 'image/png' | 'image/webp' | 'image/jpeg';

const MODE_OPTIONS: { value: EnhanceMode; label: string; description: string; icon: typeof Sparkles }[] = [
  { value: 'auto', label: 'Auto Enhance', description: 'Analyse and improve exposure, contrast, colour, and sharpness', icon: Sparkles },
  { value: 'low-light', label: 'Low-Light Fix', description: 'Brighten dark images and recover shadow detail', icon: Sun },
  { value: 'denoise', label: 'Denoise', description: 'Reduce noise and grain while preserving edges', icon: Droplet },
  { value: 'sharpen', label: 'Sharpen', description: 'Enhance detail and edge clarity', icon: Focus },
  { value: 'color-correct', label: 'Colour Correction', description: 'Fix white balance and colour cast', icon: Palette },
  { value: 'restore-faded', label: 'Restore Faded', description: 'Recover contrast and vibrancy from faded images', icon: ImageIcon },
];

const INTENSITY_OPTIONS: { value: EnhanceIntensity; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'strong', label: 'Strong' },
];

export const AiEnhanceImage = () => {
  const [file, setFile] = useState<ImageFileInfo | null>(null);
  const [mode, setMode] = useState<EnhanceMode>('auto');
  const [intensity, setIntensity] = useState<EnhanceIntensity>('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [appliedOps, setAppliedOps] = useState<string[]>([]);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const [outputFormat, setOutputFormat] = useState<OutputFormatOption>('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
  }, []);

  useEffect(() => {
    return () => {
      if (file) revokeImageUrls([file]);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [file, resultUrl]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    setError(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setAppliedOps([]);
    try {
      const info = await loadImageFile(files[0]);
      const sizeErr = checkImageSizeLimit(info.width, info.height, MAX_INPUT_PIXELS);
      if (sizeErr) { setError(sizeErr); revokeImageUrls([info]); return; }
      if (file) revokeImageUrls([file]);
      setFile(info);
    } catch {
      setError('Could not load this image.');
    }
  }, [file, resultUrl]);

  const handleEnhance = useCallback(async () => {
    if (!file) return;
    setError(null);
    setIsProcessing(true);
    const start = performance.now();

    try {
      const bitmap = await createImageBitmap(file.file);
      const { canvas, appliedOps: ops } = enhanceImage(bitmap, mode, intensity);
      bitmap.close();

      const blob = await canvasToBlob(canvas, outputFormat, outputFormat === 'image/png' ? undefined : quality);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultBlob(blob);
      setAppliedOps(ops);
      setProcessingTime(Math.round(performance.now() - start));
      toast.success('Image enhanced successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhancement failed');
    } finally {
      setIsProcessing(false);
    }
  }, [file, mode, intensity, outputFormat, quality, resultUrl]);

  const handleDownload = useCallback(() => {
    if (!resultBlob || !file) return;
    const ext = getFormatExtension(outputFormat);
    downloadBlobFile(resultBlob, `${stripBasename(file.name)}_enhanced.${ext}`);
  }, [resultBlob, file, outputFormat]);

  const handleReset = useCallback(() => {
    if (file) revokeImageUrls([file]);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setResultBlob(null);
    setAppliedOps([]);
    setError(null);
    setProcessingTime(null);
  }, [file, resultUrl]);

  const handleSliderDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setSliderPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const faqItems = [
    { question: "What enhancements are applied to my image?", answer: "Depending on the mode you select, the tool applies adjustments such as exposure correction, contrast improvement, colour balance, sharpening, and noise reduction. The Auto Enhance mode analyses your image and applies the most relevant combination automatically." },
    { question: "Can I see a before and after comparison?", answer: "Yes. After enhancement, an interactive before/after slider lets you drag to compare the original and enhanced versions side by side, making it easy to evaluate the improvements." },
    { question: "How much quality improvement can I expect?", answer: "Results depend on the original image quality and the selected mode and intensity. The tool can significantly improve exposure, reduce noise, and sharpen detail, but it cannot recover information that was not present in the original image." },
    { question: "Is my image uploaded to a server?", answer: "No. All enhancement processing happens entirely in your browser using image adjustment algorithms. Your images are never uploaded to any server, ensuring complete privacy." },
  ];

  return (
    <main className="container max-w-4xl py-8 px-4">
      <PageSeo
        title="AI Enhance Image — Smart Image Enhancement | FilePilot"
        description="Improve image quality with smart analysis-based enhancement. Fix exposure, reduce noise, sharpen details, and correct colours — all locally in your browser."
        faqItems={faqItems}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AI Enhance Image</h1>
        </div>
        <p className="text-muted-foreground">
          Improve common image issues using smart analysis and image adjustments. Choose a mode and intensity level.
        </p>
      </div>

      {!file && (
        <FileUploader
          onFilesSelected={handleFileSelected}
          accept="image/*"
          description="Upload an image to enhance"
          hint="Supports JPEG, PNG, and WebP. All processing happens locally in your browser."
        />
      )}

      {file && (
        <div className="space-y-6">
          {/* Before/after slider */}
          {resultUrl ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Before / After</h2>
                <span className="text-xs text-muted-foreground">Drag to compare</span>
              </div>
              <div
                ref={sliderRef}
                className="relative overflow-hidden rounded-lg border border-border cursor-col-resize select-none"
                style={{ maxHeight: 450 }}
                onMouseMove={(e) => { if (e.buttons === 1) handleSliderDrag(e); }}
                onMouseDown={handleSliderDrag}
                onTouchMove={handleSliderDrag}
                role="slider"
                aria-label="Before/after comparison"
                aria-valuenow={Math.round(sliderPos)}
                tabIndex={0}
              >
                <img src={file.previewUrl} alt="Original" className="block w-full h-auto" style={{ maxHeight: 450, objectFit: 'contain' }} draggable={false} />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                  <img src={resultUrl} alt="Enhanced" className="block h-full object-contain" style={{ maxHeight: 450, width: sliderRef.current?.offsetWidth ?? 'auto' }} draggable={false} />
                </div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <Sliders className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <img src={file.previewUrl} alt="Preview" className="block w-full h-auto" style={{ maxHeight: 400, objectFit: 'contain' }} />
            </div>
          )}

          {error && <ToolStateMessage state="error" title="Error">{error}</ToolStateMessage>}

          {/* Applied operations */}
          {appliedOps.length > 0 && (
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-sm mb-2">Applied Operations</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {appliedOps.map((op, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {op}
                  </li>
                ))}
              </ul>
              {processingTime && (
                <p className="text-xs text-muted-foreground mt-2">Processed in {processingTime}ms</p>
              )}
            </div>
          )}

          {/* Mode selection */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Enhancement Mode</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    disabled={isProcessing}
                    className={`text-left rounded-lg border-2 p-3 transition ${
                      mode === opt.value ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Intensity</h3>
            <div className="flex gap-2">
              {INTENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIntensity(opt.value)}
                  disabled={isProcessing}
                  className={`flex-1 rounded-lg border-2 py-2.5 text-center text-sm font-medium transition ${
                    intensity === opt.value ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Output */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Output</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm mb-1">Format</label>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as OutputFormatOption)} disabled={isProcessing}>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  {supportedFormats?.['image/webp'] && <option value="image/webp">WebP</option>}
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

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleEnhance}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isProcessing ? 'Enhancing…' : resultUrl ? 'Re-enhance' : 'Enhance Image'}
            </button>

            {resultUrl && (
              <>
                <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition">
                  <Download className="h-4 w-4" /> Download
                </button>
                <button onClick={() => { if (resultUrl) URL.revokeObjectURL(resultUrl); setResultUrl(null); setResultBlob(null); setAppliedOps([]); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition">
                  <Undo2 className="h-4 w-4" /> Reset
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
                <div>
                  <p>Images are processed locally in your browser and are not uploaded.</p>
                  <p className="mt-1">All enhancements use image adjustment algorithms (brightness, contrast, white balance, sharpening, noise reduction). These are standard image processing techniques, clearly labeled in the applied operations list.</p>
                </div>
              </div>
            </ToolStateMessage>
            <ToolStateMessage state="hint">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Enhancement can improve perceived clarity and balance, but cannot reliably recreate details missing from the original image.</p>
              </div>
            </ToolStateMessage>
          </div>
        </div>
      )}

      <FAQSection items={faqItems} />
    </main>
  );
};
