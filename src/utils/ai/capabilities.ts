import type { AiCapabilities } from './types';

let cached: AiCapabilities | null = null;

export async function detectAiCapabilities(): Promise<AiCapabilities> {
  if (cached) return cached;

  const webAssembly = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';

  let webGPU = false;
  try {
    if ('gpu' in navigator) {
      const adapter = await (navigator as { gpu: { requestAdapter(): Promise<unknown> } }).gpu.requestAdapter();
      webGPU = adapter !== null;
    }
  } catch { /* not supported */ }

  const offscreenCanvas = typeof OffscreenCanvas === 'function';

  let sharedArrayBuffer = false;
  try {
    sharedArrayBuffer = typeof SharedArrayBuffer === 'function';
  } catch { /* restricted */ }

  const hardwareConcurrency = navigator.hardwareConcurrency ?? 2;

  let deviceMemoryGB: number | null = null;
  if ('deviceMemory' in navigator) {
    deviceMemoryGB = (navigator as { deviceMemory?: number }).deviceMemory ?? null;
  }

  const suitable = webAssembly && hardwareConcurrency >= 2;
  const reason = !webAssembly
    ? 'Your browser does not support WebAssembly, which is required for AI processing.'
    : hardwareConcurrency < 2
      ? 'Your device may have limited processing power for AI tasks.'
      : undefined;

  cached = { webAssembly, webGPU, offscreenCanvas, sharedArrayBuffer, hardwareConcurrency, deviceMemoryGB, suitable, reason };
  return cached;
}

export function estimateMemoryMB(width: number, height: number, channels: number, scale: number): number {
  return Math.ceil((width * height * channels * scale * 4) / (1024 * 1024));
}

export function checkImageSizeLimit(width: number, height: number, maxPixels: number): string | null {
  const pixels = width * height;
  if (pixels > maxPixels) {
    const maxMp = (maxPixels / 1_000_000).toFixed(1);
    const actualMp = (pixels / 1_000_000).toFixed(1);
    return `Image is too large (${actualMp} MP). Maximum supported size is ${maxMp} MP. Please use a smaller image.`;
  }
  return null;
}
