import { rgbToHex, rgbToHsl, type RGB } from './colorConversion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PaletteColor {
  rgb: RGB;
  hex: string;
  count: number;
  percentage: number;
}

export type ExtractionMethod = 'dominant' | 'vibrant' | 'balanced';

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

interface ColorBucket {
  pixels: RGB[];
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
}

function buildBucket(pixels: RGB[]): ColorBucket {
  let rMin = 255, rMax = 0;
  let gMin = 255, gMax = 0;
  let bMin = 255, bMax = 0;

  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }

  return { pixels, rMin, rMax, gMin, gMax, bMin, bMax };
}

function bucketAverage(bucket: ColorBucket): RGB {
  let rSum = 0, gSum = 0, bSum = 0;
  for (const p of bucket.pixels) {
    rSum += p.r;
    gSum += p.g;
    bSum += p.b;
  }
  const n = bucket.pixels.length;
  return {
    r: Math.round(rSum / n),
    g: Math.round(gSum / n),
    b: Math.round(bSum / n),
  };
}

function splitBucket(bucket: ColorBucket): [ColorBucket, ColorBucket] {
  const rRange = bucket.rMax - bucket.rMin;
  const gRange = bucket.gMax - bucket.gMin;
  const bRange = bucket.bMax - bucket.bMin;

  let channel: 'r' | 'g' | 'b';
  if (rRange >= gRange && rRange >= bRange) {
    channel = 'r';
  } else if (gRange >= rRange && gRange >= bRange) {
    channel = 'g';
  } else {
    channel = 'b';
  }

  const sorted = [...bucket.pixels].sort((a, b) => a[channel] - b[channel]);
  const mid = Math.floor(sorted.length / 2);

  return [buildBucket(sorted.slice(0, mid)), buildBucket(sorted.slice(mid))];
}

/**
 * Median-cut quantisation.
 * Splits pixel buckets until we have `count` groups, then returns
 * the average colour and pixel count for each.
 */
function medianCut(pixels: RGB[], count: number): Array<{ rgb: RGB; count: number }> {
  if (pixels.length === 0) return [];

  let buckets: ColorBucket[] = [buildBucket(pixels)];

  while (buckets.length < count) {
    // Sort buckets by size descending so we split the largest first
    buckets.sort((a, b) => b.pixels.length - a.pixels.length);

    const target = buckets[0];
    if (target.pixels.length < 2) break;

    const [a, b] = splitBucket(target);
    buckets = [a, b, ...buckets.slice(1)];
  }

  return buckets
    .filter((b) => b.pixels.length > 0)
    .map((b) => ({ rgb: bucketAverage(b), count: b.pixels.length }))
    .sort((a, b) => b.count - a.count);
}

/** Euclidean distance squared in RGB space. */
function rgbDistSq(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/** Saturation in 0-1 for weighting. */
function saturation(rgb: RGB): number {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

/**
 * Sample image pixels.  For large images we sub-sample for speed.
 * Returns an array of RGB values.
 */
function samplePixels(imageData: ImageData, weightBySaturation: boolean): RGB[] {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  // Sub-sample if image is very large (aim for ~50k pixels max)
  const step = totalPixels > 50_000 ? Math.ceil(totalPixels / 50_000) : 1;
  const result: RGB[] = [];

  for (let i = 0; i < totalPixels; i += step) {
    const offset = i * 4;
    const a = data[offset + 3];
    // Skip fully transparent pixels
    if (a < 10) continue;

    const rgb: RGB = { r: data[offset], g: data[offset + 1], b: data[offset + 2] };

    if (weightBySaturation) {
      // Duplicate high-saturation pixels to weight them higher
      const s = saturation(rgb);
      const repeats = Math.max(1, Math.round(s * 4));
      for (let j = 0; j < repeats; j++) {
        result.push(rgb);
      }
    } else {
      result.push(rgb);
    }
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function extractPalette(
  imageData: ImageData,
  count: number,
  method: ExtractionMethod,
): PaletteColor[] {
  const weightBySaturation = method === 'vibrant';
  const pixels = samplePixels(imageData, weightBySaturation);

  if (pixels.length === 0) return [];

  let raw = medianCut(pixels, count);

  if (method === 'balanced' && raw.length > 1) {
    raw = balancePalette(raw, count);
  }

  const totalCount = raw.reduce((s, c) => s + c.count, 0);

  return raw.slice(0, count).map((c) => ({
    rgb: c.rgb,
    hex: rgbToHex(c.rgb),
    count: c.count,
    percentage: Math.round((c.count / totalCount) * 1000) / 10,
  }));
}

/**
 * Ensure hue diversity.  If two palette colours are too close in hue
 * (< 25 degrees), replace the less-prominent duplicate by re-running
 * quantisation at a finer level and picking the most different colour.
 */
function balancePalette(
  raw: Array<{ rgb: RGB; count: number }>,
  targetCount: number,
): Array<{ rgb: RGB; count: number }> {
  const MIN_HUE_DIFF = 25;
  const result = [...raw];

  for (let i = 0; i < result.length && result.length >= targetCount; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const hslA = rgbToHsl(result[i].rgb);
      const hslB = rgbToHsl(result[j].rgb);
      const hueDiff = Math.abs(hslA.h - hslB.h);
      const wrappedDiff = Math.min(hueDiff, 360 - hueDiff);

      if (wrappedDiff < MIN_HUE_DIFF && rgbDistSq(result[i].rgb, result[j].rgb) < 3000) {
        // Merge the smaller into the larger
        if (result[i].count >= result[j].count) {
          result[i] = {
            rgb: result[i].rgb,
            count: result[i].count + result[j].count,
          };
          result.splice(j, 1);
          j--;
        } else {
          result[j] = {
            rgb: result[j].rgb,
            count: result[i].count + result[j].count,
          };
          result.splice(i, 1);
          i--;
          break;
        }
      }
    }
  }

  return result.sort((a, b) => b.count - a.count);
}

/* ------------------------------------------------------------------ */
/*  Palette preview PNG                                                */
/* ------------------------------------------------------------------ */

/**
 * Render the palette as a horizontal swatch strip and return as a PNG Blob.
 */
export function generatePalettePreviewPng(
  colors: PaletteColor[],
  width: number,
  height: number,
): Blob {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx || colors.length === 0) {
    // Return a 1x1 transparent PNG as fallback
    canvas.width = 1;
    canvas.height = 1;
    const fallbackCtx = canvas.getContext('2d')!;
    fallbackCtx.clearRect(0, 0, 1, 1);
    const dataUrl = canvas.toDataURL('image/png');
    const binary = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: 'image/png' });
  }

  const swatchWidth = width / colors.length;

  for (let i = 0; i < colors.length; i++) {
    const { r, g, b } = colors[i].rgb;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(Math.round(i * swatchWidth), 0, Math.ceil(swatchWidth), height);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const binary = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'image/png' });
}
