export type EnhanceMode =
  | 'auto'
  | 'low-light'
  | 'denoise'
  | 'sharpen'
  | 'color-correct'
  | 'restore-faded';

export type EnhanceIntensity = 'conservative' | 'balanced' | 'strong';

interface HistogramStats {
  mean: number;
  stdDev: number;
  darkPercent: number;
  lightPercent: number;
  rMean: number;
  gMean: number;
  bMean: number;
}

function analyzeHistogram(imageData: ImageData): HistogramStats {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  let sum = 0;
  let darkCount = 0;
  let lightCount = 0;
  let rSum = 0, gSum = 0, bSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    if (lum < 50) darkCount++;
    if (lum > 220) lightCount++;
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }

  const mean = sum / totalPixels;
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    variance += (lum - mean) ** 2;
  }
  const stdDev = Math.sqrt(variance / totalPixels);

  return {
    mean,
    stdDev,
    darkPercent: (darkCount / totalPixels) * 100,
    lightPercent: (lightCount / totalPixels) * 100,
    rMean: rSum / totalPixels,
    gMean: gSum / totalPixels,
    bMean: bSum / totalPixels,
  };
}

const intensityMultiplier: Record<EnhanceIntensity, number> = {
  conservative: 0.5,
  balanced: 1.0,
  strong: 1.6,
};

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function applyBrightness(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] + amount);
    data[i + 1] = clamp(data[i + 1] + amount);
    data[i + 2] = clamp(data[i + 2] + amount);
  }
}

function applyContrast(data: Uint8ClampedArray, factor: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(128 + factor * (data[i] - 128));
    data[i + 1] = clamp(128 + factor * (data[i + 1] - 128));
    data[i + 2] = clamp(128 + factor * (data[i + 2] - 128));
  }
}

function applySaturation(data: Uint8ClampedArray, factor: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = clamp(gray + factor * (data[i] - gray));
    data[i + 1] = clamp(gray + factor * (data[i + 1] - gray));
    data[i + 2] = clamp(gray + factor * (data[i + 2] - gray));
  }
}

function applyWhiteBalance(data: Uint8ClampedArray, stats: HistogramStats): void {
  const avg = (stats.rMean + stats.gMean + stats.bMean) / 3;
  const rScale = avg / Math.max(stats.rMean, 1);
  const gScale = avg / Math.max(stats.gMean, 1);
  const bScale = avg / Math.max(stats.bMean, 1);

  const rAdj = Math.max(0.8, Math.min(1.2, rScale));
  const gAdj = Math.max(0.8, Math.min(1.2, gScale));
  const bAdj = Math.max(0.8, Math.min(1.2, bScale));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * rAdj);
    data[i + 1] = clamp(data[i + 1] * gAdj);
    data[i + 2] = clamp(data[i + 2] * bAdj);
  }
}

function applySharpen(data: Uint8ClampedArray, width: number, height: number, strength: number): void {
  const src = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[idx + c] * (1 + 4 * strength);
        const neighbors =
          src[idx - width * 4 + c] * strength +
          src[idx + width * 4 + c] * strength +
          src[idx - 4 + c] * strength +
          src[idx + 4 + c] * strength;
        data[idx + c] = clamp(center - neighbors);
      }
    }
  }
}

function applyDenoise(data: Uint8ClampedArray, width: number, height: number, radius: number): void {
  const src = new Uint8ClampedArray(data);
  const r = Math.max(1, Math.round(radius));
  for (let y = r; y < height - r; y++) {
    for (let x = r; x < width - r; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let count = 0;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const ni = ((y + dy) * width + (x + dx)) * 4 + c;
            const diff = Math.abs(src[ni] - src[idx + c]);
            if (diff < 30) {
              sum += src[ni];
              count++;
            }
          }
        }
        data[idx + c] = clamp(sum / count);
      }
    }
  }
}

