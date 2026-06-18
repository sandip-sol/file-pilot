import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { pdfToMarkdown, downloadBytes } from '../utils/pdf/pdfOperations';
import { GanttChart, Loader2, Download, CheckCircle, Info } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const PdfToPptx = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true); setError(null);
    try {
      // Best-effort: extract PDF text content as structured markdown/text
      const mdText = await pdfToMarkdown(file);
      const bytes = new TextEncoder().encode(mdText);
      downloadBytes(bytes, file.name.replace('.pdf', '_extracted.txt'), 'text/plain');
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo title="Extract PDF Text for Slides – Free & Private" description="Extract PDF text into a plain text file you can reuse in slides. Browser-based and private." faqItems={[{question:'Does this create a PPTX file?',answer:'No. This extracts text into a plain text file. Slide conversion is not published yet.'},{question:'Is my file uploaded?',answer:'No. All processing is local in your browser.'}]} />
      <div className="page-header"><div className="container">
        <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-700 text-white flex items-center justify-center shadow-lg"><GanttChart className="w-6 h-6" /></div></div>
        <h1>Extract PDF Text for Slides</h1><p>Extract readable text from your PDF as a plain text file. Browser-based, private.</p>
      </div></div>
      <div className="container pb-12"><div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300 mb-5">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>This tool extracts text only. It does not create an editable PPTX file.</span>
          </div>
          <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
          {file && (
            <div className="mt-6 animate-fade-in space-y-4">
              <p className="text-sm"><strong>{file.name}</strong></p>
              {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
              {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />File downloaded!</div>}
              <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Extracting…</> : <><Download className="w-5 h-5" />Extract &amp; Download</>}
              </button>
            </div>
          )}
        </div>
      </div></div>
      <FAQSection items={[{question:'Does this create a PPTX file?',answer:'No. It downloads extracted text as a .txt file.'},{question:'Is my file uploaded?',answer:'No. Everything happens in the browser.'}]} />
    </div>
  );
};
