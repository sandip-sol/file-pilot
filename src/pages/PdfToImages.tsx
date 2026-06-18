import { useEffect, useState } from 'react';
import { Download, Images, Link2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FAQSection } from '../components/FAQSection';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { downloadBlobFile, downloadZipFromEntries } from '../utils/pdf/export';
import { exportPdfPagesAsImages } from '../utils/pdf/pageTools';

interface ExportedImageItem {
  pageNumber: number;
  filename: string;
  blob: Blob;
  previewUrl: string;
}

export const PdfToImages = () => {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ExportedImageItem[]>([]);
  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [scale, setScale] = useState(1.5);
  const [quality, setQuality] = useState(0.9);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => items.forEach((item) => URL.revokeObjectURL(item.previewUrl)), [items]);

  const handlePdfSelected = async (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setFile(nextFile);
    setItems([]);
    setError(null);
    setStatus('Rendering pages...');
    setIsProcessing(true);

    try {
      const exported = await exportPdfPagesAsImages(nextFile, { format, scale, quality });
      setItems(exported);
      setStatus(`Extracted ${exported.length} page${exported.length === 1 ? '' : 's'} as ${format.toUpperCase()}.`);
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not convert this PDF to images.');
      setStatus(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (items.length === 0 || !file) return;
    await downloadZipFromEntries(
      items.map((item) => ({ filename: item.filename, data: item.blob })),
      `${file.name.replace(/\.pdf$/i, '')}-${format}-pages.zip`,
    );
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="PDF to Images – Export PDF Pages as JPG or PNG"
        description="Convert each PDF page to JPG or PNG locally in your browser. Download pages individually or export them all as ZIP."
        canonicalPath="/pdf-to-images"
      />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <Images className="h-6 w-6" />
            </div>
          </div>
          <h1>PDF to Images</h1>
          <p>Export every PDF page as a private JPG or PNG and roundtrip back into PDF whenever you need.</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:h-fit">
            <h2 className="mb-4 text-lg font-bold">Export Settings</h2>
            <FileUploader onFilesSelected={handlePdfSelected} accept=".pdf" description="Drop a PDF to extract pages" />

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Format</label>
                <select value={format} onChange={(event) => setFormat(event.target.value as 'png' | 'jpg')}>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Resolution scale</label>
                <input type="range" min={1} max={3} step={0.25} className="w-full" value={scale} onChange={(event) => setScale(Number(event.target.value))} />
                <p className="mt-1 text-xs text-muted-foreground">{scale.toFixed(2)}x render scale</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Quality</label>
                <input type="range" min={0.5} max={1} step={0.05} className="w-full" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
                <p className="mt-1 text-xs text-muted-foreground">{Math.round(quality * 100)}% quality</p>
              </div>
            </div>

            {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{status}</div> : null}
            {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">{error}</div> : null}

            <button type="button" className="btn btn-primary mt-6 w-full" onClick={downloadAll} disabled={items.length === 0}>
              <Download className="h-4 w-4" />
              Download All as ZIP
            </button>

            <div className="mt-6 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 text-foreground">
                <Link2 className="h-4 w-4" />
                Roundtrip ready
              </div>
              <p>Need to rebuild a PDF from the extracted images?</p>
              <Link to="/images-to-pdf" className="mt-3 inline-flex items-center gap-2 font-medium text-foreground hover:underline">
                Open Images to PDF
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Page Images</h2>
                <p className="text-sm text-muted-foreground">{items.length} page{items.length === 1 ? '' : 's'} extracted</p>
              </div>
              {isProcessing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rendering pages
                </div>
              ) : null}
            </div>

            {items.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Images className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p>No PDF pages extracted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <div key={item.filename} className="rounded-2xl border border-border bg-background p-3">
                    <div className="mb-3 overflow-hidden rounded-xl border border-border bg-white">
                      <img src={item.previewUrl} alt={item.filename} className="w-full" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Page {item.pageNumber}</p>
                        <p className="text-xs text-muted-foreground">{item.filename}</p>
                      </div>
                      <button type="button" className="btn btn-outline px-3 py-2" onClick={() => downloadBlobFile(item.blob, item.filename)}>
                        <Download className="h-4 w-4" />
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FAQSection
        items={[
          { question: 'Does PDF to images upload my file?', answer: 'No. PDF rendering and image export happen entirely in your browser.' },
          { question: 'Can I download every page at once?', answer: 'Yes. Use Download All as ZIP to save every exported page in one archive.' },
          { question: 'Can I convert those images back into a PDF?', answer: 'Yes. Use the linked Images to PDF tool to roundtrip them back into a new document.' },
        ]}
      />
    </div>
  );
};
