import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckSquare, Download, FileSignature, Highlighter, Loader2, PenSquare, Type, UploadCloud, X } from 'lucide-react';
import { FAQSection } from '../components/FAQSection';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { downloadBytes } from '../utils/pdf/export';
import { applyAnnotationsToPdf } from '../utils/pdf/pageTools';
import { openPdfDocument, renderPdfPagePreview, revokePdfPreviews } from '../utils/pdf/rendering';
import type { AnnotationItem, AnnotationKind, PdfPagePreview } from '../utils/pdf/types';

const toolDefinitions: { kind: AnnotationKind; label: string; icon: typeof Type }[] = [
  { kind: 'text', label: 'Text box', icon: Type },
  { kind: 'highlight', label: 'Highlight', icon: Highlighter },
  { kind: 'checkmark', label: 'Checkmark', icon: CheckSquare },
  { kind: 'date', label: 'Date', icon: CalendarDays },
  { kind: 'signature-text', label: 'Typed signature', icon: FileSignature },
  { kind: 'signature-image', label: 'Image signature', icon: UploadCloud },
];

const buildDefaultAnnotation = (kind: AnnotationKind, pageNumber: number, x: number, y: number, signatureImage?: string | null): AnnotationItem => {
  const common = {
    id: crypto.randomUUID(),
    kind,
    pageNumber,
    rect: { x, y, width: 0.22, height: kind === 'highlight' ? 0.05 : 0.08 },
    color: kind === 'highlight' ? '#facc15' : '#111827',
    fontSize: kind.includes('signature') ? 22 : 18,
  };

  switch (kind) {
    case 'checkmark':
      return { ...common, value: '✓', rect: { x, y, width: 0.08, height: 0.08 } };
    case 'date':
      return { ...common, value: new Date().toISOString().slice(0, 10) };
    case 'signature-text':
      return { ...common, value: 'Signed Name', fontSize: 24 };
    case 'signature-image':
      return { ...common, value: '', imageDataUrl: signatureImage ?? undefined, rect: { x, y, width: 0.26, height: 0.1 } };
    case 'highlight':
      return { ...common, value: '', rect: { x, y, width: 0.28, height: 0.05 } };
    default:
      return { ...common, value: 'New text' };
  }
};

