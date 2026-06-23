import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, formatFileSize } from '../utils/image/support';
import { cropAndResizeCanvas, exportCanvas, generateOutputFilename } from '../utils/image/canvas';
import { downloadBlobFile } from '../utils/pdf/export';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import {
  Crop, Sparkles, Download, Loader2, RefreshCw, AlertTriangle, ZoomIn, ZoomOut,
} from 'lucide-react';

interface AspectPreset {
  label: string;
  ratio: number | null;
}

const ASPECT_PRESETS: AspectPreset[] = [
  { label: 'Free', ratio: null },
  { label: '1:1 Square', ratio: 1 },
  { label: '4:5 Instagram Portrait', ratio: 4 / 5 },
  { label: '16:9 Landscape', ratio: 16 / 9 },
  { label: '9:16 Story', ratio: 9 / 16 },
  { label: '3:2 Photo', ratio: 3 / 2 },
  { label: '2:3 Portrait', ratio: 2 / 3 },
  { label: '4:3 Standard', ratio: 4 / 3 },
  { label: '3:4 Portrait', ratio: 3 / 4 },
];

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const CropImage = () => {
  const [file, setFile] = useState<ImageFileInfo | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [aspectPreset, setAspectPreset] = useState(0);
  const [customRatioW, setCustomRatioW] = useState('');
  const [customRatioH, setCustomRatioH] = useState('');
  const [outputW, setOutputW] = useState('');
  const [outputH, setOutputH] = useState('');
  const [doNotUpscale, setDoNotUpscale] = useState(true);
  const [zoom, setZoom] = useState(1);

  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, w: 100, h: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });

  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
  }, []);

  useEffect(() => {
    return () => {
      if (file) revokeImageUrls([file]);
    };
  }, [file]);

  const initCrop = useCallback((info: ImageFileInfo) => {
    const ratio = ASPECT_PRESETS[aspectPreset].ratio;
    let w = info.width;
    let h = info.height;
    if (ratio) {
      if (info.width / info.height > ratio) {
        w = Math.round(info.height * ratio);
      } else {
        h = Math.round(info.width / ratio);
      }
    }
    setCrop({ x: Math.round((info.width - w) / 2), y: Math.round((info.height - h) / 2), w, h });
    setZoom(1);
  }, [aspectPreset]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    setError(null);
    try {
      const info = await loadImageFile(files[0]);
      if (file) revokeImageUrls([file]);
      setFile(info);
      initCrop(info);
    } catch {
      toast.error('Failed to load image');
    }
  }, [file, initCrop]);

  const enforceAspect = useCallback((box: CropBox, aspect: number | null, imgW: number, imgH: number): CropBox => {
    let { x, y, w, h } = box;
    w = Math.max(10, Math.min(w, imgW));
    h = Math.max(10, Math.min(h, imgH));
    if (aspect) {
      if (w / h > aspect) {
        w = Math.round(h * aspect);
      } else {
        h = Math.round(w / aspect);
      }
    }
    x = Math.max(0, Math.min(x, imgW - w));
    y = Math.max(0, Math.min(y, imgH - h));
    return { x, y, w, h };
  }, []);

  const getActiveAspect = useCallback((): number | null => {
    const preset = ASPECT_PRESETS[aspectPreset];
    if (preset.ratio) return preset.ratio;
    const cw = parseFloat(customRatioW);
    const ch = parseFloat(customRatioH);
    if (cw > 0 && ch > 0) return cw / ch;
    return null;
  }, [aspectPreset, customRatioW, customRatioH]);

  const getDisplayScale = useCallback((): number => {
    if (!containerRef.current || !file) return 1;
    const maxW = containerRef.current.clientWidth - 32;
    const maxH = 500;
    return Math.min(1, maxW / (file.width * zoom), maxH / (file.height * zoom));
  }, [file, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: typeof dragMode) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(mode);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCropStart({ ...crop });
  }, [crop]);

  useEffect(() => {
    if (!isDragging || !file) return;

    const scale = getDisplayScale() * zoom;
    const aspect = getActiveAspect();

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      let next = { ...cropStart };

      if (dragMode === 'move') {
        next.x = cropStart.x + dx;
        next.y = cropStart.y + dy;
      } else {
        if (dragMode?.includes('w')) { next.x = cropStart.x + dx; next.w = cropStart.w - dx; }
        if (dragMode?.includes('e') && !dragMode?.includes('w')) { next.w = cropStart.w + dx; }
        if (dragMode?.includes('n')) { next.y = cropStart.y + dy; next.h = cropStart.h - dy; }
        if (dragMode?.includes('s') && !dragMode?.includes('n')) { next.h = cropStart.h + dy; }
      }

      next = enforceAspect(next, aspect, file.width, file.height);
      setCrop(next);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, cropStart, dragMode, file, getDisplayScale, zoom, getActiveAspect, enforceAspect]);

  useEffect(() => {
    if (!file) return;
    const aspect = getActiveAspect();
    setCrop((prev) => enforceAspect(prev, aspect, file.width, file.height));
  }, [aspectPreset, customRatioW, customRatioH, file, getActiveAspect, enforceAspect]);

  const handleCrop = useCallback(async () => {
    if (!file) return;
    setIsExporting(true);
    setError(null);
    try {
      const bitmap = await createImageBitmap(file.file);
      let outW = crop.w;
      let outH = crop.h;

      const parsedW = parseInt(outputW);
      const parsedH = parseInt(outputH);
      if (parsedW > 0 && parsedH > 0) {
        outW = parsedW;
        outH = parsedH;
        if (doNotUpscale) {
          outW = Math.min(outW, crop.w);
          outH = Math.min(outH, crop.h);
        }
      }

      const canvas = cropAndResizeCanvas(bitmap, { x: crop.x, y: crop.y, width: crop.w, height: crop.h }, outW, outH);
      bitmap.close();

      const blob = await exportCanvas(canvas, outputFormat, quality, bgColor);
      const filename = generateOutputFilename(file.name, '_cropped', outputFormat);
      downloadBlobFile(blob, filename);
      toast.success('Cropped image downloaded');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(msg);
      toast.error('Crop failed');
    } finally {
      setIsExporting(false);
    }
  }, [file, crop, outputFormat, quality, bgColor, outputW, outputH, doNotUpscale]);

  const handleReset = useCallback(() => {
    if (file) {
      initCrop(file);
    }
  }, [file, initCrop]);

  const handleClear = useCallback(() => {
    if (file) revokeImageUrls([file]);
    setFile(null);
    setError(null);
  }, [file]);

  const displayScale = getDisplayScale();
  const showUpscaleWarning = (() => {
    const parsedW = parseInt(outputW);
    const parsedH = parseInt(outputH);
    if (parsedW > 0 && parsedH > 0) {
      return (parsedW > crop.w || parsedH > crop.h) && !doNotUpscale;
    }
    return false;
  })();

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Crop Image Online - Free Browser-Based Image Cropper"
        description="Crop JPEG, PNG, and WebP images with precision. Interactive crop editor with aspect ratio presets. Free, private, no uploads."
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
              <Crop className="w-6 h-6" />
            </div>
          </div>
          <h1>Crop Image</h1>
          <p>Select and extract a rectangular area from your image.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Files are processed locally in your browser and are not uploaded.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {!file ? (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <FileUploader
                onFilesSelected={handleFileSelected}
                accept="image/*"
                multiple={false}
                description="Drop an image to crop"
              />
            </div>
          ) : (
            <>
              {/* Crop Editor */}
              <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-bold">Crop Editor</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {file.width} × {file.height} px
                    </span>
                    <button onClick={handleReset} className="btn btn-outline text-xs py-1.5 px-3">
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Crop
                    </button>
                    <button onClick={handleClear} className="btn btn-outline text-xs py-1.5 px-3 text-[var(--error)]">
                      Clear
                    </button>
                  </div>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                    className="p-1.5 hover:bg-muted rounded-lg"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min={0.25}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-foreground"
                    aria-label="Zoom level"
                  />
                  <button
                    onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                    className="p-1.5 hover:bg-muted rounded-lg"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground w-12 text-right">{Math.round(zoom * 100)}%</span>
                </div>

                {/* Image + crop overlay */}
                <div
                  ref={containerRef}
                  className="relative overflow-auto bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_0_0/20px_20px] rounded-xl border border-border"
                  style={{ maxHeight: 540 }}
                >
                  <div
                    className="relative inline-block"
                    style={{
                      width: file.width * displayScale * zoom,
                      height: file.height * displayScale * zoom,
                    }}
                  >
                    <img
                      ref={imgRef}
                      src={file.previewUrl}
                      alt="Source"
                      className="block w-full h-full"
                      draggable={false}
                      style={{ imageRendering: zoom > 2 ? 'pixelated' : 'auto' }}
                    />

                    {/* Dark overlay outside crop */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45))`,
                        clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${(crop.x / file.width) * 100}% ${(crop.y / file.height) * 100}%, ${(crop.x / file.width) * 100}% ${((crop.y + crop.h) / file.height) * 100}%, ${((crop.x + crop.w) / file.width) * 100}% ${((crop.y + crop.h) / file.height) * 100}%, ${((crop.x + crop.w) / file.width) * 100}% ${(crop.y / file.height) * 100}%, ${(crop.x / file.width) * 100}% ${(crop.y / file.height) * 100}%)`,
                      }}
                    />

                    {/* Crop box */}
                    <div
                      className="absolute border-2 border-white shadow-lg cursor-move"
                      style={{
                        left: crop.x * displayScale * zoom,
                        top: crop.y * displayScale * zoom,
                        width: crop.w * displayScale * zoom,
                        height: crop.h * displayScale * zoom,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'move')}
                    >
                      {/* Rule of thirds grid */}
                      <div className="absolute inset-0 pointer-events-none opacity-40">
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
                      </div>

                      {/* Resize handles */}
                      {(['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'] as const).map((handle) => {
                        const posMap: Record<string, React.CSSProperties> = {
                          nw: { top: -5, left: -5, cursor: 'nw-resize' },
                          ne: { top: -5, right: -5, cursor: 'ne-resize' },
                          sw: { bottom: -5, left: -5, cursor: 'sw-resize' },
                          se: { bottom: -5, right: -5, cursor: 'se-resize' },
                          n: { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
                          s: { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
                          e: { right: -5, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' },
                          w: { left: -5, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' },
                        };
                        return (
                          <div
                            key={handle}
                            className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm shadow"
                            style={{ ...posMap[handle], position: 'absolute' }}
                            onMouseDown={(e) => handleMouseDown(e, handle)}
                          />
                        );
                      })}
                    </div>

                    {/* Crop dimensions label */}
                    <div
                      className="absolute text-xs bg-black/70 text-white px-2 py-0.5 rounded pointer-events-none"
                      style={{
                        left: crop.x * displayScale * zoom,
                        top: (crop.y + crop.h) * displayScale * zoom + 4,
                      }}
                    >
                      {Math.round(crop.w)} × {Math.round(crop.h)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
                {/* Aspect Ratio */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">Aspect Ratio</label>
                  <div className="flex flex-wrap gap-2">
                    {ASPECT_PRESETS.map((p, i) => (
                      <button
                        key={p.label}
                        onClick={() => setAspectPreset(i)}
                        className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                          aspectPreset === i
                            ? 'border-foreground bg-muted text-foreground'
                            : 'border-border hover:border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom ratio */}
                {aspectPreset === 0 && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Custom Width Ratio</label>
                      <input
                        type="number"
                        min={1}
                        placeholder="e.g. 16"
                        value={customRatioW}
                        onChange={(e) => setCustomRatioW(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Custom Height Ratio</label>
                      <input
                        type="number"
                        min={1}
                        placeholder="e.g. 9"
                        value={customRatioH}
                        onChange={(e) => setCustomRatioH(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                    </div>
                  </div>
                )}

                {/* Output dimensions */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                    Output Size (px) <span className="font-normal text-muted-foreground">— optional, defaults to crop size</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      min={1}
                      placeholder={`Width (${Math.round(crop.w)})`}
                      value={outputW}
                      onChange={(e) => setOutputW(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                    <input
                      type="number"
                      min={1}
                      placeholder={`Height (${Math.round(crop.h)})`}
                      value={outputH}
                      onChange={(e) => setOutputH(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={doNotUpscale}
                    onChange={(e) => setDoNotUpscale(e.target.checked)}
                    className="w-5 h-5 rounded border-border accent-foreground"
                  />
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text)]">
                    Do not upscale (cap output to crop dimensions)
                  </span>
                </label>

                {showUpscaleWarning && (
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-amber-200">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>The output dimensions are larger than the crop area. The image will be enlarged, which may reduce quality.</p>
                  </div>
                )}

                {/* Format + Quality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Output Format</label>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as ImageFormat)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      <option value="image/jpeg">JPEG</option>
                      <option value="image/png">PNG</option>
                      {supportedFormats?.['image/webp'] && <option value="image/webp">WebP</option>}
                    </select>
                  </div>
                  {outputFormat !== 'image/png' && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                        Quality: {Math.round(quality * 100)}%
                      </label>
                      <input
                        type="range"
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full accent-foreground"
                      />
                    </div>
                  )}
                </div>

                {/* JPEG bg color */}
                {outputFormat === 'image/jpeg' && file.hasTransparency && (
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-amber-200 animate-fade-in">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Transparent areas will be filled with a background color.</p>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                          aria-label="Background color"
                        />
                        <span className="text-sm font-medium">{bgColor}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info bar */}
                <div className="bg-muted/40 rounded-xl px-4 py-3 text-xs text-muted-foreground">
                  Original: {file.width} × {file.height} ({formatFileSize(file.originalSize)})
                  &nbsp;&middot;&nbsp;
                  Crop: {Math.round(crop.w)} × {Math.round(crop.h)} px
                  {outputW && outputH && (
                    <> &nbsp;&middot;&nbsp; Output: {outputW} × {outputH} px</>
                  )}
                </div>

                {error && (
                  <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCrop}
                    disabled={isExporting}
                    className={`btn btn-primary flex-1 py-4 text-base ${isExporting ? 'opacity-75 cursor-wait' : ''}`}
                  >
                    {isExporting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Exporting...</>
                    ) : (
                      <><Download className="w-5 h-5" /> Download Cropped Image</>
                    )}
                  </button>
                  <button onClick={handleClear} className="btn btn-outline py-4 text-base sm:flex-none sm:px-6">
                    <RefreshCw className="w-5 h-5" /> Start Over
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
