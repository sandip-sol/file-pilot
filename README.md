# PDF Solver

> Document Solutions Simplified

PDF Solver is a frontend-only PDF toolkit that runs 100% in the browser. All processing happens locally using WebAssembly and JavaScript - no servers, no uploads, complete privacy.

## Features

- **Merge PDFs** - Combine multiple PDF files into one
- **Split PDF** - Extract pages or split into separate files
- **Images to PDF** - Convert JPG, PNG, WebP images to PDF
- **Compress PDF** - Reduce file size while maintaining quality

## Tech Stack

- React + TypeScript + Vite
- pdf-lib for PDF manipulation
- JSZip for file compression
- Lucide React for icons

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

All file processing happens in your browser. Files are never uploaded to any server.

## License

MIT
