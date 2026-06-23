import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, formatFileSize } from '../utils/image/support';
import {
  renderBitmapToCanvas, exportCanvas, generateOutputFilename,
  applyBlurRegions, hasFaceDetectorSupport, detectFaces,
  type BlurRegion,
} from '../utils/image/canvas';
import { downloadBlobFile } from '../utils/pdf/export';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import {
  Eraser, Sparkles, Download, Loader2, RefreshCw, AlertTriangle,
  Plus, Trash2, Undo2, Redo2, Info, Eye, Square, Circle,
} from 'lucide-react';

type BlurStyle = BlurRegion['style'];
type BlurShape = BlurRegion['shape'];

let regionIdCounter = 0;
function nextRegionId(): string {
  return `region-${++regionIdCounter}`;
}

export const BlurFace = () => {
  const [file, setFile] = useState<ImageFileInfo | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [bgColor, setBgColor] = useState('#ffffff');

  const [regions, setRegions] = useState<BlurRegion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blurStyle, setBlurStyle] = useState<BlurStyle>('blur');
  const [blurShape, setBlurShape] = useState<BlurShape>('rect');
  const [blurIntensity, setBlurIntensity] = useState(15);

  const [history, setHistory] = useState<BlurRegion[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [showOriginal, setShowOriginal] = useState(false);
  const [hasFaceApi, setHasFaceApi] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
    setHasFaceApi(hasFaceDetectorSupport());
  }, []);

  useEffect(() => {
    return () => {
      if (file) revokeImageUrls([file]);
    };
  }, [file]);

  const pushRegionHistory = useCallback((next: BlurRegion[]) => {
    setRegions(next);
    setHistory((h) => [...h.slice(0, historyIdx + 1), next]);
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      const idx = historyIdx - 1;
      setHistoryIdx(idx);
      setRegions(history[idx]);
      setSelectedId(null);
    }
  }, [historyIdx, history]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const idx = historyIdx + 1;
      setHistoryIdx(idx);
      setRegions(history[idx]);
    }
  }, [historyIdx, history]);

  const getDisplayScale = useCallback((): number => {
    if (!containerRef.current || !file) return 1;
    const maxW = containerRef.current.clientWidth - 16;
    const maxH = 550;
    return Math.min(1, maxW / file.width, maxH / file.height);
  }, [file]);

  // Preview rendering
  useEffect(() => {
    if (!file || !canvasRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const bitmap = await createImageBitmap(file.file);
        if (cancelled) { bitmap.close(); return; }

        const scale = getDisplayScale();
        const pw = Math.round(file.width * scale);
        const ph = Math.round(file.height * scale);

        const canvas = renderBitmapToCanvas(bitmap, pw, ph);
        bitmap.close();

        if (!showOriginal && regions.length > 0) {
          const scaledRegions = regions.map((r) => ({
            ...r,
            x: r.x * scale,
            y: r.y * scale,
            width: r.width * scale,
            height: r.height * scale,
          }));
          applyBlurRegions(canvas, scaledRegions);
        }

        // Draw selection outlines
        const ctx = canvas.getContext('2d')!;
        for (const r of regions) {
          const sx = r.x * scale;
          const sy = r.y * scale;
          const sw = r.width * scale;
          const sh = r.height * scale;

          ctx.strokeStyle = r.id === selectedId ? '#3b82f6' : 'rgba(255,255,255,0.7)';
          ctx.lineWidth = r.id === selectedId ? 2 : 1;
          ctx.setLineDash(r.id === selectedId ? [] : [4, 4]);

          if (r.shape === 'oval') {
            ctx.beginPath();
            ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeRect(sx, sy, sw, sh);
          }
          ctx.setLineDash([]);
        }

        if (!cancelled && canvasRef.current) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          canvasRef.current.getContext('2d')!.drawImage(canvas, 0, 0);
        }
      } catch {
        // Preview failed silently
      }
    })();

    return () => { cancelled = true; };
  }, [file, regions, selectedId, showOriginal, getDisplayScale]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    setError(null);
    try {
      const info = await loadImageFile(files[0]);
      if (file) revokeImageUrls([file]);
      setFile(info);
      setRegions([]);
      setHistory([[]]);
      setHistoryIdx(0);
      setSelectedId(null);
    } catch {
      toast.error('Failed to load image');
    }
  }, [file]);

  const addRegion = useCallback(() => {
    if (!file) return;
    const size = Math.min(file.width, file.height) * 0.15;
    const newRegion: BlurRegion = {
      id: nextRegionId(),
      x: (file.width - size) / 2,
      y: (file.height - size) / 2,
      width: size,
      height: size,
      shape: blurShape,
      style: blurStyle,
      intensity: blurIntensity,
    };
    const next = [...regions, newRegion];
    pushRegionHistory(next);
    setSelectedId(newRegion.id);
  }, [file, regions, blurShape, blurStyle, blurIntensity, pushRegionHistory]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    pushRegionHistory(regions.filter((r) => r.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, regions, pushRegionHistory]);

  const updateSelectedRegion = useCallback((updates: Partial<BlurRegion>) => {
    if (!selectedId) return;
    const next = regions.map((r) => (r.id === selectedId ? { ...r, ...updates } : r));
    pushRegionHistory(next);
  }, [selectedId, regions, pushRegionHistory]);

  const handleDetectFaces = useCallback(async () => {
    if (!file || !hasFaceApi) return;
    setIsDetecting(true);
    try {
      const bitmap = await createImageBitmap(file.file);
      const faces = await detectFaces(bitmap);
      bitmap.close();

      if (faces.length === 0) {
        toast.info('No faces detected in this image');
        return;
      }

      const newRegions: BlurRegion[] = faces.map((f) => ({
        id: nextRegionId(),
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        shape: 'oval' as const,
        style: blurStyle,
        intensity: blurIntensity,
      }));

      pushRegionHistory([...regions, ...newRegions]);
      toast.success(`Detected ${faces.length} face${faces.length !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Face detection failed');
    } finally {
      setIsDetecting(false);
    }
  }, [file, hasFaceApi, blurStyle, blurIntensity, regions, pushRegionHistory]);

  // Mouse interactions for drawing new regions
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!file || !containerRef.current) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const scale = getDisplayScale();
    const mx = (e.clientX - rect.left) / scale;
    const my = (e.clientY - rect.top) / scale;

    // Check if clicking an existing region
    for (let i = regions.length - 1; i >= 0; i--) {
      const r = regions[i];
      if (mx >= r.x && mx <= r.x + r.width && my >= r.y && my <= r.y + r.height) {
        setSelectedId(r.id);
        setIsDragging(true);
        setDragMode('move');
        setDragOffset({ x: mx - r.x, y: my - r.y });
        return;
      }
    }

    // Start drawing new region
    setIsDrawing(true);
    setDrawStart({ x: mx, y: my });
    setSelectedId(null);
  }, [file, regions, getDisplayScale]);

  useEffect(() => {
    if (!isDragging && !isDrawing) return;
    if (!file) return;

    const scale = getDisplayScale();
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasEl.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / scale;
      const my = (e.clientY - rect.top) / scale;

      if (isDragging && selectedId && dragMode === 'move') {
        setRegions((prev) =>
          prev.map((r) => {
            if (r.id !== selectedId) return r;
            let nx = mx - dragOffset.x;
            let ny = my - dragOffset.y;
            nx = Math.max(0, Math.min(nx, file.width - r.width));
            ny = Math.max(0, Math.min(ny, file.height - r.height));
            return { ...r, x: nx, y: ny };
          }),
        );
      }

      if (isDrawing) {
        const w = mx - drawStart.x;
        const h = my - drawStart.y;
        const newRegion: BlurRegion = {
          id: 'drawing',
          x: w >= 0 ? drawStart.x : mx,
          y: h >= 0 ? drawStart.y : my,
          width: Math.abs(w),
          height: Math.abs(h),
          shape: blurShape,
          style: blurStyle,
          intensity: blurIntensity,
        };
        setRegions((prev) => {
          const filtered = prev.filter((r) => r.id !== 'drawing');
          return [...filtered, newRegion];
        });
      }
    };

    const handleMouseUp = () => {
      if (isDrawing) {
        setRegions((prev) => {
          const drawing = prev.find((r) => r.id === 'drawing');
          if (drawing && drawing.width > 5 && drawing.height > 5) {
            const finalized = { ...drawing, id: nextRegionId() };
            const next = prev.map((r) => (r.id === 'drawing' ? finalized : r));
            setSelectedId(finalized.id);
            // Push to history
            setHistory((h) => [...h.slice(0, historyIdx + 1), next]);
            setHistoryIdx((i) => i + 1);
            return next;
          }
          return prev.filter((r) => r.id !== 'drawing');
        });
        setIsDrawing(false);
      }
      if (isDragging) {
        // Push current state to history
        setRegions((prev) => {
          setHistory((h) => [...h.slice(0, historyIdx + 1), prev]);
          setHistoryIdx((i) => i + 1);
          return prev;
        });
        setIsDragging(false);
        setDragMode(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isDrawing, selectedId, dragMode, dragOffset, drawStart, file, blurShape, blurStyle, blurIntensity, getDisplayScale, historyIdx]);

  const handleExport = useCallback(async () => {
    if (!file || regions.length === 0) return;
    setIsExporting(true);
    setError(null);

    try {
      const bitmap = await createImageBitmap(file.file);
      const canvas = renderBitmapToCanvas(bitmap);
      bitmap.close();

      applyBlurRegions(canvas, regions);

      const blob = await exportCanvas(canvas, outputFormat, quality, bgColor);
      const filename = generateOutputFilename(file.name, '_blurred', outputFormat);
      downloadBlobFile(blob, filename);
      toast.success('Blurred image downloaded');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(msg);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [file, regions, outputFormat, quality, bgColor]);

  const handleClear = useCallback(() => {
    if (file) revokeImageUrls([file]);
    setFile(null);
    setRegions([]);
    setHistory([[]]);
    setHistoryIdx(0);
    setSelectedId(null);
    setError(null);
  }, [file]);

  const selectedRegion = regions.find((r) => r.id === selectedId);

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Blur Face & Plate Online - Privacy Blur Tool"
        description="Blur faces, license plates, and sensitive areas in images. Gaussian blur, pixelate, or black bar. Free, private, no uploads."
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-gray-800 text-white flex items-center justify-center shadow-lg">
              <Eraser className="w-6 h-6" />
            </div>
          </div>
          <h1>Blur Face / Plate</h1>
          <p>Blur sensitive areas like faces and license plates.</p>
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
              <FileUploader onFilesSelected={handleFileSelected} accept="image/*" multiple={false} description="Drop an image to blur" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold">Blur Regions ({regions.filter((r) => r.id !== 'drawing').length})</h2>
                    <div className="flex gap-1">
                      <button onClick={undo} disabled={historyIdx <= 0} className="p-2 hover:bg-muted rounded-lg disabled:opacity-30" title="Undo" aria-label="Undo">
                        <Undo2 className="w-4 h-4" />
                      </button>
                      <button onClick={redo} disabled={historyIdx >= history.length - 1} className="p-2 hover:bg-muted rounded-lg disabled:opacity-30" title="Redo" aria-label="Redo">
                        <Redo2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Blur style */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Blur Style</label>
                    <div className="flex gap-2">
                      {([['blur', 'Gaussian'], ['pixelate', 'Pixelate'], ['black', 'Black Bar']] as const).map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => {
                            setBlurStyle(val);
                            if (selectedId) updateSelectedRegion({ style: val });
                          }}
                          className={`flex-1 py-2 text-xs rounded-lg border transition-all ${blurStyle === val ? 'border-foreground bg-muted font-bold' : 'border-border text-muted-foreground'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shape */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Shape</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setBlurShape('rect');
                          if (selectedId) updateSelectedRegion({ shape: 'rect' });
                        }}
                        className={`flex-1 py-2 text-xs rounded-lg border transition-all flex items-center justify-center gap-1.5 ${blurShape === 'rect' ? 'border-foreground bg-muted font-bold' : 'border-border text-muted-foreground'}`}
                      >
                        <Square className="w-3.5 h-3.5" /> Rectangle
                      </button>
                      <button
                        onClick={() => {
                          setBlurShape('oval');
                          if (selectedId) updateSelectedRegion({ shape: 'oval' });
                        }}
                        className={`flex-1 py-2 text-xs rounded-lg border transition-all flex items-center justify-center gap-1.5 ${blurShape === 'oval' ? 'border-foreground bg-muted font-bold' : 'border-border text-muted-foreground'}`}
                      >
                        <Circle className="w-3.5 h-3.5" /> Oval
                      </button>
                    </div>
                  </div>

                  {/* Intensity */}
                  {blurStyle !== 'black' && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">
                        Intensity: {blurIntensity}
                      </label>
                      <input
                        type="range"
                        min={3}
                        max={40}
                        value={blurIntensity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setBlurIntensity(val);
                          if (selectedId) updateSelectedRegion({ intensity: val });
                        }}
                        className="w-full accent-foreground"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={addRegion} className="btn btn-outline text-xs py-1.5 px-3 flex-1">
                      <Plus className="w-3.5 h-3.5" /> Add Region
                    </button>
                    {selectedId && (
                      <button onClick={deleteSelected} className="btn btn-outline text-xs py-1.5 px-3 text-[var(--error)]">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>

                  {/* Auto-detect */}
                  {hasFaceApi ? (
                    <button
                      onClick={handleDetectFaces}
                      disabled={isDetecting}
                      className="btn btn-outline text-xs py-2 px-3 w-full"
                    >
                      {isDetecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      Detect Faces
                    </button>
                  ) : (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-xl flex items-start gap-2 text-xs border border-blue-100">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <p>Automatic face detection is not supported in this browser. Use manual blur selection.</p>
                    </div>
                  )}

                  <button onClick={() => { pushRegionHistory([]); setSelectedId(null); }} className="btn btn-outline text-xs py-1.5 px-3 w-full">
                    <RefreshCw className="w-3.5 h-3.5" /> Reset All Regions
                  </button>
                </div>

                {/* Selected region info */}
                {selectedRegion && (
                  <div className="bg-card border border-blue-200 rounded-2xl p-4 shadow-sm space-y-2 animate-fade-in">
                    <h3 className="text-xs font-bold text-blue-700">Selected Region</h3>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Style: {selectedRegion.style} &middot; Shape: {selectedRegion.shape}</p>
                      <p>Position: {Math.round(selectedRegion.x)}, {Math.round(selectedRegion.y)}</p>
                      <p>Size: {Math.round(selectedRegion.width)} × {Math.round(selectedRegion.height)}</p>
                    </div>
                  </div>
                )}

                {/* Privacy note */}
                <div className="bg-amber-50 text-amber-700 p-3 rounded-xl flex items-start gap-2 text-xs border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p>Blurred images should be checked carefully before sharing. This tool applies visible image edits and cannot guarantee protection if the wrong area is selected.</p>
                </div>
              </div>

              {/* Canvas + export */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold">
                      Editor
                      <span className="text-xs font-normal text-muted-foreground ml-2">
                        Click & drag to draw a blur region
                      </span>
                    </h3>
                    <button
                      onMouseDown={() => setShowOriginal(true)}
                      onMouseUp={() => setShowOriginal(false)}
                      onMouseLeave={() => setShowOriginal(false)}
                      className="btn btn-outline text-xs py-1.5 px-3"
                    >
                      <Eye className="w-3.5 h-3.5" /> Before
                    </button>
                  </div>
                  <div
                    ref={containerRef}
                    className="bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_0_0/20px_20px] rounded-xl border border-border flex items-center justify-center p-2 cursor-crosshair"
                    style={{ minHeight: 300 }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="max-w-full rounded-lg shadow"
                      onMouseDown={handleCanvasMouseDown}
                    />
                  </div>
                </div>

                {/* Export */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
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

                  {error && (
                    <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleExport}
                      disabled={isExporting || regions.filter((r) => r.id !== 'drawing').length === 0}
                      className={`btn btn-primary flex-1 py-4 text-base ${isExporting ? 'opacity-75 cursor-wait' : ''}`}
                    >
                      {isExporting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Exporting...</>
                      ) : (
                        <><Download className="w-5 h-5" /> Download Blurred Image</>
                      )}
                    </button>
                    <button onClick={handleClear} className="btn btn-outline py-4 text-base sm:flex-none sm:px-6">
                      <RefreshCw className="w-5 h-5" /> Start Over
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
