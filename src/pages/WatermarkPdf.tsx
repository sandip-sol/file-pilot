import { useEffect, useMemo, useState } from 'react';
import { Download, ImagePlus, Loader2, Stamp } from 'lucide-react';
import { FAQSection } from '../components/FAQSection';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { downloadBytes } from '../utils/pdf/export';
import { parsePageSelectionInput } from '../utils/pdf/pageSelection';
import { openPdfDocument, renderPdfPagePreview } from '../utils/pdf/rendering';
import type { PdfPagePreview, WatermarkConfig } from '../utils/pdf/types';
import { applyWatermarkToPdf } from '../utils/pdf/watermark';

const defaultConfig: WatermarkConfig = {
  kind: 'text',
  text: 'CONFIDENTIAL',
  imageDataUrl: null,
  opacity: 0.2,
  fontSize: 34,
  color: '#111827',
  rotation: -35,
  position: 'center',
  scale: 0.28,
  applyToAllPages: true,
  selectedPages: [],
};

export const WatermarkPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PdfPagePreview | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageInput, setPageInput] = useState('');
  const [config, setConfig] = useState<WatermarkConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.imageUrl);
  }, [preview]);

  const selectedPageCount = config.applyToAllPages ? pageCount : config.selectedPages.length;

  const overlayStyle = useMemo(() => {
    const base = {
      opacity: config.opacity,
      transform: `rotate(${config.rotation}deg)`,
      color: config.color,
    } as const;

    if (config.position === 'center') {
      return { ...base, top: '50%', left: '50%', translate: '-50% -50%' };
    }

    const spacing = '1rem';
    if (config.position === 'top-left') return { ...base, top: spacing, left: spacing };
    if (config.position === 'top-right') return { ...base, top: spacing, right: spacing };
    if (config.position === 'bottom-left') return { ...base, bottom: spacing, left: spacing };
    return { ...base, bottom: spacing, right: spacing };
  }, [config]);

  const handlePdfSelected = async (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (preview) URL.revokeObjectURL(preview.imageUrl);
    setFile(nextFile);
    setError(null);
    setStatus('Opening PDF...');
    setIsLoading(true);

    try {
      const { pdf } = await openPdfDocument(nextFile);
      setPageCount(pdf.numPages);
      const firstPagePreview = await renderPdfPagePreview(pdf, 1, 0.55);
      setPreview(firstPagePreview);
      setStatus(`Loaded ${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'}. Watermark preview uses page 1.`);
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not preview this PDF.');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatermarkImage = async (files: File[]) => {
    const imageFile = files[0];
    if (!imageFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((current) => ({
        ...current,
        kind: 'image',
        imageDataUrl: typeof reader.result === 'string' ? reader.result : null,
      }));
    };
    reader.readAsDataURL(imageFile);
  };

  const exportPdf = async () => {
    if (!file) return;
    if (config.kind === 'text' && !config.text.trim()) {
      setError('Enter text for the watermark.');
      return;
    }
    if (config.kind === 'image' && !config.imageDataUrl) {
      setError('Choose an image watermark before exporting.');
      return;
    }

    setError(null);
    setIsExporting(true);
    setStatus('Applying watermark...');

    try {
      const bytes = await applyWatermarkToPdf(file, config);
      downloadBytes(bytes, `${file.name.replace(/\.pdf$/i, '')}-watermarked.pdf`, 'application/pdf');
      setStatus('Watermarked PDF ready. Check your downloads.');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not export the watermarked PDF.');
      setStatus(null);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Watermark PDF – Add Text or Image Watermarks"
        description="Add text or image watermarks to a PDF locally in your browser. Control opacity, size, rotation, and page targeting."
        canonicalPath="/watermark-pdf"
      />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-lg">
              <Stamp className="h-6 w-6" />
            </div>
          </div>
          <h1>Watermark PDF</h1>
          <p>Add text or image watermarks privately with live preview controls for opacity, size, rotation, and placement.</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:h-fit">
            <h2 className="mb-4 text-lg font-bold">Watermark Settings</h2>
            <FileUploader onFilesSelected={handlePdfSelected} accept=".pdf" description="Drop a PDF to watermark" />

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Watermark type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className={`btn ${config.kind === 'text' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setConfig((current) => ({ ...current, kind: 'text' }))}>
                    Text
                  </button>
                  <button type="button" className={`btn ${config.kind === 'image' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setConfig((current) => ({ ...current, kind: 'image' }))}>
                    Image
                  </button>
                </div>
              </div>

              {config.kind === 'text' ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Watermark text</label>
                    <input className="w-full" value={config.text} onChange={(event) => setConfig((current) => ({ ...current, text: event.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">Font size</label>
                      <input type="number" min={12} max={72} className="w-full" value={config.fontSize} onChange={(event) => setConfig((current) => ({ ...current, fontSize: Number(event.target.value) }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">Color</label>
                      <input type="color" className="h-11 w-full rounded-xl border border-border bg-background p-1" value={config.color} onChange={(event) => setConfig((current) => ({ ...current, color: event.target.value }))} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <FileUploader onFilesSelected={handleWatermarkImage} accept="image/*" description="Drop a watermark image" />
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Image scale</label>
                    <input type="range" min={0.1} max={0.8} step={0.02} className="w-full" value={config.scale} onChange={(event) => setConfig((current) => ({ ...current, scale: Number(event.target.value) }))} />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Opacity</label>
                  <input type="range" min={0.05} max={1} step={0.05} className="w-full" value={config.opacity} onChange={(event) => setConfig((current) => ({ ...current, opacity: Number(event.target.value) }))} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Rotation</label>
                  <input type="number" className="w-full" value={config.rotation} onChange={(event) => setConfig((current) => ({ ...current, rotation: Number(event.target.value) }))} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Position</label>
                <select value={config.position} onChange={(event) => setConfig((current) => ({ ...current, position: event.target.value as WatermarkConfig['position'] }))}>
                  <option value="center">Center</option>
                  <option value="top-left">Top left</option>
                  <option value="top-right">Top right</option>
                  <option value="bottom-left">Bottom left</option>
                  <option value="bottom-right">Bottom right</option>
                  <option value="tiled">Tiled</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={config.applyToAllPages} onChange={(event) => setConfig((current) => ({ ...current, applyToAllPages: event.target.checked, selectedPages: event.target.checked ? [] : current.selectedPages }))} />
                Apply to all pages
              </label>

              {!config.applyToAllPages ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Pages</label>
                  <input
                    className="w-full"
                    placeholder="e.g. 1,3,5-8"
                    value={pageInput}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPageInput(value);
                      setConfig((current) => ({ ...current, selectedPages: parsePageSelectionInput(value, pageCount) }));
                    }}
                  />
                </div>
              ) : null}
            </div>

            {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{status}</div> : null}
            {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">{error}</div> : null}
            <button type="button" className="btn btn-primary mt-6 w-full" onClick={exportPdf} disabled={!file || isLoading || isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Watermarked PDF
            </button>
            <p className="mt-3 text-xs text-muted-foreground">Selected target pages: {selectedPageCount || 0}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Preview</h2>
                <p className="text-sm text-muted-foreground">Preview is rendered from page 1. Export applies the current settings across your chosen pages.</p>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rendering preview
                </div>
              ) : null}
            </div>

            {!preview ? (
              <div className="py-16 text-center text-muted-foreground">
                <ImagePlus className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p>No PDF preview yet.</p>
              </div>
            ) : (
              <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-white p-4">
                <img src={preview.imageUrl} alt="Watermark preview" className="mx-auto max-w-full" />
                {config.position === 'tiled' ? (
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-10 p-8">
                    {Array.from({ length: 9 }, (_, index) => (
                      <div key={index} className="flex items-center justify-center text-center" style={overlayStyle}>
                        {config.kind === 'text' ? (
                          <span style={{ fontSize: `${config.fontSize}px`, fontWeight: 700 }}>{config.text || 'Watermark'}</span>
                        ) : config.imageDataUrl ? (
                          <img src={config.imageDataUrl} alt="Watermark" style={{ width: `${config.scale * 220}px` }} />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute" style={overlayStyle}>
                      {config.kind === 'text' ? (
                        <span style={{ fontSize: `${config.fontSize}px`, fontWeight: 700 }}>{config.text || 'Watermark'}</span>
                      ) : config.imageDataUrl ? (
                        <img src={config.imageDataUrl} alt="Watermark" style={{ width: `${config.scale * 320}px` }} />
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <FAQSection
        items={[
          { question: 'Does watermarking upload my PDF?', answer: 'No. The preview and the export both happen locally in the browser.' },
          { question: 'Can I watermark only a few pages?', answer: 'Yes. Turn off Apply to all pages and enter page numbers such as 1,3,5-8.' },
          { question: 'Can I use a logo image as a watermark?', answer: 'Yes. Switch to image watermark mode and upload a PNG or JPG logo.' },
        ]}
      />
    </div>
  );
};
