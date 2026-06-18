import { createWorker } from 'tesseract.js';
import type { OcrBlockBox, OcrLineBox, OcrPageResult, OcrWordBox } from './pdf/types';

export interface OcrResult {
    text: string;
    words: OcrWordBox[];
    lines: OcrLineBox[];
    blocks: OcrBlockBox[];
    averageConfidence: number;
}

let workerPromise: Promise<Tesseract.Worker> | null = null;

const getWorker = () => {
    if (!workerPromise) {
        workerPromise = createWorker('eng', undefined, {
            logger: () => undefined,
        });
    }

    return workerPromise;
};

export const recognizeImageText = async (image: HTMLCanvasElement): Promise<OcrResult> => {
    const worker = await getWorker();
    const result = await worker.recognize(
        image,
        { rotateAuto: false },
        { blocks: true },
    );

    const blocks = result.data.blocks ?? [];
    const words: OcrWordBox[] = [];
    const lines: OcrLineBox[] = [];
    const richBlocks: OcrBlockBox[] = [];

    for (const [blockIndex, block] of blocks.entries()) {
        const blockLines: OcrLineBox[] = [];
        const blockWords: OcrWordBox[] = [];

        for (const [paragraphIndex, paragraph] of block.paragraphs.entries()) {
            for (const [lineIndex, line] of paragraph.lines.entries()) {
                const lineWords: OcrWordBox[] = [];

                for (const [wordIndex, word] of line.words.entries()) {
                    const text = word.text.trim();
                    if (!text) continue;

                    const wordItem: OcrWordBox = {
                        id: `${blockIndex}-${paragraphIndex}-${lineIndex}-${wordIndex}`,
                        text,
                        confidence: word.confidence,
                        bbox: word.bbox,
                    };

                    words.push(wordItem);
                    lineWords.push(wordItem);
                    blockWords.push(wordItem);
                }

                if (lineWords.length === 0) continue;

                const lineItem: OcrLineBox = {
                    id: `${blockIndex}-${paragraphIndex}-${lineIndex}`,
                    text: lineWords.map((word) => word.text).join(' '),
                    confidence: lineWords.reduce((sum, word) => sum + word.confidence, 0) / lineWords.length,
                    bbox: line.bbox,
                    words: lineWords,
                };

                lines.push(lineItem);
                blockLines.push(lineItem);
            }
        }

        if (blockLines.length === 0) continue;

        richBlocks.push({
            id: `${blockIndex}`,
            text: blockWords.map((word) => word.text).join(' '),
            confidence: blockWords.reduce((sum, word) => sum + word.confidence, 0) / blockWords.length,
            bbox: block.bbox,
            lines: blockLines,
        });
    }

    return {
        text: result.data.text.trim(),
        words,
        lines,
        blocks: richBlocks,
        averageConfidence: words.length > 0 ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length : 0,
    };
};

export const recognizeWords = async (image: HTMLCanvasElement): Promise<OcrWordBox[]> => {
    const result = await recognizeImageText(image);
    return result.words;
};

export const toOcrPageResult = (
    pageNumber: number,
    width: number,
    height: number,
    result: OcrResult,
    previewUrl?: string,
): OcrPageResult => ({
    pageNumber,
    width,
    height,
    text: result.text.trim(),
    averageConfidence: result.averageConfidence,
    blocks: result.blocks,
    lines: result.lines,
    words: result.words,
    previewUrl,
});

export const terminateOcrWorker = async () => {
    if (!workerPromise) return;

    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
};
