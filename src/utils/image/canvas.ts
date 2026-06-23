import type { ImageFormat } from './types';
import { getFormatExtension, stripBasename } from './support';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BlurRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rect' | 'oval';
  style: 'blur' | 'pixelate' | 'black';
  intensity: number;
}

export type WatermarkPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkTextOptions {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  opacity: number;
  letterSpacing: number;
  shadow: boolean;
  position: WatermarkPosition;
  margin: number;
  rotation: number;
  repeated: boolean;
  repeatSpacing: number;
  repeatAngle: number;
}

export interface WatermarkImageOptions {
  image: ImageBitmap;
  sizePercent: number;
  opacity: number;
  position: WatermarkPosition;
  margin: number;
  rotation: number;
  repeated: boolean;
  repeatSpacing: number;
  repeatAngle: number;
  backgroundPlate: 'none' | 'white' | 'black';
}

export function canvasToBlob(
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

export function exportCanvas(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number,
  bgColor: string,
): Promise<Blob> {
  if (format === 'image/jpeg') {
    const jpegCanvas = document.createElement('canvas');
    jpegCanvas.width = canvas.width;
    jpegCanvas.height = canvas.height;
    const ctx = jpegCanvas.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
    ctx.drawImage(canvas, 0, 0);
    return canvasToBlob(jpegCanvas, format, quality);
  }
  return canvasToBlob(canvas, format, format === 'image/png' ? undefined : quality);
}

export function generateOutputFilename(
  originalName: string,
  suffix: string,
  format: ImageFormat,
): string {
  const base = stripBasename(originalName);
  const ext = getFormatExtension(format);
  return `${base}${suffix}.${ext}`;
}

export function cropCanvas(
  bitmap: ImageBitmap,
  rect: CropRect,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    bitmap,
    Math.round(rect.x),
    Math.round(rect.y),
    Math.round(rect.width),
    Math.round(rect.height),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

export function cropAndResizeCanvas(
  bitmap: ImageBitmap,
  rect: CropRect,
  outputWidth: number,
  outputHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    bitmap,
    Math.round(rect.x),
    Math.round(rect.y),
    Math.round(rect.width),
    Math.round(rect.height),
    0,
    0,
    outputWidth,
    outputHeight,
  );
  return canvas;
}

export function calculateRotatedDimensions(
  width: number,
  height: number,
  angleDeg: number,
): { width: number; height: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: Math.ceil(width * cos + height * sin),
    height: Math.ceil(width * sin + height * cos),
  };
}

export function rotateCanvas(
  bitmap: ImageBitmap,
  angleDeg: number,
  bgColor: string,
): HTMLCanvasElement {
  const norm = ((angleDeg % 360) + 360) % 360;
  const { width, height } = calculateRotatedDimensions(bitmap.width, bitmap.height, norm);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.translate(width / 2, height / 2);
  ctx.rotate((norm * Math.PI) / 180);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  return canvas;
}

export function flipCanvas(
  bitmap: ImageBitmap,
  direction: 'horizontal' | 'vertical',
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (direction === 'horizontal') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(bitmap, 0, 0);
  return canvas;
}

export function applyTransform(
  bitmap: ImageBitmap,
  rotationDeg: number,
  flipH: boolean,
  flipV: boolean,
  bgColor: string,
): HTMLCanvasElement {
  const norm = ((rotationDeg % 360) + 360) % 360;
  const { width, height } = calculateRotatedDimensions(bitmap.width, bitmap.height, norm);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.translate(width / 2, height / 2);
  ctx.rotate((norm * Math.PI) / 180);
  if (flipH) ctx.scale(-1, 1);
  if (flipV) ctx.scale(1, -1);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  return canvas;
}

