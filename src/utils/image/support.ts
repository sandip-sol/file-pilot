import type { ImageFormat } from './types';

const supportCache = new Map<string, boolean>();

export async function isExportFormatSupported(format: ImageFormat): Promise<boolean> {
  if (supportCache.has(format)) return supportCache.get(format)!;

  if (format === 'image/jpeg' || format === 'image/png') {
    supportCache.set(format, true);
    return true;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 1, 1);

  return new Promise<boolean>((resolve) => {
    canvas.toBlob(
      (blob) => {
        const supported = blob !== null && blob.size > 0;
        supportCache.set(format, supported);
        resolve(supported);
      },
      format,
      0.8,
    );
  });
}

export async function getSupportedExportFormats(): Promise<Record<ImageFormat, boolean>> {
  const formats: ImageFormat[] = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const results = {} as Record<ImageFormat, boolean>;
  for (const fmt of formats) {
    results[fmt] = await isExportFormatSupported(fmt);
  }
  return results;
}

export function getFormatLabel(format: ImageFormat | string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/avif': 'AVIF',
    'image/gif': 'GIF',
    'image/bmp': 'BMP',
    'image/svg+xml': 'SVG',
  };
  return map[format] || format.split('/').pop()?.toUpperCase() || 'Unknown';
}

export function getFormatExtension(format: ImageFormat | string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  return map[format] || 'bin';
}

export function guessFormatFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return map[ext] || 'application/octet-stream';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function stripBasename(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}
