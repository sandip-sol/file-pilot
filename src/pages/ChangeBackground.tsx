import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { ToolStateMessage } from '../components/ToolStateMessage';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, getFormatExtension, stripBasename } from '../utils/image/support';
import { canvasToBlob } from '../utils/image/canvas';
import { downloadBlobFile } from '../utils/pdf/export';
import { removeImageBackground } from '../utils/ai/backgroundRemoval';
import { detectAiCapabilities, checkImageSizeLimit } from '../utils/ai/capabilities';
import { MAX_INPUT_PIXELS } from '../utils/ai/types';
import type { AiProgress, AiProcessingStatus } from '../utils/ai/types';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import {
  Replace, Download, Loader2, RefreshCw, Info, Upload,
} from 'lucide-react';

type BgMode = 'transparent' | 'solid' | 'gradient' | 'blur' | 'image' | 'preset';
type OutputFormatOption = 'image/png' | 'image/webp' | 'image/jpeg';

interface PresetBg {
  id: string;
  label: string;
  value: string;
  type: 'solid' | 'gradient';
}

const PRESET_BACKGROUNDS: PresetBg[] = [
  { id: 'white-studio', label: 'White Studio', value: '#ffffff', type: 'solid' },
  { id: 'light-grey', label: 'Light Grey', value: '#e5e7eb', type: 'solid' },
  { id: 'dark-charcoal', label: 'Dark Charcoal', value: '#1f2937', type: 'solid' },
  { id: 'soft-beige', label: 'Soft Beige', value: '#f5f0e8', type: 'solid' },
  { id: 'blue-gradient', label: 'Blue Gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', type: 'gradient' },
  { id: 'green-outdoor', label: 'Green Outdoor', value: 'linear-gradient(180deg, #a8e063 0%, #56ab2f 100%)', type: 'gradient' },
];

