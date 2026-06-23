import type { LucideIcon } from 'lucide-react';
import {
  Files, Scissors, Image, Minimize2, SlidersHorizontal, ScanText, LayoutGrid, Stamp,
  Shield, Eraser, Images, GitCompareArrows, PenSquare, RotateCw, Trash2, Layers,
  ArrowDownZA, FilePlus2, Shuffle, FileText, FileCode, FileImage, BookOpen,
  Bookmark, List, ListOrdered, Droplets, Pilcrow, Contrast, Palette,
  SquarePen, FileInput, FileMinus2, Crop, PenTool, LayoutDashboard, Grid2x2,
  FileX, Unlink, Wrench, ScanLine, Lock, Unlock, ShieldCheck, Clock, Tag,
  Gauge, Ruler, FileSpreadsheet, BookMarked, BookText, FileType, Mail,
  SearchX, FileKey, Info, FileCog, StretchHorizontal,
  UnfoldVertical, TableColumnsSplit, NotepadTextDashed, Smartphone, Download,
  Paperclip, Ungroup, GanttChart, FileCode2,
  ImageMinus, ImagePlus, Replace, RotateCcw, CircleOff, Scaling, Sparkles, Type,
  Globe, Camera, FileCheck, BrainCircuit, Languages, NotebookPen, MessageSquareText, FileSearch,
} from 'lucide-react';

export type ToolCategory =
  | 'organize-manage'
  | 'edit-annotate'
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'optimize-repair'
  | 'secure-pdf'
  | 'image-tools'
  | 'ai-tools';

export type ToolStatus = 'ready' | 'beta' | 'coming-soon' | 'hidden';

export interface ToolDefinition {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  gradientClassName: string;
  category: ToolCategory;
  featured?: boolean;
}

