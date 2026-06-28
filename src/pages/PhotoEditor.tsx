import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, formatFileSize } from '../utils/image/support';
import { renderBitmapToCanvas, exportCanvas, generateOutputFilename, flipCanvas, rotateCanvas, addBorder, addTextOverlay } from '../utils/image/canvas';
import { downloadBlobFile } from '../utils/pdf/export';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import {
  type ImageAdjustments, getDefaultAdjustments,
  applyAdjustmentsToCanvas, FILTER_PRESETS, applyPreset,
} from '../utils/image/filters';
import { FAQSection } from '../components/FAQSection';
import {
  Sparkles, Download, Loader2, RefreshCw, AlertTriangle,
  RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Undo2, Redo2, Eye,
} from 'lucide-react';

interface EditorState {
  adjustments: ImageAdjustments;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  textOverlay: string;
  textSize: number;
  textColor: string;
  textX: number;
  textY: number;
  textOpacity: number;
  borderThickness: number;
  borderColor: string;
}

const defaultState: EditorState = {
  adjustments: getDefaultAdjustments(),
  rotation: 0,
  flipH: false,
  flipV: false,
  textOverlay: '',
  textSize: 32,
  textColor: '#ffffff',
  textX: 50,
  textY: 50,
  textOpacity: 1,
  borderThickness: 0,
  borderColor: '#000000',
};

const SLIDERS: Array<{ key: keyof ImageAdjustments; label: string; min: number; max: number }> = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
  { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
  { key: 'tint', label: 'Tint', min: -100, max: 100 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
  { key: 'blur', label: 'Blur', min: 0, max: 20 },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100 },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
];

