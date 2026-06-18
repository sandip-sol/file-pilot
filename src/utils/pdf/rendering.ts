import { GlobalWorkerOptions, PasswordResponses, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PdfPagePreview } from './types';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export interface OpenPdfOptions {
  password?: string;
}

export interface OpenPdfResult {
  pdf: PDFDocumentProxy;
  pageCount: number;
}

export class PdfPasswordError extends Error {
  readonly code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export const openPdfDocument = async (file: File, options: OpenPdfOptions = {}): Promise<OpenPdfResult> => {
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const pdf = await getDocument({
      data: bytes,
      password: options.password,
      useWorkerFetch: false,
      isEvalSupported: false,
    }).promise;

    return {
      pdf,
      pageCount: pdf.numPages,
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const code = Number((error as { code: unknown }).code);
      if (code === PasswordResponses.NEED_PASSWORD || code === PasswordResponses.INCORRECT_PASSWORD) {
        throw new PdfPasswordError(error.message, code);
      }
    }

    throw error;
  }
};

export const renderPdfPageToCanvas = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale = 1,
): Promise<HTMLCanvasElement> => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas context not available');
  }

  await page.render({ canvasContext: context, viewport, canvas }).promise;
  return canvas;
};

export const canvasToBlob = async (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to render preview'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });

export const renderPdfPagePreview = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale = 0.35,
): Promise<PdfPagePreview> => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas context not available');
  }

  await page.render({ canvasContext: context, viewport, canvas }).promise;
  const blob = await canvasToBlob(canvas, 'image/png');
  const imageUrl = URL.createObjectURL(blob);

  return {
    pageNumber,
    width: canvas.width,
    height: canvas.height,
    imageUrl,
  };
};

export const getPdfPageText = async (pdf: PDFDocumentProxy, pageNumber: number): Promise<string> => {
  const page = await pdf.getPage(pageNumber);
  const textContent = await page.getTextContent();
  return textContent.items
    .map((item) => {
      if (!('str' in item)) return '';
      return typeof item.str === 'string' ? item.str : '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const revokePdfPreviews = (previews: PdfPagePreview[]) => {
  previews.forEach((preview) => URL.revokeObjectURL(preview.imageUrl));
};
