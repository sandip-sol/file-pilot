import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { pdfToMarkdown, downloadBytes } from '../utils/pdf/pdfOperations';
import { FileSpreadsheet, Loader2, Download, CheckCircle, Info } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const PdfToExcel = () => {
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
      <PageSeo title="PDF to Excel Online – Free & Private" description="Convert PDF content to PDF to Excel. Browser-based text extraction." faqItems={[{question:'Does the output look exactly like the PDF?',answer:'Text content is extracted; precise formatting requires a desktop converter like LibreOffice.'},{question:'Is my file uploaded?',answer:'No. All processing is local in your browser.'}]} />
      <div className="page-header"><div className="container">
        <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-green-800 text-white flex items-center justify-center shadow-lg"><FileSpreadsheet className="w-6 h-6" /></div></div>
        <h1>PDF to Excel Online</h1><p>Extract text content from your PDF. Browser-based, private.</p>
      </div></div>
      <div className="container pb-12"><div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300 mb-5">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Browser-based extraction preserves text content. For pixel-perfect formatting, use a desktop app like LibreOffice.</span>
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
      <FAQSection items={[{question:'Does the output look exactly like the PDF?',answer:'Text content is extracted. For pixel-perfect output use a desktop converter.'},{question:'Is my file uploaded?',answer:'No. Everything happens in the browser.'}]} />
    </div>
  );
};
