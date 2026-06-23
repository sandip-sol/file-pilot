import JSZip from 'jszip';
import { faviconSizes, generateWebManifest, generateHtmlSnippet, type FaviconSize } from '../../data/faviconConfig';

export interface FaviconAsset {
  size: FaviconSize;
  blob: Blob;
  previewUrl: string;
}

function renderIcon(
  bitmap: ImageBitmap,
  size: number,
  bgColor: string | null,
  padding: number,
  borderRadius: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (bgColor) {
    if (borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, borderRadius);
      ctx.fillStyle = bgColor;
      ctx.fill();
      ctx.clip();
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
    }
  }

  const drawSize = size - padding * 2;
  const scale = Math.min(drawSize / bitmap.width, drawSize / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;

  ctx.drawImage(bitmap, x, y, w, h);
  return canvas;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG encode failed'))),
      'image/png',
    );
  });
}

export async function generateFavicons(
  bitmap: ImageBitmap,
  bgColor: string | null,
  padding: number,
  borderRadius: number,
): Promise<FaviconAsset[]> {
  const assets: FaviconAsset[] = [];

  for (const size of faviconSizes) {
    const effectivePadding = size.maskable && size.safePadding
      ? size.safePadding
      : padding;

    const canvas = renderIcon(
      bitmap,
      size.width,
      bgColor,
      effectivePadding,
      size.maskable ? 0 : borderRadius,
    );

    const blob = await canvasToPngBlob(canvas);
    assets.push({
      size,
      blob,
      previewUrl: URL.createObjectURL(blob),
    });
  }

  return assets;
}

export async function generateFaviconZip(
  assets: FaviconAsset[],
): Promise<Blob> {
  const zip = new JSZip();

  for (const asset of assets) {
    zip.file(asset.size.filename, asset.blob);
  }

  zip.file('site.webmanifest', generateWebManifest());
  zip.file('html-snippet.txt', generateHtmlSnippet());

  return zip.generateAsync({ type: 'blob' });
}

export function generatePreview(
  bitmap: ImageBitmap,
  size: number,
  bgColor: string | null,
  padding: number,
  borderRadius: number,
): string {
  const canvas = renderIcon(bitmap, size, bgColor, padding, borderRadius);
  return canvas.toDataURL('image/png');
}
