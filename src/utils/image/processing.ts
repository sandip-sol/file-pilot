import type { ImageFormat, ImageFileInfo, ProcessedImageResult, ResponsiveVariant } from './types';
import { getFormatExtension, guessFormatFromName, stripBasename } from './support';

let idCounter = 0;

export async function loadImageFile(file: File): Promise<ImageFileInfo> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const hasTransparency = await detectTransparency(bitmap);
  bitmap.close();

  return {
    id: `img-${++idCounter}-${Date.now()}`,
    file,
    name: file.name,
    originalSize: file.size,
    width,
    height,
    mimeType: file.type || guessFormatFromName(file.name),
    hasTransparency,
    previewUrl: URL.createObjectURL(file),
  };
}

export async function createThumbnail(file: File, maxDim: number = 200): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', 0.6);
}

async function detectTransparency(bitmap: ImageBitmap): Promise<boolean> {
  const sampleSize = Math.min(bitmap.width, bitmap.height, 100);
  const canvas = document.createElement('canvas');
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, sampleSize, sampleSize);
  const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

export async function compressImage(
  info: ImageFileInfo,
  format: ImageFormat,
  quality: number,
  targetSizeKB: number | null,
  bgColor: string,
): Promise<ProcessedImageResult> {
  const bitmap = await createImageBitmap(info.file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;

  if (format === 'image/jpeg' && info.hasTransparency) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  let blob: Blob;
  let finalQuality = quality;

  if (targetSizeKB !== null && format !== 'image/png') {
    const result = await encodeToTargetSize(canvas, format, targetSizeKB, quality);
    blob = result.blob;
    finalQuality = result.quality;
  } else {
    blob = await canvasToBlob(canvas, format, format === 'image/png' ? undefined : quality);
  }

  const ext = getFormatExtension(format);
  const filename = `${stripBasename(info.name)}_compressed.${ext}`;
  const previewUrl = URL.createObjectURL(blob);

  return {
    id: info.id,
    blob,
    filename,
    originalSize: info.originalSize,
    outputSize: blob.size,
    width: canvas.width,
    height: canvas.height,
    format,
    quality: format === 'image/png' ? null : finalQuality,
    previewUrl,
  };
}

export type ResizeMode = 'fit' | 'fill' | 'stretch';

export async function resizeImage(
  info: ImageFileInfo,
  targetW: number,
  targetH: number,
  mode: ResizeMode,
  format: ImageFormat,
  quality: number,
  bgColor: string,
  doNotUpscale: boolean,
): Promise<ProcessedImageResult> {
  const bitmap = await createImageBitmap(info.file);

  let finalW = targetW;
  let finalH = targetH;

  if (doNotUpscale) {
    finalW = Math.min(targetW, bitmap.width);
    finalH = Math.min(targetH, bitmap.height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;
  const ctx = canvas.getContext('2d')!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (format === 'image/jpeg' || info.hasTransparency) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, finalW, finalH);
  }

  if (mode === 'fill') {
    const scale = Math.max(finalW / bitmap.width, finalH / bitmap.height);
    const scaledW = bitmap.width * scale;
    const scaledH = bitmap.height * scale;
    const offsetX = (finalW - scaledW) / 2;
    const offsetY = (finalH - scaledH) / 2;
    ctx.drawImage(bitmap, offsetX, offsetY, scaledW, scaledH);
  } else if (mode === 'fit') {
    const scale = Math.min(finalW / bitmap.width, finalH / bitmap.height);
    const scaledW = bitmap.width * scale;
    const scaledH = bitmap.height * scale;
    const offsetX = (finalW - scaledW) / 2;
    const offsetY = (finalH - scaledH) / 2;
    ctx.drawImage(bitmap, offsetX, offsetY, scaledW, scaledH);
  } else {
    ctx.drawImage(bitmap, 0, 0, finalW, finalH);
  }

  bitmap.close();

  const blob = await canvasToBlob(canvas, format, format === 'image/png' ? undefined : quality);
  const ext = getFormatExtension(format);
  const filename = `${stripBasename(info.name)}_${finalW}x${finalH}.${ext}`;
  const previewUrl = URL.createObjectURL(blob);

  return {
    id: info.id,
    blob,
    filename,
    originalSize: info.originalSize,
    outputSize: blob.size,
    width: finalW,
    height: finalH,
    format,
    quality: format === 'image/png' ? null : quality,
    previewUrl,
  };
}

export async function convertImage(
  info: ImageFileInfo,
  format: ImageFormat,
  quality: number,
  bgColor: string,
  resizeTo?: { width: number; height: number },
): Promise<ProcessedImageResult> {
  const bitmap = await createImageBitmap(info.file);
  const outW = resizeTo?.width ?? bitmap.width;
  const outH = resizeTo?.height ?? bitmap.height;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (format === 'image/jpeg' && info.hasTransparency) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, outW, outH);
  }

  ctx.drawImage(bitmap, 0, 0, outW, outH);
  bitmap.close();

  const blob = await canvasToBlob(canvas, format, format === 'image/png' ? undefined : quality);
  const ext = getFormatExtension(format);
  const filename = `${stripBasename(info.name)}.${ext}`;
  const previewUrl = URL.createObjectURL(blob);

  return {
    id: info.id,
    blob,
    filename,
    originalSize: info.originalSize,
    outputSize: blob.size,
    width: outW,
    height: outH,
    format,
    quality: format === 'image/png' ? null : quality,
    previewUrl,
  };
}

export async function generateResponsiveVariants(
  info: ImageFileInfo,
  widths: number[],
  formats: ImageFormat[],
  qualityMap: Record<string, number>,
  bgColor: string,
): Promise<ResponsiveVariant[]> {
  const bitmap = await createImageBitmap(info.file);
  const aspectRatio = bitmap.height / bitmap.width;
  const variants: ResponsiveVariant[] = [];
  const baseName = stripBasename(info.name);

  for (const w of widths) {
    if (w > bitmap.width) continue;
    const h = Math.round(w * aspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    for (const fmt of formats) {
      if (fmt === 'image/jpeg' && info.hasTransparency) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(bitmap, 0, 0, w, h);

      const q = qualityMap[fmt] ?? 0.8;
      const blob = await canvasToBlob(canvas, fmt, fmt === 'image/png' ? undefined : q);
      const ext = getFormatExtension(fmt);

      variants.push({
        width: w,
        height: h,
        format: fmt,
        filename: `${baseName}-${w}.${ext}`,
        blob,
        outputSize: blob.size,
        quality: q,
      });
    }
  }

  bitmap.close();
  return variants;
}

function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality?: number): Promise<Blob> {
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

async function encodeToTargetSize(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  targetKB: number,
  startQuality: number,
): Promise<{ blob: Blob; quality: number }> {
  let q = startQuality;
  while (q >= 0.1) {
    const blob = await canvasToBlob(canvas, format, q);
    if (blob.size / 1024 <= targetKB) {
      return { blob, quality: q };
    }
    q = Math.round((q - 0.05) * 100) / 100;
  }

  const blob = await canvasToBlob(canvas, format, 0.1);
  return { blob, quality: 0.1 };
}

export function calculateAspectRatio(w: number, h: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
}

export function revokeImageUrls(items: Array<{ previewUrl?: string }>): void {
  for (const item of items) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
}
