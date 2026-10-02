import * as ort from 'onnxruntime-web';
import type { AiProgress } from './types';
import { MAX_UPSCALE_INPUT_PIXELS } from './types';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';

// Self-hosted Real-ESRGAN general x4v3 (BSD-3-Clause, xinntao/Real-ESRGAN).
// A third-party model URL went dead before, so it ships with the site.
// 2x output is produced by drawing each 4x tile at half size.
const MODEL_URL = '/models/realesr-general-x4v3.onnx';
const MODEL_SCALE = 4;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

const TILE_SIZE = 192;
const TILE_PAD = 16;

function loadModel(onProgress: (p: AiProgress) => void): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = downloadModel(onProgress).catch((err) => {
      sessionPromise = null;
      throw err;
    });
  }
  return sessionPromise;
}

async function downloadModel(onProgress: (p: AiProgress) => void): Promise<ort.InferenceSession> {
  onProgress({ stage: 'loading-model', progress: 10, message: 'Downloading super-resolution model...' });

  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error(`Failed to download model: ${response.statusText}. The AI upscaling model could not be loaded. Please try again later.`);

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total > 0) {
        const pct = Math.round((received / total) * 80) + 10;
        onProgress({ stage: 'loading-model', progress: pct, message: `Downloading model... ${(received / 1024 / 1024).toFixed(1)} MB` });
      }
    }
  }

  const modelData = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    modelData.set(chunk, offset);
    offset += chunk.length;
  }

  onProgress({ stage: 'loading-model', progress: 95, message: 'Initializing model...' });
  const session = await ort.InferenceSession.create(modelData.buffer, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });

  return session;
}

function imageDataToTensor(imageData: ImageData): ort.Tensor {
  const { width, height, data } = imageData;
  const float32 = new Float32Array(3 * width * height);
  for (let i = 0; i < width * height; i++) {
    float32[i] = data[i * 4] / 255;
    float32[width * height + i] = data[i * 4 + 1] / 255;
    float32[2 * width * height + i] = data[i * 4 + 2] / 255;
  }
  return new ort.Tensor('float32', float32, [1, 3, height, width]);
}

function tensorToImageData(tensor: ort.Tensor, width: number, height: number): ImageData {
  const data = tensor.data as Float32Array;
  const imageData = new ImageData(width, height);
  const pixels = imageData.data;
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = Math.round(Math.max(0, Math.min(1, data[i])) * 255);
    pixels[i * 4 + 1] = Math.round(Math.max(0, Math.min(1, data[width * height + i])) * 255);
    pixels[i * 4 + 2] = Math.round(Math.max(0, Math.min(1, data[2 * width * height + i])) * 255);
    pixels[i * 4 + 3] = 255;
  }
  return imageData;
}

export async function upscaleImage(
  imageFile: File | Blob,
  scale: 2 | 4,
  onProgress: (p: AiProgress) => void,
): Promise<{ canvas: HTMLCanvasElement; warnings: string[] }> {
  const warnings: string[] = [];
  const bitmap = await createImageBitmap(imageFile);
  const { width, height } = bitmap;
  const pixels = width * height;

  if (pixels > MAX_UPSCALE_INPUT_PIXELS) {
    bitmap.close();
    throw new Error(`Image is too large (${(pixels / 1e6).toFixed(1)} MP). Maximum input size for upscaling is ${(MAX_UPSCALE_INPUT_PIXELS / 1e6).toFixed(1)} MP.`);
  }

  if (scale === 4 && pixels > 1_000_000) {
    warnings.push('4x upscaling on large images uses significant memory and may be slow.');
  }

  const outputW = width * scale;
  const outputH = height * scale;
  const estimatedMB = (outputW * outputH * 4) / (1024 * 1024);
  if (estimatedMB > 200) {
    warnings.push(`Output image will be approximately ${estimatedMB.toFixed(0)} MB in memory.`);
  }

  let session: ort.InferenceSession;
  try {
    session = await loadModel(onProgress);
  } catch (err) {
    bitmap.close();
    throw new Error(
      `Could not load the AI super-resolution model. ${err instanceof Error ? err.message : 'Please check your connection and try again.'}`
    );
  }

  onProgress({ stage: 'processing', progress: 0, message: 'Preparing image tiles...' });

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputW;
  outputCanvas.height = outputH;
  const outCtx = outputCanvas.getContext('2d')!;
  outCtx.imageSmoothingQuality = 'high';

  const tilesX = Math.ceil(width / TILE_SIZE);
  const tilesY = Math.ceil(height / TILE_SIZE);
  const totalTiles = tilesX * tilesY;
  let processed = 0;

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const srcX = Math.max(0, tx * TILE_SIZE - TILE_PAD);
      const srcY = Math.max(0, ty * TILE_SIZE - TILE_PAD);
      const srcRight = Math.min(width, (tx + 1) * TILE_SIZE + TILE_PAD);
      const srcBottom = Math.min(height, (ty + 1) * TILE_SIZE + TILE_PAD);
      const tileW = srcRight - srcX;
      const tileH = srcBottom - srcY;

      const tileData = srcCtx.getImageData(srcX, srcY, tileW, tileH);
      const inputTensor = imageDataToTensor(tileData);

      const feeds: Record<string, ort.Tensor> = {};
      const inputName = session.inputNames[0];
      feeds[inputName] = inputTensor;

      const results = await session.run(feeds);
      const outputTensor = results[session.outputNames[0]];
      const outTileW = tileW * MODEL_SCALE;
      const outTileH = tileH * MODEL_SCALE;
      const outData = tensorToImageData(outputTensor, outTileW, outTileH);

      // Region of this tile in the final output, excluding the overlap padding.
      const destX = tx * TILE_SIZE * scale;
      const destY = ty * TILE_SIZE * scale;
      const copyW = Math.min(TILE_SIZE * scale, outputW - destX);
      const copyH = Math.min(TILE_SIZE * scale, outputH - destY);
      const ratio = MODEL_SCALE / scale;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = outTileW;
      tempCanvas.height = outTileH;
      tempCanvas.getContext('2d')!.putImageData(outData, 0, 0);

      outCtx.drawImage(
        tempCanvas,
        (tx * TILE_SIZE - srcX) * MODEL_SCALE, (ty * TILE_SIZE - srcY) * MODEL_SCALE, copyW * ratio, copyH * ratio,
        destX, destY, copyW, copyH,
      );

      processed++;
      onProgress({
        stage: 'processing',
        progress: Math.round((processed / totalTiles) * 100),
        message: `Upscaling tile ${processed}/${totalTiles}...`,
      });
    }
  }

  onProgress({ stage: 'complete', progress: 100, message: 'Upscaling complete' });
  return { canvas: outputCanvas, warnings };
}

export function isUpscaleModelAvailable(): boolean {
  return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
}
