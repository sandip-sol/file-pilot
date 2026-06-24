import { useState, useCallback, useEffect, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { RelatedTools } from '../components/RelatedTools';
import { ToolUsageTracker } from '../components/ToolUsageTracker';
import { toast } from 'sonner';
import {
  Loader2, Download, RefreshCw, RotateCw, RotateCcw, Trash2, Plus,
  GripVertical, FileText, Sparkles, ScanLine,
} from 'lucide-react';
import {
  generatePdfFromImages,
  estimatePdfSize,
  type PageSizeOption,
  type PageOrientation,
  type PageMargins,
  type EnhanceMode,
} from '../utils/pdf/imageToPdf';
import { formatFileSize } from '../utils/image/support';
import { downloadBlobFile } from '../utils/pdf/export';

interface PageItem {
  id: string;
  file: File;
  name: string;
  width: number;
  height: number;
  size: number;
  rotation: number;
  previewUrl: string;
}

let idCounter = 0;

export const ScanImagesToPdf = () => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [customW, setCustomW] = useState('612');
  const [customH, setCustomH] = useState('792');
  const [orientation, setOrientation] = useState<PageOrientation>('auto');
  const [margins, setMargins] = useState<PageMargins>('medium');
  const [enhance, setEnhance] = useState<EnhanceMode>('original');
  const [quality, setQuality] = useState(0.85);
  const [outputFilename, setOutputFilename] = useState('scanned-document');

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const addMoreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      pages.forEach(p => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  const loadPages = useCallback(async (files: File[]) => {
    const newPages: PageItem[] = [];
    for (const file of files) {
      try {
        const bitmap = await createImageBitmap(file);
        newPages.push({
          id: `scan-${++idCounter}`,
          file,
          name: file.name,
          width: bitmap.width,
          height: bitmap.height,
          size: file.size,
          rotation: 0,
          previewUrl: URL.createObjectURL(file),
        });
        bitmap.close();
      } catch {
        toast.error(`Could not load "${file.name}". File may be corrupt or unsupported.`);
      }
    }
    setPages(prev => [...prev, ...newPages]);
    setPdfBlob(null);
  }, []);

  const removePage = useCallback((id: string) => {
    setPages(prev => {
      const item = prev.find(p => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(p => p.id !== id);
    });
    setPdfBlob(null);
  }, []);

  const rotatePage = useCallback((id: string, degrees: number) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: (p.rotation + degrees + 360) % 360 } : p));
    setPdfBlob(null);
  }, []);

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setPages(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIdx, 1);
      updated.splice(idx, 0, moved);
      return updated;
    });
    setDragIdx(null);
    setDragOverIdx(null);
    setPdfBlob(null);
  };

  const handleGenerate = useCallback(async () => {
    if (pages.length === 0) return;
    setProcessing(true);
    setPdfBlob(null);

    try {
      const pageImages = pages.map(p => ({
        file: p.file,
        rotation: p.rotation,
      }));

      const pdfBytes = await generatePdfFromImages(pageImages, {
        pageSize,
        customWidth: pageSize === 'custom' ? parseFloat(customW) : undefined,
        customHeight: pageSize === 'custom' ? parseFloat(customH) : undefined,
        orientation,
        margins,
        enhance,
        quality,
        outputFilename,
      }, (current, total) => {
        setProgress({ current, total });
      });

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setPdfBlob(blob);
      toast.success(`PDF created with ${pages.length} page${pages.length > 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(`PDF generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  }, [pages, pageSize, customW, customH, orientation, margins, enhance, quality, outputFilename]);

  const handleDownload = useCallback(() => {
    if (!pdfBlob) return;
    const name = outputFilename.endsWith('.pdf') ? outputFilename : `${outputFilename}.pdf`;
    downloadBlobFile(pdfBlob, name);
  }, [pdfBlob, outputFilename]);

  const handleReset = useCallback(() => {
    pages.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPages([]);
    setPdfBlob(null);
  }, [pages]);

  const avgSizeKB = pages.length > 0 ? pages.reduce((s, p) => s + p.size, 0) / pages.length / 1024 : 0;
  const estimate = pages.length > 0 ? estimatePdfSize(pages.length, avgSizeKB * quality) : '';

  return (
    <div>
      <PageSeo
        title="Scan Images to PDF — PDF Solver"
        description="Turn photos of documents into a clean, ordered, downloadable PDF. All processing happens locally in your browser."
      />
      <ToolUsageTracker />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
              <ScanLine className="w-6 h-6" />
            </div>
          </div>
          <h1>Scan Images to PDF</h1>
          <p>Turn photos of documents into a clean, ordered, downloadable PDF.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Your files are processed locally in your browser and are not uploaded.
          </p>
        </div>
      </div>

      <div className="container pb-12 max-w-6xl mx-auto">
        {pages.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <FileUploader
            onFilesSelected={loadPages}
            accept="image/*"
            multiple
            description="Drop scanned document images here"
            hint="Upload photos of documents. You can reorder, rotate, and enhance them before creating a PDF."
          />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pages panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{pages.length} page{pages.length > 1 ? 's' : ''}</h2>
                <div className="flex gap-2">
                  <button onClick={() => addMoreRef.current?.click()} className="btn btn-outline py-1.5 px-3 text-sm">
                    <Plus className="w-3.5 h-3.5" /> Add pages
                  </button>
                  <input
                    ref={addMoreRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      if (e.target.files) loadPages(Array.from(e.target.files));
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Drag to reorder pages. Page order here matches the final PDF.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {pages.map((page, idx) => (
                  <div
                    key={page.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                    className={`relative rounded-lg border bg-card overflow-hidden cursor-grab active:cursor-grabbing transition-all ${dragOverIdx === idx ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-border'}`}
                  >
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold rounded px-1.5 py-0.5 z-10">
                      {idx + 1}
                    </div>
                    <div className="absolute top-1 right-1 flex gap-0.5 z-10">
                      <button onClick={() => rotatePage(page.id, -90)} className="bg-black/60 text-white rounded p-0.5 hover:bg-black/80" aria-label="Rotate left">
                        <RotateCcw className="h-3 w-3" />
                      </button>
                      <button onClick={() => rotatePage(page.id, 90)} className="bg-black/60 text-white rounded p-0.5 hover:bg-black/80" aria-label="Rotate right">
                        <RotateCw className="h-3 w-3" />
                      </button>
                      <button onClick={() => removePage(page.id)} className="bg-red-600/80 text-white rounded p-0.5 hover:bg-red-700" aria-label="Delete page">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={page.previewUrl}
                        alt={`Page ${idx + 1}`}
                        className="max-w-full max-h-full object-contain"
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                      />
                    </div>
                    <div className="px-2 py-1 text-xs text-muted-foreground truncate flex items-center gap-1">
                      <GripVertical className="h-3 w-3 shrink-0" />
                      {page.name}
                      {page.rotation !== 0 && <span className="text-indigo-500">({page.rotation}°)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings panel */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 sticky top-4">
                <h2 className="text-lg font-semibold">PDF Settings</h2>

                {/* Page size */}
                <div>
                  <label htmlFor="scan-size" className="block text-sm font-medium mb-1">Page Size</label>
                  <select id="scan-size" value={pageSize} onChange={e => { setPageSize(e.target.value as PageSizeOption); setPdfBlob(null); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="original">Original Image Size</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {pageSize === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="scan-cw" className="block text-xs mb-1">Width (pt)</label>
                      <input id="scan-cw" type="number" value={customW} onChange={e => setCustomW(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label htmlFor="scan-ch" className="block text-xs mb-1">Height (pt)</label>
                      <input id="scan-ch" type="number" value={customH} onChange={e => setCustomH(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                    </div>
                  </div>
                )}

                {/* Orientation */}
                <div>
                  <label htmlFor="scan-orient" className="block text-sm font-medium mb-1">Orientation</label>
                  <select id="scan-orient" value={orientation} onChange={e => { setOrientation(e.target.value as PageOrientation); setPdfBlob(null); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="auto">Automatic</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                {/* Margins */}
                <div>
                  <label htmlFor="scan-margins" className="block text-sm font-medium mb-1">Margins</label>
                  <select id="scan-margins" value={margins} onChange={e => { setMargins(e.target.value as PageMargins); setPdfBlob(null); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="none">None</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                {/* Enhancement */}
                <div>
                  <label htmlFor="scan-enhance" className="block text-sm font-medium mb-1">Enhancement</label>
                  <select id="scan-enhance" value={enhance} onChange={e => { setEnhance(e.target.value as EnhanceMode); setPdfBlob(null); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="original">Original Color</option>
                    <option value="grayscale">Grayscale</option>
                    <option value="bw">Black & White</option>
                    <option value="high-contrast">High Contrast</option>
                  </select>
                </div>

                {/* Quality */}
                <div>
                  <label htmlFor="scan-quality" className="block text-sm font-medium mb-1">Image Quality ({Math.round(quality * 100)}%)</label>
                  <input id="scan-quality" type="range" min={20} max={100} value={Math.round(quality * 100)} onChange={e => { setQuality(Number(e.target.value) / 100); setPdfBlob(null); }} className="w-full" />
                  <p className="text-xs text-muted-foreground">Lower quality = smaller file. Higher quality = clearer text.</p>
                </div>

                {/* Filename */}
                <div>
                  <label htmlFor="scan-name" className="block text-sm font-medium mb-1">Output Filename</label>
                  <div className="flex items-center gap-1">
                    <input id="scan-name" type="text" value={outputFilename} onChange={e => setOutputFilename(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                    <span className="text-sm text-muted-foreground">.pdf</span>
                  </div>
                </div>

                {/* Info */}
                <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
                  <p>{pages.length} page{pages.length > 1 ? 's' : ''}</p>
                  {estimate && <p>Estimated size: {estimate}</p>}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button onClick={handleGenerate} disabled={processing} className="w-full btn btn-primary py-2.5">
                    {processing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing page {progress.current}/{progress.total}...</>
                    ) : (
                      <><FileText className="w-4 h-4" /> Generate PDF</>
                    )}
                  </button>

                  {pdfBlob && (
                    <button onClick={handleDownload} className="w-full btn btn-outline py-2.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      <Download className="w-4 h-4" /> Download PDF ({formatFileSize(pdfBlob.size)})
                    </button>
                  )}

                  <button onClick={handleReset} className="w-full btn btn-outline py-2">
                    <RefreshCw className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <RelatedTools />
    </div>
  );
};
