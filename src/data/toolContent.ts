export interface ToolFaq {
  question: string;
  answer: string;
}

interface ToolContentEntry {
  intro: string;
  action: string;
  steps: string[];
  useCases: string[];
  /**
   * Keyword-first SEO title WITHOUT the brand suffix — `toolSeo()` and the
   * prerenderer both append BRAND_SUFFIX, so the client-rendered title and the
   * prerendered <title> stay identical. Lead with the exact target keyword.
   */
  seoTitle?: string;
  seoDescription?: string;
  /**
   * Visible H1. Set this only when the registry's UI name differs from the
   * search term (e.g. "Stitch Pages" vs "Combine PDF Pages into One"). It must
   * match the H1 the page component renders, or the prerendered and rendered
   * DOM disagree.
   */
  h1?: string;
  /** Tool-specific FAQs. Replaces the generic template in prerender.js. */
  faqs?: ToolFaq[];
  /** "When to use this vs …" section contrasting with the usual alternative. */
  comparison?: { heading: string; body: string };
}

export const BRAND_SUFFIX = ' | FilePilot';

const FALLBACK_TITLE = `FilePilot - PDF, Image and File Tools`;
const FALLBACK_DESCRIPTION =
  'Edit, convert, compress, organise and optimise PDFs, images and files with FilePilot. Your files are processed privately in your browser.';

/**
 * Single source of truth for per-tool SEO. Both the prerenderer (build time,
 * via seoRoutes.js) and PageSeo (client) read this, so the prerendered <title>
 * and the title React sets at runtime are identical rather than competing.
 * Spread it straight into PageSeo: `<PageSeo {...toolSeo('/merge')} />`.
 */
export const toolSeo = (
  route: string,
): { title: string; description: string; faqItems?: ToolFaq[] } => {
  const entry = toolContent[route];
  return {
    title: entry?.seoTitle ? `${entry.seoTitle}${BRAND_SUFFIX}` : FALLBACK_TITLE,
    description: entry?.seoDescription ?? FALLBACK_DESCRIPTION,
    faqItems: entry?.faqs,
  };
};

/**
 * FAQs for the on-page <FAQSection>. Google requires FAQ structured data to match
 * the visible content, so the rendered accordion and the FAQPage schema must both
 * come from here — never hard-code a second copy in the page component.
 */
export const toolFaqs = (route: string): ToolFaq[] => toolContent[route]?.faqs ?? [];

