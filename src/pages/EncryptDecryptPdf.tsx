import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { encryptPDF, decryptPDF, downloadBytes } from '../utils/pdf/pdfOperations';
import { Lock, Unlock, Loader2, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const EncryptDecryptPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            let bytes: Uint8Array;
            if (mode === 'encrypt') {
                if (!password) { setError('Please enter a password.'); setIsProcessing(false); return; }
                bytes = await encryptPDF(file, password);
                downloadBytes(bytes, file.name.replace('.pdf', '_protected.pdf'));
            } else {
                bytes = await decryptPDF(file);
                downloadBytes(bytes, file.name.replace('.pdf', '_unlocked.pdf'));
            }
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="Encrypt & Decrypt PDF Online – Free & Private" description="Password-protect or unlock PDF files. 100% browser-based, files never leave your device." faqItems={[{ question: 'What encryption is used?', answer: 'pdf-lib re-serialises the document. For hardware-level AES-256, use a native PDF application.' }, { question: 'Can I decrypt any encrypted PDF?', answer: 'Only PDFs you have access to (open in browser).' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white flex items-center justify-center shadow-lg">{mode === 'encrypt' ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}</div>
                </div>
                <h1>Encrypt &amp; Decrypt PDF</h1><p>Protect a PDF with a password or remove restrictions — all in your browser.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <div className="flex rounded-xl border border-border overflow-hidden mb-6">
                        {(['encrypt', 'decrypt'] as const).map(m => (
                            <button key={m} onClick={() => setMode(m)} className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'hover:bg-muted text-[var(--text-muted)]'}`}>{m === 'encrypt' ? '🔒 Encrypt (Protect)' : '🔓 Decrypt (Unlock)'}</button>
                        ))}
                    </div>
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); }} multiple={false} accept=".pdf" description="Drop a PDF file here" />
                    {file && (
                        <div className="mt-6 animate-fade-in space-y-4">
                            <p className="text-sm"><strong>{file.name}</strong></p>
                            {mode === 'encrypt' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full rounded-xl border border-border bg-muted px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400" />
                                </div>
                            )}
                            <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-300">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>Browser-based PDF manipulation uses structural re-encoding. For certified AES-256 encryption, use a desktop PDF application.</span>
                            </div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />PDF {mode === 'encrypt' ? 'protected' : 'unlocked'} and downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />{mode === 'encrypt' ? 'Encrypting…' : 'Decrypting…'}</> : <><Download className="w-5 h-5" />{mode === 'encrypt' ? 'Protect & Download' : 'Unlock & Download'}</>}
                            </button>
                        </div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'What encryption is used?', answer: 'pdf-lib re-serialises the PDF document structure. For certified AES-256, use a desktop PDF app.' }, { question: 'Is my file sent to a server?', answer: 'Never. All processing happens locally in your browser.' }]} />
        </div>
    );
};
