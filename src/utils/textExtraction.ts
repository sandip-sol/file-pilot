import { recognizeImageText, toOcrPageResult } from './ocrHelpers';
import type { ExtractedDocumentResult, OcrPageResult } from './pdf/types';
import { getPdfPageText, openPdfDocument, renderPdfPageToCanvas } from './pdf/rendering';

interface ExtractionProgress {
    fileIndex: number;
    totalFiles: number;
    fileName: string;
    stage: string;
}

export interface ExtractedTextResult {
    fileName: string;
    text: string;
}

const isPdfFile = (file: File) =>
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const readPdfPages = async (file: File, onProgress?: (progress: ExtractionProgress) => void): Promise<OcrPageResult[]> => {
    const { pdf } = await openPdfDocument(file);
    const pages: OcrPageResult[] = [];

    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        onProgress?.({
            fileIndex: 0,
            totalFiles: 0,
            fileName: file.name,
            stage: `Reading PDF page ${pageIndex}/${pdf.numPages}`,
        });

        const pageText = await getPdfPageText(pdf, pageIndex);

        if (pageText) {
            const canvas = await renderPdfPageToCanvas(pdf, pageIndex, 1.2);
            const previewUrl = canvas.toDataURL('image/png');
            pages.push({
                pageNumber: pageIndex,
                width: canvas.width,
                height: canvas.height,
                text: pageText,
                averageConfidence: 100,
                blocks: [],
                lines: [],
                words: [],
                previewUrl,
            });
            continue;
        }

        onProgress?.({
            fileIndex: 0,
            totalFiles: 0,
            fileName: file.name,
            stage: `Running OCR on PDF page ${pageIndex}/${pdf.numPages}`,
        });

        const canvas = await renderPdfPageToCanvas(pdf, pageIndex, 2);
        const ocrResult = await recognizeImageText(canvas);
        pages.push(toOcrPageResult(pageIndex, canvas.width, canvas.height, ocrResult, canvas.toDataURL('image/png')));
    }

    return pages;
};

const readImagePages = async (file: File): Promise<OcrPageResult[]> => {
    const canvas = document.createElement('canvas');
    const bitmap = await createImageBitmap(file);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Canvas context not available');
    }

    context.drawImage(bitmap, 0, 0);
    const result = await recognizeImageText(canvas);
    bitmap.close();
    return [toOcrPageResult(1, canvas.width, canvas.height, result, canvas.toDataURL('image/png'))];
};

export const extractRichTextFromFiles = async (
    files: File[],
    onProgress?: (progress: ExtractionProgress) => void,
): Promise<ExtractedDocumentResult[]> => {
    const results: ExtractedDocumentResult[] = [];

    for (const [index, file] of files.entries()) {
        onProgress?.({
            fileIndex: index + 1,
            totalFiles: files.length,
            fileName: file.name,
            stage: isPdfFile(file) ? 'Opening PDF' : 'Running OCR on image',
        });

        const pages = isPdfFile(file)
            ? await readPdfPages(file, (progress) =>
                onProgress?.({
                    fileIndex: index + 1,
                    totalFiles: files.length,
                    fileName: file.name,
                    stage: progress.stage,
                }))
            : await readImagePages(file);

        const text = pages
            .map((page) => page.text?.trim() ? `Page ${page.pageNumber}\n${page.text.trim()}` : '')
            .filter(Boolean)
            .join('\n\n');

        results.push({
            fileName: file.name,
            text,
            pages,
            sourceType: isPdfFile(file) ? 'pdf' : 'image',
        });
    }

    return results;
};

export const extractTextFromFiles = async (
    files: File[],
    onProgress?: (progress: ExtractionProgress) => void,
): Promise<ExtractedTextResult[]> => {
    const richResults = await extractRichTextFromFiles(files, onProgress);
    return richResults.map((item) => ({
        fileName: item.fileName,
        text: item.text,
    }));
};
