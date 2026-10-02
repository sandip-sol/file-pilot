import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckSquare, ChevronDownSquare, CircleDot, Download, FileInput, FilePlus2, Loader2, TextCursorInput, X } from 'lucide-react';
import { FAQSection } from '../components/FAQSection';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toolFaqs, toolSeo } from '../data/toolContent';
import { downloadBytes } from '../utils/pdf/export';
import { createBlankA4Pdf, createFillablePdf, validateFormFields, type FormFieldItem, type FormFieldKind } from '../utils/pdf/formBuilder';
import { openPdfDocument, renderPdfPagePreview, revokePdfPreviews } from '../utils/pdf/rendering';
import type { PdfPagePreview } from '../utils/pdf/types';

const fieldTypes: { kind: FormFieldKind; label: string; icon: typeof CheckSquare }[] = [
  { kind: 'text', label: 'Text field', icon: TextCursorInput },
  { kind: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { kind: 'dropdown', label: 'Dropdown', icon: ChevronDownSquare },
  { kind: 'radio', label: 'Radio button', icon: CircleDot },
];

// Default sizes as a fraction of the displayed page (roughly 18pt boxes on A4).
const defaultSize = (kind: FormFieldKind) =>
  kind === 'checkbox' || kind === 'radio' ? { width: 0.03, height: 0.022 } : { width: 0.3, height: 0.032 };

export const FormCreator = () => {
  const [source, setSource] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedKind, setSelectedKind] = useState<FormFieldKind>('text');
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  // A drag that ends off the field still fires a click on the page; this swallows it.
  const suppressClick = useRef(false);
  const counter = useRef(0);

  useEffect(() => () => revokePdfPreviews(previews), [previews]);

  const currentPreview = previews.find((preview) => preview.pageNumber === selectedPage) ?? null;
  const currentFields = useMemo(() => fields.filter((field) => field.pageNumber === selectedPage), [fields, selectedPage]);
  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null;

  const loadSource = async (name: string, bytes: Uint8Array) => {
    setSource({ name, bytes });
    setPreviews([]);
    setFields([]);
    setSelectedFieldId(null);
    setSelectedPage(1);
    setError(null);
    setStatus('Opening PDF...');
    try {
      // openPdfDocument reads a File; pdf.js may detach the buffer it is given, so pass a copy.
      const { pdf } = await openPdfDocument(new File([bytes.slice() as BlobPart], name, { type: 'application/pdf' }));
      const nextPreviews: PdfPagePreview[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        setStatus(`Rendering page ${pageNumber}/${pdf.numPages}...`);
        nextPreviews.push(await renderPdfPagePreview(pdf, pageNumber, 0.75));
      }
      setPreviews(nextPreviews);
      setStatus('Pick a field type, then click the page to place it. Drag fields to move them.');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not open this PDF. It may be encrypted or damaged.');
      setStatus(null);
    }
  };

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    await loadSource(file.name, new Uint8Array(await file.arrayBuffer()));
  };

  const startBlank = async () => loadSource('form.pdf', await createBlankA4Pdf());

  const toRelativePoint = (event: React.MouseEvent<HTMLElement>, container: HTMLElement) => {
    const bounds = container.getBoundingClientRect();
    return {
      x: Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1),
      y: Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1),
    };
  };

  const updateField = (id: string, patch: Partial<FormFieldItem>) =>
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)));

  const addField = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!currentPreview) return;
    const point = toRelativePoint(event, event.currentTarget);
    const size = defaultSize(selectedKind);
    counter.current += 1;
    const field: FormFieldItem = {
      id: crypto.randomUUID(),
      kind: selectedKind,
      pageNumber: selectedPage,
      rect: { x: Math.min(point.x, 1 - size.width), y: Math.min(point.y, 1 - size.height), ...size },
      name: selectedKind === 'radio' ? `option${counter.current}` : `${selectedKind}${counter.current}`,
      group: selectedKind === 'radio' ? 'choice' : '',
      options: selectedKind === 'dropdown' ? 'Option 1, Option 2, Option 3' : '',
    };
    setFields((current) => [...current, field]);
    setSelectedFieldId(field.id);
  };

  const startDrag = (event: React.MouseEvent<HTMLButtonElement>, field: FormFieldItem) => {
    event.stopPropagation();
    const container = event.currentTarget.parentElement;
    if (!container) return;
    const point = toRelativePoint(event, container);
    dragState.current = { id: field.id, offsetX: point.x - field.rect.x, offsetY: point.y - field.rect.y, moved: false };
    setSelectedFieldId(field.id);
  };

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag) return;
    drag.moved = true;
    const point = toRelativePoint(event, event.currentTarget);
    setFields((current) =>
      current.map((field) =>
        field.id === drag.id
          ? {
              ...field,
              rect: {
                ...field.rect,
                x: Math.min(Math.max(point.x - drag.offsetX, 0), 1 - field.rect.width),
                y: Math.min(Math.max(point.y - drag.offsetY, 0), 1 - field.rect.height),
              },
            }
          : field,
      ),
    );
  };

  const stopDrag = () => {
    if (dragState.current?.moved) suppressClick.current = true;
    dragState.current = null;
  };

  const exportPdf = async () => {
    if (!source || fields.length === 0) return;
    const problems = validateFormFields(fields);
    if (problems.length > 0) {
      setError(problems.join(' '));
      return;
    }

    setIsExporting(true);
    setError(null);
    setStatus('Building the fillable PDF...');
    try {
      const bytes = await createFillablePdf(source.bytes, fields);
      downloadBytes(bytes, `${source.name.replace(/\.pdf$/i, '')}-fillable.pdf`, 'application/pdf');
      setStatus(`Fillable PDF with ${fields.length} field${fields.length === 1 ? '' : 's'} downloaded.`);
    } catch (caughtError) {
      console.error(caughtError);
      setError(`Could not create the form. ${caughtError instanceof Error ? caughtError.message : ''}`.trim());
      setStatus(null);
    } finally {
      setIsExporting(false);
    }
  };

  const fieldLabel = (field: FormFieldItem) =>
    field.kind === 'radio' ? `${field.group || '?'}: ${field.name}` : field.name;

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo {...toolSeo('/form-creator')} />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-lg">
              <FileInput className="h-6 w-6" />
            </div>
          </div>
          <h1>PDF Form Creator</h1>
          <p>Add text fields, checkboxes, dropdowns, and radio buttons to a PDF, then download a fillable form. 100% private.</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:h-fit">
            <h2 className="mb-4 text-lg font-bold">Form Fields</h2>
            <FileUploader onFilesSelected={handleFiles} accept=".pdf" description="Drop a PDF to turn into a form" />
            <button type="button" className="btn btn-outline mt-3 w-full" onClick={startBlank}>
              <FilePlus2 className="h-4 w-4" />
              Start with a blank A4 page
            </button>

            <div className="mt-6 grid grid-cols-2 gap-2">
              {fieldTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.kind}
                    type="button"
                    className={`btn px-3 py-2 ${selectedKind === type.kind ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSelectedKind(type.kind)}
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-4 rounded-2xl border border-border bg-background p-4">
              <h3 className="font-semibold">Selected field</h3>
              {!selectedField ? (
                <p className="text-sm text-muted-foreground">Click the page to add a field, then select it to rename or remove it.</p>
              ) : (
                <>
                  {selectedField.kind === 'radio' ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">Group name</label>
                      <input className="w-full" value={selectedField.group} onChange={(event) => updateField(selectedField.id, { group: event.target.value })} />
                      <p className="mt-1 text-xs text-muted-foreground">Radio buttons with the same group name are mutually exclusive.</p>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">{selectedField.kind === 'radio' ? 'Option value' : 'Field name'}</label>
                    <input className="w-full" value={selectedField.name} onChange={(event) => updateField(selectedField.id, { name: event.target.value })} />
                  </div>

                  {selectedField.kind === 'dropdown' ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">Options (comma-separated)</label>
                      <input className="w-full" value={selectedField.options} onChange={(event) => updateField(selectedField.id, { options: event.target.value })} />
                    </div>
                  ) : null}

                  {selectedField.kind === 'text' || selectedField.kind === 'dropdown' ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">Width</label>
                      <input
                        type="range"
                        min={0.08}
                        max={0.9}
                        step={0.01}
                        className="w-full"
                        value={selectedField.rect.width}
                        onChange={(event) =>
                          updateField(selectedField.id, {
                            rect: { ...selectedField.rect, width: Number(event.target.value), x: Math.min(selectedField.rect.x, 1 - Number(event.target.value)) },
                          })
                        }
                      />
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-outline w-full"
                    onClick={() => {
                      setFields((current) => current.filter((field) => field.id !== selectedField.id));
                      setSelectedFieldId(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                    Remove field
                  </button>
                </>
              )}
            </div>

            {fields.length > 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {fields.length} field{fields.length === 1 ? '' : 's'} on {new Set(fields.map((field) => field.pageNumber)).size} page(s).
              </p>
            ) : null}

            {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground" role="status">{status}</div> : null}
            {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]" role="alert">{error}</div> : null}

            <button type="button" className="btn btn-primary mt-6 w-full" onClick={exportPdf} disabled={!source || fields.length === 0 || isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Create Fillable PDF
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Page Layout</h2>
                <p className="text-sm text-muted-foreground">Click to place the selected field type, drag to reposition.</p>
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
                <FileInput className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p>Upload a PDF or start with a blank page.</p>
              </div>
            ) : (
              <div className="overflow-auto rounded-2xl border border-border bg-background p-4">
                <div
                  className="relative mx-auto max-w-full cursor-crosshair select-none"
                  style={{ width: `${currentPreview.width}px` }}
                  onClick={(event) => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      return;
                    }
                    addField(event);
                  }}
                  onMouseMove={onMove}
                  onMouseUp={stopDrag}
                  onMouseLeave={stopDrag}
                >
                  <img src={currentPreview.imageUrl} alt={`Page ${selectedPage}`} className="block w-full" draggable={false} />
                  {currentFields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      title={fieldLabel(field)}
                      className={`absolute flex cursor-move items-center overflow-hidden border-2 border-blue-600 bg-blue-100/70 text-left text-blue-900 ${
                        field.kind === 'radio' ? 'rounded-full' : 'rounded'
                      } ${selectedFieldId === field.id ? 'ring-2 ring-foreground' : ''}`}
                      style={{
                        left: `${field.rect.x * 100}%`,
                        top: `${field.rect.y * 100}%`,
                        width: `${field.rect.width * 100}%`,
                        height: `${field.rect.height * 100}%`,
                      }}
                      onMouseDown={(event) => startDrag(event, field)}
                      onClick={(event) => {
                        event.stopPropagation();
                        suppressClick.current = false;
                        setSelectedFieldId(field.id);
                      }}
                    >
                      {field.kind === 'text' || field.kind === 'dropdown' ? (
                        <span className="block truncate px-1 text-[10px] font-medium">{fieldLabel(field)}{field.kind === 'dropdown' ? ' ▾' : ''}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FAQSection items={toolFaqs('/form-creator')} />
    </div>
  );
};
