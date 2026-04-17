import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { recognizeImageText } from './ocrHelpers';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

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

const readPdfTextLayer = async (file: File, onProgress?: (progress: ExtractionProgress) => void) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pages: string[] = [];

    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        onProgress?.({
            fileIndex: 0,
            totalFiles: 0,
            fileName: file.name,
            stage: `Reading PDF page ${pageIndex}/${pdf.numPages}`,
        });

        const page = await pdf.getPage(pageIndex);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item) => {
                if (!('str' in item)) return '';
                return typeof item.str === 'string' ? item.str : '';
            })
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (pageText) {
            pages.push(pageText);
            continue;
        }

        onProgress?.({
            fileIndex: 0,
            totalFiles: 0,
            fileName: file.name,
            stage: `Running OCR on PDF page ${pageIndex}/${pdf.numPages}`,
        });

        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Canvas context not available');
        }

        await page.render({ canvasContext: context, viewport, canvas }).promise;
        const ocrResult = await recognizeImageText(canvas);
        pages.push(ocrResult.text.replace(/\s+/g, ' ').trim());
    }

    return pages
        .map((pageText, index) => pageText ? `Page ${index + 1}\n${pageText}` : '')
        .filter(Boolean)
        .join('\n\n');
};

const readImageText = async (file: File) => {
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
    return result.text.replace(/\s+/g, ' ').trim();
};

export const extractTextFromFiles = async (
    files: File[],
    onProgress?: (progress: ExtractionProgress) => void,
): Promise<ExtractedTextResult[]> => {
    const results: ExtractedTextResult[] = [];

    for (const [index, file] of files.entries()) {
        onProgress?.({
            fileIndex: index + 1,
            totalFiles: files.length,
            fileName: file.name,
            stage: isPdfFile(file) ? 'Opening PDF' : 'Running OCR on image',
        });

        const text = isPdfFile(file)
            ? await readPdfTextLayer(file, (progress) =>
                onProgress?.({
                    fileIndex: index + 1,
                    totalFiles: files.length,
                    fileName: file.name,
                    stage: progress.stage,
                }))
            : await readImageText(file);

        results.push({
            fileName: file.name,
            text,
        });
    }

    return results;
};
