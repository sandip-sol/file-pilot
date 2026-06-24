/**
 * QR code generation and export helpers.
 * Uses qr-code-styling for high-quality, styled QR output.
 */

import type {
  Options as QRCodeStylingOptions,
  DotType,
  CornerSquareType,
  CornerDotType,
  ErrorCorrectionLevel,
} from 'qr-code-styling';

// ---------------------------------------------------------------------------
// Public option types
// ---------------------------------------------------------------------------

export interface QRDesignOptions {
  /** QR data string */
  data: string;
  /** Pixel width/height */
  size: number;
  /** Error correction level */
  errorCorrection: ErrorCorrectionLevel;
  /** Foreground (dot) colour */
  fgColor: string;
  /** Background colour — ignored when transparentBg is true */
  bgColor: string;
  /** Transparent background */
  transparentBg: boolean;
  /** Quiet-zone margin in px */
  margin: number;
  /** Dot style */
  dotStyle: DotType;
  /** Corner square style */
  cornerSquareStyle: CornerSquareType;
  /** Corner dot style */
  cornerDotStyle: CornerDotType;
  /** Optional center logo (data-URL or object-URL) */
  logoUrl: string;
  /** Logo size as fraction 0-1 (e.g. 0.25 = 25 %) */
  logoSizeFraction: number;
}

export const DEFAULT_QR_OPTIONS: QRDesignOptions = {
  data: '',
  size: 512,
  errorCorrection: 'M',
  fgColor: '#000000',
  bgColor: '#ffffff',
  transparentBg: false,
  margin: 10,
  dotStyle: 'square',
  cornerSquareStyle: 'square',
  cornerDotStyle: 'square',
  logoUrl: '',
  logoSizeFraction: 0.25,
};

// ---------------------------------------------------------------------------
// Internal: build library options
// ---------------------------------------------------------------------------

const buildLibraryOptions = (opts: QRDesignOptions): Partial<QRCodeStylingOptions> => {
  const base: Partial<QRCodeStylingOptions> = {
    width: opts.size,
    height: opts.size,
    data: opts.data,
    margin: opts.margin,
    qrOptions: {
      errorCorrectionLevel: opts.errorCorrection,
    },
    dotsOptions: {
      color: opts.fgColor,
      type: opts.dotStyle,
    },
    cornersSquareOptions: {
      color: opts.fgColor,
      type: opts.cornerSquareStyle,
    },
    cornersDotOptions: {
      color: opts.fgColor,
      type: opts.cornerDotStyle,
    },
  };

  if (opts.transparentBg) {
    base.backgroundOptions = { color: 'transparent' };
  } else {
    base.backgroundOptions = { color: opts.bgColor };
  }

  if (opts.logoUrl) {
    base.image = opts.logoUrl;
    base.imageOptions = {
      hideBackgroundDots: true,
      imageSize: opts.logoSizeFraction,
      margin: 4,
    };
  }

  return base;
};

// ---------------------------------------------------------------------------
// Lazy-load the QRCodeStyling class
// ---------------------------------------------------------------------------

let QRCodeStylingClass: typeof import('qr-code-styling').default | null = null;

const loadQRCodeStyling = async () => {
  if (!QRCodeStylingClass) {
    const mod = await import('qr-code-styling');
    QRCodeStylingClass = mod.default;
  }
  return QRCodeStylingClass;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Create a QRCodeStyling instance (canvas-based for raster export). */
export const generateQRCode = async (
  opts: QRDesignOptions,
  type: 'canvas' | 'svg' = 'canvas',
) => {
  const QRCodeStyling = await loadQRCodeStyling();
  const libOpts = buildLibraryOptions(opts);
  libOpts.type = type;
  return new QRCodeStyling(libOpts);
};

/** Export QR as PNG Blob. */
export const exportQRAsPNG = async (opts: QRDesignOptions, size?: number): Promise<Blob> => {
  const effectiveOpts = size ? { ...opts, size } : opts;
  const qr = await generateQRCode(effectiveOpts, 'canvas');
  const blob = await qr.getRawData('png');
  if (!blob || blob instanceof Buffer) throw new Error('PNG export failed');
  return blob as Blob;
};

/** Export QR as real vector SVG Blob. */
export const exportQRAsSVG = async (opts: QRDesignOptions): Promise<Blob> => {
  const qr = await generateQRCode(opts, 'svg');
  const raw = await qr.getRawData('svg');
  if (!raw) throw new Error('SVG export failed');
  // raw may be a Blob already or a Buffer in Node
  if (raw instanceof Blob) return raw;
  return new Blob([raw], { type: 'image/svg+xml' });
};

/** Export QR as JPEG Blob (requires solid background). */
export const exportQRAsJPEG = async (
  opts: QRDesignOptions,
  size?: number,
): Promise<Blob> => {
  // Force solid background for JPEG
  const effectiveOpts: QRDesignOptions = {
    ...opts,
    transparentBg: false,
    ...(size ? { size } : {}),
  };
  const qr = await generateQRCode(effectiveOpts, 'canvas');
  const blob = await qr.getRawData('jpeg');
  if (!blob || blob instanceof Buffer) throw new Error('JPEG export failed');
  return blob as Blob;
};

/** Copy QR code to clipboard as PNG. Returns true on success. */
export const copyQRToClipboard = async (
  opts: QRDesignOptions,
  size?: number,
): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.write) {
    return false;
  }
  try {
    const blob = await exportQRAsPNG(opts, size);
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
};

/** Check whether the Clipboard API write is available. */
export const canCopyToClipboard = (): boolean => {
  return typeof navigator !== 'undefined' && typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;
};
