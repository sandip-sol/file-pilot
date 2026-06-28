import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { RelatedTools } from '../components/RelatedTools';
import { ToolUsageTracker } from '../components/ToolUsageTracker';
import { toast } from 'sonner';
import {
  socialMediaPlatforms,
  type SocialMediaPlatform,
  type SocialMediaPreset,
} from '../data/socialMediaPresets';
import {
  drawFitCanvas,
  encodeCanvas,
  downloadAsZip,
  downloadBlob,
  formatFileSize,
  type FitMode,
} from '../utils/image/batchExport';
import type { ImageFormat } from '../utils/image/types';
import {
  getFormatLabel,
  getFormatExtension,
  stripBasename,
} from '../utils/image/support';
import { FAQSection } from '../components/FAQSection';
import {
  Share2,
  Sparkles,
  Download,
  Loader2,
  Trash2,
  Archive,
  RefreshCw,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  Plus,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type OutputFormatOption = 'preset' | ImageFormat;

interface SourceImage {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  previewUrl: string;
}

interface GeneratedOutput {
  id: string;
  sourceImageName: string;
  presetName: string;
  platformName: string;
  width: number;
  height: number;
  format: ImageFormat;
  blob: Blob;
  filename: string;
  fileSize: number;
  previewUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildSocialFilename(
  basename: string,
  platformId: string,
  presetName: string,
  width: number,
  height: number,
  format: ImageFormat,
): string {
  const slug = presetName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const ext = getFormatExtension(format);
  return `${basename}-${platformId}-${slug}-${width}x${height}.${ext}`;
}

let sourceIdCounter = 0;
function nextSourceId(): string {
  sourceIdCounter += 1;
  return `src-${sourceIdCounter}-${Date.now()}`;
}

let outputIdCounter = 0;
function nextOutputId(): string {
  outputIdCounter += 1;
  return `out-${outputIdCounter}-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const SocialMediaResizer = () => {
  /* ---------- source images ---------- */
  const [sources, setSources] = useState<SourceImage[]>([]);

  /* ---------- preset selection ---------- */
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(
    new Set(socialMediaPlatforms.map((p) => p.id)),
  );

  /* ---------- custom size ---------- */
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);

  /* ---------- resize options ---------- */
  const [fitMode, setFitMode] = useState<FitMode>('cover');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [outputFormat, setOutputFormat] = useState<OutputFormatOption>('preset');
  const [quality, setQuality] = useState(0.85);

  /* ---------- processing ---------- */
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [results, setResults] = useState<GeneratedOutput[]>([]);

  /* ---------- refs for cleanup ---------- */
  const sourceUrlsRef = useRef<string[]>([]);
  const resultUrlsRef = useRef<string[]>([]);

  /* ---------- cleanup object URLs ---------- */
  useEffect(() => {
    return () => {
      sourceUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      resultUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const revokeResultUrls = useCallback(() => {
    resultUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    resultUrlsRef.current = [];
  }, []);

  const revokeSourceUrls = useCallback(() => {
    sourceUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    sourceUrlsRef.current = [];
  }, []);

  /* ---------- derived ---------- */
  const showQualitySlider =
    outputFormat === 'image/jpeg' || outputFormat === 'image/webp';
  const showBgColor = fitMode === 'contain';

  const totalSelectedPresets = selectedPresetIds.size + (useCustomSize ? 1 : 0);

  const resolveFormat = useCallback(
    (preset: SocialMediaPreset | null): ImageFormat => {
      if (outputFormat !== 'preset') return outputFormat;
      if (preset) return preset.format;
      return 'image/jpeg';
    },
    [outputFormat],
  );

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleFilesSelected = async (files: File[]) => {
    const loaded: SourceImage[] = [];
    for (const file of files) {
      try {
        const bitmap = await createImageBitmap(file);
        const url = URL.createObjectURL(file);
        sourceUrlsRef.current.push(url);
        loaded.push({
          id: nextSourceId(),
          file,
          name: file.name,
          size: file.size,
          width: bitmap.width,
          height: bitmap.height,
          previewUrl: url,
        });
        bitmap.close();
      } catch {
        toast.error(`Failed to load ${file.name}`);
      }
    }
    if (loaded.length === 0) return;
    setSources((prev) => [...prev, ...loaded]);
    revokeResultUrls();
    setResults([]);
  };

  const removeSource = (id: string) => {
    setSources((prev) => {
      const removed = prev.find((s) => s.id === id);
      if (removed) {
        const idx = sourceUrlsRef.current.indexOf(removed.previewUrl);
        if (idx !== -1) {
          URL.revokeObjectURL(removed.previewUrl);
          sourceUrlsRef.current.splice(idx, 1);
        }
      }
      return prev.filter((s) => s.id !== id);
    });
    revokeResultUrls();
    setResults([]);
  };

  /* ---------- preset selection ---------- */
  const togglePreset = (presetId: string) => {
    setSelectedPresetIds((prev) => {
      const next = new Set(prev);
      if (next.has(presetId)) {
        next.delete(presetId);
      } else {
        next.add(presetId);
      }
      return next;
    });
    setResults([]);
  };

  const togglePlatformAll = (platform: SocialMediaPlatform) => {
    const allSelected = platform.presets.every((p) =>
      selectedPresetIds.has(p.id),
    );
    setSelectedPresetIds((prev) => {
      const next = new Set(prev);
      for (const p of platform.presets) {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      }
      return next;
    });
    setResults([]);
  };

  const togglePlatformExpand = (platformId: string) => {
    setExpandedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  };

  /* ---------- process ---------- */
  const handleProcess = async () => {
    if (sources.length === 0) {
      toast.error('Please upload at least one image.');
      return;
    }
    if (totalSelectedPresets === 0) {
      toast.error('Please select at least one preset or enable a custom size.');
      return;
    }
    if (useCustomSize && (customWidth < 1 || customHeight < 1)) {
      toast.error('Custom width and height must be at least 1 pixel.');
      return;
    }

    // Build the list of target presets (including custom)
    const targets: Array<{
      preset: SocialMediaPreset | null;
      width: number;
      height: number;
      platformName: string;
      presetName: string;
      platformId: string;
    }> = [];

    for (const platform of socialMediaPlatforms) {
      for (const preset of platform.presets) {
        if (selectedPresetIds.has(preset.id)) {
          targets.push({
            preset,
            width: preset.width,
            height: preset.height,
            platformName: platform.name,
            presetName: preset.name,
            platformId: platform.id,
          });
        }
      }
    }

    if (useCustomSize) {
      targets.push({
        preset: null,
        width: customWidth,
        height: customHeight,
        platformName: 'Custom',
        presetName: 'Custom Size',
        platformId: 'custom',
      });
    }

    const total = sources.length * targets.length;
    setIsProcessing(true);
    setProgressCurrent(0);
    setProgressTotal(total);
    revokeResultUrls();
    setResults([]);

    const outputs: GeneratedOutput[] = [];
    let processed = 0;

    for (const source of sources) {
      let bitmap: ImageBitmap | null = null;
      try {
        bitmap = await createImageBitmap(source.file);

        for (const target of targets) {
          try {
            const fmt = resolveFormat(target.preset);
            const canvas = drawFitCanvas(
              bitmap,
              target.width,
              target.height,
              fitMode,
              bgColor,
            );
            const blob = await encodeCanvas(canvas, fmt, quality, bgColor);

            const basename = stripBasename(source.name);
            const filename = buildSocialFilename(
              basename,
              target.platformId,
              target.presetName,
              target.width,
              target.height,
              fmt,
            );

            const previewUrl = URL.createObjectURL(blob);
            resultUrlsRef.current.push(previewUrl);

            outputs.push({
              id: nextOutputId(),
              sourceImageName: source.name,
              presetName: target.presetName,
              platformName: target.platformName,
              width: target.width,
              height: target.height,
              format: fmt,
              blob,
              filename,
              fileSize: blob.size,
              previewUrl,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            toast.error(
              `Failed to process ${source.name} for ${target.presetName}: ${msg}`,
            );
          }

          processed += 1;
          setProgressCurrent(processed);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Failed to load ${source.name}: ${msg}`);
        processed += targets.length;
        setProgressCurrent(processed);
      } finally {
        if (bitmap) bitmap.close();
      }
    }

    setResults(outputs);
    setIsProcessing(false);

    if (outputs.length > 0) {
      toast.success(
        `Generated ${outputs.length} image${outputs.length > 1 ? 's' : ''} successfully.`,
      );
    }
  };

  /* ---------- downloads ---------- */
  const handleDownloadSingle = (output: GeneratedOutput) => {
    downloadBlob(output.blob, output.filename);
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    const items = results.map((r) => ({
      filename: r.filename,
      blob: r.blob,
    }));
    try {
      await downloadAsZip(items, 'social-media-images.zip');
      toast.success('ZIP downloaded.');
    } catch {
      toast.error('Failed to create ZIP file.');
    }
  };

  /* ---------- reset ---------- */
  const handleReset = () => {
    revokeSourceUrls();
    revokeResultUrls();
    setSources([]);
    setResults([]);
    setSelectedPresetIds(new Set());
    setExpandedPlatforms(
      new Set(socialMediaPlatforms.map((p) => p.id)),
    );
    setUseCustomSize(false);
    setCustomWidth(1080);
    setCustomHeight(1080);
    setFitMode('cover');
    setBgColor('#ffffff');
    setOutputFormat('preset');
    setQuality(0.85);
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const faqItems = [
    { question: "Which social media platforms are supported?", answer: "FilePilot includes recommended export sizes for Instagram, Facebook, LinkedIn, X (Twitter), YouTube, Pinterest, and TikTok. Each platform has multiple presets covering posts, stories, profile pictures, banners, and more." },
    { question: "Can I resize for multiple platforms at once?", answer: "Yes. You can select multiple presets across different platforms and process all of them in a single batch. The tool generates one output per preset per source image, and you can download everything as a ZIP file." },
    { question: "What output quality can I expect?", answer: "Output quality depends on your source image resolution and the selected fit mode. You can choose between cover (crop to fill), contain (fit with padding), or stretch, and adjust JPEG/WebP quality from 10% to 100%." },
    { question: "Are my images uploaded anywhere?", answer: "No. All processing happens entirely in your browser. Your images are never uploaded to any server, and closing the tab removes all data immediately." },
  ];

  return (
    <div>
      <PageSeo
        title="Social Media Resizer — FilePilot"
        description="Resize images for Instagram, Facebook, LinkedIn, X/Twitter, YouTube, Pinterest, and TikTok. Free, private, browser-based."
        faqItems={faqItems}
      />
      <ToolUsageTracker />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
              <Share2 className="w-6 h-6" />
            </div>
          </div>
          <h1>Social Media Resizer</h1>
          <p>
            Resize images to the perfect dimensions for every social media
            platform.
          </p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Processed locally in your browser. No uploads.
          </p>
        </div>
      </div>

      <div className="container py-8 max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Upload */}
          {sources.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple
                description="Drop images here to resize for social media"
                hint="Supports JPG, PNG, and WebP. Multiple images allowed."
              />
            </div>
          ) : (
            <>
              {/* Source Images */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">
                    Images ({sources.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.files) {
                          handleFilesSelected(Array.from(target.files));
                        }
                      };
                      input.click();
                    }}
                    className="btn btn-outline text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add More
                  </button>
                </div>
                <div className="space-y-3">
                  {sources.map((src) => (
                    <div
                      key={src.id}
                      className="flex items-center gap-4 bg-muted/40 rounded-xl p-3 border border-border"
                    >
                      <img
                        src={src.previewUrl}
                        alt={src.name}
                        className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {src.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {src.width} &times; {src.height} px &middot;{' '}
                          {formatFileSize(src.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSource(src.id)}
                        className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                        aria-label={`Remove ${src.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preset Selection */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold">
                    Select Export Sizes
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    These are recommended export sizes. Platform requirements
                    may change.
                  </p>
                </div>

                <div className="space-y-3">
                  {socialMediaPlatforms.map((platform) => {
                    const isExpanded = expandedPlatforms.has(platform.id);
                    const selectedCount = platform.presets.filter((p) =>
                      selectedPresetIds.has(p.id),
                    ).length;
                    const allSelected =
                      selectedCount === platform.presets.length;
                    const someSelected = selectedCount > 0 && !allSelected;

                    return (
                      <div
                        key={platform.id}
                        className="border border-border rounded-xl overflow-hidden"
                      >
                        {/* Platform header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                          <button
                            type="button"
                            onClick={() => togglePlatformExpand(platform.id)}
                            className="p-0.5 rounded hover:bg-muted transition-colors"
                            aria-label={
                              isExpanded
                                ? `Collapse ${platform.name}`
                                : `Expand ${platform.name}`
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>

                          <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected;
                              }}
                              onChange={() => togglePlatformAll(platform)}
                              className="w-4 h-4 rounded border-border accent-foreground cursor-pointer"
                            />
                            <span className="text-sm font-semibold">
                              {platform.name}
                            </span>
                          </label>

                          {selectedCount > 0 && (
                            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                              {selectedCount} selected
                            </span>
                          )}
                        </div>

                        {/* Preset checkboxes */}
                        {isExpanded && (
                          <div className="px-4 py-3 space-y-2">
                            {platform.presets.map((preset) => (
                              <label
                                key={preset.id}
                                className="flex items-center gap-3 cursor-pointer group py-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPresetIds.has(preset.id)}
                                  onChange={() => togglePreset(preset.id)}
                                  className="w-4 h-4 rounded border-border accent-foreground cursor-pointer"
                                />
                                <span className="text-sm font-medium group-hover:text-foreground text-[var(--text-secondary)] flex-1">
                                  {preset.name}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {preset.width} &times; {preset.height}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {preset.aspectRatio}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {getFormatLabel(preset.format)}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Custom size option */}
                <div className="border border-border rounded-xl px-4 py-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomSize}
                      onChange={(e) => {
                        setUseCustomSize(e.target.checked);
                        setResults([]);
                      }}
                      className="w-4 h-4 rounded border-border accent-foreground cursor-pointer"
                    />
                    <span className="text-sm font-semibold">Custom Size</span>
                  </label>

                  {useCustomSize && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          value={customWidth}
                          onChange={(e) => {
                            setCustomWidth(
                              Math.max(1, parseInt(e.target.value) || 1),
                            );
                            setResults([]);
                          }}
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>
                      <span className="text-muted-foreground font-medium mt-5">
                        &times;
                      </span>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          value={customHeight}
                          onChange={(e) => {
                            setCustomHeight(
                              Math.max(1, parseInt(e.target.value) || 1),
                            );
                            setResults([]);
                          }}
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {totalSelectedPresets > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {totalSelectedPresets} size
                    {totalSelectedPresets > 1 ? 's' : ''} selected &middot;{' '}
                    {sources.length} image{sources.length > 1 ? 's' : ''}{' '}
                    &rarr;{' '}
                    <span className="font-semibold text-foreground">
                      {totalSelectedPresets * sources.length} output
                      {totalSelectedPresets * sources.length > 1 ? 's' : ''}
                    </span>
                  </p>
                )}
              </div>

              {/* Resize Options */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                <h2 className="text-lg font-bold">Resize Options</h2>

                {/* Fit Mode */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                    Resize Behavior
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        {
                          value: 'cover',
                          label: 'Cover / Crop',
                          desc: 'Fill the frame, crop overflow.',
                        },
                        {
                          value: 'contain',
                          label: 'Contain',
                          desc: 'Fit inside, pad with background.',
                        },
                        {
                          value: 'stretch',
                          label: 'Stretch',
                          desc: 'Stretch to exact size.',
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFitMode(opt.value);
                          setResults([]);
                        }}
                        className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm text-left ${
                          fitMode === opt.value
                            ? 'border-foreground bg-muted text-foreground'
                            : 'border-border hover:border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        <span className="block">{opt.label}</span>
                        <span className="block text-xs font-normal mt-0.5 opacity-80">
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background color */}
                {showBgColor && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => {
                          setBgColor(e.target.value);
                          setResults([]);
                        }}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground font-medium">
                        {bgColor}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used to fill padding areas in contain mode.
                    </p>
                  </div>
                )}

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                    Output Format
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => {
                      setOutputFormat(e.target.value as OutputFormatOption);
                      setResults([]);
                    }}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="preset">
                      Use preset default
                    </option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </div>

                {/* Quality slider */}
                {showQualitySlider && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                      Quality: {Math.round(quality * 100)}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={Math.round(quality * 100)}
                      onChange={(e) =>
                        setQuality(parseInt(e.target.value) / 100)
                      }
                      className="w-full accent-foreground"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>10%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleProcess}
                    disabled={
                      isProcessing ||
                      sources.length === 0 ||
                      totalSelectedPresets === 0
                    }
                    className={`btn btn-primary flex-1 py-4 text-base ${
                      isProcessing ? 'opacity-75 cursor-wait' : ''
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing {progressCurrent} of {progressTotal}...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5" />
                        Generate{' '}
                        {totalSelectedPresets * sources.length > 0
                          ? `${totalSelectedPresets * sources.length} `
                          : ''}
                        Image{totalSelectedPresets * sources.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn btn-outline py-4 text-base sm:flex-none sm:px-6"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reset
                  </button>
                </div>

                {/* Progress bar */}
                {isProcessing && progressTotal > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-foreground h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(progressCurrent / progressTotal) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 text-center">
                      {progressCurrent} / {progressTotal} completed
                    </p>
                  </div>
                )}
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-lg font-bold">
                        Results ({results.length})
                      </h2>
                    </div>
                    {results.length > 1 && (
                      <button
                        type="button"
                        onClick={handleDownloadAll}
                        className="btn btn-outline text-sm"
                      >
                        <Archive className="w-4 h-4" />
                        Download All as ZIP
                      </button>
                    )}
                  </div>

                  {/* Results table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-3 pr-3 font-semibold text-muted-foreground">
                            Preview
                          </th>
                          <th className="pb-3 pr-3 font-semibold text-muted-foreground">
                            Source
                          </th>
                          <th className="pb-3 pr-3 font-semibold text-muted-foreground">
                            Preset
                          </th>
                          <th className="pb-3 pr-3 font-semibold text-muted-foreground">
                            Dimensions
                          </th>
                          <th className="pb-3 pr-3 font-semibold text-muted-foreground">
                            Format
                          </th>
                          <th className="pb-3 pr-3 font-semibold text-muted-foreground">
                            Size
                          </th>
                          <th className="pb-3 font-semibold text-muted-foreground">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((output) => (
                          <tr
                            key={output.id}
                            className="border-b border-border/50 last:border-b-0"
                          >
                            <td className="py-3 pr-3">
                              <img
                                src={output.previewUrl}
                                alt={output.filename}
                                className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                              />
                            </td>
                            <td className="py-3 pr-3">
                              <span className="truncate max-w-[160px] block font-medium">
                                {output.sourceImageName}
                              </span>
                            </td>
                            <td className="py-3 pr-3">
                              <span className="block font-medium">
                                {output.platformName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {output.presetName}
                              </span>
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap">
                              {output.width} &times; {output.height}
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap">
                              {getFormatLabel(output.format)}
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap">
                              {formatFileSize(output.fileSize)}
                            </td>
                            <td className="py-3">
                              <button
                                type="button"
                                onClick={() => handleDownloadSingle(output)}
                                className="btn btn-outline text-xs px-3 py-1.5"
                                aria-label={`Download ${output.filename}`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card view */}
                  <div className="md:hidden space-y-3 mt-4">
                    {results.map((output) => (
                      <div
                        key={`mobile-${output.id}`}
                        className="flex items-center gap-3 bg-muted/40 rounded-xl p-3 border border-border"
                      >
                        <img
                          src={output.previewUrl}
                          alt={output.filename}
                          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {output.platformName} &mdash; {output.presetName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {output.width} &times; {output.height} &middot;{' '}
                            {getFormatLabel(output.format)} &middot;{' '}
                            {formatFileSize(output.fileSize)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {output.sourceImageName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(output)}
                          className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          aria-label={`Download ${output.filename}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Download all (bottom) */}
                  {results.length > 1 && (
                    <button
                      type="button"
                      onClick={handleDownloadAll}
                      className="btn btn-primary w-full py-4 text-base mt-5"
                    >
                      <Archive className="w-5 h-5" />
                      Download All as ZIP ({results.length} files)
                    </button>
                  )}
                </div>
              )}

              {/* Privacy note */}
              <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <p>
                  All processing happens locally in your browser. Your images
                  are never uploaded to any server. Close this tab and
                  everything is gone.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <FAQSection items={faqItems} />
      <RelatedTools />
    </div>
  );
};
