/**
 * Image processing utilities — all client-side, zero external dependencies.
 * Uses Canvas API + createImageBitmap for transformations.
 */

/* ---------- Types ---------- */

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface EncodeResult {
    blob: Blob;
    qualityUsed: number | null; // null for PNG
    finalKB: number;
}

/* ---------- Load ---------- */

export const loadImage = (file: File): Promise<ImageBitmap> => {
    return createImageBitmap(file);
};

/* ---------- Canvas helpers ---------- */

/**
 * Cover / Crop: scales the image to fully cover the target WxH,
 * then center-crops overflow.
 */
export const drawToCanvasCover = (
    img: ImageBitmap,
    targetW: number,
    targetH: number,
): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;

    const scale = Math.max(targetW / img.width, targetH / img.height);
    const scaledW = img.width * scale;
    const scaledH = img.height * scale;
    const offsetX = (targetW - scaledW) / 2;
    const offsetY = (targetH - scaledH) / 2;

    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
    return canvas;
};

/**
 * Contain / Pad: scales the image to fit within target WxH,
 * then fills remaining area with bgColor.
 */
export const drawToCanvasContain = (
    img: ImageBitmap,
    targetW: number,
    targetH: number,
    bgColor: string = '#ffffff',
): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetW, targetH);

    const scale = Math.min(targetW / img.width, targetH / img.height);
    const scaledW = img.width * scale;
    const scaledH = img.height * scale;
    const offsetX = (targetW - scaledW) / 2;
    const offsetY = (targetH - scaledH) / 2;

    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
    return canvas;
};

/* ---------- Grayscale ---------- */

/**
 * Applies luminance-based grayscale in-place on the canvas.
 * Uses ITU-R BT.709 coefficients: 0.2126 R + 0.7152 G + 0.0722 B
 */
export const applyGrayscale = (canvas: HTMLCanvasElement): void => {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        data[i] = lum;
        data[i + 1] = lum;
        data[i + 2] = lum;
        // alpha untouched
    }
    ctx.putImageData(imageData, 0, 0);
};

/* ---------- Encode with target size ---------- */

/**
 * Attempts to encode the canvas into the requested format while staying
 * within maxKB. For JPG / WebP it loops quality from 0.90 → 0.35.
 * For PNG quality is not tuneable — returns the blob directly.
 *
 * Returns the result or throws a descriptive error string.
 */
export const encodeWithTargetSize = (
    canvas: HTMLCanvasElement,
    format: OutputFormat,
    maxKB: number,
): Promise<EncodeResult> => {
    return new Promise((resolve, reject) => {
        // PNG path — no quality knob
        if (format === 'image/png') {
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject('Failed to encode image.');
                    const finalKB = blob.size / 1024;
                    if (finalKB > maxKB) {
                        return reject(
                            `PNG output is ${finalKB.toFixed(0)} KB — exceeds the ${maxKB} KB limit. ` +
                            `PNG does not support lossy compression. Try WebP or JPG, increase the KB limit, or reduce dimensions.`,
                        );
                    }
                    resolve({ blob, qualityUsed: null, finalKB });
                },
                format,
            );
            return;
        }

        // JPG / WebP — iterative quality reduction
        const tryQuality = (quality: number) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject('Failed to encode image.');
                    const finalKB = blob.size / 1024;

                    if (finalKB <= maxKB) {
                        return resolve({ blob, qualityUsed: quality, finalKB });
                    }

                    // Step down quality
                    const nextQuality = Math.round((quality - 0.05) * 100) / 100;
                    if (nextQuality >= 0.35) {
                        tryQuality(nextQuality);
                    } else {
                        reject(
                            `Cannot meet the ${maxKB} KB limit at ${canvas.width}×${canvas.height} even at minimum quality (0.35). ` +
                            `The smallest achievable size is ${finalKB.toFixed(0)} KB. ` +
                            `Try switching to WebP, increasing the KB limit, or reducing dimensions.`,
                        );
                    }
                },
                format,
                quality,
            );
        };

        tryQuality(0.90);
    });
};
