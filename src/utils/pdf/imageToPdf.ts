import { PDFDocument } from 'pdf-lib';

export type PageSizeOption = 'original' | 'a4' | 'letter' | 'custom';
export type PageOrientation = 'auto' | 'portrait' | 'landscape';
export type PageMargins = 'none' | 'small' | 'medium' | 'large';
export type EnhanceMode = 'original' | 'grayscale' | 'bw' | 'high-contrast';

export interface ScanToPdfOptions {
  pageSize: PageSizeOption;
  customWidth?: number;
  customHeight?: number;
  orientation: PageOrientation;
  margins: PageMargins;
  enhance: EnhanceMode;
  quality: number;
  outputFilename: string;
}

interface PageImage {
  file: File;
  rotation: number;
  cropRect?: { x: number; y: number; width: number; height: number };
}

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

const MARGIN_VALUES: Record<PageMargins, number> = {
  none: 0,
  small: 18,
  medium: 36,
  large: 54,
};

function applyEnhancement(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mode: EnhanceMode,
): void {
  if (mode === 'original') return;

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    if (mode === 'grayscale' || mode === 'bw') {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = g = b = lum;
    }

    if (mode === 'bw') {
      const threshold = 128;
      r = g = b = r > threshold ? 255 : 0;
    }

    if (mode === 'high-contrast') {
      const factor = 1.5;
      r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
      g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
      b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
}

async function processPageImage(
  pageImg: PageImage,
  enhance: EnhanceMode,
  quality: number,
): Promise<{ jpegBytes: Uint8Array; width: number; height: number }> {
  const bitmap = await createImageBitmap(pageImg.file);
  let srcX = 0, srcY = 0, srcW = bitmap.width, srcH = bitmap.height;

  if (pageImg.cropRect) {
    srcX = pageImg.cropRect.x;
    srcY = pageImg.cropRect.y;
    srcW = pageImg.cropRect.width;
    srcH = pageImg.cropRect.height;
  }

  const rotation = ((pageImg.rotation % 360) + 360) % 360;
  const swap = rotation === 90 || rotation === 270;
  const outW = swap ? srcH : srcW;
  const outH = swap ? srcW : srcH;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(outW);
  canvas.height = Math.round(outH);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(
    bitmap,
    Math.round(srcX),
    Math.round(srcY),
    Math.round(srcW),
    Math.round(srcH),
    -Math.round(srcW) / 2,
    -Math.round(srcH) / 2,
    Math.round(srcW),
    Math.round(srcH),
  );
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  bitmap.close();

  applyEnhancement(ctx, canvas.width, canvas.height, enhance);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('JPEG encode failed'))),
      'image/jpeg',
      quality,
    );
  });

  const arrayBuf = await blob.arrayBuffer();
  return {
    jpegBytes: new Uint8Array(arrayBuf),
    width: canvas.width,
    height: canvas.height,
  };
}

export async function generatePdfFromImages(
  pages: PageImage[],
  options: ScanToPdfOptions,
  onProgress?: (current: number, total: number) => void,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const margin = MARGIN_VALUES[options.margins];

  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i + 1, pages.length);

    const { jpegBytes, width: imgW, height: imgH } = await processPageImage(
      pages[i],
      options.enhance,
      options.quality,
    );

    const image = await pdfDoc.embedJpg(jpegBytes);

    let pageW: number;
    let pageH: number;

    if (options.pageSize === 'original') {
      pageW = imgW + margin * 2;
      pageH = imgH + margin * 2;
    } else if (options.pageSize === 'custom' && options.customWidth && options.customHeight) {
      pageW = options.customWidth;
      pageH = options.customHeight;
    } else {
      const size = PAGE_SIZES[options.pageSize as 'a4' | 'letter'] ?? PAGE_SIZES.a4;
      pageW = size.width;
      pageH = size.height;
    }

    if (options.orientation === 'landscape' || (options.orientation === 'auto' && imgW > imgH)) {
      if (pageW < pageH) {
        [pageW, pageH] = [pageH, pageW];
      }
    } else if (options.orientation === 'portrait') {
      if (pageW > pageH) {
        [pageW, pageH] = [pageH, pageW];
      }
    }

    const page = pdfDoc.addPage([pageW, pageH]);

    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;

    if (options.pageSize === 'original') {
      page.drawImage(image, {
        x: margin,
        y: margin,
        width: imgW,
        height: imgH,
      });
    } else {
      const scale = Math.min(availW / imgW, availH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const x = margin + (availW - drawW) / 2;
      const y = margin + (availH - drawH) / 2;
      page.drawImage(image, { x, y, width: drawW, height: drawH });
    }
  }

  return pdfDoc.save();
}

export function estimatePdfSize(pageCount: number, avgImageSizeKB: number): string {
  const estimatedKB = pageCount * avgImageSizeKB * 0.95 + 10;
  if (estimatedKB < 1024) return `~${Math.round(estimatedKB)} KB`;
  return `~${(estimatedKB / 1024).toFixed(1)} MB`;
}
