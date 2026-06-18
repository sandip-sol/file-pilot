import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ExtractedDocumentResult } from './types';

export const buildCombinedText = (entries: ExtractedDocumentResult[]) =>
  entries
    .map((entry) => `=== ${entry.fileName} ===\n${entry.text || '[No text detected]'}`)
    .join('\n\n');

export const buildPerPageTextEntries = (entries: ExtractedDocumentResult[]) =>
  entries.flatMap((entry) =>
    entry.pages.map((page) => ({
      filename: `${entry.fileName.replace(/\.[^.]+$/, '')}_page_${page.pageNumber}.txt`,
      text: page.text || '[No text detected]',
    })),
  );

export const exportSearchablePdfFromOcr = async (entry: ExtractedDocumentResult): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (const pageResult of entry.pages) {
    if (!pageResult.previewUrl) continue;

    const imageBytes = await fetch(pageResult.previewUrl).then((response) => response.arrayBuffer());
    const image = pageResult.previewUrl.startsWith('data:image/png')
      ? await pdf.embedPng(imageBytes)
      : await pdf.embedJpg(imageBytes);

    const page = pdf.addPage([pageResult.width, pageResult.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: pageResult.width,
      height: pageResult.height,
    });

    pageResult.words.forEach((word) => {
      const width = Math.max(word.bbox.x1 - word.bbox.x0, 6);
      const height = Math.max(word.bbox.y1 - word.bbox.y0, 6);
      page.drawText(word.text, {
        x: word.bbox.x0,
        y: pageResult.height - word.bbox.y1,
        size: Math.max(6, height),
        font,
        color: rgb(0, 0, 0),
        opacity: 0.01,
        maxWidth: width + 6,
      });
    });
  }

  return pdf.save();
};
