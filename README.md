# FilePilot

> Smart tools for PDFs, images and files.

FilePilot is a private, browser-based toolkit to edit, convert, optimise and organise PDFs, images and files. All processing happens locally using WebAssembly and JavaScript, so files stay on your device.

## Features

### PDF Tools
- **Merge PDFs** - Combine multiple PDF files into one
- **Split PDF** - Extract pages or split into separate files
- **Compress PDF** - Reduce file size while maintaining quality
- **Images to PDF** - Convert JPG, PNG, and WebP images to a single PDF

### Image Tools
- **Image Formatter** - Resize, compress, and convert images
  - **Resize**: Exact pixel dimensions with Cover/Contain modes
  - **Compress**: Enforce maximum file size, such as under 100KB
  - **Convert**: Switch between JPG, PNG, and WebP
  - **Presets**: Ready-made templates for passports, visas, social media, and e-commerce

## SEO & Performance
- **Optimized Meta Tags**: Custom `PageSeo` component for dynamic titles and descriptions
- **Structured Data**: JSON-LD schemas for `WebApplication` and `FAQPage`
- **Sitemap & Robots**: Auto-generated for better crawlability
- **Bing IndexNow**: Submit all sitemap URLs using `npm run indexnow`
- **Fast**: Zero-layout shift, client-side routing

## Tech Stack

- **Framework**: React + TypeScript + Vite
- **Styling**: TailwindCSS + Lucide React
- **PDF Processing**: `pdf-lib` + `jszip`
- **Image Processing**: Canvas API, client-side
- **Notifications**: `sonner`

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/sandip-sol/filepilot.git
cd filepilot
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

### Support link

Set `VITE_SUPPORT_URL` in your production environment to enable the Support FilePilot donation CTA:

```bash
VITE_SUPPORT_URL=https://buymeacoffee.com/REPLACE_WITH_USERNAME
```

The support flow opens the hosted payment partner page in a new tab. FilePilot does not embed donation scripts, widgets, iframes, tracking pixels, or payment processing code.

## Deployment

### Netlify

1. Push your code to GitHub
2. Connect your repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

The `_redirects` file is already configured for SPA routing.

## Privacy

Your files stay on your device. File processing happens locally in your browser, and files are not uploaded to FilePilot servers.

## License

MIT
