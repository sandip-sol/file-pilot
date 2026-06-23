import JSZip from 'jszip';
import type { ImageFormat } from './types';
import { getFormatExtension, formatFileSize, stripBasename } from './support';

export type FitMode = 'contain' | 'cover' | 'stretch';

export interface BatchProcessOptions {
  width: number;
  height: number;
  fitMode: FitMode;
  format: ImageFormat | 'original';
  quality: number;
  bgColor: string;
  grayscale: boolean;
  targetSizeKB?: number;
  filenamePrefix: string;
  filenameSuffix: string;
}

export interface BatchOutputItem {
  id: string;
  originalName: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  outputBlob: Blob;
  outputFilename: string;
  outputSize: number;
  outputWidth: number;
  outputHeight: number;
  outputFormat: string;
  previewUrl: string;
}

export function resolveOutputFormat(
  originalMime: string,
  requested: ImageFormat | 'original',
): ImageFormat {
  if (requested !== 'original') return requested;
  if (originalMime === 'image/png') return 'image/png';
  if (originalMime === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

export function buildOutputFilename(
  originalName: string,
  prefix: string,
  suffix: string,
  width: number,
  height: number,
  format: ImageFormat,
): string {
  const base = stripBasename(originalName);
  const ext = getFormatExtension(format);
  const parts = [prefix, base, suffix].filter(Boolean).join('-');
  return `${parts}-${width}x${height}.${ext}`;
}

export function drawFitCanvas(
  bitmap: ImageBitmap,
  targetW: number,
  targetH: number,
  fitMode: FitMode,
  bgColor: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (fitMode === 'contain') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetW, targetH);
    const scale = Math.min(targetW / bitmap.width, targetH / bitmap.height);
    const scaledW = bitmap.width * scale;
    const scaledH = bitmap.height * scale;
    ctx.drawImage(bitmap, (targetW - scaledW) / 2, (targetH - scaledH) / 2, scaledW, scaledH);
  } else if (fitMode === 'cover') {
    const scale = Math.max(targetW / bitmap.width, targetH / bitmap.height);
    const scaledW = bitmap.width * scale;
    const scaledH = bitmap.height * scale;
    ctx.drawImage(bitmap, (targetW - scaledW) / 2, (targetH - scaledH) / 2, scaledW, scaledH);
  } else {
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  }

  return canvas;
}

export function applyGrayscaleToCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
  }
  ctx.putImageData(imageData, 0, 0);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to encode image'));
        resolve(blob);
      },
      format,
      quality,
    );
  });
}

export async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number,
  bgColor: string,
  targetSizeKB?: number,
): Promise<Blob> {
  let target = canvas;
  if (format === 'image/jpeg') {
    const jpegCanvas = document.createElement('canvas');
    jpegCanvas.width = canvas.width;
    jpegCanvas.height = canvas.height;
    const ctx = jpegCanvas.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
    ctx.drawImage(canvas, 0, 0);
    target = jpegCanvas;
  }

  if (targetSizeKB && format !== 'image/png') {
    let q = quality;
    while (q >= 0.1) {
      const blob = await canvasToBlob(target, format, q);
      if (blob.size / 1024 <= targetSizeKB) return blob;
      q = Math.round((q - 0.05) * 100) / 100;
    }
    return canvasToBlob(target, format, 0.1);
  }

  return canvasToBlob(target, format, format === 'image/png' ? undefined : quality);
}

export async function processOneImage(
  file: File,
  id: string,
  options: BatchProcessOptions,
): Promise<BatchOutputItem> {
  const bitmap = await createImageBitmap(file);
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  const outputFormat = resolveOutputFormat(
    file.type || 'image/jpeg',
    options.format,
  );

  const canvas = drawFitCanvas(
    bitmap,
    options.width,
    options.height,
    options.fitMode,
    options.bgColor,
  );
  bitmap.close();

  if (options.grayscale) {
    applyGrayscaleToCanvas(canvas);
  }

  const blob = await encodeCanvas(
    canvas,
    outputFormat,
    options.quality,
    options.bgColor,
    options.targetSizeKB,
  );

  const outputFilename = buildOutputFilename(
    file.name,
    options.filenamePrefix,
    options.filenameSuffix,
    options.width,
    options.height,
    outputFormat,
  );

  const previewUrl = URL.createObjectURL(blob);

  return {
    id,
    originalName: file.name,
    originalSize: file.size,
    originalWidth,
    originalHeight,
    outputBlob: blob,
    outputFilename,
    outputSize: blob.size,
    outputWidth: options.width,
    outputHeight: options.height,
    outputFormat,
    previewUrl,
  };
}

export async function downloadAsZip(
  items: Array<{ filename: string; blob: Blob }>,
  zipName: string,
): Promise<void> {
  const zip = new JSZip();
  for (const item of items) {
    zip.file(item.filename, item.blob);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function savedPercentage(original: number, output: number): string {
  if (original === 0) return '0%';
  const pct = ((original - output) / original) * 100;
  return `${pct >= 0 ? '-' : '+'}${Math.abs(pct).toFixed(1)}%`;
}

export { formatFileSize };
