import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { dataUrlToBytes } from '../dataUrl';
import { canvasToBlob, openPdfDocument, renderPdfPageToCanvas } from './rendering';
import type { AnnotationItem, RedactionItem } from './types';

export interface OrganizerPageState {
  pageNumber: number;
  rotation: number;
}

export interface PdfToImagesOptions {
  format: 'png' | 'jpg' | 'webp';
  scale: number;
  quality: number;
}

export const exportOrganizedPdf = async (file: File, pages: OrganizerPageState[]): Promise<Uint8Array> => {
  const srcPdf = await PDFDocument.load(await file.arrayBuffer());
  const outPdf = await PDFDocument.create();
  const copiedPages = await outPdf.copyPages(
    srcPdf,
    pages.map((page) => page.pageNumber - 1),
  );

  copiedPages.forEach((copiedPage, index) => {
    const target = pages[index];
    copiedPage.setRotation(degrees(((target.rotation % 360) + 360) % 360));
    outPdf.addPage(copiedPage);
  });

  return outPdf.save();
};

export const exportPdfPagesAsImages = async (
  file: File,
  options: PdfToImagesOptions,
): Promise<{ pageNumber: number; filename: string; blob: Blob; previewUrl: string }[]> => {
  const { pdf } = await openPdfDocument(file);
  const items: { pageNumber: number; filename: string; blob: Blob; previewUrl: string }[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const canvas = await renderPdfPageToCanvas(pdf, pageNumber, options.scale);
    const mimeType = options.format === 'png' ? 'image/png' : options.format === 'webp' ? 'image/webp' : 'image/jpeg';
    const blob = await canvasToBlob(canvas, mimeType, options.quality);
    items.push({
      pageNumber,
      filename: `${file.name.replace(/\.pdf$/i, '')}_page_${pageNumber}.${options.format}`,
      blob,
      previewUrl: URL.createObjectURL(blob),
    });
  }

  return items;
};

export const unlockPdfByRasterizing = async (
  file: File,
  password: string,
  onProgress?: (message: string) => void,
): Promise<Uint8Array> => {
  const { pdf } = await openPdfDocument(file, { password });
  const outPdf = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress?.(`Rendering page ${pageNumber}/${pdf.numPages}`);
    const canvas = await renderPdfPageToCanvas(pdf, pageNumber, 2);
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    const imageBytes = await blob.arrayBuffer();
    const image = await outPdf.embedJpg(imageBytes);
    const page = outPdf.addPage([canvas.width, canvas.height]);
    page.drawImage(image, { x: 0, y: 0, width: canvas.width, height: canvas.height });
  }

  return outPdf.save();
};

const pdfColor = (hex: string, alpha = 1) => {
  const safe = hex.replace('#', '');
  const value = Number.parseInt(safe.length === 3 ? safe.split('').map((part) => `${part}${part}`).join('') : safe, 16);
  return {
    color: rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255),
    opacity: alpha,
  };
};

// Redacted pages are rendered to images with the boxes painted in, so the text,
// vector content and annotations under each box are destroyed rather than
// covered. Output is a fresh document: pdf-lib saves every object in a loaded
// file, even unreferenced ones, so replacing pages in the original would leave
// the hidden content in the bytes. Unredacted pages are copied unchanged.
const REDACTION_RENDER_SCALE = 2;

export const applyRedactionsToPdf = async (
  file: File,
  items: RedactionItem[],
  onProgress?: (message: string) => void,
): Promise<Uint8Array> => {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const { pdf: renderDoc } = await openPdfDocument(file);
  const output = await PDFDocument.create();
  const pageCount = source.getPageCount();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const pageItems = items.filter((item) => item.pageNumber === pageNumber);

    if (pageItems.length === 0) {
      const [copied] = await output.copyPages(source, [pageNumber - 1]);
      output.addPage(copied);
      continue;
    }

    onProgress?.(`Redacting page ${pageNumber}/${pageCount}...`);
    // Rects are relative to the displayed (rotated) preview, which is exactly
    // the space pdf.js renders into, so rotated pages need no extra mapping.
    const canvas = await renderPdfPageToCanvas(renderDoc, pageNumber, REDACTION_RENDER_SCALE);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');
    for (const item of pageItems) {
      context.fillStyle = item.color || '#000000';
      context.fillRect(
        Math.floor(item.rect.x * canvas.width),
        Math.floor(item.rect.y * canvas.height),
        Math.ceil(item.rect.width * canvas.width) + 1,
        Math.ceil(item.rect.height * canvas.height) + 1,
      );
    }

    const pngBytes = await (await canvasToBlob(canvas, 'image/png')).arrayBuffer();
    const image = await output.embedPng(pngBytes);
    const { width, height } = (await renderDoc.getPage(pageNumber)).getViewport({ scale: 1 });
    const page = output.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }

  return output.save();
};

export const applyAnnotationsToPdf = async (file: File, items: AnnotationItem[]): Promise<Uint8Array> => {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const item of items) {
    const page = pdf.getPage(item.pageNumber - 1);
    if (!page) continue;

    const x = item.rect.x * page.getWidth();
    const top = item.rect.y * page.getHeight();
    const width = item.rect.width * page.getWidth();
    const height = item.rect.height * page.getHeight();
    const y = page.getHeight() - top - height;

    if (item.kind === 'highlight') {
      page.drawRectangle({
        x,
        y,
        width,
        height,
        ...pdfColor(item.color || '#facc15', 0.3),
        borderWidth: 0,
      });
      continue;
    }

    if (item.kind === 'checkmark') {
      page.drawText('✓', {
        x,
        y,
        size: item.fontSize ?? 24,
        font: boldFont,
        color: rgb(0.09, 0.51, 0.24),
      });
      continue;
    }

    if (item.kind === 'signature-image' && item.imageDataUrl) {
      const imageBytes = await dataUrlToBytes(item.imageDataUrl);
      const image = item.imageDataUrl.startsWith('data:image/png') ? await pdf.embedPng(imageBytes) : await pdf.embedJpg(imageBytes);
      page.drawImage(image, {
        x,
        y,
        width,
        height,
      });
      continue;
    }

    page.drawText(item.value, {
      x,
      y,
      size: item.fontSize ?? 18,
      font: item.kind === 'signature-text' ? boldFont : font,
      color: pdfColor(item.color || '#111827').color,
      maxWidth: width,
      lineHeight: Math.max(18, (item.fontSize ?? 18) * 1.2),
    });
  }

  return pdf.save();
};
