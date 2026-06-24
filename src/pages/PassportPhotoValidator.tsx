import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { ToolStateMessage } from '../components/ToolStateMessage';
import { toast } from 'sonner';
import {
  passportProfiles,
  runPassportChecks,
  type PassportProfile,
  type PassportCheck,
} from '../data/passportProfiles';
import {
  exportCanvas,
  cropAndResizeCanvas,
  hasFaceDetectorSupport,
  detectFaces,
  type CropRect,
} from '../utils/image/canvas';
import { extractMetadata, type ImageMetadataInfo } from '../utils/image/metadata';
import { formatFileSize, getFormatLabel } from '../utils/image/support';
import { downloadBlob } from '../utils/image/batchExport';
import type { ImageFormat } from '../utils/image/types';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Download,
  RefreshCw,
  Loader2,
  Sparkles,
  Camera,
  Info,
  Lock,
  Unlock,
  SlidersHorizontal,
  Shield,
  ChevronDown,
  ChevronUp,
  Eye,
  Scissors,
} from 'lucide-react';

/* ───────────── Types ───────────── */

interface SourceImage {
  file: File;
  url: string;
  bitmap: ImageBitmap;
  width: number;
  height: number;
  metadata: ImageMetadataInfo;
}

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ExportedResult {
  url: string;
  blob: Blob;
  width: number;
  height: number;
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;

interface CustomProfile {
  widthPx: number;
  heightPx: number;
  backgroundColor: string;
  maxFileSizeKB: number;
}

/* ───────────── Constants ───────────── */

const CUSTOM_PROFILE_ID = '__custom__';

const DISCLAIMER_TEXT =
  'This tool checks common technical photo requirements but cannot guarantee official acceptance. Always verify the latest requirements from the relevant passport authority.';

const HEAD_GUIDE = {
  topPercent: 0.1,
  chinPercent: 0.75,
};

/* ───────────── Helpers ───────────── */

function parseAspectRatio(ratio: string): number {
  const parts = ratio.split(':').map(Number);
  if (parts.length === 2 && parts[1] !== 0) return parts[0] / parts[1];
  return 1;
}

function clampCrop(box: CropBox, imgW: number, imgH: number): CropBox {
  let { x, y, w, h } = box;
  w = Math.max(20, Math.min(w, imgW));
  h = Math.max(20, Math.min(h, imgH));
  x = Math.max(0, Math.min(x, imgW - w));
  y = Math.max(0, Math.min(y, imgH - h));
  return { x, y, w, h };
}

function initCropForProfile(
  imgW: number,
  imgH: number,
  aspectRatio: number,
): CropBox {
  let cropW: number;
  let cropH: number;

  if (imgW / imgH > aspectRatio) {
    cropH = imgH;
    cropW = Math.round(imgH * aspectRatio);
  } else {
    cropW = imgW;
    cropH = Math.round(imgW / aspectRatio);
  }

  return clampCrop(
    {
      x: Math.round((imgW - cropW) / 2),
      y: Math.round((imgH - cropH) / 2),
      w: cropW,
      h: cropH,
    },
    imgW,
    imgH,
  );
}

function getCheckIcon(status: PassportCheck['status']) {
  switch (status) {
    case 'pass':
      return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'fail':
      return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
    case 'unknown':
      return <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />;
  }
}

function getCheckStatusLabel(status: PassportCheck['status']): string {
  switch (status) {
    case 'pass':
      return 'Likely suitable';
    case 'warning':
      return 'Needs review';
    case 'fail':
      return 'Check official guidance';
    case 'unknown':
      return 'Cannot verify';
  }
}

/* ───────────── Component ───────────── */

export const PassportPhotoValidator = () => {
  /* ── Source ── */
  const [source, setSource] = useState<SourceImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ── Profile selection ── */
  const [selectedProfileId, setSelectedProfileId] = useState<string>(passportProfiles[0].id);
  const [customProfile, setCustomProfile] = useState<CustomProfile>({
    widthPx: 600,
    heightPx: 600,
    backgroundColor: '#ffffff',
    maxFileSizeKB: 200,
  });

  const isCustom = selectedProfileId === CUSTOM_PROFILE_ID;

  const activeProfile: PassportProfile = useMemo(() => {
    if (isCustom) {
      return {
        id: CUSTOM_PROFILE_ID,
        name: 'Custom Profile',
        widthPx: customProfile.widthPx,
        heightPx: customProfile.heightPx,
        printWidthMm: 0,
        printHeightMm: 0,
        dpi: 300,
        maxFileSizeKB: customProfile.maxFileSizeKB,
        backgroundColor: customProfile.backgroundColor,
        aspectRatio: `${customProfile.widthPx}:${customProfile.heightPx}`,
        format: 'image/jpeg' as const,
        notes: 'Custom profile with user-specified dimensions.',
        lastReviewed: 'N/A',
      };
    }
    return passportProfiles.find((p) => p.id === selectedProfileId) ?? passportProfiles[0];
  }, [selectedProfileId, isCustom, customProfile]);

  /* ── Face detection ── */
  const [faces, setFaces] = useState<Array<{ x: number; y: number; width: number; height: number }>>([]);
  const [faceSupported, setFaceSupported] = useState(false);

  /* ── Crop ── */
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, w: 100, h: 100 });
  const [lockAspect, setLockAspect] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });

  /* ── Export options ── */
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('image/jpeg');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [jpegQuality, setJpegQuality] = useState(0.92);
  const [removeMetadata, setRemoveMetadata] = useState(true);

  /* ── Checks ── */
  const [checks, setChecks] = useState<PassportCheck[]>([]);

  /* ── Export result ── */
  const [exported, setExported] = useState<ExportedResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  /* ── Profile info toggle ── */
  const [showProfileInfo, setShowProfileInfo] = useState(true);

  /* ── Refs ── */
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  /* ── Cleanup URLs on unmount ── */
  useEffect(() => {
    return () => {
      if (source?.url) URL.revokeObjectURL(source.url);
      if (exported?.url) URL.revokeObjectURL(exported.url);
    };
  }, [source, exported]);

  /* ── Face detection check ── */
  useEffect(() => {
    setFaceSupported(hasFaceDetectorSupport());
  }, []);

  /* ── Update crop when profile changes ── */
  useEffect(() => {
    if (!source) return;
    const ratio = parseAspectRatio(activeProfile.aspectRatio);
    const newCrop = initCropForProfile(source.width, source.height, ratio);
    setCrop(newCrop);
    setBgColor(activeProfile.backgroundColor);
    setOutputFormat(activeProfile.format);
  }, [activeProfile, source]);

  /* ── Run checks when source or profile changes ── */
  useEffect(() => {
    if (!source) {
      setChecks([]);
      return;
    }
    const result = runPassportChecks(
      activeProfile,
      source.width,
      source.height,
      source.file.size,
      source.file.type,
      source.metadata.hasExif,
    );
    setChecks(result);
  }, [source, activeProfile]);

  /* ── File selected ── */
  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];

    setIsLoading(true);
    setExported(null);
    setFaces([]);
    setChecks([]);

    try {
      // Revoke previous
      if (source?.url) URL.revokeObjectURL(source.url);
      if (exported?.url) URL.revokeObjectURL(exported.url);

      const [bitmap, metadata] = await Promise.all([
        createImageBitmap(file),
        extractMetadata(file),
      ]);

      const url = URL.createObjectURL(file);

      const newSource: SourceImage = {
        file,
        url,
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        metadata,
      };
      setSource(newSource);

      // Init crop
      const ratio = parseAspectRatio(activeProfile.aspectRatio);
      setCrop(initCropForProfile(bitmap.width, bitmap.height, ratio));

      // Face detection
      if (hasFaceDetectorSupport()) {
        try {
          const detected = await detectFaces(bitmap);
          setFaces(detected);
          if (detected.length > 0) {
            toast.success(`Detected ${detected.length} face${detected.length > 1 ? 's' : ''}`);
          }
        } catch {
          setFaces([]);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load image';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Crop interaction ── */
  const getImageScale = useCallback(() => {
    if (!imgRef.current || !source) return { scaleX: 1, scaleY: 1 };
    const rect = imgRef.current.getBoundingClientRect();
    return {
      scaleX: source.width / rect.width,
      scaleY: source.height / rect.height,
    };
  }, [source]);

  const getPointerInImage = useCallback(
    (clientX: number, clientY: number) => {
      if (!imgRef.current || !source) return { x: 0, y: 0 };
      const rect = imgRef.current.getBoundingClientRect();
      const { scaleX, scaleY } = getImageScale();
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [source, getImageScale],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      setDragMode(mode);
      const pos = getPointerInImage(e.clientX, e.clientY);
      setDragStart(pos);
      setCropStart({ ...crop });
    },
    [crop, getPointerInImage],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragMode || !source) return;
      e.preventDefault();

      const pos = getPointerInImage(e.clientX, e.clientY);
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      const aspect = lockAspect ? parseAspectRatio(activeProfile.aspectRatio) : 0;

      let newCrop: CropBox;

      if (dragMode === 'move') {
        newCrop = {
          x: cropStart.x + dx,
          y: cropStart.y + dy,
          w: cropStart.w,
          h: cropStart.h,
        };
      } else {
        let newX = cropStart.x;
        let newY = cropStart.y;
        let newW = cropStart.w;
        let newH = cropStart.h;

        if (dragMode === 'se') {
          newW = cropStart.w + dx;
          newH = cropStart.h + dy;
          if (aspect > 0) {
            newH = newW / aspect;
          }
        } else if (dragMode === 'sw') {
          newW = cropStart.w - dx;
          newH = cropStart.h + dy;
          if (aspect > 0) {
            newH = newW / aspect;
          }
          newX = cropStart.x + cropStart.w - newW;
        } else if (dragMode === 'ne') {
          newW = cropStart.w + dx;
          newH = cropStart.h - dy;
          if (aspect > 0) {
            newH = newW / aspect;
          }
          newY = cropStart.y + cropStart.h - newH;
        } else if (dragMode === 'nw') {
          newW = cropStart.w - dx;
          newH = cropStart.h - dy;
          if (aspect > 0) {
            newH = newW / aspect;
          }
          newX = cropStart.x + cropStart.w - newW;
          newY = cropStart.y + cropStart.h - newH;
        }

        newCrop = { x: newX, y: newY, w: newW, h: newH };
      }

      setCrop(clampCrop(newCrop, source.width, source.height));
    },
    [isDragging, dragMode, source, dragStart, cropStart, lockAspect, activeProfile, getPointerInImage],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragMode(null);
  }, []);

  /* ── Export ── */
  const handleExport = async () => {
    if (!source) return;
    setIsExporting(true);

    try {
      if (exported?.url) URL.revokeObjectURL(exported.url);

      const cropRect: CropRect = { x: crop.x, y: crop.y, width: crop.w, height: crop.h };
      const canvas = cropAndResizeCanvas(
        source.bitmap,
        cropRect,
        activeProfile.widthPx,
        activeProfile.heightPx,
      );

      const quality = outputFormat === 'image/jpeg' ? jpegQuality : 1;
      const blob = await exportCanvas(canvas, outputFormat, quality, bgColor);

      const url = URL.createObjectURL(blob);
      setExported({
        url,
        blob,
        width: activeProfile.widthPx,
        height: activeProfile.heightPx,
      });
      toast.success('Photo exported successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  /* ── Download ── */
  const handleDownload = () => {
    if (!exported || !source) return;
    const ext = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = source.file.name.replace(/\.[^.]+$/, '');
    const filename = `${baseName}_passport_${activeProfile.widthPx}x${activeProfile.heightPx}.${ext}`;
    downloadBlob(exported.blob, filename);
  };

  /* ── Reset ── */
  const handleReset = () => {
    if (source?.url) URL.revokeObjectURL(source.url);
    if (exported?.url) URL.revokeObjectURL(exported.url);
    setSource(null);
    setExported(null);
    setFaces([]);
    setChecks([]);
    setCrop({ x: 0, y: 0, w: 100, h: 100 });
  };

  /* ── Computed display values ── */
  const cropOverlayStyle = useMemo(() => {
    if (!imgRef.current || !source) return { left: 0, top: 0, width: 0, height: 0 };
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = rect.width / source.width;
    const scaleY = rect.height / source.height;
    return {
      left: crop.x * scaleX,
      top: crop.y * scaleY,
      width: crop.w * scaleX,
      height: crop.h * scaleY,
    };
  }, [crop, source]);

  // Force re-calc on resize
  const [, setResizeTick] = useState(0);
  useEffect(() => {
    const onResize = () => setResizeTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ────────────────── RENDER ────────────────── */
  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Passport Photo Validator - Check Photo Requirements | FilePilot"
        description="Validate passport photo dimensions, file size, and format against official requirements. Crop, resize, and export. Free, private, browser-based."
      />

      {/* ── Header ── */}
      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6" />
            </div>
          </div>
          <h1>Passport Photo Validator</h1>
          <p>Check, crop, and export passport photos to match official size requirements.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Processed locally in your browser. No uploads.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ═══ Disclaimer Banner ═══ */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <p>{DISCLAIMER_TEXT}</p>
          </div>

          {/* ═══ Profile Selector ═══ */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <SlidersHorizontal className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-bold">Validation Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
              {passportProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                    selectedProfileId === profile.id
                      ? 'border-foreground bg-muted shadow-md'
                      : 'border-border hover:border-muted-foreground hover:shadow-sm bg-background'
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{profile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile.widthPx} x {profile.heightPx} px
                    {profile.country ? ` - ${profile.country}` : ''}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                    {getFormatLabel(profile.format)} - Max {profile.maxFileSizeKB} KB
                  </p>
                </button>
              ))}

              {/* Custom profile option */}
              <button
                onClick={() => setSelectedProfileId(CUSTOM_PROFILE_ID)}
                className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                  isCustom
                    ? 'border-foreground bg-muted shadow-md'
                    : 'border-border hover:border-muted-foreground hover:shadow-sm bg-background border-dashed'
                }`}
              >
                <p className="font-semibold text-sm">Custom</p>
                <p className="text-xs text-muted-foreground mt-0.5">Set your own dimensions</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  Enter width, height, background, and max file size
                </p>
              </button>
            </div>

            {/* Custom profile fields */}
            {isCustom && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in p-4 bg-muted/50 rounded-xl border border-border">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Width (px)</label>
                  <input
                    type="number"
                    min={50}
                    max={10000}
                    value={customProfile.widthPx}
                    onChange={(e) =>
                      setCustomProfile((p) => ({ ...p, widthPx: Math.max(50, parseInt(e.target.value) || 50) }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Height (px)</label>
                  <input
                    type="number"
                    min={50}
                    max={10000}
                    value={customProfile.heightPx}
                    onChange={(e) =>
                      setCustomProfile((p) => ({ ...p, heightPx: Math.max(50, parseInt(e.target.value) || 50) }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customProfile.backgroundColor}
                      onChange={(e) =>
                        setCustomProfile((p) => ({ ...p, backgroundColor: e.target.value }))
                      }
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{customProfile.backgroundColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Max Size (KB)</label>
                  <input
                    type="number"
                    min={1}
                    value={customProfile.maxFileSizeKB}
                    onChange={(e) =>
                      setCustomProfile((p) => ({ ...p, maxFileSizeKB: Math.max(1, parseInt(e.target.value) || 1) }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>
            )}

            {/* Profile info */}
            {!isCustom && (
              <div className="mt-4">
                <button
                  onClick={() => setShowProfileInfo(!showProfileInfo)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-4 h-4" />
                  Profile details
                  {showProfileInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showProfileInfo && (
                  <div className="mt-3 p-4 bg-muted/50 rounded-xl border border-border text-sm space-y-2 animate-fade-in">
                    <p className="text-foreground">{activeProfile.notes}</p>
                    <p className="text-xs text-muted-foreground">
                      Print: {activeProfile.printWidthMm} x {activeProfile.printHeightMm} mm
                      {' | '}DPI: {activeProfile.dpi}
                      {' | '}Aspect: {activeProfile.aspectRatio}
                      {activeProfile.minFileSizeKB ? ` | Min: ${activeProfile.minFileSizeKB} KB` : ''}
                      {' | '}Max: {activeProfile.maxFileSizeKB} KB
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Last reviewed: {activeProfile.lastReviewed}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ Upload / Main area ═══ */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            {!source && !isLoading ? (
              <FileUploader
                onFilesSelected={handleFileSelected}
                accept="image/*"
                multiple={false}
                description="Drop a passport photo here"
                hint="Supports JPG, PNG, and WebP. Your photo is processed locally and never leaves your device."
              />
            ) : isLoading ? (
              <ToolStateMessage state="loading" title="Loading image">
                <p>Analyzing photo and checking requirements...</p>
              </ToolStateMessage>
            ) : source ? (
              <div className="space-y-6 animate-fade-in">

                {/* Source info bar */}
                <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50 p-4 rounded-xl border border-violet-100">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{source.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {source.width} x {source.height} px
                        {' - '}
                        {formatFileSize(source.file.size)}
                        {' - '}
                        {source.file.type.split('/')[1]?.toUpperCase() ?? 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="p-2 hover:bg-white rounded-full transition-colors text-muted-foreground hover:text-red-500 shrink-0"
                    title="Remove photo"
                    aria-label="Remove photo and start over"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                {/* ── Technical Checks ── */}
                {checks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Technical Checks
                    </h3>
                    <div className="space-y-2">
                      {checks.map((check) => (
                        <div
                          key={check.id}
                          className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${
                            check.status === 'pass'
                              ? 'bg-emerald-50 border-emerald-200'
                              : check.status === 'warning'
                                ? 'bg-amber-50 border-amber-200'
                                : check.status === 'fail'
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="mt-0.5">{getCheckIcon(check.status)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{check.label}</span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  check.status === 'pass'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : check.status === 'warning'
                                      ? 'bg-amber-100 text-amber-700'
                                      : check.status === 'fail'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {getCheckStatusLabel(check.status)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{check.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Face detection message ── */}
                {!faceSupported && (
                  <ToolStateMessage state="hint">
                    <p>
                      Face detection is not available in this browser. Please position the face manually.
                    </p>
                  </ToolStateMessage>
                )}

                {/* ── Crop Tool ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      Crop &amp; Position
                    </h3>
                    <button
                      onClick={() => setLockAspect(!lockAspect)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        lockAspect
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                      aria-label={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                    >
                      {lockAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      {lockAspect ? 'Aspect locked' : 'Aspect free'}
                    </button>
                  </div>

                  <div
                    ref={containerRef}
                    className="relative rounded-xl overflow-hidden border border-border bg-muted/40 select-none touch-none"
                    style={{ maxHeight: '600px' }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {/* The image */}
                    <img
                      ref={imgRef}
                      src={source.url}
                      alt="Passport photo preview"
                      className="block w-full h-auto max-h-[600px] object-contain pointer-events-none"
                      onLoad={() => setResizeTick((t) => t + 1)}
                      draggable={false}
                    />

                    {/* Dark overlay outside crop */}
                    {imgRef.current && (
                      <>
                        {/* Top */}
                        <div
                          className="absolute bg-black/50 pointer-events-none"
                          style={{
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: `${cropOverlayStyle.top}px`,
                          }}
                        />
                        {/* Bottom */}
                        <div
                          className="absolute bg-black/50 pointer-events-none"
                          style={{
                            left: 0,
                            top: `${cropOverlayStyle.top + cropOverlayStyle.height}px`,
                            width: '100%',
                            bottom: 0,
                          }}
                        />
                        {/* Left */}
                        <div
                          className="absolute bg-black/50 pointer-events-none"
                          style={{
                            left: 0,
                            top: `${cropOverlayStyle.top}px`,
                            width: `${cropOverlayStyle.left}px`,
                            height: `${cropOverlayStyle.height}px`,
                          }}
                        />
                        {/* Right */}
                        <div
                          className="absolute bg-black/50 pointer-events-none"
                          style={{
                            left: `${cropOverlayStyle.left + cropOverlayStyle.width}px`,
                            top: `${cropOverlayStyle.top}px`,
                            right: 0,
                            height: `${cropOverlayStyle.height}px`,
                          }}
                        />

                        {/* Crop box */}
                        <div
                          className="absolute border-2 border-white cursor-move"
                          style={{
                            left: `${cropOverlayStyle.left}px`,
                            top: `${cropOverlayStyle.top}px`,
                            width: `${cropOverlayStyle.width}px`,
                            height: `${cropOverlayStyle.height}px`,
                          }}
                          onPointerDown={(e) => handlePointerDown(e, 'move')}
                        >
                          {/* Rule of thirds grid */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                          </div>

                          {/* Head positioning guide (dashed lines) */}
                          <div className="absolute inset-0 pointer-events-none">
                            {/* Top of head line */}
                            <div
                              className="absolute left-0 right-0 border-t-2 border-dashed border-cyan-400/60"
                              style={{ top: `${HEAD_GUIDE.topPercent * 100}%` }}
                            >
                              <span className="absolute -top-4 right-1 text-[9px] text-cyan-400 whitespace-nowrap">
                                Top of head
                              </span>
                            </div>
                            {/* Chin line */}
                            <div
                              className="absolute left-0 right-0 border-t-2 border-dashed border-cyan-400/60"
                              style={{ top: `${HEAD_GUIDE.chinPercent * 100}%` }}
                            >
                              <span className="absolute -bottom-4 right-1 text-[9px] text-cyan-400 whitespace-nowrap">
                                Chin
                              </span>
                            </div>
                            {/* Center vertical line */}
                            <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-cyan-400/30" />
                          </div>

                          {/* Face detection overlay */}
                          {faces.map((face, i) => {
                            if (!imgRef.current || !source) return null;
                            const imgRect = imgRef.current.getBoundingClientRect();
                            const scaleX = imgRect.width / source.width;
                            const scaleY = imgRect.height / source.height;
                            // Face position relative to crop
                            const cropLeftPx = crop.x * scaleX;
                            const cropTopPx = crop.y * scaleY;
                            const faceLeftPx = face.x * scaleX - cropLeftPx;
                            const faceTopPx = face.y * scaleY - cropTopPx;
                            const faceWPx = face.width * scaleX;
                            const faceHPx = face.height * scaleY;

                            return (
                              <div
                                key={i}
                                className="absolute border-2 border-emerald-400 rounded-sm pointer-events-none"
                                style={{
                                  left: `${faceLeftPx}px`,
                                  top: `${faceTopPx}px`,
                                  width: `${faceWPx}px`,
                                  height: `${faceHPx}px`,
                                }}
                              >
                                <span className="absolute -top-4 left-0 text-[9px] bg-emerald-500 text-white px-1 rounded">
                                  Face {faces.length > 1 ? i + 1 : ''}
                                </span>
                              </div>
                            );
                          })}

                          {/* Corner handles */}
                          {(['nw', 'ne', 'sw', 'se'] as DragMode[]).map((corner) => {
                            if (!corner) return null;
                            const posMap: Record<string, React.CSSProperties> = {
                              nw: { top: -5, left: -5, cursor: 'nwse-resize' },
                              ne: { top: -5, right: -5, cursor: 'nesw-resize' },
                              sw: { bottom: -5, left: -5, cursor: 'nesw-resize' },
                              se: { bottom: -5, right: -5, cursor: 'nwse-resize' },
                            };
                            return (
                              <div
                                key={corner}
                                className="absolute w-3 h-3 bg-white border-2 border-foreground rounded-sm z-10"
                                style={posMap[corner]}
                                onPointerDown={(e) => handlePointerDown(e, corner)}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Crop dimensions readout */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Crop: {Math.round(crop.w)} x {Math.round(crop.h)} px</span>
                    <span>Ratio: {(crop.w / crop.h).toFixed(2)}</span>
                    <span>
                      Output: {activeProfile.widthPx} x {activeProfile.heightPx} px
                    </span>
                  </div>
                </div>

                {/* ── Export Options ── */}
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Options
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Output format */}
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        Output Format
                      </label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value as ImageFormat)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        aria-label="Output format"
                      >
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/png">PNG</option>
                      </select>
                    </div>

                    {/* Background color */}
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                          aria-label="Background color"
                        />
                        <span className="text-xs text-muted-foreground font-mono">{bgColor}</span>
                      </div>
                    </div>

                    {/* Quality slider (JPEG only) */}
                    {outputFormat === 'image/jpeg' && (
                      <div className="animate-fade-in">
                        <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                          JPEG Quality: {Math.round(jpegQuality * 100)}%
                        </label>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.01}
                          value={jpegQuality}
                          onChange={(e) => setJpegQuality(parseFloat(e.target.value))}
                          className="w-full accent-foreground"
                          aria-label="JPEG quality"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                          <span>Smaller file</span>
                          <span>Higher quality</span>
                        </div>
                      </div>
                    )}

                    {/* Dimensions (readonly) */}
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        Target Dimensions
                      </label>
                      <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm font-medium text-muted-foreground">
                        {activeProfile.widthPx} x {activeProfile.heightPx} px
                      </div>
                    </div>

                    {/* Remove metadata toggle */}
                    <div className="flex items-center">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={removeMetadata}
                          onChange={(e) => setRemoveMetadata(e.target.checked)}
                          className="w-5 h-5 rounded border-border accent-foreground cursor-pointer"
                        />
                        <div>
                          <span className="text-sm font-medium text-foreground group-hover:text-foreground/80">
                            Remove metadata
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            Re-export strips EXIF data by default
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* ── Export / Download ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className={`btn btn-primary flex-1 py-4 text-base ${isExporting ? 'opacity-75 cursor-wait' : ''}`}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Export Photo
                      </>
                    )}
                  </button>

                  {exported && (
                    <button
                      onClick={handleDownload}
                      className="btn btn-outline flex-1 py-4 text-base"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  )}

                  <button
                    onClick={handleReset}
                    className="btn btn-outline py-4 text-base sm:flex-none sm:px-6"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reset
                  </button>
                </div>

                {/* ── Exported result ── */}
                {exported && (
                  <div className="animate-fade-in">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Exported Photo
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="rounded-xl border border-border overflow-hidden bg-muted/40 flex items-center justify-center">
                        <img
                          src={exported.url}
                          alt="Exported passport photo"
                          className="max-w-full max-h-80 object-contain"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">Export Complete</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground block text-xs">Dimensions</span>
                              <span className="font-semibold">{exported.width} x {exported.height} px</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">File Size</span>
                              <span className="font-semibold">{formatFileSize(exported.blob.size)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Format</span>
                              <span className="font-semibold">{getFormatLabel(outputFormat)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Metadata</span>
                              <span className="font-semibold">{removeMetadata ? 'Removed' : 'Preserved'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Size limit check on export */}
                        {exported.blob.size / 1024 > activeProfile.maxFileSizeKB ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>
                              Exported file ({formatFileSize(exported.blob.size)}) exceeds the
                              profile limit of {activeProfile.maxFileSizeKB} KB. Try lowering
                              the JPEG quality or switching to JPEG format.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>
                              File size ({formatFileSize(exported.blob.size)}) is within the
                              profile limit of {activeProfile.maxFileSizeKB} KB.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* ═══ Privacy notice ═══ */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 text-sm text-muted-foreground">
            <Shield className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <p className="font-medium text-foreground">Your privacy is protected</p>
              <p className="mt-1">
                All processing happens locally in your browser. Your photos are never
                uploaded to any server. No data is collected or stored. This tool does not
                apply beauty filters, face reshaping, or any AI-based facial manipulation.
              </p>
            </div>
          </div>

          {/* ═══ How It Works ═══ */}
          <div className="max-w-4xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-8 text-center">How to Validate Your Passport Photo</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Select Profile', desc: 'Choose your country or custom dimensions for the passport photo requirements.' },
                { step: '2', title: 'Upload Photo', desc: 'Drop your photo to see an instant check of dimensions, file size, format, and more.' },
                { step: '3', title: 'Crop & Position', desc: 'Use the crop tool to frame your face correctly with the positioning guides.' },
                { step: '4', title: 'Export & Download', desc: 'Get your resized, cropped photo ready for submission.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                    {step}
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">{title}</h3>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ FAQ ═══ */}
          <div className="max-w-3xl mx-auto mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
            <div className="space-y-3">
              <FAQItem
                q="Does this tool guarantee my photo will be accepted?"
                a="No. This tool checks common technical requirements (dimensions, file size, format) but cannot guarantee official acceptance. Always verify the latest requirements from the relevant passport authority."
              />
              <FAQItem
                q="Is my photo uploaded to a server?"
                a="No. All processing happens entirely in your browser. Your photo never leaves your device, ensuring complete privacy."
              />
              <FAQItem
                q="Can I use this for visa or ID photos too?"
                a="Yes. You can select a matching profile or use the Custom option to set any dimensions. The same technical checks apply."
              />
              <FAQItem
                q="What if face detection does not work?"
                a="Face detection depends on browser support (currently Chrome-based browsers only). If unavailable, you can manually position the face using the crop tool and head-positioning guide lines."
              />
              <FAQItem
                q="Does this tool alter my face or apply filters?"
                a="No. This tool does not apply any beauty filters, face reshaping, or AI-based facial manipulation. It only crops, resizes, and re-encodes your photo."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── FAQ sub-component ── */

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
      >
        {q}
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 text-muted-foreground text-sm leading-relaxed border-t border-border/50 bg-muted/20">
          {a}
        </div>
      )}
    </div>
  );
};
