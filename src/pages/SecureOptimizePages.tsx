import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBytes } from '../utils/pdf/pdfOperations';
import { Zap, Unlock, Shield, Clock, CheckCircle, Loader2, Download, Info } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { PDFDocument } from 'pdf-lib';

// ─── LinearizePdf ───────────────────────────────────────────────────────────
export const LinearizePdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="Linearize PDF - Not Available" description="True PDF linearization is not currently available in the browser tool." faqItems={[{ question: 'Why is this unavailable?', answer: 'Fast Web View requires rewriting the PDF file structure for byte-range loading. A normal browser-side re-save does not guarantee that.' }, { question: 'What should I use instead?', answer: 'Use a PDF engine that explicitly supports linearization, such as qpdf or a professional desktop PDF tool.' }]} />
        <div className="page-header"><div className="container">
            <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-lg"><Zap className="w-6 h-6" /></div></div>
            <h1>Linearize PDF</h1><p>This tool is not available yet.</p>
        </div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>True linearization requires rewriting the PDF for byte-range loading. Re-saving with pdf-lib is not enough, so this route does not offer a download.</span>
            </div>
        </div></div></div>
        <FAQSection items={[{ question: 'Is this the same as optimizing object streams?', answer: 'No. Object stream optimization can reduce structure overhead, but it does not make a PDF Fast Web View compatible.' }, { question: 'When should this return?', answer: 'Only after the implementation can verify that the output is actually linearized.' }]} />
    </div>
);

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
export const ChangePermissions = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="Change PDF Permissions - Not Available" description="Changing PDF permission flags is not currently available in the browser tool." faqItems={[{ question: 'Why is this unavailable?', answer: 'Permission flags need to be written with compatible encryption and owner-password handling. Re-saving a PDF does not apply those settings.' }, { question: 'Are permission toggles supported?', answer: 'No. The previous UI has been removed until the selected permissions can be written into the output file.' }]} />
        <div className="page-header"><div className="container">
            <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center shadow-lg"><Shield className="w-6 h-6" /></div></div>
            <h1>Change PDF Permissions</h1><p>This tool is not available yet.</p>
        </div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>The previous controls only re-saved the file and did not apply print, copy, or edit restrictions. Downloads are disabled until permission flags are actually written.</span>
            </div>
        </div></div></div>
        <FAQSection items={[{ question: 'Can browser PDFs enforce permissions?', answer: 'They can only be meaningful when the PDF encryption and owner-password permissions are written correctly.' }, { question: 'When should this return?', answer: 'Only after generated files can be verified to contain the requested permission dictionary.' }]} />
    </div>
);

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
export const TimestampPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="Timestamp PDF - Not Available" description="Trusted RFC 3161 PDF timestamping is not currently available in the browser tool." faqItems={[{ question: 'Why is this unavailable?', answer: 'A trusted timestamp requires a timestamp authority response and proper signature embedding. Local metadata is not equivalent.' }, { question: 'Does this write local metadata?', answer: 'No. Downloads are disabled to avoid confusing local dates with trusted timestamps.' }]} />
        <div className="page-header"><div className="container">
            <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white flex items-center justify-center shadow-lg"><Clock className="w-6 h-6" /></div></div>
            <h1>Timestamp PDF</h1><p>This tool is not available yet.</p>
        </div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Local creation or modification dates are not RFC 3161 timestamps. This route does not offer a download until trusted timestamping is implemented.</span>
            </div>
        </div></div></div>
        <FAQSection items={[{ question: 'What makes a timestamp trusted?', answer: 'A trusted timestamp includes a signed response from a timestamp authority and is embedded in a verifiable signature structure.' }, { question: 'When should this return?', answer: 'Only after the output can be verified as a real trusted timestamp, not just edited metadata.' }]} />
    </div>
);
