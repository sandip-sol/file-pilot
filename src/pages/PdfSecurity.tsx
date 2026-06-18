import { useState } from 'react';
import { Download, Loader2, LockKeyhole, Shield, Unlock } from 'lucide-react';
import { FAQSection } from '../components/FAQSection';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { downloadBytes } from '../utils/pdf/export';
import { unlockPdfByRasterizing } from '../utils/pdf/pageTools';

export const PdfSecurity = () => {
  const [mode, setMode] = useState<'unlock' | 'protect'>('unlock');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const unlockPdf = async () => {
    if (!file) return;
    if (!password.trim()) {
      setError('Enter the PDF password to unlock the file.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStatus('Opening the protected PDF...');

    try {
      const bytes = await unlockPdfByRasterizing(file, password, setStatus);
      downloadBytes(bytes, `${file.name.replace(/\.pdf$/i, '')}-unlocked.pdf`, 'application/pdf');
      setStatus('Unlocked PDF ready. This browser-safe export is rebuilt from rendered pages.');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Could not unlock this PDF. Check the password and try again.');
      setStatus(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateProtectMode = () => {
    if (!file) return;
    if (!password.trim()) {
      setError('Enter a password for the protected copy.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(
      'True PDF encryption is not reliably available in the current browser-only stack bundled with this app. The unlock flow is fully implemented; protect mode is structured for a future encryption-capable library without moving files to a server.',
    );
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Protect or Unlock PDF – Browser-Only PDF Security"
        description="Unlock password-protected PDFs locally in your browser and manage browser-first PDF security workflows without server uploads."
        canonicalPath="/pdf-security"
      />

      <div className="page-header">
        <div className="container">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <h1>Protect / Unlock PDF</h1>
          <p>Keep sensitive documents local. Unlock protected PDFs entirely in-browser and prepare future-proof security settings without server uploads.</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <button type="button" className={`btn ${mode === 'unlock' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setMode('unlock'); setError(null); setStatus(null); }}>
              <Unlock className="h-4 w-4" />
              Unlock PDF
            </button>
            <button type="button" className={`btn ${mode === 'protect' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setMode('protect'); setError(null); setStatus(null); }}>
              <LockKeyhole className="h-4 w-4" />
              Protect PDF
            </button>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div>
              <FileUploader
                onFilesSelected={(files) => {
                  setFile(files[0] ?? null);
                  setError(null);
                  setStatus(null);
                }}
                accept=".pdf"
                description={file ? file.name : `Drop a PDF to ${mode}`}
              />

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    {mode === 'unlock' ? 'Current password' : 'New password'}
                  </label>
                  <input type="password" className="w-full" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>

                {mode === 'protect' ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Confirm password</label>
                    <input type="password" className="w-full" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                  </div>
                ) : null}
              </div>

              {status ? <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{status}</div> : null}
              {error ? <div className="mt-5 rounded-xl bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">{error}</div> : null}

              <button
                type="button"
                className="btn btn-primary mt-6 w-full"
                onClick={mode === 'unlock' ? unlockPdf : validateProtectMode}
                disabled={!file || isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {mode === 'unlock' ? 'Unlock and Export' : 'Validate Protection Setup'}
              </button>
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-background p-5">
              <h2 className="text-lg font-bold">{mode === 'unlock' ? 'Unlock flow' : 'Protect flow'}</h2>
              {mode === 'unlock' ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    This browser-first unlock workflow opens the PDF using your password, renders each page locally, and exports an unlocked copy rebuilt from those pages.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    That makes the export broadly compatible and keeps files on-device, but embedded links, editable form fields, and original hidden structure are not preserved.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    True standards-compliant PDF password encryption is not reliably exposed by the current in-browser libraries already bundled in this project.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The UI and validation are in place so this page can adopt a future browser-safe encryption library without changing the route structure or SEO footprint.
                  </p>
                  <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Current limitation</p>
                    <p className="mt-2">
                      Unlock is production-ready today. Protect mode is intentionally honest rather than exporting a fake “locked” PDF that would create a false sense of privacy.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <FAQSection
        items={[
          { question: 'Does unlocking upload my PDF anywhere?', answer: 'No. Password handling, rendering, and export all stay inside your browser.' },
          { question: 'Why is protect mode limited?', answer: 'The current browser-only PDF stack in this project does not expose reliable standards-compliant encryption for writing protected PDFs.' },
          { question: 'What is preserved when unlocking?', answer: 'The unlocked export preserves the visual pages, but it does not preserve the original encrypted structure, interactive forms, or hidden content streams.' },
        ]}
      />
    </div>
  );
};
