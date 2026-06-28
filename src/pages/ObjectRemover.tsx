import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { ToolStateMessage } from '../components/ToolStateMessage';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, formatFileSize, getFormatExtension, stripBasename } from '../utils/image/support';
import { canvasToBlob } from '../utils/image/canvas';
import { downloadBlobFile } from '../utils/pdf/export';
import { inpaintTelea, createMaskFromPaths, MAX_INPAINT_DIMENSION, MAX_MASK_PERCENT } from '../utils/ai/inpaint';
import { checkImageSizeLimit } from '../utils/ai/capabilities';
import { MAX_INPAINT_PIXELS } from '../utils/ai/types';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import { FAQSection } from '../components/FAQSection';
import {
  Eraser, Download, Loader2, RefreshCw, AlertTriangle, Info,
  Undo2, Redo2, Trash2, Eye, ZoomIn, ZoomOut, Minus, Plus,
} from 'lucide-react';

type OutputFormatOption = 'image/png' | 'image/webp' | 'image/jpeg';

interface BrushPath {
  points: Array<{ x: number; y: number }>;
  brushSize: number;
  isErase: boolean;
}

export const ObjectRemover = () => {
  const [file, setFile] = useState<ImageFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const [brushSize, setBrushSize] = useState(30);
  const [isEraseMode, setIsEraseMode] = useState(false);
  const [showMask, setShowMask] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [paths, setPaths] = useState<BrushPath[]>([]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [history, setHistory] = useState<BrushPath[][]>([[]]);
  const [currentPath, setCurrentPath] = useState<BrushPath | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [outputFormat, setOutputFormat] = useState<OutputFormatOption>('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
  }, []);

  useEffect(() => {
    return () => {
      if (file) revokeImageUrls([file]);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      bitmapRef.current?.close();
    };
  }, [file, resultUrl]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay || !bitmapRef.current) return;

    const bitmap = bitmapRef.current;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    overlay.width = bitmap.width;
    overlay.height = bitmap.height;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);

    if (showMask) {
      const oCtx = overlay.getContext('2d')!;
      oCtx.clearRect(0, 0, overlay.width, overlay.height);

      const allPaths = currentPath ? [...paths, currentPath] : paths;
      for (const path of allPaths) {
        oCtx.globalCompositeOperation = path.isErase ? 'destination-out' : 'source-over';
        oCtx.strokeStyle = path.isErase ? 'rgba(0,0,0,1)' : 'rgba(255, 50, 50, 0.5)';
        oCtx.fillStyle = path.isErase ? 'rgba(0,0,0,1)' : 'rgba(255, 50, 50, 0.5)';
        oCtx.lineWidth = path.brushSize;
        oCtx.lineCap = 'round';
        oCtx.lineJoin = 'round';

        if (path.points.length === 1) {
          oCtx.beginPath();
          oCtx.arc(path.points[0].x, path.points[0].y, path.brushSize / 2, 0, Math.PI * 2);
          oCtx.fill();
        } else if (path.points.length > 1) {
          oCtx.beginPath();
          oCtx.moveTo(path.points[0].x, path.points[0].y);
          for (let i = 1; i < path.points.length; i++) {
            oCtx.lineTo(path.points[i].x, path.points[i].y);
          }
          oCtx.stroke();
        }
      }
      oCtx.globalCompositeOperation = 'source-over';
    }
  }, [paths, currentPath, showMask]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const pushHistory = useCallback((newPaths: BrushPath[]) => {
    setPaths(newPaths);
    setHistory((h) => [...h.slice(0, historyIdx + 1), newPaths]);
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (resultUrl || isProcessing) return;
    const point = getCanvasPoint(e);
    if (!point) return;
    e.preventDefault();
    setIsDrawing(true);
    setCurrentPath({ points: [point], brushSize, isErase: isEraseMode });
  }, [getCanvasPoint, brushSize, isEraseMode, resultUrl, isProcessing]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentPath) return;
    const point = getCanvasPoint(e);
    if (!point) return;
    e.preventDefault();
    setCurrentPath((prev) => prev ? { ...prev, points: [...prev.points, point] } : null);
  }, [isDrawing, currentPath, getCanvasPoint]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !currentPath) return;
    setIsDrawing(false);
    pushHistory([...paths, currentPath]);
    setCurrentPath(null);
  }, [isDrawing, currentPath, paths, pushHistory]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    setPaths(history[newIdx]);
  }, [historyIdx, history]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx);
    setPaths(history[newIdx]);
  }, [historyIdx, history]);

  const clearMask = useCallback(() => {
    pushHistory([]);
  }, [pushHistory]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    setError(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setPaths([]);
    setHistory([[]]);
    setHistoryIdx(0);
    bitmapRef.current?.close();

    try {
      const info = await loadImageFile(files[0]);
      const sizeErr = checkImageSizeLimit(info.width, info.height, MAX_INPAINT_PIXELS);
      if (sizeErr) { setError(sizeErr); revokeImageUrls([info]); return; }
      if (info.width > MAX_INPAINT_DIMENSION || info.height > MAX_INPAINT_DIMENSION) {
        setError(`Image dimensions exceed ${MAX_INPAINT_DIMENSION}px limit. Please resize the image first.`);
        revokeImageUrls([info]);
        return;
      }
      if (file) revokeImageUrls([file]);
      const bitmap = await createImageBitmap(info.file);
      bitmapRef.current = bitmap;
      setFile(info);
    } catch {
      setError('Could not load this image.');
    }
  }, [file, resultUrl]);

  const handleRemoveObject = useCallback(async () => {
    if (!file || !bitmapRef.current || paths.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProcessingProgress(0);
    const start = performance.now();

    try {
      const bitmap = bitmapRef.current;
      const drawPaths = paths.filter((p) => !p.isErase);
      const erasePaths = paths.filter((p) => p.isErase);

      const mask = createMaskFromPaths(bitmap.width, bitmap.height, drawPaths);

      if (erasePaths.length > 0) {
        const eraseMask = createMaskFromPaths(bitmap.width, bitmap.height, erasePaths);
        for (let i = 0; i < mask.length; i++) {
          if (eraseMask[i] > 128) mask[i] = 0;
        }
      }

      let maskPixels = 0;
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] > 128) maskPixels++;
      }
      const maskPercent = (maskPixels / (bitmap.width * bitmap.height)) * 100;
      if (maskPercent > MAX_MASK_PERCENT) {
        setError(`Mask covers ${maskPercent.toFixed(0)}% of the image. Maximum is ${MAX_MASK_PERCENT}%. Use a smaller mask area.`);
        setIsProcessing(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
      const imageData = canvas.getContext('2d')!.getImageData(0, 0, bitmap.width, bitmap.height);

      const result = inpaintTelea(imageData, mask, 8, (pct) => setProcessingProgress(pct));

      const outCanvas = document.createElement('canvas');
      outCanvas.width = bitmap.width;
      outCanvas.height = bitmap.height;
      outCanvas.getContext('2d')!.putImageData(result, 0, 0);

      const blob = await canvasToBlob(outCanvas, outputFormat, outputFormat === 'image/png' ? undefined : quality);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultBlob(blob);
      setProcessingTime(Math.round(performance.now() - start));
      toast.success('Object removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Object removal failed');
    } finally {
      setIsProcessing(false);
    }
  }, [file, paths, outputFormat, quality, resultUrl]);

  const handleDownload = useCallback(() => {
    if (!resultBlob || !file) return;
    const ext = getFormatExtension(outputFormat);
    downloadBlobFile(resultBlob, `${stripBasename(file.name)}_cleaned.${ext}`);
  }, [resultBlob, file, outputFormat]);

  const handleReset = useCallback(() => {
    if (file) revokeImageUrls([file]);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    bitmapRef.current?.close();
    bitmapRef.current = null;
    setFile(null);
    setResultUrl(null);
    setResultBlob(null);
    setPaths([]);
    setHistory([[]]);
    setHistoryIdx(0);
    setError(null);
    setProcessingTime(null);
  }, [file, resultUrl]);

  const handleNewRemoval = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setPaths([]);
    setHistory([[]]);
    setHistoryIdx(0);
    setProcessingTime(null);
  }, [resultUrl]);

  const hasMask = paths.some((p) => !p.isErase);

  const faqItems = [
    { question: "How accurate is the inpainting?", answer: "The tool uses the Telea content-aware inpainting algorithm to fill removed areas based on surrounding pixel data. It works best for small to medium objects on relatively uniform backgrounds; complex scenes, detailed textures, or large masked areas may produce imperfect results." },
    { question: "How do I select the object to remove?", answer: "Simply paint over the unwanted object using the brush tool. You can adjust the brush size, switch between paint and erase modes, and use undo/redo to refine your selection before processing." },
    { question: "What output quality can I expect?", answer: "Output quality depends on the complexity of the surrounding area. Simple backgrounds produce seamless results, while detailed or textured backgrounds may show artefacts. You can export as JPEG, PNG, or WebP with adjustable quality." },
    { question: "Is processing done in my browser?", answer: "Yes. All processing happens entirely in your browser using a content-aware inpainting algorithm. No external AI model or server is required, and your images are never uploaded anywhere." },
  ];

  return (
    <main className="container max-w-4xl py-8 px-4">
      <PageSeo
        title="Object Remover — Content-Aware Object Removal | FilePilot"
        description="Remove unwanted objects from images using content-aware inpainting, entirely in your browser. No upload needed."
        faqItems={faqItems}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <Eraser className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Object Remover</h1>
        </div>
        <p className="text-muted-foreground">
          Paint over unwanted objects and remove them using content-aware inpainting. The masked area is filled with surrounding content.
        </p>
      </div>

      {!file && (
        <FileUploader
          onFilesSelected={handleFileSelected}
          accept="image/*"
          description="Upload an image to remove objects"
          hint={`Supports JPEG, PNG, WebP. Maximum ${MAX_INPAINT_DIMENSION}×${MAX_INPAINT_DIMENSION} pixels. All processing is local.`}
        />
      )}

      {file && (
        <div className="space-y-4">
          {/* Toolbar */}
          {!resultUrl && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
              <button
                onClick={() => setIsEraseMode(false)}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${!isEraseMode ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
                disabled={isProcessing}
              >
                <Plus className="h-3.5 w-3.5" /> Paint
              </button>
              <button
                onClick={() => setIsEraseMode(true)}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${isEraseMode ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
                disabled={isProcessing}
              >
                <Minus className="h-3.5 w-3.5" /> Erase
              </button>

              <div className="w-px h-6 bg-border mx-1" />

              <label className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Size:</span>
                <input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-20" disabled={isProcessing} />
                <span className="w-8 text-right">{brushSize}</span>
              </label>

              <div className="w-px h-6 bg-border mx-1" />

              <button onClick={undo} disabled={historyIdx <= 0 || isProcessing} className="rounded p-1.5 hover:bg-muted disabled:opacity-30" title="Undo">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={redo} disabled={historyIdx >= history.length - 1 || isProcessing} className="rounded p-1.5 hover:bg-muted disabled:opacity-30" title="Redo">
                <Redo2 className="h-4 w-4" />
              </button>
              <button onClick={clearMask} disabled={paths.length === 0 || isProcessing} className="rounded p-1.5 hover:bg-muted disabled:opacity-30" title="Clear mask">
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="w-px h-6 bg-border mx-1" />

              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={showMask} onChange={(e) => setShowMask(e.target.checked)} className="rounded" disabled={isProcessing} />
                Show mask
              </label>

              <div className="ml-auto flex gap-1">
                <button onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} className="rounded p-1.5 hover:bg-muted" title="Zoom in">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} className="rounded p-1.5 hover:bg-muted" title="Zoom out">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs self-center text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          )}

          {/* Canvas area */}
          <div
            ref={containerRef}
            className="relative overflow-auto rounded-lg border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]"
            style={{ maxHeight: 500, cursor: resultUrl ? 'default' : 'crosshair' }}
          >
            {resultUrl ? (
              <div>
                <div className="flex gap-2 px-3 py-2 border-b border-border bg-background/80">
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-3.5 w-3.5" /> {showOriginal ? 'Show result' : 'Show original'}
                  </button>
                </div>
                <img
                  src={showOriginal ? file.previewUrl : resultUrl}
                  alt={showOriginal ? 'Original' : 'Result'}
                  className="block w-full h-auto"
                  style={{ maxHeight: 450, objectFit: 'contain' }}
                  draggable={false}
                />
              </div>
            ) : (
              <div
                className="relative inline-block"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                <canvas ref={canvasRef} className="block" />
                <canvas ref={overlayCanvasRef} className="absolute top-0 left-0 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Progress */}
          {isProcessing && (
            <ToolStateMessage state="loading" title="Removing object...">
              <div className="mt-2 h-2 rounded-full bg-blue-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${processingProgress}%` }} />
              </div>
              <p className="text-xs mt-1">{processingProgress}% complete</p>
            </ToolStateMessage>
          )}

          {error && <ToolStateMessage state="error" title="Error">{error}</ToolStateMessage>}

          {status === 'complete' || (resultUrl && processingTime) ? (
            <ToolStateMessage state="success" title="Object Removed">
              <p className="text-sm">Processed in {((processingTime ?? 0) / 1000).toFixed(1)}s · {resultBlob ? formatFileSize(resultBlob.size) : ''}</p>
            </ToolStateMessage>
          ) : null}

          {/* Output settings */}
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
            {!resultUrl && (
              <button
                onClick={handleRemoveObject}
                disabled={isProcessing || !hasMask}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
                {isProcessing ? 'Removing…' : 'Remove Selected Object'}
              </button>
            )}

            {resultUrl && (
              <>
                <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition">
                  <Download className="h-4 w-4" /> Download
                </button>
                <button onClick={handleNewRemoval} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition">
                  <RefreshCw className="h-4 w-4" /> Remove Another Object
                </button>
              </>
            )}

            <button onClick={handleReset} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition">
              Upload New Image
            </button>
          </div>

          {/* Notices */}
          <div className="space-y-2 text-sm">
            <ToolStateMessage state="hint">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p>Images are processed locally in your browser and are not uploaded.</p>
                  <p className="mt-1">This tool uses content-aware inpainting (Telea algorithm) to fill removed areas based on surrounding pixel data. No external AI model is required.</p>
                </div>
              </div>
            </ToolStateMessage>
            <ToolStateMessage state="hint">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p>Large masks, detailed backgrounds, text, faces, architectural lines, repeated textures, and complex scenes may produce imperfect results.</p>
                  <p className="mt-1">This tool cannot be used to remove watermarks, ownership marks, signatures, or safety labels. Such areas may produce intentionally degraded results.</p>
                </div>
              </div>
            </ToolStateMessage>
          </div>
        </div>
      )}

      <FAQSection items={faqItems} />
    </main>
  );
};
