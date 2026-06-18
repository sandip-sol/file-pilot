import type { LucideIcon } from 'lucide-react';
import {
  Files,
  Scissors,
  Image,
  Minimize2,
  SlidersHorizontal,
  ScanText,
  LayoutGrid,
  Stamp,
  Shield,
  Eraser,
  Images,
  GitCompareArrows,
  PenSquare,
} from 'lucide-react';

export interface ToolDefinition {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  gradientClassName: string;
  featured?: boolean;
}

export const toolRegistry: ToolDefinition[] = [
  {
    slug: '/merge',
    title: 'Merge PDFs',
    shortTitle: 'Merge',
    description: 'Combine multiple PDF files into one organized document.',
    icon: Files,
    gradientClassName: 'from-indigo-500 to-purple-600',
    featured: true,
  },
  {
    slug: '/split',
    title: 'Split PDF',
    shortTitle: 'Split',
    description: 'Extract pages or split documents into separate files.',
    icon: Scissors,
    gradientClassName: 'from-orange-500 to-rose-600',
    featured: true,
  },
  {
    slug: '/organize-pdf',
    title: 'Organize PDF Pages',
    shortTitle: 'Organize',
    description: 'Reorder, rotate, and delete pages with thumbnail previews and drag-and-drop.',
    icon: LayoutGrid,
    gradientClassName: 'from-sky-500 to-cyan-600',
    featured: true,
  },
  {
    slug: '/watermark-pdf',
    title: 'Watermark PDF',
    shortTitle: 'Watermark',
    description: 'Add private text or image watermarks to all pages or selected pages.',
    icon: Stamp,
    gradientClassName: 'from-fuchsia-500 to-pink-600',
    featured: true,
  },
  {
    slug: '/pdf-security',
    title: 'Protect / Unlock PDF',
    shortTitle: 'Security',
    description: 'Unlock password-protected PDFs locally and prepare browser-first PDF security workflows.',
    icon: Shield,
    gradientClassName: 'from-slate-700 to-slate-900',
    featured: true,
  },
  {
    slug: '/redact-pdf',
    title: 'Redact PDF',
    shortTitle: 'Redact',
    description: 'Place redaction boxes and burn them into the exported PDF for visual privacy masking.',
    icon: Eraser,
    gradientClassName: 'from-zinc-700 to-black',
    featured: true,
  },
  {
    slug: '/images-to-pdf',
    title: 'Images to PDF',
    shortTitle: 'Images to PDF',
    description: 'Convert JPG, PNG, and WebP images into PDF documents.',
    icon: Image,
    gradientClassName: 'from-violet-500 to-fuchsia-600',
    featured: true,
  },
  {
    slug: '/pdf-to-images',
    title: 'PDF to Images',
    shortTitle: 'PDF to Images',
    description: 'Export PDF pages as JPG or PNG one by one or as a ZIP archive.',
    icon: Images,
    gradientClassName: 'from-emerald-500 to-teal-600',
    featured: true,
  },
  {
    slug: '/extract-text',
    title: 'Extract Text',
    shortTitle: 'Extract Text',
    description: 'Extract text from PDFs, scanned PDFs, and images with private in-browser OCR.',
    icon: ScanText,
    gradientClassName: 'from-amber-500 to-orange-600',
    featured: true,
  },
  {
    slug: '/compare-pdf',
    title: 'Compare PDFs',
    shortTitle: 'Compare',
    description: 'Compare page counts and extracted text differences page by page.',
    icon: GitCompareArrows,
    gradientClassName: 'from-blue-600 to-indigo-700',
    featured: true,
  },
  {
    slug: '/annotate-pdf',
    title: 'Fill Forms / Annotate',
    shortTitle: 'Annotate',
    description: 'Add text, checkmarks, highlights, dates, and signatures before exporting a flattened PDF.',
    icon: PenSquare,
    gradientClassName: 'from-lime-500 to-green-600',
    featured: true,
  },
  {
    slug: '/compress',
    title: 'Compress PDF',
    shortTitle: 'Compress',
    description: 'Reduce file size while maintaining quality.',
    icon: Minimize2,
    gradientClassName: 'from-emerald-500 to-teal-600',
    featured: true,
  },
  {
    slug: '/image-requirements',
    title: 'Image Formatter',
    shortTitle: 'Image Formatter',
    description: 'Resize image to exact pixels, reduce KB size, and convert format.',
    icon: SlidersHorizontal,
    gradientClassName: 'from-cyan-500 to-blue-600',
    featured: true,
  },
];

export const primaryNavTools = toolRegistry.filter((tool) => tool.featured);
