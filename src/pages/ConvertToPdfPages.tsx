
import { Info } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';

// Generic "convert to PDF via text extraction" page for formats needing server-side tools
const ConversionNote = ({ fmt }: { fmt: string }) => (
    <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-300 mb-5">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{fmt} conversion requires native OS libraries (LibreOffice, Calibre, etc.) which cannot run in a browser. For best results, install the free <a href="https://www.libreoffice.org/" target="_blank" rel="noopener noreferrer" className="underline font-medium">LibreOffice</a> desktop app. This page will be upgraded with WebAssembly support when available.</span>
    </div>
);

export const WordToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="Word to PDF Online" description="Convert DOCX/DOC Word documents to PDF. Browser-based text conversion." faqItems={[{ question: 'Does it preserve formatting?', answer: 'Text content is extracted. For exact formatting, use LibreOffice Desktop.' }, { question: 'Is cloud processing used?', answer: 'No. This tool is fully offline.' }]} />
        <div className="page-header"><div className="container"><h1>Word to PDF</h1><p>Convert Word DOCX documents to PDF in your browser.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="Word (DOCX)" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon — use <a href="https://www.libreoffice.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">LibreOffice</a> in the meantime.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'When will this be available?', answer: 'We are evaluating WebAssembly-based LibreOffice builds for a fully offline Word-to-PDF solution.' }, { question: 'Alternative?', answer: 'LibreOffice (free) or Google Docs can convert DOCX to PDF.' }]} />
    </div>
);

export const ExcelToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="Excel to PDF Online" description="Convert XLSX/XLS spreadsheets to PDF. Browser-based." faqItems={[{ question: 'Does it preserve formatting?', answer: 'Complex spreadsheet layouts require desktop tools.' }, { question: 'Is data secure?', answer: 'No data is uploaded to any server.' }]} />
        <div className="page-header"><div className="container"><h1>Excel to PDF</h1><p>Convert Excel spreadsheets to PDF — fully client-side.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="Excel (XLSX)" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon — use <a href="https://www.libreoffice.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">LibreOffice</a> in the meantime.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'When will this be ready?', answer: 'WebAssembly Excel parsing support is in progress.' }, { question: 'Alternative?', answer: 'LibreOffice Calc (free) or Google Sheets can export to PDF.' }]} />
    </div>
);

export const PptxToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="PowerPoint to PDF Online" description="Convert PPTX/PPT presentations to PDF. Browser-based." faqItems={[{ question: 'Will animations be preserved?', answer: 'Static slide content is converted; animations are not supported in PDF.' }, { question: 'Is my data secure?', answer: 'All processing is local in your browser.' }]} />
        <div className="page-header"><div className="container"><h1>PowerPoint to PDF</h1><p>Convert PPTX presentations to PDF — fully private.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="PowerPoint (PPTX)" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon — use <a href="https://www.libreoffice.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">LibreOffice</a> in the meantime.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'When will this be ready?', answer: 'PPTX-to-PDF WebAssembly support is planned.' }, { question: 'Alternative?', answer: 'LibreOffice Impress or Google Slides can export to PDF.' }]} />
    </div>
);

export const EpubToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="EPUB to PDF Online" description="Convert eBook EPUB files to PDF. Browser-based." faqItems={[{ question: 'Are images preserved?', answer: 'Text content and basic structure are converted.' }, { question: 'Is my file uploaded?', answer: 'No. Processing is 100% local.' }]} />
        <div className="page-header"><div className="container"><h1>EPUB to PDF</h1><p>Convert EPUB eBooks to PDF.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="EPUB" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon — use <a href="https://calibre-ebook.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Calibre</a> (free) in the meantime.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'Alternative tool?', answer: 'Calibre (free, open source) can convert EPUB to PDF with full formatting.' }, { question: 'When will this be ready?', answer: 'EPUB parsing via WebAssembly is being evaluated.' }]} />
    </div>
);

export const MobiToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="MOBI to PDF Online" description="Convert Kindle MOBI/AZW eBooks to PDF." faqItems={[{ question: 'Is Kindle DRM removed?', answer: 'This tool cannot remove DRM. Only DRM-free MOBI files can be converted.' }, { question: 'Alternative?', answer: 'Calibre handles MOBI conversion.' }]} />
        <div className="page-header"><div className="container"><h1>MOBI to PDF</h1><p>Convert Kindle MOBI/AZW files to PDF.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="MOBI/AZW" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon — use <a href="https://calibre-ebook.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Calibre</a> (free) in the meantime.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'Can it handle DRM-protected files?', answer: 'No. Only DRM-free MOBI files can be converted.' }, { question: 'Alternative?', answer: 'Calibre (free, open-source) converts MOBI to PDF.' }]} />
    </div>
);

