export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

export interface ImageFileInfo {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  width: number;
  height: number;
  mimeType: string;
  hasTransparency: boolean;
  previewUrl: string;
}

export interface ProcessedImageResult {
  id: string;
  blob: Blob;
  filename: string;
  originalSize: number;
  outputSize: number;
  width: number;
  height: number;
  format: ImageFormat;
  quality: number | null;
  previewUrl: string;
}

export interface ResizePreset {
  label: string;
  width: number;
  height: number;
  category: string;
}

export interface WebOptimizePreset {
  id: string;
  label: string;
  description: string;
  displayWidth: number;
  dpr: number;
  qualityTarget: 'high' | 'balanced' | 'lightweight';
  responsiveWidths: number[];
}

export interface AnalysisResult {
  filename: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileSizeFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  megapixels: string;
  hasTransparency: boolean;
  estimatedDPI: string;
  colorDepth: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  category: 'quality' | 'dimensions' | 'file-weight' | 'format' | 'privacy';
  severity: 'info' | 'warning' | 'success';
  title: string;
  message: string;
}

export interface ResponsiveVariant {
  width: number;
  height: number;
  format: ImageFormat;
  filename: string;
  blob: Blob;
  outputSize: number;
  quality: number;
}
