# PDF Solver

> Document Solutions Simplified

PDF Solver is a frontend-only PDF and Image toolkit that runs 100% in the browser. All processing happens locally using WebAssembly and JavaScript - no servers, no uploads, complete privacy.

## Features

### PDF Tools
- **Merge PDFs** - Combine multiple PDF files into one
- **Split PDF** - Extract pages or split into separate files
- **Compress PDF** - Reduce file size while maintaining quality
- **Images to PDF** - Convert JPG, PNG, WebP images to a single PDF

### Image Tools
- **Image Formatter** - Resize, compress, and convert images
  - **Resize**: Exact pixel dimensions with Cover/Contain modes
  - **Compress**: Enforce maximum file size (e.g., under 100KB)
  - **Convert**: Switch between JPG, PNG, and WebP
  - **Presets**: Ready-made templates for Passports, Visas, Social Media, and E-commerce

## SEO & Performance
- **Optimized Meta Tags**: Custom `PageSeo` component for dynamic titles and descriptions
- **Structured Data**: JSON-LD schemas for `WebApplication` and `FAQPage`
- **Sitemap & Robots**: Auto-generated for better crawlability
- **Fast**: Zero-layout shift, client-side routing

## Tech Stack

- **Framework**: React + TypeScript + Vite
- **Styling**: TailwindCSS + Lucide React
- **PDF Processing**: `pdf-lib` + `jszip`
- **Image Processing**: Canvas API (Client-side)
- **Notifications**: `sonner`

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/sandip-sol/pdf-solver.git
cd pdf-solver
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Deployment

### Netlify (Recommended)

1. Push your code to GitHub
2. Connect your repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

The `_redirects` file is already configured for SPA routing.

## Privacy

**Your files never leave your device.**
All file processing (merging, splitting, resizing, compressing) happens entirely within your browser's memory. We do not have a backend server to store or view your files.

## License

MIT
