import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, formatFileSize } from '../utils/image/support';
import {
  renderBitmapToCanvas, exportCanvas, generateOutputFilename,
  applyTextWatermark, applyImageWatermark,
  type WatermarkPosition,
} from '../utils/image/canvas';
import { downloadBlobFile, downloadZipFromEntries } from '../utils/pdf/export';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import { FAQSection } from '../components/FAQSection';
import {
  Droplets, Sparkles, Download, Loader2, Trash2, Archive, RefreshCw,
  AlertTriangle, Type, Image as ImageIcon, Info,
} from 'lucide-react';

type WatermarkType = 'text' | 'image';

const POSITION_OPTIONS: { label: string; value: WatermarkPosition }[] = [
  { label: 'Top Left', value: 'top-left' },
  { label: 'Top Center', value: 'top-center' },
  { label: 'Top Right', value: 'top-right' },
  { label: 'Center Left', value: 'center-left' },
  { label: 'Center', value: 'center' },
  { label: 'Center Right', value: 'center-right' },
  { label: 'Bottom Left', value: 'bottom-left' },
  { label: 'Bottom Center', value: 'bottom-center' },
  { label: 'Bottom Right', value: 'bottom-right' },
];

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Impact', 'Trebuchet MS', 'Palatino', 'sans-serif',
];

