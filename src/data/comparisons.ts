import type { SiteFaq } from './siteContent.ts';

/**
 * "Alternative to X" pages (Phase 1.3).
 *
 * These name real companies, so every claim here is limited to what those
 * companies publicly document about their own architecture — that their online
 * tools upload your file to their servers to process it. That is a description
 * of how the product works, not a judgement about it, and it is the one thing
 * that genuinely distinguishes FilePilot.
 *
 * Rules for editing this file:
 *  - No pricing or plan limits. They change, and a stale claim becomes a false
 *    claim about a named company.
 *  - No retention periods in the copy for the same reason — "deleted after a
 *    stated window" stays true whatever the window becomes.
 *  - No security or trustworthiness claims. These are large companies with real
 *    security programmes; the argument is architectural, not reputational.
 *  - `limitations` is not optional. A comparison page that lists no reason to
 *    use the competitor is an advert, and readers and Google both discount it.
 */

export interface ComparisonRow {
  aspect: string;
  competitor: string;
  filepilot: string;
}

export interface ComparisonEntry {
  /** Company/product name as they write it. */
  competitor: string;
  route: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Why someone is searching for an alternative in the first place. */
  motivation: string;
  /** The architectural difference, stated factually. */
  difference: string;
  table: ComparisonRow[];
  /** Honest reasons to stay with the competitor. */
  limitations: string[];
  /** Competitor task → the FilePilot route that covers it. */
  toolMap: { task: string; route: string }[];
  faqs: SiteFaq[];
}

const SHARED_LIMITATIONS_NOTE =
  'FilePilot runs inside your browser tab, which is what keeps your file private — and also what sets its limits.';

