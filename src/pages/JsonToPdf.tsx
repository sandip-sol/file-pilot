import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { jsonToPDF } from '../utils/pdf/pdfOperations';
import { Loader2, Download, FileJson, FileText, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const JsonToPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [jsonText, setJsonText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [inputMode, setInputMode] = useState<'file' | 'text'>('text');

    const handleFileSelected = async (files: File[]) => {
        if (files.length === 0) return;
        const f = files[0];
        setFile(f);
        const text = await f.text();
        setJsonText(text);
        setError(null); setSuccess(false);
    };

    const handleProcess = async () => {
        if (!jsonText.trim()) { setError('Please enter or upload JSON content.'); return; }
        setIsProcessing(true); setError(null);
        try {
            const bytes = await jsonToPDF(jsonText);
            const name = file ? file.name.replace('.json', '') : 'output';
            downloadBlob(bytes, `${name}.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not convert JSON to PDF. Please check your input.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="JSON to PDF – Convert JSON Data to PDF Document"
                description="Convert JSON data or .json files into a formatted PDF document. 100% private — browser only."
                faqItems={[
                    { question: 'Can I paste JSON directly?', answer: 'Yes. Type or paste JSON in the text area, or upload a .json file. The output PDF will have pretty-printed JSON.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
                            <FileJson className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>JSON to PDF</h1>
                    <p>Convert JSON data or .json files into a formatted PDF document.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                        <div className="flex gap-2">
                            {(['text', 'file'] as const).map(m => (
                                <button key={m} onClick={() => setInputMode(m)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${inputMode === m ? 'bg-green-500 text-white' : 'border border-border hover:border-green-400'}`}>
                                    {m === 'text' ? 'Paste JSON' : 'Upload .json file'}
                                </button>
                            ))}
                        </div>

                        {inputMode === 'file' ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".json,application/json" description="Drop a .json file to convert to PDF" />
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">JSON Content</label>
                                <textarea
                                    value={jsonText}
                                    onChange={e => setJsonText(e.target.value)}
                                    rows={10}
                                    placeholder='{"key": "value", "array": [1, 2, 3]}'
                                    className="w-full font-mono text-sm"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        )}

                        {file && inputMode === 'file' && (
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <FileText className="w-4 h-4" />
                                <span>{file.name}</span>
                            </div>
                        )}

                        {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                        {success && (
                            <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> PDF downloaded!
                            </div>
                        )}

                        <button onClick={handleProcess} disabled={isProcessing || !jsonText.trim()} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                            {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Converting...</>) : (<><Download className="w-6 h-6" />Convert to PDF</>)}
                        </button>
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'Can I paste JSON directly?', answer: 'Yes. Type or paste JSON in the text area, or upload a .json file. The output PDF will have pretty-printed JSON.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
