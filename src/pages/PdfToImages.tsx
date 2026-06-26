import { useEffect, useState } from 'react';
import { Download, Images, Link2, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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

type PdfImageFormat = 'png' | 'jpg' | 'webp';

const scaleFromDpi = (dpi: number) => dpi / 100;
const INDEXABLE_PDF_TO_IMAGE_ROUTES = new Set(['/pdf-to-images', '/pdf-to-jpg']);

const pdfToImageSeoByRoute: Record<string, { title: string; description: string; h1: string; intro: string; format?: PdfImageFormat }> = {
  '/pdf-to-images': {
    title: 'PDF to Images - Export PDF Pages as PNG, JPG, or WebP',
    description: 'Convert each PDF page to PNG, JPG, or WebP locally in your browser with DPI and quality controls. Download individually or as ZIP.',
    h1: 'PDF to Images',
    intro: 'Export every PDF page as a private PNG, JPG, or WebP image with custom DPI and quality settings.',
  },
  '/pdf-to-jpg': {
    title: 'PDF to JPG Online - Free and Private | FilePilot',
    description: 'Convert PDF pages to JPG images locally in your browser with DPI and quality controls. Download pages as a private ZIP file.',
    h1: 'PDF to JPG Online',
    intro: 'Convert every PDF page to JPG images in your browser, then download the rendered pages together as a private ZIP file.',
    format: 'jpg',
  },
};

export const PdfToImages = () => {
  const { pathname } = useLocation();
  const route = pathname.replace(/\/$/, '') || '/pdf-to-images';
  const seo = pdfToImageSeoByRoute[route] ?? pdfToImageSeoByRoute['/pdf-to-images'];
  const isIndexableRoute = INDEXABLE_PDF_TO_IMAGE_ROUTES.has(route);
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ExportedImageItem[]>([]);
  const [format, setFormat] = useState<PdfImageFormat>(seo.format ?? 'png');
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(0.9);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => items.forEach((item) => URL.revokeObjectURL(item.previewUrl)), [items]);

  const renderPages = async (nextFile: File) => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setFile(nextFile);
    setItems([]);
    setError(null);
    setStatus('Rendering pages...');
    setIsProcessing(true);

    try {
      const exported = await exportPdfPagesAsImages(nextFile, { format, scale: scaleFromDpi(dpi), quality });
      setItems(exported);
      setStatus(`Extracted ${exported.length} page${exported.length === 1 ? '' : 's'} as ${format.toUpperCase()} at ${dpi} DPI.`);
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not convert this PDF to images.');
      setStatus(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePdfSelected = async (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;
    await renderPages(nextFile);
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
        title={seo.title}
        description={seo.description}
        canonicalPath={isIndexableRoute ? route : '/pdf-to-images'}
        robots={isIndexableRoute ? 'index,follow' : 'noindex,follow'}
      />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <Images className="h-6 w-6" />
            </div>
          </div>
          <h1>{seo.h1}</h1>
          <p>{seo.intro}</p>
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
                <select value={format} onChange={(event) => setFormat(event.target.value as PdfImageFormat)}>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Resolution</label>
                <input type="range" min={72} max={300} step={6} className="w-full" value={dpi} onChange={(event) => setDpi(Number(event.target.value))} />
                <p className="mt-1 text-xs text-muted-foreground">{dpi} DPI</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Quality</label>
                <input type="range" min={0.5} max={1} step={0.05} className="w-full" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
                <p className="mt-1 text-xs text-muted-foreground">{Math.round(quality * 100)}% quality</p>
              </div>
            </div>

            {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{status}</div> : null}
            {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">{error}</div> : null}

            <button type="button" className="btn btn-outline mt-6 w-full" onClick={() => file && renderPages(file)} disabled={!file || isProcessing}>
              <Loader2 className={`h-4 w-4 ${isProcessing ? 'animate-spin' : 'hidden'}`} />
              Export Pages with Settings
            </button>

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
          { question: 'Which image formats can I export?', answer: 'You can export PDF pages as PNG, JPG, or WebP. BMP and TIFF alias pages use this image export workflow as their canonical replacement.' },
          { question: 'Can I download every page at once?', answer: 'Yes. Use Download All as ZIP to save every exported page in one archive.' },
          { question: 'Can I convert those images back into a PDF?', answer: 'Yes. Use the linked Images to PDF tool to roundtrip them back into a new document.' },
        ]}
      />
    </div>
  );
};
