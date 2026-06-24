/* ------------------------------------------------------------------ */
/*  Browser-side image vectorization engine                            */
/*  No external dependencies — Canvas API + custom algorithms          */
/* ------------------------------------------------------------------ */

export interface VectorizeOptions {
  mode: 'monochrome' | 'grayscale' | 'color' | 'lineart';
  threshold: number; // 0-255, for monochrome
  colorCount: number; // for color/grayscale modes
  smoothing: number; // 0-10, path smoothing level
  simplifyTolerance: number; // 0-20, Douglas-Peucker tolerance
  minShapeSize: number; // min area to keep (speckle removal)
  invert: boolean;
  removeBackground: boolean;
  strokeMode: boolean; // output as strokes vs fills
}

export interface VectorizeResult {
  svgString: string;
  pathCount: number;
  colors: string[];
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface Contour {
  points: Point[];
  isHole: boolean;
}

interface ColorLayer {
  color: string;
  mask: Uint8Array;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

export const defaultVectorizeOptions: VectorizeOptions = {
  mode: 'monochrome',
  threshold: 128,
  colorCount: 8,
  smoothing: 3,
  simplifyTolerance: 2,
  minShapeSize: 5,
  invert: false,
  removeBackground: false,
  strokeMode: false,
};

/* ------------------------------------------------------------------ */
/*  Size limits                                                        */
/* ------------------------------------------------------------------ */

const WARN_SIZE = 4000;
const MAX_SIZE = 8000;

export function checkImageSize(
  width: number,
  height: number,
): { ok: boolean; warning: string | null } {
  if (width > MAX_SIZE || height > MAX_SIZE) {
    return {
      ok: false,
      warning: `Image is too large (${width}x${height}). Maximum supported size is ${MAX_SIZE}x${MAX_SIZE}.`,
    };
  }
  if (width > WARN_SIZE || height > WARN_SIZE) {
    return {
      ok: true,
      warning: `Large image (${width}x${height}) may take a while to process.`,
    };
  }
  return { ok: true, warning: null };
}

/* ------------------------------------------------------------------ */
/*  Yield helper — prevent UI blocking                                 */
/* ------------------------------------------------------------------ */

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/* ------------------------------------------------------------------ */
/*  Pre-processing helpers                                             */
/* ------------------------------------------------------------------ */

function toGrayscaleData(data: Uint8ClampedArray): Uint8Array {
  const len = data.length / 4;
  const gray = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const off = i * 4;
    gray[i] = Math.round(
      data[off] * 0.299 + data[off + 1] * 0.587 + data[off + 2] * 0.114,
    );
  }
  return gray;
}

function applyThreshold(gray: Uint8Array, threshold: number, invert: boolean): Uint8Array {
  const mask = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const val = gray[i] >= threshold ? 1 : 0;
    mask[i] = invert ? (1 - val) : val;
  }
  return mask;
}

/** Simple 3x3 box blur on a grayscale buffer */
function blur3x3(gray: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(gray.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            sum += gray[ny * w + nx];
            count++;
          }
        }
      }
      out[y * w + x] = Math.round(sum / count);
    }
  }
  return out;
}

/** Sobel edge detection returning magnitude per pixel (0-255) */
function sobelEdgeDetect(gray: Uint8Array, w: number, h: number): Uint8Array {
  const edges = new Uint8Array(gray.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (v: number, u: number) => v * w + u;
      const gx =
        -gray[idx(y - 1, x - 1)] -
        2 * gray[idx(y, x - 1)] -
        gray[idx(y + 1, x - 1)] +
        gray[idx(y - 1, x + 1)] +
        2 * gray[idx(y, x + 1)] +
        gray[idx(y + 1, x + 1)];
      const gy =
        -gray[idx(y - 1, x - 1)] -
        2 * gray[idx(y - 1, x)] -
        gray[idx(y - 1, x + 1)] +
        gray[idx(y + 1, x - 1)] +
        2 * gray[idx(y + 1, x)] +
        gray[idx(y + 1, x + 1)];
      const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      edges[y * w + x] = mag;
    }
  }
  return edges;
}

