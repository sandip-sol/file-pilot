import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { markdownToPDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, FileText, FileCode2, AlignLeft } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const MarkdownToPdf = () => {
    const [markdown, setMarkdown] = useState('');
    const [mdFile, setMdFile] = useState<File | null>(null);
    const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
    const [mode, setMode] = useState<'type' | 'upload'>('type');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            const f = files[0];
            setMdFile(f);
            const content = await f.text();
            setMarkdown(content);
            setError(null);
            setSuccess(false);
        }
    };

    const handleConvert = async () => {
        const content = markdown.trim();
        if (!content) { setError('Please enter some Markdown or upload a .md file.'); return; }
        setIsProcessing(true);
        setError(null);
        try {
            const bytes = await markdownToPDF(content, { pageSize });
            const baseName = mdFile ? mdFile.name.replace(/\.[^.]+$/, '') : 'markdown-document';
            downloadBlob(bytes, `${baseName}.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to convert Markdown to PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const placeholder = `# My Document

## Introduction
This is a **bold** statement with *italic* text.

## Features
- Item one
- Item two
- Item three

> This is a blockquote

\`\`\`
code block
\`\`\`
`;

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Markdown to PDF – Convert .md Files to PDF Free"
                description="Convert Markdown text or .md files to PDF in your browser. Supports headings, lists, bold, italic, and code blocks. 100% private."
                faqItems={[
                    { question: 'What Markdown features are supported?', answer: 'Headings, bold, italic, lists, blockquotes, and code blocks are parsed and converted to PDF-friendly text.' },
                    { question: 'Can I upload a .md file?', answer: 'Yes! Switch to the "Upload .md File" tab to upload a Markdown file directly.' },
                    { question: 'Is my content uploaded to a server?', answer: 'No. Everything runs locally in your browser using JavaScript.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                            <FileCode2 className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Markdown to PDF Converter</h1>
                    <p>Convert .md files or paste Markdown directly. 100% private — never uploaded.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                        {/* Mode toggle */}
                        <div className="flex bg-muted p-1 rounded-xl">
                            <button onClick={() => setMode('type')}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'type' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>
                                <AlignLeft className="w-4 h-4" /> Type / Paste Markdown
                            </button>
                            <button onClick={() => setMode('upload')}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'upload' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>
                                <FileText className="w-4 h-4" /> Upload .md File
                            </button>
                        </div>

                        {mode === 'upload' && !mdFile && (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".md,.markdown,.txt" description="Drop a .md or .markdown file here" />
                        )}

                        {(mode === 'type' || mdFile) && (
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">
                                    {mdFile ? `Content from ${mdFile.name}` : 'Markdown Content'}
                                </label>
                                <textarea
                                    value={markdown}
                                    onChange={e => setMarkdown(e.target.value)}
                                    rows={14}
                                    placeholder={placeholder}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 resize-y"
                                />
                                <p className="mt-1 text-xs text-[var(--text-muted)]">{markdown.length.toLocaleString()} characters</p>
                            </div>
                        )}

                        {(mode === 'type' || mdFile) && (
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Page Size</label>
                                <div className="flex gap-2 max-w-xs">
                                    {(['A4', 'Letter'] as const).map(s => (
                                        <button key={s} onClick={() => setPageSize(s)}
                                            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${pageSize === s ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-border text-[var(--text-muted)]'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                        {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium">✅ PDF created successfully!</div>}

                        {(mode === 'type' || mdFile) && (
                            <button onClick={handleConvert} disabled={isProcessing || !markdown.trim()} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Converting...</>) : (<><Download className="w-6 h-6" />Convert to PDF &amp; Download</>)}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What Markdown features are supported?', answer: 'Headings, bold, italic, lists, blockquotes, and code blocks are parsed and converted to PDF-friendly text.' },
                { question: 'Can I upload a .md file?', answer: 'Yes! Switch to the "Upload .md File" tab to upload a Markdown file directly.' },
                { question: 'Is my content uploaded to a server?', answer: 'No. Everything runs locally in your browser using JavaScript.' },
            ]} />
        </div>
    );
};
