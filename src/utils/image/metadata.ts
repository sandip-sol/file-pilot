import type { ImageFormat } from './types';
import { canvasToBlob } from './canvas';

export interface ImageMetadataInfo {
  hasExif: boolean;
  hasGps: boolean;
  cameraMake: string | null;
  cameraModel: string | null;
  orientation: number | null;
  dateTime: string | null;
  software: string | null;
  colorProfile: string | null;
  warnings: string[];
}

const EXIF_MARKER = 0xffe1;
const GPS_IFD_TAG = 0x8825;
const MAKE_TAG = 0x010f;
const MODEL_TAG = 0x0110;
const ORIENTATION_TAG = 0x0112;
const DATETIME_TAG = 0x0132;
const SOFTWARE_TAG = 0x0131;

function readUint16(dv: DataView, offset: number, littleEndian: boolean): number {
  return dv.getUint16(offset, littleEndian);
}

function readUint32(dv: DataView, offset: number, littleEndian: boolean): number {
  return dv.getUint32(offset, littleEndian);
}

function readAsciiString(dv: DataView, offset: number, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const code = dv.getUint8(offset + i);
    if (code === 0) break;
    result += String.fromCharCode(code);
  }
  return result.trim();
}

function getStringValue(
  dv: DataView,
  tiffStart: number,
  valueOffset: number,
  count: number,
  le: boolean,
): string {
  if (count <= 4) {
    return readAsciiString(dv, valueOffset, count);
  }
  const strOffset = tiffStart + readUint32(dv, valueOffset, le);
  if (strOffset + count > dv.byteLength) return '';
  return readAsciiString(dv, strOffset, count);
}

function findExifSegment(
  dv: DataView,
): { start: number; length: number } | null {
  if (dv.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset < dv.byteLength - 4) {
    const marker = dv.getUint16(offset);
    const segLen = dv.getUint16(offset + 2);

    if (marker === EXIF_MARKER) {
      return { start: offset + 4, length: segLen - 2 };
    }

    if ((marker & 0xff00) !== 0xff00) break;
    offset += 2 + segLen;
  }
  return null;
}

function parseIFD(
  dv: DataView,
  tiffStart: number,
  ifdOffset: number,
  le: boolean,
  result: Partial<ImageMetadataInfo>,
): void {
  const entryCount = readUint16(dv, tiffStart + ifdOffset, le);
  if (entryCount > 500) return;

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > dv.byteLength) break;

    const tag = readUint16(dv, entryOffset, le);
    const type = readUint16(dv, entryOffset + 2, le);
    const count = readUint32(dv, entryOffset + 4, le);
    const valueOffset = entryOffset + 8;

    switch (tag) {
      case GPS_IFD_TAG:
        result.hasGps = true;
        break;
      case MAKE_TAG:
        if (type === 2) {
          result.cameraMake = getStringValue(dv, tiffStart, valueOffset, count, le);
        }
        break;
      case MODEL_TAG:
        if (type === 2) {
          result.cameraModel = getStringValue(dv, tiffStart, valueOffset, count, le);
        }
        break;
      case ORIENTATION_TAG:
        if (type === 3) {
          result.orientation = readUint16(dv, valueOffset, le);
        }
        break;
      case DATETIME_TAG:
        if (type === 2) {
          result.dateTime = getStringValue(dv, tiffStart, valueOffset, count, le);
        }
        break;
      case SOFTWARE_TAG:
        if (type === 2) {
          result.software = getStringValue(dv, tiffStart, valueOffset, count, le);
        }
        break;
    }
  }
}

export async function extractMetadata(file: File): Promise<ImageMetadataInfo> {
  const result: ImageMetadataInfo = {
    hasExif: false,
    hasGps: false,
    cameraMake: null,
    cameraModel: null,
    orientation: null,
    dateTime: null,
    software: null,
    colorProfile: null,
    warnings: [],
  };

  const supportedTypes = ['image/jpeg', 'image/tiff', 'image/webp'];
  const type = file.type.toLowerCase();

  if (!supportedTypes.some((t) => type.includes(t.split('/')[1]))) {
    if (type === 'image/png') {
      result.warnings.push('PNG files typically do not contain EXIF metadata.');
    } else {
      result.warnings.push(`Metadata inspection is limited for ${type || 'this format'}.`);
    }
    return result;
  }

  try {
    const buffer = await file.arrayBuffer();
    const dv = new DataView(buffer);
    const exifSeg = findExifSegment(dv);

    if (!exifSeg) {
      result.warnings.push('No EXIF segment found in this file.');
      return result;
    }

    result.hasExif = true;

    const tiffStart = exifSeg.start;
    if (tiffStart + 8 > dv.byteLength) return result;

    const exifHeader = readAsciiString(dv, tiffStart, 4);
    if (exifHeader !== 'Exif') return result;

    const tiffOffset = tiffStart + 6;
    if (tiffOffset + 8 > dv.byteLength) return result;

    const byteOrder = dv.getUint16(tiffOffset);
    const le = byteOrder === 0x4949;

    const magic = readUint16(dv, tiffOffset + 2, le);
    if (magic !== 0x002a) return result;

    const ifd0Offset = readUint32(dv, tiffOffset + 4, le);
    if (ifd0Offset < 8) return result;

    parseIFD(dv, tiffOffset, ifd0Offset, le, result);

    if (result.hasGps) {
      result.warnings.push('This file may include location information.');
    }
    if (result.cameraMake || result.cameraModel) {
      result.warnings.push('Camera/device information may be embedded in this image.');
    }
  } catch {
    result.warnings.push('Could not fully parse metadata from this file.');
  }

  return result;
}

export async function removeMetadataByReencoding(
  file: File,
  format: ImageFormat,
  quality: number,
  bgColor: string,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;

  if (format === 'image/jpeg') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(bitmap, 0, 0);
  const w = bitmap.width;
  const h = bitmap.height;
  bitmap.close();

  const blob = await canvasToBlob(
    canvas,
    format,
    format === 'image/png' ? undefined : quality,
  );

  return { blob, width: w, height: h };
}
