export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  blur: number;
  grayscale: number;
  sepia: number;
  vignette: number;
}

export function getDefaultAdjustments(): ImageAdjustments {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    sharpness: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    vignette: 0,
  };
}

export function isDefaultAdjustments(adj: ImageAdjustments): boolean {
  const def = getDefaultAdjustments();
  return (Object.keys(def) as (keyof ImageAdjustments)[]).every(
    (k) => adj[k] === def[k],
  );
}

export function getCSSFilterString(adj: ImageAdjustments): string {
  const parts: string[] = [];

  const brightnessVal = 1 + adj.brightness / 100 + adj.exposure / 200;
  if (brightnessVal !== 1) parts.push(`brightness(${brightnessVal.toFixed(3)})`);

  const contrastVal = 1 + adj.contrast / 100;
  if (contrastVal !== 1) parts.push(`contrast(${contrastVal.toFixed(3)})`);

  const satVal = 1 + adj.saturation / 100;
  if (satVal !== 1) parts.push(`saturate(${satVal.toFixed(3)})`);

  if (adj.grayscale > 0) parts.push(`grayscale(${(adj.grayscale / 100).toFixed(3)})`);
  if (adj.sepia > 0) parts.push(`sepia(${(adj.sepia / 100).toFixed(3)})`);
  if (adj.blur > 0) parts.push(`blur(${adj.blur}px)`);

  return parts.length > 0 ? parts.join(' ') : 'none';
}

export function applyAdjustmentsToCanvas(
  bitmap: ImageBitmap,
  adj: ImageAdjustments,
  width?: number,
  height?: number,
): HTMLCanvasElement {
  const w = width ?? bitmap.width;
  const h = height ?? bitmap.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const cssFilter = getCSSFilterString(adj);
  if (cssFilter !== 'none') {
    ctx.filter = cssFilter;
  }

  ctx.drawImage(bitmap, 0, 0, w, h);
  ctx.filter = 'none';

  if (adj.temperature !== 0 || adj.tint !== 0 || adj.highlights !== 0 || adj.shadows !== 0) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    applyColorAdjustments(data, adj);
    ctx.putImageData(imgData, 0, 0);
  }

  if (adj.sharpness > 0) {
    applySharpen(ctx, w, h, adj.sharpness / 100);
  }

  if (adj.vignette > 0) {
    applyVignette(ctx, w, h, adj.vignette / 100);
  }

  return canvas;
}

function applyColorAdjustments(data: Uint8ClampedArray, adj: ImageAdjustments): void {
  const tempShift = adj.temperature / 100;
  const tintShift = adj.tint / 100;
  const highAdj = adj.highlights / 100;
  const shadAdj = adj.shadows / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (tempShift !== 0) {
      r = clamp(r + tempShift * 30);
      b = clamp(b - tempShift * 30);
    }

    if (tintShift !== 0) {
      g = clamp(g + tintShift * 20);
    }

    const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

    if (highAdj !== 0 && luminance > 0.5) {
      const factor = (luminance - 0.5) * 2 * highAdj * 40;
      r = clamp(r + factor);
      g = clamp(g + factor);
      b = clamp(b + factor);
    }

    if (shadAdj !== 0 && luminance < 0.5) {
      const factor = (0.5 - luminance) * 2 * shadAdj * 40;
      r = clamp(r + factor);
      g = clamp(g + factor);
      b = clamp(b + factor);
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function applySharpen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount: number,
): void {
  const imgData = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;
  const strength = amount * 0.5;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[idx + c] * (1 + 4 * strength);
        const neighbors =
          src[idx - w * 4 + c] * strength +
          src[idx + w * 4 + c] * strength +
          src[idx - 4 + c] * strength +
          src[idx + 4 + c] * strength;
        dst[idx + c] = clamp(center - neighbors);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function applyVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.sqrt(cx * cx + cy * cy);
  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${intensity * 0.8})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

export interface FilterPreset {
  name: string;
  adjustments: Partial<ImageAdjustments>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { name: 'Original', adjustments: {} },
  { name: 'Warm', adjustments: { temperature: 30, saturation: 10, brightness: 5 } },
  { name: 'Cool', adjustments: { temperature: -30, saturation: 5, brightness: 5 } },
  { name: 'Black & White', adjustments: { grayscale: 100 } },
  { name: 'Vintage', adjustments: { sepia: 40, contrast: 10, saturation: -20, vignette: 30 } },
  { name: 'High Contrast', adjustments: { contrast: 50, saturation: 15, shadows: -10 } },
  { name: 'Soft Fade', adjustments: { contrast: -15, brightness: 10, saturation: -20, highlights: 20 } },
];

export function applyPreset(
  _current: ImageAdjustments,
  preset: FilterPreset,
): ImageAdjustments {
  const def = getDefaultAdjustments();
  return { ...def, ...preset.adjustments } as ImageAdjustments;
}
