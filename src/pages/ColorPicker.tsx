import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { RelatedTools } from '../components/RelatedTools';
import { ToolUsageTracker } from '../components/ToolUsageTracker';
import { toast } from 'sonner';
import {
  Pipette,
  Copy,
  Trash2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Palette,
  Info,
  Shield,
  Monitor,
} from 'lucide-react';
import { loadImageFile } from '../utils/image/processing';
import { revokeImageUrls } from '../utils/image/processing';
import { downloadBlobFile, downloadTextFile } from '../utils/pdf/export';
import {
  rgbToHex,
  rgbaToHex8,
  hexToRgba,
  rgbToHsl,
  rgbToHsv,
  rgbToCmyk,
  hslToRgb,
  getRelativeLuminance,
  parseColorString,
  type RGB,
  type RGBA,
  type HSL,
  type HSV,
  type CMYK,
} from '../utils/color/colorConversion';
import {
  extractPalette,
  generatePalettePreviewPng,
  type PaletteColor,
  type ExtractionMethod,
} from '../utils/color/paletteExtraction';
import {
  copyToClipboard,
  formatAsCSS,
  formatAsJSON,
  formatAsTXT,
  hasEyeDropperSupport,
  pickColorFromScreen,
} from '../utils/color/colorHelpers';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PickedColor {
  id: string;
  rgba: RGBA;
  hex: string;
}

interface SavedColor {
  id: string;
  rgba: RGBA;
  hex: string;
}

type TabId = 'image' | 'manual';
type PaletteSize = 3 | 5 | 8 | 12;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

function contrastTextColor(rgb: RGB): string {
  return getRelativeLuminance(rgb) > 0.179 ? '#000000' : '#FFFFFF';
}

function formatRgbString(rgba: RGBA): string {
  return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
}

function formatRgbaString(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${Number(rgba.a.toFixed(2))})`;
}

function formatHslString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function formatHslaString(hsl: HSL, a: number): string {
  return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${Number(a.toFixed(2))})`;
}

function formatHsvString(hsv: HSV): string {
  return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
}

function formatCmykString(cmyk: CMYK): string {
  return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
}

/* ------------------------------------------------------------------ */
/*  Copy button                                                        */
/* ------------------------------------------------------------------ */

