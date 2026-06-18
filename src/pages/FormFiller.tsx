import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { downloadBlob } from '../utils/pdfHelpers';
import { getFormFields, fillFormFields } from '../utils/pdf/pdfOperations';
import { Loader2, Download, RefreshCw, FileText, ClipboardList, CheckCircle } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

export const FormFiller = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fields, setFields] = useState<{ name: string; type: string; value: string }[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelected = async (files: File[]) => {
        if (files.length === 0) return;
        const f = files[0];
        setFile(f); setError(null); setSuccess(false); setFields([]); setValues({});
        setIsLoading(true);
        try {
            const detected = await getFormFields(f);
            setFields(detected);
            const init: Record<string, string> = {};
            detected.forEach(d => { init[d.name] = d.value || ''; });
            setValues(init);
            if (detected.length === 0) setError('No fillable form fields found in this PDF.');
        } catch (err) {
            console.error(err);
            setError('Could not read form fields from this PDF.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcess = async () => {
        if (!file || fields.length === 0) return;
        setIsProcessing(true); setError(null);
        try {
            const bytes = await fillFormFields(file, values);
            downloadBlob(bytes, `${file.name.replace('.pdf', '')}_filled.pdf`, 'application/pdf');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError('Could not fill this PDF form. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="Fill PDF Forms – Fill & Flatten PDF Form Fields Online"
                description="Upload a PDF with form fields, fill them in directly in your browser, and download the flattened result. 100% private."
                faqItems={[
                    { question: 'What types of fields are supported?', answer: 'Text fields and checkboxes are supported. Radio buttons and dropdown lists may have limited support.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-green-600 text-white flex items-center justify-center shadow-lg">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>Fill PDF Forms</h1>
                    <p>Upload a PDF form, fill in the fields, and download a flattened PDF. 100% private.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a fillable PDF form here" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-lime-50 to-green-50 p-4 rounded-xl border border-lime-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-500 to-green-600 text-white flex items-center justify-center">
                                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                {isLoading ? 'Detecting fields...' : `${fields.length} field(s) found`}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setFields([]); setValues({}); }} className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                {fields.length > 0 && (
                                    <div className="space-y-4">
                                        {fields.map(field => (
                                            <div key={field.name}>
                                                <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">{field.name} <span className="text-xs text-[var(--text-muted)]">({field.type})</span></label>
                                                {field.type.toLowerCase().includes('checkbox') ? (
                                                    <select value={values[field.name] || 'false'} onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}>
                                                        <option value="false">Unchecked</option>
                                                        <option value="true">Checked</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={values[field.name] || ''}
                                                        onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                        placeholder={`Enter ${field.name}`}
                                                        className="w-full"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Form filled and downloaded!
                                    </div>
                                )}

                                {fields.length > 0 && (
                                    <button onClick={handleProcess} disabled={isProcessing || isLoading} className={`btn btn-primary w-full py-4 text-lg ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}>
                                        {isProcessing ? (<><Loader2 className="w-6 h-6 animate-spin" />Filling Form...</>) : (<><Download className="w-6 h-6" />Fill & Download PDF</>)}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FAQSection items={[
                { question: 'What types of fields are supported?', answer: 'Text fields and checkboxes are supported. Radio buttons and dropdown lists may have limited support.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
