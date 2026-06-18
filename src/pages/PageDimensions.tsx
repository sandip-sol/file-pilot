import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { analyzePageDimensions } from '../utils/pdf/pdfOperations';
import { Loader2, RefreshCw, FileText, Ruler, Monitor } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

interface PageDimension { page: number; width: number; height: number; unit: string; orientation: string; }

export const PageDimensions = () => {
    const [file, setFile] = useState<File | null>(null);
    const [dimensions, setDimensions] = useState<PageDimension[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelected = async (files: File[]) => {
        if (files.length === 0) return;
        const f = files[0];
        setFile(f); setError(null); setDimensions([]);
        setIsProcessing(true);
        try {
            const dims = await analyzePageDimensions(f);
            setDimensions(dims);
        } catch (err) {
            console.error(err);
            setError('Could not read page dimensions from this PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const allSame = dimensions.length > 0 && dimensions.every(d => d.width === dimensions[0].width && d.height === dimensions[0].height);

    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="PDF Page Dimensions – View Page Size and Orientation"
                description="Instantly view the width, height, and orientation of every page in a PDF. Detect mixed page sizes. 100% private."
                faqItems={[
                    { question: 'Can I detect mixed page sizes?', answer: 'Yes. The tool shows the dimensions of every individual page, making it easy to spot inconsistencies.' },
                    { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
                ]}
            />
            <div className="page-header">
                <div className="container">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg">
                            <Ruler className="w-6 h-6" />
                        </div>
                    </div>
                    <h1>PDF Page Dimensions</h1>
                    <p>View the exact size and orientation of every page in your PDF.</p>
                </div>
            </div>

            <div className="container pb-12">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        {!file ? (
                            <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" description="Drop a PDF to inspect page dimensions" />
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-fuchsia-50 p-4 rounded-xl border border-purple-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center">
                                            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text)]">{file.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{isProcessing ? 'Analyzing...' : `${dimensions.length} pages`}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setDimensions([]); }} className="p-2 hover:bg-white rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--error)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>

                                {error && <div className="bg-[var(--error-light)] text-[var(--error)] p-4 rounded-xl text-sm font-medium">{error}</div>}
                            </div>
                        )}
                    </div>

                    {dimensions.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-fade-in">
                            <div className="flex items-center gap-2 mb-4">
                                <Monitor className="w-5 h-5 text-purple-500" />
                                <h3 className="font-semibold">Page Dimensions</h3>
                                {allSame && <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">All pages same size</span>}
                                {!allSame && <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Mixed page sizes</span>}
                            </div>
                            <div className="overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 font-medium text-[var(--text-secondary)]">Page</th>
                                            <th className="text-left py-2 font-medium text-[var(--text-secondary)]">Size (pt)</th>
                                            <th className="text-left py-2 font-medium text-[var(--text-secondary)]">Size (in)</th>
                                            <th className="text-left py-2 font-medium text-[var(--text-secondary)]">Orientation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dimensions.map(d => (
                                            <tr key={d.page} className="border-b border-border/50 hover:bg-slate-50">
                                                <td className="py-2 font-medium">{d.page}</td>
                                                <td className="py-2 text-[var(--text-secondary)]">{d.width} × {d.height}</td>
                                                <td className="py-2 text-[var(--text-secondary)]">{d.unit}</td>
                                                <td className="py-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.orientation === 'Landscape' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        {d.orientation}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <FAQSection items={[
                { question: 'Can I detect mixed page sizes?', answer: 'Yes. The tool shows the dimensions of every individual page, making it easy to spot inconsistencies.' },
                { question: 'Is my file uploaded?', answer: 'No. All processing is done in your browser. Your file never leaves your device.' },
            ]} />
        </div>
    );
};
