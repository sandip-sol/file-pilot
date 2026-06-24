import type { RGB, HSL } from './colorConversion';

/* ------------------------------------------------------------------ */
/*  Clipboard                                                          */
/* ------------------------------------------------------------------ */

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / insecure contexts
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Export formatters                                                   */
/* ------------------------------------------------------------------ */

export function formatAsCSS(colors: Array<{ hex: string; name?: string }>): string {
  const vars = colors
    .map((c, i) => {
      const name = c.name
        ? c.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        : `color-${i + 1}`;
      return `  --${name}: ${c.hex};`;
    })
    .join('\n');

  return `:root {\n${vars}\n}\n`;
}

export function formatAsJSON(
  colors: Array<{ hex: string; rgb: RGB; hsl: HSL }>,
): string {
  const payload = colors.map((c, i) => ({
    index: i + 1,
    hex: c.hex,
    rgb: { r: c.rgb.r, g: c.rgb.g, b: c.rgb.b },
    hsl: { h: c.hsl.h, s: c.hsl.s, l: c.hsl.l },
  }));
  return JSON.stringify(payload, null, 2);
}

export function formatAsTXT(
  colors: Array<{ hex: string; rgb: RGB; hsl: HSL }>,
): string {
  return colors
    .map(
      (c, i) =>
        `Color ${i + 1}\n` +
        `  HEX: ${c.hex}\n` +
        `  RGB: rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})\n` +
        `  HSL: hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)\n`,
    )
    .join('\n');
}

export function formatAsCSSVariable(name: string, hex: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `--${slug}: ${hex};`;
}

/* ------------------------------------------------------------------ */
/*  EyeDropper API                                                     */
/* ------------------------------------------------------------------ */

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperConstructor {
  new (): {
    open: () => Promise<EyeDropperResult>;
  };
}

export function hasEyeDropperSupport(): boolean {
  return 'EyeDropper' in window;
}

export async function pickColorFromScreen(): Promise<string | null> {
  if (!hasEyeDropperSupport()) return null;

  try {
    const Dropper = (window as unknown as { EyeDropper: EyeDropperConstructor }).EyeDropper;
    const dropper = new Dropper();
    const result = await dropper.open();
    return result.sRGBHex;
  } catch {
    // User cancelled or API error
    return null;
  }
}
