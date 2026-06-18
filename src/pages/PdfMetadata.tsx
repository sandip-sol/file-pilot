import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { removeMetadata, editMetadata, extractMetadata } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, Tag, Eye, Trash2, Pencil, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

type Mode = 'view' | 'edit' | 'remove';

export const PdfMetadata = () => {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<Mode>('view');
    const [metadata, setMetadata] = useState<Record<string, string | null> | null>(null);
    const [editValues, setEditValues] = useState({ title: '', author: '', subject: '', keywords: '', creator: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            const f = files[0];
            setFile(f);
            setError(null);
            setSuccess(false);
            setMetadata(null);
            try {
                const meta = await extractMetadata(f);
                setMetadata(meta);
                setEditValues({
                    title: meta.title || '',
                    author: meta.author || '',
                    subject: meta.subject || '',
                    keywords: meta.keywords || '',
                    creator: meta.creator || '',
                });
            } catch {
                setMetadata({});
            }
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            let bytes: Uint8Array;
            if (mode === 'remove') {
                bytes = await removeMetadata(file);
            } else {
                bytes = await editMetadata(file, editValues);
            }
            const suffix = mode === 'remove' ? '_no-metadata' : '_edited-metadata';
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}${suffix}.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to process PDF metadata.');
        } finally {
            setIsProcessing(false);
        }
    };

    const metaFields = [
        { key: 'title', label: 'Title' },
        { key: 'author', label: 'Author' },
        { key: 'subject', label: 'Subject' },
        { key: 'keywords', label: 'Keywords' },
        { key: 'creator', label: 'Creator' },
        { key: 'producer', label: 'Producer' },
        { key: 'creationDate', label: 'Creation Date' },
        { key: 'modificationDate', label: 'Modified Date' },
        { key: 'pageCount', label: 'Page Count' },
    ];

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="PDF Metadata Editor – View, Edit & Remove PDF Metadata"
                description="View, edit, or remove all PDF metadata including title, author, keywords, and dates. 100% private — processed locally in your browser."
                faqItems={[
                    { question: 'What metadata is stored in a PDF?', answer: 'PDFs can contain title, author, subject, keywords, creator, producer, and creation/modification dates.' },
                    { question: 'Will my file be uploaded?', answer: 'No. Everything runs locally in your browser.' },
                    { question: 'Can I remove all metadata at once?', answer: 'Yes! Use the "Remove All" mode to strip all metadata in one click.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white flex items-center justify-center shadow-lg">
                            <Tag className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>PDF Metadata Editor</h1>
                    <p>View, edit, or remove PDF metadata. Title, author, keywords and more. 100% private.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to view or edit its metadata" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-fuchsia-50 to-pink-50 p-4 rounded-xl border border-fuchsia-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB · {metadata?.pageCount ?? '…'} pages</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setMetadata(null); setSuccess(false); }} className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Mode tabs */}
                                <div className="flex bg-muted p-1 rounded-xl">
                                    {([['view', 'View', Eye], ['edit', 'Edit', Pencil], ['remove', 'Remove All', Trash2]] as const).map(([m, label, Icon]) => (
                                        <button key={m} onClick={() => setMode(m as Mode)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${mode === m ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>
                                            <Icon className="w-4 h-4" />{label}
                                        </button>
                                    ))}
                                </div>

                                {/* View mode */}
                                {mode === 'view' && metadata && (
                                    <div className="space-y-2">
                                        {metaFields.map(f => (
                                            <div key={f.key} className="flex items-start justify-between py-2.5 px-3 rounded-lg bg-muted/50">
                                                <span className="text-sm font-medium text-[var(--text-secondary)] w-36 shrink-0">{f.label}</span>
                                                <span className="text-sm text-[var(--text)] text-right truncate ml-4">{metadata[f.key] || <em className="text-[var(--text-muted)]">—</em>}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Edit mode */}
                                {mode === 'edit' && (
                                    <div className="space-y-4">
                                        {(['title', 'author', 'subject', 'keywords', 'creator'] as const).map(k => (
                                            <div key={k}>
                                                <label className="block text-sm font-medium mb-1.5 capitalize text-[var(--text-secondary)]">{k}</label>
                                                <input type="text" value={editValues[k]} onChange={e => setEditValues(prev => ({ ...prev, [k]: e.target.value }))}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Remove mode */}
                                {mode === 'remove' && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
                                        <strong>All metadata will be cleared:</strong> title, author, subject, keywords, creator, and producer will all be set to empty strings.
                                    </div>
                                )}

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Done! PDF saved.
                                    </div>
                                )}

                                {mode !== 'view' && (
                                    <button onClick={handleProcess} disabled={isProcessing} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                        {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<><Download className="w-6 h-6" />{mode === 'remove' ? 'Remove Metadata & Download' : 'Save Metadata & Download'}</>)}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What metadata is stored in a PDF?', answer: 'PDFs can contain title, author, subject, keywords, creator, producer, and creation/modification dates.' },
                { question: 'Will my file be uploaded?', answer: 'No. Everything runs locally in your browser.' },
                { question: 'Can I remove all metadata at once?', answer: 'Yes! Use the "Remove All" mode to strip all metadata in one click.' },
            ]} />
        </div>
    );
};