export const comparisonContent: Record<string, ComparisonEntry> = {
  '/smallpdf-alternative': {
    competitor: 'Smallpdf',
    route: '/smallpdf-alternative',
    title: 'Smallpdf Alternative That Never Uploads Your Files | FilePilot',
    description:
      'A free Smallpdf alternative that processes PDFs in your browser instead of on a server. No uploads, no account, no file limits. Compare how the two handle your documents.',
    h1: 'A Smallpdf Alternative That Doesn\'t Upload Your Files',
    intro:
      'Smallpdf is a polished, capable PDF suite used by millions of people. If you are looking for an alternative, it is usually for one specific reason: to use PDF tools without sending your document to somebody else\'s server. FilePilot is built for exactly that case — the same everyday PDF operations, performed inside your browser tab, with the file never leaving your device.',
    motivation:
      'Most people searching for a Smallpdf alternative are not unhappy with the tools. They are handling something they would rather not upload — a signed contract, a payslip, a medical letter, a scan of an ID — and they have realised that "processed and then deleted" still means the file was transmitted, written to a server they do not control, and handled by software they cannot inspect. Others simply hit a limit on the free tier and would rather not pay for an operation their own laptop can do in a second.',
    difference:
      'Smallpdf is a server application. You upload a file, their infrastructure processes it, and you download the result; Smallpdf documents this openly and deletes processed files after a stated window. FilePilot is a client application. The PDF engine is compiled to WebAssembly and shipped to your browser, so the work happens on your own CPU and the bytes of your document are never put on the network. You can verify the difference yourself: open your browser\'s Network tab while a tool runs and watch whether the file is transmitted.',
    table: [
      { aspect: 'Where your file is processed', competitor: 'On Smallpdf\'s servers, after upload', filepilot: 'In your browser, on your own device' },
      { aspect: 'File leaves your device', competitor: 'Yes — that is how it works', filepilot: 'No' },
      { aspect: 'Server-side copy to delete', competitor: 'Yes, removed after a stated window', filepilot: 'None is ever created' },
      { aspect: 'Account required', competitor: 'For some tools and higher usage', filepilot: 'Never' },
      { aspect: 'Daily/free-tier task limits', competitor: 'Free tier is metered', filepilot: 'None — the limit is your device' },
      { aspect: 'Works offline', competitor: 'No — needs the server', filepilot: 'Yes, once the page has loaded' },
      { aspect: 'Watermarks on output', competitor: 'Depends on tool and plan', filepilot: 'Never' },
      { aspect: 'Cost', competitor: 'Free tier plus paid plans', filepilot: 'Free' },
      { aspect: 'Very large files', competitor: 'Handled by server hardware', filepilot: 'Limited by your device\'s memory' },
      { aspect: 'OCR and scanned-text recognition', competitor: 'Mature, server-side', filepilot: 'Browser-based, more limited' },
    ],
    limitations: [
      `${SHARED_LIMITATIONS_NOTE} A 500 MB scanned PDF that a server chews through easily may exhaust a browser tab's memory.`,
      'Smallpdf\'s OCR is server-side and more capable than anything that runs client-side today. If your work depends on recognising text in large scanned archives, that is a real reason to stay.',
      'Smallpdf offers a managed e-signature workflow with countersigning, reminders and stored audit trails. FilePilot can place a signature on a PDF, but it deliberately stores nothing, so it cannot provide a hosted audit trail.',
      'Smallpdf has team accounts, cloud storage integrations and mobile apps. FilePilot is a single-user web app with no accounts and no sync by design.',
    ],
    toolMap: [
      { task: 'Merge PDF', route: '/merge' },
      { task: 'Split PDF', route: '/split' },
      { task: 'Compress PDF', route: '/compress' },
      { task: 'PDF to JPG', route: '/pdf-to-jpg' },
      { task: 'JPG to PDF', route: '/jpg-to-pdf' },
      { task: 'Rotate PDF', route: '/rotate-pdf' },
      { task: 'Delete pages', route: '/delete-pages' },
      { task: 'Sign PDF', route: '/sign-pdf' },
      { task: 'Watermark PDF', route: '/watermark-pdf' },
      { task: 'Extract text', route: '/extract-text' },
    ],
    faqs: [
      {
        question: 'Is FilePilot really free, with no Smallpdf-style task limits?',
        answer: 'Yes. There is no metering because there is no server cost to meter — the processing happens on your device, so FilePilot is not paying per file. There is no account, no watermark and no daily task cap. The only ceiling is how much memory your browser can give a single tab.',
      },
      {
        question: 'How can I be sure my file is not uploaded?',
        answer: 'Check it directly. Open your browser\'s developer tools, switch to the Network tab, and run any FilePilot tool. You will see the page and its code load, and no request carrying your file. This is the advantage of client-side processing: the claim is independently verifiable rather than a promise.',
      },
      {
        question: 'Does FilePilot do everything Smallpdf does?',
        answer: 'No. Smallpdf has mature server-side OCR, a hosted e-signature workflow with audit trails, team accounts and cloud storage integrations. FilePilot covers the everyday operations — merge, split, compress, convert, rotate, reorder, redact, sign, watermark — and does them without uploading. For large scanned archives or a managed signing process, Smallpdf remains the better fit.',
      },
      {
        question: 'Is Smallpdf unsafe?',
        answer: 'That is not the claim. Smallpdf is a large company with a real security programme and a documented deletion policy. The difference is structural: any server-based tool has to receive your file to work on it, so there is a window in which a copy exists on infrastructure you do not control. FilePilot removes that window by never creating the copy.',
      },
      {
        question: 'Can I use FilePilot offline?',
        answer: 'Yes, for most tools. Once the page has loaded, the processing code is already in your browser, so you can work on a plane or an air-gapped machine. A few AI-assisted image tools download a model file on first use and need a connection for that download only.',
      },
    ],
  },

  '/ilovepdf-alternative': {
    competitor: 'iLovePDF',
    route: '/ilovepdf-alternative',
    title: 'iLovePDF Alternative With No File Uploads | FilePilot',
    description:
      'A free iLovePDF alternative that runs entirely in your browser. Merge, split, compress and convert PDFs without uploading them to a server, without an account and without task limits.',
    h1: 'An iLovePDF Alternative That Keeps Files on Your Device',
    intro:
      'iLovePDF is one of the most widely used PDF toolkits on the web, and for most everyday jobs it works well. People look for an alternative when the document in question is one they would rather not upload at all. FilePilot covers the same core operations — merging, splitting, compressing, converting, rotating, signing — but performs every one of them inside your browser.',
    motivation:
      'The usual trigger is a specific document: a tax return, a bank statement, an employment contract, a passport scan. iLovePDF processes files on its servers and deletes them after a stated period, which is a reasonable policy — but it is still a policy, and it still requires the file to be transmitted and stored, however briefly. Anyone whose employer, client or own judgement says "this must not be uploaded to a third party" needs a tool with a different architecture, not a better policy.',
    difference:
      'The distinction is not how carefully each service handles your upload — it is whether an upload happens at all. iLovePDF receives your file, processes it on its infrastructure and returns the result. FilePilot ships the PDF engine to your browser as WebAssembly and runs it on your own machine, so the document is read into memory in your tab and never put on the network. Close the tab and the working state is gone; there is nothing on a server to expire, back up or subpoena.',
    table: [
      { aspect: 'Where your file is processed', competitor: 'On iLovePDF\'s servers, after upload', filepilot: 'In your browser, on your own device' },
      { aspect: 'File leaves your device', competitor: 'Yes', filepilot: 'No' },
      { aspect: 'Server-side copy to delete', competitor: 'Yes, removed after a stated window', filepilot: 'None is ever created' },
      { aspect: 'Account required', competitor: 'For higher usage and some tools', filepilot: 'Never' },
      { aspect: 'Task limits on the free tier', competitor: 'Yes, metered', filepilot: 'None' },
      { aspect: 'Works offline', competitor: 'No', filepilot: 'Yes, once loaded' },
      { aspect: 'Batch processing many files', competitor: 'Strong, server-side', filepilot: 'Good, bounded by your device' },
      { aspect: 'Mobile and desktop apps', competitor: 'Yes', filepilot: 'Web only' },
      { aspect: 'Cost', competitor: 'Free tier plus paid plans', filepilot: 'Free' },
    ],
    limitations: [
      `${SHARED_LIMITATIONS_NOTE} Very large or very numerous files are the case where a server genuinely wins.`,
      'iLovePDF has native mobile and desktop apps. FilePilot runs only in a browser, though it works on a phone browser.',
      'iLovePDF\'s OCR and its Office-format conversions (Word, Excel, PowerPoint) rely on server-side engines that have no full client-side equivalent yet. FilePilot\'s coverage of those formats is limited.',
      'If you need a hosted signing workflow with stored audit trails, iLovePDF provides one and FilePilot deliberately does not — storing nothing is the point.',
    ],
    toolMap: [
      { task: 'Merge PDF', route: '/merge' },
      { task: 'Split PDF', route: '/split' },
      { task: 'Compress PDF', route: '/compress' },
      { task: 'PDF to JPG', route: '/pdf-to-jpg' },
      { task: 'JPG to PDF', route: '/jpg-to-pdf' },
      { task: 'Organise pages', route: '/organize-pdf' },
      { task: 'Add page numbers', route: '/page-numbers' },
      { task: 'Watermark PDF', route: '/watermark-pdf' },
      { task: 'Rotate PDF', route: '/rotate-pdf' },
      { task: 'Repair PDF', route: '/repair-pdf' },
    ],
    faqs: [
      {
        question: 'What is the main difference between FilePilot and iLovePDF?',
        answer: 'Where the work happens. iLovePDF uploads your file to its servers, processes it there and sends the result back. FilePilot runs the same kind of processing inside your browser using WebAssembly, so your file stays on your device and no server-side copy is ever made.',
      },
      {
        question: 'Does FilePilot have upload limits or a free-tier cap?',
        answer: 'No. There is nothing to meter because there is no server doing the work. No account, no daily cap, no watermarks. Practical limits come from your own device\'s memory, not from a plan.',
      },
      {
        question: 'Can FilePilot convert PDF to Word or Excel like iLovePDF?',
        answer: 'Not equivalently. Faithful Office-format conversion depends on engines that currently run server-side. FilePilot can extract text and convert to Markdown, JSON or plain text, which covers many reuse cases, but if you need a well-formatted .docx you will get a better result from a server-based tool.',
      },
      {
        question: 'Is iLovePDF unsafe to use?',
        answer: 'No — this is a comparison of architectures, not a warning. iLovePDF publishes its deletion policy and is used at enormous scale. The point is simply that any server-based tool must receive your file, which creates a window where a copy exists off your device. If that window is unacceptable for a particular document, you need client-side processing.',
      },
      {
        question: 'Do I need to install anything?',
        answer: 'No. FilePilot is a web page. Open the tool you need and use it. There is no download, no extension and no account.',
      },
    ],
  },

  '/adobe-acrobat-online-alternative': {
    competitor: 'Adobe Acrobat online',
    route: '/adobe-acrobat-online-alternative',
    title: 'Free Adobe Acrobat Online Alternative, No Upload | FilePilot',
    description:
      'A free alternative to Adobe Acrobat\'s online PDF tools that needs no Adobe account and never uploads your file. Merge, split, compress, convert and sign PDFs in your browser.',
    h1: 'A Free Alternative to Adobe Acrobat\'s Online PDF Tools',
    intro:
      'Adobe Acrobat is the reference implementation for PDF — it defined the format. Its free online tools are convenient, but they route your document through Adobe\'s cloud and increasingly ask you to sign in. If you want the same everyday operations without an account and without uploading the file, FilePilot does them in your browser.',
    motivation:
      'Two things send people looking for an alternative to Acrobat\'s online tools. The first is friction: being asked to create or sign in to an Adobe account to finish a one-off task, or hitting a limit that pushes toward a subscription. The second is the document itself — corporate documents under a confidentiality obligation, or personal records that simply should not be uploaded to a cloud service to have two pages removed.',
    difference:
      'Acrobat online is the browser front end to Adobe\'s cloud: your file is uploaded to Adobe Document Cloud, processed there, and delivered back, often tied to an Adobe identity. FilePilot has no cloud and no identity. The processing code runs in your tab, the file is read into local memory, and nothing is transmitted. That also means nothing to sign into, nothing stored under an account, and no subscription boundary between you and a basic operation.',
    table: [
      { aspect: 'Where your file is processed', competitor: 'Adobe Document Cloud, after upload', filepilot: 'In your browser, on your own device' },
      { aspect: 'Adobe account / sign-in', competitor: 'Required for many online tools', filepilot: 'Never' },
      { aspect: 'File leaves your device', competitor: 'Yes', filepilot: 'No' },
      { aspect: 'Subscription prompts', competitor: 'Free tools are limited; paid plans upsell', filepilot: 'None' },
      { aspect: 'Works offline', competitor: 'No', filepilot: 'Yes, once loaded' },
      { aspect: 'PDF standards fidelity', competitor: 'The reference implementation', filepilot: 'Good for everyday operations' },
      { aspect: 'OCR, redaction certification, PDF/A', competitor: 'Comprehensive', filepilot: 'Partial' },
      { aspect: 'Certificate-based digital signatures', competitor: 'Full support', filepilot: 'Visual signatures only' },
      { aspect: 'Cost', competitor: 'Limited free tier, then subscription', filepilot: 'Free' },
    ],
    limitations: [
      `${SHARED_LIMITATIONS_NOTE} For heavyweight documents, Adobe's infrastructure has resources a tab does not.`,
      'Adobe defines the PDF specification. For strict compliance work — PDF/A archival conformance, certified redaction, accessibility tagging — Acrobat is the correct tool and FilePilot is not a substitute.',
      'Acrobat supports certificate-based digital signatures with cryptographic validation. FilePilot places a visible signature on the page; it does not issue or validate signing certificates.',
      'Acrobat\'s OCR and its Word/Excel export are far more capable than anything currently possible client-side.',
      'If your organisation already runs on Adobe Document Cloud, the integration and audit trail are reasons to stay with it.',
    ],
    toolMap: [
      { task: 'Combine files', route: '/merge' },
      { task: 'Split a PDF', route: '/split' },
      { task: 'Compress PDF', route: '/compress' },
      { task: 'PDF to JPG', route: '/pdf-to-jpg' },
      { task: 'JPG to PDF', route: '/jpg-to-pdf' },
      { task: 'Fill and sign', route: '/form-filler' },
      { task: 'Reorder pages', route: '/organize-pdf' },
      { task: 'Redact text', route: '/redact-pdf' },
      { task: 'Flatten a form', route: '/flatten-pdf' },
      { task: 'Edit metadata', route: '/pdf-metadata' },
    ],
    faqs: [
      {
        question: 'Do I need an Adobe account to use FilePilot?',
        answer: 'No. FilePilot has no accounts at all — not Adobe\'s, not its own. Open a tool and use it. Nothing is stored, so there is nothing to log in to.',
      },
      {
        question: 'Can FilePilot replace Adobe Acrobat entirely?',
        answer: 'For everyday work — merging, splitting, compressing, converting, reordering, filling forms, redacting, adding a signature — yes. For compliance-grade work it cannot: PDF/A conformance, certified redaction, accessibility tagging and certificate-based digital signatures all need Acrobat.',
      },
      {
        question: 'Is FilePilot\'s signature legally valid?',
        answer: 'FilePilot places a visible signature image or drawn mark onto the page, which is what most everyday documents need. It does not apply a cryptographic certificate-based signature, so for processes that require a validated digital certificate you need Acrobat or a dedicated e-signature provider.',
      },
      {
        question: 'Why is FilePilot free when Acrobat charges?',
        answer: 'Because there is no server bill. Adobe pays to receive, store and process your document; that cost has to be recovered. FilePilot ships the processing code to your browser once and your own device does the work, so there is no per-file cost and nothing to meter.',
      },
      {
        question: 'Does FilePilot work with password-protected PDFs?',
        answer: 'You can open a PDF you have the password for and work with it locally, and manage protection with the PDF security tool. FilePilot cannot remove protection you are not entitled to remove.',
      },
    ],
  },

  '/pdf24-alternative': {
    competitor: 'PDF24',
    route: '/pdf24-alternative',
    title: 'PDF24 Alternative — Browser-Based, No Upload | FilePilot',
    description:
      'A free PDF24 alternative that processes files in your browser instead of on a server, with no desktop install. Compare PDF24 Tools, PDF24 Creator and FilePilot on where your file goes.',
    h1: 'A PDF24 Alternative That Runs in the Browser, Not on a Server',
    intro:
      'PDF24 is a genuinely generous free toolkit, and it is the fairest comparison on this list — because PDF24 already offers a local option. Its online tools at tools.pdf24.org upload your file to PDF24\'s servers; its Windows desktop application, PDF24 Creator, processes files locally and offline. FilePilot sits between the two: local processing like the desktop app, with nothing to install.',
    motivation:
      'People generally reach PDF24 for its breadth and its price. The reason to look further is usually one of two things. Either you want local processing but cannot or do not want to install desktop software — a locked-down work machine, a Mac or Linux box where PDF24 Creator is not an option, or simply a one-off job that does not justify an installer. Or you started with the online tools and then realised the file is being uploaded after all.',
    difference:
      'PDF24 is explicit about this in its own FAQ: files sent to the online tools are processed on a server and deleted within a stated period, and it points users who want local processing to the desktop Creator instead. So the choice PDF24 offers is "convenient but uploaded" or "local but installed". FilePilot removes that trade-off — the processing runs in the browser tab, so it is local like the Creator and needs no installation like the online tools.',
    table: [
      { aspect: 'Where your file is processed', competitor: 'Online tools: PDF24\'s servers. Creator: your PC', filepilot: 'Always in your browser, on your device' },
      { aspect: 'Installation required for local processing', competitor: 'Yes — PDF24 Creator', filepilot: 'No' },
      { aspect: 'Operating systems', competitor: 'Creator is Windows-only', filepilot: 'Any OS with a modern browser' },
      { aspect: 'File leaves your device', competitor: 'Online tools: yes. Creator: no', filepilot: 'No' },
      { aspect: 'Account required', competitor: 'No', filepilot: 'No' },
      { aspect: 'Works offline', competitor: 'Creator only', filepilot: 'Yes, once loaded' },
      { aspect: 'Tool breadth', competitor: 'Very broad', filepilot: 'Broad — 90+ PDF and image tools' },
      { aspect: 'Image tools', competitor: 'Limited', filepilot: 'Extensive, including AI background removal' },
      { aspect: 'Cost', competitor: 'Free', filepilot: 'Free' },
    ],
    limitations: [
      'If you are on Windows and happy to install software, PDF24 Creator is an excellent local tool with a virtual printer that FilePilot cannot match — printing to PDF from any application is something only an installed program can do.',
      `${SHARED_LIMITATIONS_NOTE} A desktop application can use far more memory than a browser tab, so PDF24 Creator will handle very large documents that FilePilot cannot.`,
      'PDF24\'s server-side OCR is more capable than browser-based recognition.',
      'PDF24 has been around far longer and has a broader install base and support history.',
    ],
    toolMap: [
      { task: 'Merge PDF', route: '/merge' },
      { task: 'Split PDF', route: '/split' },
      { task: 'Compress PDF', route: '/compress' },
      { task: 'Convert to PDF', route: '/images-to-pdf' },
      { task: 'PDF to images', route: '/pdf-to-images' },
      { task: 'Rotate pages', route: '/rotate-pdf' },
      { task: 'Remove pages', route: '/delete-pages' },
      { task: 'Protect a PDF', route: '/pdf-security' },
      { task: 'Add page numbers', route: '/page-numbers' },
      { task: 'Extract images', route: '/extract-images' },
    ],
    faqs: [
      {
        question: 'Do the PDF24 online tools upload my file?',
        answer: 'Yes. PDF24\'s own FAQ states that files sent to its online tools are processed on a server and automatically deleted within a stated period, and it directs users who want local processing to the PDF24 Creator desktop application instead. FilePilot processes in the browser, so nothing is uploaded either way.',
      },
      {
        question: 'How is FilePilot different from PDF24 Creator?',
        answer: 'Both process locally. The difference is installation and platform: PDF24 Creator is Windows software you install, while FilePilot is a web page that works on macOS, Linux, ChromeOS and phones as well. Creator can do things only installed software can — notably its virtual PDF printer — and can use more memory for very large files.',
      },
      {
        question: 'Is FilePilot free like PDF24?',
        answer: 'Yes, entirely free with no account, no watermarks and no task limits. Neither tool charges for everyday PDF operations.',
      },
      {
        question: 'Which should I use for a confidential document?',
        answer: 'Either FilePilot or PDF24 Creator, since both keep the file on your machine. Avoid the online tools of any service, including PDF24\'s, if the document must not be transmitted. FilePilot is the option that needs no installation.',
      },
      {
        question: 'Does FilePilot handle images as well as PDFs?',
        answer: 'Yes, and this is where the toolkits differ most. Alongside the PDF tools there are image tools for compressing, resizing, cropping, converting, stripping EXIF and GPS metadata, and AI background removal — all processed locally in the same way.',
      },
    ],
  },
};

export const comparisonRoutes = Object.keys(comparisonContent);
