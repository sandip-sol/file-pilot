import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileUploader } from '../components/FileUploader';
import { PageSeo } from '../components/PageSeo';
import { toast } from 'sonner';
import { loadImageFile, revokeImageUrls } from '../utils/image/processing';
import { analyzeImage, ALL_USE_CASES } from '../utils/image/analysis';
import type { IntendedUse } from '../utils/image/analysis';
import type { ImageFileInfo, AnalysisResult, Recommendation } from '../utils/image/types';
import {
  FileSearch,
  Sparkles,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  ImageMinus,
  Scaling,
  Replace,
  Globe,
  ImageIcon,
  Loader2,
} from 'lucide-react';

const CATEGORY_ORDER: Recommendation['category'][] = [
  'quality',
  'dimensions',
  'file-weight',
  'format',
  'privacy',
];

const CATEGORY_LABELS: Record<Recommendation['category'], string> = {
  quality: 'Quality',
  dimensions: 'Dimensions',
  'file-weight': 'File Weight',
  format: 'Format',
  privacy: 'Privacy & Metadata',
};

const SEVERITY_CONFIG: Record<
  Recommendation['severity'],
  { icon: typeof AlertTriangle; color: string }
> = {
  warning: { icon: AlertTriangle, color: 'text-amber-600' },
  info: { icon: Info, color: 'text-blue-600' },
  success: { icon: CheckCircle, color: 'text-emerald-600' },
};

const ACTION_LINKS = [
  { to: '/compress-image', label: 'Compress Image', icon: ImageMinus },
  { to: '/resize-image', label: 'Resize Image', icon: Scaling },
  { to: '/convert-image', label: 'Convert Image', icon: Replace },
  { to: '/website-image-optimiser', label: 'Website Optimiser', icon: Globe },
];

export const ImageQualityAnalyzer = () => {
  const [imageInfo, setImageInfo] = useState<ImageFileInfo | null>(null);
  const [intendedUse, setIntendedUse] = useState<IntendedUse>('website-content');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    return () => {
      if (imageInfo) revokeImageUrls([imageInfo]);
    };
  }, [imageInfo]);

  const runAnalysis = useCallback(
    async (info: ImageFileInfo, use: IntendedUse) => {
      setIsAnalyzing(true);
      try {
        const result = await analyzeImage(info, use);
        setAnalysis(result);
      } catch {
        toast.error('Failed to analyze image');
        setAnalysis(null);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const handleFileSelected = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      if (imageInfo) revokeImageUrls([imageInfo]);
      setAnalysis(null);
      setIsAnalyzing(true);

      try {
        const info = await loadImageFile(file);
        setImageInfo(info);
        await runAnalysis(info, intendedUse);
      } catch {
        toast.error(`Failed to load ${file.name}`);
        setIsAnalyzing(false);
      }
    },
    [imageInfo, intendedUse, runAnalysis],
  );

  const handleUseCaseChange = useCallback(
    (use: IntendedUse) => {
      setIntendedUse(use);
      if (imageInfo) {
        runAnalysis(imageInfo, use);
      }
    },
    [imageInfo, runAnalysis],
  );

  const handleReset = useCallback(() => {
    if (imageInfo) revokeImageUrls([imageInfo]);
    setImageInfo(null);
    setAnalysis(null);
    setIntendedUse('website-content');
  }, [imageInfo]);

  const groupedRecommendations = analysis
    ? CATEGORY_ORDER.reduce<Record<string, Recommendation[]>>((acc, category) => {
        const items = analysis.recommendations.filter((r) => r.category === category);
        if (items.length > 0) acc[category] = items;
        return acc;
      }, {})
    : {};

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo
        title="Image Quality Analyzer - Check Image Resolution & Format"
        description="Analyze image quality, resolution, file size, and format suitability for web, print, and social media. Free, private, no uploads."
      />

      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
              <FileSearch className="w-6 h-6" />
            </div>
          </div>
          <h1>Image Quality Analyzer</h1>
          <p>Check resolution, format, and suitability for your intended use.</p>
          <p className="mt-2 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Processed locally in your browser. No uploads.
          </p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            {!imageInfo ? (
              <FileUploader
                onFilesSelected={handleFileSelected}
                accept="image/*"
                description="Drop an image here to analyze"
              />
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    {imageInfo.name}
                  </h2>
                  <button
                    onClick={handleReset}
                    className="btn btn-outline text-sm py-2 px-3"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Image
                  </button>
                </div>

                <div className="flex justify-center rounded-xl border border-border bg-muted/30 p-4">
                  <img
                    src={imageInfo.previewUrl}
                    alt={imageInfo.name}
                    className="max-w-full max-h-80 rounded-lg object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {imageInfo && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in">
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Choose intended use
              </label>
              <select
                value={intendedUse}
                onChange={(e) => handleUseCaseChange(e.target.value as IntendedUse)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
              >
                {ALL_USE_CASES.map((uc) => (
                  <option key={uc.id} value={uc.id}>
                    {uc.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in">
              <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Analyzing image...</span>
              </div>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <>
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6">
                <h2 className="text-lg font-bold">Analysis Dashboard</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Filename" value={analysis.filename} />
                  <StatCard label="File Type" value={analysis.fileType} />
                  <StatCard label="MIME Type" value={analysis.mimeType} />
                  <StatCard label="File Size" value={analysis.fileSizeFormatted} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Dimensions" value={`${analysis.width} x ${analysis.height} px`} />
                  <StatCard label="Aspect Ratio" value={analysis.aspectRatio} />
                  <StatCard label="Megapixels" value={`${analysis.megapixels} MP`} />
                  <StatCard
                    label="Transparency"
                    value={analysis.hasTransparency ? 'Yes' : 'No'}
                    valueColor={analysis.hasTransparency ? 'text-emerald-600' : 'text-muted-foreground'}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Estimated DPI" value={analysis.estimatedDPI} />
                  <StatCard label="Color Depth" value={analysis.colorDepth} />
                </div>
              </div>

              {analysis.recommendations.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6">
                  <h2 className="text-lg font-bold">Recommendations</h2>

                  {CATEGORY_ORDER.map((category) => {
                    const items = groupedRecommendations[category];
                    if (!items) return null;

                    return (
                      <div key={category} className="space-y-3">
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
                          {CATEGORY_LABELS[category]}
                        </h3>
                        <div className="space-y-2">
                          {items.map((rec, idx) => {
                            const config = SEVERITY_CONFIG[rec.severity];
                            const SeverityIcon = config.icon;
                            const bgClass =
                              rec.severity === 'warning'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : rec.severity === 'info'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100';

                            return (
                              <div
                                key={`${category}-${idx}`}
                                className={`${bgClass} p-4 rounded-xl flex items-start gap-3 text-sm`}
                              >
                                <SeverityIcon className={`w-5 h-5 shrink-0 mt-0.5 ${config.color}`} />
                                <div>
                                  <p className="font-medium">{rec.title}</p>
                                  <p className="mt-1">{rec.message}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in space-y-4">
                <h2 className="text-lg font-bold">Take Action</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ACTION_LINKS.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <Link
                        key={action.to}
                        to={action.to}
                        className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-foreground/30 hover:shadow-sm transition-all bg-card"
                      >
                        <ActionIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{action.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={handleReset} className="btn btn-outline py-3 px-6">
                  <RefreshCw className="w-5 h-5" />
                  Start Over
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <span className={`block text-sm font-semibold truncate ${valueColor ?? ''}`} title={value}>
        {value}
      </span>
    </div>
  );
}
