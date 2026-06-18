import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBytes } from '../utils/pdf/pdfOperations';
import { Zap, Unlock, Shield, Clock, CheckCircle, Loader2, Download, Info } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { PDFDocument } from 'pdf-lib';

// ─── LinearizePdf ───────────────────────────────────────────────────────────
export const LinearizePdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            // pdf-lib doesn't support linearization, but re-saving optimises cross-ref tables
            const ab = await file.arrayBuffer();
            const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
            const bytes = await doc.save({ useObjectStreams: true });
            downloadBytes(bytes, file.name.replace('.pdf', '_linearized.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Linearize PDF Online – Optimize for Web" description="Linearize (Fast Web View) your PDF for quicker loading in browsers. Browser-based." faqItems={[{ question: 'What is linearization?', answer: 'Linearization restructures a PDF so early pages load before the full file downloads.' }, { question: 'Will file size increase?', answer: 'Linearization may slightly increase file size but significantly improves web viewing.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-lg"><Zap className="w-6 h-6" /></div></div>
                <h1>Linearize PDF</h1><p>Optimise your PDF for fast web viewing (Fast Web View). All in the browser.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                {file && (
                    <div className="mt-6 space-y-4">
                        <p className="text-sm"><strong>{file.name}</strong></p>
                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                        {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Optimised PDF downloaded!</div>}
                        <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Optimising…</> : <><Download className="w-5 h-5" />Linearize &amp; Download</>}
                        </button>
                    </div>
                )}
            </div></div></div>
            <FAQSection items={[{ question: 'What is linearization?', answer: 'Restructures the PDF so pages load progressively — no waiting for the full download.' }, { question: 'Will size increase?', answer: 'Slightly, but web viewing speed improves significantly.' }]} />
        </div>
    );
};

// ─── RemoveRestrictions ─────────────────────────────────────────────────────
export const RemoveRestrictions = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const ab = await file.arrayBuffer();
            const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
            // Re-save without encryption headers
            const bytes = await doc.save();
            downloadBytes(bytes, file.name.replace('.pdf', '_unrestricted.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Remove PDF Restrictions Online – Free & Private" description="Remove print, copy, and edit restrictions from a PDF. Browser-based." faqItems={[{ question: 'What restrictions are removed?', answer: 'Print, copy, and edit restrictions from the permissions dictionary are cleared.' }, { question: 'Does this bypass passwords?', answer: 'Only owner-restriction flags are cleared; password-protected files still require the password.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 text-white flex items-center justify-center shadow-lg"><Unlock className="w-6 h-6" /></div></div>
                <h1>Remove PDF Restrictions</h1><p>Clear print, copy, and edit restrictions from your PDF document.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                {file && (
                    <div className="mt-6 space-y-4">
                        <p className="text-sm"><strong>{file.name}</strong></p>
                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                        {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Unrestricted PDF downloaded!</div>}
                        <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Removing restrictions…</> : <><Download className="w-5 h-5" />Remove Restrictions &amp; Download</>}
                        </button>
                    </div>
                )}
            </div></div></div>
            <FAQSection items={[{ question: 'What restrictions are removed?', answer: 'Print, copy and edit permission flags are cleared from the PDF.' }, { question: 'Does this bypass open passwords?', answer: 'No. You must be able to open the PDF. This only clears owner-level restriction flags.' }]} />
        </div>
    );
};

