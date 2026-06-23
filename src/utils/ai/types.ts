export type AiProcessingStatus =
  | 'idle'
  | 'loading-model'
  | 'processing'
  | 'complete'
  | 'error'
  | 'unsupported';

export interface AiProgress {
  stage: string;
  progress: number;
  message?: string;
}

export interface AiToolResult {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
  processingTimeMs?: number;
  warnings?: string[];
}

export interface AiCapabilities {
  webAssembly: boolean;
  webGPU: boolean;
  offscreenCanvas: boolean;
  sharedArrayBuffer: boolean;
  hardwareConcurrency: number;
  deviceMemoryGB: number | null;
  suitable: boolean;
  reason?: string;
}

export const MAX_INPUT_PIXELS = 25_000_000;
export const MAX_UPSCALE_INPUT_PIXELS = 4_000_000;
export const MAX_INPAINT_PIXELS = 4_000_000;
export const WARN_LARGE_IMAGE_PIXELS = 8_000_000;
