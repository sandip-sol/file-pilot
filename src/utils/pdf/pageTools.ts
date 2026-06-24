import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
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

export const applyRedactionsToPdf = async (file: File, items: RedactionItem[]): Promise<Uint8Array> => {
  const pdf = await PDFDocument.load(await file.arrayBuffer());

  items.forEach((item) => {
    const page = pdf.getPage(item.pageNumber - 1);
    if (!page) return;
    const x = item.rect.x * page.getWidth();
    const y = item.rect.y * page.getHeight();
    const width = item.rect.width * page.getWidth();
    const height = item.rect.height * page.getHeight();
    page.drawRectangle({
      x,
      y: page.getHeight() - y - height,
      width,
      height,
      color: rgb(0, 0, 0),
      opacity: 1,
      borderWidth: 0,
    });
  });

  return pdf.save();
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
      const imageBytes = await fetch(item.imageDataUrl).then((response) => response.arrayBuffer());
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
