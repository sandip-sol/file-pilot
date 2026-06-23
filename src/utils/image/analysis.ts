import type { ImageFileInfo, AnalysisResult, Recommendation } from './types';
import { getFormatLabel, formatFileSize } from './support';
import { calculateAspectRatio } from './processing';

export type IntendedUse =
  | 'website-hero'
  | 'website-content'
  | 'ecommerce-product'
  | 'social-post'
  | 'instagram-story'
  | 'youtube-thumbnail'
  | 'profile-image'
  | 'print'
  | 'custom';

interface UseCaseSpec {
  label: string;
  minWidth: number;
  minHeight: number;
  maxFileSizeKB: number;
  idealAspect?: string;
  recommendedFormats: string[];
}

const USE_CASE_SPECS: Record<IntendedUse, UseCaseSpec> = {
  'website-hero': {
    label: 'Website Hero',
    minWidth: 1920,
    minHeight: 600,
    maxFileSizeKB: 300,
    idealAspect: '16:9',
    recommendedFormats: ['image/webp', 'image/jpeg'],
  },
  'website-content': {
    label: 'Website Content Image',
    minWidth: 800,
    minHeight: 400,
    maxFileSizeKB: 200,
    recommendedFormats: ['image/webp', 'image/jpeg'],
  },
  'ecommerce-product': {
    label: 'E-commerce Product',
    minWidth: 1000,
    minHeight: 1000,
    maxFileSizeKB: 500,
    idealAspect: '1:1',
    recommendedFormats: ['image/webp', 'image/jpeg', 'image/png'],
  },
  'social-post': {
    label: 'Social Media Post',
    minWidth: 1080,
    minHeight: 1080,
    maxFileSizeKB: 500,
    idealAspect: '1:1',
    recommendedFormats: ['image/jpeg', 'image/png'],
  },
  'instagram-story': {
    label: 'Instagram Story',
    minWidth: 1080,
    minHeight: 1920,
    maxFileSizeKB: 500,
    idealAspect: '9:16',
    recommendedFormats: ['image/jpeg', 'image/png'],
  },
  'youtube-thumbnail': {
    label: 'YouTube Thumbnail',
    minWidth: 1280,
    minHeight: 720,
    maxFileSizeKB: 2000,
    idealAspect: '16:9',
    recommendedFormats: ['image/jpeg', 'image/png'],
  },
  'profile-image': {
    label: 'Profile Image',
    minWidth: 400,
    minHeight: 400,
    maxFileSizeKB: 200,
    idealAspect: '1:1',
    recommendedFormats: ['image/jpeg', 'image/png'],
  },
  'print': {
    label: 'Print',
    minWidth: 2400,
    minHeight: 2400,
    maxFileSizeKB: 10000,
    recommendedFormats: ['image/png', 'image/jpeg'],
  },
  'custom': {
    label: 'Custom',
    minWidth: 0,
    minHeight: 0,
    maxFileSizeKB: 99999,
    recommendedFormats: [],
  },
};

export function getUseCaseLabel(use: IntendedUse): string {
  return USE_CASE_SPECS[use]?.label ?? 'Custom';
}

export const ALL_USE_CASES: { id: IntendedUse; label: string }[] = [
  { id: 'website-hero', label: 'Website Hero' },
  { id: 'website-content', label: 'Website Content Image' },
  { id: 'ecommerce-product', label: 'E-commerce Product Image' },
  { id: 'social-post', label: 'Social Media Post' },
  { id: 'instagram-story', label: 'Instagram Story' },
  { id: 'youtube-thumbnail', label: 'YouTube Thumbnail' },
  { id: 'profile-image', label: 'Profile Image' },
  { id: 'print', label: 'Print' },
  { id: 'custom', label: 'Custom' },
];