export const RtfToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="RTF to PDF Online" description="Convert Rich Text Format files to PDF." faqItems={[{ question: 'Is formatting preserved?', answer: 'Basic text and paragraph structure are preserved.' }, { question: 'Alternative?', answer: 'LibreOffice handles RTF to PDF conversion.' }]} />
        <div className="page-header"><div className="container"><h1>RTF to PDF</h1><p>Convert Rich Text Format files to PDF.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="RTF" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon — use <a href="https://www.libreoffice.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">LibreOffice</a> in the meantime.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'When will this be available?', answer: 'RTF WebAssembly parsing is being evaluated.' }, { question: 'Alternative?', answer: 'LibreOffice Writer can open and export RTF to PDF.' }]} />
    </div>
);

export const XpsToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="XPS to PDF Online" description="Convert Microsoft XPS documents to PDF." faqItems={[{ question: 'What is XPS?', answer: 'XPS (XML Paper Specification) is Microsoft\'s document format, similar to PDF.' }, { question: 'Alternative?', answer: 'LibreOffice or GhostXPS can convert XPS to PDF.' }]} />
        <div className="page-header"><div className="container"><h1>XPS to PDF</h1><p>Convert Microsoft XPS documents to PDF.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="XPS" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'What is XPS?', answer: 'XPS is Microsoft\'s XML-based fixed document format.' }, { question: 'Alternative?', answer: 'Windows includes a built-in XPS Viewer with print-to-PDF support.' }]} />
    </div>
);

export const DjvuToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="DjVu to PDF Online" description="Convert DjVu scanned documents to PDF." faqItems={[{ question: 'What is DjVu?', answer: 'DjVu is a format for scanned documents, common in academic archives.' }, { question: 'Alternative?', answer: 'DjVuLibre (free) can convert DjVu to PDF.' }]} />
        <div className="page-header"><div className="container"><h1>DjVu to PDF</h1><p>Convert DjVu scanned documents to PDF.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="DjVu" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'What is DjVu?', answer: 'DjVu is a compressed format for scanned documents and ebooks.' }, { question: 'Alternative?', answer: 'DjVuLibre (free, open-source) can convert DjVu to PDF.' }]} />
    </div>
);

export const Fb2ToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="FB2 to PDF Online" description="Convert FictionBook FB2 eBooks to PDF." faqItems={[{ question: 'What is FB2?', answer: 'FictionBook (FB2) is an XML-based eBook format popular in Eastern Europe.' }, { question: 'Alternative?', answer: 'Calibre (free) converts FB2 to PDF.' }]} />
        <div className="page-header"><div className="container"><h1>FB2 to PDF</h1><p>Convert FictionBook eBooks to PDF.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="FB2" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon — use <a href="https://calibre-ebook.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Calibre</a> in the meantime.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'What is FB2?', answer: 'FictionBook is an XML-based eBook format.' }, { question: 'Alternative?', answer: 'Calibre can convert FB2 to PDF for free.' }]} />
    </div>
);

export const EmailToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="Email to PDF Online" description="Convert EML/MSG email files to PDF." faqItems={[{ question: 'What formats are supported?', answer: 'EML (standard) and MSG (Outlook) formats will be supported.' }, { question: 'Are attachments included?', answer: 'Email body is converted; attachments are listed but not embedded.' }]} />
        <div className="page-header"><div className="container"><h1>Email to PDF</h1><p>Convert EML/MSG email files to PDF.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="EML/MSG" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'What email formats?', answer: 'EML (standard email) and MSG (Outlook) are planned.' }, { question: 'Alternative?', answer: 'Thunderbird or Outlook\'s print-to-PDF feature works well.' }]} />
    </div>
);

export const CbzToPdf = () => (
    <div className="min-h-[calc(100vh-200px)]">
        <PageSeo title="CBZ to PDF Online" description="Convert comic book CBZ/CBR archives to PDF." faqItems={[{ question: 'What is CBZ?', answer: 'CBZ is a ZIP archive of comic page images (.jpg/.png).' }, { question: 'Is quality maintained?', answer: 'Images are embedded at their original resolution.' }]} />
        <div className="page-header"><div className="container"><h1>CBZ to PDF</h1><p>Convert comic book CBZ archives to PDF.</p></div></div>
        <div className="container pb-12"><div className="max-w-2xl mx-auto"><div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <ConversionNote fmt="CBZ/CBR" />
            <p className="text-[var(--text-muted)] text-center py-8">Coming soon.</p>
        </div></div></div>
        <FAQSection items={[{ question: 'What is CBZ?', answer: 'CBZ is a renamed ZIP archive of comic page images.' }, { question: 'When available?', answer: 'CBZ parsing via JSZip in the browser is planned.' }]} />
    </div>
);