export const PhotoEditor = () => {
  const [file, setFile] = useState<ImageFileInfo | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('image/jpeg');
  const [quality, setQuality] = useState(0.92);

  const [state, setState] = useState<EditorState>({ ...defaultState });
  const [history, setHistory] = useState<EditorState[]>([{ ...defaultState }]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
  }, []);

  useEffect(() => {
    return () => {
      if (file) revokeImageUrls([file]);
    };
  }, [file]);

  const pushHistory = useCallback((next: EditorState) => {
    setState(next);
    setHistory((h) => {
      const trimmed = h.slice(0, historyIdx + 1);
      return [...trimmed, next];
    });
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      const idx = historyIdx - 1;
      setHistoryIdx(idx);
      setState(history[idx]);
    }
  }, [historyIdx, history]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const idx = historyIdx + 1;
      setHistoryIdx(idx);
      setState(history[idx]);
    }
  }, [historyIdx, history]);

  const updateAdjustment = useCallback((key: keyof ImageAdjustments, value: number) => {
    const next = { ...state, adjustments: { ...state.adjustments, [key]: value } };
    setState(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushHistory(next), 300);
  }, [state, pushHistory]);

  const applyFilterPreset = useCallback((preset: typeof FILTER_PRESETS[number]) => {
    const next = { ...state, adjustments: applyPreset(state.adjustments, preset) };
    pushHistory(next);
  }, [state, pushHistory]);

  const resetAll = useCallback(() => {
    const next = { ...defaultState };
    pushHistory(next);
  }, [pushHistory]);

  // Preview rendering
  useEffect(() => {
    if (!file || !previewRef.current) return;
    let cancelled = false;

    const render = async () => {
      try {
        const bitmap = await createImageBitmap(file.file);
        if (cancelled) { bitmap.close(); return; }

        const maxDim = 700;
        const scale = Math.min(1, maxDim / bitmap.width, maxDim / bitmap.height);
        const pw = Math.round(bitmap.width * scale);
        const ph = Math.round(bitmap.height * scale);

        let canvas: HTMLCanvasElement;

        if (showOriginal) {
          canvas = renderBitmapToCanvas(bitmap, pw, ph);
        } else {
          canvas = applyAdjustmentsToCanvas(bitmap, state.adjustments, pw, ph);

          if (state.rotation !== 0) {
            const rotBitmap = await createImageBitmap(canvas);
            canvas = rotateCanvas(rotBitmap, state.rotation, '#ffffff');
            rotBitmap.close();
          }
          if (state.flipH || state.flipV) {
            const flBitmap = await createImageBitmap(canvas);
            if (state.flipH) {
              canvas = flipCanvas(flBitmap, 'horizontal');
              flBitmap.close();
            }
            if (state.flipV) {
              const flBitmap2 = await createImageBitmap(canvas);
              canvas = flipCanvas(flBitmap2, 'vertical');
              flBitmap2.close();
            }
          }
          if (state.textOverlay.trim()) {
            addTextOverlay(canvas, state.textOverlay, state.textSize * scale, state.textColor, state.textX * scale, state.textY * scale, state.textOpacity);
          }
          if (state.borderThickness > 0) {
            canvas = addBorder(canvas, Math.round(state.borderThickness * scale), state.borderColor);
          }
        }

        bitmap.close();

        if (!cancelled && previewRef.current) {
          previewRef.current.width = canvas.width;
          previewRef.current.height = canvas.height;
          const ctx = previewRef.current.getContext('2d')!;
          ctx.drawImage(canvas, 0, 0);
        }
      } catch {
        // Preview rendering failed silently
      }
    };

    const timeout = setTimeout(render, 50);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [file, state, showOriginal]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    setError(null);
    try {
      const info = await loadImageFile(files[0]);
      if (file) revokeImageUrls([file]);
      setFile(info);
      const initial = { ...defaultState };
      setState(initial);
      setHistory([initial]);
      setHistoryIdx(0);
    } catch {
      toast.error('Failed to load image');
    }
  }, [file]);

  const handleExport = useCallback(async () => {
    if (!file) return;
    setIsExporting(true);
    setError(null);

    try {
      const bitmap = await createImageBitmap(file.file);
      let canvas = applyAdjustmentsToCanvas(bitmap, state.adjustments);
      bitmap.close();

      if (state.rotation !== 0) {
        const rb = await createImageBitmap(canvas);
        canvas = rotateCanvas(rb, state.rotation, '#ffffff');
        rb.close();
      }
      if (state.flipH) {
        const fb = await createImageBitmap(canvas);
        canvas = flipCanvas(fb, 'horizontal');
        fb.close();
      }
      if (state.flipV) {
        const fb = await createImageBitmap(canvas);
        canvas = flipCanvas(fb, 'vertical');
        fb.close();
      }
      if (state.textOverlay.trim()) {
        addTextOverlay(canvas, state.textOverlay, state.textSize, state.textColor, state.textX, state.textY, state.textOpacity);
      }
      if (state.borderThickness > 0) {
        canvas = addBorder(canvas, state.borderThickness, state.borderColor);
      }

      const blob = await exportCanvas(canvas, outputFormat, quality, '#ffffff');
      const filename = generateOutputFilename(file.name, '_edited', outputFormat);
      downloadBlobFile(blob, filename);
      toast.success('Edited image downloaded');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(msg);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [file, state, outputFormat, quality]);

  const handleClear = useCallback(() => {
    if (file) revokeImageUrls([file]);
    setFile(null);
    setError(null);
  }, [file]);

  const faqItems = [
    { question: "What editing features are available?", answer: "The editor offers brightness, contrast, saturation, exposure, temperature, tint, highlights, shadows, sharpness, blur, grayscale, sepia, vignette adjustments, plus rotate, flip, text overlay, borders, and preset filters." },
    { question: "What formats can I export my edited photo in?", answer: "You can export edited images as JPEG, PNG, or WebP. A quality slider is available for JPEG and WebP to control the balance between file size and visual quality." },
    { question: "Can I undo changes while editing?", answer: "Yes. Full undo and redo support is built in, so you can step back through your editing history at any time. A reset button also restores all settings to their defaults." },
    { question: "Are my photos uploaded to a server?", answer: "No. All editing is performed locally in your browser using the Canvas API. Your photos are never uploaded, ensuring complete privacy." },
  ];

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Photo Editor Online - Free Browser-Based Image Editor"
        description="Edit photos with brightness, contrast, filters, text overlay, borders, and more. Free, private, no uploads."
        faqItems={faqItems}
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <h1>Photo Editor</h1>
          <p>Adjust brightness, contrast, filters, and more.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Files are processed locally in your browser and are not uploaded.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-6xl mx-auto space-y-6">
          {!file ? (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <FileUploader onFilesSelected={handleFileSelected} accept="image/*" multiple={false} description="Drop a photo to edit" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls panel */}
              <div className="lg:col-span-1 space-y-4">
                {/* Toolbar */}
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold">Tools</h2>
                    <div className="flex gap-1">
                      <button onClick={undo} disabled={historyIdx <= 0} className="p-2 hover:bg-muted rounded-lg disabled:opacity-30" title="Undo" aria-label="Undo">
                        <Undo2 className="w-4 h-4" />
                      </button>
                      <button onClick={redo} disabled={historyIdx >= history.length - 1} className="p-2 hover:bg-muted rounded-lg disabled:opacity-30" title="Redo" aria-label="Redo">
                        <Redo2 className="w-4 h-4" />
                      </button>
                      <button onClick={resetAll} className="p-2 hover:bg-muted rounded-lg" title="Reset All" aria-label="Reset all">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rotate/flip */}
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => pushHistory({ ...state, rotation: (state.rotation - 90 + 360) % 360 })} className="btn btn-outline text-xs py-1.5 px-2">
                      <RotateCcw className="w-3.5 h-3.5" /> -90°
                    </button>
                    <button onClick={() => pushHistory({ ...state, rotation: (state.rotation + 90) % 360 })} className="btn btn-outline text-xs py-1.5 px-2">
                      <RotateCw className="w-3.5 h-3.5" /> +90°
                    </button>
                    <button onClick={() => pushHistory({ ...state, flipH: !state.flipH })} className={`btn btn-outline text-xs py-1.5 px-2 ${state.flipH ? 'border-foreground bg-muted' : ''}`}>
                      <FlipHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => pushHistory({ ...state, flipV: !state.flipV })} className={`btn btn-outline text-xs py-1.5 px-2 ${state.flipV ? 'border-foreground bg-muted' : ''}`}>
                      <FlipVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Preset filters */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-muted-foreground">Filters</label>
                    <div className="flex flex-wrap gap-1.5">
                      {FILTER_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => applyFilterPreset(p)}
                          className="py-1.5 px-3 rounded-lg border text-xs transition-all border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Adjustment sliders */}
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3 max-h-[400px] overflow-y-auto">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground">Adjustments</h3>
                  {SLIDERS.map(({ key, label, min, max }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-xs text-muted-foreground">{label}</label>
                        <span className="text-xs font-mono text-muted-foreground w-8 text-right">{state.adjustments[key]}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={state.adjustments[key]}
                        onChange={(e) => updateAdjustment(key, parseFloat(e.target.value))}
                        className="w-full accent-foreground"
                        aria-label={label}
                      />
                    </div>
                  ))}
                </div>

                {/* Text overlay */}
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground">Text Overlay</h3>
                  <input
                    type="text"
                    placeholder="Enter text..."
                    value={state.textOverlay}
                    onChange={(e) => pushHistory({ ...state, textOverlay: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  {state.textOverlay && (
                    <div className="grid grid-cols-2 gap-2 animate-fade-in">
                      <div>
                        <label className="text-xs text-muted-foreground">Size: {state.textSize}px</label>
                        <input type="range" min={12} max={200} value={state.textSize} onChange={(e) => pushHistory({ ...state, textSize: parseInt(e.target.value) })} className="w-full accent-foreground" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Color</label>
                        <input type="color" value={state.textColor} onChange={(e) => pushHistory({ ...state, textColor: e.target.value })} className="w-full h-8 rounded border border-border cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">X: {state.textX}</label>
                        <input type="range" min={0} max={file.width} value={state.textX} onChange={(e) => pushHistory({ ...state, textX: parseInt(e.target.value) })} className="w-full accent-foreground" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Y: {state.textY}</label>
                        <input type="range" min={0} max={file.height} value={state.textY} onChange={(e) => pushHistory({ ...state, textY: parseInt(e.target.value) })} className="w-full accent-foreground" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground">Opacity: {Math.round(state.textOpacity * 100)}%</label>
                        <input type="range" min={0.05} max={1} step={0.05} value={state.textOpacity} onChange={(e) => pushHistory({ ...state, textOpacity: parseFloat(e.target.value) })} className="w-full accent-foreground" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Border */}
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground">Border</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Thickness: {state.borderThickness}px</label>
                      <input type="range" min={0} max={100} value={state.borderThickness} onChange={(e) => pushHistory({ ...state, borderThickness: parseInt(e.target.value) })} className="w-full accent-foreground" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Color</label>
                      <input type="color" value={state.borderColor} onChange={(e) => pushHistory({ ...state, borderColor: e.target.value })} className="w-full h-8 rounded border border-border cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview + export */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold">Preview</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onMouseDown={() => setShowOriginal(true)}
                        onMouseUp={() => setShowOriginal(false)}
                        onMouseLeave={() => setShowOriginal(false)}
                        className="btn btn-outline text-xs py-1.5 px-3"
                        aria-label="Hold to view original"
                      >
                        <Eye className="w-3.5 h-3.5" /> Before
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {file.width}×{file.height} &middot; {formatFileSize(file.originalSize)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_0_0/20px_20px] rounded-xl border border-border flex items-center justify-center p-4 min-h-[300px]">
                    <canvas ref={previewRef} className="max-w-full max-h-[550px] rounded-lg shadow" />
                  </div>
                </div>

                {/* Export settings */}
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
                        <input type="range" min={0.1} max={1.0} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full accent-foreground" />
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
                      disabled={isExporting}
                      className={`btn btn-primary flex-1 py-4 text-base ${isExporting ? 'opacity-75 cursor-wait' : ''}`}
                    >
                      {isExporting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Exporting full resolution...</>
                      ) : (
                        <><Download className="w-5 h-5" /> Download Edited Image</>
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

        <FAQSection items={faqItems} />
      </div>
    </div>
  );
};
