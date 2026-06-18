import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eraser, Loader2, Trash2, ZoomIn } from 'lucide-react';
import { FAQSection } from '../components/FAQSection';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { downloadBytes } from '../utils/pdf/export';
import { applyRedactionsToPdf } from '../utils/pdf/pageTools';
import { openPdfDocument, renderPdfPagePreview, revokePdfPreviews } from '../utils/pdf/rendering';
import type { PdfPagePreview, RedactionItem } from '../utils/pdf/types';

export const RedactPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [selectedPage, setSelectedPage] = useState(1);
  const [items, setItems] = useState<RedactionItem[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [draftRect, setDraftRect] = useState<RedactionItem['rect'] | null>(null);

  useEffect(() => () => revokePdfPreviews(previews), [previews]);

  const currentPreview = previews.find((preview) => preview.pageNumber === selectedPage) ?? null;
  const currentItems = useMemo(() => items.filter((item) => item.pageNumber === selectedPage), [items, selectedPage]);

  const loadPdf = async (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;

    revokePdfPreviews(previews);
    setFile(nextFile);
    setPreviews([]);
    setItems([]);
    setSelectedPage(1);
    setStatus('Opening PDF...');
    setError(null);
    try {
      const { pdf } = await openPdfDocument(nextFile);
      const nextPreviews: PdfPagePreview[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        setStatus(`Rendering page ${pageNumber}/${pdf.numPages}...`);
        nextPreviews.push(await renderPdfPagePreview(pdf, pageNumber, 0.5));
      }
      setPreviews(nextPreviews);
      setStatus('Draw boxes over the preview to mark visual redactions.');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not load this PDF for redaction.');
      setStatus(null);
    }
  };

  const relativePoint = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1),
      y: Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1),
    };
  };

  const startDrawing = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!currentPreview) return;
    dragStart.current = relativePoint(event);
    setDraftRect({ x: dragStart.current.x, y: dragStart.current.y, width: 0, height: 0 });
  };

  const draw = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const point = relativePoint(event);
    const x = Math.min(dragStart.current.x, point.x);
    const y = Math.min(dragStart.current.y, point.y);
    const width = Math.abs(point.x - dragStart.current.x);
    const height = Math.abs(point.y - dragStart.current.y);
    setDraftRect({ x, y, width, height });
  };

  const endDrawing = () => {
    if (!dragStart.current || !draftRect || draftRect.width < 0.01 || draftRect.height < 0.01) {
      dragStart.current = null;
      setDraftRect(null);
      return;
    }

    setItems((current) => [
      ...current,
      { id: crypto.randomUUID(), pageNumber: selectedPage, rect: draftRect, color: '#000000' },
    ]);
    dragStart.current = null;
    setDraftRect(null);
  };

  const exportPdf = async () => {
    if (!file || items.length === 0) return;

    setIsExporting(true);
    setError(null);
    setStatus('Burning redactions into the PDF...');

    try {
      const bytes = await applyRedactionsToPdf(file, items);
      downloadBytes(bytes, `${file.name.replace(/\.pdf$/i, '')}-redacted.pdf`, 'application/pdf');
      setStatus('Redacted PDF ready. These redactions are visual burn-ins, not full content-stream removal.');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not export the redacted PDF.');
      setStatus(null);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Redact PDF – Visual Burn-In Redaction Tool"
        description="Place rectangular redaction boxes on a PDF and export a visually burned-in redacted copy locally in your browser."
        canonicalPath="/redact-pdf"
      />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-700 to-black text-white shadow-lg">
              <Eraser className="h-6 w-6" />
            </div>
          </div>
          <h1>Redact PDF</h1>
          <p>Draw redaction boxes directly on the page preview and export a visual burn-in copy without uploading your file.</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:h-fit">
            <h2 className="mb-4 text-lg font-bold">Redaction Controls</h2>
            <FileUploader onFilesSelected={loadPdf} accept=".pdf" description="Drop a PDF to redact" />

            <div className="mt-6 rounded-2xl border border-border bg-background p-4 text-sm">
              <p className="font-medium text-foreground">Privacy note</p>
              <p className="mt-2 text-muted-foreground">
                This MVP exports visual burn-in redactions. It masks page appearance, but it does not rewrite every hidden PDF content stream.
              </p>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Zoom</label>
              <input type="range" min={0.75} max={2.5} step={0.05} className="w-full" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <ZoomIn className="h-3.5 w-3.5" />
                {(zoom * 100).toFixed(0)}%
              </p>
            </div>

            {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{status}</div> : null}
            {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">{error}</div> : null}

            <button type="button" className="btn btn-primary mt-6 w-full" onClick={exportPdf} disabled={!file || items.length === 0 || isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Redacted PDF
            </button>
            <p className="mt-3 text-xs text-muted-foreground">{items.length} redaction box{items.length === 1 ? '' : 'es'} placed</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Page Preview</h2>
                <p className="text-sm text-muted-foreground">Drag across the page to create a new redaction box.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {previews.map((preview) => (
                  <button
                    key={preview.pageNumber}
                    type="button"
                    className={`rounded-xl border px-3 py-2 text-sm ${selectedPage === preview.pageNumber ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground'}`}
                    onClick={() => setSelectedPage(preview.pageNumber)}
                  >
                    Page {preview.pageNumber}
                  </button>
                ))}
              </div>
            </div>

            {!currentPreview ? (
              <div className="py-16 text-center text-muted-foreground">
                <Eraser className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p>No PDF preview yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="overflow-auto rounded-2xl border border-border bg-background p-4">
                  <div
                    ref={editorRef}
                    className="relative mx-auto select-none"
                    style={{ width: `${currentPreview.width * zoom}px` }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                  >
                    <img src={currentPreview.imageUrl} alt={`Page ${currentPreview.pageNumber}`} className="block w-full" draggable={false} />
                    {currentItems.map((item) => (
                      <div
                        key={item.id}
                        className="absolute border border-white bg-black"
                        style={{
                          left: `${item.rect.x * 100}%`,
                          top: `${item.rect.y * 100}%`,
                          width: `${item.rect.width * 100}%`,
                          height: `${item.rect.height * 100}%`,
                        }}
                      />
                    ))}
                    {draftRect ? (
                      <div
                        className="absolute border-2 border-dashed border-black bg-black/70"
                        style={{
                          left: `${draftRect.x * 100}%`,
                          top: `${draftRect.y * 100}%`,
                          width: `${draftRect.width * 100}%`,
                          height: `${draftRect.height * 100}%`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <h3 className="mb-3 font-semibold">Boxes on page {selectedPage}</h3>
                  <div className="space-y-3">
                    {currentItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No redactions on this page yet.</p>
                    ) : (
                      currentItems.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">Box {index + 1}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(item.rect.width * 100)}% × {Math.round(item.rect.height * 100)}%
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-muted-foreground hover:bg-[var(--error-light)] hover:text-[var(--error)]"
                            onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FAQSection
        items={[
          { question: 'Are these full forensic PDF redactions?', answer: 'No. This MVP burns black boxes into the visual page output. The UI and copy make that limitation explicit.' },
          { question: 'Can I place multiple boxes per page?', answer: 'Yes. Draw as many rectangles as you need on each page before exporting.' },
          { question: 'Can I zoom while redacting?', answer: 'Yes. Use the zoom slider to make precise placements on small content areas.' },
        ]}
      />
    </div>
  );
};
