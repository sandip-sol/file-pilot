import { useState, useCallback, useEffect, useRef } from 'react';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { RelatedTools } from '../components/RelatedTools';
import { ToolUsageTracker } from '../components/ToolUsageTracker';
import { toast } from 'sonner';
import {
  Loader2, Download, RefreshCw, Gem, Copy, Check,
  Sparkles,
} from 'lucide-react';
import { generateHtmlSnippet, generateWebManifest } from '../data/faviconConfig';
import {
  generateFavicons,
  generateFaviconZip,
  generatePreview,
  type FaviconAsset,
} from '../utils/favicon/faviconGenerator';
import { downloadBlob } from '../utils/image/batchExport';
import { formatFileSize } from '../utils/image/support';

export const FaviconGenerator = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceBitmap, setSourceBitmap] = useState<ImageBitmap | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);

  const [useBg, setUseBg] = useState(false);
  const [bgColorValue, setBgColorValue] = useState('#ffffff');
  const [padding, setPadding] = useState(8);
  const [borderRadius, setBorderRadius] = useState(0);

  const [assets, setAssets] = useState<FaviconAsset[]>([]);
  const [processing, setProcessing] = useState(false);
  const [tabPreview, setTabPreview] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const assetUrlsRef = useRef<string[]>([]);
  const sourceBitmapRef = useRef<ImageBitmap | null>(null);
  const sourcePreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    sourceBitmapRef.current = sourceBitmap;
  }, [sourceBitmap]);

  useEffect(() => {
    sourcePreviewUrlRef.current = sourcePreviewUrl;
  }, [sourcePreviewUrl]);

  useEffect(() => {
    return () => {
      if (sourcePreviewUrlRef.current) URL.revokeObjectURL(sourcePreviewUrlRef.current);
      sourceBitmapRef.current?.close();
      assetUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    };
  }, []);

  useEffect(() => {
    if (!sourceBitmap) {
      setTabPreview(null);
      return;
    }
    const effectiveBg = useBg ? bgColorValue : null;
    const preview = generatePreview(sourceBitmap, 32, effectiveBg, padding, borderRadius);
    setTabPreview(preview);
  }, [sourceBitmap, useBg, bgColorValue, padding, borderRadius]);

  const handleFile = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    sourceBitmap?.close();
    assetUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    assetUrlsRef.current = [];
    setAssets([]);

    try {
      const bitmap = await createImageBitmap(file);
      setSourceFile(file);
      setSourceBitmap(bitmap);
      setSourcePreviewUrl(URL.createObjectURL(file));
    } catch {
      toast.error('Could not load image. File may be corrupt or unsupported.');
    }
  }, [sourcePreviewUrl, sourceBitmap]);

  const handleGenerate = useCallback(async () => {
    if (!sourceBitmap) return;
    setProcessing(true);

    assetUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    assetUrlsRef.current = [];

    try {
      const effectiveBg = useBg ? bgColorValue : null;
      const result = await generateFavicons(sourceBitmap, effectiveBg, padding, borderRadius);
      assetUrlsRef.current = result.map(a => a.previewUrl);
      setAssets(result);
      toast.success(`${result.length} favicon assets generated`);
    } catch (err) {
      toast.error(`Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  }, [sourceBitmap, useBg, bgColorValue, padding, borderRadius]);

  const handleDownloadZip = useCallback(async () => {
    if (assets.length === 0) return;
    try {
      const zipBlob = await generateFaviconZip(assets);
      downloadBlob(zipBlob, 'favicons.zip');
    } catch {
      toast.error('Failed to create ZIP file.');
    }
  }, [assets]);

  const handleDownloadSingle = useCallback((asset: FaviconAsset) => {
    downloadBlob(asset.blob, asset.size.filename);
  }, []);

  const handleCopyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateHtmlSnippet());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('HTML snippet copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }, []);

  const handleReset = useCallback(() => {
    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    sourceBitmap?.close();
    assetUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    assetUrlsRef.current = [];
    setSourceFile(null);
    setSourceBitmap(null);
    setSourcePreviewUrl(null);
    setAssets([]);
    setTabPreview(null);
  }, [sourcePreviewUrl, sourceBitmap]);

  const htmlSnippet = generateHtmlSnippet();

  return (
    <div>
      <PageSeo
        title="Favicon Generator — FilePilot"
        description="Generate all website favicon and app icon assets from a single image. Creates PNG favicons, Apple touch icons, Android/PWA icons, and a web manifest."
      />
      <ToolUsageTracker />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
              <Gem className="w-6 h-6" />
            </div>
          </div>
          <h1>Favicon Generator</h1>
          <p>Generate all website favicon and app icon assets from a single image.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Your files are processed locally in your browser and are not uploaded.
          </p>
        </div>
      </div>

      <div className="container pb-12 max-w-5xl mx-auto">
        {!sourceFile ? (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <FileUploader
            onFilesSelected={handleFile}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            multiple={false}
            description="Drop your logo or icon image here"
            hint="Upload a PNG, JPEG, WebP, or SVG image. Square images work best."
          />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Source + Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source preview */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold mb-3">Source Image</h2>
                <div className="flex items-center justify-center bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] rounded-lg p-4 mb-3" style={{ minHeight: 200 }}>
                  <img src={sourcePreviewUrl!} alt="Source" className="max-w-full max-h-48 object-contain" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {sourceFile.name} · {sourceBitmap ? `${sourceBitmap.width}×${sourceBitmap.height}` : ''} · {formatFileSize(sourceFile.size)}
                </p>
                {sourceBitmap && sourceBitmap.width !== sourceBitmap.height && (
                  <p className="text-xs text-amber-600 mt-1">Non-square image — artwork will be centered and scaled to fit the square icon area.</p>
                )}
              </div>

              {/* Settings */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="text-lg font-semibold">Settings</h2>

                {/* Background */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mb-2">
                    <input type="checkbox" checked={useBg} onChange={e => setUseBg(e.target.checked)} className="rounded" />
                    Background Color
                  </label>
                  {useBg && (
                    <div className="flex items-center gap-2">
                      <input type="color" value={bgColorValue} onChange={e => setBgColorValue(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                      <span className="text-sm text-muted-foreground">{bgColorValue}</span>
                    </div>
                  )}
                  {!useBg && (
                    <p className="text-xs text-muted-foreground">Transparent background (where supported)</p>
                  )}
                </div>

                {/* Padding */}
                <div>
                  <label htmlFor="fav-padding" className="block text-sm font-medium mb-1">Padding ({padding}px)</label>
                  <input id="fav-padding" type="range" min={0} max={64} value={padding} onChange={e => setPadding(Number(e.target.value))} className="w-full" />
                </div>

                {/* Border radius (preview only) */}
                <div>
                  <label htmlFor="fav-radius" className="block text-sm font-medium mb-1">Corner Radius ({borderRadius}px)</label>
                  <input id="fav-radius" type="range" min={0} max={128} value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))} className="w-full" />
                  <p className="text-xs text-muted-foreground">Preview only for app icon appearance. PNG icons are always square.</p>
                </div>

                {/* Browser tab preview */}
                {tabPreview && (
                  <div>
                    <p className="text-sm font-medium mb-2">Browser Tab Preview</p>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-100 border border-border px-3 py-2">
                      <img src={tabPreview} alt="Tab preview" className="w-4 h-4" />
                      <span className="text-sm text-muted-foreground">Your Website Title</span>
                    </div>
                  </div>
                )}

                {/* Generate */}
                <div className="space-y-2 pt-2">
                  <button onClick={handleGenerate} disabled={processing} className="w-full btn btn-primary py-2.5">
                    {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Gem className="w-4 h-4" /> Generate Favicons</>}
                  </button>
                  <button onClick={handleReset} className="w-full btn btn-outline py-2">
                    <RefreshCw className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Generated assets */}
            {assets.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{assets.length} Assets Generated</h2>
                  <button onClick={handleDownloadZip} className="btn btn-primary py-2 px-4 text-sm">
                    <Download className="w-4 h-4" /> Download All (ZIP)
                  </button>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Preview</th>
                        <th className="px-4 py-2 text-left font-medium">Size</th>
                        <th className="px-4 py-2 text-left font-medium">Filename</th>
                        <th className="px-4 py-2 text-left font-medium">Purpose</th>
                        <th className="px-4 py-2 text-left font-medium">File Size</th>
                        <th className="px-4 py-2 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map(asset => (
                        <tr key={asset.size.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-center w-10 h-10 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:8px_8px] rounded">
                              <img src={asset.previewUrl} alt={asset.size.label} className="max-w-full max-h-full" style={{ imageRendering: asset.size.width <= 32 ? 'pixelated' : 'auto' }} />
                            </div>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{asset.size.width}×{asset.size.height}</td>
                          <td className="px-4 py-2 font-mono text-xs">{asset.size.filename}</td>
                          <td className="px-4 py-2 text-muted-foreground text-xs">{asset.size.purpose}{asset.size.maskable ? ' (maskable)' : ''}</td>
                          <td className="px-4 py-2 text-xs">{formatFileSize(asset.blob.size)}</td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => handleDownloadSingle(asset)} className="text-blue-600 hover:underline text-xs font-medium">
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* HTML snippet */}
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">HTML Snippet</h3>
                    <button onClick={handleCopyHtml} className="btn btn-outline py-1 px-3 text-xs">
                      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                  <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{htmlSnippet}</pre>
                </div>

                {/* Web manifest */}
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold">site.webmanifest</h3>
                  <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{generateWebManifest()}</pre>
                  <p className="text-xs text-muted-foreground">This file is included in the ZIP download. Update the name and short_name fields.</p>
                </div>

                {/* ICO notice */}
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">About .ico files</p>
                  <p className="mt-1">
                    This tool generates PNG favicon assets. A <code className="bg-muted rounded px-1">favicon.ico</code> file is not included because generating a true ICO format
                    requires a dedicated encoder. Modern browsers support PNG favicons directly. Use the HTML snippet above to reference the PNG files.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <RelatedTools />
    </div>
  );
};
