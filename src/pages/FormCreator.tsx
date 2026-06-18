import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { getFormFields, fillFormFields, downloadBytes } from '../utils/pdf/pdfOperations';
import { FileInput, Loader2, Download, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const FormCreator = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fields, setFields] = useState<{ name: string; type: string; value: string }[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const loadFields = async (f: File) => {
        setIsLoading(true); setError(null); setFields([]); setValues({});
        try {
            const detected = await getFormFields(f);
            setFields(detected);
            const init: Record<string, string> = {};
            detected.forEach(d => { init[d.name] = d.value || ''; });
            setValues(init);
        } catch { setError('Could not read form fields. This PDF may not have interactive forms.'); }
        finally { setIsLoading(false); }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await fillFormFields(file, values);
            downloadBytes(bytes, file.name.replace('.pdf', '_filled.pdf'));
            setSuccess(true); setTimeout(() => setSuccess(false), 3000);
        } catch (e) { setError('Failed: ' + (e instanceof Error ? e.message : '')); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo title="PDF Form Filler – Fill & Flatten PDF Forms Online" description="Detect and fill PDF form fields, then flatten and download. 100% browser-based." faqItems={[{ question: 'What PDF forms are supported?', answer: 'Standard AcroForms with text fields and checkboxes.' }, { question: 'What does flatten mean?', answer: 'Flatten converts form fields to static text, making the form non-editable.' }]} />
            <div className="page-header"><div className="container">
                <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white flex items-center justify-center shadow-lg"><FileInput className="w-6 h-6" /></div></div>
                <h1>PDF Form Filler</h1><p>Automatically detect form fields, fill them in, and download the completed PDF.</p>
            </div></div>
            <div className="container pb-12"><div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <FileUploader onFilesSelected={f => { setFile(f[0]); setError(null); setSuccess(false); loadFields(f[0]); }} multiple={false} accept=".pdf" description="Drop a PDF form here" />
                    {isLoading && <div className="mt-4 text-sm text-[var(--text-muted)] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Detecting form fields…</div>}
                    {fields.length > 0 && (
                        <div className="mt-6 animate-fade-in space-y-4">
                            <p className="text-sm font-medium">{fields.length} form field(s) detected</p>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {fields.map(f => (
                                    <div key={f.name}>
                                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{f.name} <span className="opacity-60">({f.type})</span></label>
                                        <input type="text" value={values[f.name] ?? ''} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                                    </div>
                                ))}
                            </div>
                            {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm">{error}</div>}
                            {success && <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-5 h-5" />Filled PDF downloaded!</div>}
                            <button onClick={handleProcess} disabled={isProcessing} className="btn btn-primary w-full py-4 text-lg disabled:opacity-50">
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Filling…</> : <><Download className="w-5 h-5" />Fill &amp; Download</>}
                            </button>
                        </div>
                    )}
                    {!isLoading && file && fields.length === 0 && (
                        <div className="mt-4 text-sm text-[var(--text-muted)] italic">{error ?? 'No interactive form fields found in this PDF.'}</div>
                    )}
                </div>
            </div></div>
            <FAQSection items={[{ question: 'What forms are supported?', answer: 'Standard AcroForms (text fields, checkboxes).' }, { question: 'What does flatten mean?', answer: 'Converts interactive fields to static text so the form cannot be re-edited.' }]} />
        </div>
    );
};
