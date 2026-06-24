/* ------------------------------------------------------------------ */
/*  SVG sanitization and export utilities                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Sanitize — remove dangerous elements/attributes                    */
/* ------------------------------------------------------------------ */

/** Safe SVG elements (lowercase) */
const SAFE_ELEMENTS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'clippath',
  'mask',
  'lineargradient',
  'radialgradient',
  'stop',
  'use',
  'symbol',
  'title',
  'desc',
  'metadata',
  'image',
  'pattern',
  'marker',
]);

/** Dangerous attributes (lowercase prefixes) */
const DANGEROUS_ATTR_PREFIXES = [
  'on',         // onclick, onload, onerror, etc.
];

const DANGEROUS_ATTR_NAMES = new Set([
  'formaction',
  'xlink:href', // will check separately for external refs
]);

/**
 * Sanitize an SVG string by removing scripts, event handlers,
 * foreignObject elements, and external references.
 */
export function sanitizeSvg(svgString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');

  // Check for parsing errors
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    // Return the original if parsing failed — caller should handle
    return svgString;
  }

  const removeElements = (tagName: string) => {
    const els = doc.querySelectorAll(tagName);
    els.forEach((el) => el.remove());
  };

  // Remove dangerous elements
  removeElements('script');
  removeElements('foreignObject');
  removeElements('iframe');
  removeElements('embed');
  removeElements('object');

  // Walk all elements and sanitize attributes
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    const attrsToRemove: string[] = [];

    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      const name = attr.name.toLowerCase();

      // Remove event handlers
      if (DANGEROUS_ATTR_PREFIXES.some((prefix) => name.startsWith(prefix))) {
        attrsToRemove.push(attr.name);
        continue;
      }

      if (DANGEROUS_ATTR_NAMES.has(name)) {
        attrsToRemove.push(attr.name);
        continue;
      }

      // Remove xlink:href pointing to external URLs (keep internal #refs)
      if (name === 'href' || name === 'xlink:href') {
        const val = attr.value.trim();
        if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('//')) {
          attrsToRemove.push(attr.name);
        }
      }

      // Remove javascript: URIs in any attribute
      if (attr.value.trim().toLowerCase().startsWith('javascript:')) {
        attrsToRemove.push(attr.name);
      }
    }

    for (const name of attrsToRemove) {
      el.removeAttribute(name);
    }

    // Remove elements that are not in the safe list
    const tagLower = el.tagName.toLowerCase();
    if (!SAFE_ELEMENTS.has(tagLower) && el.parentNode) {
      el.remove();
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc.documentElement);
}

/* ------------------------------------------------------------------ */
/*  Optimize — basic SVG path optimization                             */
/* ------------------------------------------------------------------ */

/**
 * Optimize an SVG string:
 * - Round path coordinates to 2 decimal places
 * - Remove empty groups
 * - Basic merge of adjacent paths with same fill
 */
export function optimizeSvg(svgString: string): string {
  let result = svgString;

  // Round numbers in path d attributes to 2 decimal places
  result = result.replace(
    /\bd="([^"]+)"/g,
    (_match: string, dAttr: string) => {
      const optimized = dAttr.replace(
        /-?\d+\.\d{3,}/g,
        (num: string) => String(Math.round(parseFloat(num) * 100) / 100),
      );
      return `d="${optimized}"`;
    },
  );

  // Remove empty <g></g> groups
  result = result.replace(/<g[^>]*>\s*<\/g>/g, '');

  // Basic merge: consecutive paths with same fill
  // Parse and re-merge
  const parser = new DOMParser();
  const doc = parser.parseFromString(result, 'image/svg+xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) return result;

  const svg = doc.documentElement;
  const paths = Array.from(svg.querySelectorAll('path'));

  // Group consecutive paths by fill color
  let i = 0;
  while (i < paths.length - 1) {
    const current = paths[i];
    const next = paths[i + 1];

    const currentFill = current.getAttribute('fill') || '';
    const nextFill = next.getAttribute('fill') || '';
    const currentStroke = current.getAttribute('stroke');
    const nextStroke = next.getAttribute('stroke');

    // Only merge fill paths (not stroke paths) with identical fill
    if (
      currentFill &&
      currentFill === nextFill &&
      !currentStroke &&
      !nextStroke &&
      current.parentNode === next.parentNode
    ) {
      const d1 = current.getAttribute('d') || '';
      const d2 = next.getAttribute('d') || '';
      current.setAttribute('d', `${d1} ${d2}`);
      next.remove();
      paths.splice(i + 1, 1);
      // Don't increment i — check again for another merge
    } else {
      i++;
    }
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
}

/* ------------------------------------------------------------------ */
/*  Export helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Convert an SVG string to a Blob with the correct MIME type.
 */
export function svgToBlob(svgString: string): Blob {
  return new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
}

/**
 * Copy an SVG string to the system clipboard.
 * Returns true on success, false on failure.
 */
export async function copySvgToClipboard(svgString: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(svgString);
    return true;
  } catch {
    // Fallback: execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = svgString;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Render an SVG string to a canvas and return a PNG Blob.
 */
export async function svgToPngBlob(
  svgString: string,
  width: number,
  height: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blob = svgToBlob(svgString);
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            reject(new Error('Failed to export PNG'));
          }
        },
        'image/png',
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG as image'));
    };
    img.src = url;
  });
}