function getWatermarkAnchor(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  itemW: number,
  itemH: number,
  margin: number,
): { x: number; y: number } {
  const positions: Record<WatermarkPosition, { x: number; y: number }> = {
    'top-left': { x: margin, y: margin },
    'top-center': { x: (canvasW - itemW) / 2, y: margin },
    'top-right': { x: canvasW - itemW - margin, y: margin },
    'center-left': { x: margin, y: (canvasH - itemH) / 2 },
    'center': { x: (canvasW - itemW) / 2, y: (canvasH - itemH) / 2 },
    'center-right': { x: canvasW - itemW - margin, y: (canvasH - itemH) / 2 },
    'bottom-left': { x: margin, y: canvasH - itemH - margin },
    'bottom-center': { x: (canvasW - itemW) / 2, y: canvasH - itemH - margin },
    'bottom-right': { x: canvasW - itemW - margin, y: canvasH - itemH - margin },
  };
  return positions[position];
}

function drawRepeatedPattern(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  drawItem: (ctx: CanvasRenderingContext2D, x: number, y: number) => void,
  itemW: number,
  itemH: number,
  spacing: number,
  angleDeg: number,
): void {
  ctx.save();
  const rad = (angleDeg * Math.PI) / 180;
  const diagonal = Math.sqrt(canvasW * canvasW + canvasH * canvasH);
  const stepX = itemW + spacing;
  const stepY = itemH + spacing;

  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.rotate(rad);

  const startX = -diagonal;
  const startY = -diagonal;

  for (let y = startY; y < diagonal; y += stepY) {
    for (let x = startX; x < diagonal; x += stepX) {
      drawItem(ctx, x, y);
    }
  }
  ctx.restore();
}

export function applyTextWatermark(
  canvas: HTMLCanvasElement,
  options: WatermarkTextOptions,
): void {
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.globalAlpha = options.opacity;

  const fontSpec = `${options.fontWeight} ${options.fontSize}px ${options.fontFamily}`;
  ctx.font = fontSpec;
  ctx.fillStyle = options.color;
  if (options.letterSpacing > 0) {
    (ctx as unknown as Record<string, number>).letterSpacing = options.letterSpacing;
  }

  if (options.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  const metrics = ctx.measureText(options.text);
  const textW = metrics.width;
  const textH = options.fontSize;

  if (options.repeated) {
    drawRepeatedPattern(
      ctx,
      canvas.width,
      canvas.height,
      (c, x, y) => {
        c.font = fontSpec;
        c.fillStyle = options.color;
        if (options.shadow) {
          c.shadowColor = 'rgba(0,0,0,0.5)';
          c.shadowBlur = 4;
          c.shadowOffsetX = 2;
          c.shadowOffsetY = 2;
        }
        c.fillText(options.text, x, y + textH);
      },
      textW,
      textH,
      options.repeatSpacing,
      options.repeatAngle,
    );
  } else {
    const anchor = getWatermarkAnchor(
      options.position,
      canvas.width,
      canvas.height,
      textW,
      textH,
      options.margin,
    );

    if (options.rotation !== 0) {
      ctx.translate(anchor.x + textW / 2, anchor.y + textH / 2);
      ctx.rotate((options.rotation * Math.PI) / 180);
      ctx.fillText(options.text, -textW / 2, textH / 2);
    } else {
      ctx.fillText(options.text, anchor.x, anchor.y + textH);
    }
  }
  ctx.restore();
}

export function applyImageWatermark(
  canvas: HTMLCanvasElement,
  options: WatermarkImageOptions,
): void {
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.globalAlpha = options.opacity;

  const scale = options.sizePercent / 100;
  const wmW = Math.round(canvas.width * scale);
  const wmH = Math.round((options.image.height / options.image.width) * wmW);

  const drawWm = (c: CanvasRenderingContext2D, x: number, y: number) => {
    if (options.backgroundPlate !== 'none') {
      c.fillStyle = options.backgroundPlate === 'white' ? '#ffffff' : '#000000';
      c.fillRect(x - 4, y - 4, wmW + 8, wmH + 8);
    }
    c.drawImage(options.image, x, y, wmW, wmH);
  };

  if (options.repeated) {
    drawRepeatedPattern(
      ctx,
      canvas.width,
      canvas.height,
      drawWm,
      wmW,
      wmH,
      options.repeatSpacing,
      options.repeatAngle,
    );
  } else {
    const anchor = getWatermarkAnchor(
      options.position,
      canvas.width,
      canvas.height,
      wmW,
      wmH,
      options.margin,
    );

    if (options.rotation !== 0) {
      ctx.translate(anchor.x + wmW / 2, anchor.y + wmH / 2);
      ctx.rotate((options.rotation * Math.PI) / 180);
      drawWm(ctx, -wmW / 2, -wmH / 2);
    } else {
      drawWm(ctx, anchor.x, anchor.y);
    }
  }
  ctx.restore();
}

export function applyBlurRegions(
  canvas: HTMLCanvasElement,
  regions: BlurRegion[],
): void {
  const ctx = canvas.getContext('2d')!;

  for (const region of regions) {
    const rx = Math.round(region.x);
    const ry = Math.round(region.y);
    const rw = Math.round(region.width);
    const rh = Math.round(region.height);

    if (rw <= 0 || rh <= 0) continue;

    ctx.save();

    if (region.shape === 'oval') {
      ctx.beginPath();
      ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
    }

    if (region.style === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(rx, ry, rw, rh);
    } else if (region.style === 'pixelate') {
      const blockSize = Math.max(2, Math.round(region.intensity));
      const imgData = ctx.getImageData(rx, ry, rw, rh);
      const data = imgData.data;

      for (let by = 0; by < rh; by += blockSize) {
        for (let bx = 0; bx < rw; bx += blockSize) {
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          for (let py = by; py < Math.min(by + blockSize, rh); py++) {
            for (let px = bx; px < Math.min(bx + blockSize, rw); px++) {
              const idx = (py * rw + px) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              a += data[idx + 3];
              count++;
            }
          }
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          a = Math.round(a / count);

          for (let py = by; py < Math.min(by + blockSize, rh); py++) {
            for (let px = bx; px < Math.min(bx + blockSize, rw); px++) {
              const idx = (py * rw + px) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = a;
            }
          }
        }
      }
      ctx.putImageData(imgData, rx, ry);
    } else {
      const passes = Math.max(1, Math.round(region.intensity / 3));
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = rw;
      tempCanvas.height = rh;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, rw, rh);

      for (let i = 0; i < passes; i++) {
        const scale = Math.max(1, Math.round(region.intensity));
        const smallW = Math.max(1, Math.round(rw / scale));
        const smallH = Math.max(1, Math.round(rh / scale));

        const small = document.createElement('canvas');
        small.width = smallW;
        small.height = smallH;
        const sCtx = small.getContext('2d')!;
        sCtx.drawImage(tempCanvas, 0, 0, smallW, smallH);
        tempCtx.clearRect(0, 0, rw, rh);
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(small, 0, 0, rw, rh);
      }

      ctx.drawImage(tempCanvas, rx, ry);
    }

    ctx.restore();
  }
}