export const ChangeBackground = () => {
  const [file, setFile] = useState<ImageFileInfo | null>(null);
  const [status, setStatus] = useState<AiProcessingStatus>('idle');
  const [progress, setProgress] = useState<AiProgress>({ stage: '', progress: 0 });
  const [foregroundBlob, setForegroundBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bgMode, setBgMode] = useState<BgMode>('solid');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [gradientStart, setGradientStart] = useState('#667eea');
  const [gradientEnd, setGradientEnd] = useState('#764ba2');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [blurIntensity, setBlurIntensity] = useState(15);
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('white-studio');
  const [fgScale, setFgScale] = useState(100);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowOpacity, setShadowOpacity] = useState(0.3);
  const [shadowBlur, setShadowBlur] = useState(20);
  const [feather, setFeather] = useState(1);

  const [outputFormat, setOutputFormat] = useState<OutputFormatOption>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [isCapable, setIsCapable] = useState<boolean | null>(null);

  const bgFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
    detectAiCapabilities().then((caps) => setIsCapable(caps.suitable));
  }, []);

  useEffect(() => {
    return () => {
      if (file) revokeImageUrls([file]);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
    };
  }, [file, resultUrl, bgImageUrl]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    setError(null);
    setForegroundBlob(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setStatus('idle');
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

  const handleBgImageSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
    setBgImageFile(f);
    setBgImageUrl(URL.createObjectURL(f));
    setBgMode('image');
  }, [bgImageUrl]);

  const buildBackgroundCanvas = useCallback(async (w: number, h: number): Promise<HTMLCanvasElement | string | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    switch (bgMode) {
      case 'transparent':
        return null;
      case 'solid':
        return solidColor;
      case 'gradient': {
        const rad = (gradientAngle * Math.PI) / 180;
        const x1 = w / 2 - Math.cos(rad) * w / 2;
        const y1 = h / 2 - Math.sin(rad) * h / 2;
        const x2 = w / 2 + Math.cos(rad) * w / 2;
        const y2 = h / 2 + Math.sin(rad) * h / 2;
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, gradientStart);
        gradient.addColorStop(1, gradientEnd);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        return canvas;
      }
      case 'blur': {
        if (!file) return '#ffffff';
        const bitmap = await createImageBitmap(file.file);
        ctx.filter = `blur(${blurIntensity}px)`;
        const scale = Math.max(w / bitmap.width, h / bitmap.height) * 1.1;
        const sw = bitmap.width * scale;
        const sh = bitmap.height * scale;
        ctx.drawImage(bitmap, (w - sw) / 2, (h - sh) / 2, sw, sh);
        bitmap.close();
        ctx.filter = 'none';
        return canvas;
      }
      case 'image': {
        if (!bgImageFile) return '#ffffff';
        const bitmap = await createImageBitmap(bgImageFile);
        const scale = Math.max(w / bitmap.width, h / bitmap.height);
        const sw = bitmap.width * scale;
        const sh = bitmap.height * scale;
        ctx.drawImage(bitmap, (w - sw) / 2, (h - sh) / 2, sw, sh);
        bitmap.close();
        return canvas;
      }
      case 'preset': {
        const preset = PRESET_BACKGROUNDS.find((p) => p.id === selectedPreset);
        if (!preset) return '#ffffff';
        if (preset.type === 'solid') return preset.value;
        const grad = ctx.createLinearGradient(0, 0, w, h);
        const colors = preset.value.match(/#[0-9a-f]{6}/gi) ?? ['#ffffff', '#cccccc'];
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1] ?? colors[0]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        return canvas;
      }
      default:
        return '#ffffff';
    }
  }, [bgMode, solidColor, gradientStart, gradientEnd, gradientAngle, blurIntensity, file, bgImageFile, selectedPreset]);

  const handleProcess = useCallback(async () => {
    if (!file) return;
    setError(null);
    setStatus('loading-model');

    try {
      let fg = foregroundBlob;
      if (!fg) {
        fg = await removeImageBackground(file.file, (p) => {
          setProgress(p);
          if (p.stage === 'processing') setStatus('processing');
        });
        setForegroundBlob(fg);
      }
      setStatus('processing');
      setProgress({ stage: 'processing', progress: 80, message: 'Compositing...' });

      const bgSource = await buildBackgroundCanvas(file.width, file.height);

      const fgBitmap = await createImageBitmap(fg);
      const canvas = document.createElement('canvas');
      canvas.width = file.width;
      canvas.height = file.height;
      const ctx = canvas.getContext('2d')!;

      if (bgSource === null) {
        // transparent
      } else if (typeof bgSource === 'string') {
        ctx.fillStyle = bgSource;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(bgSource, 0, 0);
      }

      if (shadowEnabled) {
        ctx.save();
        ctx.shadowColor = `rgba(0,0,0,${shadowOpacity})`;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = shadowBlur / 3;
      }

      const scale = fgScale / 100;
      const w = fgBitmap.width * scale;
      const h = fgBitmap.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;

      if (feather > 0) {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = fgBitmap.width;
        tmpCanvas.height = fgBitmap.height;
        const tmpCtx = tmpCanvas.getContext('2d')!;
        tmpCtx.filter = `blur(${feather}px)`;
        tmpCtx.drawImage(fgBitmap, 0, 0);
        tmpCtx.filter = 'none';
        tmpCtx.globalCompositeOperation = 'source-in';
        tmpCtx.drawImage(fgBitmap, 0, 0);
        ctx.drawImage(tmpCanvas, x, y, w, h);
      } else {
        ctx.drawImage(fgBitmap, x, y, w, h);
      }

      if (shadowEnabled) ctx.restore();
      fgBitmap.close();

      const isTransparent = bgMode === 'transparent';
      const fmt = isTransparent && outputFormat === 'image/jpeg' ? 'image/png' as const : outputFormat;
      const blob = await canvasToBlob(canvas, fmt, fmt === 'image/png' ? undefined : quality);

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultBlob(blob);
      setStatus('complete');
      toast.success('Background changed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setStatus('error');
    }
  }, [file, foregroundBlob, buildBackgroundCanvas, fgScale, feather, shadowEnabled, shadowOpacity, shadowBlur, outputFormat, quality, bgMode, resultUrl]);

  const handleDownload = useCallback(() => {
    if (!resultBlob || !file) return;
    const ext = getFormatExtension(outputFormat);
    downloadBlobFile(resultBlob, `${stripBasename(file.name)}_new-bg.${ext}`);
  }, [resultBlob, file, outputFormat]);

  const handleReset = useCallback(() => {
    if (file) revokeImageUrls([file]);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
    setFile(null);
    setForegroundBlob(null);
    setResultUrl(null);
    setResultBlob(null);
    setBgImageFile(null);
    setBgImageUrl(null);
    setStatus('idle');
    setError(null);
  }, [file, resultUrl, bgImageUrl]);

  const isProcessing = status === 'loading-model' || status === 'processing';

  return (
    <main className="container max-w-4xl py-8 px-4">
      <PageSeo
        title="Change Background — AI Background Replacer | FilePilot"
        description="Replace image backgrounds with solid colours, gradients, blur, or custom images using AI — all in your browser."
      />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <Replace className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Change Background</h1>
        </div>
        <p className="text-muted-foreground">
          Remove the original background and replace it with a colour, gradient, blur, or custom image.
        </p>
      </div>

      {!file && (
        <FileUploader
          onFilesSelected={handleFileSelected}
          accept="image/*"
          description="Upload an image to change its background"
          hint="Supports JPEG, PNG, and WebP. The AI model downloads to your browser on first use."
        />
      )}

      {file && (
        <div className="space-y-6">
          {/* Preview */}
          <div className="rounded-lg border border-border overflow-hidden bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]">
            <img
              src={resultUrl ?? file.previewUrl}
              alt={resultUrl ? 'Result' : 'Original'}
              className="block w-full h-auto mx-auto"
              style={{ maxHeight: 450, objectFit: 'contain' }}
            />
          </div>

          {isProcessing && (
            <ToolStateMessage state="loading" title={progress.message ?? 'Processing...'}>
              <div className="mt-2 h-2 rounded-full bg-blue-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress.progress}%` }} />
              </div>
            </ToolStateMessage>
          )}

          {error && <ToolStateMessage state="error" title="Error">{error}</ToolStateMessage>}

          {/* Background mode selection */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Background</h3>
            <div className="flex flex-wrap gap-2">
              {(['transparent', 'solid', 'gradient', 'blur', 'preset', 'image'] as BgMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBgMode(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                    bgMode === mode ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'
                  }`}
                  disabled={isProcessing}
                >
                  {mode === 'transparent' ? 'Transparent' :
                   mode === 'solid' ? 'Solid Colour' :
                   mode === 'gradient' ? 'Gradient' :
                   mode === 'blur' ? 'Blur Original' :
                   mode === 'preset' ? 'Presets' :
                   'Custom Image'}
                </button>
              ))}
            </div>

            {bgMode === 'solid' && (
              <div className="flex items-center gap-3">
                <input type="color" value={solidColor} onChange={(e) => setSolidColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border" disabled={isProcessing} />
                <span className="text-sm text-muted-foreground">{solidColor}</span>
              </div>
            )}

            {bgMode === 'gradient' && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs mb-1">Start</label>
                  <input type="color" value={gradientStart} onChange={(e) => setGradientStart(e.target.value)} className="h-9 w-full cursor-pointer rounded border" disabled={isProcessing} />
                </div>
                <div>
                  <label className="block text-xs mb-1">End</label>
                  <input type="color" value={gradientEnd} onChange={(e) => setGradientEnd(e.target.value)} className="h-9 w-full cursor-pointer rounded border" disabled={isProcessing} />
                </div>
                <div>
                  <label className="block text-xs mb-1">Angle: {gradientAngle}°</label>
                  <input type="range" min="0" max="360" value={gradientAngle} onChange={(e) => setGradientAngle(parseInt(e.target.value))} className="w-full" disabled={isProcessing} />
                </div>
              </div>
            )}

            {bgMode === 'blur' && (
              <div>
                <label className="block text-sm mb-1">Blur Intensity: {blurIntensity}px</label>
                <input type="range" min="5" max="50" value={blurIntensity} onChange={(e) => setBlurIntensity(parseInt(e.target.value))} className="w-full" disabled={isProcessing} />
              </div>
            )}

            {bgMode === 'preset' && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_BACKGROUNDS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`relative h-16 rounded-lg border-2 transition overflow-hidden ${
                      selectedPreset === preset.id ? 'border-foreground ring-2 ring-foreground/20' : 'border-border hover:border-foreground/50'
                    }`}
                    style={{
                      background: preset.type === 'gradient' ? preset.value : preset.value,
                    }}
                    disabled={isProcessing}
                    title={preset.label}
                  >
                    <span className="absolute bottom-0.5 left-0 right-0 text-[10px] font-medium text-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)', color: 'white' }}>
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {bgMode === 'image' && (
              <div>
                <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgImageSelected} />
                <button
                  onClick={() => bgFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm hover:bg-muted transition"
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4" />
                  {bgImageFile ? bgImageFile.name : 'Upload background image'}
                </button>
                {bgImageUrl && (
                  <img src={bgImageUrl} alt="Background" className="mt-2 h-20 rounded border object-cover" />
                )}
              </div>
            )}
          </div>

          {/* Foreground controls */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Foreground</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm mb-1">Scale: {fgScale}%</label>
                <input type="range" min="50" max="150" value={fgScale} onChange={(e) => setFgScale(parseInt(e.target.value))} className="w-full" disabled={isProcessing} />
              </div>
              <div>
                <label className="block text-sm mb-1">Edge Feather: {feather}px</label>
                <input type="range" min="0" max="8" value={feather} onChange={(e) => setFeather(parseInt(e.target.value))} className="w-full" disabled={isProcessing} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={shadowEnabled} onChange={(e) => setShadowEnabled(e.target.checked)} className="rounded" disabled={isProcessing} />
                Drop shadow
              </label>
              {shadowEnabled && (
                <>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Opacity: {Math.round(shadowOpacity * 100)}%</label>
                    <input type="range" min="0.1" max="0.8" step="0.05" value={shadowOpacity} onChange={(e) => setShadowOpacity(parseFloat(e.target.value))} className="w-full" disabled={isProcessing} />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Blur: {shadowBlur}px</label>
                    <input type="range" min="5" max="50" value={shadowBlur} onChange={(e) => setShadowBlur(parseInt(e.target.value))} className="w-full" disabled={isProcessing} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Output settings */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Output</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm mb-1">Format</label>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as OutputFormatOption)} disabled={isProcessing}>
                  <option value="image/png">PNG</option>
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

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleProcess}
              disabled={isProcessing || isCapable === false}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Replace className="h-4 w-4" />}
              {isProcessing ? 'Processing…' : foregroundBlob ? 'Update Background' : 'Change Background'}
            </button>

            {status === 'complete' && (
              <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition">
                <Download className="h-4 w-4" /> Download
              </button>
            )}

            <button onClick={handleReset} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition">
              <RefreshCw className="h-4 w-4" /> Start Over
            </button>
          </div>

          <ToolStateMessage state="hint">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Images are processed locally in your browser and are not uploaded. Edge accuracy depends on the original image complexity.</p>
            </div>
          </ToolStateMessage>
        </div>
      )}
    </main>
  );
};