function CopyBtn({ text, label }: { text: string; label: string }) {
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      toast.success(`Copied ${label}`);
    } else {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title={`Copy ${label}`}
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Color format row                                                   */
/* ------------------------------------------------------------------ */

function FormatRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className="shrink-0 font-medium text-muted-foreground w-16">{label}</span>
      <code className="flex-1 truncate rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">
        {value}
      </code>
      {note && (
        <span className="shrink-0 text-[10px] text-muted-foreground italic max-w-[140px] leading-tight">
          {note}
        </span>
      )}
      <CopyBtn text={value} label={label} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  All-formats panel                                                  */
/* ------------------------------------------------------------------ */

function ColorFormatsPanel({ rgba }: { rgba: RGBA }) {
  const rgb: RGB = { r: rgba.r, g: rgba.g, b: rgba.b };
  const hex = rgbToHex(rgb);
  const hex8 = rgbaToHex8(rgba);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const cssVar = `--color: ${hex};`;

  return (
    <div className="space-y-0.5">
      <FormatRow label="HEX" value={hex} />
      {rgba.a < 1 && <FormatRow label="HEX8" value={hex8} />}
      <FormatRow label="RGB" value={formatRgbString(rgba)} />
      <FormatRow label="RGBA" value={formatRgbaString(rgba)} />
      <FormatRow label="HSL" value={formatHslString(hsl)} />
      <FormatRow label="HSLA" value={formatHslaString(hsl, rgba.a)} />
      <FormatRow label="HSV" value={formatHsvString(hsv)} />
      <FormatRow
        label="CMYK"
        value={formatCmykString(cmyk)}
        note="Approximate"
      />
      <FormatRow label="CSS" value={cssVar} />
      {rgba.a < 1 && (
        <div className="text-xs text-muted-foreground pt-1">
          Alpha: {Number(rgba.a.toFixed(2))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground pt-2 italic">
        Approximate CMYK conversion for reference. Use a professional print workflow for final production colour.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export const ColorPicker = () => {
  /* ---- Tabs ---- */
  const [activeTab, setActiveTab] = useState<TabId>('image');

  /* ---- Image state ---- */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState(0);

  /* ---- Canvas refs ---- */
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ---- Pick state ---- */
  const [pickedColor, setPickedColor] = useState<PickedColor | null>(null);
  const [colorHistory, setColorHistory] = useState<PickedColor[]>([]);
  const [savedPalette, setSavedPalette] = useState<SavedColor[]>([]);
  const [showLoupe, setShowLoupe] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0 });

  /* ---- Manual input state ---- */
  const [manualHex, setManualHex] = useState('#2563EB');
  const [manualR, setManualR] = useState(37);
  const [manualG, setManualG] = useState(99);
  const [manualB, setManualB] = useState(235);
  const [manualH, setManualH] = useState(217);
  const [manualS, setManualS] = useState(84);
  const [manualL, setManualL] = useState(53);
  const [manualAlpha, setManualAlpha] = useState(1);
  const [manualSource, setManualSource] = useState<'hex' | 'rgb' | 'hsl'>('hex');

  /* ---- Palette extraction ---- */
  const [paletteSize, setPaletteSize] = useState<PaletteSize>(5);
  const [extractionMethod, setExtractionMethod] = useState<ExtractionMethod>('dominant');
  const [extractedPalette, setExtractedPalette] = useState<PaletteColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  /* ---- EyeDropper ---- */
  const eyeDropperSupported = useMemo(() => hasEyeDropperSupport(), []);

  /* ================================================================ */
  /*  Image loading                                                    */
  /* ================================================================ */

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    try {
      const info = await loadImageFile(file);
      setImageFile(file);
      setImagePreviewUrl(info.previewUrl);
      setImageNaturalWidth(info.width);
      setImageNaturalHeight(info.height);
      setPickedColor(null);
      setExtractedPalette([]);
    } catch {
      toast.error('Failed to load image');
    }
  }, []);

  /* Draw image to display canvas + offscreen full-res canvas */
  useEffect(() => {
    if (!imagePreviewUrl || !displayCanvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      // Display canvas — fit to container
      const dc = displayCanvasRef.current;
      if (!dc) return;
      const container = containerRef.current;
      const maxW = container ? container.clientWidth : 800;
      const scale = Math.min(1, maxW / img.naturalWidth);
      dc.width = Math.round(img.naturalWidth * scale);
      dc.height = Math.round(img.naturalHeight * scale);
      const dctx = dc.getContext('2d');
      if (dctx) {
        dctx.drawImage(img, 0, 0, dc.width, dc.height);
      }

      // Off-screen canvas at full resolution for accurate picking
      const oc = document.createElement('canvas');
      oc.width = img.naturalWidth;
      oc.height = img.naturalHeight;
      const octx = oc.getContext('2d');
      if (octx) {
        octx.drawImage(img, 0, 0);
      }
      offscreenCanvasRef.current = oc;
    };
    img.src = imagePreviewUrl;
  }, [imagePreviewUrl]);

  /* Cleanup preview URLs */
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  /* ================================================================ */
  /*  Pixel picking on canvas                                          */
  /* ================================================================ */

  const getPixelFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): RGBA | null => {
      const dc = displayCanvasRef.current;
      const oc = offscreenCanvasRef.current;
      if (!dc || !oc) return null;

      const rect = dc.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Map display coords to full-res coords
      const scaleX = oc.width / dc.width;
      const scaleY = oc.height / dc.height;
      const fx = Math.floor(x * scaleX);
      const fy = Math.floor(y * scaleY);

      if (fx < 0 || fx >= oc.width || fy < 0 || fy >= oc.height) return null;

      const ctx = oc.getContext('2d');
      if (!ctx) return null;

      const pixel = ctx.getImageData(fx, fy, 1, 1).data;
      return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] / 255 };
    },
    [],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rgba = getPixelFromEvent(e);
      if (!rgba) return;

      const rgb: RGB = { r: rgba.r, g: rgba.g, b: rgba.b };
      const hex = rgbToHex(rgb);
      const picked: PickedColor = { id: nextId('pick'), rgba, hex };
      setPickedColor(picked);
      setColorHistory((prev) => {
        const next = [picked, ...prev.filter((c) => c.hex !== picked.hex)];
        return next.slice(0, 20);
      });
    },
    [getPixelFromEvent],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const dc = displayCanvasRef.current;
      const oc = offscreenCanvasRef.current;
      const lc = loupeCanvasRef.current;
      if (!dc || !oc || !lc) return;

      const rect = dc.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setLoupePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setShowLoupe(true);

      // Draw loupe
      const LOUPE_RADIUS = 55;
      const PIXEL_COUNT = 11; // 11x11 pixel grid
      const cellSize = (LOUPE_RADIUS * 2) / PIXEL_COUNT;

      lc.width = LOUPE_RADIUS * 2;
      lc.height = LOUPE_RADIUS * 2;
      const lctx = lc.getContext('2d');
      if (!lctx) return;

      const scaleX = oc.width / dc.width;
      const scaleY = oc.height / dc.height;
      const fx = Math.floor(x * scaleX);
      const fy = Math.floor(y * scaleY);

      const half = Math.floor(PIXEL_COUNT / 2);
      const octx = oc.getContext('2d');
      if (!octx) return;

      // Draw checkerboard background for transparency
      lctx.fillStyle = '#ffffff';
      lctx.fillRect(0, 0, lc.width, lc.height);

      for (let py = 0; py < PIXEL_COUNT; py++) {
        for (let px = 0; px < PIXEL_COUNT; px++) {
          const sx = fx - half + px;
          const sy = fy - half + py;

          if (sx >= 0 && sx < oc.width && sy >= 0 && sy < oc.height) {
            const pixel = octx.getImageData(sx, sy, 1, 1).data;
            lctx.fillStyle = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
          } else {
            lctx.fillStyle = '#e5e7eb';
          }
          lctx.fillRect(px * cellSize, py * cellSize, cellSize + 1, cellSize + 1);
        }
      }

      // Draw crosshair on center cell
      const cx = half * cellSize;
      const cy = half * cellSize;
      lctx.strokeStyle = '#000000';
      lctx.lineWidth = 1.5;
      lctx.strokeRect(cx, cy, cellSize, cellSize);
      lctx.strokeStyle = '#ffffff';
      lctx.lineWidth = 0.75;
      lctx.strokeRect(cx - 0.5, cy - 0.5, cellSize + 1, cellSize + 1);

      // Clip to circle
      lctx.globalCompositeOperation = 'destination-in';
      lctx.beginPath();
      lctx.arc(LOUPE_RADIUS, LOUPE_RADIUS, LOUPE_RADIUS, 0, Math.PI * 2);
      lctx.fill();
      lctx.globalCompositeOperation = 'source-over';

      // Border
      lctx.strokeStyle = '#374151';
      lctx.lineWidth = 2;
      lctx.beginPath();
      lctx.arc(LOUPE_RADIUS, LOUPE_RADIUS, LOUPE_RADIUS - 1, 0, Math.PI * 2);
      lctx.stroke();
    },
    [],
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setShowLoupe(false);
  }, []);

  /* ================================================================ */
  /*  Manual colour input sync                                         */
  /* ================================================================ */

  useEffect(() => {
    if (manualSource !== 'hex') return;
    const rgba = hexToRgba(manualHex);
    if (rgba) {
      setManualR(rgba.r);
      setManualG(rgba.g);
      setManualB(rgba.b);
      if (rgba.a !== undefined) setManualAlpha(rgba.a);
      const hsl = rgbToHsl({ r: rgba.r, g: rgba.g, b: rgba.b });
      setManualH(hsl.h);
      setManualS(hsl.s);
      setManualL(hsl.l);
    }
  }, [manualHex, manualSource]);

  useEffect(() => {
    if (manualSource !== 'rgb') return;
    const rgb: RGB = { r: manualR, g: manualG, b: manualB };
    setManualHex(rgbToHex(rgb));
    const hsl = rgbToHsl(rgb);
    setManualH(hsl.h);
    setManualS(hsl.s);
    setManualL(hsl.l);
  }, [manualR, manualG, manualB, manualSource]);

  useEffect(() => {
    if (manualSource !== 'hsl') return;
    const hsl: HSL = { h: manualH, s: manualS, l: manualL };
    const rgb = hslToRgb(hsl);
    setManualR(rgb.r);
    setManualG(rgb.g);
    setManualB(rgb.b);
    setManualHex(rgbToHex(rgb));
  }, [manualH, manualS, manualL, manualSource]);

  const manualRgba: RGBA = useMemo(
    () => ({ r: manualR, g: manualG, b: manualB, a: manualAlpha }),
    [manualR, manualG, manualB, manualAlpha],
  );

  /* ================================================================ */
  /*  Palette extraction                                               */
  /* ================================================================ */

  const handleExtractPalette = useCallback(() => {
    const oc = offscreenCanvasRef.current;
    if (!oc) {
      toast.error('Upload an image first');
      return;
    }

    setIsExtracting(true);

    // Use requestAnimationFrame so the UI can update first
    requestAnimationFrame(() => {
      try {
        const ctx = oc.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');

        const imageData = ctx.getImageData(0, 0, oc.width, oc.height);
        const colors = extractPalette(imageData, paletteSize, extractionMethod);
        setExtractedPalette(colors);
        toast.success(`Extracted ${colors.length} colours`);
      } catch {
        toast.error('Failed to extract palette');
      } finally {
        setIsExtracting(false);
      }
    });
  }, [paletteSize, extractionMethod]);

  /* ================================================================ */
  /*  Saved palette management                                         */
  /* ================================================================ */

  const addToSavedPalette = useCallback((rgba: RGBA, hex: string) => {
    setSavedPalette((prev) => {
      if (prev.some((c) => c.hex === hex)) {
        toast('Colour already in palette');
        return prev;
      }
      toast.success('Added to palette');
      return [...prev, { id: nextId('saved'), rgba, hex }];
    });
  }, []);

  const removeFromSavedPalette = useCallback((id: string) => {
    setSavedPalette((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearSavedPalette = useCallback(() => {
    setSavedPalette([]);
  }, []);

  const moveSavedColor = useCallback((index: number, direction: -1 | 1) => {
    setSavedPalette((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }, []);

  /* ================================================================ */
  /*  EyeDropper                                                       */
  /* ================================================================ */

  const handleEyeDropper = useCallback(async () => {
    const hex = await pickColorFromScreen();
    if (hex) {
      const parsed = parseColorString(hex);
      if (parsed) {
        const rgb: RGB = { r: parsed.r, g: parsed.g, b: parsed.b };
        const hexStr = rgbToHex(rgb);
        const picked: PickedColor = { id: nextId('eye'), rgba: parsed, hex: hexStr };
        setPickedColor(picked);
        setColorHistory((prev) => [picked, ...prev.filter((c) => c.hex !== hexStr)].slice(0, 20));
        toast.success(`Picked ${hexStr}`);
      }
    }
  }, []);

  /* ================================================================ */
  /*  Export helpers                                                    */
  /* ================================================================ */

  const paletteForExport = useMemo(() => {
    return extractedPalette.map((c) => ({
      hex: c.hex,
      rgb: c.rgb,
      hsl: rgbToHsl(c.rgb),
    }));
  }, [extractedPalette]);

  const handleExportCSS = useCallback(() => {
    const css = formatAsCSS(extractedPalette.map((c, i) => ({ hex: c.hex, name: `color-${i + 1}` })));
    copyToClipboard(css).then((ok) => {
      if (ok) toast.success('Copied CSS variables');
      else toast.error('Failed to copy');
    });
  }, [extractedPalette]);

  const handleDownloadCSS = useCallback(() => {
    const css = formatAsCSS(extractedPalette.map((c, i) => ({ hex: c.hex, name: `color-${i + 1}` })));
    downloadTextFile(css, 'palette.css');
  }, [extractedPalette]);

  const handleDownloadJSON = useCallback(() => {
    const json = formatAsJSON(paletteForExport);
    downloadTextFile(json, 'palette.json');
  }, [paletteForExport]);

  const handleDownloadTXT = useCallback(() => {
    const txt = formatAsTXT(paletteForExport);
    downloadTextFile(txt, 'palette.txt');
  }, [paletteForExport]);

  const handleCopyFormatted = useCallback(() => {
    const txt = formatAsTXT(paletteForExport);
    copyToClipboard(txt).then((ok) => {
      if (ok) toast.success('Copied formatted text');
      else toast.error('Failed to copy');
    });
  }, [paletteForExport]);

  const handleDownloadPalettePng = useCallback(() => {
    if (extractedPalette.length === 0) return;
    const blob = generatePalettePreviewPng(extractedPalette, 800, 200);
    downloadBlobFile(blob, 'palette-preview.png');
  }, [extractedPalette]);

  const handleRemoveExtractedColor = useCallback((index: number) => {
    setExtractedPalette((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <>
      <PageSeo
        title="Color Picker -- FilePilot"
        description="Pick colours from images, extract palettes, and copy colour values in HEX, RGB, HSL, HSV, CMYK, and CSS variable formats. All processing happens locally in your browser."
      />
      <ToolUsageTracker />

      <main className="container max-w-5xl py-8 md:py-12">
        {/* ---- Header ---- */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Color Picker
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Pick colours from images, extract palettes, and copy values in any format.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Shield className="h-3.5 w-3.5" />
            Your files are processed locally in your browser and are not uploaded.
          </div>
        </div>

        {/* ---- EyeDropper ---- */}
        <div className="mb-6">
          {eyeDropperSupported ? (
            <button
              type="button"
              onClick={handleEyeDropper}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <Monitor className="h-4 w-4" />
              Pick from Screen
            </button>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Screen colour picking is not supported in this browser. Upload an image to pick colours.
            </p>
          )}
        </div>

        {/* ---- Tabs ---- */}
        <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1" role="tablist">
          {([
            { id: 'image' as TabId, label: 'Pick from Image' },
            { id: 'manual' as TabId, label: 'Manual Input' },
          ]).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/*  Pick from Image tab                                          */}
        {/* ============================================================ */}
        {activeTab === 'image' && (
          <div className="space-y-6">
            {/* Upload */}
            <FileUploader
              onFilesSelected={handleFilesSelected}
              accept="image/*"
              description="Drag & drop an image here"
              hint="PNG, JPEG, WebP, AVIF, BMP, GIF"
            />

            {imagePreviewUrl && (
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                {/* ---- Canvas preview ---- */}
                <div ref={containerRef} className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
                  <canvas
                    ref={displayCanvasRef}
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                    className="block max-w-full cursor-crosshair"
                    style={{ imageRendering: 'auto' }}
                  />

                  {/* Loupe */}
                  {showLoupe && (
                    <div
                      className="pointer-events-none absolute z-10"
                      style={{
                        left: loupePos.x - 55,
                        top: loupePos.y - 130,
                        width: 110,
                        height: 110,
                      }}
                    >
                      <canvas
                        ref={loupeCanvasRef}
                        width={110}
                        height={110}
                        className="rounded-full shadow-lg"
                      />
                    </div>
                  )}
                </div>

                {/* ---- Side panel ---- */}
                <div className="space-y-4">
                  {/* Selected color */}
                  {pickedColor ? (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Selected Colour</h3>
                      <div
                        className="w-full rounded-md border border-border mb-3"
                        style={{
                          backgroundColor: formatRgbaString(pickedColor.rgba),
                          minHeight: 80,
                        }}
                        aria-label={`Selected colour: ${pickedColor.hex}`}
                      />
                      <ColorFormatsPanel rgba={pickedColor.rgba} />
                      <button
                        type="button"
                        onClick={() => addToSavedPalette(pickedColor.rgba, pickedColor.hex)}
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Save to Palette
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
                      <Pipette className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click on the image to pick a colour
                      </p>
                    </div>
                  )}

                  {/* Color history */}
                  {colorHistory.length > 0 && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Recent Picks</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {colorHistory.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setPickedColor(c)}
                            className="group relative h-8 w-8 rounded border border-border shadow-sm hover:ring-2 hover:ring-primary/50 transition-all"
                            style={{ backgroundColor: c.hex }}
                            aria-label={`Re-select ${c.hex}`}
                            title={c.hex}
                          >
                            <span
                              className="absolute inset-x-0 -bottom-4 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity text-center"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {c.hex}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---- Saved palette ---- */}
            {savedPalette.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Saved Palette ({savedPalette.length})
                  </h3>
                  <button
                    type="button"
                    onClick={clearSavedPalette}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedPalette.map((c, i) => (
                    <div
                      key={c.id}
                      className="group relative flex flex-col items-center gap-1"
                      role="listitem"
                    >
                      <div
                        className="h-14 w-14 rounded-md border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                        style={{ backgroundColor: c.hex }}
                        onClick={() => {
                          setPickedColor({ id: c.id, rgba: c.rgba, hex: c.hex });
                          copyToClipboard(c.hex).then((ok) => {
                            if (ok) toast.success(`Copied ${c.hex}`);
                          });
                        }}
                        aria-label={`Saved colour ${c.hex}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            copyToClipboard(c.hex);
                          }
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground font-mono">{c.hex}</span>
                      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => moveSavedColor(i, -1)}
                            className="rounded-full bg-card border border-border p-0.5 shadow-sm"
                            aria-label="Move left"
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </button>
                        )}
                        {i < savedPalette.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveSavedColor(i, 1)}
                            className="rounded-full bg-card border border-border p-0.5 shadow-sm"
                            aria-label="Move right"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFromSavedPalette(c.id)}
                          className="rounded-full bg-card border border-border p-0.5 shadow-sm text-destructive"
                          aria-label={`Remove ${c.hex}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/*  Manual Input tab                                              */}
        {/* ============================================================ */}
        {activeTab === 'manual' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              {/* Input fields */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                {/* HEX */}
                <div>
                  <label htmlFor="manual-hex" className="block text-sm font-medium text-foreground mb-1">
                    HEX
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm font-mono">#</span>
                    <input
                      id="manual-hex"
                      type="text"
                      value={manualHex.replace(/^#/, '')}
                      onChange={(e) => {
                        setManualSource('hex');
                        setManualHex('#' + e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 8));
                      }}
                      className="flex-1 rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={8}
                      placeholder="2563EB"
                    />
                  </div>
                </div>

                {/* RGB */}
                <div>
                  <span className="block text-sm font-medium text-foreground mb-1">RGB</span>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { label: 'R', value: manualR, set: setManualR },
                      { label: 'G', value: manualG, set: setManualG },
                      { label: 'B', value: manualB, set: setManualB },
                    ] as const).map((ch) => (
                      <div key={ch.label}>
                        <label htmlFor={`manual-${ch.label}`} className="text-xs text-muted-foreground">
                          {ch.label}
                        </label>
                        <input
                          id={`manual-${ch.label}`}
                          type="number"
                          min={0}
                          max={255}
                          value={ch.value}
                          onChange={(e) => {
                            setManualSource('rgb');
                            ch.set(Math.max(0, Math.min(255, Number(e.target.value) || 0)));
                          }}
                          className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* HSL */}
                <div>
                  <span className="block text-sm font-medium text-foreground mb-1">HSL</span>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { label: 'H', value: manualH, set: setManualH, max: 360, unit: '' },
                      { label: 'S', value: manualS, set: setManualS, max: 100, unit: '%' },
                      { label: 'L', value: manualL, set: setManualL, max: 100, unit: '%' },
                    ] as const).map((ch) => (
                      <div key={ch.label}>
                        <label htmlFor={`manual-${ch.label}`} className="text-xs text-muted-foreground">
                          {ch.label}{ch.unit && ` (${ch.unit})`}
                        </label>
                        <input
                          id={`manual-${ch.label}`}
                          type="number"
                          min={0}
                          max={ch.max}
                          value={ch.value}
                          onChange={(e) => {
                            setManualSource('hsl');
                            ch.set(Math.max(0, Math.min(ch.max, Number(e.target.value) || 0)));
                          }}
                          className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alpha */}
                <div>
                  <label htmlFor="manual-alpha" className="block text-sm font-medium text-foreground mb-1">
                    Alpha
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="manual-alpha"
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={manualAlpha}
                      onChange={(e) => setManualAlpha(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-10 text-right">
                      {manualAlpha.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview + formats */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                {/* Preview swatch */}
                <div
                  className="w-full rounded-md border border-border flex items-center justify-center"
                  style={{
                    backgroundColor: formatRgbaString(manualRgba),
                    minHeight: 120,
                  }}
                  aria-label={`Preview colour: ${manualHex}`}
                >
                  <span
                    className="text-sm font-mono font-semibold drop-shadow-sm"
                    style={{ color: contrastTextColor({ r: manualR, g: manualG, b: manualB }) }}
                  >
                    {manualHex}
                  </span>
                </div>

                <ColorFormatsPanel rgba={manualRgba} />

                <button
                  type="button"
                  onClick={() => addToSavedPalette(manualRgba, rgbToHex({ r: manualR, g: manualG, b: manualB }))}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Save to Palette
                </button>
              </div>
            </div>

            {/* Saved palette (also shown in manual tab) */}
            {savedPalette.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Saved Palette ({savedPalette.length})
                  </h3>
                  <button
                    type="button"
                    onClick={clearSavedPalette}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedPalette.map((c, i) => (
                    <div
                      key={c.id}
                      className="group relative flex flex-col items-center gap-1"
                      role="listitem"
                    >
                      <div
                        className="h-14 w-14 rounded-md border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                        style={{ backgroundColor: c.hex }}
                        onClick={() => {
                          copyToClipboard(c.hex).then((ok) => {
                            if (ok) toast.success(`Copied ${c.hex}`);
                          });
                        }}
                        aria-label={`Saved colour ${c.hex}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            copyToClipboard(c.hex);
                          }
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground font-mono">{c.hex}</span>
                      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => moveSavedColor(i, -1)}
                            className="rounded-full bg-card border border-border p-0.5 shadow-sm"
                            aria-label="Move left"
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </button>
                        )}
                        {i < savedPalette.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveSavedColor(i, 1)}
                            className="rounded-full bg-card border border-border p-0.5 shadow-sm"
                            aria-label="Move right"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFromSavedPalette(c.id)}
                          className="rounded-full bg-card border border-border p-0.5 shadow-sm text-destructive"
                          aria-label={`Remove ${c.hex}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/*  Palette Extraction section                                    */}
        {/* ============================================================ */}
        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Palette Extraction</h2>
          </div>

          {!imagePreviewUrl && (
            <p className="text-sm text-muted-foreground">
              Upload an image above to extract a colour palette.
            </p>
          )}

          {imagePreviewUrl && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                {/* Palette size */}
                <div>
                  <span className="block text-sm font-medium text-foreground mb-1">Palette Size</span>
                  <div className="flex gap-1">
                    {([3, 5, 8, 12] as PaletteSize[]).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPaletteSize(n)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          paletteSize === n
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Method */}
                <div>
                  <span className="block text-sm font-medium text-foreground mb-1">Method</span>
                  <div className="flex gap-1">
                    {([
                      { id: 'dominant' as ExtractionMethod, label: 'Dominant' },
                      { id: 'vibrant' as ExtractionMethod, label: 'Vibrant' },
                      { id: 'balanced' as ExtractionMethod, label: 'Balanced' },
                    ]).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setExtractionMethod(m.id)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          extractionMethod === m.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extract button */}
                <button
                  type="button"
                  onClick={handleExtractPalette}
                  disabled={isExtracting}
                  className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isExtracting ? 'Extracting...' : 'Extract Palette'}
                </button>
              </div>

              {/* Extracted palette display */}
              {extractedPalette.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {extractedPalette.map((c, i) => {
                      const textColor = contrastTextColor(c.rgb);
                      return (
                        <div
                          key={`${c.hex}-${i}`}
                          className="group relative flex flex-col items-center gap-1"
                        >
                          <div
                            className="h-20 w-20 rounded-lg border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all flex items-end justify-center pb-1"
                            style={{ backgroundColor: c.hex }}
                            onClick={() => {
                              copyToClipboard(c.hex).then((ok) => {
                                if (ok) toast.success(`Copied ${c.hex}`);
                              });
                            }}
                            aria-label={`Extracted colour ${c.hex}, ${c.percentage}%`}
                          >
                            <span className="text-[9px] font-mono font-semibold" style={{ color: textColor }}>
                              {c.hex}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{c.percentage}%</span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                copyToClipboard(c.hex).then((ok) => {
                                  if (ok) toast.success(`Copied ${c.hex}`);
                                });
                              }}
                              className="rounded-full bg-card border border-border p-0.5 shadow-sm"
                              aria-label={`Copy ${c.hex}`}
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExtractedColor(i)}
                              className="rounded-full bg-card border border-border p-0.5 shadow-sm text-destructive"
                              aria-label={`Remove ${c.hex}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Export buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={handleExportCSS}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      Copy as CSS
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCSS}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Download CSS
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadJSON}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Download JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadTXT}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Download TXT
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyFormatted}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      Copy as Text
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPalettePng}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Download Preview PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- Notes ---- */}
        <div className="mt-6 space-y-2 text-xs text-muted-foreground">
          <p className="flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Colours may appear differently across displays and browser colour management.
          </p>
        </div>
      </main>

      <RelatedTools />
    </>
  );
};
