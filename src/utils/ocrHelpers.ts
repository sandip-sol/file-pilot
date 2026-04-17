import { createWorker } from 'tesseract.js';

export interface OcrWord {
    text: string;
    confidence: number;
    bbox: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
    };
}

export interface OcrResult {
    text: string;
    words: OcrWord[];
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
    const words: OcrWord[] = [];

    for (const block of blocks) {
        for (const paragraph of block.paragraphs) {
            for (const line of paragraph.lines) {
                for (const word of line.words) {
                    const text = word.text.trim();
                    if (!text) continue;

                    words.push({
                        text,
                        confidence: word.confidence,
                        bbox: word.bbox,
                    });
                }
            }
        }
    }

    return {
        text: result.data.text.trim(),
        words,
    };
};

export const recognizeWords = async (image: HTMLCanvasElement): Promise<OcrWord[]> => {
    const result = await recognizeImageText(image);
    return result.words;
};

export const terminateOcrWorker = async () => {
    if (!workerPromise) return;

    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
};
