# PDFBuddy

**Fast, private PDF tools — your files never leave your device.**

PDFBuddy is a frontend-only PDF toolkit that runs 100% in the browser. All processing happens locally using WebAssembly and JavaScript - no servers, no uploads, complete privacy.

## Features

- **Merge PDFs** - Combine multiple PDF files into one
- **Split PDF** - Extract page ranges or separate every page
- **Images to PDF** - Convert JPG, PNG, WebP to PDF with layout options
- **Compress PDF** - Basic compression via file optimization
- **Privacy First** - All processing happens in your browser

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** for bundling
- **React Router** for client-side routing
- **pdf-lib** for PDF manipulation
- **JSZip** for creating zip archives
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd zero_project

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Deploying to Netlify

### Option 1: Drag & Drop Deploy

1. Run `npm run build` to create the `dist/` folder
2. Go to [Netlify](https://app.netlify.com)
3. Drag the `dist/` folder onto the Netlify deploy area
4. Your site is live!

### Option 2: GitHub Connected Deploy

1. Push your code to a GitHub repository
2. Go to [Netlify](https://app.netlify.com) and click "Add new site" → "Import an existing project"
3. Connect your GitHub account and select your repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click "Deploy site"

### SPA Redirect Rule

This project includes a `public/_redirects` file with the following rule:

```
/* /index.html 200
```

This ensures that all routes are handled by the React app (required for client-side routing with React Router). The file is automatically copied to `dist/` during build.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout.tsx    # Main layout with navbar, footer, privacy banner
│   ├── Navbar.tsx    # Navigation component
│   ├── Footer.tsx    # Footer component
│   └── FileUploader.tsx  # Drag & drop file uploader
├── pages/            # Page components
│   ├── Home.tsx      # Landing page
│   ├── Merge.tsx     # Merge PDFs tool
│   ├── Split.tsx     # Split PDF tool
│   ├── ImagesToPdf.tsx   # Images to PDF tool
│   ├── Compress.tsx  # Compress PDF tool
│   ├── Privacy.tsx   # Privacy policy
│   └── Terms.tsx     # Terms of service
├── utils/
│   └── pdfHelpers.ts # PDF manipulation functions using pdf-lib
├── App.tsx           # Main router configuration
├── main.tsx          # React entry point
└── index.css         # Global styles
```

## Browser Support

Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 90+
- Safari 15+

## License

MIT
