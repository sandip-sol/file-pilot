import { useState } from 'react';
import JSZip from 'jszip';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob2 } from '../utils/pdf/pdfOperations';
import { canvasToBlob, openPdfDocument, renderPdfPageToCanvas } from '../utils/pdf/rendering';
import { BookOpen, Loader2, Download, CheckCircle, Info } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { toolFaqs, toolSeo } from '../data/toolContent';

const QUALITY_PRESETS = {
  standard: { label: 'Standard (smaller file)', scale: 1.5, jpegQuality: 0.8 },
  high: { label: 'High (sharper line art)', scale: 2.5, jpegQuality: 0.92 },
} as const;
type QualityKey = keyof typeof QUALITY_PRESETS;

export const PdfToCbz = () => {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<QualityKey>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true); setError(null);
    try {
      const { scale, jpegQuality } = QUALITY_PRESETS[quality];
      const { pdf } = await openPdfDocument(file);
      const zip = new JSZip();
      // Zero-padded names define reading order in a CBZ.
      const digits = String(pdf.numPages).length;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setProgress(`Rendering page ${pageNumber} of ${pdf.numPages}…`);
        const canvas = await renderPdfPageToCanvas(pdf, pageNumber, scale);
        const blob = await canvasToBlob(canvas, 'image/jpeg', jpegQuality);
        zip.file(`${String(pageNumber).padStart(digits, '0')}.jpg`, blob);
      }
      setProgress('Packing CBZ…');
      // JPEGs are already compressed, so store them as-is.
      const cbz = await zip.generateAsync({ type: 'blob', compression: 'STORE', mimeType: 'application/vnd.comicbook+zip' });
      await downloadBlob2(cbz, file.name.replace(/\.pdf$/i, '') + '.cbz');
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
    finally { setIsProcessing(false); setProgress(''); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo {...toolSeo('/pdf-to-cbz')} />
      <div className="page-header"><div className="container">
        <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-700 text-white flex items-center justify-center shadow-lg"><BookOpen className="w-6 h-6" /></div></div>
        <h1>PDF to CBZ Online</h1><p>Turn PDF comics and manga into a CBZ archive for your comic reader. Browser-based, private.</p>
      </div></div>
      <div className="container pb-12"><div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300 mb-5">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Each page becomes an image in reading order. Text is not searchable inside a CBZ, so keep the PDF if you need search.</span>
          </div>
          <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
          {file && (
            <div className="mt-6 animate-fade-in space-y-4">
              <p className="text-sm"><strong>{file.name}</strong></p>
              <div>
                <label className="block text-sm font-medium mb-2">Page image quality</label>
                <select value={quality} onChange={e => setQuality(e.target.value as QualityKey)}>
                  {(Object.keys(QUALITY_PRESETS) as QualityKey[]).map(key => <option key={key} value={key}>{QUALITY_PRESETS[key].label}</option>)}
                </select>
              </div>
              {error && <div role="alert" className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
              {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />CBZ downloaded!</div>}
              <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />{progress || 'Converting…'}</> : <><Download className="w-5 h-5" />Convert to CBZ &amp; Download</>}
              </button>
            </div>
          )}
        </div>
      </div></div>
      <FAQSection items={toolFaqs('/pdf-to-cbz')} />
    </div>
  );
};
