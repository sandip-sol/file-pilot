/* ------------------------------------------------------------------ */
/*  Color-space types                                                  */
/* ------------------------------------------------------------------ */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSLA {
  h: number;
  s: number;
  l: number;
  a: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

/* ------------------------------------------------------------------ */
/*  Hex conversions                                                    */
/* ------------------------------------------------------------------ */

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function toHexByte(n: number): string {
  return clamp(Math.round(n), 0, 255)
    .toString(16)
    .padStart(2, '0');
}

/** RGB → #RRGGBB (uppercase) */
export function rgbToHex(rgb: RGB): string {
  return `#${toHexByte(rgb.r)}${toHexByte(rgb.g)}${toHexByte(rgb.b)}`.toUpperCase();
}

/** RGBA → #RRGGBBAA (uppercase) */
export function rgbaToHex8(rgba: RGBA): string {
  const alphaByte = clamp(Math.round(rgba.a * 255), 0, 255);
  return `#${toHexByte(rgba.r)}${toHexByte(rgba.g)}${toHexByte(rgba.b)}${alphaByte
    .toString(16)
    .padStart(2, '0')}`.toUpperCase();
}

/** Parse 3, 4, 6, or 8-digit hex → RGB.  Returns null on invalid input. */
export function hexToRgb(hex: string): RGB | null {
  const h = hex.replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  if (/^[0-9a-fA-F]{8}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

/** Parse 4, 6, or 8-digit hex → RGBA.  Returns null on invalid input. */
export function hexToRgba(hex: string): RGBA | null {
  const h = hex.replace(/^#/, '');
  if (/^[0-9a-fA-F]{4}$/.test(h)) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
      a: parseInt(h[3] + h[3], 16) / 255,
    };
  }
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
      a: 1,
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  if (/^[0-9a-fA-F]{8}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255,
    };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  RGB ↔ HSL                                                          */
/* ------------------------------------------------------------------ */

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6;
    } else {
      h = ((r - g) / d + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  };
}

/* ------------------------------------------------------------------ */
/*  RGB ↔ HSV                                                          */
/* ------------------------------------------------------------------ */

export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6;
    } else {
      h = ((r - g) / d + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r: number, g: number, b: number;

  switch (i % 6) {
    case 0:
      r = v; g = t; b = p;
      break;
    case 1:
      r = q; g = v; b = p;
      break;
    case 2:
      r = p; g = v; b = t;
      break;
    case 3:
      r = p; g = q; b = v;
      break;
    case 4:
      r = t; g = p; b = v;
      break;
    default:
      r = v; g = p; b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/* ------------------------------------------------------------------ */
/*  RGB ↔ CMYK (approximate screen conversion)                         */
/* ------------------------------------------------------------------ */

export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

export function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

/* ------------------------------------------------------------------ */
/*  WCAG contrast helpers                                              */
/* ------------------------------------------------------------------ */

/** Relative luminance per WCAG 2.x. */
export function getRelativeLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio (1 – 21). */
export function getContrastRatio(rgb1: RGB, rgb2: RGB): number {
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns true when foreground text on background meets WCAG AA 4.5 : 1. */
export function isReadableOn(foreground: RGB, background: RGB): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/* ------------------------------------------------------------------ */
/*  Generic colour-string parser                                       */
/* ------------------------------------------------------------------ */

/**
 * Parse any common CSS colour string into RGBA.
 *
 * Supported formats:
 * - `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`
 * - `rgb(R, G, B)` / `rgb(R G B)`
 * - `rgba(R, G, B, A)` / `rgba(R G B / A)`
 * - `hsl(H, S%, L%)` / `hsl(H S% L%)`
 * - `hsla(H, S%, L%, A)` / `hsla(H S% L% / A)`
 */
export function parseColorString(input: string): RGBA | null {
  const s = input.trim();

  // Hex
  if (s.startsWith('#')) {
    return hexToRgba(s);
  }

  // rgb() / rgba()
  const rgbMatch = s.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i,
  );
  if (rgbMatch) {
    return {
      r: clamp(Math.round(parseFloat(rgbMatch[1])), 0, 255),
      g: clamp(Math.round(parseFloat(rgbMatch[2])), 0, 255),
      b: clamp(Math.round(parseFloat(rgbMatch[3])), 0, 255),
      a: rgbMatch[4] !== undefined ? clamp(parseFloat(rgbMatch[4]), 0, 1) : 1,
    };
  }

  // hsl() / hsla()
  const hslMatch = s.match(
    /^hsla?\(\s*([\d.]+)[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?(?:[,\s/]+([\d.]+))?\s*\)$/i,
  );
  if (hslMatch) {
    const hsl: HSL = {
      h: parseFloat(hslMatch[1]) % 360,
      s: clamp(parseFloat(hslMatch[2]), 0, 100),
      l: clamp(parseFloat(hslMatch[3]), 0, 100),
    };
    const rgb = hslToRgb(hsl);
    return {
      ...rgb,
      a: hslMatch[4] !== undefined ? clamp(parseFloat(hslMatch[4]), 0, 1) : 1,
    };
  }

  return null;
}
