import { useState, useCallback, useEffect, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { RelatedTools } from '../components/RelatedTools';
import { ToolUsageTracker } from '../components/ToolUsageTracker';
import { toast } from 'sonner';
import {
  Loader2, Download, RefreshCw, X, ShoppingBag, AlertTriangle,
  Image as ImageIcon, Sparkles,
  Info,
} from 'lucide-react';
import { ecommercePresets, type EcommercePreset } from '../data/ecommercePresets';
import {
  type FitMode,
  drawFitCanvas,
  encodeCanvas,
  downloadAsZip,
  downloadBlob,
  formatFileSize,
} from '../utils/image/batchExport';
import type { ImageFormat } from '../utils/image/types';
import { getFormatExtension, stripBasename } from '../utils/image/support';

interface SourceImage {
  id: string;
  file: File;
  name: string;
  width: number;
  height: number;
  size: number;
  previewUrl: string;
}

interface OutputImage {
  id: string;
  sourceId: string;
  sourceName: string;
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  format: string;
  size: number;
  originalSize: number;
  previewUrl: string;
}

let idCounter = 0;

export const EcommerceImageFormatter = () => {
  const [sources, setSources] = useState<SourceImage[]>([]);
  const [outputs, setOutputs] = useState<OutputImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const [selectedPreset, setSelectedPreset] = useState<EcommercePreset>(ecommercePresets[0]);
  const [customWidth, setCustomWidth] = useState('1000');
  const [customHeight, setCustomHeight] = useState('1000');
  const [isCustom, setIsCustom] = useState(false);

  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [padding, setPadding] = useState(0);
  const [shadow, setShadow] = useState(false);
  const [border, setBorder] = useState(false);

  const [outputFormat, setOutputFormat] = useState<ImageFormat | 'original'>('image/jpeg');
  const [quality, setQuality] = useState(0.85);
  const [filenameTemplate, setFilenameTemplate] = useState('{name}-{index}-{width}x{height}');

  const outputUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      sources.forEach(s => URL.revokeObjectURL(s.previewUrl));
      outputUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    };
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    const newSources: SourceImage[] = [];
    for (const file of files) {
      try {
        const bitmap = await createImageBitmap(file);
        newSources.push({
          id: `ecom-${++idCounter}`,
          file,
          name: file.name,
          width: bitmap.width,
          height: bitmap.height,
          size: file.size,
          previewUrl: URL.createObjectURL(file),
        });
        bitmap.close();
      } catch {
        toast.error(`Could not load "${file.name}". File may be corrupt or unsupported.`);
      }
    }
    setSources(prev => [...prev, ...newSources]);
    setOutputs([]);
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources(prev => {
      const item = prev.find(s => s.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(s => s.id !== id);
    });
    setOutputs([]);
  }, []);

  const targetW = isCustom ? parseInt(customWidth) || 1000 : selectedPreset.width;
  const targetH = isCustom ? parseInt(customHeight) || 1000 : selectedPreset.height;
  const resolvedFormat = outputFormat === 'original' ? 'image/jpeg' as ImageFormat : outputFormat;

  const handleProcess = useCallback(async () => {
    if (sources.length === 0) return;
    setProcessing(true);
    setProgress({ current: 0, total: sources.length });
    outputUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    outputUrlsRef.current = [];

    const results: OutputImage[] = [];

    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      setProgress({ current: i + 1, total: sources.length });

      try {
        const bitmap = await createImageBitmap(src.file);

        const padTotal = padding * 2;
        const innerW = Math.max(1, targetW - padTotal);
        const innerH = Math.max(1, targetH - padTotal);

        const innerCanvas = drawFitCanvas(bitmap, innerW, innerH, fitMode, bgColor);
        bitmap.close();

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetW, targetH);

        if (shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.15)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
        }

        ctx.drawImage(innerCanvas, padding, padding);
        ctx.shadowColor = 'transparent';

        if (border) {
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 1;
          ctx.strokeRect(padding - 0.5, padding - 0.5, innerW + 1, innerH + 1);
        }

        const blob = await encodeCanvas(canvas, resolvedFormat, quality, bgColor);
        const ext = getFormatExtension(resolvedFormat);
        const baseName = stripBasename(src.name);
        const filename = filenameTemplate
          .replace('{name}', baseName)
          .replace('{index}', String(i + 1))
          .replace('{width}', String(targetW))
          .replace('{height}', String(targetH))
          + `.${ext}`;

        const previewUrl = URL.createObjectURL(blob);
        outputUrlsRef.current.push(previewUrl);

        results.push({
          id: `out-${++idCounter}`,
          sourceId: src.id,
          sourceName: src.name,
          blob,
          filename,
          width: targetW,
          height: targetH,
          format: resolvedFormat,
          size: blob.size,
          originalSize: src.size,
          previewUrl,
        });
      } catch (err) {
        toast.error(`Failed to process "${src.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setOutputs(results);
    setProcessing(false);
    if (results.length > 0) toast.success(`${results.length} image${results.length > 1 ? 's' : ''} formatted`);
  }, [sources, targetW, targetH, fitMode, bgColor, padding, shadow, border, resolvedFormat, quality, filenameTemplate]);

  const handleDownloadAll = useCallback(async () => {
    if (outputs.length === 0) return;
    await downloadAsZip(
      outputs.map(o => ({ filename: o.filename, blob: o.blob })),
      'ecommerce-images.zip',
    );
  }, [outputs]);

  const handleReset = useCallback(() => {
    sources.forEach(s => URL.revokeObjectURL(s.previewUrl));
    outputUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    outputUrlsRef.current = [];
    setSources([]);
    setOutputs([]);
  }, [sources]);

  const upscaleWarnings = sources.filter(s => s.width < targetW || s.height < targetH);

  return (
    <div>
      <PageSeo
        title="E-commerce Image Formatter — FilePilot"
        description="Prepare product photos with clean backgrounds, consistent dimensions, and marketplace-ready formats. All processing happens locally in your browser."
      />
      <ToolUsageTracker />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <h1>E-commerce Image Formatter</h1>
          <p>Prepare product photos with clean backgrounds, consistent dimensions, and marketplace-ready formats.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Your files are processed locally in your browser and are not uploaded.
          </p>
        </div>
      </div>

      <div className="container pb-12 max-w-6xl mx-auto">
        <div className="max-w-5xl mx-auto">

        {/* Marketplace disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800 mb-6">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <p>
            Presets are recommended starting points. Marketplace image requirements may change.
            Always verify the latest requirements from each platform before uploading.
          </p>
        </div>

        {sources.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <FileUploader
            onFilesSelected={handleFiles}
            accept="image/*"
            multiple
            description="Drop product images here"
            hint="Upload one or more product photos to format for e-commerce."
          />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Source images */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">{sources.length} image{sources.length > 1 ? 's' : ''} loaded</h2>
                <button onClick={() => document.getElementById('ecom-add-more')?.click()} className="text-sm text-blue-600 hover:underline">
                  + Add more
                </button>
                <input
                  id="ecom-add-more"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    if (e.target.files) handleFiles(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sources.map(src => (
                  <div key={src.id} className="relative rounded-lg border border-border bg-card overflow-hidden group">
                    <img src={src.previewUrl} alt={src.name} className="w-full aspect-square object-contain bg-gray-50" />
                    <div className="p-2 text-xs space-y-0.5">
                      <p className="font-medium truncate" title={src.name}>{src.name}</p>
                      <p className="text-muted-foreground">{src.width}×{src.height} · {formatFileSize(src.size)}</p>
                    </div>
                    <button
                      onClick={() => removeSource(src.id)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${src.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              <h2 className="text-lg font-semibold">Settings</h2>

              {/* Preset selector */}
              <div>
                <label className="block text-sm font-medium mb-2">Product Image Preset</label>
                <p className="text-xs text-muted-foreground mb-2">These are recommended starting points. Marketplace requirements may vary.</p>
                <div className="flex flex-wrap gap-2">
                  {ecommercePresets.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPreset(p); setIsCustom(false); setOutputFormat(p.format); setBgColor(p.backgroundColor); }}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition ${!isCustom && selectedPreset.id === p.id ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium' : 'border-border hover:border-foreground/30'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCustom(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${isCustom ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium' : 'border-border hover:border-foreground/30'}`}
                  >
                    Custom
                  </button>
                </div>
                {!isCustom && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedPreset.description} — {selectedPreset.width}×{selectedPreset.height}</p>
                )}
              </div>

              {/* Dimensions */}
              {isCustom && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ecom-w" className="block text-sm font-medium mb-1">Width (px)</label>
                    <input id="ecom-w" type="number" min={1} value={customWidth} onChange={e => setCustomWidth(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="ecom-h" className="block text-sm font-medium mb-1">Height (px)</label>
                    <input id="ecom-h" type="number" min={1} value={customHeight} onChange={e => setCustomHeight(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
              )}

              {/* Fit mode */}
              <div>
                <label className="block text-sm font-medium mb-2">Image Placement</label>
                <div className="flex gap-2">
                  {([['contain', 'Contain (pad)'], ['cover', 'Cover (crop)'], ['stretch', 'Original Ratio']] as [FitMode, string][]).map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => setFitMode(mode)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition ${fitMode === mode ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium' : 'border-border hover:border-foreground/30'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="ecom-bg" className="block text-sm font-medium mb-1">Background</label>
                  <div className="flex gap-2 items-center">
                    <input id="ecom-bg" type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                    <div className="flex gap-1">
                      {['#ffffff', '#f3f4f6', 'transparent'].map(c => (
                        <button
                          key={c}
                          onClick={() => setBgColor(c === 'transparent' ? '#ffffff' : c)}
                          className={`w-6 h-6 rounded border ${bgColor === c ? 'ring-2 ring-amber-500' : 'border-border'}`}
                          style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                          aria-label={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="ecom-padding" className="block text-sm font-medium mb-1">Padding ({padding}px)</label>
                  <input id="ecom-padding" type="range" min={0} max={100} value={padding} onChange={e => setPadding(Number(e.target.value))} className="w-full" />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={shadow} onChange={e => setShadow(e.target.checked)} className="rounded" />
                    Shadow
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={border} onChange={e => setBorder(e.target.checked)} className="rounded" />
                    Border
                  </label>
                </div>
              </div>

              {/* Format + Quality */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="ecom-format" className="block text-sm font-medium mb-1">Output Format</label>
                  <select
                    id="ecom-format"
                    value={outputFormat}
                    onChange={e => setOutputFormat(e.target.value as ImageFormat | 'original')}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </div>
                {resolvedFormat !== 'image/png' && (
                  <div>
                    <label htmlFor="ecom-quality" className="block text-sm font-medium mb-1">Quality ({Math.round(quality * 100)}%)</label>
                    <input id="ecom-quality" type="range" min={10} max={100} value={Math.round(quality * 100)} onChange={e => setQuality(Number(e.target.value) / 100)} className="w-full" />
                  </div>
                )}
                <div>
                  <label htmlFor="ecom-template" className="block text-sm font-medium mb-1">Filename Template</label>
                  <input id="ecom-template" type="text" value={filenameTemplate} onChange={e => setFilenameTemplate(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="{name}-{index}-{width}x{height}" />
                </div>
              </div>

              {/* Warnings */}
              {upscaleWarnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Upscale warning</p>
                    <p>{upscaleWarnings.length} image{upscaleWarnings.length > 1 ? 's are' : ' is'} smaller than the target dimensions ({targetW}×{targetH}). Quality may be reduced.</p>
                  </div>
                </div>
              )}

              {resolvedFormat === 'image/jpeg' && (
                <p className="text-xs text-muted-foreground">Transparent areas will be filled with the selected background color when exporting as JPEG.</p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button onClick={handleProcess} disabled={processing} className="btn btn-primary py-2.5 px-6">
                  {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing {progress.current}/{progress.total}...</> : <><ImageIcon className="w-4 h-4" /> Format Images</>}
                </button>
                <button onClick={handleReset} className="btn btn-outline py-2.5 px-6">
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>

            {/* Results */}
            {outputs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{outputs.length} formatted image{outputs.length > 1 ? 's' : ''}</h2>
                  {outputs.length > 1 && (
                    <button onClick={handleDownloadAll} className="btn btn-primary py-2 px-4 text-sm">
                      <Download className="w-4 h-4" /> Download All ZIP
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outputs.map(out => (
                    <div key={out.id} className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="aspect-square bg-gray-50 flex items-center justify-center p-2">
                        <img src={out.previewUrl} alt={out.filename} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="font-medium text-sm truncate" title={out.filename}>{out.filename}</p>
                        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                          <span>Dimensions: {out.width}×{out.height}</span>
                          <span>Format: {out.format.split('/')[1]?.toUpperCase()}</span>
                          <span>Original: {formatFileSize(out.originalSize)}</span>
                          <span>Output: {formatFileSize(out.size)}</span>
                        </div>
                        {out.size > out.originalSize && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Output is larger than original. Consider WebP or lower quality.
                          </p>
                        )}
                        <button
                          onClick={() => downloadBlob(out.blob, out.filename)}
                          className="w-full btn btn-outline py-1.5 text-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      <RelatedTools />
    </div>
  );
};
