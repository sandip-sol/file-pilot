export interface SiteFaq {
  question: string;
  answer: string;
}

interface SiteContentEntry {
  /** Full <title>, brand included. Used verbatim by the prerenderer AND PageSeo. */
  title: string;
  description: string;
  /**
   * Visible H1. It MUST match the H1 the page component renders, or the
   * prerendered HTML and the DOM Google renders disagree about what the page is.
   */
  h1: string;
  /** Lead paragraph for the prerendered shell. */
  intro?: string;
  /** Rendered by the page's <FAQSection> and by the prerendered FAQPage schema. */
  faqs?: SiteFaq[];
}

/**
 * Single source of truth for the non-tool routes (home, hubs, blog, legal).
 *
 * `toolContent.ts` already does this for the 83 tool routes. Core and blog
 * routes were left out, so `seoRoutes.js` and each page's <PageSeo> carried
 * their own competing copies — the prerendered <title> said one thing and the
 * title React set at runtime said another. Google renders JS, so the client
 * copy won and the prerendered copy was wasted. Both sides now read this file.
 *
 * Spread straight into PageSeo: `<PageSeo {...siteSeo('/blog')} />`.
 */
export const siteContent: Record<string, SiteContentEntry> = {
  '/': {
    title: 'FilePilot — Free Private PDF & Image Tools, No Upload',
    description:
      'FilePilot is a free toolkit of 90+ PDF and image tools that run entirely in your browser. Merge, split, compress, convert and edit files privately — nothing is ever uploaded to a server.',
    h1: 'Free, private PDF and image tools that run in your browser',
    intro:
      'FilePilot is a free collection of 90+ browser-based tools for PDFs, images and everyday file tasks. Every tool processes your file locally on your own device using WebAssembly and the Canvas API, so your documents are never uploaded, queued, stored or scanned on someone else\'s server. No account, no watermark, no ads.',
    faqs: [
      {
        question: 'Are my files uploaded to a server?',
        answer:
          'No. FilePilot reads your file into browser memory and processes it on your own device. Nothing is transmitted to a server, so there is no upload queue, no storage and no retention policy to trust. You can confirm this yourself: open your browser\'s Network tab while a tool runs and you will see no file data leaving the page.',
      },
      {
        question: 'Is FilePilot really free?',
        answer:
          'Yes. Every tool is free with no account, no sign-up, no watermarks and no page limits. Because processing happens on your device rather than on rented servers, there are no per-file costs to pass on to you.',
      },
      {
        question: 'What can FilePilot do?',
        answer:
          'Over 90 tools across PDFs and images: merge, split, compress, rotate, reorder, delete and extract pages, add page numbers, watermarks, stamps and signatures, redact and flatten, plus conversions to and from JPG, PNG, WebP, SVG, CBZ, ZIP, JSON, Markdown and plain text. Image tools cover compression, resizing, cropping, format conversion, metadata stripping and AI background removal.',
      },
      {
        question: 'Does FilePilot work offline?',
        answer:
          'Mostly, yes. Once the page has loaded, the tools run without a network connection because the processing code is already in your browser. A few AI-assisted tools download a model file on first use and need a connection for that initial download only.',
      },
      {
        question: 'How is this different from Smallpdf, iLovePDF or Adobe?',
        answer:
          'Those services upload your document to their infrastructure, process it there and send a copy back, which means your file is stored — however briefly — on hardware you do not control. FilePilot does the same work in your browser, so the file never leaves your device. That matters most for contracts, tax returns, medical records and ID scans.',
      },
      {
        question: 'Is FilePilot related to the File Pilot Windows file manager?',
        answer:
          'No. FilePilot at filepilot.space is a free web app for PDF and image tasks that runs in any browser. File Pilot is a separate, unrelated Windows file-explorer replacement. The two share a name but nothing else.',
      },
    ],
  },

  '/pdf-tools': {
    title: 'Free Online PDF Tools — Private, No Upload | FilePilot',
    description:
      'A complete collection of free, browser-based PDF tools. Merge, split, compress, convert, annotate, redact, sign and organize PDFs — all processed privately on your device with no uploads.',
    h1: 'Free Online PDF Tools',
    intro:
      'Every PDF task in one place, processed locally in your browser. Merge and split documents, compress large files, reorder and delete pages, convert to and from images, add page numbers and watermarks, redact sensitive text, fill and flatten forms, and sign contracts — without uploading a single file.',
  },

  '/image-tools': {
    title: 'Free Online Image Tools — Private, No Upload | FilePilot',
    description:
      'A complete suite of free, browser-based image tools. Compress, resize, crop, convert, watermark, strip metadata and remove backgrounds — all processed privately on your device with no uploads.',
    h1: 'Free Online Image Tools',
    intro:
      'Compress, resize, crop, rotate and convert images between JPG, PNG, WebP, SVG and BMP, strip EXIF and GPS metadata, add watermarks, and run AI background removal — all in your browser, with your photos never leaving your device.',
  },

  '/image-workflows': {
    title: 'Image Workflow Tools - Format, Validate and Prepare Images | FilePilot',
    description:
      'Prepare images for social media, ecommerce, passport photos, favicons, QR codes, and PDF workflows with private browser-based tools.',
    h1: 'Image Workflow Tools',
    intro:
      'Format, validate, and prepare images for real publishing requirements. These tools help with social media sizes, ecommerce output, passport photo checks, favicons, QR codes, and image-to-PDF workflows without uploading your files.',
  },

  '/ai-tools': {
    title: 'AI Image Tools - Private Browser-Based Editing | FilePilot',
    description:
      'Remove backgrounds, enhance images, upscale photos, and clean edits with AI-assisted tools that run in your browser where supported.',
    h1: 'AI Image Tools',
    intro:
      'Use AI-assisted image tools for background removal, cleanup, enhancement, upscaling, and object removal. FilePilot keeps privacy clear by running supported processing in your browser instead of collecting your images on a server.',
  },

  '/blog': {
    title: 'FilePilot Blog — Privacy, PDFs and Image Tools',
    description:
      'Articles about privacy-first file processing, browser-based PDF tools, image tools, and why your documents should never leave your device.',
    h1: 'FilePilot Blog',
    intro:
      'Practical writing on private, local file processing: how browser-based PDF and image tools actually work, what happens to a document when you upload it to a server, and how to tell whether a tool is genuinely private.',
  },

  '/support': {
    title: 'Support FilePilot | Keep private file tools free',
    description:
      'Support FilePilot and help keep private, browser-based file tools free, ad-free and improving.',
    h1: 'Support FilePilot',
    intro:
      'Help keep FilePilot free, private and ad-free while funding new tools, performance improvements and maintenance.',
  },

  '/privacy': {
    title: 'Privacy Policy | FilePilot',
    description:
      'Learn how FilePilot protects files with browser-based processing and no server uploads for supported tools.',
    h1: 'Privacy Policy',
  },

  '/terms': {
    title: 'Terms of Service | FilePilot',
    description:
      'Read the terms for using FilePilot browser-based PDF, image, and file tools.',
    h1: 'Terms of Service',
  },

  '/blog/why-files-stay-in-browser': {
    title: 'Why Your Files Should Never Leave Your Browser | FilePilot',
    description:
      'Uploading files to remote servers introduces privacy risks, data breaches, and unclear retention policies. Learn how browser-based processing with WebAssembly and Web Workers keeps your documents private.',
    h1: 'Why Your Files Should Never Leave Your Browser',
  },

  '/blog/privacy-risks-online-pdf-tools': {
    title: 'The Hidden Privacy Risks of Online PDF Tools | FilePilot',
    description:
      'What really happens when you upload a PDF to an online tool: server storage, metadata exposure, third-party processing, and how to evaluate whether a tool is truly private.',
    h1: 'The Hidden Privacy Risks of Online PDF Tools',
  },

  '/blog/how-filepilot-keeps-documents-private': {
    title: 'How FilePilot Keeps Your Documents Private | FilePilot',
    description:
      'A practical look at FilePilot\'s privacy architecture: WebAssembly with pdf-lib, Canvas API rendering, ONNX Runtime for AI features, PWA offline support, and zero server involvement.',
    h1: 'How FilePilot Keeps Your Documents Private',
  },
};

export const siteSeo = (
  route: string,
): { title: string; description: string; faqItems?: SiteFaq[] } => {
  const entry = siteContent[route];
  if (!entry) {
    throw new Error(`siteSeo: no siteContent entry for "${route}"`);
  }
  return { title: entry.title, description: entry.description, faqItems: entry.faqs };
};

/** FAQs for the on-page <FAQSection>. Must be the same array the schema uses. */
export const siteFaqs = (route: string): SiteFaq[] => siteContent[route]?.faqs ?? [];