function applyHistogramStretch(data: Uint8ClampedArray): void {
  let minLum = 255;
  let maxLum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  const range = maxLum - minLum;
  if (range < 10) return;

  const scale = 255 / range;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp((data[i] - minLum) * scale);
    data[i + 1] = clamp((data[i + 1] - minLum) * scale);
    data[i + 2] = clamp((data[i + 2] - minLum) * scale);
  }
}

export function enhanceImage(
  bitmap: ImageBitmap,
  mode: EnhanceMode,
  intensity: EnhanceIntensity,
): { canvas: HTMLCanvasElement; appliedOps: string[] } {
  const w = bitmap.width;
  const h = bitmap.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;
  const stats = analyzeHistogram(imageData);
  const mult = intensityMultiplier[intensity];
  const appliedOps: string[] = [];

  switch (mode) {
    case 'auto': {
      if (stats.mean < 100) {
        applyBrightness(data, (100 - stats.mean) * 0.4 * mult);
        appliedOps.push('Brightness correction (image adjustment)');
      }
      if (stats.stdDev < 50) {
        applyContrast(data, 1 + (50 - stats.stdDev) / 100 * mult);
        appliedOps.push('Contrast enhancement (image adjustment)');
      }
      const colorImbalance = Math.max(
        Math.abs(stats.rMean - stats.gMean),
        Math.abs(stats.gMean - stats.bMean),
        Math.abs(stats.rMean - stats.bMean),
      );
      if (colorImbalance > 15) {
        applyWhiteBalance(data, stats);
        appliedOps.push('White balance correction (image adjustment)');
      }
      applySaturation(data, 1 + 0.1 * mult);
      appliedOps.push('Subtle saturation boost (image adjustment)');
      applySharpen(data, w, h, 0.15 * mult);
      appliedOps.push('Light sharpening (image adjustment)');
      break;
    }
    case 'low-light': {
      const boost = Math.min(60, (120 - stats.mean) * 0.6) * mult;
      applyBrightness(data, boost);
      appliedOps.push('Brightness boost (image adjustment)');
      applyContrast(data, 1 + 0.2 * mult);
      appliedOps.push('Contrast recovery (image adjustment)');
      applyDenoise(data, w, h, 1.5 * mult);
      appliedOps.push('Noise reduction (image adjustment)');
      applySaturation(data, 1 + 0.15 * mult);
      appliedOps.push('Colour recovery (image adjustment)');
      break;
    }
    case 'denoise': {
      applyDenoise(data, w, h, 2 * mult);
      appliedOps.push('Noise reduction (image adjustment)');
      applySharpen(data, w, h, 0.1 * mult);
      appliedOps.push('Detail recovery sharpening (image adjustment)');
      break;
    }
    case 'sharpen': {
      applySharpen(data, w, h, 0.3 * mult);
      appliedOps.push('Unsharp masking (image adjustment)');
      break;
    }
    case 'color-correct': {
      applyWhiteBalance(data, stats);
      appliedOps.push('Auto white balance (image adjustment)');
      applySaturation(data, 1 + 0.12 * mult);
      appliedOps.push('Saturation correction (image adjustment)');
      if (stats.mean < 90 || stats.mean > 170) {
        applyBrightness(data, (128 - stats.mean) * 0.3 * mult);
        appliedOps.push('Exposure correction (image adjustment)');
      }
      break;
    }
    case 'restore-faded': {
      applyHistogramStretch(data);
      appliedOps.push('Histogram stretching (image adjustment)');
      applyContrast(data, 1 + 0.25 * mult);
      appliedOps.push('Contrast restoration (image adjustment)');
      applySaturation(data, 1 + 0.2 * mult);
      appliedOps.push('Colour vibrancy restoration (image adjustment)');
      applySharpen(data, w, h, 0.2 * mult);
      appliedOps.push('Detail sharpening (image adjustment)');
      break;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return { canvas, appliedOps };
}
