import { useState } from 'react';
import { FileImage, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { PDFDocument } from 'pdf-lib';

export const SvgToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleProcess = async () => {
    if (!files.length) return;
    setIsProcessing(true); setError(null);
    try {
      const pdf = await PDFDocument.create();
      for (const file of files) {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const pngBytes = await new Promise<Uint8Array>(res => canvas.toBlob(b => { b!.arrayBuffer().then(ab => res(new Uint8Array(ab))); }, 'image/png'));
        const pdfImg = await pdf.embedPng(pngBytes);
        const page = pdf.addPage([pdfImg.width, pdfImg.height]);
        page.drawImage(pdfImg, {x:0,y:0,width:pdfImg.width,height:pdfImg.height});
      }
      const bytes = await pdf.save();
      const blob = new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], {type:'application/pdf'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = files[0].name.replace(/\.[^.]+$/, '') + '_converted.pdf';
      a.click();
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo title="SVG to PDF Online – Free & Private" description="Convert SVG images to PDF in your browser. No uploads, 100% private." faqItems={[{question:'Can I convert multiple images?',answer:'Yes. Select multiple files to create a multi-page PDF.'},{question:'Is quality preserved?',answer:'Images are embedded at their original resolution.'}]} />
      <div className="page-header"><div className="container">
        <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg"><FileImage className="w-6 h-6" /></div></div>
        <h1>SVG to PDF Online</h1><p>Convert SVG images to PDF instantly in your browser.</p>
      </div></div>
      <div className="container pb-12"><div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted transition-colors">
            <FileImage className="w-10 h-10 text-[var(--text-muted)] mb-2" />
            <span className="text-sm text-[var(--text-muted)]">Click to select SVG files</span>
            <input type="file" accept=".svg" multiple className="hidden" onChange={handleFiles} />
          </label>
          {files.length > 0 && (
            <div className="mt-6 animate-fade-in space-y-4">
              <p className="text-sm text-[var(--text-muted)]">{files.length} file(s) selected</p>
              {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
              {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />PDF downloaded!</div>}
              <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Converting…</> : <><Download className="w-5 h-5" />Convert &amp; Download PDF</>}
              </button>
            </div>
          )}
        </div>
      </div></div>
      <FAQSection items={[{question:'Can I convert multiple images?',answer:'Yes, multi-file selection creates a multi-page PDF.'},{question:'Is quality preserved?',answer:'Images are embedded at their original resolution.'}]} />
    </div>
  );
};
