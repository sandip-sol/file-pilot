export interface PdfPagePreview {
  pageNumber: number;
  width: number;
  height: number;
  imageUrl: string;
}

export interface PdfPageTransform {
  pageNumber: number;
  rotation: number;
}

export interface PageSelectionRange {
  all: boolean;
  pageNumbers: number[];
}

export type WatermarkKind = 'text' | 'image';
export type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';

export interface WatermarkConfig {
  kind: WatermarkKind;
  text: string;
  imageDataUrl: string | null;
  opacity: number;
  fontSize: number;
  color: string;
  rotation: number;
  position: WatermarkPosition;
  scale: number;
  applyToAllPages: boolean;
  selectedPages: number[];
}

export interface OverlayRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RedactionItem {
  id: string;
  pageNumber: number;
  rect: OverlayRect;
  color: string;
}

export type AnnotationKind = 'text' | 'highlight' | 'checkmark' | 'date' | 'signature-text' | 'signature-image';

export interface AnnotationItem {
  id: string;
  kind: AnnotationKind;
  pageNumber: number;
  rect: OverlayRect;
  value: string;
  color: string;
  fontSize?: number;
  imageDataUrl?: string;
}

export interface OcrWordBox {
  id: string;
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OcrLineBox {
  id: string;
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  words: OcrWordBox[];
}

export interface OcrBlockBox {
  id: string;
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  lines: OcrLineBox[];
}

export interface OcrPageResult {
  pageNumber: number;
  width: number;
  height: number;
  text: string;
  averageConfidence: number;
  blocks: OcrBlockBox[];
  lines: OcrLineBox[];
  words: OcrWordBox[];
  previewUrl?: string;
}

export interface ExtractedDocumentResult {
  fileName: string;
  text: string;
  pages: OcrPageResult[];
  sourceType: 'pdf' | 'image';
}

export interface DiffToken {
  value: string;
  type: 'equal' | 'added' | 'removed';
}

export interface PdfComparePageResult {
  pageNumber: number;
  leftText: string;
  rightText: string;
  changed: boolean;
  additions: number;
  removals: number;
  diffTokens: DiffToken[];
}

export interface PdfCompareResult {
  leftPageCount: number;
  rightPageCount: number;
  changedPages: number[];
  pages: PdfComparePageResult[];
}