export function renderBitmapToCanvas(
  bitmap: ImageBitmap,
  width?: number,
  height?: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width ?? bitmap.width;
  canvas.height = height ?? bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function addBorder(
  canvas: HTMLCanvasElement,
  thickness: number,
  color: string,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = canvas.width + thickness * 2;
  out.height = canvas.height + thickness * 2;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, thickness, thickness);
  return out;
}

export function addTextOverlay(
  canvas: HTMLCanvasElement,
  text: string,
  fontSize: number,
  color: string,
  x: number,
  y: number,
  opacity: number,
): void {
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function hasFaceDetectorSupport(): boolean {
  return typeof (window as Record<string, unknown>).FaceDetector === 'function';
}

export async function detectFaces(
  bitmap: ImageBitmap,
): Promise<Array<{ x: number; y: number; width: number; height: number }>> {
  if (!hasFaceDetectorSupport()) return [];
  try {
    const FaceDetector = (window as Record<string, unknown>).FaceDetector as new () => {
      detect(source: ImageBitmap): Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
    const detector = new FaceDetector();
    const faces = await detector.detect(bitmap);
    return faces.map((f) => ({
      x: f.boundingBox.x,
      y: f.boundingBox.y,
      width: f.boundingBox.width,
      height: f.boundingBox.height,
    }));
  } catch {
    return [];
  }
}
