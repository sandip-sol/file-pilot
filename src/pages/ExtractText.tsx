import { useMemo, useState } from 'react';
import { Copy, Download, FileSearch2, Loader2, ScanText, Trash2 } from 'lucide-react';
import { FileUploader } from '../components/FileUploader';
import { FAQSection } from '../components/FAQSection';
import { PageSeo } from '../components/PageSeo';
import { Textarea } from '../components/ui/textarea';
import { terminateOcrWorker } from '../utils/ocrHelpers';
import { buildCombinedText, buildPerPageTextEntries, exportSearchablePdfFromOcr } from '../utils/pdf/ocrExport';
import { downloadBytes, downloadTextFile, downloadZipFromEntries } from '../utils/pdf/export';
import type { ExtractedDocumentResult, OcrPageResult } from '../utils/pdf/types';
import { extractRichTextFromFiles } from '../utils/textExtraction';

export const ExtractText = () => {
  const [results, setResults] = useState<ExtractedDocumentResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedPageNumber, setSelectedPageNumber] = useState(1);
  const [showConfidence, setShowConfidence] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const combinedText = useMemo(() => buildCombinedText(results), [results]);

  const selectedDocument = results.find((entry) => entry.fileName === selectedFileName) ?? results[0] ?? null;
  const selectedPage = selectedDocument?.pages.find((page) => page.pageNumber === selectedPageNumber) ?? selectedDocument?.pages[0] ?? null;

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setStatus('Preparing extraction...');

    try {
      const extracted = await extractRichTextFromFiles(files, ({ fileIndex, totalFiles, fileName, stage }) => {
        setStatus(`${stage} • ${fileName} (${fileIndex}/${totalFiles})`);
      });
      setResults(extracted);
      setSelectedFileName(extracted[0]?.fileName ?? null);
      setSelectedPageNumber(1);
      setStatus(`Extracted text from ${extracted.length} file${extracted.length === 1 ? '' : 's'}.`);
    } catch (caughtError) {
      console.error(caughtError);
      setError('Failed to extract text from one or more files. Some PDFs may be image-only or use unsupported features.');
      setStatus(null);
    } finally {
      setIsProcessing(false);
      await terminateOcrWorker();
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
    setStatus(null);
    setSelectedFileName(null);
    setSelectedPageNumber(1);
  };

  const copyPageText = async (page: OcrPageResult | null) => {
    if (!page) return;
    await navigator.clipboard.writeText(page.text || '[No text detected]');
  };

  const exportSearchablePdf = async () => {
    if (!selectedDocument) return;
    const bytes = await exportSearchablePdfFromOcr(selectedDocument);
    downloadBytes(bytes, `${selectedDocument.fileName.replace(/\.[^.]+$/, '')}-searchable.pdf`, 'application/pdf');
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Extract Text from PDF or Images – OCR Tool"
        description="Extract text from PDFs, scanned PDFs, and images in your browser with page-level OCR results, confidence overlays, and private TXT exports."
        canonicalPath="/extract-text"
        faqItems={[
          { question: 'Can I extract text from both PDFs and images?', answer: 'Yes. Text PDFs are read directly, and scanned pages or images fall back to OCR in the browser.' },
          { question: 'Does this upload my files?', answer: 'No. Extraction, OCR, previews, and exports all stay on your device.' },
          { question: 'Can I inspect OCR confidence and boxes?', answer: 'Yes. The page-level result viewer can show OCR bounding boxes and average confidence metrics.' },
          { question: 'Can I export page-wise text files?', answer: 'Yes. Download a combined TXT or export individual page TXT files as a ZIP archive.' },
        ]}
      />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
              <ScanText className="h-6 w-6" />
            </div>
          </div>
          <h1>Extract Text from PDF or Images</h1>
          <p>Read text PDFs directly, fall back to OCR when needed, and inspect results page by page without uploading anything.</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:h-fit">
            <h2 className="mb-4 text-lg font-bold">OCR Output</h2>
            <FileUploader onFilesSelected={handleFilesSelected} multiple accept=".pdf,image/*" description="Drop PDF or image files here" />

            {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{status}</div> : null}
            {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">{error}</div> : null}

            <div className="mt-6 space-y-3">
              <button type="button" className="btn btn-primary w-full" onClick={() => downloadTextFile(combinedText, 'extracted-text.txt')} disabled={!combinedText || isProcessing}>
                <Download className="h-4 w-4" />
                Download Combined TXT
              </button>
              <button
                type="button"
                className="btn btn-outline w-full"
                onClick={() => downloadZipFromEntries(buildPerPageTextEntries(results).map((entry) => ({ filename: entry.filename, data: entry.text })), 'ocr-pages.zip')}
                disabled={results.length === 0 || isProcessing}
              >
                <FileSearch2 className="h-4 w-4" />
                Download Page-wise TXT ZIP
              </button>
              <button type="button" className="btn btn-outline w-full" onClick={exportSearchablePdf} disabled={!selectedDocument || !selectedDocument.pages.some((page) => page.previewUrl)}>
                <Download className="h-4 w-4" />
                Export Searchable PDF
              </button>
              <button type="button" className="btn btn-outline w-full" onClick={clearResults} disabled={results.length === 0 && !status && !error}>
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background p-4">
              <p className="mb-3 text-sm font-medium text-foreground">Viewer options</p>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={showBoxes} onChange={(event) => setShowBoxes(event.target.checked)} />
                Show bounding boxes
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={showConfidence} onChange={(event) => setShowConfidence(event.target.checked)} />
                Show confidence metrics
              </label>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Combined Output</h2>
                  <p className="text-sm text-muted-foreground">Preserves the current behavior while adding richer page-level inspection below.</p>
                </div>
                {isProcessing ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing
                  </div>
                ) : null}
              </div>
              <Textarea value={combinedText || ''} readOnly className="min-h-[220px] resize-y" placeholder="No extracted text yet." />
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Page-Level Results</h2>
                  <p className="text-sm text-muted-foreground">Inspect OCR text, confidence, and overlays one page at a time.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.map((entry) => (
                    <button
                      key={entry.fileName}
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-sm ${selectedDocument?.fileName === entry.fileName ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground'}`}
                      onClick={() => {
                        setSelectedFileName(entry.fileName);
                        setSelectedPageNumber(1);
                      }}
                    >
                      {entry.fileName}
                    </button>
                  ))}
                </div>
              </div>

              {!selectedDocument ? (
                <div className="py-16 text-center text-muted-foreground">
                  <ScanText className="mx-auto mb-4 h-16 w-16 opacity-30" />
                  <p>No extracted pages yet.</p>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="overflow-hidden rounded-2xl border border-border bg-background p-4">
                    {selectedPage?.previewUrl ? (
                      <div className="relative mx-auto max-w-3xl">
                        <img src={selectedPage.previewUrl} alt={`Page ${selectedPage.pageNumber}`} className="w-full rounded-xl border border-border" />
                        {showBoxes
                          ? selectedPage.words.map((word) => (
                              <div
                                key={word.id}
                                className="absolute border border-amber-500/80 bg-amber-300/10"
                                title={`${word.text} (${word.confidence.toFixed(1)}%)`}
                                style={{
                                  left: `${(word.bbox.x0 / selectedPage.width) * 100}%`,
                                  top: `${(word.bbox.y0 / selectedPage.height) * 100}%`,
                                  width: `${((word.bbox.x1 - word.bbox.x0) / selectedPage.width) * 100}%`,
                                  height: `${((word.bbox.y1 - word.bbox.y0) / selectedPage.height) * 100}%`,
                                }}
                              />
                            ))
                          : null}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">No page preview available.</div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.pages.map((page) => (
                        <button
                          key={page.pageNumber}
                          type="button"
                          className={`rounded-xl border px-3 py-2 text-sm ${selectedPage?.pageNumber === page.pageNumber ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground'}`}
                          onClick={() => setSelectedPageNumber(page.pageNumber)}
                        >
                          Page {page.pageNumber}
                        </button>
                      ))}
                    </div>

                    {selectedPage ? (
                      <>
                        {showConfidence ? (
                          <div className="rounded-xl border border-border bg-card p-4 text-sm">
                            <p className="text-muted-foreground">Average confidence</p>
                            <p className="mt-1 text-2xl font-bold">{selectedPage.averageConfidence.toFixed(1)}%</p>
                            <p className="mt-2 text-xs text-muted-foreground">{selectedPage.words.length} word boxes • {selectedPage.lines.length} lines • {selectedPage.blocks.length} blocks</p>
                          </div>
                        ) : null}

                        <div className="flex gap-2">
                          <button type="button" className="btn btn-outline flex-1 px-3 py-2" onClick={() => copyPageText(selectedPage)}>
                            <Copy className="h-4 w-4" />
                            Copy page text
                          </button>
                        </div>

                        <Textarea value={selectedPage.text || '[No text detected]'} readOnly className="min-h-[220px] resize-y" />
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FAQSection
        items={[
          { question: 'Can I extract text from both PDFs and images?', answer: 'Yes. Text PDFs are read directly, and scanned pages or images use OCR in the browser.' },
          { question: 'Does this upload my files?', answer: 'No. Text extraction, OCR, previews, and exports stay local to your device.' },
          { question: 'Can I export page-wise text files?', answer: 'Yes. Use the page-wise TXT ZIP export when you want a separate file for each OCR page.' },
          { question: 'Is searchable PDF export browser-only?', answer: 'Yes. The searchable export is generated locally by combining page images with low-opacity OCR text overlays.' },
        ]}
      />
    </div>
  );
};
