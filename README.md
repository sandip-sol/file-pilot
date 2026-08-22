# FilePilot

> **Private, browser-based PDF & image tools that never upload your files.**

[filepilot.space](https://www.filepilot.space) is a free toolkit of 90+ utilities to
**merge, split, convert, compress, edit and organise PDFs and images** — all processed
**locally in your browser** with WebAssembly, Canvas, and client-side JavaScript. Your
files never touch a server.

Most online PDF/image tools upload your document, process it on their infrastructure,
and send a copy back. FilePilot doesn't upload anything. That makes it safe for
contracts, financial statements, ID scans, medical records, and anything else you would
rather not hand to a third party.

## Why it's different

- 🔒 **No uploads.** Files are read into browser memory and processed on your device. Close the tab and the working state is gone.
- 🆓 **Free, no signup, no watermarks, no ads.**
- ⚡ **Instant.** No upload/download round-trip to a server.
- 🤖 **AI-search ready.** Ships `llms.txt`, HowTo/FAQ structured data, and per-tool prerendered content.

## Tools

**PDF** — merge, split, organise, rotate, delete/extract pages, compress, N-up,
posterize, booklet, page numbers & labels, flatten, redact, watermark, sign, repair,
metadata, security, and conversions to/from images, SVG, CBZ, ZIP, JSON, Markdown, text.

**Image** — compress, resize, crop, convert (JPG/PNG/WebP/SVG/BMP), watermark, remove
metadata (EXIF/GPS), vectorise to SVG, favicon & QR generation, social/e-commerce/passport
presets, and AI-assisted background removal, upscaling and object removal.

See the full list at [filepilot.space](https://www.filepilot.space) or in
[`public/llms.txt`](public/llms.txt).

## Tech stack

- **Framework:** React + TypeScript + Vite
- **Styling:** TailwindCSS + Lucide
- **PDF:** `pdf-lib`, `pdfjs-dist`, `jszip`
- **Image / AI:** Canvas API, `onnxruntime-web`, `@imgly/background-removal`
- **Hosting:** Netlify (static, SPA redirects in `_redirects`)

## SEO architecture

- **Prerendering** (`prerender.js`, Puppeteer): every route ships crawlable static HTML with per-tool content before the app hydrates.
- **Single source of truth:** `src/data/toolContent.ts` drives each tool's title, description, FAQs and steps — consumed by both the prerenderer and the client `PageSeo` component, so the rendered DOM stays consistent.
- **Structured data:** JSON-LD `SoftwareApplication`, `BreadcrumbList`, `FAQPage`, and `HowTo` per tool page.
- **Generated at build:** `sitemap.xml`, `robots.txt`, `llms.txt`, IndexNow key.
- **Validated at build:** `seoValidate.js` gates the build on SEO invariants across all sitemap URLs.
- See [`SEO_ROADMAP.md`](SEO_ROADMAP.md) for the growth strategy.

## Getting started

```bash
git clone https://github.com/sandip-sol/file-pilot.git
cd file-pilot
npm install
npm run dev
```

## Build

```bash
npm run build      # generate SEO files → tsc → vite build → prerender → validate
```

Useful scripts:

```bash
npm run seo:validate           # re-run SEO invariant checks against dist/
npm run indexnow:submit:all    # ping IndexNow (Bing/Yandex) for every route
npm run indexnow:submit:tail   # ping only the Phase 1 focus tools
node generateOgImage.js        # regenerate the 1200×630 social preview image
```

`npm run indexnow:*` needs `INDEXNOW_KEY` in the environment.

## Configuration

Set `VITE_SUPPORT_URL` to enable the optional "Support FilePilot" donation CTA:

```bash
VITE_SUPPORT_URL=https://buymeacoffee.com/yourusername
```

The support flow opens the hosted payment page in a new tab. FilePilot embeds no
donation scripts, widgets, iframes, tracking pixels, or payment code.

## Privacy

Files are processed locally in your browser and are not uploaded to any FilePilot
server. See the [privacy policy](https://www.filepilot.space/privacy/).

## License

All rights reserved.

The source is public so that the "your files never leave your browser" claim can be
audited — read the code, or watch the Network tab while a tool runs. It is not
offered under an open-source licence: FilePilot already competes with several
same-named sites, and a permissive licence would explicitly permit redeploying it
under someone else's brand.

Want to use part of this in your own project? Open an issue — the answer is likely
yes for anything that isn't a wholesale redeploy.
