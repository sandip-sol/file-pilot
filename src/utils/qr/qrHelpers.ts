/** QR content types and formatting helpers */

export type QRContentType =
  | 'url'
  | 'text'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'event'
  | 'custom';

export interface URLContent {
  url: string;
}

export interface TextContent {
  text: string;
}

export interface EmailContent {
  recipient: string;
  subject: string;
  message: string;
}

export interface PhoneContent {
  phone: string;
}

export interface SMSContent {
  phone: string;
  message: string;
}

export interface WiFiContent {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardContent {
  name: string;
  organisation: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

export interface EventContent {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface CustomContent {
  raw: string;
}

// ---------------------------------------------------------------------------
// Content formatters
// ---------------------------------------------------------------------------

/** Validate and format a URL. Returns the URL string or throws. */
export const formatURL = (content: URLContent): string => {
  const raw = content.url.trim();
  if (!raw) return '';
  // Add https:// if no protocol
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    new URL(withProtocol);
    return withProtocol;
  } catch {
    return raw; // return as-is, validation shows warning separately
  }
};

export const isValidURL = (url: string): boolean => {
  if (!url.trim()) return true; // empty is "valid" (just no content yet)
  const withProtocol = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
  try {
    new URL(withProtocol);
    return true;
  } catch {
    return false;
  }
};

export const formatText = (content: TextContent): string => {
  return content.text;
};

export const formatEmail = (content: EmailContent): string => {
  const parts: string[] = [];
  if (content.subject) parts.push(`subject=${encodeURIComponent(content.subject)}`);
  if (content.message) parts.push(`body=${encodeURIComponent(content.message)}`);
  const query = parts.length > 0 ? `?${parts.join('&')}` : '';
  return `mailto:${content.recipient}${query}`;
};

export const formatPhone = (content: PhoneContent): string => {
  return `tel:${content.phone}`;
};

export const formatSMS = (content: SMSContent): string => {
  const body = content.message ? `:${content.message}` : '';
  return `smsto:${content.phone}${body}`;
};

/** Escape special chars for WiFi QR string */
const escapeWiFi = (str: string): string =>
  str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/"/g, '\\"');

export const formatWiFi = (content: WiFiContent): string => {
  const hidden = content.hidden ? 'true' : 'false';
  return `WIFI:T:${content.encryption};S:${escapeWiFi(content.ssid)};P:${escapeWiFi(content.password)};H:${hidden};;`;
};

export const formatVCard = (content: VCardContent): string => {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
  ];
  if (content.name) lines.push(`FN:${content.name}`);
  if (content.organisation) lines.push(`ORG:${content.organisation}`);
  if (content.phone) lines.push(`TEL:${content.phone}`);
  if (content.email) lines.push(`EMAIL:${content.email}`);
  if (content.website) lines.push(`URL:${content.website}`);
  if (content.address) lines.push(`ADR:;;${content.address};;;;`);
  lines.push('END:VCARD');
  return lines.join('\n');
};

/** Format dates as YYYYMMDDTHHMMSS (local, basic ISO) */
const toCalDate = (isoString: string): string => {
  if (!isoString) return '';
  return isoString.replace(/[-:]/g, '').replace(/\.\d+/, '');
};

export const formatEvent = (content: EventContent): string => {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
  ];
  if (content.title) lines.push(`SUMMARY:${content.title}`);
  if (content.location) lines.push(`LOCATION:${content.location}`);
  if (content.startDate) lines.push(`DTSTART:${toCalDate(content.startDate)}`);
  if (content.endDate) lines.push(`DTEND:${toCalDate(content.endDate)}`);
  if (content.description) lines.push(`DESCRIPTION:${content.description}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\n');
};

export const formatCustom = (content: CustomContent): string => {
  return content.raw;
};

// ---------------------------------------------------------------------------
// Contrast / accessibility helpers
// ---------------------------------------------------------------------------

/** Parse a hex color (#RGB or #RRGGBB) to [r, g, b] in 0-255. */
export const hexToRGB = (hex: string): [number, number, number] => {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

/** Relative luminance per WCAG 2.0 */
export const relativeLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/** WCAG contrast ratio between two hex colours. Returns a number >= 1. */
export const contrastRatio = (hexA: string, hexB: string): number => {
  const [rA, gA, bA] = hexToRGB(hexA);
  const [rB, gB, bB] = hexToRGB(hexB);
  const lA = relativeLuminance(rA, gA, bA);
  const lB = relativeLuminance(rB, gB, bB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
};

/** Returns true when the fg/bg pair has low contrast (< 3:1). */
export const isLowContrast = (fg: string, bg: string): boolean => {
  return contrastRatio(fg, bg) < 3;
};

// ---------------------------------------------------------------------------
// Filename helper
// ---------------------------------------------------------------------------

const CONTENT_TYPE_LABELS: Record<QRContentType, string> = {
  url: 'website',
  text: 'text',
  email: 'email',
  phone: 'phone',
  sms: 'sms',
  wifi: 'wifi',
  vcard: 'contact',
  event: 'event',
  custom: 'custom',
};

export const getQRFilename = (contentType: QRContentType, extension: string): string => {
  return `${CONTENT_TYPE_LABELS[contentType]}-qr-code.${extension}`;
};