export const WatermarkImage = () => {
  const [files, setFiles] = useState<ImageFileInfo[]>([]);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [bgColor] = useState('#ffffff');

  const [wmType, setWmType] = useState<WatermarkType>('text');

  // Text options
  const [text, setText] = useState('Sample Watermark');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(48);
  const [fontWeight, setFontWeight] = useState('bold');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textOpacity, setTextOpacity] = useState(0.5);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textShadow, setTextShadow] = useState(true);

  // Image watermark options
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoSizePercent, setLogoSizePercent] = useState(20);
  const [logoOpacity, setLogoOpacity] = useState(0.6);
  const [logoPlate, setLogoPlate] = useState<'none' | 'white' | 'black'>('none');

  // Shared positioning
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [margin, setMargin] = useState(20);
  const [rotation, setRotation] = useState(0);
  const [repeated, setRepeated] = useState(false);
  const [repeatSpacing, setRepeatSpacing] = useState(100);
  const [repeatAngle, setRepeatAngle] = useState(-30);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
  }, []);

  useEffect(() => {
    return () => {
      revokeImageUrls(files);
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [files, logoPreviewUrl]);

  // Live preview
  useEffect(() => {
    if (files.length === 0 || !previewCanvasRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const info = files[0];
        const maxDim = 600;
        const scale = Math.min(1, maxDim / info.width, maxDim / info.height);
        const pw = Math.round(info.width * scale);
        const ph = Math.round(info.height * scale);

        const bitmap = await createImageBitmap(info.file);
        if (cancelled) { bitmap.close(); return; }

        const canvas = renderBitmapToCanvas(bitmap, pw, ph);
        bitmap.close();

        if (wmType === 'text' && text.trim()) {
          applyTextWatermark(canvas, {
            text, fontFamily, fontSize: Math.round(fontSize * scale), fontWeight,
            color: textColor, opacity: textOpacity, letterSpacing: letterSpacing * scale,
            shadow: textShadow, position, margin: Math.round(margin * scale),
            rotation, repeated, repeatSpacing: Math.round(repeatSpacing * scale),
            repeatAngle,
          });
        } else if (wmType === 'image' && logoFile) {
          const logoBitmap = await createImageBitmap(logoFile);
          if (cancelled) { logoBitmap.close(); return; }
          applyImageWatermark(canvas, {
            image: logoBitmap, sizePercent: logoSizePercent, opacity: logoOpacity,
            position, margin: Math.round(margin * scale), rotation,
            repeated, repeatSpacing: Math.round(repeatSpacing * scale),
            repeatAngle, backgroundPlate: logoPlate,
          });
          logoBitmap.close();
        }

        if (!cancelled && previewCanvasRef.current) {
          const ctx = previewCanvasRef.current.getContext('2d')!;
          previewCanvasRef.current.width = canvas.width;
          previewCanvasRef.current.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        }
      } catch {
        // Preview generation failed silently
      }
    })();

    return () => { cancelled = true; };
  }, [
    files, wmType, text, fontFamily, fontSize, fontWeight, textColor, textOpacity,
    letterSpacing, textShadow, logoFile, logoSizePercent, logoOpacity, logoPlate,
    position, margin, rotation, repeated, repeatSpacing, repeatAngle,
  ]);

  const handleFilesSelected = useCallback(async (selected: File[]) => {
    setError(null);
    const infos: ImageFileInfo[] = [];
    for (const f of selected) {
      try { infos.push(await loadImageFile(f)); } catch { toast.error(`Failed to load ${f.name}`); }
    }
    if (infos.length > 0) setFiles((prev) => [...prev, ...infos]);
  }, []);

  const handleLogoSelected = useCallback((selected: File[]) => {
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    const f = selected[0];
    setLogoFile(f);
    setLogoPreviewUrl(URL.createObjectURL(f));
  }, [logoPreviewUrl]);

  const handleExport = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);
    setError(null);

    try {
      let logoBitmap: ImageBitmap | null = null;
      if (wmType === 'image' && logoFile) {
        logoBitmap = await createImageBitmap(logoFile);
      }

      const blobs: Array<{ filename: string; data: Blob }> = [];

      for (let i = 0; i < files.length; i++) {
        setProcessedCount(i + 1);
        const info = files[i];
        const bitmap = await createImageBitmap(info.file);
        const canvas = renderBitmapToCanvas(bitmap);
        bitmap.close();

        if (wmType === 'text' && text.trim()) {
          applyTextWatermark(canvas, {
            text, fontFamily, fontSize, fontWeight,
            color: textColor, opacity: textOpacity, letterSpacing,
            shadow: textShadow, position, margin, rotation,
            repeated, repeatSpacing, repeatAngle,
          });
        } else if (wmType === 'image' && logoBitmap) {
          applyImageWatermark(canvas, {
            image: logoBitmap, sizePercent: logoSizePercent, opacity: logoOpacity,
            position, margin, rotation,
            repeated, repeatSpacing, repeatAngle, backgroundPlate: logoPlate,
          });
        }

        const blob = await exportCanvas(canvas, outputFormat, quality, bgColor);
        const filename = generateOutputFilename(info.name, '_watermarked', outputFormat);
        blobs.push({ filename, data: blob });
      }

      logoBitmap?.close();

      if (blobs.length === 1) {
        downloadBlobFile(blobs[0].data, blobs[0].filename);
        toast.success('Watermarked image downloaded');
      } else {
        await downloadZipFromEntries(blobs, 'watermarked-images.zip');
        toast.success(`${blobs.length} images downloaded as ZIP`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(msg);
      toast.error('Export failed');
    } finally {
      setIsProcessing(false);
    }
  }, [
    files, wmType, text, fontFamily, fontSize, fontWeight, textColor, textOpacity,
    letterSpacing, textShadow, logoFile, logoSizePercent, logoOpacity, logoPlate,
    position, margin, rotation, repeated, repeatSpacing, repeatAngle,
    outputFormat, quality, bgColor,
  ]);

  const handleReset = useCallback(() => {
    revokeImageUrls(files);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setFiles([]);
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setError(null);
  }, [files, logoPreviewUrl]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed) revokeImageUrls([removed]);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const faqItems = [
    { question: "What types of watermarks can I add?", answer: "You can add text watermarks with custom font, size, color, and shadow, or image/logo watermarks from an uploaded PNG, JPEG, or WebP file. Both types support adjustable position and opacity." },
    { question: "Can I control the transparency of the watermark?", answer: "Yes. An opacity slider lets you set the watermark transparency from 5% to 100%. This works for both text and image watermarks." },
    { question: "Can I watermark multiple images at once?", answer: "Yes. You can upload multiple images and apply the same watermark settings to all of them in a single batch. Results are downloaded individually or as a ZIP archive." },
    { question: "Are my images uploaded to a server?", answer: "No. All watermarking is performed locally in your browser. Your images and logo files are never uploaded, ensuring complete privacy." },
  ];

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Watermark Image Online - Add Text or Logo Watermarks"
        description="Add text or image watermarks to photos with adjustable position, opacity, and repeat patterns. Free, private, no uploads."
        faqItems={faqItems}
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white flex items-center justify-center shadow-lg">
              <Droplets className="w-6 h-6" />
            </div>
          </div>
          <h1>Watermark Image</h1>
          <p>Add text or image watermarks to your photos.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Files are processed locally in your browser and are not uploaded.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Upload */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            {files.length === 0 ? (
              <FileUploader onFilesSelected={handleFilesSelected} accept="image/*" multiple description="Drop images to watermark" />
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
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.map((info) => (
                    <div key={info.id} className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2">
                      <img src={info.previewUrl} alt={info.name} className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{info.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(info.originalSize)} &middot; {info.width}×{info.height}</p>
                      </div>
                      <button onClick={() => removeFile(info.id)} className="p-1.5 hover:bg-background rounded-full text-muted-foreground hover:text-[var(--error)] shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Settings */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in">
                {/* Type selector */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Watermark Type</label>
                  <div className="flex gap-3">
                    <button onClick={() => setWmType('text')} className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${wmType === 'text' ? 'border-foreground bg-muted text-foreground' : 'border-border text-muted-foreground'}`}>
                      <Type className="w-4 h-4" /> Text
                    </button>
                    <button onClick={() => setWmType('image')} className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${wmType === 'image' ? 'border-foreground bg-muted text-foreground' : 'border-border text-muted-foreground'}`}>
                      <ImageIcon className="w-4 h-4" /> Image/Logo
                    </button>
                  </div>
                </div>

                {wmType === 'text' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Text</label>
                      <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20" placeholder="Your watermark text" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">Font</label>
                        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20">
                          {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">Size: {fontSize}px</label>
                        <input type="range" min={12} max={200} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full accent-foreground" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">Weight</label>
                        <select value={fontWeight} onChange={(e) => setFontWeight(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20">
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="lighter">Light</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                          <span className="text-xs">{textColor}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Opacity: {Math.round(textOpacity * 100)}%</label>
                      <input type="range" min={0.05} max={1} step={0.05} value={textOpacity} onChange={(e) => setTextOpacity(parseFloat(e.target.value))} className="w-full accent-foreground" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Letter Spacing: {letterSpacing}px</label>
                      <input type="range" min={0} max={20} value={letterSpacing} onChange={(e) => setLetterSpacing(parseInt(e.target.value))} className="w-full accent-foreground" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={textShadow} onChange={(e) => setTextShadow(e.target.checked)} className="w-4 h-4 rounded accent-foreground" />
                      <span className="text-sm">Text shadow</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Logo / Watermark Image</label>
                      {logoPreviewUrl ? (
                        <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
                          <img src={logoPreviewUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg border border-border" />
                          <span className="text-sm font-medium flex-1 truncate">{logoFile?.name}</span>
                          <button onClick={() => { if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl); setLogoFile(null); setLogoPreviewUrl(null); }} className="p-1.5 hover:bg-background rounded-full text-muted-foreground hover:text-[var(--error)]">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file'; input.accept = 'image/png,image/webp,image/jpeg';
                            input.onchange = () => { if (input.files) handleLogoSelected(Array.from(input.files)); };
                            input.click();
                          }}
                          className="w-full py-4 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-muted-foreground transition-colors"
                        >
                          Click to upload logo image
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Size: {logoSizePercent}% of image width</label>
                      <input type="range" min={5} max={80} value={logoSizePercent} onChange={(e) => setLogoSizePercent(parseInt(e.target.value))} className="w-full accent-foreground" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Opacity: {Math.round(logoOpacity * 100)}%</label>
                      <input type="range" min={0.05} max={1} step={0.05} value={logoOpacity} onChange={(e) => setLogoOpacity(parseFloat(e.target.value))} className="w-full accent-foreground" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Background Plate</label>
                      <select value={logoPlate} onChange={(e) => setLogoPlate(e.target.value as 'none' | 'white' | 'black')} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20">
                        <option value="none">None</option>
                        <option value="white">White</option>
                        <option value="black">Black</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Position & Layout */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Position</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {POSITION_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPosition(p.value)}
                        className={`py-2 text-xs rounded-lg border transition-all ${position === p.value ? 'border-foreground bg-muted font-bold' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Margin: {margin}px</label>
                    <input type="range" min={0} max={200} value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} className="w-full accent-foreground" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Rotation: {rotation}°</label>
                    <input type="range" min={-180} max={180} value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full accent-foreground" />
                  </div>
                </div>

                {/* Repeat pattern */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={repeated} onChange={(e) => setRepeated(e.target.checked)} className="w-4 h-4 rounded accent-foreground" />
                  <span className="text-sm font-medium">Repeated pattern</span>
                </label>
                {repeated && (
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Spacing: {repeatSpacing}px</label>
                      <input type="range" min={20} max={400} value={repeatSpacing} onChange={(e) => setRepeatSpacing(parseInt(e.target.value))} className="w-full accent-foreground" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Angle: {repeatAngle}°</label>
                      <input type="range" min={-90} max={90} value={repeatAngle} onChange={(e) => setRepeatAngle(parseInt(e.target.value))} className="w-full accent-foreground" />
                    </div>
                  </div>
                )}

                {/* Output */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Format</label>
                    <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as ImageFormat)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20">
                      <option value="image/jpeg">JPEG</option>
                      <option value="image/png">PNG</option>
                      {supportedFormats?.['image/webp'] && <option value="image/webp">WebP</option>}
                    </select>
                  </div>
                  {outputFormat !== 'image/png' && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Quality: {Math.round(quality * 100)}%</label>
                      <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full accent-foreground" />
                    </div>
                  )}
                </div>

                {/* Warning */}
                <div className="bg-blue-50 text-blue-700 p-3 rounded-xl flex items-start gap-2 text-xs border border-blue-100">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Watermarking adds visible branding but does not prevent screenshots or copying.</p>
                </div>

                {error && (
                  <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleExport}
                    disabled={isProcessing || (wmType === 'text' && !text.trim()) || (wmType === 'image' && !logoFile)}
                    className={`btn btn-primary py-4 text-base w-full ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Processing {processedCount}/{files.length}...</>
                    ) : files.length > 1 ? (
                      <><Archive className="w-5 h-5" /> Download All as ZIP</>
                    ) : (
                      <><Download className="w-5 h-5" /> Download Watermarked Image</>
                    )}
                  </button>
                  <button onClick={handleReset} className="btn btn-outline py-3 text-sm">
                    <RefreshCw className="w-4 h-4" /> Start Over
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-fade-in">
                <h3 className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Live Preview</h3>
                <div className="bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_0_0/20px_20px] rounded-xl border border-border flex items-center justify-center p-4 min-h-[300px]">
                  <canvas ref={previewCanvasRef} className="max-w-full max-h-[500px] rounded-lg shadow" />
                </div>
              </div>
            </div>
          )}
        </div>

        <FAQSection items={faqItems} />
      </div>
    </div>
  );
};