export const AnnotatePdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedTool, setSelectedTool] = useState<AnnotationKind>('text');
  const [items, setItems] = useState<AnnotationItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => () => revokePdfPreviews(previews), [previews]);

  const currentPreview = previews.find((preview) => preview.pageNumber === selectedPage) ?? null;
  const currentItems = useMemo(() => items.filter((item) => item.pageNumber === selectedPage), [items, selectedPage]);
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  const loadPdf = async (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;

    revokePdfPreviews(previews);
    setFile(nextFile);
    setPreviews([]);
    setItems([]);
    setSelectedItemId(null);
    setSelectedPage(1);
    setError(null);
    setStatus('Opening PDF...');
    try {
      const { pdf } = await openPdfDocument(nextFile);
      const nextPreviews: PdfPagePreview[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        setStatus(`Rendering page ${pageNumber}/${pdf.numPages}...`);
        nextPreviews.push(await renderPdfPagePreview(pdf, pageNumber, 0.5));
      }
      setPreviews(nextPreviews);
      setStatus('Click the preview to add fields. Drag overlay items to reposition them.');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not load this PDF for annotation.');
      setStatus(null);
    }
  };

  const toRelativePoint = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1),
      y: Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1),
      width: bounds.width,
      height: bounds.height,
    };
  };

  const addItem = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!currentPreview) return;
    if (dragState.current) return;
    const point = toRelativePoint(event);
    const item = buildDefaultAnnotation(
      selectedTool,
      selectedPage,
      Math.min(point.x, 0.9),
      Math.min(point.y, 0.9),
      signatureImage,
    );
    setItems((current) => [...current, item]);
    setSelectedItemId(item.id);
  };

  const startDrag = (event: React.MouseEvent<HTMLButtonElement>, item: AnnotationItem) => {
    event.stopPropagation();
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds) return;
    dragState.current = {
      id: item.id,
      offsetX: (event.clientX - bounds.left) / bounds.width - item.rect.x,
      offsetY: (event.clientY - bounds.top) / bounds.height - item.rect.y,
    };
    setSelectedItemId(item.id);
  };

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const point = toRelativePoint(event);
    setItems((current) =>
      current.map((item) =>
        item.id === dragState.current?.id
          ? {
              ...item,
              rect: {
                ...item.rect,
                x: Math.min(Math.max(point.x - dragState.current.offsetX, 0), 1 - item.rect.width),
                y: Math.min(Math.max(point.y - dragState.current.offsetY, 0), 1 - item.rect.height),
              },
            }
          : item,
      ),
    );
  };

  const stopDrag = () => {
    dragState.current = null;
  };

  const exportPdf = async () => {
    if (!file || items.length === 0) return;
    setIsExporting(true);
    setError(null);
    setStatus('Flattening annotations into the PDF...');

    try {
      const bytes = await applyAnnotationsToPdf(file, items);
      downloadBytes(bytes, `${file.name.replace(/\.pdf$/i, '')}-annotated.pdf`, 'application/pdf');
      setStatus('Annotated PDF ready. Check your downloads.');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not export the annotated PDF.');
      setStatus(null);
    } finally {
      setIsExporting(false);
    }
  };

  const faqItems = [
    { question: 'Can I add a typed or image signature?', answer: 'Yes. Use Typed signature for a quick name placement or Image signature to upload a signature graphic.' },
    { question: 'Are the annotations flattened into the export?', answer: 'Yes. The exported PDF burns the current overlay items into the document so the result is easy to share.' },
    { question: 'Can I move fields after placing them?', answer: 'Yes. Select a tool, click to add it, and drag the overlay item around before exporting.' },
  ];

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Fill Forms / Annotate PDF – Text, Highlights, Signatures"
        description="Add text boxes, highlights, checkmarks, dates, and simple signatures to a PDF locally in your browser."
        canonicalPath="/annotate-pdf"
        faqItems={faqItems}
      />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-500 to-green-600 text-white shadow-lg">
              <PenSquare className="h-6 w-6" />
            </div>
          </div>
          <h1>Fill Forms / Annotate PDF</h1>
          <p>Add text, highlights, dates, checkmarks, and simple signatures on top of a local PDF preview, then flatten everything into the export.</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:h-fit">
            <h2 className="mb-4 text-lg font-bold">Annotation Tools</h2>
            <FileUploader onFilesSelected={loadPdf} accept=".pdf" description="Drop a PDF to annotate" />

            <div className="mt-6 grid grid-cols-2 gap-2">
              {toolDefinitions.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.kind}
                    type="button"
                    className={`btn px-3 py-2 ${selectedTool === tool.kind ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSelectedTool(tool.kind)}
                  >
                    <Icon className="h-4 w-4" />
                    {tool.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Zoom</label>
              <input type="range" min={0.75} max={2.2} step={0.05} className="w-full" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </div>

            <div className="mt-6 space-y-4 rounded-2xl border border-border bg-background p-4">
              <h3 className="font-semibold">Selected item</h3>
              {!selectedItem ? (
                <p className="text-sm text-muted-foreground">Click the preview to add a field, then select it here to edit or remove it.</p>
              ) : (
                <>
                  {selectedItem.kind !== 'highlight' && selectedItem.kind !== 'checkmark' && selectedItem.kind !== 'signature-image' ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">Value</label>
                      <input
                        className="w-full"
                        value={selectedItem.value}
                        onChange={(event) =>
                          setItems((current) =>
                            current.map((item) => (item.id === selectedItem.id ? { ...item, value: event.target.value } : item)),
                          )
                        }
                      />
                    </div>
                  ) : null}

                  {selectedItem.kind === 'signature-image' ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">Signature image</label>
                      <FileUploader
                        onFilesSelected={(files) => {
                          const imageFile = files[0];
                          if (!imageFile) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const dataUrl = typeof reader.result === 'string' ? reader.result : null;
                            setSignatureImage(dataUrl);
                            setItems((current) =>
                              current.map((item) => (item.id === selectedItem.id ? { ...item, imageDataUrl: dataUrl ?? undefined } : item)),
                            );
                          };
                          reader.readAsDataURL(imageFile);
                        }}
                        accept="image/*"
                        description="Drop a signature image"
                      />
                    </div>
                  ) : null}

                  {selectedItem.kind !== 'highlight' ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">Color</label>
                      <input
                        type="color"
                        className="h-11 w-full rounded-xl border border-border bg-background p-1"
                        value={selectedItem.color}
                        onChange={(event) =>
                          setItems((current) =>
                            current.map((item) => (item.id === selectedItem.id ? { ...item, color: event.target.value } : item)),
                          )
                        }
                      />
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-outline w-full"
                    onClick={() => {
                      setItems((current) => current.filter((item) => item.id !== selectedItem.id));
                      setSelectedItemId(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                    Remove field
                  </button>
                </>
              )}
            </div>

            {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{status}</div> : null}
            {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">{error}</div> : null}

            <button type="button" className="btn btn-primary mt-6 w-full" onClick={exportPdf} disabled={!file || items.length === 0 || isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Annotated PDF
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Editable Overlay Preview</h2>
                <p className="text-sm text-muted-foreground">Click anywhere on the page to add the current tool, then drag it into place.</p>
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
                <PenSquare className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p>No PDF preview yet.</p>
              </div>
            ) : (
              <div className="overflow-auto rounded-2xl border border-border bg-background p-4">
                <div
                  className="relative mx-auto"
                  style={{ width: `${currentPreview.width * zoom}px` }}
                  onClick={addItem}
                  onMouseMove={onMove}
                  onMouseUp={stopDrag}
                  onMouseLeave={stopDrag}
                >
                  <img src={currentPreview.imageUrl} alt={`Page ${selectedPage}`} className="block w-full" draggable={false} />
                  {currentItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`absolute overflow-hidden rounded border text-left ${item.kind === 'highlight' ? 'border-amber-500 bg-yellow-300/40' : 'border-foreground bg-white/90'} ${selectedItemId === item.id ? 'ring-2 ring-foreground' : ''}`}
                      style={{
                        left: `${item.rect.x * 100}%`,
                        top: `${item.rect.y * 100}%`,
                        width: `${item.rect.width * 100}%`,
                        height: `${item.rect.height * 100}%`,
                        color: item.color,
                      }}
                      onMouseDown={(event) => startDrag(event, item)}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedItemId(item.id);
                      }}
                    >
                      {item.kind === 'signature-image' && item.imageDataUrl ? (
                        <img src={item.imageDataUrl} alt="Signature" className="h-full w-full object-contain" />
                      ) : item.kind === 'highlight' ? null : (
                        <span className="block truncate p-1 text-xs font-medium">{item.value || toolDefinitions.find((tool) => tool.kind === item.kind)?.label}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FAQSection items={faqItems} />
    </div>
  );
};
