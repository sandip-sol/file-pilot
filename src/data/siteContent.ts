import { comparisonContent } from './comparisons.ts';
import { blogPosts } from './blogContent.ts';

export interface SiteFaq {
  question: string;
  answer: string;
}

export interface SiteSection {
  heading: string;
  paragraphs: string[];
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
  /** Long-form guidance on hub pages, rendered by <HubSections> and the prerenderer. */
  sections?: SiteSection[];
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
      'Free PDF and image tools that run entirely in your browser. Merge, split, compress, convert, sign and edit files privately: nothing is uploaded to a server.',
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
      'Free browser-based PDF tools: merge, split, compress, convert, annotate, redact, sign and organize PDFs, all processed privately on your device, never uploaded.',
    h1: 'Free Online PDF Tools',
    intro:
      'Every PDF task in one place, processed locally in your browser. Merge and split documents, compress large files, reorder and delete pages, convert to and from images, add page numbers and watermarks, redact sensitive text, fill and flatten forms, and sign contracts — without uploading a single file.',
  },

  '/image-tools': {
    title: 'Free Online Image Tools — Private, No Upload | FilePilot',
    description:
      'Free browser-based image tools: compress, resize, crop, convert, watermark, strip metadata and remove backgrounds, all processed privately on your own device.',
    h1: 'Free Online Image Tools',
    intro:
      'Compress, resize, crop, rotate and convert images between JPG, PNG, WebP, SVG and BMP, strip EXIF and GPS metadata, add watermarks, and run AI background removal — all in your browser, with your photos never leaving your device.',
    sections: [
      {
        heading: 'Which image tool do you need?',
        paragraphs: [
          'Compress Image lowers the file size, which is usually the fix when a photo is too heavy for an email or a web page. Resize Image changes the width and height in pixels. Crop Image cuts away part of the picture, and Rotate Image corrects its orientation.',
          'Convert Image changes the file format. JPG suits photographs and keeps files small. PNG suits screenshots, logos and anything that needs a transparent background. WebP usually produces smaller files for websites, though older software may not open it.',
        ],
      },
      {
        heading: 'Photos carry more than the picture',
        paragraphs: [
          'Photos from phones and cameras often store hidden EXIF data, including when the photo was taken, which device took it and sometimes the exact GPS location. That data can travel with the file when you share it. Remove Image Metadata strips it out first.',
          'Doing this in your browser matters. A service that removes location data on its own server has to receive the location data before it can delete it. Here, the photo stays on your device the whole time.',
        ],
      },
      {
        heading: 'When an image has to meet a rule',
        paragraphs: [
          'If someone else sets the requirements, such as an application form with a file size limit or a marketplace with fixed dimensions, the workflow tools are a faster starting point than resizing by hand. Resize Image to Exact Size targets precise pixel and KB values, and Passport Photo Validator checks a photo against passport and ID rules.',
        ],
      },
    ],
  },

  '/image-workflows': {
    title: 'Image Workflow Tools – Format & Prepare Images | FilePilot',
    description:
      'Ready-made image workflows for social media sizes, product photos, passport photos, favicons, QR codes and PDF conversion. Free, private and browser-based.',
    h1: 'Image Workflow Tools',
    intro:
      'Format, validate, and prepare images for real publishing requirements. These tools help with social media sizes, ecommerce output, passport photo checks, favicons, QR codes, and image-to-PDF workflows without uploading your files.',
    sections: [
      {
        heading: 'Start with the rule you have to meet',
        paragraphs: [
          'Most of these tools begin with a requirement rather than an edit. If a form asks for something like a JPG at 200×230 pixels and under 50 KB, Resize Image to Exact Size can hit both numbers. Passport Photo Validator checks a photo’s dimensions, file size, face position and background against passport and ID photo rules.',
          'Social Media Resizer crops an image for a specific platform and post type, such as an Instagram Story or a LinkedIn banner. E-commerce Image Formatter prepares product photos for marketplaces such as Amazon, eBay, Etsy and Shopify.',
        ],
      },
      {
        heading: 'Batch jobs and finished files',
        paragraphs: [
          'Image Formatter applies one set of dimensions, format, quality and file size limits to many images, then lets you download them one at a time or as a ZIP. Scan Images to PDF turns phone photos of paper documents into a single ordered PDF.',
          'Favicon Generator builds a complete set of website icons from one image and gives you the HTML to add them. QR Code Generator creates codes for links, Wi-Fi details, contact cards and plain text.',
        ],
      },
      {
        heading: 'Why these jobs stay on your device',
        paragraphs: [
          'The files used here are often personal: ID photos, signatures, certificates and Wi-Fi passwords. All eight tools do their work in your browser, so none of that is sent to a server.',
          'Government and platform requirements change, so check the current rules on the official site before you submit anything. A photo that passes a technical check here can still be rejected by the authority that issues the document.',
        ],
      },
    ],
  },

  '/ai-tools': {
    title: 'AI Image Tools - Private Browser-Based Editing | FilePilot',
    description:
      'Free AI image tools that run in your browser: remove or change backgrounds, upscale and enhance photos, and erase unwanted objects without uploading images.',
    h1: 'AI Image Tools',
    intro:
      'Use AI-assisted image tools for background removal, cleanup, enhancement, upscaling, and object removal. FilePilot keeps privacy clear by running supported processing in your browser instead of collecting your images on a server.',
    sections: [
      {
        heading: 'Choosing the right tool',
        paragraphs: [
          'Remove Background cuts out the subject and gives you a PNG with a transparent background. Change Background makes the same cut-out, then puts a solid color, gradient, blur or your own image behind the subject.',
          'Upscale Image enlarges a small image by 2× or 4× using the Real-ESRGAN super-resolution model. AI Enhance Image corrects exposure, noise, sharpness and faded color without changing the image size. Object Remover fills in an area you paint over, which suits wires, signs, blemishes and other small distractions.',
        ],
      },
      {
        heading: 'What runs on your device',
        paragraphs: [
          'With all five tools, your image stays in your browser and is never sent to FilePilot.',
          'Remove Background, Change Background and Upscale Image use neural network models. They download the model and its runtime when you first use them, so that first run needs a connection and takes longer. Only the software is downloaded, and your image is not part of that request.',
          'AI Enhance Image and Object Remover need no model download. Enhance measures the brightness, contrast and color of your image and corrects them, while Object Remover rebuilds the painted area from the pixels around it.',
        ],
      },
      {
        heading: 'Getting good results',
        paragraphs: [
          'The work happens on your own device, so large images take longer on phones and older laptops. Upscale Image accepts images up to 4 megapixels, and 4× upscaling on anything above 1 megapixel uses a lot of memory.',
          'Object Remover accepts images up to 2048 pixels on each side, and you can paint over at most half of the image. It works best on small areas with simple surroundings, such as a wire against the sky. A large object in front of a detailed scene is likely to leave a visible smear. After removing a background, check the edges around hair and transparent objects before you use the result.',
        ],
      },
    ],
  },

  '/blog': {
    title: 'FilePilot Blog — Privacy, PDFs and Image Tools',
    description:
      'Guides to private file handling: how browser-based PDF and image tools work, the real risks of uploading documents, redaction, EXIF data and practical how-tos.',
    h1: 'FilePilot Blog',
    intro:
      'Practical writing on private, local file processing: how browser-based PDF and image tools actually work, what happens to a document when you upload it to a server, and how to tell whether a tool is genuinely private.',
  },

  '/support': {
    title: 'Support FilePilot | Keep private file tools free',
    description:
      'Support FilePilot to keep its private, browser-based PDF and image tools free, ad-free and improving. See how contributions are used and other ways to help.',
    h1: 'Support FilePilot',
    intro:
      'Help keep FilePilot free, private and ad-free while funding new tools, performance improvements and maintenance.',
  },

  '/about': {
    title: 'About FilePilot — Who Builds It and How It Works',
    description:
      'Who builds FilePilot, why it processes files in your browser instead of a server, the libraries behind it, and how to verify the no-upload claim yourself.',
    h1: 'About FilePilot',
    intro:
      'FilePilot is a free set of 90+ PDF and image tools that run entirely in your browser. This page explains who builds it, how the local processing actually works, how you can verify that claim for yourself, how the site is paid for, and where it falls short.',
    faqs: [
      {
        question: 'Who is behind FilePilot?',
        answer: 'FilePilot is an independently built and maintained web app. It is not a venture-funded company or a subsidiary; there is no sales team and no account system. Details of the maintainer are on this page.',
      },
      {
        question: 'How do I know my files are not uploaded?',
        answer: 'Verify it rather than trusting it. Open your browser\'s developer tools, switch to the Network tab, and run any tool — you will see the page and its code load, and no request carrying your file. The site also sends a Content-Security-Policy with connect-src \'self\', which tells your browser to block requests to any other host.',
      },
      {
        question: 'How does FilePilot make money?',
        answer: 'It largely does not. There are no ads, trackers, analytics, affiliate links, accounts or paid tiers. Because processing happens on your device there are no per-file server costs to recover. An optional donation link opens a hosted payment page in a new tab; no payment code is embedded in the site.',
      },
      {
        question: 'Is this the same as the File Pilot Windows file manager?',
        answer: 'No. FilePilot at filepilot.space is a website for working with PDFs and images in a browser. File Pilot at filepilot.tech is an unrelated Windows file-manager application. There is no affiliation in either direction.',
      },
      {
        question: 'Can I contact the maintainer?',
        answer: 'Yes — contact details are listed on this page, and the source repository is public on GitHub.',
      },
    ],
  },

  '/privacy': {
    title: 'Privacy Policy | FilePilot',
    description:
      'How FilePilot handles your files: they are processed in your browser and never uploaded. No tracking, no ad cookies, and no personal data collected or shared.',
    h1: 'Privacy Policy',
  },

  '/terms': {
    title: 'Terms of Service | FilePilot',
    description:
      'Terms for using FilePilot\'s free PDF and image tools: free for personal and commercial use, you keep ownership of your files, and the service is provided as is.',
    h1: 'Terms of Service',
  },



};

// The "alternative to X" pages (Phase 1.3) keep their copy in comparisons.ts
// but expose SEO through the same siteSeo()/siteContent path as every other
// non-tool route, so seoRoutes.js and PageSeo pick them up automatically.
for (const entry of Object.values(comparisonContent)) {
  siteContent[entry.route] = {
    title: entry.title,
    description: entry.description,
    h1: entry.h1,
    intro: entry.intro,
    faqs: entry.faqs,
  };
}

// Blog posts keep their prose and their SEO together in blogContent.ts; this
// republishes the SEO half through the same path every other route uses.
for (const post of Object.values(blogPosts)) {
  siteContent[post.route] = {
    title: post.title,
    description: post.description,
    h1: post.h1,
    faqs: post.faqs,
  };
}

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
