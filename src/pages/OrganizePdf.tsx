import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, LayoutGrid, Loader2, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { FileUploader } from '../components/FileUploader';
import { FAQSection } from '../components/FAQSection';
import { PageSeo } from '../components/PageSeo';
import { PdfPageThumbnail } from '../components/pdf/PdfPageThumbnail';
import { downloadBytes } from '../utils/pdf/export';
import { exportOrganizedPdf, type OrganizerPageState } from '../utils/pdf/pageTools';
import { openPdfDocument, renderPdfPagePreview, revokePdfPreviews } from '../utils/pdf/rendering';
import type { PdfPagePreview } from '../utils/pdf/types';

export const OrganizePdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<OrganizerPageState[]>([]);
  const [previews, setPreviews] = useState<Record<number, PdfPagePreview>>({});
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragPageNumber = useRef<number | null>(null);

  useEffect(() => () => revokePdfPreviews(Object.values(previews)), [previews]);

  const orderedSelection = useMemo(
    () => new Set(selectedPages),
    [selectedPages],
  );

  const loadFile = async (uploadedFiles: File[]) => {
    const nextFile = uploadedFiles[0];
    if (!nextFile) return;

    revokePdfPreviews(Object.values(previews));
    setFile(nextFile);
    setPages([]);
    setSelectedPages([]);
    setPreviews({});
    setError(null);
    setStatus('Opening PDF...');
    setIsLoading(true);

    try {
      const { pdf, pageCount } = await openPdfDocument(nextFile);
      const nextPages = Array.from({ length: pageCount }, (_, index) => ({
        pageNumber: index + 1,
        rotation: 0,
      }));
      setPages(nextPages);

      const previewMap: Record<number, PdfPagePreview> = {};
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        setStatus(`Rendering page ${pageNumber}/${pageCount}...`);
        const preview = await renderPdfPagePreview(pdf, pageNumber, 0.32);
        previewMap[pageNumber] = preview;
        setPreviews((current) => ({ ...current, [pageNumber]: preview }));
      }

      setStatus(`Loaded ${pageCount} page${pageCount === 1 ? '' : 's'}. Drag thumbnails to reorder.`);
    } catch (caughtError) {
      console.error(caughtError);
      setError('Failed to load the PDF. Encrypted or malformed files may not preview correctly.');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRotation = (pageNumber: number, delta: number) => {
    setPages((current) =>
      current.map((page) =>
        page.pageNumber === pageNumber
          ? { ...page, rotation: (page.rotation + delta + 360) % 360 }
          : page,
      ),
    );
  };

  const rotateAll = (delta: number) => {
    setPages((current) => current.map((page) => ({ ...page, rotation: (page.rotation + delta + 360) % 360 })));
  };

  const deleteSelectedPages = () => {
    if (selectedPages.length === 0) return;
    setPages((current) => current.filter((page) => !orderedSelection.has(page.pageNumber)));
    setSelectedPages([]);
  };

  const removeSinglePage = (pageNumber: number) => {
    setPages((current) => current.filter((page) => page.pageNumber !== pageNumber));
    setSelectedPages((current) => current.filter((value) => value !== pageNumber));
  };

  const reorderPage = (sourcePageNumber: number, targetPageNumber: number) => {
    if (sourcePageNumber === targetPageNumber) return;
    setPages((current) => {
      const sourceIndex = current.findIndex((page) => page.pageNumber === sourcePageNumber);
      const targetIndex = current.findIndex((page) => page.pageNumber === targetPageNumber);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const exportPdf = async () => {
    if (!file || pages.length === 0) return;

    setIsExporting(true);
    setError(null);
    setStatus('Building updated PDF...');

    try {
      const bytes = await exportOrganizedPdf(file, pages);
      downloadBytes(bytes, `${file.name.replace(/\.pdf$/i, '')}-organized.pdf`, 'application/pdf');
      setStatus('Organized PDF ready. Check your downloads.');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not export the organized PDF.');
      setStatus(null);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Organize PDF Pages – Reorder, Rotate, Delete"
        description="Reorder, rotate, and delete PDF pages with drag-and-drop thumbnails. Everything stays private in your browser."
        canonicalPath="/organize-pdf"
      />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-lg">
              <LayoutGrid className="h-6 w-6" />
            </div>
          </div>
          <h1>Organize PDF Pages</h1>
          <p>Rotate, reorder, and remove pages locally with thumbnail previews. Nothing leaves your browser.</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:h-fit">
            <h2 className="mb-4 text-lg font-bold">Organizer Controls</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload one PDF to preview every page. Drag cards to reorder, rotate individual pages, or delete a selection before exporting.
            </p>

            <FileUploader onFilesSelected={loadFile} accept=".pdf" description="Drop a PDF to organize" />

            {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{status}</div> : null}
            {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">{error}</div> : null}

            <div className="mt-6 space-y-3">
              <button type="button" className="btn btn-outline w-full" onClick={() => rotateAll(-90)} disabled={pages.length === 0 || isLoading}>
                <RotateCcw className="h-4 w-4" />
                Rotate All Left
              </button>
              <button type="button" className="btn btn-outline w-full" onClick={() => rotateAll(90)} disabled={pages.length === 0 || isLoading}>
                <RotateCw className="h-4 w-4" />
                Rotate All Right
              </button>
              <button type="button" className="btn btn-outline w-full" onClick={deleteSelectedPages} disabled={selectedPages.length === 0 || isLoading}>
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedPages.length})
              </button>
              <button type="button" className="btn btn-primary w-full" onClick={exportPdf} disabled={!file || pages.length === 0 || isLoading || isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export PDF
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Page Thumbnails</h2>
                <p className="text-sm text-muted-foreground">Preview order: {pages.length} page{pages.length === 1 ? '' : 's'}</p>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rendering previews
                </div>
              ) : null}
            </div>

            {pages.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <LayoutGrid className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p>No PDF loaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pages.map((page, index) => (
                  <PdfPageThumbnail
                    key={`${page.pageNumber}-${index}`}
                    preview={previews[page.pageNumber]}
                    pageNumber={page.pageNumber}
                    displayIndex={index + 1}
                    rotation={page.rotation}
                    selected={orderedSelection.has(page.pageNumber)}
                    onToggleSelect={() =>
                      setSelectedPages((current) =>
                        current.includes(page.pageNumber)
                          ? current.filter((value) => value !== page.pageNumber)
                          : [...current, page.pageNumber],
                      )
                    }
                    onRotateLeft={() => updateRotation(page.pageNumber, -90)}
                    onRotateRight={() => updateRotation(page.pageNumber, 90)}
                    onDelete={() => removeSinglePage(page.pageNumber)}
                    draggable
                    onDragStart={() => {
                      dragPageNumber.current = page.pageNumber;
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (dragPageNumber.current) {
                        reorderPage(dragPageNumber.current, page.pageNumber);
                      }
                      dragPageNumber.current = null;
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FAQSection
        items={[
          { question: 'Does organizing pages upload my PDF?', answer: 'No. The page previews, rotation, reordering, and export all run in your browser.' },
          { question: 'Can I rotate every page at once?', answer: 'Yes. Use the rotate-all controls in the left panel to apply a 90 degree turn to the full document.' },
          { question: 'Can I delete multiple pages together?', answer: 'Yes. Select several thumbnails and use Delete Selected before exporting the final PDF.' },
        ]}
      />
    </div>
  );
};