/* ------------------------------------------------------------------ */
/*  Color quantization — Median Cut                                    */
/* ------------------------------------------------------------------ */

interface ColorBox {
  pixels: Array<[number, number, number]>;
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
}

function computeBounds(pixels: Array<[number, number, number]>): ColorBox {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const [r, g, b] of pixels) {
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
  }
  return { pixels, rMin, rMax, gMin, gMax, bMin, bMax };
}

function medianCut(data: Uint8ClampedArray, numColors: number): Array<[number, number, number]> {
  // Collect unique-ish pixels (sample if too many)
  const allPixels: Array<[number, number, number]> = [];
  const step = data.length > 400000 ? 4 : 1; // sample every Nth pixel for performance
  for (let i = 0; i < data.length; i += 4 * step) {
    allPixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  if (allPixels.length === 0) {
    return [[0, 0, 0]];
  }

  const boxes: ColorBox[] = [computeBounds(allPixels)];

  while (boxes.length < numColors) {
    // Find box with largest range
    let maxRange = -1;
    let maxIdx = 0;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const rRange = box.rMax - box.rMin;
      const gRange = box.gMax - box.gMin;
      const bRange = box.bMax - box.bMin;
      const range = Math.max(rRange, gRange, bRange);
      if (range > maxRange && box.pixels.length > 1) {
        maxRange = range;
        maxIdx = i;
      }
    }

    if (maxRange <= 0) break;

    const box = boxes[maxIdx];
    const rRange = box.rMax - box.rMin;
    const gRange = box.gMax - box.gMin;
    const bRange = box.bMax - box.bMin;

    // Sort along longest axis
    let axis: 0 | 1 | 2;
    if (rRange >= gRange && rRange >= bRange) axis = 0;
    else if (gRange >= bRange) axis = 1;
    else axis = 2;

    box.pixels.sort((a, b) => a[axis] - b[axis]);
    const mid = Math.floor(box.pixels.length / 2);
    const left = box.pixels.slice(0, mid);
    const right = box.pixels.slice(mid);

    boxes.splice(maxIdx, 1, computeBounds(left), computeBounds(right));
  }

  // Average color per box
  return boxes.map((box) => {
    let rSum = 0, gSum = 0, bSum = 0;
    for (const [r, g, b] of box.pixels) {
      rSum += r;
      gSum += g;
      bSum += b;
    }
    const n = box.pixels.length;
    return [
      Math.round(rSum / n),
      Math.round(gSum / n),
      Math.round(bSum / n),
    ] as [number, number, number];
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
  );
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

function assignPixelsToColors(
  data: Uint8ClampedArray,
  palette: Array<[number, number, number]>,
): Uint8Array {
  const pixelCount = data.length / 4;
  const assignments = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const off = i * 4;
    const r = data[off];
    const g = data[off + 1];
    const b = data[off + 2];
    let minDist = Infinity;
    let bestIdx = 0;
    for (let c = 0; c < palette.length; c++) {
      const dist = colorDistance(r, g, b, palette[c][0], palette[c][1], palette[c][2]);
      if (dist < minDist) {
        minDist = dist;
        bestIdx = c;
      }
    }
    assignments[i] = bestIdx;
  }
  return assignments;
}

/* ------------------------------------------------------------------ */
/*  Background detection                                               */
/* ------------------------------------------------------------------ */

function detectBackgroundColorIndex(
  assignments: Uint8Array,
  w: number,
  h: number,
  paletteSize: number,
): number {
  // Count colors on the border
  const counts = new Uint32Array(paletteSize);
  for (let x = 0; x < w; x++) {
    counts[assignments[x]]++;
    counts[assignments[(h - 1) * w + x]]++;
  }
  for (let y = 1; y < h - 1; y++) {
    counts[assignments[y * w]]++;
    counts[assignments[y * w + w - 1]]++;
  }
  let maxCount = 0;
  let bgIdx = 0;
  for (let i = 0; i < paletteSize; i++) {
    if (counts[i] > maxCount) {
      maxCount = counts[i];
      bgIdx = i;
    }
  }
  return bgIdx;
}

/* ------------------------------------------------------------------ */
/*  Marching Squares contour tracing                                   */
/* ------------------------------------------------------------------ */

function marchingSquaresContours(
  mask: Uint8Array,
  w: number,
  h: number,
  minArea: number,
): Contour[] {
  // The mask grid is w * h. We walk an (w+1) x (h+1) lattice.
  // Each 2x2 cell of the lattice maps to one pixel.
  const visited = new Uint8Array(w * h);
  const contours: Contour[] = [];

  // Helper: get mask value (0 outside bounds)
  const getMask = (x: number, y: number): number => {
    if (x < 0 || x >= w || y < 0 || y >= h) return 0;
    return mask[y * w + x];
  };

  // Cell index for marching squares (2x2 corners)
  const cellIndex = (cx: number, cy: number): number => {
    const tl = getMask(cx - 1, cy - 1);
    const tr = getMask(cx, cy - 1);
    const br = getMask(cx, cy);
    const bl = getMask(cx - 1, cy);
    return (tl << 3) | (tr << 2) | (br << 1) | bl;
  };

  // Direction lookup for marching squares (dx, dy)
  // Index is the 4-bit cell config
  const dirMap: Record<number, [number, number]> = {
    1: [0, 1],   // S
    2: [1, 0],   // E
    3: [1, 0],   // E
    4: [0, -1],  // N
    5: [0, 1],   // S (ambiguous — saddle, pick one)
    6: [0, -1],  // N
    7: [1, 0],   // E
    8: [-1, 0],  // W
    9: [0, 1],   // S (wait — let me use prev direction for saddle)
    10: [-1, 0], // W (ambiguous saddle)
    11: [1, 0],  // E
    12: [-1, 0], // W
    13: [0, 1],  // S
    14: [-1, 0], // W
  };

  // Trace one contour starting at (sx, sy) on the lattice
  const traceContour = (sx: number, sy: number): Point[] => {
    const points: Point[] = [];
    let cx = sx;
    let cy = sy;
    let prevDx = 0;
    let prevDy = 0;

    const maxSteps = (w + h) * 4;
    for (let step = 0; step < maxSteps; step++) {
      points.push({ x: cx, y: cy });
      const idx = cellIndex(cx, cy);

      if (idx === 0 || idx === 15) break;

      let dir = dirMap[idx];
      if (!dir) break;

      // Handle saddle points (5 and 10) by preferring previous direction
      if (idx === 5) {
        if (prevDy === -1) dir = [0, -1];
        else dir = [0, 1];
      } else if (idx === 10) {
        if (prevDx === -1) dir = [-1, 0];
        else dir = [1, 0];
      }

      prevDx = dir[0];
      prevDy = dir[1];
      cx += dir[0];
      cy += dir[1];

      // Bounds check
      if (cx < 0 || cx > w || cy < 0 || cy > h) break;

      // Back to start?
      if (cx === sx && cy === sy) {
        points.push({ x: cx, y: cy }); // close the loop
        break;
      }
    }

    return points;
  };

  // Scan for contour start points
  // A contour starts where a lattice vertex has different corner values
  for (let y = 0; y <= h; y++) {
    for (let x = 0; x <= w; x++) {
      const idx = cellIndex(x, y);
      if (idx === 0 || idx === 15) continue;

      // Check if we've already traced through this area
      const px = Math.min(x, w - 1);
      const py = Math.min(y, h - 1);
      if (visited[py * w + px]) continue;

      const points = traceContour(x, y);
      if (points.length < 3) continue;

      // Calculate area (Shoelace formula)
      let area = 0;
      for (let i = 0; i < points.length - 1; i++) {
        area += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
      }
      area = Math.abs(area) / 2;

      if (area < minArea) continue;

      // Mark visited pixels along this contour
      for (const p of points) {
        const vx = Math.max(0, Math.min(w - 1, Math.floor(p.x)));
        const vy = Math.max(0, Math.min(h - 1, Math.floor(p.y)));
        visited[vy * w + vx] = 1;
      }

      const isHole = area < 0; // CW = outer, CCW = hole
      contours.push({ points, isHole: isHole });
    }
  }

  return contours;
}

/* ------------------------------------------------------------------ */
/*  Ramer-Douglas-Peucker path simplification                          */
/* ------------------------------------------------------------------ */

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const ex = point.x - lineStart.x;
    const ey = point.y - lineStart.y;
    return Math.sqrt(ex * ex + ey * ey);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq,
    ),
  );
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  const ex = point.x - projX;
  const ey = point.y - projY;
  return Math.sqrt(ex * ex + ey * ey);
}

