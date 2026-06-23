// Telea inpainting algorithm — fast marching method for content-aware fill.
// Based on: "An Image Inpainting Technique Based on the Fast Marching Method" (A. Telea, 2004)

const KNOWN = 0;
const BAND = 1;
const UNKNOWN = 2;

interface HeapNode {
  x: number;
  y: number;
  dist: number;
}

class MinHeap {
  private data: HeapNode[] = [];

  get size(): number { return this.data.length; }

  push(node: HeapNode): void {
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].dist < this.data[parent].dist) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left].dist < this.data[smallest].dist) smallest = left;
      if (right < n && this.data[right].dist < this.data[smallest].dist) smallest = right;
      if (smallest !== i) {
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      } else break;
    }
  }
}

export function inpaintTelea(
  imageData: ImageData,
  maskData: Uint8Array,
  radius: number = 5,
  onProgress?: (pct: number) => void,
): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);
  const flags = new Uint8Array(width * height);
  const dist = new Float32Array(width * height);
  const heap = new MinHeap();

  dist.fill(1e20);

  let totalUnknown = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (maskData[idx] > 128) {
        flags[idx] = UNKNOWN;
        totalUnknown++;
      } else {
        flags[idx] = KNOWN;
        dist[idx] = 0;
      }
    }
  }

  const dx4 = [-1, 0, 1, 0];
  const dy4 = [0, -1, 0, 1];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (flags[idx] !== KNOWN) continue;

      for (let d = 0; d < 4; d++) {
        const nx = x + dx4[d];
        const ny = y + dy4[d];
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const ni = ny * width + nx;
        if (flags[ni] === UNKNOWN) {
          flags[ni] = BAND;
          dist[ni] = 1;
          heap.push({ x: nx, y: ny, dist: 1 });
        }
      }
    }
  }

  let processed = 0;
  const reportInterval = Math.max(1, Math.floor(totalUnknown / 50));

  while (heap.size > 0) {
    const node = heap.pop()!;
    const { x, y } = node;
    const idx = y * width + x;

    if (flags[idx] === KNOWN) continue;
    flags[idx] = KNOWN;

    const pi = idx * 4;
    let rSum = 0, gSum = 0, bSum = 0, wSum = 0;

    const r = Math.ceil(radius);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const ni = ny * width + nx;
        if (flags[ni] !== KNOWN || dist[ni] >= 1e19) continue;

        const d2 = dx * dx + dy * dy;
        if (d2 > radius * radius) continue;

        const geomWeight = 1 / (Math.sqrt(d2) + 1e-6);
        const distWeight = 1 / (1 + dist[ni]);
        const w = geomWeight * distWeight;

        const npi = ni * 4;
        rSum += w * output[npi];
        gSum += w * output[npi + 1];
        bSum += w * output[npi + 2];
        wSum += w;
      }
    }

    if (wSum > 0) {
      output[pi] = Math.round(Math.max(0, Math.min(255, rSum / wSum)));
      output[pi + 1] = Math.round(Math.max(0, Math.min(255, gSum / wSum)));
      output[pi + 2] = Math.round(Math.max(0, Math.min(255, bSum / wSum)));
      output[pi + 3] = 255;
    }

    for (let d = 0; d < 4; d++) {
      const nx = x + dx4[d];
      const ny = y + dy4[d];
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const ni = ny * width + nx;
      if (flags[ni] !== UNKNOWN) continue;

      const newDist = dist[idx] + 1;
      if (newDist < dist[ni]) {
        dist[ni] = newDist;
        flags[ni] = BAND;
        heap.push({ x: nx, y: ny, dist: newDist });
      }
    }

    processed++;
    if (onProgress && processed % reportInterval === 0) {
      onProgress(Math.min(99, Math.round((processed / totalUnknown) * 100)));
    }
  }

  if (onProgress) onProgress(100);
  return new ImageData(output, width, height);
}

export function createMaskFromPaths(
  width: number,
  height: number,
  paths: Array<{ points: Array<{ x: number; y: number }>; brushSize: number }>,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const path of paths) {
    ctx.lineWidth = path.brushSize;
    if (path.points.length === 1) {
      ctx.beginPath();
      ctx.arc(path.points[0].x, path.points[0].y, path.brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    }
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < width * height; i++) {
    mask[i] = imageData.data[i * 4];
  }
  return mask;
}

export const MAX_INPAINT_DIMENSION = 2048;
export const MAX_MASK_PERCENT = 50;
