import { useState } from 'react';
import { GitCompareArrows, Loader2 } from 'lucide-react';
import { FAQSection } from '../components/FAQSection';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { buildPdfCompareResult } from '../utils/pdf/compare';
import type { PdfCompareResult } from '../utils/pdf/types';
import { extractRichTextFromFiles } from '../utils/textExtraction';
import { terminateOcrWorker } from '../utils/ocrHelpers';

export const ComparePdf = () => {
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [result, setResult] = useState<PdfCompareResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const compare = async (first: File, second: File) => {
    setIsComparing(true);
    setError(null);
    setStatus('Extracting text from both PDFs...');

    try {
      const [left, right] = await extractRichTextFromFiles([first, second], ({ fileIndex, totalFiles, stage, fileName }) => {
        setStatus(`${stage} • ${fileName} (${fileIndex}/${totalFiles})`);
      });

      setResult(buildPdfCompareResult(left.pages.map((page) => page.text), right.pages.map((page) => page.text)));
      setStatus('Comparison complete.');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not compare these PDFs. If one of them is scanned, OCR may need more time or memory.');
      setStatus(null);
    } finally {
      setIsComparing(false);
      await terminateOcrWorker();
    }
  };

  const faqItems = [
    { question: 'Does PDF compare use visual image diffing?', answer: 'No. This tool keeps things practical in the browser by comparing extracted text page by page first.' },
    { question: 'Will scanned PDFs still work?', answer: 'Often yes. If needed, the compare flow falls back to OCR, which can take longer on large scanned files.' },
    { question: 'Can it detect different page counts?', answer: 'Yes. The summary shows each document page count and highlights changed or missing pages.' },
  ];

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Compare PDFs – Page Count and Text Differences"
        description="Compare two PDFs page by page using extracted text differences, page counts, and changed-page summaries."
        canonicalPath="/compare-pdf"
        faqItems={faqItems}
      />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
              <GitCompareArrows className="h-6 w-6" />
            </div>
          </div>
          <h1>Compare PDFs</h1>
          <p>Upload two PDFs to compare page counts and page-by-page text differences with readable additions and removals.</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Choose Two PDFs</h2>
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Left PDF</p>
                <FileUploader
                  onFilesSelected={(files) => {
                    const file = files[0];
                    if (!file) return;
                    setLeftFile(file);
                    setResult(null);
                    if (rightFile) compare(file, rightFile);
                  }}
                  accept=".pdf"
                  description={leftFile ? leftFile.name : 'Drop the first PDF'}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Right PDF</p>
                <FileUploader
                  onFilesSelected={(files) => {
                    const file = files[0];
                    if (!file) return;
                    setRightFile(file);
                    setResult(null);
                    if (leftFile) compare(leftFile, file);
                  }}
                  accept=".pdf"
                  description={rightFile ? rightFile.name : 'Drop the second PDF'}
                />
              </div>
            </div>

            {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{status}</div> : null}
            {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">{error}</div> : null}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Diff Results</h2>
                <p className="text-sm text-muted-foreground">Text-based compare keeps the browser workload practical and fast.</p>
              </div>
              {isComparing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Comparing
                </div>
              ) : null}
            </div>

            {!result ? (
              <div className="py-16 text-center text-muted-foreground">
                <GitCompareArrows className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p>Select two PDFs to start the comparison.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-sm text-muted-foreground">Left pages</p>
                    <p className="mt-1 text-2xl font-bold">{result.leftPageCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-sm text-muted-foreground">Right pages</p>
                    <p className="mt-1 text-2xl font-bold">{result.rightPageCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-sm text-muted-foreground">Changed pages</p>
                    <p className="mt-1 text-2xl font-bold">{result.changedPages.length}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Changed page summary</p>
                  <p className="mt-2 text-sm">{result.changedPages.length > 0 ? result.changedPages.join(', ') : 'No textual differences detected.'}</p>
                </div>

                <div className="space-y-4">
                  {result.pages.map((page) => (
                    <div key={page.pageNumber} className={`rounded-2xl border p-4 ${page.changed ? 'border-foreground bg-background' : 'border-border bg-background/70'}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Page {page.pageNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {page.additions} additions • {page.removals} removals
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${page.changed ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
                          {page.changed ? 'Changed' : 'Match'}
                        </span>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-4 text-sm leading-7">
                        {page.diffTokens.length === 0 ? (
                          <span className="text-muted-foreground">No text found on this page.</span>
                        ) : (
                          page.diffTokens.map((token, index) => (
                            <span
                              key={`${page.pageNumber}-${index}`}
                              className={
                                token.type === 'added'
                                  ? 'rounded bg-emerald-100 px-0.5 text-emerald-900'
                                  : token.type === 'removed'
                                    ? 'rounded bg-rose-100 px-0.5 text-rose-900 line-through'
                                    : undefined
                              }
                            >
                              {token.value}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
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
