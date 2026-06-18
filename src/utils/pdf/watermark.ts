import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import type { WatermarkConfig } from './types';

const hexToRgb = (value: string) => {
  const normalized = value.replace('#', '');
  const safe = normalized.length === 3 ? normalized.split('').map((char) => `${char}${char}`).join('') : normalized;
  const parsed = Number.parseInt(safe, 16);

  return rgb(
    ((parsed >> 16) & 255) / 255,
    ((parsed >> 8) & 255) / 255,
    (parsed & 255) / 255,
  );
};

const shouldApplyWatermark = (pageNumber: number, config: WatermarkConfig) =>
  config.applyToAllPages || config.selectedPages.includes(pageNumber);

const PAGE_PADDING = 16;

const rotateOffset = (width: number, height: number, rotation: number) => {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: (width / 2) * cos - (height / 2) * sin,
    y: (width / 2) * sin + (height / 2) * cos,
  };
};

const getWatermarkCenter = (
  pageWidth: number,
  pageHeight: number,
  boxWidth: number,
  boxHeight: number,
  position: WatermarkConfig['position'],
) => {
  if (position === 'center') {
    return {
      x: pageWidth / 2,
      y: pageHeight / 2,
    };
  }

  if (position === 'top-left') {
    return {
      x: PAGE_PADDING + boxWidth / 2,
      y: pageHeight - PAGE_PADDING - boxHeight / 2,
    };
  }

  if (position === 'top-right') {
    return {
      x: pageWidth - PAGE_PADDING - boxWidth / 2,
      y: pageHeight - PAGE_PADDING - boxHeight / 2,
    };
  }

  if (position === 'bottom-left') {
    return {
      x: PAGE_PADDING + boxWidth / 2,
      y: PAGE_PADDING + boxHeight / 2,
    };
  }

  return {
    x: pageWidth - PAGE_PADDING - boxWidth / 2,
    y: PAGE_PADDING + boxHeight / 2,
  };
};

const drawTiledText = (
  page: import('pdf-lib').PDFPage,
  text: string,
  config: WatermarkConfig,
  width: number,
  height: number,
) => {
  const stepX = Math.max(config.fontSize * 4, 160);
  const stepY = Math.max(config.fontSize * 3, 140);

  for (let x = -width; x < width * 1.5; x += stepX) {
    for (let y = -height; y < height * 1.5; y += stepY) {
      page.drawText(text, {
        x,
        y,
        size: config.fontSize,
        color: hexToRgb(config.color),
        opacity: config.opacity,
        rotate: degrees(config.rotation),
      });
    }
  }
};

export const applyWatermarkToPdf = async (file: File, config: WatermarkConfig): Promise<Uint8Array> => {
  const inputBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(inputBytes);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const imageBytes = config.imageDataUrl
    ? await fetch(config.imageDataUrl).then((response) => response.arrayBuffer())
    : null;
  const embeddedImage = imageBytes
    ? config.imageDataUrl?.startsWith('data:image/png')
      ? await pdf.embedPng(imageBytes)
      : await pdf.embedJpg(imageBytes)
    : null;

  pdf.getPages().forEach((page, pageIndex) => {
    const pageNumber = pageIndex + 1;
    if (!shouldApplyWatermark(pageNumber, config)) return;

    const width = page.getWidth();
    const height = page.getHeight();

    if (config.position === 'tiled') {
      if (config.kind === 'text' && config.text.trim()) {
        drawTiledText(page, config.text.trim(), config, width, height);
      } else if (embeddedImage) {
        const imgWidth = embeddedImage.width * config.scale;
        const imgHeight = embeddedImage.height * config.scale;
        for (let x = -imgWidth; x < width * 1.4; x += imgWidth + 80) {
          for (let y = -imgHeight; y < height * 1.4; y += imgHeight + 80) {
            page.drawImage(embeddedImage, {
              x,
              y,
              width: imgWidth,
              height: imgHeight,
              opacity: config.opacity,
              rotate: degrees(config.rotation),
            });
          }
        }
      }
      return;
    }

    if (config.kind === 'text' && config.text.trim()) {
      const text = config.text.trim();
      const textWidth = font.widthOfTextAtSize(text, config.fontSize);
      const textHeight = font.heightAtSize(config.fontSize);
      const center = getWatermarkCenter(width, height, textWidth, textHeight, config.position);
      const offset = rotateOffset(textWidth, textHeight, config.rotation);

      page.drawText(config.text.trim(), {
        x: center.x - offset.x,
        y: center.y - offset.y,
        size: config.fontSize,
        color: hexToRgb(config.color),
        opacity: config.opacity,
        rotate: degrees(config.rotation),
        font,
      });
      return;
    }

    if (embeddedImage) {
      const imgWidth = embeddedImage.width * config.scale;
      const imgHeight = embeddedImage.height * config.scale;
      const center = getWatermarkCenter(width, height, imgWidth, imgHeight, config.position);
      const offset = rotateOffset(imgWidth, imgHeight, config.rotation);

      page.drawImage(embeddedImage, {
        x: center.x - offset.x,
        y: center.y - offset.y,
        width: imgWidth,
        height: imgHeight,
        opacity: config.opacity,
        rotate: degrees(config.rotation),
      });
    }
  });

  return pdf.save();
};