export async function analyzeImage(
  info: ImageFileInfo,
  intendedUse: IntendedUse,
): Promise<AnalysisResult> {
  const { width, height, originalSize, mimeType, name, hasTransparency } = info;
  const aspectRatio = calculateAspectRatio(width, height);
  const megapixels = ((width * height) / 1_000_000).toFixed(2);
  const fileType = getFormatLabel(mimeType);

  const recommendations = generateRecommendations(info, intendedUse);

  return {
    filename: name,
    fileType,
    mimeType,
    fileSize: originalSize,
    fileSizeFormatted: formatFileSize(originalSize),
    width,
    height,
    aspectRatio,
    megapixels,
    hasTransparency,
    estimatedDPI: 'Not available from file metadata',
    colorDepth: mimeType === 'image/png' ? '32-bit (RGBA)' : '24-bit (RGB)',
    recommendations,
  };
}

function generateRecommendations(
  info: ImageFileInfo,
  intendedUse: IntendedUse,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const spec = USE_CASE_SPECS[intendedUse];
  const { width, height, originalSize, mimeType, hasTransparency } = info;
  const fileSizeKB = originalSize / 1024;

  if (intendedUse === 'custom') return recs;

  if (width < spec.minWidth || height < spec.minHeight) {
    recs.push({
      category: 'dimensions',
      severity: 'warning',
      title: 'Image may be too small',
      message: `Based on pixel dimensions (${width}×${height}), this image may be too small for ${spec.label}. Recommended minimum: ${spec.minWidth}×${spec.minHeight} px.`,
    });
  }

  if (width > spec.minWidth * 3 && height > spec.minHeight * 3) {
    recs.push({
      category: 'dimensions',
      severity: 'info',
      title: 'Image is much larger than needed',
      message: `This image (${width}×${height}) is significantly larger than the recommended ${spec.minWidth}×${spec.minHeight} px for ${spec.label}. Consider resizing to save bandwidth.`,
    });
  }

  if (fileSizeKB > spec.maxFileSizeKB) {
    recs.push({
      category: 'file-weight',
      severity: 'warning',
      title: 'File size is large',
      message: `At ${formatFileSize(originalSize)}, this exceeds the recommended ~${spec.maxFileSizeKB} KB for ${spec.label}. Compress or convert to a more efficient format.`,
    });
  } else {
    recs.push({
      category: 'file-weight',
      severity: 'success',
      title: 'File size is appropriate',
      message: `At ${formatFileSize(originalSize)}, this is within the recommended range for ${spec.label}.`,
    });
  }

  if (spec.idealAspect) {
    const current = calculateAspectRatio(width, height);
    if (current !== spec.idealAspect) {
      recs.push({
        category: 'dimensions',
        severity: 'info',
        title: 'Aspect ratio differs from recommended',
        message: `Current aspect ratio is ${current}. ${spec.label} typically uses ${spec.idealAspect}. Consider cropping or resizing.`,
      });
    }
  }

  if (mimeType === 'image/jpeg' && hasTransparency) {
    recs.push({
      category: 'format',
      severity: 'warning',
      title: 'JPEG does not support transparency',
      message: 'This image appears to have transparent areas but is in JPEG format. Consider converting to PNG or WebP to preserve transparency.',
    });
  }

  if (mimeType === 'image/png' && !hasTransparency && fileSizeKB > 500) {
    recs.push({
      category: 'format',
      severity: 'info',
      title: 'Consider WebP or JPEG for smaller file size',
      message: 'This PNG image has no transparency and is over 500 KB. Converting to WebP or JPEG could significantly reduce file size.',
    });
  }

  if (hasTransparency && spec.recommendedFormats.length > 0) {
    if (!spec.recommendedFormats.includes('image/png') && !spec.recommendedFormats.includes('image/webp')) {
      recs.push({
        category: 'format',
        severity: 'warning',
        title: 'Transparency may not be preserved',
        message: `This image has transparency, but the recommended formats for ${spec.label} may not support it. Use PNG or WebP to keep transparent areas.`,
      });
    }
  }

  if (width >= 1200 && height >= 1200 && mimeType === 'image/png' && !hasTransparency) {
    recs.push({
      category: 'format',
      severity: 'info',
      title: 'Photo-like image in PNG format',
      message: 'Large images without transparency are typically better served as WebP or JPEG for web use.',
    });
  }

  recs.push({
    category: 'privacy',
    severity: 'info',
    title: 'Metadata note',
    message: 'Canvas-based export strips most EXIF metadata by default. Re-exporting the image removes embedded GPS, camera, and author data.',
  });

  return recs;
}