export const toolContent: Record<string, ToolContentEntry> = {
  // ── ORGANIZE & MANAGE ──────────────────────────────────────────────────────
  '/merge': {
    intro:
      'FilePilot\'s Merge PDF tool combines multiple PDF documents into a single file directly in your browser. Whether you need to compile reports, join contract pages, or bundle invoices, the merger preserves every page exactly as-is with zero quality loss. Drag-and-drop reordering lets you control the final page sequence before downloading.',
    action: 'merge PDF files',
    steps: [
      'Drop or select two or more PDF files from your device.',
      'Reorder files using the up/down arrows until the sequence is correct.',
      'Click "Merge & Download" to combine them into one PDF instantly.',
    ],
    useCases: [
      'Compile multi-chapter reports or research papers into one deliverable.',
      'Bundle scanned receipts and invoices for expense submission.',
      'Join a cover letter and resume into a single application PDF.',
      'Combine individual contract pages into one signed document.',
    ],
      seoTitle: "Merge PDF Files Online – Free & Private",
    seoDescription: "Combine multiple PDF files into one document. 100% free, secure, and client-side only.",
    faqs: [
      { question: "Does merging PDFs upload my files to a server?", answer: "No. All merging is done locally in your browser. Your files never leave your device." },
      { question: "How many PDF files can I merge at once?", answer: "There is no fixed limit. You can combine as many PDFs as your browser's memory allows — typically dozens of files without issue." },
      { question: "Can I reorder the files before merging?", answer: "Yes. After uploading, use the arrow buttons to drag files up or down into your preferred order before merging." },
      { question: "Will merging PDFs reduce quality?", answer: "No. The tool copies pages as-is without re-encoding, so quality remains identical to the originals." },
    ],
  },
  '/split': {
    intro:
      'The Split PDF tool lets you break a large PDF into smaller files by page range, individual pages, or fixed intervals. It runs entirely in your browser, so confidential documents like legal filings or financial statements never leave your machine. The result is a set of smaller PDFs, each preserving the original formatting and resolution.',
    action: 'split a PDF',
    steps: [
      'Upload the PDF you want to split.',
      'Choose a split method: by page ranges, every N pages, or extract individual pages.',
      'Click "Split & Download" to receive your separate PDF files.',
    ],
    useCases: [
      'Extract a specific chapter from a textbook or manual.',
      'Break a lengthy contract into sections for individual review.',
      'Pull out single pages to share without revealing the full document.',
      'Split scanned documents that were batched into one file.',
    ],
      seoTitle: "Split PDF Online – Extract Pages Free",
    seoDescription: "Split PDF documents or extract specific pages. Fast, free, and secure browser-based tool.",
    faqs: [
      { question: "Does splitting a PDF upload my file?", answer: "No. All splitting happens in your browser using JavaScript. Your file never leaves your device." },
      { question: "Can I extract a specific page range from a PDF?", answer: "Yes. Enter the start and end page numbers and the tool will extract only those pages into a new PDF." },
      { question: "Can I split a PDF into individual pages?", answer: "Yes. Toggle the 'Separate pages' option and every page will be saved as its own PDF, downloaded together in a ZIP file." },
      { question: "Is there a page limit for splitting?", answer: "No. The tool works in your browser, so it can handle PDFs with hundreds of pages — speed depends on your device." },
    ],
  },
  '/organize-pdf': {
    intro:
      'Organize PDF gives you a visual, drag-and-drop interface to reorder, rotate, and remove pages from any PDF. Thumbnail previews make it easy to identify pages at a glance. The tool is ideal for cleaning up scanned documents, rearranging presentation slides, or preparing print-ready files — all without installing desktop software.',
    action: 'organize PDF pages',
    steps: [
      'Upload your PDF to see thumbnail previews of every page.',
      'Drag pages to reorder, click to rotate, or select pages to delete.',
      'Click "Save" to download your reorganized PDF.',
    ],
    useCases: [
      'Fix the page order of a mis-scanned document.',
      'Rotate landscape pages in a mostly-portrait document.',
      'Remove blank or duplicate pages from a scanned batch.',
      'Rearrange presentation slides before printing handouts.',
    ],
      seoTitle: "Organize PDF Pages – Reorder, Rotate, Delete",
    seoDescription: "Reorder, rotate, and delete PDF pages with drag-and-drop thumbnails. Everything stays private in your browser.",
    faqs: [
      { question: "Does organizing pages upload my PDF?", answer: "No. The page previews, rotation, reordering, and export all run in your browser." },
      { question: "Can I rotate every page at once?", answer: "Yes. Use the rotate-all controls in the left panel to apply a 90 degree turn to the full document." },
      { question: "Can I delete multiple pages together?", answer: "Yes. Select several thumbnails and use Delete Selected before exporting the final PDF." },
    ],
  },
  '/rotate-pdf': {
    intro:
      'Rotate PDF lets you rotate all pages or specific pages by 90°, 180°, or 270°. This is especially useful for scanned documents where pages were fed at the wrong angle, or PDFs exported from mobile devices in the wrong orientation. The rotation is applied to the page content itself, not just the view setting.',
    action: 'rotate PDF pages',
    steps: [
      'Upload the PDF containing pages that need rotation.',
      'Select which pages to rotate and choose the rotation angle (90°, 180°, or 270°).',
      'Click "Rotate & Download" to save the corrected PDF.',
    ],
    useCases: [
      'Fix sideways or upside-down scanned pages.',
      'Correct landscape tables embedded in portrait documents.',
      'Prepare PDFs for consistent printing orientation.',
      'Fix mobile-scanned documents with mixed orientations.',
    ],
      seoTitle: "Rotate PDF Pages Online – Free & Private",
    seoDescription: "Rotate all pages of a PDF by 90, 180, or 270 degrees. 100% browser-based, no uploads.",
    faqs: [
      { question: "Does rotating modify the original file?", answer: "No. A new rotated PDF is downloaded while your original stays untouched." },
      { question: "Can I rotate only some pages?", answer: "For per-page control, use Organize PDF tool." },
    ],
  },
  '/delete-pages': {
    intro:
      'Delete Pages removes specific pages from your PDF without affecting the remaining content. Enter page numbers or ranges to remove, preview the result, and download a clean copy. This is useful for redacting entire pages that contain sensitive data, or trimming cover sheets and blank pages before sharing.',
    action: 'delete PDF pages',
    steps: [
      'Upload the PDF you want to edit.',
      'Enter the page numbers or ranges to remove (e.g., 1, 4-6, 12).',
      'Click "Delete & Download" to get your trimmed PDF.',
    ],
    useCases: [
      'Remove blank or filler pages from scanned documents.',
      'Strip cover pages before sharing internal content.',
      'Delete pages with outdated information from a report.',
      'Trim appendices or reference pages you don\'t need.',
    ],
      seoTitle: "Delete PDF Pages Online – Free & Private",
    seoDescription: "Remove specific pages from your PDF instantly in the browser. Enter page numbers or ranges. 100% private — no uploads.",
    faqs: [
      { question: "Will my file be uploaded?", answer: "No. Processing happens entirely in your browser with no server involved." },
      { question: "How do I specify pages to delete?", answer: "Enter page numbers separated by commas. Use hyphens for ranges, e.g. \"1, 3-5, 8\"." },
      { question: "Can I delete all pages?", answer: "No — you cannot delete all pages because a PDF must have at least one page." },
    ],
  },
  '/extract-pages': {
    intro:
      'Extract Pages pulls selected pages out of a PDF and saves them as a new document. Unlike splitting, extraction lets you cherry-pick non-consecutive pages — for example, pages 2, 7, and 15 — into one new file. The original PDF remains untouched.',
    action: 'extract PDF pages',
    steps: [
      'Upload the source PDF.',
      'Enter the page numbers or ranges you want to extract.',
      'Click "Extract & Download" to receive a new PDF with only the selected pages.',
    ],
    useCases: [
      'Pull out a specific form or page from a larger document pack.',
      'Create a summary PDF with only the key pages from a report.',
      'Extract certificates or appendices from a training manual.',
      'Share select pages without exposing the full document.',
    ],
      seoTitle: "Extract PDF Pages Online – Free & Private",
    seoDescription: "Pull out specific pages from a PDF into a new document. Browser-based, private.",
    faqs: [
      { question: "What format do I enter pages?", answer: "Comma-separated numbers or ranges: 1,3,5-8." },
      { question: "Does the original file change?", answer: "No. A new PDF is created with only the extracted pages." },
    ],
  },
  '/reverse-pdf': {
    intro:
      'Reverse PDF flips the entire page order of a document, putting the last page first and the first page last. This simple transformation is surprisingly handy for print workflows, especially when printing double-sided documents that come out in reverse order from the printer tray.',
    action: 'reverse PDF page order',
    steps: [
      'Upload the PDF whose page order you want to reverse.',
      'The tool automatically reverses all pages.',
      'Click "Download" to save the reversed document.',
    ],
    useCases: [
      'Fix the order of documents that printed in reverse.',
      'Reverse chronological logs to read oldest-first.',
      'Prepare documents for specific binding requirements.',
      'Reorder photo albums or portfolio pages.',
    ],
      seoTitle: "Reverse PDF Pages Order – Free & Private Online Tool",
    seoDescription: "Reverse the page order of your PDF instantly in the browser. No uploads, 100% private and free. Great for reading books and documents in reverse.",
    faqs: [
      { question: "What does reversing a PDF do?", answer: "It flips the page order so the last page becomes the first page, and vice versa." },
      { question: "Is my file uploaded to a server?", answer: "No. Everything runs locally in your browser. Your file never leaves your device." },
      { question: "Is there a page limit?", answer: "No hard limit. Very large files may take more time depending on your device." },
    ],
  },
  '/add-blank-page': {
    intro:
      'Add Blank Page inserts one or more blank pages at any position in your PDF. Choose the paper size, orientation, and position, then download the updated file. This is especially useful for adding separator pages between sections, ensuring double-sided printing starts on the right page, or reserving space for handwritten notes.',
    action: 'add blank pages to a PDF',
    steps: [
      'Upload the PDF where you want to insert blank pages.',
      'Choose the position, paper size, and number of blank pages to add.',
      'Click "Add & Download" to save the updated PDF.',
    ],
    useCases: [
      'Insert separator pages between report sections.',
      'Add pages for handwritten notes in a printed workbook.',
      'Ensure chapters start on odd-numbered pages for booklet printing.',
      'Pad a document to meet a minimum page-count requirement.',
    ],
      seoTitle: "Add Blank Page to PDF – Insert Empty Page Online Free",
    seoDescription: "Insert a blank page at the beginning, end, or any position in your PDF. 100% private — processed in your browser.",
    faqs: [
      { question: "Can I insert a blank page at any position?", answer: "Yes. You can insert before the first page, after the last page, or specify a page number to insert after." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },
  '/alternate-merge': {
    intro:
      'Alternate Merge interleaves pages from two PDFs in an alternating pattern — page 1 from file A, page 1 from file B, page 2 from file A, page 2 from file B, and so on. This is the go-to tool for reassembling double-sided scans when you scanned the front and back pages into separate files.',
    action: 'alternate-merge two PDFs',
    steps: [
      'Upload the first PDF (e.g., front sides of scanned pages).',
      'Upload the second PDF (e.g., back sides).',
      'Click "Merge" to interleave the pages and download the result.',
    ],
    useCases: [
      'Reassemble double-sided scans from a single-sided scanner.',
      'Interleave question sheets and answer sheets.',
      'Combine two parallel document versions page-by-page.',
      'Merge translated and original-language pages side by side.',
    ],
      seoTitle: "Alternate Merge PDFs – Interleave Pages from Multiple PDFs",
    seoDescription: "Interleave pages from two or more PDFs in alternating order. Perfect for combining front and back scans. 100% private — browser only.",
    faqs: [
      { question: "What is alternate merge?", answer: "It interleaves pages from multiple PDFs: page 1 of doc 1, page 1 of doc 2, page 2 of doc 1, etc. — perfect for merging duplex scans." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your files never leave your device." },
    ],
  },
  '/n-up-pdf': {
    intro:
      'N-Up PDF arranges multiple PDF pages onto a single sheet — 2-up, 4-up, or 9-up — to save paper when printing. The tool preserves text clarity by scaling pages proportionally and arranging them in a grid layout. It\'s ideal for creating compact handouts, study materials, or draft reviews.',
    action: 'create N-up layouts',
    steps: [
      'Upload the PDF you want to arrange.',
      'Select the number of pages per sheet (2, 4, or 9).',
      'Click "Generate" to create the multi-up layout and download.',
    ],
    useCases: [
      'Print lecture slides as compact handouts (4 per page).',
      'Create quick-reference cheat sheets from multi-page documents.',
      'Save paper when printing draft documents for review.',
      'Prepare study materials with multiple pages visible at once.',
    ],
    seoTitle: 'N-Up PDF – Multiple Pages Per Sheet Online Free',
    seoDescription:
      'Put multiple PDF pages on one sheet — 2-up, 4-up or 9-up. Free N-up PDF tool that runs in your browser with no file uploads.',
    faqs: [
      {
        question: 'What is N-up printing?',
        answer:
          'N-up printing places several pages side by side on a single sheet. 2-up puts two pages on one sheet, 4-up puts four in a 2×2 grid, and 9-up puts nine in a 3×3 grid. It is the standard way to print handouts and drafts while using less paper.',
      },
      {
        question: 'How do I put 2 pages per sheet in a PDF?',
        answer:
          'Upload your PDF, choose the 2-up layout, and download the result. The tool creates a genuinely new PDF where each sheet contains two original pages, so the layout is baked into the file rather than being a print-time setting.',
      },
      {
        question: 'Does N-up change the PDF itself or just how it prints?',
        answer:
          'It changes the PDF itself. Your printer driver\'s N-up option only affects that one print job, whereas this tool produces a new file you can share, archive, or print anywhere and get the same layout.',
      },
      {
        question: 'Will the text still be readable at 4-up or 9-up?',
        answer:
          'Pages are scaled down proportionally, so text stays sharp but becomes physically smaller. 2-up and 4-up remain comfortable to read for most documents; 9-up is best for visual reference such as slides or thumbnails rather than body text.',
      },
      {
        question: 'Is the original page order preserved?',
        answer:
          'Yes. Pages are placed left to right, then top to bottom, in their original order, so reading sequence is maintained across every sheet.',
      },
    ],
    comparison: {
      heading: 'N-Up PDF vs your printer\'s N-up setting',
      body: 'Most printer drivers can print several pages per sheet, but the setting lives in the print dialog: it applies to one job on one machine, and anyone you send the file to gets the original one-page-per-sheet layout. This tool bakes the N-up layout into a new PDF, so the handout looks identical wherever it is opened or printed. Use the printer setting for a quick one-off print on your own machine; use this tool when you need to share, email, or archive the compact version — and because it runs locally, the document never leaves your device.',
    },
  },
  '/overlay-pdf': {
    intro:
      'Overlay PDF layers one PDF on top of another, combining their content on the same pages. Use it to apply letterhead, branded backgrounds, or watermark templates to an existing document. The overlay can be placed above or below the base document content, with transparency preserved.',
    action: 'overlay PDFs',
    steps: [
      'Upload the base PDF document.',
      'Upload the overlay PDF (letterhead, template, or background).',
      'Choose overlay or underlay mode, then download the combined result.',
    ],
    useCases: [
      'Apply company letterhead to a plain document.',
      'Add a branded background to presentation slides.',
      'Overlay a signature template onto a contract.',
      'Layer grid lines or ruled paper under handwritten notes.',
    ],
      seoTitle: "Overlay / Underlay PDFs – Stamp One PDF Over Another",
    seoDescription: "Layer one PDF on top of or behind another. Perfect for adding letterheads, watermarks, or background templates. 100% private.",
    faqs: [
      { question: "What is the difference between overlay and underlay?", answer: "Overlay places the second PDF on top of the base. Underlay places it behind the base content." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your files never leave your device." },
    ],
  },
  '/divide-pages': {
    intro:
      'Divide Pages splits each page of a PDF in half — either horizontally or vertically — creating two new pages from every original page. This is particularly useful for documents scanned as two-page spreads (like open books) that you want to read as individual pages on screen or reprint at full size.',
    action: 'divide PDF pages',
    steps: [
      'Upload the PDF with pages you want to divide.',
      'Choose horizontal or vertical splitting.',
      'Click "Divide & Download" to get the result with twice as many pages.',
    ],
    useCases: [
      'Split scanned book spreads into individual left and right pages.',
      'Divide wide landscape pages into two portrait pages.',
      'Separate two-column layouts into individual pages.',
      'Convert two-up handouts back to full-size pages.',
    ],
      seoTitle: "Divide PDF Pages Online – Free & Private",
    seoDescription: "Split each PDF page in half horizontally or vertically. Browser-based, no uploads.",
    faqs: [
      { question: "What does Divide do?", answer: "Each page is split into two halves, doubling the page count." },
      { question: "Which direction should I choose?", answer: "Vertical splits pages left/right; Horizontal splits top/bottom." },
    ],
  },
  '/combine-single-page': {
    intro:
      'Stitch Pages combines all pages of a PDF into one long, continuous page — like a single scrollable strip. This is ideal for creating seamless previews of multi-page designs, timelines, or workflows where page breaks interrupt the visual flow.',
    action: 'combine PDF pages into one page',
    steps: [
      'Upload the multi-page PDF you want to stitch.',
      'The tool automatically combines all pages vertically.',
      'Download the single continuous page PDF.',
    ],
    useCases: [
      'Create a seamless preview of a multi-page design layout.',
      'View an entire document flow without page breaks.',
      'Prepare a timeline or workflow diagram as one continuous image.',
      'Convert a multi-page form into a single scrollable page.',
    ],
    h1: "Combine PDF Pages into One",
    seoTitle: 'Combine PDF Pages Into One Page – Stitch Vertically',
    seoDescription:
      'Stitch every page of a PDF into one long, continuous page. Free browser-based tool for scrollable documents — no uploads, no signup.',
    faqs: [
      {
        question: 'How do I combine PDF pages into one single page?',
        answer:
          'Upload your PDF and the tool stacks every page vertically into one tall page, then gives you the result as a new PDF. Unlike merging, which joins files while keeping separate pages, this removes the page breaks entirely.',
      },
      {
        question: 'What is the difference between this and merging a PDF?',
        answer:
          'Merging combines multiple files into one document that still has separate pages. This tool takes a single document and flattens all of its pages into one continuous canvas, so there are no page breaks at all.',
      },
      {
        question: 'Can I stack pages horizontally instead of vertically?',
        answer:
          'This tool stitches vertically, producing one tall page suited to scrolling. For a side-by-side grid layout, use the Grid Combine or N-Up PDF tools instead.',
      },
      {
        question: 'Is there a limit to how tall the combined page can be?',
        answer:
          'The PDF format allows very large page dimensions, but extremely long pages can be slow to open in some viewers and may not print on standard paper. For documents beyond roughly 50 pages, expect a very tall file best suited to on-screen viewing.',
      },
      {
        question: 'Does combining pages reduce quality?',
        answer:
          'No. Page content is placed onto the taller canvas at its original resolution, so text stays selectable and images keep their quality.',
      },
    ],
    comparison: {
      heading: 'When to use this vs Merge PDF',
      body: 'These two tools sound similar but solve opposite problems. Use Merge PDF when you have several files and want one document that still turns page by page — reports, contracts, application packs. Use this tool when page breaks are the problem: a design mockup, a timeline, a long form, or anything you want to scroll through as one continuous strip rather than click through. If you need a printable document, merge; if you need a seamless on-screen preview, stitch. Both run entirely in your browser, so neither uploads your file.',
    },
  },
  '/grid-combine': {
    intro:
      'Grid Combine arranges pages from multiple PDFs into a customizable grid on a single page. Unlike N-Up (which works with a single file), Grid Combine lets you select specific files and page numbers, arrange them in rows and columns, and control spacing — perfect for comparison layouts, portfolio sheets, or proofing grids.',
    action: 'combine PDFs in a grid',
    steps: [
      'Upload multiple PDF files.',
      'Configure the grid layout (rows, columns, spacing).',
      'Click "Combine" to generate the grid and download.',
    ],
    useCases: [
      'Create side-by-side document comparisons on one sheet.',
      'Build portfolio proof sheets from multiple design files.',
      'Arrange thumbnail previews for a document index.',
      'Combine receipts or small documents onto a single page for filing.',
    ],
      seoTitle: "Grid Combine PDFs – Arrange Multiple PDFs in a Grid Layout",
    seoDescription: "Arrange first pages of multiple PDFs in a grid layout. Create comparison sheets or overviews. 100% private — browser only.",
    faqs: [
      { question: "What does Grid Combine do?", answer: "It takes the first page of each PDF you upload and arranges them in a grid layout on a single page, like a comparison sheet." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your files never leave your device." },
    ],
  },
  '/posterize-pdf': {
    intro:
      'Posterize PDF tiles a single large-format PDF page across multiple standard-sized sheets for large-format poster printing. Set the number of sheets and overlap margins, then print on a regular printer and assemble the pieces into a full-size poster, banner, or architectural drawing.',
    action: 'posterize a PDF',
    steps: [
      'Upload the PDF page you want to print as a poster.',
      'Set the number of sheets (rows × columns) and overlap margins.',
      'Download the tiled PDF and print each page on your regular printer.',
    ],
    useCases: [
      'Print a large poster or banner using a standard home printer.',
      'Create wall-sized architectural or engineering drawings.',
      'Produce large event signage without a wide-format printer.',
      'Print classroom displays or educational wall charts.',
    ],
    seoTitle: 'Posterize PDF – Tile Large Pages for Poster Printing',
    seoDescription:
      'Split a large PDF page into printable tiles and assemble a full-size poster on a normal printer. Free, browser-based, no file uploads.',
    faqs: [
      {
        question: 'What does posterizing a PDF mean?',
        answer:
          'Posterizing tiles one large page across several standard-sized sheets. You print the sheets on an ordinary printer and tape or glue them together to assemble a poster far larger than your printer can produce in one pass.',
      },
      {
        question: 'How do I print a poster without a large-format printer?',
        answer:
          'Upload your design, choose how many rows and columns of sheets to split it across, and download the tiled PDF. Every tile prints on regular A4 or Letter paper, and assembling them recreates the full-size poster.',
      },
      {
        question: 'What is the overlap margin for?',
        answer:
          'The overlap repeats a small strip of the design along the edge of adjacent tiles, giving you a margin to trim and a visual guide for lining sheets up. Without overlap, printer edge margins would leave visible white gaps between tiles.',
      },
      {
        question: 'Will enlarging the PDF make it blurry?',
        answer:
          'Vector artwork — text, shapes and logos — stays perfectly sharp at any size. Embedded photos are limited by their original resolution, so a low-resolution image will look soft once enlarged to poster scale.',
      },
      {
        question: 'What size poster can I make?',
        answer:
          'It depends on the grid you choose. A 2×2 grid of A4 sheets makes roughly an A2 poster, and 3×3 makes roughly A1. Larger grids keep scaling up, limited only by how many sheets you are willing to assemble.',
      },
    ],
    comparison: {
      heading: 'When to use this vs a print shop',
      body: 'A print shop gives you a single seamless sheet on heavy stock, which is the right call for a client presentation or anything customer-facing. But it costs money, takes a trip or a delivery wait, and means handing your artwork to a third party. Posterize PDF is the better option when you need the poster today, when it is for internal use — a wall chart, an event sign, a draft review of an architectural drawing — or when the design is confidential. Because tiling happens in your browser, the file is never uploaded, so unreleased or sensitive artwork stays on your machine.',
    },
  },
  '/add-page-labels': {
    intro:
      'Add Page Labels lets you assign custom labels to PDF page ranges — Roman numerals for front matter, Arabic numbers for the body, or prefixed labels like "A-1, A-2" for appendices. The labels appear in the PDF viewer\'s page navigation, making long documents much easier to navigate.',
    action: 'add page labels to a PDF',
    steps: [
      'Upload the PDF you want to label.',
      'Define label ranges: choose a style (Arabic, Roman, letters) and starting number for each section.',
      'Click "Apply & Download" to save the labeled PDF.',
    ],
    useCases: [
      'Add Roman numeral labels to a book\'s preface and table of contents.',
      'Prefix section labels like "A-1, B-1" for multi-part documents.',
      'Set page numbering to start at a specific number for extracted sections.',
      'Add consistent labels across merged documents from different sources.',
    ],
    h1: "Add Page Labels to PDF",
    seoTitle: 'Add Page Labels to PDF – Roman Numerals & Prefixes',
    seoDescription:
      'Add custom PDF page labels — Roman numerals, letters, or prefixes like A-1. Free browser-based tool, no uploads and no signup.',
    faqs: [
      {
        question: 'What are PDF page labels?',
        answer:
          'Page labels are the identifiers a PDF viewer shows for each page, such as "ii", "A-1" or "12". They are stored as document metadata, which means a page can be labelled "iv" even though it is physically the fourth page in the file.',
      },
      {
        question: 'How do I add Roman numeral page numbers to a PDF?',
        answer:
          'Upload the PDF, define a label range covering your front matter, and choose the Roman numeral style. The preface and table of contents will then display as i, ii, iii while the body can restart at 1 in Arabic numerals.',
      },
      {
        question: 'What is the difference between page labels and page numbers?',
        answer:
          'Page numbers are printed onto the page content and are visible when you print. Page labels are metadata shown in the viewer\'s navigation and thumbnail panel. Use the Page Numbers tool if you want visible numbers stamped onto the page itself.',
      },
      {
        question: 'Can I use different label styles in one document?',
        answer:
          'Yes. You can define several ranges, each with its own style and starting number — for example Roman numerals for pages 1 to 8, then Arabic numbers restarting at 1 for the body, then an "A-" prefix for the appendix.',
      },
      {
        question: 'Do page labels work in every PDF reader?',
        answer:
          'Page labels are part of the PDF specification and are honoured by Adobe Acrobat, Preview, and most desktop readers. Some lightweight mobile and browser viewers ignore them and display sequential numbers instead.',
      },
    ],
    comparison: {
      heading: 'When to use page labels vs stamped page numbers',
      body: 'Reach for page labels when you want the viewer\'s navigation to match the document\'s real structure — so that typing "iv" jumps to the fourth page of the preface, and the body starts again at page 1. Nothing is drawn onto the page, so the design stays untouched and the change is reversible. Choose the Page Numbers tool instead when the numbers must survive printing or be visible to anyone who opens the file, since stamped numbers are part of the page content. Long documents often want both: labels for on-screen navigation, stamped numbers for the printed copy.',
    },
  },
  '/pdf-metadata': {
    intro:
      'PDF Metadata inspects and displays the internal properties of any PDF: title, author, creation date, modification date, producer, page count, and file size. This information is essential for cataloging, compliance, and understanding a document\'s provenance — all viewable without any server processing.',
    action: 'inspect PDF metadata',
    steps: [
      'Upload the PDF you want to inspect.',
      'Review the metadata properties displayed (title, author, dates, page count, etc.).',
      'Copy or note the information you need — no download required.',
    ],
    useCases: [
      'Check the author and creation date of a legal document.',
      'Verify page count and file size before emailing a large PDF.',
      'Audit metadata before publishing or sharing confidential documents.',
      'Confirm the PDF producer tool used for troubleshooting formatting issues.',
    ],
      seoTitle: "PDF Metadata Editor - View, Edit and Remove PDF Metadata",
    seoDescription: "View, edit, or remove all PDF metadata including title, author, keywords, and dates. 100% private, processed locally in your browser.",
    faqs: [
      { question: "What metadata is stored in a PDF?", answer: "PDFs can contain title, author, subject, keywords, creator, producer, and creation/modification dates." },
      { question: "Will my file be uploaded?", answer: "No. Everything runs locally in your browser." },
      { question: "Can I remove all metadata at once?", answer: "Yes! Use the \"Remove All\" mode to strip all metadata in one click." },
    ],
  },
  '/pdf-to-zip': {
    intro:
      'PDF to ZIP bundles one or more PDF files into a single compressed ZIP archive. This makes it easy to share multiple documents as one download, organize files for archival, or prepare batches for email attachments with reduced total file size.',
    action: 'bundle PDFs into a ZIP',
    steps: [
      'Select one or more PDF files to include in the archive.',
      'The tool packages them into a single ZIP file.',
      'Click "Download ZIP" to save the archive.',
    ],
    useCases: [
      'Bundle multiple invoices or receipts for email submission.',
      'Create a ZIP archive of project documents for team sharing.',
      'Package multiple certificates or forms for batch download.',
      'Prepare document sets for archival or backup storage.',
    ],
    seoTitle: 'PDF to ZIP – Package Multiple PDFs into an Archive',
    seoDescription:
      'Bundle several PDF files into one ZIP archive for easy sharing or backup. Free browser-based tool — your documents are never uploaded.',
    faqs: [
      {
        question: 'How do I put multiple PDFs into one ZIP file?',
        answer:
          'Select every PDF you want to include, and the tool packages them into a single ZIP archive you can download. There is no software to install, and the files are bundled on your own device.',
      },
      {
        question: 'Does zipping PDFs make them smaller?',
        answer:
          'Usually only slightly. PDFs already compress their text and images internally, so ZIP has little left to squeeze out — expect a few percent at best. The real benefit is packaging many files into one tidy download. Use the Compress PDF tool if size reduction is your actual goal.',
      },
      {
        question: 'What is the difference between zipping PDFs and merging them?',
        answer:
          'A ZIP keeps each PDF as a separate file inside one container, so recipients can extract them individually. Merging combines everything into a single continuous document. Choose ZIP when the files must stay distinct, and Merge when they should read as one document.',
      },
      {
        question: 'Is there a file size or count limit?',
        answer:
          'There is no artificial limit. Because archiving happens in your browser, the practical ceiling is your device\'s available memory — bundling many very large PDFs at once may be slow on low-memory machines.',
      },
      {
        question: 'Can I password-protect the ZIP archive?',
        answer:
          'Not from this tool — it produces a standard, unencrypted ZIP. If you need protection, use the PDF Security tool to password-protect the individual PDFs before bundling them.',
      },
    ],
    comparison: {
      heading: 'When to use PDF to ZIP vs Merge PDF',
      body: 'Use PDF to ZIP when the documents need to stay separate: a batch of invoices your accountant will file individually, certificates for different people, or a set of forms someone will open one at a time. The recipient gets a single download but still ends up with distinct files. Use Merge PDF when the pages belong together as one readable document — a report, a contract, an application pack. A useful rule of thumb: if someone would print it front to back, merge it; if they would sort it into folders, zip it.',
    },
  },
  '/compare-pdf': {
    intro:
      'Compare PDFs lets you place two PDF files side by side and identify differences in page count, text content, and structure. The tool highlights what changed between document versions — invaluable for contract review, proofreading, and quality assurance. Everything runs locally so sensitive documents remain private.',
    action: 'compare two PDFs',
    steps: [
      'Upload the first PDF (the original or baseline version).',
      'Upload the second PDF (the revised or updated version).',
      'Review the comparison results showing differences in content and structure.',
    ],
    useCases: [
      'Compare contract revisions to identify changed clauses.',
      'Verify that a PDF export matches the original document.',
      'Proofread by comparing draft and final versions of a report.',
      'Check that redaction or editing didn\'t affect surrounding content.',
    ],
      seoTitle: "Compare PDFs – Page Count and Text Differences",
    seoDescription: "Compare two PDFs page by page using extracted text differences, page counts, and changed-page summaries.",
    faqs: [
      { question: "Does PDF compare use visual image diffing?", answer: "No. This tool keeps things practical in the browser by comparing extracted text page by page first." },
      { question: "Will scanned PDFs still work?", answer: "Often yes. If needed, the compare flow falls back to OCR, which can take longer on large scanned files." },
      { question: "Can it detect different page counts?", answer: "Yes. The summary shows each document page count and highlights changed or missing pages." },
    ],
  },
  '/pdf-booklet': {
    intro:
      'PDF Booklet imposes pages into a saddle-stitch booklet layout, rearranging page order so that when printed double-sided and folded in half, the pages read in the correct sequence. This eliminates the need for commercial printing software when creating pamphlets, programs, or self-published booklets.',
    action: 'create a PDF booklet',
    steps: [
      'Upload the PDF you want to convert into a booklet.',
      'Choose your paper size and booklet settings.',
      'Download the imposed PDF, print double-sided, fold, and staple.',
    ],
    useCases: [
      'Print a self-published zine or chapbook at home.',
      'Create event programs or wedding booklets.',
      'Make compact reference guides that fold into pocket-sized booklets.',
      'Produce church bulletins or meeting agendas in booklet format.',
    ],
      seoTitle: "PDF Booklet – Create Saddle-Stitch Booklet Layout",
    seoDescription: "Rearrange PDF pages into a booklet layout that you can print, fold, and staple. 100% private — browser only.",
    faqs: [
      { question: "What is a booklet layout?", answer: "A booklet layout reorders pages so that when you print double-sided, fold, and staple, the pages appear in the correct reading order." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },

  // ── EDIT & ANNOTATE ────────────────────────────────────────────────────────
  '/annotate-pdf': {
    intro:
      'Fill Forms & Annotate lets you add text, highlights, checkmarks, drawings, and signatures directly onto any PDF — interactive forms or flat documents alike. Type into form fields, mark up contracts, or sign documents without printing. All annotations are embedded into the PDF for sharing.',
    action: 'annotate a PDF',
    steps: [
      'Upload the PDF you want to annotate or fill out.',
      'Use the toolbar to add text, highlights, checkmarks, or draw freehand.',
      'Click "Save" to download the annotated PDF with all changes embedded.',
    ],
    useCases: [
      'Fill out government or tax forms without printing.',
      'Add comments and highlights during contract review.',
      'Mark up a student paper or manuscript with feedback.',
      'Sign and annotate forms for remote submission.',
    ],
      seoTitle: "Fill Forms / Annotate PDF – Text, Highlights, Signatures",
    seoDescription: "Add text boxes, highlights, checkmarks, dates, and simple signatures to a PDF locally in your browser.",
    faqs: [
      { question: "Can I add a typed or image signature?", answer: "Yes. Use Typed signature for a quick name placement or Image signature to upload a signature graphic." },
      { question: "Are the annotations flattened into the export?", answer: "Yes. The exported PDF burns the current overlay items into the document so the result is easy to share." },
      { question: "Can I move fields after placing them?", answer: "Yes. Select a tool, click to add it, and drag the overlay item around before exporting." },
    ],
  },
  '/watermark-pdf': {
    intro:
      'Watermark PDF applies text or image watermarks across all or selected pages of your PDF. Customize the text, font size, color, opacity, rotation angle, and position to create "DRAFT", "CONFIDENTIAL", or branded watermarks. The watermark is embedded into the PDF content, not just a visual overlay.',
    action: 'add watermarks to a PDF',
    steps: [
      'Upload the PDF you want to watermark.',
      'Configure the watermark text or upload an image, then adjust opacity, size, and position.',
      'Click "Apply & Download" to save the watermarked PDF.',
    ],
    useCases: [
      'Mark draft documents as "DRAFT" before circulating for review.',
      'Add "CONFIDENTIAL" stamps to sensitive internal reports.',
      'Apply company branding or logos across all pages.',
      'Protect creative work with a visible copyright watermark.',
    ],
      seoTitle: "Watermark PDF – Add Text or Image Watermarks",
    seoDescription: "Add text or image watermarks to a PDF locally in your browser. Control opacity, size, rotation, and page targeting.",
    faqs: [
      { question: "Does watermarking upload my PDF?", answer: "No. The preview and the export both happen locally in the browser." },
      { question: "Can I watermark only a few pages?", answer: "Yes. Turn off Apply to all pages and enter page numbers such as 1,3,5-8." },
      { question: "Can I use a logo image as a watermark?", answer: "Yes. Switch to image watermark mode and upload a PNG or JPG logo." },
    ],
  },
  '/redact-pdf': {
    intro:
      'Redact PDF permanently covers sensitive content — names, addresses, financial data, or any text — with opaque black boxes. Unlike simply drawing a shape over text, proper redaction removes the underlying data from the PDF so it cannot be recovered by copying, searching, or extracting the text layer.',
    action: 'redact sensitive PDF content',
    steps: [
      'Upload the PDF containing sensitive information.',
      'Draw redaction boxes over the content you want to permanently remove.',
      'Click "Apply Redactions & Download" to save the permanently redacted PDF.',
    ],
    useCases: [
      'Remove personal information before responding to FOIA or GDPR requests.',
      'Redact financial details from contracts before sharing with third parties.',
      'Black out student names on shared academic records.',
      'Remove classified or proprietary information from government documents.',
    ],
      seoTitle: "Redact PDF – Visual Burn-In Redaction Tool",
    seoDescription: "Place rectangular redaction boxes on a PDF and export a visually burned-in redacted copy locally in your browser.",
    faqs: [
      { question: "Are these full forensic PDF redactions?", answer: "No. This MVP burns black boxes into the visual page output. The UI and copy make that limitation explicit." },
      { question: "Can I place multiple boxes per page?", answer: "Yes. Draw as many rectangles as you need on each page before exporting." },
      { question: "Can I zoom while redacting?", answer: "Yes. Use the zoom slider to make precise placements on small content areas." },
    ],
  },
  '/sign-pdf': {
    intro:
      'Sign PDF lets you draw, type, or upload a signature image and place it anywhere on a PDF. You can resize and reposition the signature precisely, then flatten it into the document so it cannot be moved or edited. The entire signing process happens in your browser — your signature never touches a server.',
    action: 'sign a PDF',
    steps: [
      'Upload the PDF you need to sign.',
      'Draw your signature with the mouse or finger, type it, or upload a signature image.',
      'Position the signature on the page, then click "Save" to download the signed PDF.',
    ],
    useCases: [
      'Sign contracts and agreements without printing or scanning.',
      'Add your signature to permission slips, forms, or applications.',
      'Sign NDAs and legal documents remotely.',
      'Initial multiple pages of a multi-page agreement.',
    ],
      seoTitle: "Sign PDF – Add Signature to PDF Online Free",
    seoDescription: "Draw your signature and add it to any PDF page. 100% private — all processing done in your browser.",
    faqs: [
      { question: "Is this a legally binding signature?", answer: "This draws an image of your signature on the PDF — it is not a cryptographic digital signature. For legal binding, you need a certified CA-backed digital signature." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },
  '/crop-pdf': {
    intro:
      'Crop PDF trims margins or sets a custom crop area on PDF pages. Reduce whitespace, remove headers and footers, or focus on a specific region of each page. The crop is non-destructive in the sense that page content is preserved — the visible area is simply redefined.',
    action: 'crop PDF pages',
    steps: [
      'Upload the PDF you want to crop.',
      'Draw or enter the crop area dimensions for the pages.',
      'Click "Crop & Download" to save the cropped PDF.',
    ],
    useCases: [
      'Trim excess margins to make a PDF more readable on small screens.',
      'Remove headers or footers from printed documents.',
      'Focus on a specific region of a page for presentation slides.',
      'Standardize page sizes across a merged document with inconsistent margins.',
    ],
      seoTitle: "Crop PDF Pages Online – Free & Private",
    seoDescription: "Trim PDF margins by setting crop amounts (in points) for top, right, bottom, left. Browser-based.",
    faqs: [
      { question: "What unit are the crop values?", answer: "Values are in points (72 points = 1 inch)." },
      { question: "Does cropping delete content?", answer: "No. PDF crop boxes hide content; the original data remains embedded." },
    ],
  },
  '/bookmark': {
    intro:
      'PDF Bookmarks lets you view, add, edit, and delete the navigational bookmarks (also called outlines) in a PDF. Bookmarks create a clickable table of contents in the PDF viewer sidebar, making it much easier for readers to jump between sections of long documents.',
    action: 'manage PDF bookmarks',
    steps: [
      'Upload the PDF you want to edit bookmarks for.',
      'View existing bookmarks, or add new ones by entering titles and target page numbers.',
      'Click "Save" to download the PDF with updated bookmarks.',
    ],
    useCases: [
      'Add navigational bookmarks to a long report or manual.',
      'Fix or update broken bookmark links in an existing PDF.',
      'Create a structured outline for a thesis or dissertation.',
      'Remove unwanted bookmarks from a PDF before distributing.',
    ],
      seoTitle: "Add PDF Bookmarks Online – Free & Private",
    seoDescription: "Add navigation bookmarks to a PDF. Specify title and page number for each bookmark.",
    faqs: [
      { question: "What are PDF bookmarks?", answer: "Bookmarks (outline entries) are navigation shortcuts that appear in the PDF reader sidebar." },
      { question: "Can I nest bookmarks?", answer: "Flat bookmarks are supported. Hierarchical nesting requires a desktop PDF editor." },
    ],
  },
  '/table-of-contents': {
    intro:
      'Table of Contents automatically generates a linked table of contents page from the bookmark structure of your PDF. The generated TOC includes page numbers and clickable links, making it easy for readers to navigate the document without manually creating the contents page.',
    action: 'generate a table of contents',
    steps: [
      'Upload a PDF that has bookmarks defined.',
      'The tool reads the bookmark hierarchy and generates a formatted TOC.',
      'Download the PDF with the table of contents inserted at the front.',
    ],
    useCases: [
      'Add a professional TOC to a report or proposal.',
      'Generate navigation pages for long technical manuals.',
      'Create a contents page for a compiled anthology or collection.',
      'Improve accessibility of documents by adding structured navigation.',
    ],
      seoTitle: "Add Table of Contents to PDF – Free & Private",
    seoDescription: "Prepend an auto-generated table of contents page to any PDF. Browser-based.",
    faqs: [
      { question: "What headings are detected?", answer: "A page-by-page TOC is generated listing each page number." },
      { question: "Is the TOC with hyperlinks?", answer: "Basic page-number listing is generated; full hyperlink TOC requires a desktop app." },
    ],
  },
  '/page-numbers': {
    intro:
      'Add Page Numbers places customizable page numbers on every page (or selected pages) of your PDF. Choose the position (top/bottom, left/center/right), font, size, color, and starting number. You can also add prefix text like "Page" or "-" to match your formatting requirements.',
    action: 'add page numbers',
    steps: [
      'Upload the PDF that needs page numbers.',
      'Choose the position, font, starting number, and any prefix text.',
      'Click "Apply & Download" to save the numbered PDF.',
    ],
    useCases: [
      'Add page numbers to a document that was scanned without them.',
      'Number the pages of a merged document for reference.',
      'Add numbered footers to legal or academic documents.',
      'Create numbered handouts for workshops or classes.',
    ],
      seoTitle: "Add Page Numbers to PDF – Free & Private",
    seoDescription: "Add customizable page numbers to any PDF. Choose position, start number, font size, and prefix/suffix.",
    faqs: [
      { question: "Can I start numbering from a custom number?", answer: "Yes. Set the start number field to any value." },
      { question: "Can I add a prefix like \"Page\"?", answer: "Yes. Enter text in the Prefix field, e.g. \"Page \"." },
    ],
  },
  '/header-footer': {
    intro:
      'Header & Footer adds custom text to the top and/or bottom of every page in your PDF. Include dates, document titles, confidentiality notices, or any repeated text. Font, size, color, and margins are all customizable to match your document\'s style.',
    action: 'add headers and footers',
    steps: [
      'Upload the PDF you want to modify.',
      'Enter text for the header and/or footer, and configure styling options.',
      'Click "Apply & Download" to save the PDF with headers and footers.',
    ],
    useCases: [
      'Add a "Confidential" header to every page of a sensitive document.',
      'Include the document title and date in the footer of a report.',
      'Add company name or project title to all pages of a proposal.',
      'Insert legal disclaimers in the footer of terms and conditions.',
    ],
      seoTitle: "Add Header & Footer to PDF – Free Online Tool",
    seoDescription: "Add custom header and footer text to every page of your PDF. Works entirely in your browser — no uploads, 100% private.",
    faqs: [
      { question: "Will my file be uploaded?", answer: "No. Everything runs locally in your browser." },
      { question: "Can I add just a header or just a footer?", answer: "Yes! You can fill in only the header field, only the footer field, or both." },
      { question: "Is the header/footer centered?", answer: "Yes, both header and footer text are centered horizontally on the page." },
    ],
  },
  '/background-color': {
    intro:
      'Background Color adds a solid color background to all pages of your PDF. Choose any color to give your document a distinctive look, improve readability with a tinted background, or add visual separation between sections when printing.',
    action: 'add background color',
    steps: [
      'Upload the PDF you want to color.',
      'Select a background color using the color picker.',
      'Click "Apply & Download" to save the colored PDF.',
    ],
    useCases: [
      'Add a subtle tint to make a document easier on the eyes when reading on screen.',
      'Create visually distinct sections with different background colors.',
      'Prepare colored paper simulation for digital distribution.',
      'Add a branded background color to match corporate guidelines.',
    ],
      seoTitle: "Add Background Color to PDF – Change PDF Page Color Online",
    seoDescription: "Add a colored background to all pages of your PDF. Choose from presets or pick a custom color. 100% private.",
    faqs: [
      { question: "Will this cover existing content?", answer: "The color layer is drawn over existing content. For best results, use light, transparent-friendly colors or use the underlay mode." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },
  '/add-stamp': {
    intro:
      'Add Stamp places preset or custom text stamps — such as "DRAFT", "CONFIDENTIAL", "APPROVED", or "COPY" — onto your PDF pages. Unlike watermarks, stamps are typically bold and clearly visible, meant to convey the document\'s status at a glance.',
    action: 'stamp a PDF',
    steps: [
      'Upload the PDF you want to stamp.',
      'Select a preset stamp (DRAFT, CONFIDENTIAL, etc.) or enter custom text.',
      'Adjust position and appearance, then click "Apply & Download".',
    ],
    useCases: [
      'Mark documents as DRAFT during the review cycle.',
      'Stamp "APPROVED" on finalized proposals or invoices.',
      'Add "COPY" stamps to distinguish duplicates from originals.',
      'Label documents as "FOR INTERNAL USE ONLY" before distribution.',
    ],
      seoTitle: "Add Stamp to PDF – DRAFT, CONFIDENTIAL & Custom Stamps Free",
    seoDescription: "Add watermark stamps like DRAFT, CONFIDENTIAL, APPROVED to your PDF. Custom text, color, opacity. 100% private — processed locally.",
    faqs: [
      { question: "Will my file be uploaded?", answer: "No. All processing happens in your browser." },
      { question: "Can I use custom text for the stamp?", answer: "Yes! Type any text you like into the stamp field." },
      { question: "Can I control the stamp opacity?", answer: "Yes, use the opacity slider — lower values make the stamp more transparent." },
    ],
  },
  '/remove-annotations': {
    intro:
      'Remove Annotations strips all comments, highlights, sticky notes, drawing markup, and links from a PDF. This cleans the document for final distribution, removing all reviewer markup and returning it to a pristine state. The underlying page content remains completely intact.',
    action: 'remove PDF annotations',
    steps: [
      'Upload the PDF with annotations you want to remove.',
      'Preview the annotations that will be stripped.',
      'Click "Remove & Download" to save the clean PDF.',
    ],
    useCases: [
      'Clean up a reviewed document before sending the final version to clients.',
      'Remove all comments and highlights from a shared draft.',
      'Strip hyperlinks from a PDF before printing.',
      'Prepare a clean copy of a heavily-annotated academic paper.',
    ],
      seoTitle: "Remove PDF Annotations Online – Free & Private",
    seoDescription: "Strip all comments, highlights, form fields, and interactive annotations from a PDF.",
    faqs: [
      { question: "What annotations are removed?", answer: "Form fields, comments, highlights, links, and other interactive elements are flattened or removed." },
      { question: "Is the content affected?", answer: "Static text and images remain; only interactive layers are removed." },
    ],
  },
  '/form-filler': {
    intro:
      'Form Filler detects and populates interactive form fields in a PDF. Type into text boxes, select checkboxes, and choose dropdown options, then flatten the result into a non-editable PDF. This lets you complete forms digitally and share them as finalized documents.',
    action: 'fill PDF forms',
    steps: [
      'Upload the PDF form you need to complete.',
      'Click on form fields to enter text, check boxes, or select options.',
      'Click "Flatten & Download" to save a completed, non-editable version.',
    ],
    useCases: [
      'Complete tax forms, applications, or government paperwork digitally.',
      'Fill out medical intake forms before an appointment.',
      'Complete employment onboarding documents remotely.',
      'Submit completed insurance claims or benefits forms.',
    ],
      seoTitle: "Fill PDF Forms – Fill & Flatten PDF Form Fields Online",
    seoDescription: "Upload a PDF with form fields, fill them in directly in your browser, and download the flattened result. 100% private.",
    faqs: [
      { question: "What types of fields are supported?", answer: "Text fields and checkboxes are supported. Radio buttons and dropdown lists may have limited support." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },
  '/form-creator': {
    intro:
      'Form Creator lets you build interactive PDF forms with text fields, checkboxes, dropdown menus, and radio buttons. Design forms visually by placing fields directly on the page, then export a fillable PDF that anyone can complete in their PDF viewer.',
    action: 'create PDF forms',
    steps: [
      'Upload a PDF to use as the form background, or start from a blank page.',
      'Add form fields: text inputs, checkboxes, dropdowns, and radio buttons.',
      'Click "Export" to download the interactive, fillable PDF form.',
    ],
    useCases: [
      'Create registration or application forms for events.',
      'Build employee onboarding or feedback forms.',
      'Design order forms or request forms for internal workflows.',
      'Create surveys or questionnaires in PDF format.',
    ],
      seoTitle: "PDF Form Filler – Fill & Flatten PDF Forms Online",
    seoDescription: "Detect and fill PDF form fields, then flatten and download. 100% browser-based.",
    faqs: [
      { question: "What PDF forms are supported?", answer: "Standard AcroForms with text fields and checkboxes." },
      { question: "What does flatten mean?", answer: "Flatten converts form fields to static text, making the form non-editable." },
    ],
  },
  '/remove-blank-pages': {
    intro:
      'Remove Blank Pages automatically detects and removes pages that contain little to no content. The tool analyzes each page\'s pixel content and text layer to determine blankness, then strips those pages from the output. Thresholds are configurable so you can define what counts as "blank."',
    action: 'remove blank pages',
    steps: [
      'Upload the PDF with suspected blank pages.',
      'The tool scans and identifies blank pages automatically.',
      'Review which pages will be removed, then click "Download" to save the cleaned PDF.',
    ],
    useCases: [
      'Clean up scanned documents that include blank separator pages.',
      'Remove accidental blank pages from exported reports.',
      'Trim trailing blank pages before sharing or printing.',
      'Reduce file size by eliminating unnecessary empty pages.',
    ],
      seoTitle: "Remove Blank PDF Pages Online – Free & Private",
    seoDescription: "Automatically detect and remove blank pages from a PDF. Adjust sensitivity. Browser-based.",
    faqs: [
      { question: "How is a blank page detected?", answer: "Pages are rendered and analysed; those with over 98% white pixels are considered blank." },
      { question: "What if a near-blank page is removed?", answer: "Lower the sensitivity slider to keep pages with light content." },
    ],
  },

  // ── CONVERT TO PDF ─────────────────────────────────────────────────────────
  '/images-to-pdf': {
    intro:
      'Images to PDF converts one or more images — JPG, PNG, WebP, SVG, BMP, HEIC, and TIFF — into a single PDF document. Drag to reorder pages, choose orientation and paper size, and set margins. The conversion uses lossless embedding for maximum quality, and everything happens in your browser.',
    action: 'convert images to PDF',
    steps: [
      'Select or drag-and-drop your image files (JPG, PNG, WebP, etc.).',
      'Reorder images, choose page orientation and paper size.',
      'Click "Convert & Download" to receive your PDF.',
    ],
    useCases: [
      'Compile photos into a PDF portfolio or lookbook.',
      'Convert scanned document images into a proper PDF.',
      'Bundle design mockups or screenshots into a single deliverable.',
      'Create a PDF photo album from vacation or event pictures.',
    ],
      seoTitle: "Convert Images to PDF - JPG, PNG, WebP, SVG, BMP to PDF",
    seoDescription: "Convert JPG, PNG, WebP, SVG, BMP, HEIC, and TIFF images to a single PDF with page size, orientation, and margin controls. Free and private.",
    faqs: [
      { question: "Does converting images to PDF upload my files?", answer: "No. All conversion happens in your browser. Your images never leave your device." },
      { question: "What image formats are supported?", answer: "JPG, JPEG, PNG, WebP, SVG, and BMP are supported in modern browsers. HEIC/HEIF and TIFF support depends on whether your browser can decode the files." },
      { question: "Can I choose the page size and orientation?", answer: "Yes. You can select A4 or Letter page size and choose portrait or landscape orientation before converting." },
      { question: "Can I reorder or rotate images before converting?", answer: "Yes. Use the arrow buttons to reorder and the rotate button to adjust each image before generating the PDF." },
    ],
  },
  '/jpg-to-pdf': {
    intro:
      'JPG to PDF turns JPEG photos, scans, and screenshots into a clean PDF document. It is useful when you need to send several camera images as one file, archive receipts, or prepare photo-based documents for upload. You can reorder images, rotate them, choose A4 or Letter page size, and control margins before downloading. The conversion runs in your browser, so the original JPG files are not uploaded to FilePilot.',
    action: 'convert JPG to PDF',
    steps: [
      'Select one or more JPG or JPEG images from your device.',
      'Reorder or rotate the images and choose the page size, orientation, and margins.',
      'Click "Convert & Download" to create a private PDF file.',
    ],
    useCases: [
      'Combine phone photos of receipts into one expense PDF.',
      'Turn scanned JPG document pages into a single file.',
      'Create a PDF photo sheet for sharing or printing.',
      'Upload JPEG images to services that require PDF documents.',
    ],
      seoTitle: "JPG to PDF Online - Free and Private",
    seoDescription: "Convert JPG and JPEG photos into a PDF in your browser. Arrange images, choose page size, and download privately without uploads.",
    faqs: [
      { question: "Does converting images to PDF upload my files?", answer: "No. All conversion happens in your browser. Your images never leave your device." },
      { question: "What image formats are supported?", answer: "JPG, JPEG, PNG, WebP, SVG, and BMP are supported in modern browsers. HEIC/HEIF and TIFF support depends on whether your browser can decode the files." },
      { question: "Can I choose the page size and orientation?", answer: "Yes. You can select A4 or Letter page size and choose portrait or landscape orientation before converting." },
      { question: "Can I reorder or rotate images before converting?", answer: "Yes. Use the arrow buttons to reorder and the rotate button to adjust each image before generating the PDF." },
    ],
  },
  '/text-to-pdf': {
    intro:
      'Text to PDF converts plain text files or pasted text into formatted PDF documents. Choose a font, size, margins, and line spacing to create clean, professional-looking PDFs from raw text. Ideal for converting notes, logs, README files, or any text content into a portable document.',
    action: 'convert text to PDF',
    steps: [
      'Paste text or upload a .txt file.',
      'Configure font, size, margins, and page layout.',
      'Click "Convert & Download" to generate your PDF.',
    ],
    useCases: [
      'Convert meeting notes or logs into a shareable PDF.',
      'Turn a README or changelog into a printable document.',
      'Create a formatted PDF from code snippets or configuration files.',
      'Produce documentation from plain text drafts.',
    ],
      seoTitle: "Text to PDF – Convert TXT to PDF Free Online",
    seoDescription: "Convert plain text or .txt files to PDF instantly in your browser. Custom font size and page size. 100% private — no uploads.",
    faqs: [
      { question: "Can I paste text directly?", answer: "Yes! Switch to the \"Type / Paste\" tab and paste your text directly." },
      { question: "What formats can I upload?", answer: "You can upload .txt plain text files." },
      { question: "Is my text uploaded to a server?", answer: "No. Everything runs locally in your browser using JavaScript." },
    ],
  },
  '/json-to-pdf': {
    intro:
      'JSON to PDF renders JSON data as a formatted, syntax-highlighted PDF document. The output preserves the hierarchical structure with proper indentation and color coding, making it easy to print or share API responses, configuration files, or data exports as readable documents.',
    action: 'convert JSON to PDF',
    steps: [
      'Paste JSON data or upload a .json file.',
      'Preview the formatted, syntax-highlighted output.',
      'Click "Convert & Download" to save as PDF.',
    ],
    useCases: [
      'Print API responses for documentation or debugging.',
      'Share configuration files as formatted PDFs with team members.',
      'Create readable reports from exported JSON data.',
      'Archive data exports as human-readable PDF documents.',
    ],
    seoTitle: 'JSON to PDF – Convert JSON Data to a PDF Document',
    seoDescription:
      'Convert JSON files or pasted data into a formatted, syntax-highlighted PDF. Free and browser-based — your data is never uploaded.',
    faqs: [
      {
        question: 'How do I convert a JSON file to PDF?',
        answer:
          'Paste your JSON or upload a .json file, check the formatted preview, then download the PDF. The tool pretty-prints the structure with indentation and syntax highlighting so the result is readable rather than one long line.',
      },
      {
        question: 'Is the JSON structure preserved in the PDF?',
        answer:
          'Yes. Nesting is rendered with consistent indentation, and keys, strings, numbers and booleans are colour-coded, so the hierarchy of objects and arrays stays easy to follow on the page.',
      },
      {
        question: 'What happens if my JSON is invalid?',
        answer:
          'The tool parses your input before rendering and reports a syntax error instead of producing a broken document, so you can fix the JSON and try again.',
      },
      {
        question: 'Can I convert a large JSON file?',
        answer:
          'Yes, though very large files produce very long PDFs and take longer to render since all the work happens in your browser. For multi-megabyte exports, consider converting the specific section you actually need.',
      },
      {
        question: 'Is my data safe when converting sensitive JSON?',
        answer:
          'Conversion runs entirely in your browser and nothing is transmitted to a server. That matters for JSON, which so often contains API responses, tokens, customer records or config values you should not paste into a remote service.',
      },
    ],
    comparison: {
      heading: 'When to use this vs printing JSON from your editor',
      body: 'Printing from VS Code or a browser dev tools panel works, but you get whatever the editor decides — often clipped lines, lost highlighting, or a header and footer you did not want. This tool renders the JSON specifically for the page: consistent indentation, preserved syntax colours, and no truncation. That makes it the better choice for anything shared or archived, such as attaching an API response to a bug report, including config in an audit pack, or keeping a human-readable record of a data export. And because your JSON frequently holds credentials or customer data, doing the conversion locally means none of it is sent anywhere.',
    },
  },
  '/markdown-to-pdf': {
    intro:
      'Markdown to PDF converts Markdown documents into styled PDF files with rendered headings, lists, code blocks, tables, and images. The output looks professional without manual formatting, making it perfect for converting README files, documentation, or notes into polished documents.',
    action: 'convert Markdown to PDF',
    steps: [
      'Paste Markdown content or upload a .md file.',
      'Preview the rendered document with headings, lists, and code blocks.',
      'Click "Convert & Download" to save the styled PDF.',
    ],
    useCases: [
      'Convert project README files into shareable PDFs.',
      'Turn documentation written in Markdown into printable manuals.',
      'Create formatted reports from Markdown notes.',
      'Produce professional-looking proposals from Markdown drafts.',
    ],
    seoTitle: 'Markdown to PDF – Convert .md Files to PDF Free',
    seoDescription:
      'Convert Markdown or README .md files into a styled PDF with headings, tables and code blocks. Free, browser-based, no uploads.',
    faqs: [
      {
        question: 'How do I convert a Markdown file to PDF?',
        answer:
          'Paste your Markdown or upload a .md file, check the rendered preview, then download the PDF. Headings, lists, tables, links and code blocks are all styled automatically — there is nothing to configure.',
      },
      {
        question: 'Are code blocks and tables rendered properly?',
        answer:
          'Yes. Fenced code blocks keep their monospace formatting and syntax highlighting, and Markdown tables are rendered as real bordered tables rather than raw pipes and dashes.',
      },
      {
        question: 'Can I convert a GitHub README to PDF?',
        answer:
          'Yes — README files are one of the most common uses. Standard GitHub-flavoured Markdown including tables, task lists and fenced code converts cleanly. Images referenced by relative repository paths will not resolve, so use absolute URLs or embed them directly.',
      },
      {
        question: 'Does it support images in Markdown?',
        answer:
          'Images referenced by absolute URL or embedded as data URIs are rendered in the PDF. Relative paths pointing at files on your disk or in a repository cannot be resolved by the browser and will appear as broken references.',
      },
      {
        question: 'Will my document formatting or page breaks be preserved?',
        answer:
          'Content flows onto pages automatically, with headings and paragraphs kept together where possible. Markdown has no concept of a page break, so exact pagination is decided at render time rather than by the source file.',
      },
      {
        question: 'Is my Markdown content uploaded to a server?',
        answer:
          'No. Rendering happens entirely in your browser, which matters when converting internal documentation, unpublished drafts or private notes.',
      },
    ],
    comparison: {
      heading: 'When to use this vs Pandoc or a desktop converter',
      body: 'Pandoc is more powerful — custom LaTeX templates, bibliographies, precise typographic control — and it is the right tool if you are producing a book or a document with a house style. The trade-off is installing it, learning its flags, and setting up a template before you get a single page. This tool targets the far more common case: you have a README, some notes or a draft proposal, and you need a clean PDF in the next thirty seconds. You get sensible styling with no setup, and since it runs in the browser, unreleased documentation never leaves your machine.',
    },
  },

  // ── CONVERT FROM PDF ───────────────────────────────────────────────────────
  '/pdf-to-images': {
    intro:
      'PDF to Images exports every page of a PDF as a high-quality PNG, JPG, or WebP image. Customize the DPI (72–600) to control resolution and file size. The resulting images maintain the exact appearance of the PDF pages, including fonts, vectors, and embedded graphics.',
    action: 'convert PDF to images',
    steps: [
      'Upload the PDF you want to convert.',
      'Choose the output format (PNG, JPG, or WebP) and resolution (DPI).',
      'Click "Convert" to download images of every page.',
    ],
    useCases: [
      'Create images from PDF slides for social media or web embedding.',
      'Extract high-resolution page images for print production.',
      'Convert PDF presentations into image files for video editing.',
      'Generate thumbnail previews of PDF documents.',
    ],
      seoTitle: "PDF to Images - Export PDF Pages as PNG, JPG, or WebP",
    seoDescription: "Convert each PDF page to PNG, JPG, or WebP locally in your browser with DPI and quality controls. Download individually or as ZIP.",
    faqs: [
      { question: "Does PDF to images upload my file?", answer: "No. PDF rendering and image export happen entirely in your browser." },
      { question: "Which image formats can I export?", answer: "You can export PDF pages as PNG, JPG, or WebP. BMP and TIFF alias pages use this image export workflow as their canonical replacement." },
      { question: "Can I download every page at once?", answer: "Yes. Use Download All as ZIP to save every exported page in one archive." },
      { question: "Can I convert those images back into a PDF?", answer: "Yes. Use the linked Images to PDF tool to roundtrip them back into a new document." },
    ],
  },
  '/pdf-to-jpg': {
    intro:
      'PDF to JPG exports each PDF page as a JPEG image with adjustable resolution and quality. It is helpful for turning slides, forms, flyers, or document pages into images that can be used on websites, shared in messaging apps, or placed into design tools. Rendering happens locally in your browser, and the JPG files are packaged for download without uploading your PDF to a server.',
    action: 'convert PDF to JPG',
    steps: [
      'Upload the PDF you want to export as JPG images.',
      'Choose JPG output, then set the DPI and quality level.',
      'Download every rendered page together as a ZIP file.',
    ],
    useCases: [
      'Create JPG previews of PDF pages for a website or catalog.',
      'Convert PDF slides into images for social media posts.',
      'Extract document pages as shareable JPEG files.',
      'Generate lightweight page images for review or annotation.',
    ],
      seoTitle: "PDF to JPG Online - Free and Private",
    seoDescription: "Convert PDF pages to JPG images locally in your browser with DPI and quality controls. Download pages as a private ZIP file.",
    faqs: [
      { question: "Does PDF to images upload my file?", answer: "No. PDF rendering and image export happen entirely in your browser." },
      { question: "Which image formats can I export?", answer: "You can export PDF pages as PNG, JPG, or WebP. BMP and TIFF alias pages use this image export workflow as their canonical replacement." },
      { question: "Can I download every page at once?", answer: "Yes. Use Download All as ZIP to save every exported page in one archive." },
      { question: "Can I convert those images back into a PDF?", answer: "Yes. Use the linked Images to PDF tool to roundtrip them back into a new document." },
    ],
  },
  '/pdf-to-svg': {
    intro:
      'PDF to SVG converts PDF pages into scalable vector graphics (SVG) files. Unlike raster exports, SVG output preserves vector elements — text, shapes, and paths — as editable, infinitely scalable objects. This is ideal for extracting diagrams, logos, or illustrations from PDFs for further editing.',
    action: 'convert PDF to SVG',
    steps: [
      'Upload the PDF containing the pages you want as SVG.',
      'Select which pages to convert.',
      'Download the SVG files for editing in any vector graphics tool.',
    ],
    useCases: [
      'Extract vector logos or diagrams from PDF documents.',
      'Convert PDF illustrations for web use where scalability matters.',
      'Pull out editable graphics from PDF design files.',
      'Create infinitely-scalable versions of PDF charts or infographics.',
    ],
      seoTitle: "PDF to SVG Online – Free & Private",
    seoDescription: "Convert PDF pages to scalable SVG vector graphics. Download instantly. Browser-based.",
    faqs: [
      { question: "Are fonts preserved?", answer: "Text is embedded as path data in the SVG when using vector extraction." },
      { question: "Does this work for scanned PDFs?", answer: "Scanned PDFs output raster-image SVGs; vector extraction only works for text-based PDFs." },
    ],
  },
  '/pdf-to-greyscale': {
    intro:
      'PDF to Grayscale converts color PDF pages to black-and-white (grayscale) output. This dramatically reduces toner usage when printing, lowers file size for scanned color documents, and creates a uniform appearance for documents with inconsistent color treatments.',
    action: 'convert PDF to grayscale',
    steps: [
      'Upload the color PDF you want to convert.',
      'The tool converts all pages to grayscale automatically.',
      'Download the grayscale version of your PDF.',
    ],
    useCases: [
      'Save toner by converting color documents to grayscale before printing.',
      'Create a uniform appearance for documents with mixed color pages.',
      'Reduce file size of scanned color documents.',
      'Prepare documents for black-and-white publishing or photocopying.',
    ],
    seoTitle: 'PDF to Grayscale – Convert Color PDF to Black & White',
    seoDescription:
      'Convert a colour PDF to greyscale (grayscale) black-and-white online. Save toner and shrink scanned files — free, private, no uploads.',
    faqs: [
      {
        question: 'How do I convert a colour PDF to greyscale?',
        answer:
          'Upload the PDF and every page is converted to greyscale automatically, then you download the result. There are no settings to choose — colours are mapped to their equivalent grey tones in one pass.',
      },
      {
        question: 'Is it spelled greyscale or grayscale?',
        answer:
          'Both are correct and mean the same thing: "grayscale" is the American spelling and "greyscale" the British one. This tool does the same job whichever term you searched for.',
      },
      {
        question: 'Does converting to grayscale reduce PDF file size?',
        answer:
          'Often, yes — especially for scanned or image-heavy documents, where discarding colour channels can cut size noticeably. For text-based PDFs the saving is small, because the text was never the bulk of the file. Use Compress PDF if size is your main goal.',
      },
      {
        question: 'Can I convert the grayscale PDF back to colour?',
        answer:
          'No. Converting to greyscale discards the colour information permanently, so keep your original file if you might need the colour version later.',
      },
      {
        question: 'Will text stay sharp and selectable after conversion?',
        answer:
          'Yes. Text remains real text — selectable and searchable — rather than being flattened into an image, so the document keeps its clarity and accessibility.',
      },
      {
        question: 'Why convert to grayscale before printing?',
        answer:
          'Colour pages can draw from expensive colour cartridges even when the visible content is mostly black. Converting first guarantees the whole document prints on black toner alone, which is cheaper and more consistent across printers.',
      },
    ],
    comparison: {
      heading: 'When to use this vs your printer\'s black-and-white setting',
      body: 'Ticking "print in greyscale" in the print dialog is fine for a quick one-off on your own printer. It only changes that single job, though — the file itself is still in colour, so anyone you send it to prints colour again, and some drivers still pull from colour cartridges for "composite black". This tool converts the document itself, so the greyscale version is what you share, archive, or hand to a print shop, and every printer treats it identically. It also shrinks scanned colour documents in a way a print setting never can.',
    },
  },
  '/pdf-to-json': {
    intro:
      'PDF to JSON extracts text content and metadata from a PDF and outputs it as a structured JSON file. The JSON includes per-page text, document properties, and structural information. This makes PDF content programmatically accessible for data processing, search indexing, or integration with other tools.',
    action: 'extract PDF content as JSON',
    steps: [
      'Upload the PDF you want to extract data from.',
      'The tool parses the text content and metadata into JSON format.',
      'Download or copy the JSON output.',
    ],
    useCases: [
      'Extract structured data from PDF invoices or forms for database import.',
      'Convert PDF content into a format suitable for API integrations.',
      'Build a searchable index from a collection of PDF documents.',
      'Parse PDF reports into structured data for analysis.',
    ],
      seoTitle: "PDF to JSON – Extract PDF Content as JSON Data",
    seoDescription: "Extract text and metadata from your PDF and download it as a structured JSON file. 100% private — browser only.",
    faqs: [
      { question: "What data is extracted?", answer: "The JSON contains metadata, page count, and the extracted text from each page." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },
  '/pdf-to-markdown': {
    intro:
      'PDF to Markdown extracts the text content of a PDF and formats it as clean Markdown. Headings, paragraphs, lists, and basic formatting are preserved, making it easy to repurpose PDF content for websites, documentation systems, or note-taking apps that use Markdown.',
    action: 'convert PDF to Markdown',
    steps: [
      'Upload the PDF you want to convert.',
      'The tool extracts text and infers Markdown formatting.',
      'Download or copy the Markdown output.',
    ],
    useCases: [
      'Repurpose PDF documentation for a wiki or docs site.',
      'Convert a PDF article into a blog post draft.',
      'Extract formatted notes from a PDF for import into Obsidian or Notion.',
      'Convert PDF meeting minutes into editable Markdown for team sharing.',
    ],
      seoTitle: "PDF to Markdown – Extract PDF Text as Markdown",
    seoDescription: "Convert your PDF into a Markdown (.md) file with page structure preserved. 100% private — browser only.",
    faqs: [
      { question: "Is the formatting preserved?", answer: "Basic text is extracted and wrapped in Markdown syntax with page headings. Complex formatting like tables may not be preserved." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },
  '/extract-text': {
    intro:
      'Extract Text pulls all text content from a PDF — whether it\'s a native digital PDF or a scanned document (via OCR). The extracted text can be copied, downloaded as a .txt file, or used as input for Word, Excel, or Slides workflows. OCR runs entirely in the browser using Tesseract.js.',
    action: 'extract text from a PDF',
    steps: [
      'Upload the PDF (digital or scanned) you want to extract text from.',
      'The tool extracts all text content, using OCR for scanned pages if needed.',
      'Copy the text or download it as a .txt file.',
    ],
    useCases: [
      'Copy text from a PDF that doesn\'t allow text selection.',
      'Extract content from scanned paper documents using OCR.',
      'Pull text from PDF invoices or receipts for data entry.',
      'Convert PDF content to plain text for search or analysis.',
    ],
      seoTitle: "Extract Text from PDF or Images – TXT for Word, Sheets, and Slides",
    seoDescription: "Extract text from PDFs, scanned PDFs, and images in your browser for TXT exports you can reuse in Word, Sheets, Slides, and other editors.",
    faqs: [
      { question: "Can I extract text from both PDFs and images?", answer: "Yes. Text PDFs are read directly, and scanned pages or images fall back to OCR in the browser." },
      { question: "Does this upload my files?", answer: "No. Extraction, OCR, previews, and exports all stay on your device." },
      { question: "Does this create DOCX, XLSX, or PPTX files?", answer: "No. Current exports are TXT and searchable PDF workflows. Use the extracted text in Word, Sheets, Slides, or another editor." },
      { question: "Can I inspect OCR confidence and boxes?", answer: "Yes. The page-level result viewer can show OCR bounding boxes and average confidence metrics." },
      { question: "Can I export page-wise text files?", answer: "Yes. Download a combined TXT or export individual page TXT files as a ZIP archive." },
    ],
  },
  '/extract-images': {
    intro:
      'Extract Images finds and extracts all images embedded within a PDF document, packaging them into a downloadable ZIP file. The images are extracted in their original format and resolution, preserving the quality of photos, graphics, logos, and illustrations contained in the PDF.',
    action: 'extract images from a PDF',
    steps: [
      'Upload the PDF containing embedded images.',
      'The tool scans the PDF and identifies all embedded images.',
      'Download the ZIP file containing all extracted images.',
    ],
    useCases: [
      'Recover high-resolution photos from a PDF portfolio or brochure.',
      'Extract logos or graphics from PDF marketing materials.',
      'Pull images from a PDF report for use in a presentation.',
      'Save embedded charts or diagrams from a research paper.',
    ],
      seoTitle: "Extract Images from PDF – Export PDF Pages as PNG Images",
    seoDescription: "Extract and download all pages of a PDF as PNG images in a ZIP archive. 100% private — browser only.",
    faqs: [
      { question: "What format are the extracted images?", answer: "Each PDF page is rendered as a PNG image at 2× resolution for high quality, then packed into a ZIP archive." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },
  '/pdf-to-cbz': {
    intro:
      'PDF to CBZ converts a PDF into a Comic Book Archive (CBZ) file — a ZIP of images that comic readers can display. This is ideal for converting PDF comics, manga, or graphic novels into a format optimized for tablet and e-reader comic apps.',
    action: 'convert PDF to CBZ',
    steps: [
      'Upload the PDF (comic, manga, or graphic novel).',
      'Choose the image quality for the CBZ pages.',
      'Download the CBZ archive ready for your comic reader app.',
    ],
    useCases: [
      'Convert PDF comics for reading in a dedicated comic reader app.',
      'Transform PDF manga into CBZ format for tablet reading.',
      'Convert graphic novels from PDF to CBZ for e-reader compatibility.',
      'Archive digital comics in the standard CBZ format.',
    ],
    seoTitle: 'PDF to CBZ – Convert PDF Comics & Manga to CBZ',
    seoDescription:
      'Convert PDF comics, manga and graphic novels to CBZ for comic reader apps. Free, runs in your browser, no file uploads.',
    faqs: [
      {
        question: 'What is a CBZ file?',
        answer:
          'A CBZ (Comic Book ZIP) is simply a ZIP archive of page images named in reading order. Comic readers such as CDisplayEx, YACReader, Panels and Tachiyomi open them natively and page through the images.',
      },
      {
        question: 'Why convert a PDF comic to CBZ?',
        answer:
          'Comic readers are built for the job: fast page-turning, double-page spreads, guided panel-by-panel view, and reading-position sync. PDF viewers treat a comic like a document, so they tend to be slower and clumsier on a tablet or e-reader.',
      },
      {
        question: 'Does converting to CBZ preserve page and reading order?',
        answer:
          'Yes. Each PDF page is exported as an image with a zero-padded sequential filename, which is how the CBZ format defines reading order, so pages always appear in the correct sequence.',
      },
      {
        question: 'Will image quality drop when converting to CBZ?',
        answer:
          'Pages are rendered to images at the quality setting you pick. A higher setting stays visually faithful to the original at the cost of a larger archive; a lower setting saves space but can soften fine line art and lettering.',
      },
      {
        question: 'Is text still searchable inside a CBZ?',
        answer:
          'No. CBZ is an image format by definition, so any selectable text in the source PDF becomes part of the page image. Keep the PDF if you need text search; use CBZ for reading.',
      },
      {
        question: 'Can I convert a CBZ back into a PDF?',
        answer:
          'Yes — extract the images from the archive and use the Images to PDF tool to rebuild a document, though text that was rasterised during conversion cannot be recovered.',
      },
    ],
    comparison: {
      heading: 'When to use CBZ vs keeping the PDF',
      body: 'Keep the PDF when the text matters — searching dialogue, copying a quote, or reading on a desktop where a document viewer is perfectly comfortable. Convert to CBZ when you are actually reading the comic on a tablet, phone or e-reader: dedicated comic apps handle spreads, panel-guided view and reading position far better than any PDF viewer, and the format is what services like Komga and Kavita expect for a library. The trade-off is losing searchable text, so many people keep the PDF as the archive copy and use the CBZ for reading.',
    },
  },

  // ── OPTIMIZE & REPAIR ──────────────────────────────────────────────────────
  '/compress': {
    intro:
      'Compress PDF reduces the file size of your PDF by optimizing images, removing redundant data, and cleaning up the internal structure. Multiple compression levels let you balance quality and size. A 10 MB report can often shrink to 2–3 MB with no visible quality difference.',
    action: 'compress a PDF',
    steps: [
      'Upload the PDF you want to compress.',
      'Select a compression level (low, medium, or high).',
      'Click "Compress & Download" to save the smaller file.',
    ],
    useCases: [
      'Reduce PDF size to meet email attachment limits.',
      'Compress scanned documents that are unnecessarily large.',
      'Optimize PDFs for faster web loading or download.',
      'Shrink portfolio or presentation files for easier sharing.',
    ],
      seoTitle: "Compress PDF Online – Reduce File Size Free",
    seoDescription: "Reduce PDF file size while maintaining quality. Optimize PDFs locally in your browser. No uploads, 100% private.",
    faqs: [
      { question: "Does compressing a PDF upload my file?", answer: "No. All compression happens in your browser using JavaScript. Your file never leaves your device." },
      { question: "How much can I reduce the PDF file size?", answer: "Results vary by content. Metadata removal and object-stream compression typically reduce size by 10–40%. Scanned PDFs with large images see the biggest savings." },
      { question: "Will compressing a PDF reduce its quality?", answer: "The tool strips unnecessary metadata and applies lossless object-stream compression, so visible quality stays the same." },
      { question: "Is there a file size limit for compression?", answer: "There is no hard limit. Because processing happens in your browser, very large files (100 MB+) may be slower depending on your device." },
    ],
  },
  '/fix-page-size': {
    intro:
      'Fix Page Size standardizes all pages in a PDF to a consistent size — A4, Letter, Legal, or custom dimensions. Pages are scaled or repositioned to fit the target size. This solves common problems with merged documents that have inconsistent page dimensions.',
    action: 'fix PDF page sizes',
    steps: [
      'Upload the PDF with inconsistent page sizes.',
      'Select the target page size (A4, Letter, Legal, or custom).',
      'Click "Fix & Download" to save the standardized PDF.',
    ],
    useCases: [
      'Standardize merged documents from different sources to one page size.',
      'Convert Letter-sized documents to A4 for international printing.',
      'Fix PDFs with mixed landscape and portrait pages to a consistent size.',
      'Prepare documents for professional printing with exact trim sizes.',
    ],
      seoTitle: "Fix PDF Page Size – Resize to A4, Letter, A3, Legal Free",
    seoDescription: "Resize all pages of your PDF to A4, US Letter, A3, or Legal size. Scales content to fit. 100% private — no uploads.",
    faqs: [
      { question: "Will my page content be cropped?", answer: "No. Content is scaled proportionally to fit the new page size with equal margins." },
      { question: "Does this change the orientation?", answer: "No. The tool scales the existing content to fit the target size, preserving orientation." },
      { question: "Is my file uploaded?", answer: "No. Everything runs locally in your browser." },
    ],
  },
  '/page-dimensions': {
    intro:
      'Page Dimensions inspects every page of a PDF and reports its width, height, and orientation. It identifies inconsistencies — mixed sizes, unexpected orientations, or non-standard dimensions — giving you the information needed to decide whether to fix, crop, or reformat.',
    action: 'inspect PDF page dimensions',
    steps: [
      'Upload the PDF you want to inspect.',
      'View the width, height, and orientation of each page.',
      'Identify any pages with inconsistent or unexpected dimensions.',
    ],
    useCases: [
      'Audit a merged document for mixed page sizes before printing.',
      'Verify that all pages meet a specific size requirement.',
      'Check the DPI and dimensions of scanned document pages.',
      'Identify landscape pages in a predominantly portrait document.',
    ],
      seoTitle: "PDF Page Dimensions – View Page Size and Orientation",
    seoDescription: "Instantly view the width, height, and orientation of every page in a PDF. Detect mixed page sizes. 100% private.",
    faqs: [
      { question: "Can I detect mixed page sizes?", answer: "Yes. The tool shows the dimensions of every individual page, making it easy to spot inconsistencies." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },
  '/repair-pdf': {
    intro:
      'Repair PDF attempts to fix corrupted or damaged PDF files by reconstructing the internal structure, cross-reference tables, and object streams. If your PDF won\'t open, displays errors, or has missing pages, this tool can often recover the content and produce a working file.',
    action: 'repair a damaged PDF',
    steps: [
      'Upload the corrupted or damaged PDF file.',
      'The tool analyzes the file structure and attempts repairs automatically.',
      'Download the repaired PDF if recovery is successful.',
    ],
    useCases: [
      'Recover a PDF that was damaged during download or transfer.',
      'Fix PDFs that show "file is damaged" errors in your viewer.',
      'Repair files corrupted by disk errors or incomplete saves.',
      'Recover content from PDFs produced by faulty export tools.',
    ],
      seoTitle: "Repair Corrupted PDF – Free Online PDF Fix Tool",
    seoDescription: "Repair a broken or corrupted PDF file instantly in your browser. Re-serializes the PDF structure to fix common errors. 100% private — no uploads.",
    faqs: [
      { question: "What kind of PDF errors can this fix?", answer: "It can fix structural issues like cross-reference table errors, invalid objects, and malformed metadata by completely re-serializing the PDF." },
      { question: "Will it fix encrypted or password-protected PDFs?", answer: "It attempts to open and re-save even encrypted PDFs, which can resolve some structural issues." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },
  '/deskew-pdf': {
    intro:
      'Deskew PDF automatically straightens scanned document pages that are slightly tilted or rotated. The tool detects the text angle and applies a precise rotation correction to align the content horizontally. This improves readability and OCR accuracy for scanned documents.',
    action: 'deskew scanned PDF pages',
    steps: [
      'Upload the scanned PDF with tilted pages.',
      'The tool detects and corrects the skew angle automatically.',
      'Download the straightened PDF.',
    ],
    useCases: [
      'Straighten pages that were fed at an angle in a scanner.',
      'Improve the appearance of mobile-scanned documents.',
      'Prepare scanned documents for OCR by correcting text angle.',
      'Clean up batch-scanned documents with inconsistent alignment.',
    ],
      seoTitle: "Deskew PDF – Straighten Skewed Scanned Documents",
    seoDescription: "Automatically straighten skewed or tilted pages from scanned PDFs. 100% private — browser only.",
    faqs: [
      { question: "How does deskewing work?", answer: "Each page is rendered to a canvas and re-embedded straight into a new PDF, correcting minor tilt from scanning." },
      { question: "Is my file uploaded?", answer: "No. All processing is done in your browser. Your file never leaves your device." },
    ],
  },

  // ── SECURE PDF ─────────────────────────────────────────────────────────────
  '/pdf-security': {
    intro:
      'Protect & Unlock PDF handles PDF password operations entirely in your browser. Unlock a password-protected PDF by entering the correct password, or add password protection to secure a document before sharing. The tool supports both user passwords (to open) and owner passwords (to restrict editing/printing).',
    action: 'manage PDF security',
    steps: [
      'Upload the password-protected PDF (or the PDF you want to protect).',
      'To unlock: enter the document password. To protect: set a new password.',
      'Download the unlocked or newly-protected PDF.',
    ],
    useCases: [
      'Remove a password from a PDF you have legitimate access to.',
      'Add password protection before sharing sensitive documents via email.',
      'Unlock a PDF to enable printing or text copying.',
      'Change the password on an existing protected document.',
    ],
      seoTitle: "Protect or Unlock PDF – Browser-Only PDF Security",
    seoDescription: "Unlock password-protected PDFs locally in your browser and manage browser-first PDF security workflows without server uploads.",
    faqs: [
      { question: "Does unlocking upload my PDF anywhere?", answer: "No. Password handling, rendering, and export all stay inside your browser." },
      { question: "Why is protect mode limited?", answer: "The current browser-only PDF stack in this project does not expose reliable standards-compliant encryption for writing protected PDFs." },
      { question: "What is preserved when unlocking?", answer: "The unlocked export preserves the visual pages, but it does not preserve the original encrypted structure, interactive forms, or hidden content streams." },
    ],
  },
  '/sanitize-pdf': {
    intro:
      'Sanitize PDF strips all hidden data from a PDF: metadata, embedded scripts, JavaScript actions, form data, comments, thumbnails, and other non-visible elements. The result is a clean, minimal PDF that contains only the visible page content — ideal for sharing documents where hidden data could pose a privacy or security risk.',
    action: 'sanitize a PDF',
    steps: [
      'Upload the PDF you want to sanitize.',
      'The tool identifies and removes all hidden data automatically.',
      'Download the sanitized PDF containing only visible content.',
    ],
    useCases: [
      'Clean documents before sharing outside your organization.',
      'Remove hidden metadata that could reveal editing history or author details.',
      'Strip embedded scripts for security before opening untrusted PDFs.',
      'Prepare documents for public release by removing all non-visible data.',
    ],
      seoTitle: "Sanitize PDF – Remove Metadata & Hidden Data Free",
    seoDescription: "Remove all metadata, hidden data, and flatten interactive elements from your PDF to protect privacy. 100% browser-based, no uploads.",
    faqs: [
      { question: "What does sanitizing a PDF do?", answer: "It removes all metadata (author, creator, keywords), flattens form fields, and re-serializes the PDF structure to remove hidden data." },
      { question: "Will my file content be changed?", answer: "No. Only metadata and interactive elements are removed. The visible page content remains unchanged." },
      { question: "Is my file uploaded?", answer: "No. Everything runs locally in your browser." },
    ],
  },
  '/find-and-redact': {
    intro:
      'Find & Redact searches for specific text patterns — names, email addresses, phone numbers, or any keyword — across all pages and permanently redacts every occurrence. Unlike manual redaction, this tool ensures nothing is missed, even in long documents. The underlying text is completely removed, not just hidden.',
    action: 'find and redact text',
    steps: [
      'Upload the PDF you want to redact.',
      'Enter the text or pattern to search for (e.g., a name, email, or SSN pattern).',
      'Review the matches, then click "Redact All" to permanently remove them.',
    ],
    useCases: [
      'Redact all occurrences of a person\'s name before a public records release.',
      'Remove email addresses or phone numbers from a shared document.',
      'Redact account numbers or SSNs across a multi-page financial report.',
      'Bulk-redact specific terms from legal discovery documents.',
    ],
      seoTitle: "Find & Redact PDF Text – Free Privacy Tool",
    seoDescription: "Search for sensitive text in your PDF and export an image-only redacted copy with redactions burned into the page pixels. 100% private — processed locally.",
    faqs: [
      { question: "Are redactions permanent?", answer: "Yes. Matching pages are rendered to images with redactions burned in, so the exported PDF no longer contains the original selectable text layer." },
      { question: "Is searching case-sensitive?", answer: "No. The search is case-insensitive by default." },
      { question: "Will my file be uploaded?", answer: "No. Everything runs locally in your browser." },
    ],
  },
  '/flatten-pdf': {
    intro:
      'Flatten PDF converts interactive form fields, annotations, and comments into static page content. The visual appearance is preserved exactly, but the interactive elements become uneditable — like printing the document to a new PDF. This ensures the document looks the same everywhere and prevents further modifications.',
    action: 'flatten a PDF',
    steps: [
      'Upload the PDF with forms, annotations, or interactive elements.',
      'The tool flattens all interactive content into static page images.',
      'Download the flattened, non-editable PDF.',
    ],
    useCases: [
      'Lock filled-in forms so responses can\'t be altered after submission.',
      'Flatten annotations to preserve reviewer comments in the final document.',
      'Prepare PDFs for archival where interactive elements could cause display issues.',
      'Ensure consistent rendering across different PDF viewers.',
    ],
    seoTitle: 'Flatten PDF – Make Forms & Annotations Non-Editable',
    seoDescription:
      'Flatten PDF form fields, annotations and layers into static content so nothing can be edited. Free browser-based tool, no uploads.',
    faqs: [
      {
        question: 'What does flattening a PDF actually do?',
        answer:
          'Flattening merges interactive layers — form fields, annotations, stamps and comments — into the page content itself. The document looks identical, but the elements become part of the page rather than separate objects that can be clicked or edited.',
      },
      {
        question: 'How do I make a filled PDF form non-editable?',
        answer:
          'Upload the completed form and flatten it. The entered values are painted onto the page and the fields disappear, so the answers can still be read but no longer changed or cleared.',
      },
      {
        question: 'Is flattening a PDF the same as password-protecting it?',
        answer:
          'No, and the distinction matters. Flattening removes editable elements but the file is still open — anyone can view it. A password restricts who can open or modify the document. Use the PDF Security tool for access control, and flatten for locking in content.',
      },
      {
        question: 'Can a flattened PDF be un-flattened?',
        answer:
          'Not in any practical sense. Once fields and annotations are merged into the page, the interactive structure is gone. Always keep the original if you may need to edit the form again.',
      },
      {
        question: 'Does flattening keep text selectable?',
        answer:
          'Existing page text stays selectable and searchable. Content that came from form fields and annotations is rendered into the page, so it may no longer behave as separate selectable text.',
      },
      {
        question: 'Why do my annotations disappear in some PDF readers?',
        answer:
          'Annotation support varies between viewers, and some mobile or browser readers ignore certain types entirely. Flattening makes comments and highlights part of the page, guaranteeing they render the same way everywhere — a common reason to flatten before sharing.',
      },
    ],
    comparison: {
      heading: 'When to flatten vs when to password-protect',
      body: 'These solve different problems and are often confused. Flatten when the content must stay exactly as it is: a signed form heading to a client, an annotated review copy, or an archival document that has to render identically in every reader for years. Password-protect when the issue is who may open or change the file at all. Flattening does not stop anyone reading the document, and a password does not stop someone with access from editing form fields — so for a completed contract that is both confidential and final, do both: flatten first to lock the content, then apply protection with the PDF Security tool.',
    },
  },
  '/remove-metadata': {
    intro:
      'Remove Metadata wipes all embedded metadata from a PDF — including the author name, creation software, edit history, creation and modification dates, and custom properties. This is a critical privacy step before sharing documents externally, as metadata can inadvertently reveal personal or organizational information.',
    action: 'remove PDF metadata',
    steps: [
      'Upload the PDF whose metadata you want to remove.',
      'Preview the metadata that will be stripped (author, dates, producer, etc.).',
      'Click "Remove & Download" to save the metadata-free PDF.',
    ],
    useCases: [
      'Strip author names and edit history before publishing.',
      'Remove creation software details for competitive confidentiality.',
      'Clean metadata before submitting documents to courts or regulatory bodies.',
      'Protect personal information embedded in PDFs shared online.',
    ],
      seoTitle: "Remove PDF Metadata Online - Free and Private",
    seoDescription: "Remove embedded PDF metadata such as author, title, creator, keywords, and dates locally in your browser without uploads.",
    faqs: [
      { question: "What metadata is stored in a PDF?", answer: "PDFs can contain title, author, subject, keywords, creator, producer, and creation/modification dates." },
      { question: "Will my file be uploaded?", answer: "No. Everything runs locally in your browser." },
      { question: "Can I remove all metadata at once?", answer: "Yes! Use the \"Remove All\" mode to strip all metadata in one click." },
    ],
  },

  // ── AI TOOLS ───────────────────────────────────────────────────────────────
  '/remove-background': {
    intro:
      'Remove Background uses an AI segmentation model (ONNX Runtime) to detect and remove the background from any image, leaving only the subject on a transparent canvas. The entire AI model runs in your browser — your photos are never sent to a cloud service. Supports people, products, pets, and objects.',
    action: 'remove image backgrounds',
    steps: [
      'Upload the image (photo, product shot, portrait, etc.).',
      'The AI model processes the image locally and generates a transparent background.',
      'Download the result as a PNG with transparency.',
    ],
    useCases: [
      'Create product photos with clean white or transparent backgrounds.',
      'Remove backgrounds from headshots for LinkedIn or company profiles.',
      'Prepare cutout images for graphic design or presentations.',
      'Clean up pet or object photos for e-commerce listings.',
    ],
      seoTitle: "Remove Background — Free AI Background Remover",
    seoDescription: "Remove image backgrounds automatically using AI, directly in your browser. No upload needed — your images stay private.",
    faqs: [
      { question: "How accurate is the AI background removal?", answer: "The AI model uses a neural network trained on millions of images to detect foreground subjects with high accuracy. It works well with portraits, products, pets, and distinct objects, though results may vary with complex edges, transparent objects, or similar foreground and background colours." },
      { question: "What image types are supported?", answer: "FilePilot supports JPEG, PNG, and WebP images for background removal. The AI model is downloaded to your browser on first use (approximately 40 MB) and processes images locally." },
      { question: "Can I get a transparent PNG output?", answer: "Yes, the default output format is PNG with a transparent background. You can also export as WebP with transparency or JPEG with a solid background colour of your choice." },
      { question: "Is my image uploaded to a server?", answer: "No. All processing happens entirely in your browser using a local AI model. Your images are never uploaded to any server, ensuring complete privacy." },
    ],
  },
  '/change-background': {
    intro:
      'Change Background first removes the original background using AI, then replaces it with a solid color, gradient, blur effect, or any custom image you upload. The AI segmentation preserves fine details like hair edges and semi-transparent areas. Everything runs locally in your browser.',
    action: 'change image backgrounds',
    steps: [
      'Upload the image whose background you want to change.',
      'Choose a replacement: solid color, gradient, blur, or upload a custom background.',
      'Download the image with the new background applied.',
    ],
    useCases: [
      'Replace a cluttered background with a clean studio look.',
      'Create professional headshots with corporate-colored backgrounds.',
      'Add creative backgrounds to product photos for social media.',
      'Simulate different environments for real estate or interior design previews.',
    ],
      seoTitle: "Change Background — AI Background Replacer",
    seoDescription: "Replace image backgrounds with solid colours, gradients, blur, or custom images using AI — all in your browser.",
    faqs: [
      { question: "What background options are available?", answer: "You can replace the background with a solid colour, a custom gradient, a blurred version of the original image, a preset background, or your own custom image. Each option includes adjustable settings like colour, angle, and blur intensity." },
      { question: "How good is the AI edge detection?", answer: "The AI model uses a neural network to detect foreground subjects with high accuracy, preserving fine details like hair and edges. You can fine-tune the result with the edge feather slider to soften any remaining artefacts." },
      { question: "What output formats are supported?", answer: "You can export your result as PNG (with transparency support), WebP, or JPEG. For JPEG output, transparent areas are automatically filled with the selected background colour." },
      { question: "Is my image uploaded to a server?", answer: "No. All processing happens entirely in your browser using a local AI model. Your images are never uploaded to any server, ensuring complete privacy." },
    ],
  },
  '/upscale-image': {
    intro:
      'Upscale Image uses AI super-resolution to enlarge images while preserving — and often enhancing — detail. The tool runs an ONNX neural network model directly in your browser, so your photos stay private. Upscale by 2× or 4× to rescue low-resolution images, old photos, or thumbnails.',
    action: 'upscale images',
    steps: [
      'Upload the image you want to enlarge.',
      'Select the upscale factor (2× or 4×).',
      'Download the high-resolution result.',
    ],
    useCases: [
      'Enlarge old or low-resolution family photos.',
      'Upscale thumbnails or web images for printing.',
      'Improve the resolution of screenshots or cropped images.',
      'Enhance product photos that were shot at low resolution.',
    ],
      seoTitle: "Upscale Image — AI Super-Resolution",
    seoDescription: "Enlarge images using AI super-resolution directly in your browser. Increase resolution while preserving detail — no upload needed.",
    faqs: [
      { question: "What is the maximum upscale factor?", answer: "FilePilot supports 2x and 4x upscaling. 4x upscaling produces the largest output but requires significantly more memory and processing time. The maximum input size is 4 megapixels." },
      { question: "How does AI super-resolution work?", answer: "The AI model uses a neural network to intelligently add detail and sharpness when enlarging images, rather than simple pixel stretching. This produces much cleaner results, though it cannot perfectly recover details missing from the original." },
      { question: "What image formats are supported?", answer: "You can upload JPEG, PNG, and WebP images. Output can be saved as PNG (lossless), WebP, or JPEG with adjustable quality. All processing happens locally in your browser." },
      { question: "How long does upscaling take?", answer: "Processing time depends on image size, upscale factor, and your device's hardware. A typical 2x upscale takes a few seconds, while 4x may take longer. The AI model is downloaded once on first use and cached in your browser." },
    ],
  },
  '/ai-enhance-image': {
    intro:
      'AI Enhance Image automatically improves image quality by adjusting exposure, contrast, color balance, and sharpness using intelligent algorithms. The tool analyzes the image content and applies targeted improvements — brightening dark photos, reducing noise, and enhancing details — all in your browser.',
    action: 'enhance images with AI',
    steps: [
      'Upload the image you want to enhance.',
      'The AI analyzes and applies automatic improvements.',
      'Fine-tune adjustments if needed, then download the enhanced image.',
    ],
    useCases: [
      'Improve dark or underexposed photos from events.',
      'Enhance product photos with better contrast and color.',
      'Clean up noisy images taken in low-light conditions.',
      'Sharpen blurry or slightly out-of-focus photos.',
    ],
      seoTitle: "AI Enhance Image — Smart Image Enhancement",
    seoDescription: "Improve image quality with smart analysis-based enhancement. Fix exposure, reduce noise, sharpen details, and correct colours — all locally in your browser.",
    faqs: [
      { question: "What enhancements are applied to my image?", answer: "Depending on the mode you select, the tool applies adjustments such as exposure correction, contrast improvement, colour balance, sharpening, and noise reduction. The Auto Enhance mode analyses your image and applies the most relevant combination automatically." },
      { question: "Can I see a before and after comparison?", answer: "Yes. After enhancement, an interactive before/after slider lets you drag to compare the original and enhanced versions side by side, making it easy to evaluate the improvements." },
      { question: "How much quality improvement can I expect?", answer: "Results depend on the original image quality and the selected mode and intensity. The tool can significantly improve exposure, reduce noise, and sharpen detail, but it cannot recover information that was not present in the original image." },
      { question: "Is my image uploaded to a server?", answer: "No. All enhancement processing happens entirely in your browser using image adjustment algorithms. Your images are never uploaded to any server, ensuring complete privacy." },
    ],
  },
  '/object-remover': {
    intro:
      'Object Remover lets you paint over unwanted elements in an image — people, signs, wires, blemishes — and uses content-aware inpainting to fill the area with a plausible background. The AI model runs locally in your browser using ONNX Runtime, keeping your photos completely private.',
    action: 'remove objects from images',
    steps: [
      'Upload the image containing objects you want to remove.',
      'Paint over the unwanted elements with the brush tool.',
      'Click "Remove" and download the cleaned image.',
    ],
    useCases: [
      'Remove photobombers or bystanders from vacation photos.',
      'Clean up product photos by removing distracting background objects.',
      'Remove power lines, signs, or other visual clutter from landscape shots.',
      'Erase blemishes or temporary marks from document scans.',
    ],
      seoTitle: "Object Remover — Content-Aware Object Removal",
    seoDescription: "Remove unwanted objects from images using content-aware inpainting, entirely in your browser. No upload needed.",
    faqs: [
      { question: "How accurate is the inpainting?", answer: "The tool uses the Telea content-aware inpainting algorithm to fill removed areas based on surrounding pixel data. It works best for small to medium objects on relatively uniform backgrounds; complex scenes, detailed textures, or large masked areas may produce imperfect results." },
      { question: "How do I select the object to remove?", answer: "Simply paint over the unwanted object using the brush tool. You can adjust the brush size, switch between paint and erase modes, and use undo/redo to refine your selection before processing." },
      { question: "What output quality can I expect?", answer: "Output quality depends on the complexity of the surrounding area. Simple backgrounds produce seamless results, while detailed or textured backgrounds may show artefacts. You can export as JPEG, PNG, or WebP with adjustable quality." },
      { question: "Is processing done in my browser?", answer: "Yes. All processing happens entirely in your browser using a content-aware inpainting algorithm. No external AI model or server is required, and your images are never uploaded anywhere." },
    ],
  },

  // ── WORKFLOWS ──────────────────────────────────────────────────────────────
  '/image-requirements': {
    intro:
      'Resize an image to an exact pixel size, an exact file size in KB, or both at once. Government forms, job portals and exam applications routinely demand something like "JPG, 200x230 px, under 50 KB" — this tool hits those numbers precisely, then exports as JPG, PNG or WebP. Everything runs in your browser, which matters because the documents people resize to a KB limit are usually ID photos, signatures and certificates.',
    action: 'resize an image to an exact size',
    steps: [
      'Select the image you need to resize.',
      'Enter the exact width and height in pixels, or pick a preset.',
      'Set a maximum file size in KB if the form you are filling requires one.',
      'Choose JPG, PNG or WebP and download the resized image.',
    ],
    useCases: [
      'Meeting the exact photo and signature specs on government or exam application forms.',
      'Getting a photo under a 20 KB, 50 KB or 100 KB upload limit without visible quality loss.',
      'Producing exact pixel dimensions for a job portal, visa application or ID card.',
      'Preparing correctly sized images for social profiles and marketplace listings.',
    ],
    seoTitle: 'Resize Image to Exact Size & KB',
    seoDescription:
      'Resize an image to exact pixel dimensions and a target KB file size, then export as JPG, PNG or WebP. Free, private and processed entirely in your browser.',
    h1: 'Resize Image to Exact Size',
    faqs: [
      { question: 'How do I resize an image to specific pixel dimensions?', answer: 'Upload your image and enter the desired width and height. You can choose to crop (cover) or add padding (contain) to fit the aspect ratio. Processing happens entirely in your browser.' },
      { question: 'How do I reduce an image file size to a specific KB limit?', answer: 'Enter your target limit (for example 20KB, 50KB, 100KB or 2MB) in the Max File Size field. The tool compresses towards that size while keeping the best quality it can within the limit.' },
      { question: 'Which format should I choose: JPG, PNG, or WebP?', answer: 'JPG is best for photos and small file sizes. PNG is best for graphics with text or transparent backgrounds. WebP offers the best balance of quality and compression for web use.' },
      { question: 'Is this safe for passport photos and ID documents?', answer: 'Yes. FilePilot processes your image entirely within your browser, so passport photos, signatures and ID scans are never uploaded to a server or seen by anyone else.' },
      { question: 'Can I resize images for Instagram, LinkedIn, or X?', answer: 'Yes. Use the Quick Presets to select the correct dimensions for social media posts, profile pictures and banners across the major platforms.' },
    ],
    comparison: {
      heading: 'When to use this vs the Image Formatter',
      body: 'Use this tool when a form gives you hard numbers to hit — an exact pixel size, an exact KB ceiling, or both. Use the Image Formatter when you are batch-processing several images to a consistent look rather than satisfying one strict specification.',
    },
  },

  '/image-formatter': {
    intro:
      'Image Formatter is a batch image processing tool that resizes, converts, compresses, and exports images to exact specifications. Set target dimensions, file format (JPG, PNG, WebP), quality level, and maximum file size — then process multiple images at once. Perfect for preparing images that need to meet specific upload requirements.',
    action: 'format images in batch',
    steps: [
      'Upload one or more images you need to format.',
      'Set target dimensions, output format, quality, and file size limits.',
      'Process all images and download individually or as a ZIP.',
    ],
    useCases: [
      'Prepare images for website upload with exact dimension requirements.',
      'Batch-resize product photos to consistent dimensions for a catalog.',
      'Convert and compress images to meet email or form submission size limits.',
      'Format screenshots to exact pixel dimensions for documentation.',
    ],
      seoTitle: "Image Formatter — Resize, Convert & Optimize Images Online",
    seoDescription: "Format images to exact dimensions, convert formats, set file size targets, and batch export. Free, private, browser-based.",
    faqs: [
      { question: "Can I format multiple images at once?", answer: "Yes. FilePilot supports batch formatting, allowing you to upload and process multiple images simultaneously. All images are formatted with the same settings and can be downloaded individually or as a ZIP file." },
      { question: "What output dimensions and formats are available?", answer: "You can set exact pixel dimensions or scale by percentage, and export as JPEG, PNG, or WebP. You can also set a target file size in KB, adjust quality, and choose between contain, cover, or stretch fit modes." },
      { question: "Are there preset templates available?", answer: "Yes. Built-in presets cover common use cases with pre-configured dimensions. You can also create custom dimensions and lock the aspect ratio to maintain proportions." },
      { question: "Is my data private?", answer: "Yes. All image processing happens entirely in your browser. Your files are never uploaded to any server, and EXIF metadata (including GPS data) is stripped by default during re-export." },
    ],
  },
  '/passport-photo-validator': {
    intro:
      'Passport Photo Validator checks your photo against the official technical requirements for passport and ID photos across many countries. It verifies dimensions, aspect ratio, file size, face positioning, and background uniformity. Crop and export tools help you produce a compliant photo without visiting a photo studio.',
    action: 'validate passport photos',
    steps: [
      'Upload your passport or ID photo.',
      'Select your country or choose custom dimensions.',
      'Review the validation results and use the crop tool to adjust if needed.',
    ],
    useCases: [
      'Check a photo before submitting a passport or visa application.',
      'Validate ID photos for driver\'s license or national ID requirements.',
      'Crop and resize photos to meet specific country photo specifications.',
      'Save money by preparing compliant photos at home instead of at a studio.',
    ],
      seoTitle: "Passport Photo Validator - Check Photo Requirements",
    seoDescription: "Validate passport photo dimensions, file size, and format against official requirements. Crop, resize, and export. Free, private, browser-based.",
    faqs: [
      { question: "Which country requirements are supported?", answer: "FilePilot includes validation profiles for common passport photo standards including US, UK, EU, India, and more. You can also create a custom profile with your own dimensions, background colour, and file size limits." },
      { question: "What photo compliance checks are performed?", answer: "The tool checks technical requirements including image dimensions, aspect ratio, file size limits, and format compatibility. It also provides head positioning guides and optional face detection to help you frame your photo correctly." },
      { question: "Can I crop and resize my photo?", answer: "Yes. An interactive crop tool with aspect ratio locking, corner handles, and head positioning guides lets you precisely frame your photo. The tool then resizes and exports to the profile's required dimensions." },
      { question: "Is my photo uploaded to a server?", answer: "No. All processing happens entirely in your browser. Your photo never leaves your device, and no data is collected or stored. The tool does not apply beauty filters or AI-based facial manipulation." },
    ],
  },
  '/social-media-resizer': {
    intro:
      'Social Media Resizer instantly adapts your images for every major social platform — Instagram, Facebook, LinkedIn, X (Twitter), YouTube, Pinterest, and more. Select a platform and post type (profile picture, cover photo, story, feed post, etc.), and the tool crops and resizes your image to the exact required dimensions.',
    action: 'resize images for social media',
    steps: [
      'Upload the image you want to resize.',
      'Select the social media platform and post type (e.g., Instagram Story, LinkedIn Banner).',
      'Preview the cropped result and download the correctly-sized image.',
    ],
    useCases: [
      'Create correctly-sized cover photos for Facebook and LinkedIn.',
      'Resize product images for Instagram feed posts or Stories.',
      'Prepare YouTube thumbnails at the recommended 1280×720 resolution.',
      'Batch-resize a brand photo for every social platform at once.',
    ],
      seoTitle: "Social Media Resizer",
    seoDescription: "Resize images for Instagram, Facebook, LinkedIn, X/Twitter, YouTube, Pinterest, and TikTok. Free, private, browser-based.",
    faqs: [
      { question: "Which social media platforms are supported?", answer: "FilePilot includes recommended export sizes for Instagram, Facebook, LinkedIn, X (Twitter), YouTube, Pinterest, and TikTok. Each platform has multiple presets covering posts, stories, profile pictures, banners, and more." },
      { question: "Can I resize for multiple platforms at once?", answer: "Yes. You can select multiple presets across different platforms and process all of them in a single batch. The tool generates one output per preset per source image, and you can download everything as a ZIP file." },
      { question: "What output quality can I expect?", answer: "Output quality depends on your source image resolution and the selected fit mode. You can choose between cover (crop to fill), contain (fit with padding), or stretch, and adjust JPEG/WebP quality from 10% to 100%." },
      { question: "Are my images uploaded anywhere?", answer: "No. All processing happens entirely in your browser. Your images are never uploaded to any server, and closing the tab removes all data immediately." },
    ],
  },
  '/ecommerce-image-formatter': {
    intro:
      'E-commerce Image Formatter prepares product photos for online marketplaces — Amazon, eBay, Shopify, Etsy, and others. It resizes to marketplace-specific dimensions, adds clean white backgrounds, and ensures images meet each platform\'s requirements. Batch processing lets you format entire product catalogs efficiently.',
    action: 'format e-commerce product images',
    steps: [
      'Upload your product photos.',
      'Select the target marketplace (Amazon, eBay, Shopify, etc.).',
      'Download marketplace-ready images with correct dimensions and backgrounds.',
    ],
    useCases: [
      'Prepare product listings for Amazon with compliant main images.',
      'Format photos for eBay, Etsy, or Shopify product pages.',
      'Add white backgrounds to product photos for consistent catalog styling.',
      'Batch-process product images when launching a new collection.',
    ],
      seoTitle: "E-commerce Image Formatter",
    seoDescription: "Prepare product photos with clean backgrounds, consistent dimensions, and marketplace-ready formats. All processing happens locally in your browser.",
    faqs: [
      { question: "Which marketplace requirements are supported?", answer: "FilePilot includes presets for common e-commerce platforms with recommended dimensions and formats. Presets are starting points; always verify the latest image requirements from each marketplace before uploading." },
      { question: "Can I add a clean background to product photos?", answer: "Yes. You can set a solid background colour (white is the default for most marketplaces), add padding around the product, and optionally include a drop shadow or border for a professional look." },
      { question: "Does it support batch processing?", answer: "Yes. You can upload multiple product images and format them all at once with the same settings. Results can be downloaded individually or as a ZIP file, with customizable filename templates." },
      { question: "Are my product images kept private?", answer: "Yes. All processing happens entirely in your browser. Your product images are never uploaded to any server, making it safe for unreleased or confidential product photos." },
    ],
  },
  '/scan-images-to-pdf': {
    intro:
      'Scan Images to PDF turns photos of paper documents into a clean, properly-oriented PDF. The tool applies perspective correction, contrast enhancement, and page ordering to transform camera captures into professional-looking document scans. No scanning hardware required — just your phone camera.',
    action: 'scan images to PDF',
    steps: [
      'Upload photos of the documents you want to scan.',
      'Reorder pages and adjust contrast or rotation if needed.',
      'Download the assembled PDF document.',
    ],
    useCases: [
      'Digitize paper receipts and invoices for record-keeping.',
      'Create PDFs from handwritten notes or whiteboards.',
      'Scan multi-page paper documents without a physical scanner.',
      'Convert photos of old letters or records into searchable PDFs.',
    ],
      seoTitle: "Scan Images to PDF",
    seoDescription: "Turn photos of documents into a clean, ordered, downloadable PDF. All processing happens locally in your browser.",
    faqs: [
      { question: "Can I reorder images before creating the PDF?", answer: "Yes. You can drag and drop images to reorder them, and the page order in the tool matches the final PDF output. You can also add or remove individual pages at any time." },
      { question: "What page size options are available?", answer: "FilePilot supports A4, Letter, Original Image Size, and Custom dimensions. You can also choose automatic, portrait, or landscape orientation, and set margin sizes from none to large." },
      { question: "How does scan quality affect the output?", answer: "You can adjust the image quality slider from 20% to 100%. Lower quality produces smaller files suitable for sharing, while higher quality preserves text clarity for archival purposes. Enhancement modes include grayscale, black and white, and high contrast." },
      { question: "Is my data kept private?", answer: "Yes. All processing happens entirely in your browser. Your document images are never uploaded to any server, making it safe for sensitive documents like contracts, receipts, and personal records." },
    ],
  },
  '/favicon-generator': {
    intro:
      'Favicon Generator creates all the icon files your website needs from a single source image. It generates ICO, PNG at multiple sizes (16×16 to 512×512), Apple Touch Icon, Android Chrome icons, and the corresponding HTML link tags. Upload once, download a complete icon package with ready-to-use code.',
    action: 'generate favicons',
    steps: [
      'Upload a high-quality square image (PNG or SVG recommended).',
      'The tool generates all required favicon sizes and formats.',
      'Download the icon package and copy the HTML code for your site.',
    ],
    useCases: [
      'Generate all website favicons from a single logo or icon.',
      'Create Apple Touch Icons and Android Chrome icons for mobile.',
      'Update favicons when rebranding a website.',
      'Generate complete icon sets for PWA (Progressive Web App) manifests.',
    ],
      seoTitle: "Favicon Generator",
    seoDescription: "Generate all website favicon and app icon assets from a single image. Creates PNG favicons, Apple touch icons, Android/PWA icons, and a web manifest.",
    faqs: [
      { question: "What sizes are generated?", answer: "FilePilot generates a complete set of favicon assets including 16x16, 32x32, and 48x48 for browser tabs, 180x180 for Apple touch icons, and 192x192 and 512x512 for Android/PWA icons. All assets are downloadable as a single ZIP file." },
      { question: "Does it generate ICO files?", answer: "This tool generates PNG favicon assets rather than .ico files, because generating a true ICO format requires a dedicated encoder. Modern browsers support PNG favicons directly, and the tool provides an HTML snippet for referencing them." },
      { question: "Can I use an SVG image as input?", answer: "Yes. FilePilot accepts PNG, JPEG, WebP, and SVG images as input. Square images work best; non-square images are automatically centered and scaled to fit the square icon area." },
      { question: "Is my logo uploaded to a server?", answer: "No. All favicon generation happens entirely in your browser. Your logo image is never uploaded to any server, ensuring your brand assets remain private." },
    ],
  },
  '/qr-generator': {
    intro:
      'QR Code Generator creates custom QR codes for URLs, Wi-Fi credentials, contact cards (vCard), email addresses, phone numbers, SMS messages, and plain text. Customize colors, add a logo overlay, choose dot styles, and download in PNG or SVG. All generation happens locally — your data isn\'t sent anywhere.',
    action: 'generate QR codes',
    steps: [
      'Select the QR type (URL, Wi-Fi, vCard, etc.) and enter the data.',
      'Customize colors, dot style, and optionally add a logo.',
      'Download the QR code as PNG or SVG.',
    ],
    useCases: [
      'Create QR codes for restaurant menus or marketing materials.',
      'Generate Wi-Fi QR codes for office or guest network access.',
      'Build vCard QR codes for business cards.',
      'Create scannable links for event registration or product pages.',
    ],
      seoTitle: "QR Code Generator",
    seoDescription: "Create custom QR codes for URLs, WiFi, vCards, events, and more. Customize colors, styles, and add logos. Free, private, and runs entirely in your browser.",
    faqs: [
      { question: "What types of QR codes can I create?", answer: "FilePilot supports URL, plain text, email, phone, SMS, WiFi network, vCard contact, calendar event, and custom raw content QR codes. Each type uses the appropriate encoding format for maximum scanner compatibility." },
      { question: "What customization options are available?", answer: "You can customize dot style (square, rounded, dots), corner styles, foreground and background colours, transparent backgrounds, margin size, error correction level, and add a custom logo image to the centre of the QR code." },
      { question: "What download formats are available?", answer: "QR codes can be downloaded as PNG, SVG, or JPEG files at sizes up to 4096 pixels. SVG is ideal for print as it scales to any size without quality loss. You can also copy the QR code directly to your clipboard." },
      { question: "Will customized QR codes still scan reliably?", answer: "Standard black-and-white QR codes with sufficient contrast scan reliably across all devices. Heavily styled codes, low contrast colours, or large logos may reduce scannability, so always test with multiple devices before printing." },
    ],
  },

  // ── IMAGE TOOLS ────────────────────────────────────────────────────────────
  '/compress-image': {
    intro:
      'Compress Image reduces the file size of JPG, PNG, and WebP images while preserving visual quality. Adjust the compression level or set a target file size in KB. Batch mode processes multiple images at once. The compression runs entirely in your browser using the Canvas API — your photos stay private.',
    action: 'compress images',
    steps: [
      'Upload one or more images (JPG, PNG, or WebP).',
      'Select a compression preset or set a custom quality/target size.',
      'Download compressed images individually or as a ZIP.',
    ],
    useCases: [
      'Reduce photo sizes for faster website loading.',
      'Compress images to meet email attachment size limits.',
      'Batch-optimize images for a portfolio or gallery.',
      'Shrink screenshots for documentation without visible quality loss.',
    ],
      seoTitle: "Compress Image Online - Reduce Image File Size",
    seoDescription: "Compress JPEG, PNG, and WebP images in your browser. Reduce file size while preserving quality. Free, private, no uploads.",
    faqs: [
      { question: "Does compressing an image reduce its quality?", answer: "It depends on the compression level you choose. The 'High Quality' preset preserves most visual detail while still reducing file size, whereas the 'Small File' preset prioritizes size reduction and may introduce visible artifacts." },
      { question: "What image formats can I compress?", answer: "You can compress JPEG, PNG, and WebP images. All processing happens in your browser using the Canvas API, so no server upload is required." },
      { question: "Are my uploaded images sent to a server?", answer: "No. All compression is performed locally in your browser. Your images never leave your device, ensuring complete privacy." },
      { question: "Can I compress multiple images at once?", answer: "Yes. You can upload and compress multiple images in a single batch. Compressed results can be downloaded individually or as a ZIP archive." },
    ],
  },
  '/resize-image': {
    intro:
      'Resize Image changes the pixel dimensions of any image by entering exact width and height values or a scaling percentage. Lock the aspect ratio to prevent distortion, or freely adjust both dimensions. Supports JPG, PNG, WebP, and other common formats, with batch processing for multiple files.',
    action: 'resize images',
    steps: [
      'Upload the image you want to resize.',
      'Enter the new width and height (or percentage), with optional aspect ratio lock.',
      'Download the resized image.',
    ],
    useCases: [
      'Resize photos to specific pixel dimensions for web or print.',
      'Scale down large camera photos for sharing via email or messaging.',
      'Prepare images at exact sizes for form submissions or profile pictures.',
      'Batch-resize a folder of images to consistent dimensions.',
    ],
      seoTitle: "Resize Image Online - Free Browser-Based Tool",
    seoDescription: "Resize images by pixels or percentage. Fit, fill, or stretch to exact dimensions. Free, private, browser-based.",
    faqs: [
      { question: "Can I maintain the aspect ratio when resizing?", answer: "Yes. The aspect ratio lock is enabled by default. When locked, changing the width automatically adjusts the height proportionally, and vice versa." },
      { question: "What dimensions can I resize to?", answer: "You can resize by exact pixel values up to 10,000 px or by percentage scale. Preset sizes for social media, web, and e-commerce are also available." },
      { question: "Does resizing reduce image quality?", answer: "Downscaling generally preserves quality well. Upscaling may reduce sharpness, which is why the 'Do not upscale' option is enabled by default to prevent enlarging smaller images." },
      { question: "Is my image uploaded to a server?", answer: "No. All resizing is performed locally in your browser. Your images are never uploaded, ensuring complete privacy." },
    ],
  },
  '/convert-image': {
    intro:
      'Convert Image transforms images between JPEG, PNG, WebP, and AVIF formats instantly. This is useful for switching between lossy and lossless formats, converting to modern web formats for better compression, or producing compatible files for applications that require a specific format.',
    action: 'convert image formats',
    steps: [
      'Upload one or more images in any supported format.',
      'Select the target format (JPEG, PNG, WebP, or AVIF).',
      'Download the converted images.',
    ],
    useCases: [
      'Convert PNG screenshots to JPEG for smaller file sizes.',
      'Transform JPEG photos to PNG for lossless archival.',
      'Convert images to WebP or AVIF for modern web performance.',
      'Produce JPEG versions of WebP images for compatibility with older apps.',
    ],
      seoTitle: "Convert Image — JPEG, PNG, WebP, AVIF",
    seoDescription: "Convert images between JPEG, PNG, WebP, and AVIF formats. Processed locally in your browser — no uploads, 100% private.",
    faqs: [
      { question: "What image formats are supported for conversion?", answer: "You can convert between JPEG, PNG, WebP, and AVIF formats. AVIF availability depends on your browser's support for the format." },
      { question: "Does converting an image affect its quality?", answer: "Converting between lossy formats (JPEG, WebP, AVIF) may slightly reduce quality depending on the quality slider setting. Converting to PNG preserves quality since PNG is lossless." },
      { question: "Can I convert multiple images at once?", answer: "Yes. You can upload and convert multiple images in a single batch. All converted files can be downloaded individually or together as a ZIP archive." },
      { question: "Are my images uploaded to a server during conversion?", answer: "No. All conversion is performed entirely in your browser using the Canvas API. Your images never leave your device, ensuring complete privacy." },
    ],
  },
  '/website-image-optimiser': {
    intro:
      'Website Image Optimiser generates responsive, web-ready image variants from a single source image. It creates multiple sizes for srcset, converts to modern formats (WebP/AVIF), and generates the corresponding HTML picture and img tags with proper srcset and sizes attributes — ready to paste into your website code.',
    action: 'optimize images for the web',
    steps: [
      'Upload the source image you want to optimize.',
      'Configure the responsive breakpoints and output formats.',
      'Download the optimized image variants and copy the HTML code.',
    ],
    useCases: [
      'Generate responsive image sets for a website redesign.',
      'Create WebP and AVIF variants alongside JPEG fallbacks.',
      'Produce correctly-sized images for different screen densities (1×, 2×, 3×).',
      'Optimize hero images and banners for fast page loading.',
    ],
      seoTitle: "Website Image Optimiser - Responsive Images for the Web",
    seoDescription: "Generate optimised, responsive image variants for your website. Create WebP, AVIF, and JPEG versions at multiple sizes with ready-to-use HTML snippets. Free, private, no uploads.",
    faqs: [
      { question: "What are responsive images and why do they matter?", answer: "Responsive images serve different sizes to different devices so that mobile users download smaller files and desktop users get full-resolution versions. This improves page load speed and Core Web Vitals scores." },
      { question: "How does srcset generation work?", answer: "The tool generates multiple resized versions of your image at the widths you select, then provides ready-to-use HTML picture and srcset snippets that browsers use to pick the best variant for each viewport." },
      { question: "What web-optimised formats are supported?", answer: "You can generate variants in WebP, AVIF, and JPEG. WebP offers strong compression with broad browser support, while AVIF provides even better compression for browsers that support it." },
      { question: "Does this tool improve my website's performance?", answer: "Yes. Serving correctly sized images in modern formats like WebP can significantly reduce page weight and improve Largest Contentful Paint (LCP). All processing happens locally in your browser." },
    ],
  },
  '/image-quality-analyzer': {
    intro:
      'Image Quality Analyzer inspects an image and reports its dimensions, file size, format, color space, DPI, and estimated quality level. It provides actionable recommendations — whether the image is print-ready, web-suitable, or needs optimization. Think of it as a health check for your images.',
    action: 'analyze image quality',
    steps: [
      'Upload the image you want to analyze.',
      'Review the detailed quality report (dimensions, DPI, size, format, etc.).',
      'Follow the recommendations to optimize if needed.',
    ],
    useCases: [
      'Check if a photo has sufficient resolution for printing.',
      'Verify image dimensions meet platform or submission requirements.',
      'Assess whether an image needs optimization before uploading to a website.',
      'Diagnose why an image appears blurry or pixelated.',
    ],
      seoTitle: "Image Quality Analyzer - Check Image Resolution & Format",
    seoDescription: "Analyze image quality, resolution, file size, and format suitability for web, print, and social media. Free, private, no uploads.",
    faqs: [
      { question: "What quality metrics are analyzed?", answer: "FilePilot checks image dimensions, megapixels, file size, format, aspect ratio, estimated DPI, colour depth, and transparency support. Each metric is evaluated against the requirements of your selected intended use." },
      { question: "What recommendations does the analyzer provide?", answer: "Based on your intended use (web, print, social media, etc.), the tool provides categorized recommendations covering quality, dimensions, file weight, format suitability, and privacy concerns like embedded metadata." },
      { question: "What image formats are supported?", answer: "The analyzer supports all common image formats including JPEG, PNG, WebP, GIF, and more. It detects the format automatically and advises whether it is suitable for your intended use." },
      { question: "Is my image uploaded to a server?", answer: "No. All analysis happens entirely in your browser. Your image is never uploaded to any server, ensuring complete privacy for sensitive or proprietary images." },
    ],
  },
  '/crop-image': {
    intro:
      'Crop Image lets you select and extract a rectangular area from any JPG, PNG, or WebP image. Use preset aspect ratios (1:1, 16:9, 4:3, etc.) or draw a custom selection. The cropped result is downloaded in the original format at full resolution.',
    action: 'crop images',
    steps: [
      'Upload the image you want to crop.',
      'Draw the crop area or select a preset aspect ratio.',
      'Click "Crop & Download" to save the cropped image.',
    ],
    useCases: [
      'Crop photos to square format for social media profile pictures.',
      'Remove unwanted borders or background from product photos.',
      'Extract a specific area of interest from a larger image.',
      'Create correctly-proportioned thumbnails for video platforms.',
    ],
      seoTitle: "Crop Image Online - Free Browser-Based Image Cropper",
    seoDescription: "Crop JPEG, PNG, and WebP images with precision. Interactive crop editor with aspect ratio presets. Free, private, no uploads.",
    faqs: [
      { question: "Can I crop to custom dimensions?", answer: "Yes. You can freely drag the crop area to any size, use aspect ratio presets like 1:1 or 16:9, or enter a custom aspect ratio. Optional output dimensions let you resize the cropped area to exact pixel values." },
      { question: "What image formats are supported for cropping?", answer: "You can crop JPEG, PNG, and WebP images. The output format can be set independently, so you can crop a PNG and export it as JPEG or WebP." },
      { question: "Does cropping reduce image quality?", answer: "Cropping itself does not reduce quality. The output quality depends on the format and quality slider setting you choose when exporting the cropped image." },
      { question: "Are my images uploaded to a server?", answer: "No. All cropping is performed locally in your browser. Your images are never uploaded, ensuring complete privacy." },
    ],
  },
  '/rotate-image': {
    intro:
      'Rotate Image rotates or flips images by any angle — 90°, 180°, 270°, or a custom rotation. You can also flip images horizontally or vertically. The tool supports batch processing, so you can rotate or flip multiple images at once and download them all.',
    action: 'rotate images',
    steps: [
      'Upload one or more images you want to rotate or flip.',
      'Select the rotation angle or flip direction.',
      'Download the rotated images individually or as a batch.',
    ],
    useCases: [
      'Fix photos that were taken in the wrong orientation.',
      'Rotate scanned documents to the correct reading direction.',
      'Flip images for mirror effects or design requirements.',
      'Batch-correct orientation for a folder of camera photos.',
    ],
      seoTitle: "Rotate & Flip Image Online - Free Browser-Based Tool",
    seoDescription: "Rotate images by any angle and flip horizontally or vertically. Batch support with ZIP download. Free, private, no uploads.",
    faqs: [
      { question: "What rotation angles are supported?", answer: "You can rotate images by 90-degree increments with one click, or enter any custom angle. Non-90-degree rotations expand the canvas and fill corners with a configurable background color." },
      { question: "Does rotation fix EXIF orientation issues?", answer: "Yes. Since the tool re-renders the image through the Canvas API, EXIF orientation tags are applied visually and the output is saved with the correct orientation baked in." },
      { question: "Does rotating or flipping reduce image quality?", answer: "The output quality depends on the format and quality slider you choose. For lossless results, export as PNG. JPEG and WebP use lossy compression controlled by the quality setting." },
      { question: "Are my images uploaded to a server?", answer: "No. All rotation and flipping is performed locally in your browser. Your images are never uploaded, ensuring complete privacy." },
    ],
  },
  '/watermark-image': {
    intro:
      'Watermark Image adds text or image watermarks to photos with adjustable size, opacity, rotation, and position. Apply watermarks to single images or batch-process an entire folder. This is the standard way to protect original photos or brand images before posting online.',
    action: 'add watermarks to images',
    steps: [
      'Upload one or more images to watermark.',
      'Enter watermark text or upload a watermark image, then adjust opacity and position.',
      'Download watermarked images individually or as a ZIP.',
    ],
    useCases: [
      'Protect photography portfolios with a copyright watermark.',
      'Brand images with a company logo before distributing.',
      'Add "PROOF" or "SAMPLE" overlays to design previews.',
      'Batch-watermark event photos before sharing with clients.',
    ],
      seoTitle: "Watermark Image Online - Add Text or Logo Watermarks",
    seoDescription: "Add text or image watermarks to photos with adjustable position, opacity, and repeat patterns. Free, private, no uploads.",
    faqs: [
      { question: "What types of watermarks can I add?", answer: "You can add text watermarks with custom font, size, color, and shadow, or image/logo watermarks from an uploaded PNG, JPEG, or WebP file. Both types support adjustable position and opacity." },
      { question: "Can I control the transparency of the watermark?", answer: "Yes. An opacity slider lets you set the watermark transparency from 5% to 100%. This works for both text and image watermarks." },
      { question: "Can I watermark multiple images at once?", answer: "Yes. You can upload multiple images and apply the same watermark settings to all of them in a single batch. Results are downloaded individually or as a ZIP archive." },
      { question: "Are my images uploaded to a server?", answer: "No. All watermarking is performed locally in your browser. Your images and logo files are never uploaded, ensuring complete privacy." },
    ],
  },
  '/remove-image-metadata': {
    intro:
      'Metadata Remover inspects and strips EXIF, GPS, camera, and software metadata from images. Digital photos can contain your exact location, device model, and shooting settings — information you probably don\'t want to share publicly. This tool removes it all, leaving just the pixel data.',
    action: 'remove image metadata',
    steps: [
      'Upload one or more images you want to clean.',
      'Review the metadata that will be removed (GPS, camera model, etc.).',
      'Download the metadata-free images.',
    ],
    useCases: [
      'Remove GPS coordinates before sharing photos online.',
      'Strip camera model and settings data for privacy.',
      'Clean metadata before uploading photos to marketplaces or social media.',
      'Batch-strip metadata from an entire photo collection.',
    ],
    h1: "Remove Image Metadata",
    seoTitle: 'Remove Image Metadata – Strip EXIF, GPS & Camera Data',
    seoDescription:
      'Remove EXIF, GPS location and camera metadata from photos before sharing. Free EXIF remover that runs locally — images never uploaded.',
    faqs: [
      {
        question: 'What is EXIF data and why should I remove it?',
        answer:
          'EXIF is information your camera or phone embeds in each photo: GPS coordinates, date and time, device model, and exposure settings. Shared as-is, a holiday photo can reveal your home address and the exact device that took it — which is why stripping it before publishing is worth the few seconds it takes.',
      },
      {
        question: 'How do I remove GPS location from a photo?',
        answer:
          'Upload the image and the tool shows the embedded metadata, including any GPS coordinates, then produces a clean copy with those tags removed while leaving the picture itself untouched.',
      },
      {
        question: 'Does removing metadata change image quality?',
        answer:
          'No. Metadata is stored in tags alongside the pixels, so removing it leaves the image data bit-for-bit intact. There is no recompression and no visible change — just a slightly smaller file.',
      },
      {
        question: 'Do social media sites already strip EXIF for me?',
        answer:
          'Most large platforms strip EXIF on upload, but you cannot rely on it. The photo is still transmitted with its location intact and stored on their servers, and plenty of forums, marketplaces, blog platforms and messaging apps pass the original file straight through.',
      },
      {
        question: 'Can I clean several photos at once?',
        answer:
          'Yes. Multiple images can be processed in a single batch, which is the practical way to clean an entire album before publishing it.',
      },
      {
        question: 'Is it safe to upload private photos to a metadata remover?',
        answer:
          'With this tool there is no upload at all — the work happens in your browser and the images never leave your device. That is the point: sending a photo to a remote server to strip its location data means handing that exact location data to the server first.',
      },
    ],
    comparison: {
      heading: 'When to use this vs a server-based EXIF remover',
      body: 'Most online EXIF removers upload your photo, strip the tags on their server, and send a clean copy back. The contradiction is hard to miss: to hide your GPS coordinates from strangers, you first transmit them to a stranger, along with the photo, and trust the logs and retention policy you cannot see. This tool does the work in your browser, so the location data is erased on the device that recorded it and nothing is transmitted. Desktop tools like ExifTool are equally private and more powerful for scripted batch jobs — use those for automation, and this when you want a clean photo in a few seconds with nothing to install.',
    },
  },
  '/blur-face': {
    intro:
      'Blur Face lets you blur faces, license plates, or any sensitive area in an image. Draw blur regions manually or use automatic face detection. Adjustable blur intensity lets you control how much detail is obscured. The tool runs entirely in your browser — your photos with identifiable people never leave your device.',
    action: 'blur faces in images',
    steps: [
      'Upload the image containing faces or areas to blur.',
      'Draw blur regions over sensitive areas, or use auto-detect for faces.',
      'Adjust blur intensity and download the processed image.',
    ],
    useCases: [
      'Blur faces of bystanders before posting street photography.',
      'Obscure license plates in photos shared online.',
      'Anonymize people in screenshots or documentation images.',
      'Protect children\'s identities in published event photos.',
    ],
      seoTitle: "Blur Face & Plate Online - Privacy Blur Tool",
    seoDescription: "Blur faces, license plates, and sensitive areas in images. Gaussian blur, pixelate, or black bar. Free, private, no uploads.",
    faqs: [
      { question: "Does the tool automatically detect faces?", answer: "Yes, if your browser supports the FaceDetector API it can automatically detect faces in the image. Otherwise, you can manually draw blur regions by clicking and dragging on the canvas." },
      { question: "Can I adjust the blur intensity?", answer: "Yes. A blur intensity slider lets you control the strength of the Gaussian blur or pixelation effect from subtle to heavy, depending on the level of anonymization you need." },
      { question: "Is this tool safe for protecting people's privacy?", answer: "The tool applies visible image edits that obscure selected areas. However, you should always verify the blurred output carefully before sharing, as incorrectly placed regions may leave sensitive content visible." },
      { question: "What image formats are supported?", answer: "You can blur areas in JPEG, PNG, WebP, and most other raster image formats. All processing happens locally in your browser and images are never uploaded to any server." },
    ],
  },
  '/photo-editor': {
    intro:
      'Photo Editor provides a full suite of editing tools — filters, brightness, contrast, saturation, sharpness, crop, rotate, text, frames, and stickers — all in your browser. The editor uses a layer-based approach for non-destructive editing, letting you experiment with effects before committing to a final export.',
    action: 'edit photos',
    steps: [
      'Upload the photo you want to edit.',
      'Apply filters, adjust settings, add text, or crop as needed.',
      'Export the finished image in your preferred format.',
    ],
    useCases: [
      'Quick-edit photos before posting to social media.',
      'Apply filters and color corrections to batch of photos.',
      'Add text overlays or captions to images.',
      'Perform basic retouching without installing Photoshop or GIMP.',
    ],
      seoTitle: "Photo Editor Online - Free Browser-Based Image Editor",
    seoDescription: "Edit photos with brightness, contrast, filters, text overlay, borders, and more. Free, private, no uploads.",
    faqs: [
      { question: "What editing features are available?", answer: "The editor offers brightness, contrast, saturation, exposure, temperature, tint, highlights, shadows, sharpness, blur, grayscale, sepia, vignette adjustments, plus rotate, flip, text overlay, borders, and preset filters." },
      { question: "What formats can I export my edited photo in?", answer: "You can export edited images as JPEG, PNG, or WebP. A quality slider is available for JPEG and WebP to control the balance between file size and visual quality." },
      { question: "Can I undo changes while editing?", answer: "Yes. Full undo and redo support is built in, so you can step back through your editing history at any time. A reset button also restores all settings to their defaults." },
      { question: "Are my photos uploaded to a server?", answer: "No. All editing is performed locally in your browser using the Canvas API. Your photos are never uploaded, ensuring complete privacy." },
    ],
  },
  '/image-to-svg': {
    intro:
      'Image to SVG converts raster images (PNG, JPG) into editable SVG vector files by tracing the shapes and colors. The tool works best with simple graphics like logos, icons, and illustrations with clean edges. The resulting SVG is infinitely scalable and editable in vector graphics software.',
    action: 'convert images to SVG',
    steps: [
      'Upload a simple image (logo, icon, or illustration).',
      'Adjust tracing settings for detail level and color count.',
      'Download the traced SVG file.',
    ],
    useCases: [
      'Convert a PNG logo to scalable SVG format for a website.',
      'Vectorize simple illustrations for use in design software.',
      'Create SVG versions of icons for responsive web design.',
      'Convert hand-drawn sketches into clean vector graphics.',
    ],
    seoTitle: 'Image to SVG – Convert PNG & JPG to Vector Online',
    seoDescription:
      'Convert PNG, JPG and raster images to scalable SVG vectors by tracing. Free online image to SVG converter — no uploads, no signup.',
    faqs: [
      {
        question: 'How does raster to vector conversion work?',
        answer:
          'The tool traces the outlines of shapes in your raster image and converts them into scalable SVG paths. It supports monochrome threshold, line art edge detection, and multi-color quantization modes.',
      },
      {
        question: 'What types of images convert best to SVG?',
        answer:
          'Logos, icons, signatures, line art, and simple illustrations produce the best results. Detailed photographs typically generate large SVG files with many paths and may not look accurate.',
      },
      {
        question: 'Can I convert a PNG logo to SVG for my website?',
        answer:
          'Yes — this is the most common use. A traced SVG logo stays crisp at any size, from a favicon to a billboard, and usually weighs less than a set of PNG exports. Check the result against the original, since very small text or soft gradients can trace imperfectly.',
      },
      {
        question: 'Can I edit the resulting SVG file?',
        answer:
          'Yes. The output is a standard SVG file that can be opened and edited in any vector graphics editor like Inkscape, Adobe Illustrator, or Figma.',
      },
      {
        question: 'Does the conversion affect image quality?',
        answer:
          'Vector tracing is an approximation, not a pixel-perfect copy. You can adjust smoothing, simplification, and color count settings to balance detail and file size. All processing happens locally in your browser.',
      },
      {
        question: 'Why does my photo produce a huge SVG file?',
        answer:
          'Tracing has to describe every colour region as a path, and a photograph contains thousands of them, so the SVG ends up larger and slower than the original JPG. Vectorisation suits flat graphics; keep photographs as raster and use Compress Image instead.',
      },
    ],
    comparison: {
      heading: 'When to vectorise vs keep the raster image',
      body: 'Convert to SVG when the artwork is flat and needs to scale: logos, icons, signatures and line art all benefit, staying razor-sharp on any screen and usually shrinking in file size along the way. Keep the raster file when the image is photographic — tracing a photo produces thousands of paths, giving you a file that is bigger, slower to render, and less faithful than the JPG you started with. The quick test is whether you could redraw it with a handful of solid shapes: if yes, vectorise; if it has soft gradients and fine texture, compress the raster instead.',
    },
  },
  '/color-picker': {
    intro:
      'Color Picker lets you pick colors from any uploaded image by clicking or hovering over pixels. It displays the color value in HEX, RGB, HSL, and CSS formats, with a one-click copy button for each. Build a color palette by picking multiple colors, then export them all for use in your design work.',
    action: 'pick colors from images',
    steps: [
      'Upload an image or screenshot.',
      'Click on any pixel to capture its color in HEX, RGB, and HSL.',
      'Copy the color values or build a palette of picked colors.',
    ],
    useCases: [
      'Extract brand colors from a logo or design file.',
      'Build a color palette from a photograph for design inspiration.',
      'Identify exact colors from a screenshot or mockup.',
      'Sample colors from an image to match in CSS or design software.',
    ],
      seoTitle: "Color Picker -",
    seoDescription: "Pick colours from images, extract palettes, and copy colour values in HEX, RGB, HSL, HSV, CMYK, and CSS variable formats. All processing happens locally in your browser.",
    faqs: [
      { question: "What color formats does the Color Picker support?", answer: "The tool supports HEX, HEX8, RGB, RGBA, HSL, HSLA, HSV, CMYK, and CSS custom property formats. You can copy any format to your clipboard with a single click." },
      { question: "Can I pick colors from an uploaded image?", answer: "Yes. Upload any image and click on it to pick pixel-accurate colors. A magnifying loupe shows a zoomed view of surrounding pixels for precise selection." },
      { question: "How do I copy a color value?", answer: "Each color format row has a copy button that copies the value to your clipboard. You can also click on saved palette swatches to copy their HEX value instantly." },
      { question: "Does this tool work in all browsers?", answer: "The core color picking and conversion features work in all modern browsers. The screen EyeDropper feature requires Chromium-based browsers (Chrome, Edge). All processing happens locally in your browser." },
    ],
  },
};