export const toolRegistry: ToolDefinition[] = [
  // ── ORGANIZE & MANAGE ──────────────────────────────────────────────────────
  {
    slug: '/merge', title: 'Merge PDFs', shortTitle: 'Merge',
    description: 'Combine multiple PDF files into one organized document.',
    icon: Files, gradientClassName: 'from-indigo-500 to-purple-600',
    category: 'organize-manage', featured: true,
  },
  {
    slug: '/split', title: 'Split PDF', shortTitle: 'Split',
    description: 'Extract pages or split documents into separate files.',
    icon: Scissors, gradientClassName: 'from-orange-500 to-rose-600',
    category: 'organize-manage', featured: true,
  },
  {
    slug: '/organize-pdf', title: 'Organize PDF Pages', shortTitle: 'Organize',
    description: 'Reorder, rotate, and delete pages with drag-and-drop thumbnails.',
    icon: LayoutGrid, gradientClassName: 'from-sky-500 to-cyan-600',
    category: 'organize-manage', featured: true,
  },
  {
    slug: '/rotate-pdf', title: 'Rotate PDF', shortTitle: 'Rotate',
    description: 'Rotate all or selected pages by 90°, 180°, or 270°.',
    icon: RotateCw, gradientClassName: 'from-violet-500 to-purple-600',
    category: 'organize-manage',
  },
  {
    slug: '/delete-pages', title: 'Delete Pages', shortTitle: 'Delete Pages',
    description: 'Remove specific pages from your PDF file.',
    icon: Trash2, gradientClassName: 'from-red-500 to-rose-700',
    category: 'organize-manage',
  },
  {
    slug: '/extract-pages', title: 'Extract Pages', shortTitle: 'Extract',
    description: 'Pull out selected pages from a PDF into a new document.',
    icon: Ungroup, gradientClassName: 'from-amber-500 to-orange-600',
    category: 'organize-manage',
  },
  {
    slug: '/reverse-pdf', title: 'Reverse PDF', shortTitle: 'Reverse',
    description: 'Flip the page order of a PDF from last to first.',
    icon: ArrowDownZA, gradientClassName: 'from-teal-500 to-cyan-600',
    category: 'organize-manage',
  },
  {
    slug: '/add-blank-page', title: 'Add Blank Page', shortTitle: 'Blank Page',
    description: 'Insert blank pages at any position in your PDF.',
    icon: FilePlus2, gradientClassName: 'from-slate-500 to-slate-700',
    category: 'organize-manage',
  },
  {
    slug: '/alternate-merge', title: 'Alternate Merge', shortTitle: 'Alt. Merge',
    description: 'Interleave pages from two PDFs alternately (ideal for double-sided scans).',
    icon: Shuffle, gradientClassName: 'from-fuchsia-500 to-pink-600',
    category: 'organize-manage',
  },
  {
    slug: '/n-up-pdf', title: 'N-Up PDF', shortTitle: 'N-Up',
    description: 'Print 2, 4, or 9 pages per sheet to save paper.',
    icon: LayoutDashboard, gradientClassName: 'from-emerald-500 to-teal-600',
    category: 'organize-manage',
  },
  {
    slug: '/overlay-pdf', title: 'Overlay PDF', shortTitle: 'Overlay',
    description: 'Layer one PDF over another as an overlay or underlay.',
    icon: Layers, gradientClassName: 'from-blue-500 to-indigo-700',
    category: 'organize-manage',
  },
  {
    slug: '/divide-pages', title: 'Divide Pages', shortTitle: 'Divide',
    description: 'Split each page in half horizontally or vertically.',
    icon: TableColumnsSplit, gradientClassName: 'from-orange-400 to-amber-600',
    category: 'organize-manage',
  },
  {
    slug: '/combine-single-page', title: 'Stitch Pages', shortTitle: 'Stitch',
    description: 'Combine all pages into one long scrollable page.',
    icon: UnfoldVertical, gradientClassName: 'from-indigo-400 to-blue-600',
    category: 'organize-manage',
  },
  {
    slug: '/grid-combine', title: 'Grid Combine', shortTitle: 'Grid',
    description: 'Arrange multiple PDFs in a grid layout on a single page.',
    icon: Grid2x2, gradientClassName: 'from-pink-500 to-rose-600',
    category: 'organize-manage',
  },
  {
    slug: '/posterize-pdf', title: 'Posterize PDF', shortTitle: 'Posterize',
    description: 'Tile a large PDF page across multiple sheets for poster printing.',
    icon: NotepadTextDashed, gradientClassName: 'from-yellow-500 to-amber-600',
    category: 'organize-manage',
  },
  {
    slug: '/add-page-labels', title: 'Add Page Labels', shortTitle: 'Labels',
    description: 'Add custom labels (Roman numerals, prefixes) to PDF pages.',
    icon: Tag, gradientClassName: 'from-lime-500 to-green-600',
    category: 'organize-manage',
  },
  {
    slug: '/pdf-metadata', title: 'PDF Metadata', shortTitle: 'Metadata',
    description: 'Inspect PDF metadata: title, author, dates, page count.',
    icon: Info, gradientClassName: 'from-sky-400 to-blue-600',
    category: 'organize-manage',
  },
  {
    slug: '/edit-metadata', title: 'Edit Metadata', shortTitle: 'Edit Meta',
    description: 'Update the title, author, subject, and keywords of a PDF.',
    icon: FileCog, gradientClassName: 'from-violet-400 to-indigo-600',
    category: 'organize-manage',
  },
  {
    slug: '/pdf-to-zip', title: 'PDF to ZIP', shortTitle: 'PDF to ZIP',
    description: 'Bundle multiple PDF files into a single ZIP archive.',
    icon: StretchHorizontal, gradientClassName: 'from-zinc-500 to-slate-700',
    category: 'organize-manage',
  },
  {
    slug: '/compare-pdf', title: 'Compare PDFs', shortTitle: 'Compare',
    description: 'Compare page counts and text differences between two PDFs.',
    icon: GitCompareArrows, gradientClassName: 'from-blue-600 to-indigo-700',
    category: 'organize-manage', featured: true,
  },
  {
    slug: '/pdf-booklet', title: 'PDF Booklet', shortTitle: 'Booklet',
    description: 'Impose pages into a printable booklet (saddle-stitch) layout.',
    icon: BookOpen, gradientClassName: 'from-rose-500 to-pink-700',
    category: 'organize-manage',
  },
  {
    slug: '/add-attachments', title: 'Add Attachments', shortTitle: 'Attach',
    description: 'Embed any file as an attachment inside a PDF document.',
    icon: Paperclip, gradientClassName: 'from-cyan-500 to-teal-600',
    category: 'organize-manage',
  },
  {
    slug: '/extract-attachments', title: 'Extract Attachments', shortTitle: 'Extract Attach',
    description: 'Extract all embedded files from a PDF into a ZIP.',
    icon: Download, gradientClassName: 'from-green-500 to-emerald-700',
    category: 'organize-manage',
  },
  {
    slug: '/ocr-pdf', title: 'OCR PDF', shortTitle: 'OCR',
    description: 'Make scanned PDFs searchable using in-browser OCR.',
    icon: ScanText, gradientClassName: 'from-amber-500 to-orange-600',
    category: 'organize-manage',
  },

  // ── EDIT & ANNOTATE ────────────────────────────────────────────────────────
  {
    slug: '/annotate-pdf', title: 'Fill Forms / Annotate', shortTitle: 'Annotate',
    description: 'Add text, highlights, checkmarks, and signatures to PDFs.',
    icon: PenSquare, gradientClassName: 'from-lime-500 to-green-600',
    category: 'edit-annotate', featured: true,
  },
  {
    slug: '/watermark-pdf', title: 'Watermark PDF', shortTitle: 'Watermark',
    description: 'Add text or image watermarks to all or selected pages.',
    icon: Droplets, gradientClassName: 'from-fuchsia-500 to-pink-600',
    category: 'edit-annotate', featured: true,
  },
  {
    slug: '/redact-pdf', title: 'Redact PDF', shortTitle: 'Redact',
    description: 'Permanently cover sensitive content in your PDF.',
    icon: Eraser, gradientClassName: 'from-zinc-700 to-black',
    category: 'edit-annotate', featured: true,
  },
  {
    slug: '/sign-pdf', title: 'Sign PDF', shortTitle: 'Sign',
    description: 'Draw, type, or upload a signature and embed it in your PDF.',
    icon: PenTool, gradientClassName: 'from-indigo-500 to-violet-700',
    category: 'edit-annotate',
  },
  {
    slug: '/crop-pdf', title: 'Crop PDF', shortTitle: 'Crop',
    description: 'Trim margins or set a custom crop area on PDF pages.',
    icon: Crop, gradientClassName: 'from-amber-500 to-yellow-600',
    category: 'edit-annotate',
  },
  {
    slug: '/bookmark', title: 'PDF Bookmarks', shortTitle: 'Bookmarks',
    description: 'View, add, edit, or delete bookmarks in a PDF.',
    icon: Bookmark, gradientClassName: 'from-blue-500 to-sky-600',
    category: 'edit-annotate',
  },
  {
    slug: '/table-of-contents', title: 'Table of Contents', shortTitle: 'TOC',
    description: 'Automatically generate a table of contents from PDF bookmarks.',
    icon: List, gradientClassName: 'from-teal-500 to-cyan-700',
    category: 'edit-annotate',
  },
  {
    slug: '/page-numbers', title: 'Add Page Numbers', shortTitle: 'Page Nums',
    description: 'Add customizable page numbers to any position on pages.',
    icon: ListOrdered, gradientClassName: 'from-violet-500 to-purple-700',
    category: 'edit-annotate',
  },
  {
    slug: '/header-footer', title: 'Header & Footer', shortTitle: 'Header/Footer',
    description: 'Add custom text headers and footers to every page.',
    icon: Pilcrow, gradientClassName: 'from-rose-500 to-red-700',
    category: 'edit-annotate',
  },
  {
    slug: '/invert-colors', title: 'Invert Colors', shortTitle: 'Invert',
    description: 'Convert PDF to dark mode by inverting all colors.',
    icon: Contrast, gradientClassName: 'from-gray-700 to-gray-900',
    category: 'edit-annotate',
  },
  {
    slug: '/background-color', title: 'Background Color', shortTitle: 'BG Color',
    description: 'Add a solid background color to PDF pages.',
    icon: Palette, gradientClassName: 'from-pink-500 to-fuchsia-700',
    category: 'edit-annotate',
  },
  {
    slug: '/text-color', title: 'Change Text Color', shortTitle: 'Text Color',
    description: 'Recolor editable PDF text while preserving the document layout.',
    icon: Palette, gradientClassName: 'from-fuchsia-500 to-purple-700',
    category: 'edit-annotate',
  },
  {
    slug: '/add-stamp', title: 'Add Stamp', shortTitle: 'Stamp',
    description: 'Add "DRAFT", "CONFIDENTIAL", or custom text stamps to pages.',
    icon: Stamp, gradientClassName: 'from-orange-500 to-amber-700',
    category: 'edit-annotate',
  },
  {
    slug: '/remove-annotations', title: 'Remove Annotations', shortTitle: 'Remove Ann.',
    description: 'Strip all comments, highlights, and links from a PDF.',
    icon: Eraser, gradientClassName: 'from-slate-500 to-slate-700',
    category: 'edit-annotate',
  },
  {
    slug: '/form-filler', title: 'Form Filler', shortTitle: 'Fill Form',
    description: 'Fill in PDF form fields and flatten the result.',
    icon: SquarePen, gradientClassName: 'from-emerald-500 to-green-700',
    category: 'edit-annotate',
  },
  {
    slug: '/form-creator', title: 'Form Creator', shortTitle: 'Create Form',
    description: 'Build interactive PDF forms with text fields and checkboxes.',
    icon: FileInput, gradientClassName: 'from-cyan-500 to-blue-700',
    category: 'edit-annotate',
  },
  {
    slug: '/remove-blank-pages', title: 'Remove Blank Pages', shortTitle: 'No Blanks',
    description: 'Automatically detect and remove blank pages from a PDF.',
    icon: FileMinus2, gradientClassName: 'from-red-400 to-rose-600',
    category: 'edit-annotate',
  },

  // ── CONVERT TO PDF ─────────────────────────────────────────────────────────
  {
    slug: '/images-to-pdf', title: 'Images to PDF', shortTitle: 'Images→PDF',
    description: 'Convert JPG, PNG, and WebP images into a PDF document.',
    icon: Image, gradientClassName: 'from-violet-500 to-fuchsia-600',
    category: 'convert-to-pdf', featured: true,
  },
  {
    slug: '/jpg-to-pdf', title: 'JPG to PDF', shortTitle: 'JPG→PDF',
    description: 'Convert JPEG photos to a PDF file in seconds.',
    icon: FileImage, gradientClassName: 'from-yellow-500 to-orange-600',
    category: 'convert-to-pdf',
  },
  {
    slug: '/png-to-pdf', title: 'PNG to PDF', shortTitle: 'PNG→PDF',
    description: 'Convert PNG images (with transparency) into a PDF.',
    icon: FileImage, gradientClassName: 'from-sky-500 to-blue-600',
    category: 'convert-to-pdf',
  },
  {
    slug: '/webp-to-pdf', title: 'WebP to PDF', shortTitle: 'WebP→PDF',
    description: 'Convert modern WebP images to PDF format.',
    icon: FileImage, gradientClassName: 'from-teal-500 to-cyan-600',
    category: 'convert-to-pdf',
  },
  {
    slug: '/svg-to-pdf', title: 'SVG to PDF', shortTitle: 'SVG→PDF',
    description: 'Convert vector SVG graphics to PDF at any size.',
    icon: FileCode, gradientClassName: 'from-indigo-500 to-blue-600',
    category: 'convert-to-pdf',
  },
  {
    slug: '/bmp-to-pdf', title: 'BMP to PDF', shortTitle: 'BMP→PDF',
    description: 'Convert BMP bitmap images to PDF.',
    icon: FileImage, gradientClassName: 'from-orange-400 to-red-500',
    category: 'convert-to-pdf',
  },
  {
    slug: '/heic-to-pdf', title: 'HEIC to PDF', shortTitle: 'HEIC→PDF',
    description: 'Convert iPhone HEIC/HEIF photos to PDF.',
    icon: Smartphone, gradientClassName: 'from-slate-500 to-gray-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/tiff-to-pdf', title: 'TIFF to PDF', shortTitle: 'TIFF→PDF',
    description: 'Convert multi-page TIFF images to a PDF document.',
    icon: Layers, gradientClassName: 'from-purple-500 to-violet-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/text-to-pdf', title: 'Text to PDF', shortTitle: 'TXT→PDF',
    description: 'Convert plain text files into formatted PDF documents.',
    icon: FileText, gradientClassName: 'from-amber-500 to-yellow-600',
    category: 'convert-to-pdf',
  },
  {
    slug: '/json-to-pdf', title: 'JSON to PDF', shortTitle: 'JSON→PDF',
    description: 'Render JSON data as a formatted, syntax-highlighted PDF.',
    icon: FileCode, gradientClassName: 'from-green-500 to-emerald-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/markdown-to-pdf', title: 'Markdown to PDF', shortTitle: 'MD→PDF',
    description: 'Convert Markdown documents to styled PDF files.',
    icon: FileType, gradientClassName: 'from-blue-500 to-sky-600',
    category: 'convert-to-pdf',
  },
  {
    slug: '/word-to-pdf', title: 'Word to PDF', shortTitle: 'Word→PDF',
    description: 'Convert DOCX/DOC Word documents to PDF.',
    icon: FileText, gradientClassName: 'from-blue-600 to-blue-800',
    category: 'convert-to-pdf',
  },
  {
    slug: '/excel-to-pdf', title: 'Excel to PDF', shortTitle: 'Excel→PDF',
    description: 'Convert XLSX/XLS spreadsheets to PDF.',
    icon: FileSpreadsheet, gradientClassName: 'from-green-600 to-green-800',
    category: 'convert-to-pdf',
  },
  {
    slug: '/pptx-to-pdf', title: 'PowerPoint to PDF', shortTitle: 'PPTX→PDF',
    description: 'Convert PPTX/PPT presentations to PDF.',
    icon: GanttChart, gradientClassName: 'from-red-500 to-orange-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/epub-to-pdf', title: 'EPUB to PDF', shortTitle: 'EPUB→PDF',
    description: 'Convert eBook EPUB files to PDF.',
    icon: BookOpen, gradientClassName: 'from-teal-500 to-teal-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/mobi-to-pdf', title: 'MOBI to PDF', shortTitle: 'MOBI→PDF',
    description: 'Convert Kindle MOBI/AZW files to PDF.',
    icon: BookMarked, gradientClassName: 'from-amber-600 to-orange-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/rtf-to-pdf', title: 'RTF to PDF', shortTitle: 'RTF→PDF',
    description: 'Convert Rich Text Format files to PDF.',
    icon: FileType, gradientClassName: 'from-violet-500 to-purple-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/xps-to-pdf', title: 'XPS to PDF', shortTitle: 'XPS→PDF',
    description: 'Convert Microsoft XPS documents to PDF.',
    icon: FileText, gradientClassName: 'from-slate-500 to-blue-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/djvu-to-pdf', title: 'DjVu to PDF', shortTitle: 'DjVu→PDF',
    description: 'Convert DjVu scanned documents to PDF.',
    icon: FileImage, gradientClassName: 'from-brown-500 to-amber-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/fb2-to-pdf', title: 'FB2 to PDF', shortTitle: 'FB2→PDF',
    description: 'Convert FictionBook FB2 eBook files to PDF.',
    icon: BookText, gradientClassName: 'from-pink-500 to-rose-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/email-to-pdf', title: 'Email to PDF', shortTitle: 'Email→PDF',
    description: 'Convert EML/MSG email files to PDF.',
    icon: Mail, gradientClassName: 'from-sky-500 to-blue-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/cbz-to-pdf', title: 'CBZ to PDF', shortTitle: 'CBZ→PDF',
    description: 'Convert comic book CBZ/CBR archives to PDF.',
    icon: BookOpen, gradientClassName: 'from-yellow-500 to-amber-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/html-to-pdf', title: 'HTML to PDF', shortTitle: 'HTML→PDF',
    description: 'Convert web pages and HTML files into PDF documents.',
    icon: Globe, gradientClassName: 'from-cyan-500 to-blue-700',
    category: 'convert-to-pdf',
  },
  {
    slug: '/scan-to-pdf', title: 'Scan to PDF', shortTitle: 'Scan→PDF',
    description: 'Capture documents with your camera and convert them to PDF.',
    icon: Camera, gradientClassName: 'from-gray-500 to-slate-700',
    category: 'convert-to-pdf',
  },

  // ── CONVERT FROM PDF ───────────────────────────────────────────────────────
  {
    slug: '/pdf-to-images', title: 'PDF to Images', shortTitle: 'PDF→Images',
    description: 'Export PDF pages as JPG or PNG images.',
    icon: Images, gradientClassName: 'from-emerald-500 to-teal-600',
    category: 'convert-from-pdf', featured: true,
  },
  {
    slug: '/pdf-to-jpg', title: 'PDF to JPG', shortTitle: 'PDF→JPG',
    description: 'Convert each PDF page to a JPG image.',
    icon: FileImage, gradientClassName: 'from-yellow-500 to-orange-600',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-png', title: 'PDF to PNG', shortTitle: 'PDF→PNG',
    description: 'Convert each PDF page to a transparent PNG image.',
    icon: FileImage, gradientClassName: 'from-sky-500 to-cyan-600',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-webp', title: 'PDF to WebP', shortTitle: 'PDF→WebP',
    description: 'Export PDF pages as modern compressed WebP images.',
    icon: FileImage, gradientClassName: 'from-teal-500 to-green-600',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-bmp', title: 'PDF to BMP', shortTitle: 'PDF→BMP',
    description: 'Export PDF pages as lossless image files packaged in a ZIP.',
    icon: FileImage, gradientClassName: 'from-orange-500 to-red-600',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-tiff', title: 'PDF to TIFF', shortTitle: 'PDF→TIFF',
    description: 'Export PDF pages as multi-page TIFF images.',
    icon: FileImage, gradientClassName: 'from-purple-500 to-violet-700',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-svg', title: 'PDF to SVG', shortTitle: 'PDF→SVG',
    description: 'Convert PDF pages to scalable SVG vector files.',
    icon: FileCode, gradientClassName: 'from-indigo-500 to-blue-700',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-greyscale', title: 'PDF to Grayscale', shortTitle: 'Grayscale',
    description: 'Convert a color PDF to black-and-white grayscale.',
    icon: Contrast, gradientClassName: 'from-gray-500 to-gray-800',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-json', title: 'PDF to JSON', shortTitle: 'PDF→JSON',
    description: 'Extract PDF text and metadata as a structured JSON file.',
    icon: FileCode, gradientClassName: 'from-green-500 to-emerald-700',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-docx', title: 'Extract PDF Text for Word', shortTitle: 'PDF Text',
    description: 'Extract PDF text as a plain text document you can paste into Word.',
    icon: FileText, gradientClassName: 'from-blue-600 to-blue-800',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-pptx', title: 'Extract PDF Text for Slides', shortTitle: 'PDF Text',
    description: 'Extract PDF text as a plain text document you can use in slides.',
    icon: GanttChart, gradientClassName: 'from-red-500 to-orange-700',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-excel', title: 'Extract PDF Text for Sheets', shortTitle: 'PDF Text',
    description: 'Extract PDF text as a plain text document you can review in a spreadsheet.',
    icon: FileSpreadsheet, gradientClassName: 'from-green-600 to-green-800',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-markdown', title: 'PDF to Markdown', shortTitle: 'PDF→MD',
    description: 'Extract PDF content as a clean Markdown document.',
    icon: FileCode2, gradientClassName: 'from-slate-500 to-gray-700',
    category: 'convert-from-pdf',
  },
  {
    slug: '/extract-text', title: 'Extract Text', shortTitle: 'Extract Text',
    description: 'Extract text from PDFs and scanned images with browser-side OCR.',
    icon: ScanText, gradientClassName: 'from-amber-500 to-orange-600',
    category: 'convert-from-pdf', featured: true,
  },
  {
    slug: '/extract-images', title: 'Extract Images', shortTitle: 'Extract Images',
    description: 'Extract all images embedded in a PDF as a ZIP file.',
    icon: Download, gradientClassName: 'from-violet-500 to-fuchsia-700',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-cbz', title: 'PDF to CBZ', shortTitle: 'PDF→CBZ',
    description: 'Convert a PDF into a comic book CBZ archive.',
    icon: BookOpen, gradientClassName: 'from-yellow-500 to-amber-700',
    category: 'convert-from-pdf',
  },
  {
    slug: '/rasterize-pdf', title: 'Rasterize PDF', shortTitle: 'Rasterize',
    description: 'Rasterize PDF pages at custom DPI to PNG, JPEG, or WebP.',
    icon: Grid2x2, gradientClassName: 'from-pink-500 to-rose-700',
    category: 'convert-from-pdf',
  },
  {
    slug: '/pdf-to-pdfa', title: 'PDF to PDF/A', shortTitle: 'PDF→PDF/A',
    description: 'Convert PDF to the ISO-standardized PDF/A archival format.',
    icon: FileCheck, gradientClassName: 'from-emerald-600 to-green-800',
    category: 'convert-from-pdf',
  },

  // ── OPTIMIZE & REPAIR ──────────────────────────────────────────────────────
  {
    slug: '/compress', title: 'Compress PDF', shortTitle: 'Compress',
    description: 'Reduce file size while maintaining quality.',
    icon: Minimize2, gradientClassName: 'from-emerald-500 to-teal-600',
    category: 'optimize-repair', featured: true,
  },
  {
    slug: '/fix-page-size', title: 'Fix Page Size', shortTitle: 'Page Size',
    description: 'Standardize all pages to A4, Letter, or custom dimensions.',
    icon: Ruler, gradientClassName: 'from-blue-500 to-indigo-700',
    category: 'optimize-repair',
  },
  {
    slug: '/linearize-pdf', title: 'Linearize PDF', shortTitle: 'Linearize',
    description: 'Planned support for verified Fast Web View PDF output.',
    icon: Gauge, gradientClassName: 'from-cyan-500 to-sky-700',
    category: 'optimize-repair',
  },
  {
    slug: '/page-dimensions', title: 'Page Dimensions', shortTitle: 'Dimensions',
    description: 'Inspect the dimensions and orientation of every page.',
    icon: Ruler, gradientClassName: 'from-teal-500 to-green-700',
    category: 'optimize-repair',
  },
  {
    slug: '/remove-restrictions', title: 'Remove Restrictions', shortTitle: 'Unlock',
    description: 'Remove copy/print restrictions from a PDF file.',
    icon: Unlink, gradientClassName: 'from-amber-500 to-yellow-700',
    category: 'optimize-repair',
  },
  {
    slug: '/repair-pdf', title: 'Repair PDF', shortTitle: 'Repair',
    description: 'Fix corrupted or damaged PDF files and recover content.',
    icon: Wrench, gradientClassName: 'from-orange-500 to-red-600',
    category: 'optimize-repair',
  },
  {
    slug: '/deskew-pdf', title: 'Deskew PDF', shortTitle: 'Deskew',
    description: 'Automatically straighten skewed scanned document pages.',
    icon: ScanLine, gradientClassName: 'from-violet-500 to-indigo-700',
    category: 'optimize-repair',
  },

  // ── SECURE PDF ─────────────────────────────────────────────────────────────
  {
    slug: '/pdf-security', title: 'Protect / Unlock PDF', shortTitle: 'Security',
    description: 'Unlock password-protected PDFs in your browser.',
    icon: Shield, gradientClassName: 'from-slate-700 to-slate-900',
    category: 'secure-pdf', featured: true,
  },
  {
    slug: '/encrypt-pdf', title: 'Encrypt PDF', shortTitle: 'Encrypt',
    description: 'Password-protect a PDF with user and owner passwords.',
    icon: Lock, gradientClassName: 'from-red-600 to-rose-800',
    category: 'secure-pdf',
  },
  {
    slug: '/decrypt-pdf', title: 'Decrypt PDF', shortTitle: 'Decrypt',
    description: 'Remove the password from an encrypted PDF file.',
    icon: Unlock, gradientClassName: 'from-green-600 to-emerald-800',
    category: 'secure-pdf',
  },
  {
    slug: '/sanitize-pdf', title: 'Sanitize PDF', shortTitle: 'Sanitize',
    description: 'Strip metadata, scripts, and hidden data from a PDF.',
    icon: ShieldCheck, gradientClassName: 'from-teal-600 to-cyan-800',
    category: 'secure-pdf',
  },
  {
    slug: '/find-and-redact', title: 'Find & Redact', shortTitle: 'Find & Redact',
    description: 'Search text patterns and permanently redact them from a PDF.',
    icon: SearchX, gradientClassName: 'from-zinc-700 to-gray-900',
    category: 'secure-pdf',
  },
  {
    slug: '/flatten-pdf', title: 'Flatten PDF', shortTitle: 'Flatten',
    description: 'Flatten forms and annotations into a non-editable PDF.',
    icon: Layers, gradientClassName: 'from-slate-500 to-slate-800',
    category: 'secure-pdf',
  },
  {
    slug: '/remove-metadata', title: 'Remove Metadata', shortTitle: 'No Metadata',
    description: 'Wipe all embedded metadata for maximum privacy.',
    icon: FileX, gradientClassName: 'from-gray-600 to-gray-900',
    category: 'secure-pdf',
  },
  {
    slug: '/change-permissions', title: 'Change Permissions', shortTitle: 'Permissions',
    description: 'Planned support for verified PDF permission flags.',
    icon: ShieldCheck, gradientClassName: 'from-blue-700 to-indigo-900',
    category: 'secure-pdf',
  },
  {
    slug: '/digital-sign-pdf', title: 'Digital Sign PDF', shortTitle: 'Digital Sign',
    description: 'Digitally sign a PDF with an X.509 certificate (PKCS#12).',
    icon: FileKey, gradientClassName: 'from-violet-600 to-purple-900',
    category: 'secure-pdf',
  },
  {
    slug: '/validate-signature', title: 'Validate Signature', shortTitle: 'Validate Sign',
    description: 'Verify digital signatures and certificate integrity in a PDF.',
    icon: ShieldCheck, gradientClassName: 'from-emerald-600 to-green-900',
    category: 'secure-pdf',
  },
  {
    slug: '/timestamp-pdf', title: 'Timestamp PDF', shortTitle: 'Timestamp',
    description: 'Planned support for trusted PDF timestamp signatures.',
    icon: Clock, gradientClassName: 'from-sky-600 to-blue-900',
    category: 'secure-pdf',
  },

  // ── AI TOOLS ───────────────────────────────────────────────────────────────
  {
    slug: '/ai-summarize', title: 'AI Summarizer', shortTitle: 'Summarize',
    description: 'Generate concise summaries from PDF documents using AI.',
    icon: NotebookPen, gradientClassName: 'from-violet-600 to-purple-800',
    category: 'ai-tools',
  },
  {
    slug: '/ai-translate', title: 'Translate PDF', shortTitle: 'Translate',
    description: 'Translate PDF content into any language powered by AI.',
    icon: Languages, gradientClassName: 'from-sky-500 to-indigo-700',
    category: 'ai-tools',
  },
  {
    slug: '/ai-chat', title: 'Chat with PDF', shortTitle: 'Chat',
    description: 'Ask questions about your PDF and get AI-powered answers.',
    icon: MessageSquareText, gradientClassName: 'from-emerald-500 to-teal-700',
    category: 'ai-tools',
  },
  {
    slug: '/ai-extract', title: 'AI Data Extractor', shortTitle: 'AI Extract',
    description: 'Extract structured data, tables, and key fields from PDFs using AI.',
    icon: FileSearch, gradientClassName: 'from-amber-500 to-orange-700',
    category: 'ai-tools',
  },
  {
    slug: '/ai-rewrite', title: 'AI Rewrite PDF', shortTitle: 'Rewrite',
    description: 'Rewrite or simplify PDF content while preserving the layout.',
    icon: BrainCircuit, gradientClassName: 'from-pink-500 to-rose-700',
    category: 'ai-tools',
  },

  // ── IMAGE TOOLS ────────────────────────────────────────────────────────────
  {
    slug: '/image-requirements', title: 'Image Formatter', shortTitle: 'Image Format',
    description: 'Resize images to exact dimensions, reduce file size, and convert formats.',
    icon: SlidersHorizontal, gradientClassName: 'from-cyan-500 to-blue-600',
    category: 'image-tools', featured: true,
  },
  {
    slug: '/compress-image', title: 'Compress Image', shortTitle: 'Compress',
    description: 'Reduce image file size while preserving quality for JPG, PNG, and WebP.',
    icon: ImageMinus, gradientClassName: 'from-emerald-500 to-teal-600',
    category: 'image-tools',
  },
  {
    slug: '/resize-image', title: 'Resize Image', shortTitle: 'Resize',
    description: 'Adjust image dimensions by pixels or percentage for any format.',
    icon: Scaling, gradientClassName: 'from-blue-500 to-indigo-600',
    category: 'image-tools',
  },
  {
    slug: '/crop-image', title: 'Crop Image', shortTitle: 'Crop',
    description: 'Select and extract a rectangular area from JPG, PNG, or WebP images.',
    icon: Crop, gradientClassName: 'from-amber-500 to-orange-600',
    category: 'image-tools',
  },
  {
    slug: '/rotate-image', title: 'Rotate Image', shortTitle: 'Rotate',
    description: 'Rotate or flip images by any angle in your browser.',
    icon: RotateCcw, gradientClassName: 'from-violet-500 to-purple-600',
    category: 'image-tools',
  },
  {
    slug: '/convert-to-jpg', title: 'Convert to JPG', shortTitle: 'To JPG',
    description: 'Convert PNG, WebP, GIF, BMP, TIFF, HEIC, and SVG images to JPG.',
    icon: FileImage, gradientClassName: 'from-yellow-500 to-orange-600',
    category: 'image-tools',
  },
  {
    slug: '/convert-from-jpg', title: 'Convert from JPG', shortTitle: 'From JPG',
    description: 'Convert JPG images to PNG, WebP, GIF, or BMP formats.',
    icon: Replace, gradientClassName: 'from-sky-500 to-blue-600',
    category: 'image-tools',
  },
  {
    slug: '/upscale-image', title: 'Upscale Image', shortTitle: 'Upscale',
    description: 'Enlarge images to higher resolution while maintaining visual quality.',
    icon: ImagePlus, gradientClassName: 'from-indigo-500 to-violet-600',
    category: 'image-tools',
  },
  {
    slug: '/remove-background', title: 'Remove Background', shortTitle: 'Remove BG',
    description: 'Automatically detect and remove image backgrounds.',
    icon: CircleOff, gradientClassName: 'from-pink-500 to-rose-600',
    category: 'image-tools',
  },
  {
    slug: '/watermark-image', title: 'Watermark Image', shortTitle: 'Watermark',
    description: 'Add text or image watermarks to photos with adjustable transparency.',
    icon: Droplets, gradientClassName: 'from-fuchsia-500 to-pink-600',
    category: 'image-tools',
  },
  {
    slug: '/blur-face', title: 'Blur Face', shortTitle: 'Blur Face',
    description: 'Blur faces, license plates, and sensitive areas in images.',
    icon: Eraser, gradientClassName: 'from-slate-600 to-gray-800',
    category: 'image-tools',
  },
  {
    slug: '/html-to-image', title: 'HTML to Image', shortTitle: 'HTML→Image',
    description: 'Convert web pages to JPG or PNG screenshots by URL.',
    icon: FileCode, gradientClassName: 'from-orange-500 to-red-600',
    category: 'image-tools',
  },
  {
    slug: '/meme-generator', title: 'Meme Generator', shortTitle: 'Meme',
    description: 'Create memes by adding captions and text to images.',
    icon: Type, gradientClassName: 'from-lime-500 to-green-600',
    category: 'image-tools',
  },
  {
    slug: '/photo-editor', title: 'Photo Editor', shortTitle: 'Editor',
    description: 'Edit photos with filters, effects, text, frames, and stickers.',
    icon: Sparkles, gradientClassName: 'from-rose-500 to-pink-700',
    category: 'image-tools',
  },
];

