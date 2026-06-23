import { useState, useEffect, useCallback } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { getSupportedExportFormats, formatFileSize } from '../utils/image/support';
import { applyTransform, calculateRotatedDimensions, exportCanvas, generateOutputFilename } from '../utils/image/canvas';
import { downloadBlobFile, downloadZipFromEntries } from '../utils/pdf/export';
import type { ImageFormat, ImageFileInfo } from '../utils/image/types';
import {
  RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Sparkles, Download, Loader2,
  Trash2, Archive, RefreshCw, AlertTriangle,
} from 'lucide-react';

type OutputFormatOption = 'keep' | 'image/jpeg' | 'image/png' | 'image/webp';

interface EditState {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

interface FileEntry {
  info: ImageFileInfo;
  edit: EditState;
}

function resolveFormat(option: OutputFormatOption, sourceType: string): ImageFormat {
  if (option !== 'keep') return option;
  const supported: ImageFormat[] = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (supported.includes(sourceType as ImageFormat)) return sourceType as ImageFormat;
  return 'image/png';
}

const defaultEdit: EditState = { rotation: 0, flipH: false, flipV: false };

export const RotateImage = () => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormatOption>('keep');
  const [quality, setQuality] = useState(0.92);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [customAngle, setCustomAngle] = useState('');
  const [supportedFormats, setSupportedFormats] = useState<Record<ImageFormat, boolean> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupportedExportFormats().then(setSupportedFormats);
  }, []);

  useEffect(() => {
    return () => {
      revokeImageUrls(files.map((f) => f.info));
    };
  }, [files]);

  const handleFilesSelected = useCallback(async (selected: File[]) => {
    setError(null);
    const entries: FileEntry[] = [];
    for (const f of selected) {
      try {
        const info = await loadImageFile(f);
        entries.push({ info, edit: { ...defaultEdit } });
      } catch {
        toast.error(`Failed to load ${f.name}`);
      }
    }
    if (entries.length > 0) {
      setFiles((prev) => [...prev, ...entries]);
    }
  }, []);

  const updateEdit = useCallback((id: string, fn: (e: EditState) => EditState) => {
    setFiles((prev) =>
      prev.map((f) => (f.info.id === id ? { ...f, edit: fn(f.edit) } : f)),
    );
  }, []);

  const applyToAll = useCallback((fn: (e: EditState) => EditState) => {
    setFiles((prev) => prev.map((f) => ({ ...f, edit: fn(f.edit) })));
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.info.id === id);
      if (removed) revokeImageUrls([removed.info]);
      return prev.filter((f) => f.info.id !== id);
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);
    setError(null);

    try {
      const blobs: Array<{ filename: string; data: Blob }> = [];

      for (let i = 0; i < files.length; i++) {
        setProcessedCount(i + 1);
        const { info, edit } = files[i];
        const bitmap = await createImageBitmap(info.file);
        const canvas = applyTransform(bitmap, edit.rotation, edit.flipH, edit.flipV, bgColor);
        bitmap.close();

        const fmt = resolveFormat(outputFormat, info.mimeType);
        const blob = await exportCanvas(canvas, fmt, quality, bgColor);
        const filename = generateOutputFilename(info.name, '_rotated', fmt);
        blobs.push({ filename, data: blob });
      }

      if (blobs.length === 1) {
        downloadBlobFile(blobs[0].data, blobs[0].filename);
        toast.success('Image downloaded');
      } else {
        await downloadZipFromEntries(blobs, 'rotated-images.zip');
        toast.success(`${blobs.length} images downloaded as ZIP`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(msg);
      toast.error('Export failed');
    } finally {
      setIsProcessing(false);
    }
  }, [files, outputFormat, quality, bgColor]);

  const handleReset = useCallback(() => {
    revokeImageUrls(files.map((f) => f.info));
    setFiles([]);
    setError(null);
  }, [files]);

  const showTransparencyWarning =
    outputFormat === 'image/jpeg' && files.some((f) => f.info.hasTransparency);

  const hasNonRightAngle = files.some((f) => f.edit.rotation % 90 !== 0);

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Rotate & Flip Image Online - Free Browser-Based Tool"
        description="Rotate images by any angle and flip horizontally or vertically. Batch support with ZIP download. Free, private, no uploads."
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
              <RotateCcw className="w-6 h-6" />
            </div>
          </div>
          <h1>Rotate & Flip Image</h1>
          <p>Rotate or flip one or multiple images in your browser.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Files are processed locally in your browser and are not uploaded.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Upload */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            {files.length === 0 ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple
                description="Drop images to rotate or flip"
              />
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{files.length} image{files.length !== 1 ? 's' : ''}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.onchange = () => {
                          if (input.files) handleFilesSelected(Array.from(input.files));
                        };
                        input.click();
                      }}
                      className="btn btn-outline text-sm py-2 px-3"
                    >
                      Add More
                    </button>
                    <button onClick={handleReset} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-[var(--error)]" title="Clear All">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {files.map(({ info, edit }) => {
                    const out = calculateRotatedDimensions(info.width, info.height, edit.rotation);
                    return (
                      <div key={info.id} className="bg-muted/40 rounded-xl p-3 space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={info.previewUrl}
                            alt={info.name}
                            className="w-14 h-14 rounded-lg object-cover border border-border shrink-0"
                            style={{
                              transform: `rotate(${edit.rotation}deg) scaleX(${edit.flipH ? -1 : 1}) scaleY(${edit.flipV ? -1 : 1})`,
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{info.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {info.width}×{info.height} &rarr; {out.width}×{out.height}
                              &nbsp;&middot;&nbsp;{formatFileSize(info.originalSize)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rotation: {edit.rotation}°
                              {edit.flipH ? ' | Flipped H' : ''}
                              {edit.flipV ? ' | Flipped V' : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFile(info.id)}
                            className="p-1.5 hover:bg-background rounded-full text-muted-foreground hover:text-[var(--error)] shrink-0"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => updateEdit(info.id, (e) => ({ ...e, rotation: (e.rotation - 90 + 360) % 360 }))} className="btn btn-outline text-xs py-1.5 px-2.5" title="Rotate left 90°">
                            <RotateCcw className="w-3.5 h-3.5" /> -90°
                          </button>
                          <button onClick={() => updateEdit(info.id, (e) => ({ ...e, rotation: (e.rotation + 90) % 360 }))} className="btn btn-outline text-xs py-1.5 px-2.5" title="Rotate right 90°">
                            <RotateCw className="w-3.5 h-3.5" /> +90°
                          </button>
                          <button onClick={() => updateEdit(info.id, (e) => ({ ...e, flipH: !e.flipH }))} className={`btn btn-outline text-xs py-1.5 px-2.5 ${edit.flipH ? 'border-foreground bg-muted' : ''}`}>
                            <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
                          </button>
                          <button onClick={() => updateEdit(info.id, (e) => ({ ...e, flipV: !e.flipV }))} className={`btn btn-outline text-xs py-1.5 px-2.5 ${edit.flipV ? 'border-foreground bg-muted' : ''}`}>
                            <FlipVertical className="w-3.5 h-3.5" /> Flip V
                          </button>
                          <button onClick={() => updateEdit(info.id, () => ({ ...defaultEdit }))} className="btn btn-outline text-xs py-1.5 px-2.5">
                            <RefreshCw className="w-3.5 h-3.5" /> Reset
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Apply to all */}
                {files.length > 1 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Apply to All</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => applyToAll((e) => ({ ...e, rotation: (e.rotation - 90 + 360) % 360 }))} className="btn btn-outline text-xs py-1.5 px-2.5">
                        <RotateCcw className="w-3.5 h-3.5" /> -90° All
                      </button>
                      <button onClick={() => applyToAll((e) => ({ ...e, rotation: (e.rotation + 90) % 360 }))} className="btn btn-outline text-xs py-1.5 px-2.5">
                        <RotateCw className="w-3.5 h-3.5" /> +90° All
                      </button>
                      <button onClick={() => applyToAll((e) => ({ ...e, flipH: !e.flipH }))} className="btn btn-outline text-xs py-1.5 px-2.5">
                        <FlipHorizontal className="w-3.5 h-3.5" /> Flip H All
                      </button>
                      <button onClick={() => applyToAll((e) => ({ ...e, flipV: !e.flipV }))} className="btn btn-outline text-xs py-1.5 px-2.5">
                        <FlipVertical className="w-3.5 h-3.5" /> Flip V All
                      </button>
                      <button onClick={() => applyToAll(() => ({ ...defaultEdit }))} className="btn btn-outline text-xs py-1.5 px-2.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Reset All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          {files.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
              {/* Custom angle */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Custom Angle (°) <span className="font-normal text-muted-foreground">— apply to all images</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={customAngle}
                    onChange={(e) => setCustomAngle(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  <button
                    onClick={() => {
                      const angle = parseFloat(customAngle);
                      if (!isNaN(angle)) applyToAll((e) => ({ ...e, rotation: ((e.rotation + angle) % 360 + 360) % 360 }));
                    }}
                    className="btn btn-outline py-3 px-4"
                    disabled={!customAngle || isNaN(parseFloat(customAngle))}
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Transparent corners note */}
              {hasNonRightAngle && (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-blue-100">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Non-90° rotation expands the canvas.</p>
                    <p className="mt-1 text-xs">Corners will be filled with the background color below.</p>
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

              {/* Output format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Output Format</label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as OutputFormatOption)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="keep">Keep Original</option>
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

              {showTransparencyWarning && (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-amber-200 animate-fade-in">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Some images have transparency, which JPEG does not support.</p>
                    <p className="mt-1 text-xs">Transparent areas will be filled with the background color.</p>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                        aria-label="Background color for JPEG"
                      />
                      <span className="text-sm font-medium">{bgColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className={`btn btn-primary flex-1 py-4 text-base ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing {processedCount} of {files.length}...</>
                  ) : files.length > 1 ? (
                    <><Archive className="w-5 h-5" /> Download All as ZIP</>
                  ) : (
                    <><Download className="w-5 h-5" /> Download</>
                  )}
                </button>
                <button onClick={handleReset} className="btn btn-outline py-4 text-base sm:flex-none sm:px-6">
                  <RefreshCw className="w-5 h-5" /> Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