function douglasPeucker(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

/* ------------------------------------------------------------------ */
/*  Path smoothing — convert polyline to smooth bezier curves          */
/* ------------------------------------------------------------------ */

function smoothPath(points: Point[], smoothing: number): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${r(points[0].x)},${r(points[0].y)}`;

  // smoothing 0 = no smoothing (straight lines), 10 = maximum
  const factor = smoothing / 10;

  if (factor <= 0 || points.length <= 2) {
    // Straight-line path
    let d = `M${r(points[0].x)},${r(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      d += `L${r(points[i].x)},${r(points[i].y)}`;
    }
    return d;
  }

  // Catmull-Rom to cubic bezier conversion
  let d = `M${r(points[0].x)},${r(points[0].y)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = factor * 0.5;

    const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3;

    d += `C${r(cp1x)},${r(cp1y)} ${r(cp2x)},${r(cp2y)} ${r(p2.x)},${r(p2.y)}`;
  }

  return d;
}

/** Round to 2 decimal places */
function r(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ------------------------------------------------------------------ */
/*  SVG generation                                                     */
/* ------------------------------------------------------------------ */

function buildSvg(
  width: number,
  height: number,
  layers: Array<{ color: string; paths: string[] }>,
  strokeMode: boolean,
): string {
  const lines: string[] = [];
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
  );

  for (const layer of layers) {
    for (const d of layer.paths) {
      if (!d) continue;
      if (strokeMode) {
        lines.push(
          `<path d="${d}" fill="none" stroke="${layer.color}" stroke-width="1"/>`,
        );
      } else {
        lines.push(`<path d="${d}Z" fill="${layer.color}"/>`);
      }
    }
  }

  lines.push('</svg>');
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/*  Layer extraction helpers                                           */
/* ------------------------------------------------------------------ */

function extractColorLayers(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  palette: Array<[number, number, number]>,
  removeBackground: boolean,
): ColorLayer[] {
  const assignments = assignPixelsToColors(data, palette);
  const bgIdx = removeBackground
    ? detectBackgroundColorIndex(assignments, w, h, palette.length)
    : -1;

  const layers: ColorLayer[] = [];
  for (let c = 0; c < palette.length; c++) {
    if (c === bgIdx) continue;
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < assignments.length; i++) {
      mask[i] = assignments[i] === c ? 1 : 0;
    }
    layers.push({
      color: rgbToHex(palette[c][0], palette[c][1], palette[c][2]),
      mask,
    });
  }
  return layers;
}

function extractGrayscaleLayers(
  gray: Uint8Array,
  w: number,
  h: number,
  levels: number,
  removeBackground: boolean,
): ColorLayer[] {
  const step = 256 / levels;
  const layers: ColorLayer[] = [];

  // Quantize grayscale into N levels
  const quantized = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    quantized[i] = Math.min(levels - 1, Math.floor(gray[i] / step));
  }

  // Detect background level (most common on border)
  let bgLevel = -1;
  if (removeBackground) {
    const counts = new Uint32Array(levels);
    for (let x = 0; x < w; x++) {
      counts[quantized[x]]++;
      counts[quantized[(h - 1) * w + x]]++;
    }
    for (let y = 1; y < h - 1; y++) {
      counts[quantized[y * w]]++;
      counts[quantized[y * w + w - 1]]++;
    }
    let maxC = 0;
    for (let i = 0; i < levels; i++) {
      if (counts[i] > maxC) {
        maxC = counts[i];
        bgLevel = i;
      }
    }
  }

  for (let lv = 0; lv < levels; lv++) {
    if (lv === bgLevel) continue;
    const grayVal = Math.round((lv + 0.5) * step);
    const hex = rgbToHex(grayVal, grayVal, grayVal);
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < quantized.length; i++) {
      mask[i] = quantized[i] === lv ? 1 : 0;
    }
    layers.push({ color: hex, mask });
  }

  return layers;
}

/* ------------------------------------------------------------------ */
/*  Main vectorization pipeline                                        */
/* ------------------------------------------------------------------ */

export async function vectorizeImage(
  imageData: ImageData,
  options: VectorizeOptions,
  onProgress?: (pct: number) => void,
): Promise<VectorizeResult> {
  const { width, height, data } = imageData;
  const w = width;
  const h = height;

  const report = (pct: number) => {
    if (onProgress) onProgress(Math.min(100, Math.max(0, Math.round(pct))));
  };

  report(0);

  // Step 1: Build color layers depending on mode
  let layers: ColorLayer[] = [];

  if (options.mode === 'monochrome') {
    const gray = toGrayscaleData(data);
    const mask = applyThreshold(gray, options.threshold, options.invert);
    const color = options.invert ? '#ffffff' : '#000000';
    layers = [{ color, mask }];
  } else if (options.mode === 'lineart') {
    const gray = toGrayscaleData(data);
    const smoothed = blur3x3(gray, w, h);
    const edges = sobelEdgeDetect(smoothed, w, h);
    const mask = applyThreshold(edges, options.threshold, options.invert);
    const color = options.invert ? '#ffffff' : '#000000';
    layers = [{ color, mask }];
  } else if (options.mode === 'grayscale') {
    const gray = toGrayscaleData(data);
    layers = extractGrayscaleLayers(gray, w, h, options.colorCount, options.removeBackground);
  } else {
    // color mode
    const palette = medianCut(data, options.colorCount);
    layers = extractColorLayers(data, w, h, palette, options.removeBackground);
  }

  report(20);
  await yieldToMain();

  // Step 2: Trace contours for each layer
  const svgLayers: Array<{ color: string; paths: string[] }> = [];
  const totalLayers = layers.length;
  const allColors: string[] = [];

  for (let li = 0; li < totalLayers; li++) {
    const layer = layers[li];
    allColors.push(layer.color);

    const contours = marchingSquaresContours(layer.mask, w, h, options.minShapeSize);

    const paths: string[] = [];
    for (const contour of contours) {
      // Simplify
      const simplified =
        options.simplifyTolerance > 0
          ? douglasPeucker(contour.points, options.simplifyTolerance)
          : contour.points;

      if (simplified.length < 3) continue;

      // Smooth and generate path data
      const pathD = smoothPath(simplified, options.smoothing);
      if (pathD) paths.push(pathD);
    }

    svgLayers.push({ color: layer.color, paths });

    const layerProgress = 20 + ((li + 1) / totalLayers) * 70;
    report(layerProgress);

    // Yield periodically so the UI stays responsive
    if (li % 2 === 0) {
      await yieldToMain();
    }
  }

  report(95);

  // Step 3: Build SVG
  const svgString = buildSvg(w, h, svgLayers, options.strokeMode);

  let pathCount = 0;
  for (const layer of svgLayers) {
    pathCount += layer.paths.length;
  }

  report(100);

  return {
    svgString,
    pathCount,
    colors: allColors,
    width: w,
    height: h,
  };
}

/* ------------------------------------------------------------------ */
/*  Helper: Load ImageData from canvas for a File                      */
/* ------------------------------------------------------------------ */

export async function fileToImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