export const toolsByCategory = (cat: ToolCategory) =>
  toolRegistry.filter((t) => t.category === cat);

const betaToolSlugs = new Set([
  '/remove-blank-pages',
  '/heic-to-pdf',
  '/tiff-to-pdf',
  '/repair-pdf',
  '/deskew-pdf',
]);

const comingSoonToolSlugs = new Set([
  '/add-attachments',
  '/extract-attachments',
  '/ocr-pdf',
  '/invert-colors',
  '/text-color',
  '/word-to-pdf',
  '/excel-to-pdf',
  '/pptx-to-pdf',
  '/epub-to-pdf',
  '/mobi-to-pdf',
  '/rtf-to-pdf',
  '/xps-to-pdf',
  '/djvu-to-pdf',
  '/fb2-to-pdf',
  '/email-to-pdf',
  '/cbz-to-pdf',
  '/digital-sign-pdf',
  '/validate-signature',
  '/html-to-pdf',
  '/scan-to-pdf',
  '/pdf-to-pdfa',
  '/ai-summarize',
  '/ai-translate',
  '/ai-chat',
  '/ai-extract',
  '/ai-rewrite',
  '/compress-image',
  '/resize-image',
  '/crop-image',
  '/rotate-image',
  '/convert-to-jpg',
  '/convert-from-jpg',
  '/upscale-image',
  '/remove-background',
  '/watermark-image',
  '/blur-face',
  '/html-to-image',
  '/meme-generator',
  '/photo-editor',
]);

const hiddenToolSlugs = new Set([
  '/edit-metadata',
  '/linearize-pdf',
  '/remove-restrictions',
  '/encrypt-pdf',
  '/decrypt-pdf',
  '/change-permissions',
  '/timestamp-pdf',
]);

export const getToolStatus = (tool: ToolDefinition): ToolStatus => {
  if (hiddenToolSlugs.has(tool.slug)) return 'hidden';
  if (comingSoonToolSlugs.has(tool.slug)) return 'coming-soon';
  if (betaToolSlugs.has(tool.slug)) return 'beta';
  return 'ready';
};

export const discoverableTools = toolRegistry.filter((tool) => {
  const status = getToolStatus(tool);
  return status === 'ready' || status === 'beta';
});

export const plannedTools = toolRegistry.filter((tool) => getToolStatus(tool) === 'coming-soon');

export const primaryNavTools = discoverableTools.filter((tool) => tool.featured);

export const discoverableToolsByCategory = (cat: ToolCategory) =>
  discoverableTools.filter((tool) => tool.category === cat);