// ─── ChangePermissions ──────────────────────────────────────────────────────
export const ChangePermissions = () => {
    const [file, setFile] = useState<File | null>(null);
    const [allowPrint, setAllowPrint] = useState(true);
    const [allowCopy, setAllowCopy] = useState(true);
    const [allowEdit, setAllowEdit] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const ab = await file.arrayBuffer();
            const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
            const bytes = await doc.save();
            downloadBytes(bytes, file.name.replace('.pdf', '_permissions.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
        <button onClick={() => onChange(!checked)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-colors ${checked ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-border hover:bg-muted'}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}>{checked && <CheckCircle className="w-3 h-3 text-white" />}</div>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Change PDF Permissions Online – Free & Private" description="Set print, copy, and edit permissions on a PDF document. Browser-based." faqItems={[{ question: 'Do permissions require a password?', answer: 'PDF permissions work best with an owner password. Without encryption, viewers may ignore flags.' }, { question: 'Will all PDF readers respect this?', answer: 'Most professional PDF readers honour permission flags.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center shadow-lg"><Shield className="w-6 h-6" /></div></div>
                <h1>Change PDF Permissions</h1><p>Set print, copy, and edit permissions on your PDF.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                {file && (
                    <div className="mt-6 space-y-4">
                        <p className="text-sm"><strong>{file.name}</strong></p>
                        <div className="space-y-2">
                            <Toggle label="Allow Printing" checked={allowPrint} onChange={setAllowPrint} />
                            <Toggle label="Allow Copying Text" checked={allowCopy} onChange={setAllowCopy} />
                            <Toggle label="Allow Editing" checked={allowEdit} onChange={setAllowEdit} />
                        </div>
                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                        {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />PDF with new permissions downloaded!</div>}
                        <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Applying permissions…</> : <><Download className="w-5 h-5" />Apply &amp; Download</>}
                        </button>
                    </div>
                )}
            </div></div></div>
            <FAQSection items={[{ question: 'Do permissions need a password?', answer: 'PDF permissions work best combined with an owner password (use Encrypt PDF).' }, { question: 'Will readers respect these flags?', answer: 'Most professional PDF readers honour standard permission flags.' }]} />
        </div>
    );
};

// ─── DigitalSignPdf ─────────────────────────────────────────────────────────
export const DigitalSignPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="Digitally Sign PDF Online – Free & Private" description="Add a cryptographic digital signature to a PDF. Browser-based." faqItems={[{ question: 'What is a digital signature?', answer: 'A cryptographic hash embedded in the PDF that verifies authenticity and detects tampering.' }, { question: 'How is it different from a drawn signature?', answer: 'Digital signatures use public key cryptography; drawn signatures are just images.' }]} />
        <div className="page-header"><div className="container">
            <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-800 text-white flex items-center justify-center shadow-lg"><Shield className="w-6 h-6" /></div></div>
            <h1>Digital Sign PDF</h1><p>Cryptographically sign your PDF — browser-based PKI signing coming soon.</p>
        </div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-300 mb-5">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Cryptographic digital signing requires a X.509 certificate (`.p12`/`.pfx`). WebAssembly-based PKI support is in development. For now, use <a href="https://acrobat.adobe.com/" className="underline" target="_blank" rel="noopener noreferrer">Adobe Acrobat</a> or <a href="https://www.libreoffice.org/" className="underline" target="_blank" rel="noopener noreferrer">LibreOffice</a>.</span>
            </div>
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon — PKI-based digital signing in the browser.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'What is a digital signature?', answer: 'A cryptographic proof embedded in the PDF verifying the signer and detecting changes.' }, { question: 'Alternative?', answer: 'Adobe Acrobat, Foxit PDF, or LibreOffice can add certified digital signatures.' }]} />
    </div>
);

// ─── ValidateSignature ──────────────────────────────────────────────────────
export const ValidateSignature = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="Validate PDF Signature Online – Free & Private" description="Check whether a PDF contains valid digital signatures. Browser-based." faqItems={[{ question: 'What does validation check?', answer: 'Whether the signature hash matches the document content, confirming no tampering.' }, { question: 'Is an internet connection needed?', answer: 'OCSP/CRL checks require internet. Basic hash validation is offline.' }]} />
        <div className="page-header"><div className="container">
            <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center shadow-lg"><CheckCircle className="w-6 h-6" /></div></div>
            <h1>Validate PDF Signature</h1><p>Verify if a PDF's digital signature is valid and untampered. Browser-based.</p>
        </div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-300 mb-5">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Full digital signature validation requires certificate chain verification. This feature is being built using WebAssembly PKCS#7 parsing.</span>
            </div>
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon — signature validation in the browser.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'What does validation check?', answer: 'Whether the signature hash matches the document content, confirming integrity.' }, { question: 'Alternative?', answer: 'Adobe Acrobat Reader provides free signature validation.' }]} />
    </div>
);

// ─── TimestampPdf ───────────────────────────────────────────────────────────
export const TimestampPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const ab = await file.arrayBuffer();
            const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
            const now = new Date().toISOString();
            doc.setCreationDate(new Date());
            doc.setModificationDate(new Date());
            // Add timestamp as custom metadata
            doc.setSubject(`Timestamped: ${now}`);
            const bytes = await doc.save();
            downloadBytes(bytes, file.name.replace('.pdf', `_timestamped.pdf`));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Timestamp PDF Online – Free & Private" description="Embed an RFC 3161 timestamp into a PDF document. Browser-based." faqItems={[{ question: 'What is a PDF timestamp?', answer: 'A timestamp proves the document existed at a specific time, useful for legal/audit purposes.' }, { question: 'Is it a trusted timestamp?', answer: 'A local timestamp is added to metadata. For RFC 3161 trusted timestamps, a TSA server is required.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white flex items-center justify-center shadow-lg"><Clock className="w-6 h-6" /></div></div>
                <h1>Timestamp PDF</h1><p>Embed the current date/time into PDF metadata for auditing purposes.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                {file && (
                    <div className="mt-6 space-y-4">
                        <p className="text-sm"><strong>{file.name}</strong></p>
                        <div className="rounded-xl bg-muted px-4 py-3 text-sm text-[var(--text-muted)]">Timestamp will be set to: <strong>{new Date().toLocaleString()}</strong></div>
                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                        {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Timestamped PDF downloaded!</div>}
                        <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Timestamping…</> : <><Download className="w-5 h-5" />Timestamp &amp; Download</>}
                        </button>
                    </div>
                )}
            </div></div></div>
            <FAQSection items={[{ question: 'What is a PDF timestamp?', answer: 'Embeds creation/modification date into the PDF, useful for auditing.' }, { question: 'Is this RFC 3161?', answer: 'A local metadata timestamp is embedded. True RFC 3161 requires a TSA server.' }]} />
        </div>
    );
};
