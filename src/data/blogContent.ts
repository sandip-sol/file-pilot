import type { SiteFaq } from './siteContent.ts';

/**
 * Single source of truth for the blog (Phase 3).
 *
 * Posts used to be hand-written .tsx components whose prose the prerenderer
 * recovered with a regex over the JSX. That worked for three posts and would not
 * have survived twelve. Content now lives here as blocks: one renderer draws the
 * page, the prerenderer emits the same blocks as static HTML, and the two cannot
 * drift. The three original posts were migrated mechanically, so their wording is
 * unchanged.
 *
 * ── Cluster architecture (Phase 3.1) ────────────────────────────────────────
 *
 * Hub and spoke, built around the one keyword cluster nobody owns: processing
 * files without uploading them.
 *
 *   PILLAR   /blog/edit-pdf-without-uploading  — links to every spoke
 *   SPOKES   one per question people actually ask; each links back to the
 *            pillar and out to the tool that performs the task
 *
 * ── The cannibalisation rule ────────────────────────────────────────────────
 *
 * A post must NEVER target the same keyword as a tool page. `/pdf-to-cbz`
 * already targets "pdf to cbz" with HowTo schema; a post aiming at that term
 * would compete with it and split the signal. Tool pages own transactional
 * intent ("pdf to cbz", "resize image to 50kb"). Posts own informational intent
 * ("why does my form reject photos over 50KB", "why blacking out text doesn't
 * redact it") and hand the reader to the tool at the point of action.
 *
 * `primaryTool` is that handoff. Every post must set it.
 */

export type BlogBlock =
  | { type: 'p' | 'h2' | 'h3'; html: string }
  | { type: 'ul' | 'ol'; items: string[] }
  /** Pulled out visually — use for the one thing a skimmer must not miss. */
  | { type: 'callout'; html: string };

/**
 * Per-post artwork. Optional — when unset the post falls back to the shared
 * FilePilot card, which is honest but generic: one brand image cannot illustrate
 * twelve different articles, so it earns nothing in image search or in the
 * Discover visual slot. Setting this emits a per-post `ImageObject` carrying real
 * dimensions; no schema change is needed when the art arrives.
 *
 * Google asks for 1200px or wider and prefers 16:9, 4:3 or 1:1. Ship one crop
 * unless you have all three.
 */
export interface BlogImage {
  /** Site-root path, e.g. '/blog/redact-pdf-properly.png'. */
  src: string;
  width: number;
  height: number;
  /** Describes *this article's* image. A restated brand tagline is not a caption. */
  caption: string;
}

export interface BlogPost {
  route: string;
  title: string;
  description: string;
  h1: string;
  /**
   * Either a plain `YYYY-MM-DD` or a full ISO-8601 timestamp with an offset.
   * Prefer the timestamp: emitted as datePublished, and a whole archive stamped
   * to the day with no time component reads as a bulk import rather than a
   * publication. Rendered visibly as the day alone either way.
   *
   * These are the real commit times the posts landed at, not staggered dates —
   * nine of them genuinely shipped in one commit and inventing a spread would be
   * fabricating publication history.
   */
  published: string;
  /**
   * Same format. The last substantive revision: shown as "Updated …" and emitted
   * as dateModified. Set it only when the content actually changed — a bumped
   * date on untouched text is a stale-content signal, not a freshness one.
   */
  updated?: string;
  /** Falls back to the shared OG card when unset. See {@link BlogImage}. */
  image?: BlogImage;
  readTime: string;
  /** 'pillar' | 'privacy' | 'how-to' | 'pillar-adjacent' — for the cluster index. */
  cluster: string;
  /** The tool page this article should send readers to. Required. */
  primaryTool: string;
  related: string[];
  blocks: BlogBlock[];
  faqs?: SiteFaq[];
}

export const blogPosts: Record<string, BlogPost> = {
  // ── PILLAR ────────────────────────────────────────────────────────────────
  '/blog/edit-pdf-without-uploading': {
    route: '/blog/edit-pdf-without-uploading',
    title: 'How to Edit a PDF Without Uploading It Anywhere | FilePilot',
    description: 'A complete guide to working with PDFs without sending them to a server: what actually happens when you upload, which tasks can run locally in a browser, which still cannot, and how to verify any tool\'s claim yourself.',
    h1: 'How to Edit a PDF Without Uploading It Anywhere',
    published: '2026-08-22T18:54:59+05:30',
    readTime: '9 min read',
    cluster: 'pillar',
    primaryTool: '/pdf-tools',
    related: [
      '/blog/is-it-safe-to-upload-pdf-online',
      '/blog/redact-pdf-properly',
      '/blog/compress-pdf-without-losing-quality',
      '/blog/combine-scanned-pages-into-one-pdf',
      '/pdf-tools',
    ],
    blocks: [
      { type: 'p', html: 'There is a specific moment most people recognise. You need to remove two pages from a PDF, or shrink it below an upload limit, or sign it. You search, you find a free online tool, you drag the file in — and somewhere between dropping it and clicking the button, you notice what the document actually is. A contract. A payslip. A scan of your passport. And you are about to hand a copy of it to a company you had not heard of ninety seconds ago.' },
      { type: 'p', html: 'Usually you do it anyway, because the alternative is buying Acrobat. This guide is about the third option: doing the same work without the file ever leaving your device.' },
      { type: 'h2', html: 'What "upload" actually means' },
      { type: 'p', html: 'When you use a typical online PDF tool, your file is transmitted over the network to that company\'s servers, written into memory or onto disk there, processed by software you cannot inspect, and then a result is sent back. Afterwards the original is deleted according to a policy — Smallpdf and PDF24 state roughly an hour, iLovePDF states two.' },
      { type: 'p', html: 'None of that is sinister. These are real companies with real security teams, and they publish those policies openly. But it is worth being precise about what the policy is: a promise about what happens to a copy of your document that now exists on infrastructure you do not control. Promises can be kept perfectly and still fail you, because a promise cannot protect against a misconfigured storage bucket, a compromised employee account, a subpoena, or an acquisition that changes who owns the servers.' },
      { type: 'callout', html: 'The useful question is not "is this company trustworthy?" It is "does this task require a copy of my document to exist anywhere except my laptop?" For most PDF work, the answer is no.' },
      { type: 'h2', html: 'Why local processing became possible' },
      { type: 'p', html: 'For a long time server-side was the only practical option. Browsers were too slow to parse and rewrite a PDF, and JavaScript was the only language available. Both of those changed.' },
      { type: 'p', html: '<strong>WebAssembly</strong> lets a browser run compiled code at close to native speed. Libraries that previously had to live on a server — PDF engines, image codecs, OCR — can now be compiled and shipped to the browser as part of a web page. The code is sandboxed: it cannot read your file system or reach other tabs, only the data you hand it.' },
      { type: 'p', html: 'The <strong>Canvas API</strong> handles pixel work — rendering a PDF page to an image, cropping, resizing, re-encoding — using your GPU. <strong>Web Workers</strong> run the heavy jobs on background threads so the page does not freeze while a 200-page document is rewritten.' },
      { type: 'p', html: 'Put together, that is enough to do most everyday PDF work entirely inside a browser tab, with the network uninvolved after the page has loaded.' },
      { type: 'h2', html: 'What you can do locally today' },
      { type: 'p', html: 'These all work fully client-side, and each links to the tool that does it:' },
      { type: 'ul', items: [
        '<strong>Combining and splitting</strong> — <a href="/merge">merge PDFs</a>, <a href="/split">split a PDF</a>, <a href="/extract-pages">extract pages</a>, <a href="/delete-pages">delete pages</a>, <a href="/organize-pdf">reorder pages</a>.',
        '<strong>Making files smaller</strong> — <a href="/compress">compress a PDF</a>, or <a href="/pdf-to-greyscale">convert it to greyscale</a> when colour is not needed.',
        '<strong>Converting</strong> — <a href="/pdf-to-images">PDF to images</a>, <a href="/images-to-pdf">images to PDF</a>, <a href="/extract-text">extract the text</a>, <a href="/pdf-to-cbz">PDF to CBZ</a>.',
        '<strong>Marking up</strong> — <a href="/annotate-pdf">annotate</a>, <a href="/sign-pdf">sign</a>, <a href="/watermark-pdf">watermark</a>, <a href="/page-numbers">add page numbers</a>, <a href="/add-stamp">stamp</a>.',
        '<strong>Removing information</strong> — <a href="/redact-pdf">redact text</a>, <a href="/remove-metadata">strip PDF metadata</a>, <a href="/flatten-pdf">flatten forms and annotations</a>.',
        '<strong>Layout and print</strong> — <a href="/n-up-pdf">several pages per sheet</a>, <a href="/pdf-booklet">booklet imposition</a>, <a href="/posterize-pdf">poster tiling</a>, <a href="/fix-page-size">fix page size</a>.',
      ] },
      { type: 'h2', html: 'What still genuinely needs a server' },
      { type: 'p', html: 'Anyone claiming a browser can do everything is overselling. Four things remain meaningfully better server-side, and it is worth knowing which:' },
      { type: 'ul', items: [
        '<strong>Very large files.</strong> A browser tab gets a memory budget. A 500 MB scanned archive that a server handles comfortably can exhaust it.',
        '<strong>Heavy OCR.</strong> Local OCR is real — <a href="/extract-text">it works</a> — but the engines Adobe and Smallpdf run server-side are more accurate on poor scans and much faster in bulk.',
        '<strong>Office-format fidelity.</strong> Producing a well-formatted .docx or .xlsx from a PDF depends on conversion engines with no full client-side equivalent. Extracting the text works; reproducing the layout does not.',
        '<strong>Certificate-based digital signatures.</strong> Placing a visible signature is easy locally. Issuing or validating a cryptographic signing certificate is a different problem and needs proper tooling.',
      ] },
      { type: 'p', html: 'If your task is on that list, use a server-based tool deliberately and knowingly. That is a reasonable trade — it is only a bad one when it is made for you by default.' },
      { type: 'h2', html: 'How to check whether a tool really is local' },
      { type: 'p', html: 'Any site can write "100% secure" on its homepage. The claim is worth nothing unless you can test it, and the good news is that you can, in under a minute.' },
      { type: 'ol', items: [
        'Open your browser\'s developer tools and switch to the <strong>Network</strong> tab.',
        'Load the tool page, then clear the network log.',
        'Select your file and run the operation.',
        'Watch what appears. If the file is being uploaded you will see a request — usually a POST — whose size is roughly the size of your document. If processing is local, you will see nothing of the sort.',
      ] },
      { type: 'p', html: 'A second test is even simpler: load the page, disconnect from the internet, and try to use it. Genuinely local tools keep working because the code is already in your browser. Server-based ones cannot.' },
      { type: 'p', html: 'A third signal, for the technically inclined: check the response headers for a <code>Content-Security-Policy</code>. A site that sends <code>connect-src \'self\'</code> has instructed your browser to refuse network requests to any other host — which means even a bug could not quietly ship your file somewhere.' },
      { type: 'h2', html: 'Going deeper' },
      { type: 'p', html: 'Each of these takes one part of the problem and works through it properly.' },
      { type: 'ul', items: [
        '<a href="/blog/is-it-safe-to-upload-pdf-online">Is it safe to upload a PDF to an online tool?</a> — what the deletion policies actually promise, and how to decide for a specific document.',
        '<a href="/blog/redact-pdf-properly">Why blacking out text does not redact it</a> — the mistake that has embarrassed governments and law firms, and how to remove text rather than hide it.',
        '<a href="/blog/compress-pdf-without-losing-quality">Compressing without wrecking the quality</a> — what is actually taking the space, and the order of operations that keeps text readable.',
        '<a href="/blog/combine-scanned-pages-into-one-pdf">Combining scanned pages into one PDF</a> — page order, deskewing, and getting the file small enough to email.',
        '<a href="/blog/print-multiple-pdf-pages-per-sheet">N-up, booklets and posters</a> — three different operations that print dialogs handle badly.',
        '<a href="/blog/resize-image-for-online-forms">Why online forms reject your photo</a> — the four checks a portal runs, and the order that satisfies all of them.',
        '<a href="/blog/what-exif-data-reveals">What EXIF data reveals about your photos</a> — GPS coordinates, timestamps and the embedded thumbnail problem.',
        '<a href="/blog/pdf-comics-to-cbz">PDF or CBZ for comics?</a> — when converting helps, and when it costs you a text layer.',
        '<a href="/blog/why-files-stay-in-browser">Why your files should never leave your browser</a> — the underlying argument in full.',
        '<a href="/blog/privacy-risks-online-pdf-tools">The hidden privacy risks of online PDF tools</a> — what happens behind the scenes on an upload.',
        '<a href="/blog/how-filepilot-keeps-documents-private">How FilePilot keeps documents private</a> — the architecture, in detail.',
      ] },
      { type: 'h2', html: 'The short version' },
      { type: 'p', html: 'Most PDF work does not require anyone else\'s computer. Where it genuinely does — huge files, serious OCR, Office conversion, certificate signing — use a server tool on purpose. Everywhere else, keep the document where it already is, and pick tools that let you verify that rather than asking you to believe it.' },
      { type: 'p', html: 'FilePilot\'s <a href="/pdf-tools">PDF tools</a> and <a href="/image-tools">image tools</a> all run locally. So does the <a href="/about">explanation of how</a>, including where they fall short.' },
    ],
    faqs: [
      { question: 'Can you really edit a PDF without uploading it?', answer: 'Yes, for most tasks. Merging, splitting, compressing, converting, reordering, redacting, signing and watermarking can all run in a browser using WebAssembly and the Canvas API. Heavy OCR, very large files, faithful Office-format conversion and certificate-based digital signatures still work better server-side.' },
      { question: 'How do I know a tool is not secretly uploading my file?', answer: 'Open your browser\'s developer tools, go to the Network tab, and run the tool. An upload shows as a request roughly the size of your document. You can also load the page, disconnect from the internet, and see whether the tool still works — local ones do.' },
      { question: 'Is offline PDF editing less capable than Acrobat?', answer: 'For everyday operations, no. For compliance work — PDF/A conformance, certified redaction, accessibility tagging, certificate-based signatures — Acrobat remains the correct tool and browser-based editors are not a substitute.' },
      { question: 'Do browser-based PDF tools work on a phone?', answer: 'Yes, though the memory limits are tighter than on a laptop, so very large documents are more likely to fail. The processing still happens on the device rather than on a server.' },
    ],
  },

  '/blog/why-files-stay-in-browser': {
    route: '/blog/why-files-stay-in-browser',
    title: 'Why Your Files Should Never Leave Your Browser | FilePilot',
    description: 'Uploading files to remote servers introduces privacy risks, data breaches, and unclear retention policies. Learn how browser-based processing with WebAssembly and Web Workers keeps your documents private.',
    h1: 'Why Your Files Should Never Leave Your Browser',
    published: '2026-06-26T18:32:21+05:30',
    updated: '2026-08-22T18:54:59+05:30',
    readTime: '5 min read',
    cluster: 'pillar-adjacent',
    primaryTool: '/pdf-tools',
    related: ['/blog/edit-pdf-without-uploading', '/blog/privacy-risks-online-pdf-tools', '/blog/how-filepilot-keeps-documents-private', '/privacy'],
    blocks: [
    { type: 'p', html: 'Most people never think twice about uploading a document to an online tool. You drag a file into a web page, click a button, and get a result back. It feels instantaneous and harmless. But between the moment your file leaves your device and the moment a processed version returns, something important happens: your data travels to a server you do not control, gets stored in memory you cannot inspect, and is handled by code you have no way to audit.' },
    { type: 'p', html: 'For a vacation photo or a recipe PDF, the stakes may be low. But consider the documents people routinely process with online tools: tax returns, medical records, legal contracts, identity documents, internal business reports. The convenience of cloud-based processing comes at a cost that most users never see.' },
    { type: 'h2', html: 'The Risks of Uploading Files to Servers' },
    { type: 'p', html: 'When you upload a file to a server-based tool, several things can go wrong, and you may never know about any of them.' },
    { type: 'p', html: '<strong>Data breaches are not hypothetical.</strong> Servers that store user files are attractive targets for attackers. Even companies with large security budgets have suffered breaches that exposed millions of user documents. If a service stores your file, even temporarily, it becomes part of that service\'s attack surface. A vulnerability in their infrastructure, a misconfigured storage bucket, or a compromised employee account could expose your data.' },
    { type: 'p', html: '<strong>Third-party access is often invisible.</strong> Many online tools rely on cloud infrastructure providers, subprocessors, and analytics services. Your file may pass through multiple systems before the result reaches you. Each intermediary adds another point where your data could be logged, cached, or retained. Privacy policies rarely enumerate every party that touches your data along the way.' },
    { type: 'p', html: '<strong>Retention policies are vague.</strong> When a service says files are "deleted after processing," what does that actually mean? Are they deleted from memory, from disk, from backups? How quickly? Are there audit logs that preserve metadata about your file even after the content is removed? In practice, "deleted" is a spectrum, and users are rarely told where on that spectrum their data falls.' },
    { type: 'h2', html: 'How Browser-Based Processing Works' },
    { type: 'p', html: 'Browser-based file processing takes a fundamentally different approach. Instead of sending your file to a server, the tool runs directly in your browser using the same computing power that renders web pages. Your file never leaves your device.' },
    { type: 'p', html: 'Three technologies make this possible at production quality.' },
    { type: 'p', html: '<strong>WebAssembly (Wasm)</strong> allows browsers to execute compiled code at near-native speed. Libraries that were traditionally server-side, such as PDF manipulation engines and image codecs, can now run entirely in the browser. WebAssembly code is sandboxed by the browser, which means it cannot access your file system, network, or other tabs. It operates only on the data you explicitly provide.' },
    { type: 'p', html: '<strong>The Canvas API</strong> provides a drawing surface for rendering and manipulating images and document pages. It handles pixel-level operations such as cropping, scaling, format conversion, and compositing without any server involvement. The rendering happens in GPU- accelerated memory on your machine.' },
    { type: 'p', html: '<strong>Web Workers</strong> enable heavy processing to run in background threads so the browser remains responsive. A PDF merge or image compression operation can execute in a worker thread without freezing the user interface. Workers run in an isolated context with no direct access to the DOM, which adds another layer of separation.' },
    { type: 'h2', html: 'Why Client-Side Processing Is Better' },
    { type: 'p', html: 'Privacy is the most obvious advantage, but it is not the only one.' },
    { type: 'p', html: '<strong>Speed.</strong> Uploading a 50 MB PDF to a server, waiting for it to process, and downloading the result takes time that scales with your internet connection. Browser-based processing eliminates the upload and download steps entirely. The bottleneck becomes your device\'s CPU and memory, which for modern machines means the operation completes in seconds.' },
    { type: 'p', html: '<strong>Offline capability.</strong> Because processing happens locally, many browser-based tools work without an internet connection. Once the application code is cached by the browser or installed as a Progressive Web App, you can process files on a plane, in a remote office, or anywhere with limited connectivity.' },
    { type: 'p', html: '<strong>Zero trust required.</strong> With server-based tools, you have to trust the company, their employees, their infrastructure providers, and their security practices. With browser-based tools, trust is not required because your data never leaves your control. You can verify this with browser developer tools: open the Network tab and confirm that no file data is transmitted during processing.' },
    { type: 'p', html: '<strong>No accounts or sign-ups.</strong> Because there is no server processing, there is no reason to create an account. No email collection, no usage tracking tied to an identity, no subscription paywalls gating basic functionality behind data collection.' },
    { type: 'h2', html: 'The Standard Should Be Higher' },
    { type: 'p', html: 'For years, server-based processing was the only practical option for complex file operations in a browser. WebAssembly changed that. The technology exists today to merge PDFs, compress images, convert formats, redact sensitive content, and perform dozens of other file operations without ever transmitting your data.' },
    { type: 'p', html: 'The question is no longer whether browser-based processing is possible. It is. The question is why so many tools still require you to upload your files to a server when they no longer need to.' },
    { type: 'p', html: 'Your files contain information about your finances, your health, your work, and your identity. They deserve to stay on your device unless you make an informed, deliberate choice to share them. Browser-based processing makes that the default.' },
    ],
  },

  '/blog/privacy-risks-online-pdf-tools': {
    route: '/blog/privacy-risks-online-pdf-tools',
    title: 'The Hidden Privacy Risks of Online PDF Tools | FilePilot',
    description: 'What really happens when you upload a PDF to an online tool: server storage, metadata exposure, third-party processing, and how to evaluate whether a tool is truly private.',
    h1: 'The Hidden Privacy Risks of Online PDF Tools',
    published: '2026-06-26T18:32:21+05:30',
    updated: '2026-08-22T18:54:59+05:30',
    readTime: '5 min read',
    cluster: 'privacy',
    primaryTool: '/pdf-tools',
    related: ['/blog/edit-pdf-without-uploading', '/blog/why-files-stay-in-browser', '/smallpdf-alternative', '/privacy'],
    blocks: [
    { type: 'p', html: 'PDFs are the universal document format. They carry contracts, bank statements, medical records, resumes, tax forms, and business proposals. When you need to merge, split, compress, or convert a PDF, the fastest path is usually an online tool. You search, click the first result, upload your file, and download the output. The whole interaction takes thirty seconds.' },
    { type: 'p', html: 'But in those thirty seconds, your document may have been copied to a server in a jurisdiction you did not choose, processed by software you cannot inspect, and retained for a duration you were never told about. The convenience is real. So are the risks.' },
    { type: 'h2', html: 'What Happens When You Upload a PDF' },
    { type: 'p', html: 'When you select a file and click "upload" on a server-based PDF tool, the following typically occurs.' },
    { type: 'p', html: '<strong>Your file is transmitted to a remote server.</strong> The PDF leaves your device and travels over the internet to a data center. Even if the connection uses HTTPS, the file exists in unencrypted form on the server during processing. Anyone with access to that server, whether an employee, a contractor, or an attacker who gains access, can potentially read your document.' },
    { type: 'p', html: '<strong>Metadata is exposed along with content.</strong> A PDF carries more than visible text. It contains metadata fields such as author name, creation software, revision history, GPS coordinates from scanned documents, and embedded fonts that reveal the operating system used. When you upload a PDF, all of this metadata arrives with it. Even if the service claims to process only the document content, the metadata is available for extraction.' },
    { type: 'p', html: '<strong>Third-party processing is common.</strong> Many online PDF tools do not run their own infrastructure. They rely on cloud computing platforms, content delivery networks, and sometimes other API services to perform the actual processing. Your document may be transmitted to multiple systems during a single operation. Each system has its own data handling practices, logging policies, and security posture.' },
    { type: 'p', html: '<strong>Temporary storage is not always temporary.</strong> Services often state that uploaded files are deleted after a set period, commonly one hour or twenty-four hours. However, "deletion" from a server does not necessarily mean the data is gone. It may persist in backups, in memory caches, in log files, or in monitoring systems. Without transparent, auditable deletion processes, users have no way to verify that their files are actually removed.' },
    { type: 'h2', html: 'Real-World Consequences' },
    { type: 'p', html: 'The risks described above are not theoretical. There have been documented cases of online document processing services experiencing data exposures that affected millions of users.' },
    { type: 'p', html: 'In some incidents, misconfigured cloud storage buckets left processed documents publicly accessible on the internet. Anyone with the right URL could download files that users believed had been deleted. In other cases, security researchers discovered that uploaded documents were indexed by search engines because the download links used predictable URL patterns.' },
    { type: 'p', html: 'There have also been cases where free online tools monetized user data in ways that were buried deep in their terms of service. Some services reserved the right to use uploaded content for training machine learning models. Others shared aggregated usage data, including document metadata, with advertising partners.' },
    { type: 'p', html: 'The pattern is consistent: when a file leaves your device, you lose control over what happens to it. The service\'s privacy policy becomes the only thing standing between your data and misuse, and privacy policies are written to protect the company, not the user.' },
    { type: 'h2', html: 'How to Evaluate Whether a Tool Is Truly Private' },
    { type: 'p', html: 'Not all online tools handle your data the same way. Some are genuinely careful about privacy. Others use privacy as a marketing claim without the architecture to back it up. Here is how to tell the difference.' },
    { type: 'p', html: '<strong>Check the network traffic.</strong> Open your browser\'s developer tools and switch to the Network tab before using the tool. If your file is processed client-side, you should see no large outbound requests during processing. If the tool uploads your file to a server, you will see a POST request with a payload matching your file size.' },
    { type: 'p', html: '<strong>Read the privacy policy carefully.</strong> Look for specific language about data retention, third-party processors, and jurisdiction. Vague statements like "we take your privacy seriously" mean nothing without specifics. A trustworthy policy will state exactly what data is collected, how long it is kept, and who has access.' },
    { type: 'p', html: '<strong>Test offline functionality.</strong> Disconnect from the internet and try to use the tool. If it works offline, processing is happening locally. If it fails, your files are being sent to a server.' },
    { type: 'p', html: '<strong>Look at the technology.</strong> Tools that process files in the browser typically mention WebAssembly, client-side processing, or JavaScript-based engines. Tools that rely on server processing will reference APIs, cloud infrastructure, or processing queues.' },
    { type: 'h2', html: 'A Checklist for Choosing Safe File Tools' },
    { type: 'p', html: 'Before you use any online file tool for sensitive documents, run through this checklist.' },
    { type: 'ul', items: ['Does the tool process files in the browser, or does it upload them to a server?', 'Can you verify the processing model by checking network traffic in developer tools?', 'Does the tool work offline or in airplane mode?', 'Does the privacy policy specify exact retention periods and deletion methods?', 'Does the tool require an account, and if so, what data does the account collect?', 'Is the tool open source or otherwise auditable?', 'Does the tool use third-party processors, and are they disclosed?', 'Does the service reserve rights to use your uploaded content for any purpose beyond processing?'] },
    { type: 'p', html: 'If a tool fails more than one or two of these checks, think carefully before uploading anything sensitive. The convenience of a quick file conversion is not worth the risk of exposing a tax return, a medical record, or a confidential business document.' },
    { type: 'h2', html: 'A Better Model Exists' },
    { type: 'p', html: 'The assumption that file processing requires a server is outdated. Modern browsers are capable of running complex operations, including PDF manipulation, image conversion, text extraction, and even AI-powered analysis, entirely on your device using technologies like WebAssembly and Web Workers.' },
    { type: 'p', html: 'Tools built on this model do not need to collect your data because they never receive it. They do not need retention policies because there is nothing to retain. They do not need to earn your trust because your files never leave your control.' },
    { type: 'p', html: 'The next time you need to process a PDF, ask yourself: does this tool need my file, or does it just need to run some code? If the answer is the latter, there is no reason your file should ever leave your browser.' },
    ],
  },

  '/blog/how-filepilot-keeps-documents-private': {
    route: '/blog/how-filepilot-keeps-documents-private',
    title: 'How FilePilot Keeps Your Documents Private | FilePilot',
    description: 'A practical look at FilePilot\'s privacy architecture: WebAssembly with pdf-lib, Canvas API rendering, ONNX Runtime for AI features, PWA offline support, and zero server involvement.',
    h1: 'How FilePilot Keeps Your Documents Private',
    published: '2026-06-26T18:32:21+05:30',
    updated: '2026-08-22T18:54:59+05:30',
    readTime: '5 min read',
    cluster: 'privacy',
    primaryTool: '/pdf-tools',
    related: ['/blog/edit-pdf-without-uploading', '/about', '/blog/why-files-stay-in-browser', '/privacy'],
    blocks: [
    { type: 'p', html: 'Privacy claims are easy to make. Every file processing tool on the internet says it takes privacy seriously. Few explain exactly how their architecture enforces that claim. This article describes, in concrete technical detail, how FilePilot processes your files without ever transmitting them to a server.' },
    { type: 'p', html: 'The core principle is simple: if your data never leaves your device, there is nothing to breach, nothing to subpoena, and nothing to misuse. FilePilot is built around that principle at every layer of its architecture.' },
    { type: 'h2', html: 'No Server. Period.' },
    { type: 'p', html: 'FilePilot is a static web application. It consists of HTML, CSS, JavaScript, and WebAssembly files that are downloaded to your browser when you visit the site. Once loaded, the application runs entirely on your device. There is no backend server processing file operations, no API endpoints receiving your documents, and no database storing your uploads.' },
    { type: 'p', html: 'When you select a file in FilePilot, it is read into your browser\'s memory using the File API. It stays in memory during processing and is provided back to you as a download via a Blob URL. At no point does the file, or any part of it, leave your browser\'s sandbox.' },
    { type: 'p', html: 'You can verify this yourself. Open your browser\'s developer tools, switch to the Network tab, and process any file. You will not see a single outbound request carrying file data. The only network requests are for static application assets like JavaScript bundles and fonts.' },
    { type: 'h2', html: 'WebAssembly and pdf-lib for PDF Processing' },
    { type: 'p', html: 'PDF operations, such as merging, splitting, compressing, adding watermarks, extracting text, and editing metadata, are handled by pdf-lib, a JavaScript library that manipulates PDF structures directly. For operations that require lower-level processing, FilePilot uses WebAssembly modules compiled from established open-source libraries.' },
    { type: 'p', html: 'WebAssembly runs in a sandboxed environment within the browser. It cannot access the file system, the network, or other browser tabs. It operates only on the data explicitly passed to it by the application. This means that even if a WebAssembly module contained malicious code, it would be confined to the data you provided and could not exfiltrate it.' },
    { type: 'p', html: 'The result is server-grade PDF processing running at near-native speed, entirely within the security boundary of your browser. Merge a hundred-page document, compress a 50 MB file, or redact sensitive text, and the operation completes locally in seconds.' },
    { type: 'h2', html: 'Canvas API for Rendering and Image Operations' },
    { type: 'p', html: 'When FilePilot needs to render PDF pages as images, convert between image formats, crop, resize, or apply visual transformations, it uses the browser\'s Canvas API. The Canvas API provides a programmable drawing surface backed by GPU acceleration on most devices.' },
    { type: 'p', html: 'Image data rendered to a canvas stays in browser memory. Converting a PDF page to a PNG, for example, involves rendering the page to an offscreen canvas and then exporting the pixel data as an image file. The entire pipeline, from PDF parsing to pixel rendering to file encoding, happens without any network involvement.' },
    { type: 'p', html: 'This approach also powers FilePilot\'s image editing tools: cropping, watermarking, format conversion, compression, and background removal all operate on canvas pixel data that never leaves your device.' },
    { type: 'h2', html: 'ONNX Runtime for AI Features' },
    { type: 'p', html: 'FilePilot includes AI-powered features such as background removal, image upscaling, and document analysis. These features use machine learning models that run locally in your browser via ONNX Runtime Web.' },
    { type: 'p', html: 'ONNX Runtime Web executes neural network models using WebAssembly and, where available, WebGL or WebGPU for hardware acceleration. The models are downloaded as static files when you first use an AI feature and are cached by your browser for future use. Inference runs entirely on your device.' },
    { type: 'p', html: 'This is a critical distinction. Many tools that advertise "AI-powered" features send your files to a cloud-based AI service for processing. Your document is transmitted to a remote GPU, processed, and the result is returned. FilePilot\'s approach eliminates this round trip. The AI model runs on your hardware, and your data stays on your device.' },
    { type: 'h2', html: 'PWA and Offline Support' },
    { type: 'p', html: 'FilePilot is a Progressive Web App (PWA). You can install it on your device and use it without an internet connection. Once installed, the application code, WebAssembly modules, and AI models are cached locally. You can process files on an airplane, in a secure facility with no network access, or anywhere else where connectivity is unavailable or untrusted.' },
    { type: 'p', html: 'Offline capability is not just a convenience feature. It is proof of architecture. A tool that works without the internet, by definition, cannot be sending your files to a server. If FilePilot required a network connection to process files, it would mean data was leaving your device. The fact that it works offline is a verifiable guarantee that processing is local.' },
    { type: 'h2', html: 'No Analytics That Track File Content' },
    { type: 'p', html: 'FilePilot does not use analytics services that track what you do with your files. There is no logging of file names, file sizes, page counts, or content. There are no session recordings, no heatmaps, and no behavioral tracking tied to your document processing activity.' },
    { type: 'p', html: 'Many online tools embed analytics scripts that record detailed user interactions, including which files are processed, how large they are, and how often the tool is used. Even when analytics do not capture file content directly, the metadata they collect can reveal sensitive information about user behavior and document types. FilePilot avoids this entirely.' },
    { type: 'h2', html: 'No Accounts' },
    { type: 'p', html: 'FilePilot does not require you to create an account. There is no sign-up form, no email collection, no OAuth flow, and no user database. You visit the site and use the tools.' },
    { type: 'p', html: 'Accounts exist to associate data with identity. When a tool requires an account, it can link your processing history, your files, and your usage patterns to a persistent identity. FilePilot has no reason to identify you because it has no server-side data to associate with an identity. Every session is stateless from the application\'s perspective.' },
    { type: 'h2', html: 'Transparency by Design' },
    { type: 'p', html: 'The architecture described in this article is not a set of policies that FilePilot promises to follow. It is a set of technical constraints that make privacy violations structurally impossible. There is no server to breach because there is no server. There is no data to retain because no data is collected. There is no third-party access because no third parties are involved in processing.' },
    { type: 'p', html: 'If you want to learn more about FilePilot\'s privacy commitments, visit the <a href="/privacy">privacy policy</a> . If you want to verify the claims in this article, open your browser\'s developer tools and see for yourself. The Network tab does not lie.' },
    ],
  },

  // ── SPOKES ────────────────────────────────────────────────────────────────
  '/blog/is-it-safe-to-upload-pdf-online': {
    route: '/blog/is-it-safe-to-upload-pdf-online',
    title: 'Is It Safe to Upload a PDF to an Online Tool? | FilePilot',
    description: 'What happens to your document when you upload it to a free PDF site, what the deletion policies actually promise, when the risk is acceptable, and how to decide for a specific file.',
    h1: 'Is It Safe to Upload a PDF to an Online Tool?',
    published: '2026-08-22T18:54:59+05:30',
    readTime: '7 min read',
    cluster: 'privacy',
    primaryTool: '/pdf-tools',
    related: ['/blog/edit-pdf-without-uploading', '/smallpdf-alternative', '/ilovepdf-alternative', '/privacy'],
    blocks: [
      { type: 'p', html: 'The honest answer is: usually, and it depends entirely on the document. That is less satisfying than a yes or a no, but "is it safe" is the wrong shape of question. What you actually want to know is what happens to this particular file, and whether that is acceptable for this particular file.' },
      { type: 'h2', html: 'What happens when you upload' },
      { type: 'p', html: 'Your document is transmitted over the network to the service\'s servers. It is written into memory, and usually onto disk, because processing a large PDF from a stream is harder than processing it from a file. Software you cannot inspect operates on it. A result is generated and sent back. Then, according to the service\'s policy, the original and the result are deleted.' },
      { type: 'p', html: 'The major services publish these policies plainly. Smallpdf and PDF24 both state that processed files are removed within about an hour; iLovePDF states two hours. E-signature flows are the exception — signed documents and audit trails are retained far longer, sometimes for years, because legal validity requires it.' },
      { type: 'h2', html: 'What those policies do and do not cover' },
      { type: 'p', html: 'A deletion policy is a commitment about ordinary operation. It is a real commitment and these companies generally honour it. What it cannot cover is everything that is not ordinary operation:' },
      { type: 'ul', items: [
        '<strong>Breaches.</strong> A store of user documents is an attractive target. Companies with substantial security budgets have still had incidents.',
        '<strong>Subprocessors.</strong> Most services run on cloud infrastructure and use third-party components. Your file may pass through several systems, each with its own logging and caching behaviour.',
        '<strong>Legal process.</strong> While a copy exists, it can in principle be compelled. After it is deleted, it cannot.',
        '<strong>Change of ownership.</strong> Policies are set by whoever owns the company today. Acquisitions happen.',
        '<strong>Ambiguity in "deleted".</strong> Removed from disk? From backups? From logs that recorded the filename and size? Policies rarely say.',
      ] },
      { type: 'callout', html: 'None of this means these tools are dangerous. It means the risk is small but non-zero and, crucially, outside your control — which matters differently depending on what is in the file.' },
      { type: 'h2', html: 'A practical way to decide' },
      { type: 'p', html: 'Rather than a blanket rule, ask what would happen if this exact document appeared somewhere public. For most files the answer is "nothing much", and uploading is completely reasonable. Be more careful when the document contains:' },
      { type: 'ul', items: [
        'Government identity documents — passports, driving licences, national ID cards, visa paperwork.',
        'Financial records — bank statements, tax returns, payslips, invoices with account details.',
        'Medical information about you or anyone else.',
        'Signed contracts, especially with a confidentiality clause — which may make uploading a breach of the agreement itself.',
        'Anything belonging to an employer or client, where the decision to share it is not yours to make.',
        'Other people\'s personal data, where a leak affects someone who never agreed to the upload.',
      ] },
      { type: 'p', html: 'That last category is the one people most often miss. Uploading a spreadsheet of customer records to convert it is a decision made on behalf of everyone in it.' },
      { type: 'h2', html: 'The option that removes the question' },
      { type: 'p', html: 'For most everyday tasks the upload is not technically necessary. Browsers can now run compiled PDF engines through WebAssembly, so merging, splitting, compressing, converting, redacting and signing can happen on your own device with the network uninvolved.' },
      { type: 'p', html: 'When processing is local there is no retention policy to evaluate, because there is no copy to retain. That is a structural difference rather than a stronger promise — and unlike a promise, you can <a href="/blog/edit-pdf-without-uploading">verify it in about a minute</a> using your browser\'s Network tab.' },
      { type: 'p', html: 'FilePilot works this way. If you want the comparison stated plainly, including where the server-based services are genuinely better, see the <a href="/smallpdf-alternative">Smallpdf</a> and <a href="/ilovepdf-alternative">iLovePDF</a> write-ups.' },
      { type: 'h2', html: 'If you do upload' },
      { type: 'ol', items: [
        'Read what the service says about retention before uploading, not after.',
        'Prefer services that document deletion explicitly over ones that only say "secure".',
        'Delete the file manually if the tool offers it — several do, and it is faster than waiting for the timer.',
        'Remove the document\'s <a href="/pdf-metadata">metadata</a> first if it carries author names, software details or file paths you would rather not share.',
        'Avoid uploading anything covered by an obligation to someone else.',
      ] },
    ],
    faqs: [
      { question: 'Are free online PDF tools safe?', answer: 'For ordinary documents, generally yes. The major services publish deletion policies and honour them. The residual risk is that a copy of your file exists on infrastructure you do not control for a period, which matters more for identity documents, financial and medical records, and anything under a confidentiality obligation.' },
      { question: 'How long do PDF sites keep my file?', answer: 'It varies and it changes, so check the current policy rather than trusting a number from an article. As of writing, Smallpdf and PDF24 state around an hour and iLovePDF states two. E-signature workflows retain signed documents and audit trails for much longer for legal reasons.' },
      { question: 'Can I avoid uploading entirely?', answer: 'For most tasks, yes. Browser-based tools compile the PDF engine to WebAssembly and run it on your device, so nothing is transmitted. Heavy OCR, very large files and faithful Office conversion still work better on a server.' },
      { question: 'Is it illegal to upload work documents to a free PDF tool?', answer: 'Not illegal in itself, but it can breach a confidentiality agreement or an employer policy, which is a real risk to you personally. If the document is not yours to share, process it locally instead.' },
    ],
  },

  '/blog/redact-pdf-properly': {
    route: '/blog/redact-pdf-properly',
    title: 'Why Blacking Out Text in a PDF Does Not Redact It | FilePilot',
    description: 'Drawing a black rectangle over text leaves the text in the file, fully selectable and searchable. How PDF redaction actually fails, the cases where it went public, and how to remove text rather than hide it.',
    h1: 'Why Blacking Out Text in a PDF Does Not Redact It',
    published: '2026-08-22T18:54:59+05:30',
    readTime: '7 min read',
    cluster: 'how-to',
    primaryTool: '/redact-pdf',
    related: ['/redact-pdf', '/find-and-redact', '/flatten-pdf', '/blog/edit-pdf-without-uploading'],
    blocks: [
      { type: 'p', html: 'This is the most consequential misunderstanding in everyday PDF use, and it has embarrassed governments, law firms and newspapers. Drawing a black box over a name in a PDF does not remove the name. It draws a black box. The name is still there, underneath, intact — and anyone can retrieve it by selecting the text and pasting it elsewhere.' },
      { type: 'callout', html: 'A PDF is not a picture of a document. It is a set of instructions: draw this text here, then draw this rectangle there. Adding a rectangle adds an instruction. It does not delete the earlier one.' },
      { type: 'h2', html: 'How the mistake happens' },
      { type: 'p', html: 'Every one of these feels like redacting and none of them is:' },
      { type: 'ul', items: [
        'Drawing a filled black rectangle with an annotation or drawing tool.',
        'Highlighting text in black with a markup tool.',
        'Setting the text colour to white so it "disappears" against the page.',
        'Covering a region with an opaque image.',
        'Placing a black box in Word, then exporting to PDF — sometimes safe, often not, depending on how the export handles layering.',
      ] },
      { type: 'p', html: 'In each case the original text remains a text object in the file. Select over the blacked-out region, copy, paste into a text editor, and it reappears. You do not need special software; a PDF reader and a keyboard are enough.' },
      { type: 'h2', html: 'It is worse than just selectable text' },
      { type: 'p', html: 'Even if you remove the visible text correctly, a PDF carries other copies of the same information in places people forget to look:' },
      { type: 'ul', items: [
        '<strong>Document metadata</strong> — author, title, keywords, the software used, and sometimes the full file path on the original machine, which can leak a name or an internal project code.',
        '<strong>Annotation contents</strong> — comment text is stored separately from the page and survives flattening the visual layer if done wrong.',
        '<strong>Form field values</strong> — a filled field holds its value as data, not as page content.',
        '<strong>Embedded thumbnails and previews</strong> — occasionally generated before the redaction was applied.',
        '<strong>Earlier revisions</strong> — PDFs support incremental saving, where edits are appended and the previous version remains in the file. A "removed" page can still be recoverable.',
      ] },
      { type: 'h2', html: 'How to redact properly' },
      { type: 'p', html: 'Real redaction removes the underlying content rather than covering it. There are two reliable approaches.' },
      { type: 'h3', html: 'Remove the text, then flatten' },
      { type: 'p', html: 'Use a tool that deletes the text objects in the selected region rather than drawing over them, then flatten the document so annotations and form data are baked into the page and no longer exist as separate retrievable objects.' },
      { type: 'ul', items: [
        '<a href="/redact-pdf">Redact PDF</a> — select regions and remove the content beneath them.',
        '<a href="/find-and-redact">Find and redact</a> — search for a name, account number or term and remove every occurrence, which is far safer than spotting them by eye across fifty pages.',
        '<a href="/flatten-pdf">Flatten PDF</a> — merge annotations and form fields into the page so nothing remains as separate data.',
        '<a href="/pdf-metadata">Edit PDF metadata</a> — clear author, title and producer fields.',
      ] },
      { type: 'h3', html: 'Or destroy the text layer entirely' },
      { type: 'p', html: 'The blunt, extremely reliable method: cover the sensitive areas, <a href="/pdf-to-images">convert every page to an image</a>, then <a href="/images-to-pdf">rebuild a PDF from those images</a>. Rasterising discards the text layer completely — there is no text left to recover, because there is no text at all.' },
      { type: 'p', html: 'The cost is that the result is not searchable or selectable, and the file is usually larger. For a document going to an adversarial party, that is often a trade worth making.' },
      { type: 'h2', html: 'How to check your work' },
      { type: 'p', html: 'Never assume. Verify, every time, before the document leaves your hands:' },
      { type: 'ol', items: [
        'Open the redacted file in a fresh reader.',
        'Select all the text on the page — including over the black areas — copy it, and paste it into a plain text editor. Read what appears.',
        'Use the reader\'s search function to look for the exact term you redacted. If it is found, you have not redacted it.',
        'Check the document properties for author and title metadata.',
        '<a href="/extract-text">Extract the text</a> from the whole document and search that output. This catches occurrences on pages you did not think to check.',
      ] },
      { type: 'p', html: 'That last step is the one that catches real mistakes — the second mention of the name, forty pages later, that nobody remembered was there.' },
      { type: 'h2', html: 'One more reason to do it locally' },
      { type: 'p', html: 'Redaction is applied to precisely the documents you least want to upload: legal filings, medical records, HR files, anything under disclosure. Uploading a document to remove its secrets, before the secrets have been removed, sends the unredacted version to a third party. <a href="/blog/edit-pdf-without-uploading">Doing the work locally</a> avoids that ordering problem entirely.' },
    ],
    faqs: [
      { question: 'Does drawing a black box over text in a PDF hide it?', answer: 'No. A PDF stores text as text and the rectangle as a separate drawing instruction. The text remains underneath and can be recovered by selecting it and copying, or by searching the document. This is how numerous public redaction failures happened.' },
      { question: 'How do I properly redact a PDF?', answer: 'Use a tool that removes the underlying text objects rather than covering them, then flatten the document so annotations and form values are not retained as separate data, and clear the document metadata. Verify afterwards by selecting all text and searching for the redacted term.' },
      { question: 'Is converting a PDF to images a reliable way to redact?', answer: 'Yes, and it is the bluntest reliable method. Rasterising each page discards the text layer entirely, so there is nothing left to extract. The trade-off is that the result is no longer searchable or selectable and the file is usually larger.' },
      { question: 'How can I check whether my redaction worked?', answer: 'Open the file fresh, select all the text including over the blacked-out areas, and paste it into a text editor. Then search the document for the exact redacted term. Extracting the full text and searching that catches occurrences on pages you did not check by eye.' },
    ],
  },

  '/blog/resize-image-for-online-forms': {
    route: '/blog/resize-image-for-online-forms',
    title: 'Why Online Forms Reject Your Photo (and How to Fix It) | FilePilot',
    description: 'Government, exam and visa portals reject photos for size, dimensions, format and aspect ratio. What each error message actually means, why the KB limits exist, and how to hit the exact spec.',
    h1: 'Why Online Forms Reject Your Photo, and How to Fix It',
    published: '2026-08-22T18:54:59+05:30',
    readTime: '7 min read',
    cluster: 'how-to',
    primaryTool: '/image-requirements',
    related: ['/image-requirements', '/passport-photo-validator', '/crop-image', '/blog/edit-pdf-without-uploading'],
    blocks: [
      { type: 'p', html: 'Application portals are unusually strict about photographs, and unusually unhelpful about explaining why. "Photo size should be between 20KB and 50KB." "Dimensions must be 200x230 pixels." "Invalid file format." You resize, it is still rejected. You compress, now it is too small. This is one of the most common and most frustrating tasks on the internet, and it is entirely solvable once you know what is being asked.' },
      { type: 'h2', html: 'The four things a form actually checks' },
      { type: 'p', html: 'Almost every rejection is one of these, and they are independent — satisfying one can break another, which is why the process feels circular.' },
      { type: 'ul', items: [
        '<strong>File size in KB.</strong> How many kilobytes the file occupies. Controlled by compression quality, not by dimensions alone.',
        '<strong>Pixel dimensions.</strong> Width and height, e.g. 200×230. Controlled by resizing.',
        '<strong>File format.</strong> Usually JPG, sometimes PNG. Renaming a .png to .jpg does not convert it and will be rejected.',
        '<strong>Aspect ratio.</strong> Implied by the required dimensions. If your photo is a different shape, resizing to those exact numbers will squash the image unless you crop first.',
      ] },
      { type: 'callout', html: 'The circularity trap: you shrink dimensions to hit the KB limit, and now the dimensions are wrong. The fix is to set dimensions first, then hit the KB target with compression quality — not by shrinking further.' },
      { type: 'h2', html: 'Why the limits are so small' },
      { type: 'p', html: 'A 20KB ceiling looks absurd when phones produce 5MB photographs. The limits are usually old, set when the system was built and storage and bandwidth cost real money, and they persist because changing a validation rule in a government system is harder than leaving it. Some are also sized for the printed output — a passport photo printed at 35×45mm does not need eight megapixels.' },
      { type: 'p', html: 'Understanding that helps, because it tells you the goal is to satisfy a validator, not to preserve quality. A photo that looks slightly soft on screen but passes is a success.' },
      { type: 'h2', html: 'The order that works' },
      { type: 'ol', items: [
        '<strong>Crop to the right shape first.</strong> If the form wants 200×230, that is roughly 0.87:1. Crop to approximately that ratio so nothing gets distorted in the next step. <a href="/crop-image">Crop the image</a>.',
        '<strong>Set the exact pixel dimensions.</strong> Now resize to precisely the numbers given. Because you cropped to the right ratio, nothing is stretched.',
        '<strong>Convert to the required format.</strong> Usually JPG. Do this before targeting file size, because format changes the size significantly.',
        '<strong>Compress to the KB target.</strong> Reduce quality until you are under the ceiling but above any minimum. Both bounds matter — many portals reject files that are too small as well as too large.',
      ] },
      { type: 'p', html: '<a href="/image-requirements">Resize image to exact size</a> does all four in one pass: enter the dimensions, enter a maximum file size in KB, choose the format, and it works out the quality setting needed to land inside the limit.' },
      { type: 'h2', html: 'Specific errors, translated' },
      { type: 'ul', items: [
        '<strong>"File too large"</strong> — the KB size, not the dimensions. Lower the compression quality.',
        '<strong>"File too small"</strong> — you compressed too hard. Raise quality slightly; some portals treat very small files as suspicious.',
        '<strong>"Invalid dimensions"</strong> — exact pixel width and height are required. Approximately right is not right.',
        '<strong>"Invalid format"</strong> — the file\'s actual encoding is wrong, regardless of its extension. Convert it properly.',
        '<strong>"Photo not clear" / "face not detected"</strong> — not a size problem. Usually background, lighting, head position or over-compression destroying facial detail. <a href="/passport-photo-validator">Check it against the standard requirements</a>.',
        '<strong>Signature-specific rules</strong> — often a separate, even smaller limit (10–20KB) with a wide, short aspect ratio. Treat it as a completely separate image.',
      ] },
      { type: 'h2', html: 'Do this one locally' },
      { type: 'p', html: 'The photographs these forms want are passport photos, signatures and identity documents — the single most sensitive category of image most people own. Uploading a passport photo to an anonymous "image resizer" to satisfy a government form is a poor trade.' },
      { type: 'p', html: 'The <a href="/image-requirements">resizer</a> and the <a href="/passport-photo-validator">passport photo validator</a> both run entirely in your browser, so the image is never transmitted. You can <a href="/blog/edit-pdf-without-uploading">confirm that yourself</a> in the Network tab.' },
    ],
    faqs: [
      { question: 'How do I resize a photo to 50KB?', answer: 'Set the pixel dimensions the form requires first, convert to the required format (usually JPG), then lower the compression quality until the file is under 50KB. Shrinking dimensions further is the wrong lever once the dimensions are already specified.' },
      { question: 'Why does the form say my photo is too small?', answer: 'Many portals enforce a minimum as well as a maximum — for example between 20KB and 50KB. Over-compressing pushes you below the floor. Raise the quality slightly until you land inside the range.' },
      { question: 'Can I just rename a PNG to .jpg?', answer: 'No. The extension does not change how the file is encoded, and the validator reads the actual format. You have to convert the image properly.' },
      { question: 'Why does my photo look stretched after resizing?', answer: 'Because the required dimensions have a different aspect ratio from your original, and resizing to exact numbers without cropping distorts the image. Crop to approximately the target ratio first, then set the exact dimensions.' },
      { question: 'Is it safe to use an online resizer for a passport photo?', answer: 'Most upload your image to a server. For an identity document that is worth avoiding — use a tool that processes the image in your browser so it is never transmitted.' },
    ],
  },

  '/blog/what-exif-data-reveals': {
    route: '/blog/what-exif-data-reveals',
    title: 'What EXIF Data Reveals About Your Photos | FilePilot',
    description: 'Photos carry GPS coordinates, timestamps, device serial numbers and more. What is actually stored, which platforms strip it and which do not, and how to remove it before sharing.',
    h1: 'What EXIF Data Reveals About Your Photos',
    published: '2026-08-22T18:54:59+05:30',
    readTime: '6 min read',
    cluster: 'privacy',
    primaryTool: '/remove-image-metadata',
    related: ['/blog/edit-pdf-without-uploading', '/remove-image-metadata', '/blur-face', '/pdf-metadata', '/blog/is-it-safe-to-upload-pdf-online'],
    blocks: [
      { type: 'p', html: 'Every photograph your phone takes carries a block of data describing how, when and where it was taken. It is called EXIF, it is invisible in the picture, and it travels with the file when you send it. Most of the time this is harmless and occasionally useful. Sometimes it tells a stranger where you live.' },
      { type: 'h2', html: 'What is actually in there' },
      { type: 'ul', items: [
        '<strong>GPS coordinates</strong> — latitude and longitude, often accurate to a few metres, plus altitude. This is the one that matters.',
        '<strong>Timestamp</strong> — the exact date and time of capture, usually with a timezone offset.',
        '<strong>Device make and model</strong> — which phone or camera, and sometimes the lens.',
        '<strong>Camera serial number</strong> — on many dedicated cameras, a unique identifier that links every photo you have ever taken with that body.',
        '<strong>Capture settings</strong> — aperture, shutter speed, ISO, focal length, flash.',
        '<strong>Software</strong> — which app processed the image, and sometimes an edit history.',
        '<strong>Orientation</strong> — the field that makes photos appear rotated when a viewer ignores it.',
        '<strong>Thumbnail</strong> — an embedded preview which, notoriously, is sometimes the <em>pre-edit</em> version of the image. Cropping something out does not always remove it from the thumbnail.',
      ] },
      { type: 'callout', html: 'The embedded thumbnail is the sharpest edge here. There are documented cases of people cropping a photo to remove something and publishing a file whose thumbnail still showed the original frame.' },
      { type: 'h2', html: 'Where it actually causes problems' },
      { type: 'p', html: 'Not everywhere. Major social platforms — Facebook, Instagram, X, WhatsApp — strip most EXIF on upload, primarily to save bandwidth. That covers a lot of ordinary sharing. The exposure is in the places people do not think of as publishing:' },
      { type: 'ul', items: [
        'Marketplace listings on smaller sites that serve the original file, where photos are usually taken at home.',
        'Email and messaging attachments, which typically preserve the file exactly as it was.',
        'Cloud folder links shared with "anyone with the link".',
        'Forums, wikis, comment sections and issue trackers that host the original upload.',
        'Dating profiles on smaller platforms.',
        'Any photo sent to someone you do not fully trust.',
      ] },
      { type: 'p', html: 'The realistic threat is not sophisticated. It is that a photo of an item for sale, taken in your living room, contains the coordinates of your living room.' },
      { type: 'h2', html: 'Removing it' },
      { type: 'p', html: 'Stripping metadata does not alter the image. It removes the descriptive block wrapped around it — the pixels are untouched.' },
      { type: 'p', html: '<a href="/remove-image-metadata">Remove image metadata</a> clears EXIF, GPS and camera data in your browser. That last part matters more than usual here: uploading a geotagged photo to a website in order to remove its geotag hands the coordinates to that website first. This is one of the few tasks where a server-based tool defeats its own purpose.' },
      { type: 'h3', html: 'Also worth doing' },
      { type: 'ul', items: [
        'Turn off location tagging in your camera app if you do not need it. Most phones allow this per-app.',
        'Re-check after editing — some editors preserve the original EXIF, and some write new fields of their own.',
        'If the image shows people who did not consent to being published, <a href="/blur-face">blur the faces</a> as well as stripping the metadata.',
        'Remember documents have metadata too. PDFs carry author names, software details and sometimes full file paths — <a href="/pdf-metadata">check and clear them</a> before sending anything sensitive.',
      ] },
      { type: 'h2', html: 'When to keep it' },
      { type: 'p', html: 'EXIF is not the enemy. Photographers rely on capture settings to learn from their own work, archives depend on timestamps, and geotags make personal photo libraries searchable by place. Keep it for your own storage; strip it at the moment of sharing. The decision is per-audience, not per-photo.' },
    ],
    faqs: [
      { question: 'Does a photo contain my location?', answer: 'If location services were enabled for your camera app, yes — GPS latitude and longitude, often accurate to a few metres, are stored inside the image file. It is invisible in the picture but readable by anyone who has the file.' },
      { question: 'Does uploading to Instagram or WhatsApp remove EXIF?', answer: 'Major platforms strip most EXIF on upload, largely to reduce file size. Email attachments, direct file transfers, cloud links and smaller sites usually preserve the original file with all its metadata intact.' },
      { question: 'Does removing EXIF change how the photo looks?', answer: 'No. The metadata is a separate block of descriptive information wrapped around the image data. Removing it leaves the pixels exactly as they were.' },
      { question: 'Is it safe to use an online EXIF remover?', answer: 'Uploading a geotagged photo to a website in order to strip the geotag gives that website the coordinates first, which defeats the purpose. Use a tool that processes the image in your browser instead.' },
    ],
  },

  '/blog/combine-scanned-pages-into-one-pdf': {
    route: '/blog/combine-scanned-pages-into-one-pdf',
    title: 'How to Combine Scanned Pages Into One PDF | FilePilot',
    description: 'Scanners produce one file per page, in the wrong order, sometimes crooked and always too large. How to get from a folder of scans to a single clean PDF without uploading anything.',
    h1: 'How to Combine Scanned Pages Into One PDF',
    published: '2026-08-22T18:54:59+05:30',
    readTime: '6 min read',
    cluster: 'how-to',
    primaryTool: '/merge',
    related: ['/merge', '/scan-images-to-pdf', '/deskew-pdf', '/compress', '/blog/edit-pdf-without-uploading'],
    blocks: [
      { type: 'p', html: 'Scanners and phone scanning apps have a habit of producing exactly what you did not ask for: twelve separate files, named in a way that sorts wrongly, a few pages upside down, one crooked, and a total size too large to email. Getting from that to a single tidy PDF is a five-minute job once you do the steps in the right order.' },
      { type: 'h2', html: 'Get the order right first' },
      { type: 'p', html: 'Do this before anything else, because fixing order later means redoing the work. The classic failure is alphabetical sorting: <code>scan1.jpg</code>, <code>scan10.jpg</code>, <code>scan11.jpg</code>, <code>scan2.jpg</code>. Ten pages sort before two.' },
      { type: 'p', html: 'If you are renaming, pad the numbers — <code>scan01</code>, <code>scan02</code>, <code>scan10</code> — and everything sorts correctly everywhere. If you would rather not rename anything, use a tool that lets you drag pages into order after loading them, which is usually faster for a dozen pages.' },
      { type: 'h2', html: 'Then combine' },
      { type: 'p', html: 'What you use depends on what came out of the scanner.' },
      { type: 'ul', items: [
        '<strong>Images (JPG/PNG), one per page</strong> — <a href="/scan-images-to-pdf">scan images to PDF</a> is built for this: it takes a set of photos or scans and assembles them into a single document with consistent page sizing.',
        '<strong>Images, but you want control over layout</strong> — <a href="/images-to-pdf">images to PDF</a> lets you set page size and orientation explicitly.',
        '<strong>Several small PDFs</strong> — <a href="/merge">merge PDFs</a>, reordering by dragging before you combine.',
        '<strong>A double-sided scan done in two passes</strong> — fronts in one file, backs in another, backs in reverse order. <a href="/alternate-merge">Alternate merge</a> interleaves them correctly instead of you reordering 40 pages by hand.',
      ] },
      { type: 'callout', html: 'That last one saves the most time and almost nobody knows it exists. Scanning a stack double-sided on a single-sided feeder gives you fronts 1,3,5… and backs 6,4,2. Interleaving is a solved problem — do not do it manually.' },
      { type: 'h2', html: 'Clean it up' },
      { type: 'p', html: 'Scans arrive with predictable defects. Each has a direct fix:' },
      { type: 'ul', items: [
        '<strong>Crooked pages</strong> — <a href="/deskew-pdf">deskew</a> straightens pages that went through the feeder at an angle. Worth doing before OCR, which is noticeably less accurate on tilted text.',
        '<strong>Wrong rotation</strong> — <a href="/rotate-pdf">rotate</a> whole pages or just the ones that came out sideways.',
        '<strong>Inconsistent page sizes</strong> — <a href="/fix-page-size">fix page size</a> normalises everything to A4 or Letter so the document prints predictably.',
        '<strong>Blank backs</strong> — if you scanned double-sided and half the pages are empty, <a href="/delete-pages">delete pages</a> removes them in one pass.',
        '<strong>Margins full of scanner bed</strong> — <a href="/crop-pdf">crop</a> the document to trim the black edges.',
      ] },
      { type: 'h2', html: 'Make it small enough to send' },
      { type: 'p', html: 'This is where most scanned PDFs fail. A dozen colour scans at 600 DPI produces an enormous file, because each page is a photograph rather than text.' },
      { type: 'ul', items: [
        '<strong>Scan at 300 DPI, not 600.</strong> For text documents 300 is the standard, and it roughly quarters the data compared with 600. This is the single biggest lever and it happens before you start.',
        '<strong>Convert to greyscale.</strong> A black-ink document does not need colour. <a href="/pdf-to-greyscale">Greyscale conversion</a> typically cuts the size substantially with no meaningful loss.',
        '<strong>Compress.</strong> <a href="/compress">Compress the PDF</a> to reduce image data further. Check the result is still readable — over-compressed scans become mushy exactly where the small print is.',
      ] },
      { type: 'h2', html: 'Make the text searchable' },
      { type: 'p', html: 'A scan is a picture of text, so searching it finds nothing. <a href="/extract-text">Extracting the text</a> runs optical character recognition and gives you the content as text you can search, quote or paste.' },
      { type: 'p', html: 'Set expectations honestly: browser-based OCR is good on clean, straight, 300 DPI scans of printed text, and poor on handwriting, faint carbon copies or heavily skewed pages. Deskewing first genuinely helps. For a large archive of poor-quality scans, dedicated server-side OCR will do better.' },
      { type: 'h2', html: 'Why do this locally' },
      { type: 'p', html: 'People scan documents for a reason, and the reason is usually official: contracts, certificates, medical letters, tax paperwork, identity documents. That is the exact category worth keeping off other people\'s servers. Every tool linked here <a href="/blog/edit-pdf-without-uploading">runs in your browser</a>.' },
    ],
    faqs: [
      { question: 'How do I combine multiple scanned images into one PDF?', answer: 'Put the pages in the correct order first, then use a tool that assembles images into a single document. Watch for alphabetical sorting problems — scan10 sorts before scan2 unless the numbers are zero-padded.' },
      { question: 'My scanned PDF is too large to email. What should I do?', answer: 'Scan at 300 DPI rather than 600, convert to greyscale if the document is black ink on white, then compress. The DPI choice has the biggest effect and has to be made before scanning.' },
      { question: 'I scanned both sides separately and the pages are out of order. Is there a fix?', answer: 'Yes. An alternate merge interleaves two files, taking one page from each in turn, and handles the reversed back-side order that single-sided feeders produce. It avoids reordering dozens of pages by hand.' },
      { question: 'Can I search the text in a scanned PDF?', answer: 'Only after optical character recognition, because a scan is an image of text rather than text. OCR works well on clean 300 DPI scans of printed material and poorly on handwriting or faint originals. Straightening crooked pages first improves accuracy noticeably.' },
    ],
  },

  '/blog/compress-pdf-without-losing-quality': {
    route: '/blog/compress-pdf-without-losing-quality',
    title: 'How to Compress a PDF Without Wrecking the Quality | FilePilot',
    description: 'Why PDFs get large, which part of your file is actually taking the space, and the order of operations that shrinks a document without turning the text to mush.',
    h1: 'How to Compress a PDF Without Wrecking the Quality',
    published: '2026-08-22T18:54:59+05:30',
    readTime: '6 min read',
    cluster: 'how-to',
    primaryTool: '/compress',
    related: ['/compress', '/pdf-to-greyscale', '/flatten-pdf', '/extract-images', '/blog/edit-pdf-without-uploading'],
    blocks: [
      { type: 'p', html: 'Compression is usually approached as one button pressed repeatedly until either the file fits or it becomes unreadable. It works better if you first find out what is actually large, because the right fix for a scanned document is the wrong fix for a report full of charts.' },
      { type: 'h2', html: 'What is taking up the space' },
      { type: 'p', html: 'Text is tiny. A hundred pages of prose is a few hundred kilobytes. If your PDF is large, it is almost always one of these:' },
      { type: 'ul', items: [
        '<strong>Images.</strong> By far the most common cause. A single phone photo can outweigh a hundred pages of text, and scanned documents are entirely images.',
        '<strong>Embedded fonts.</strong> A full font family adds hundreds of kilobytes. Usually only a problem when many fonts are embedded unsubsetted.',
        '<strong>Form fields and annotations.</strong> Stored as live objects with their own structure.',
        '<strong>Revision history.</strong> PDFs support incremental saving, where each edit appends to the file and the old version stays. A heavily edited document can carry several copies of itself.',
        '<strong>Vector artwork.</strong> Charts and maps with tens of thousands of paths can be surprisingly heavy.',
      ] },
      { type: 'p', html: 'A quick diagnostic: <a href="/extract-images">extract the images</a> from the document. If they account for most of the file size, it is an image problem — which is good news, because image problems have the best fixes.' },
      { type: 'h2', html: 'The order that preserves quality' },
      { type: 'p', html: 'Work through these in sequence and stop when the file is small enough. Each step costs less quality than the one after it.' },
      { type: 'ol', items: [
        '<strong>Remove what you do not need.</strong> <a href="/delete-pages">Delete pages</a> you are not sending. The cheapest byte is the one that is not there.',
        '<strong>Flatten forms and annotations.</strong> <a href="/flatten-pdf">Flattening</a> converts live objects into page content, often shrinking the file and removing recoverable data at the same time.',
        '<strong>Drop colour if it carries no information.</strong> <a href="/pdf-to-greyscale">Greyscale conversion</a> is the most underrated step — for a black-ink scan it can cut the size dramatically and looks identical when printed.',
        '<strong>Compress the images.</strong> Now run <a href="/compress">PDF compression</a>. This is where quality is actually traded away, which is why it comes after the free wins.',
        '<strong>Only then, reduce resolution.</strong> If it still will not fit, the images are simply at a higher resolution than needed. 300 DPI is right for print; 150 is fine for screen reading.',
      ] },
      { type: 'callout', html: 'Most people start at step four and never discover that steps one to three would have been enough on their own — without touching quality at all.' },
      { type: 'h2', html: 'Where quality actually breaks' },
      { type: 'p', html: 'Over-compression does not degrade a page evenly. It fails first and worst on exactly the parts that matter:' },
      { type: 'ul', items: [
        '<strong>Small text in scans</strong> becomes fuzzy and stops being OCR-readable long before it looks bad at full-page zoom.',
        '<strong>Fine lines</strong> in tables, signatures and technical drawings break up.',
        '<strong>Sharp edges</strong> — text against a flat background — get haloes, because JPEG-style compression is built for photographs, not for letterforms.',
        '<strong>Gradients</strong> band into visible steps.',
      ] },
      { type: 'p', html: 'So do not judge the result by scrolling at page-fit zoom. Zoom to 200% on the smallest text on the busiest page. If that is legible, the document is fine. If it is not, back off one quality level.' },
      { type: 'h2', html: 'When compressing is the wrong answer' },
      { type: 'ul', items: [
        '<strong>The file is huge because it should be several files.</strong> A 300-page manual emailed to someone who needs chapter 4 should be <a href="/split">split</a>, not compressed.',
        '<strong>It is for print.</strong> Printers need the resolution. Compressing a document destined for a press is solving the wrong problem.',
        '<strong>It is an archival or legal copy.</strong> Compression is lossy; the discarded detail does not come back. Keep the original.',
        '<strong>The recipient just needs the text.</strong> <a href="/extract-text">Extract the text</a> and send that — a fraction of the size and far easier to work with.',
      ] },
      { type: 'h2', html: 'A note on where this happens' },
      { type: 'p', html: 'Compression is normally the last step before sending a document to someone — which means running it through an upload-based service puts the finished, complete document on a third party\'s servers at the exact moment it is most sensitive. <a href="/compress">Compressing locally</a> avoids that, and you can <a href="/blog/edit-pdf-without-uploading">verify nothing is transmitted</a> while it runs.' },
    ],
    faqs: [
      { question: 'Why is my PDF so large?', answer: 'Almost always images. Text is very small — a hundred pages of prose is a few hundred kilobytes — while a single photograph or scanned page can be several megabytes. Embedded fonts, form fields and retained revision history are less common causes.' },
      { question: 'How can I compress a PDF without losing quality?', answer: 'Do the free steps first: delete pages you do not need, flatten forms and annotations, and convert to greyscale if colour carries no information. Those often suffice. Only then compress the images, which is the step that actually trades quality away.' },
      { question: 'How do I know if I compressed too much?', answer: 'Zoom to 200% on the smallest text on the busiest page, rather than judging at page-fit zoom. Small text and fine lines degrade first. If the small print is not comfortably legible, step back one quality level.' },
      { question: 'Does converting a PDF to greyscale really reduce the size?', answer: 'Often substantially, because colour images store roughly three times the channel data of greyscale ones. For a document that is black ink on white paper it is close to a free saving, and it prints identically on a mono printer.' },
    ],
  },

  '/blog/pdf-comics-to-cbz': {
    route: '/blog/pdf-comics-to-cbz',
    title: 'PDF or CBZ for Comics and Manga? | FilePilot',
    description: 'Why comic readers prefer CBZ over PDF, what the format actually is, when converting helps and when it does not, and how page order and naming decide whether the result works.',
    h1: 'PDF or CBZ for Comics and Manga?',
    published: '2026-08-22T18:54:59+05:30',
    readTime: '6 min read',
    cluster: 'how-to',
    primaryTool: '/pdf-to-cbz',
    related: ['/pdf-to-cbz', '/pdf-to-images', '/pdf-to-zip', '/blog/edit-pdf-without-uploading'],
    blocks: [
      { type: 'p', html: 'If you read comics or manga on a tablet or e-reader, you will eventually hit a PDF that behaves badly — it will not fit the screen, page turns are slow, and double-page spreads split down the middle. Converting to CBZ usually fixes it. Understanding why explains when it will not.' },
      { type: 'h2', html: 'What CBZ actually is' },
      { type: 'p', html: 'A CBZ file is a ZIP archive of images, renamed. That is the entire specification. There is no page layout, no text layer, no embedded fonts, no scripting — just pictures in a defined order, which a comic reader displays one after another.' },
      { type: 'p', html: 'That simplicity is the point. A PDF is a general-purpose document format that has to support text flow, vector graphics, forms, annotations and colour management. For a page that is a single scanned image, all that machinery is overhead a reader has to work through before it can draw anything.' },
      { type: 'h2', html: 'Why comic readers prefer it' },
      { type: 'ul', items: [
        '<strong>Speed.</strong> Decoding a JPEG is dramatically faster than parsing a PDF page. On an e-reader or older tablet this is the difference between instant page turns and a visible pause.',
        '<strong>Correct fitting.</strong> Comic readers know each entry is one page and fit it to the screen. PDF readers respect the page box, which is why you often get margins you cannot remove.',
        '<strong>Spread handling.</strong> Comic readers detect double-width images and offer to show them as a spread or split them. PDF readers have no concept of this.',
        '<strong>Reading direction.</strong> Manga readers support right-to-left paging, which PDF readers generally do not.',
        '<strong>Reliable progress.</strong> Comic readers remember your place per file and sync it. PDF position tracking is inconsistent between apps.',
      ] },
      { type: 'h2', html: 'When converting is worth it' },
      { type: 'p', html: 'Convert when your PDF is a scanned or image-based comic and you read it in a dedicated reader. That is the case the format exists for, and the improvement is immediate. <a href="/pdf-to-cbz">PDF to CBZ</a> extracts each page as an image and packages them in order.' },
      { type: 'h2', html: 'When it is not' },
      { type: 'ul', items: [
        '<strong>The PDF has real text.</strong> A digital comic with a text layer loses selectable, searchable, resizable text on conversion, because CBZ has nowhere to put it. You are trading capability for speed.',
        '<strong>You need annotations or bookmarks.</strong> CBZ supports neither.',
        '<strong>You read in a PDF reader anyway.</strong> Converting achieves nothing if nothing on your device opens CBZ.',
        '<strong>It is not a comic.</strong> Converting a textbook to CBZ turns searchable text into pictures of text. That is a downgrade.',
      ] },
      { type: 'callout', html: 'The rule of thumb: if each PDF page is essentially one picture, CBZ is better. If the pages contain real text, PDF is better.' },
      { type: 'h2', html: 'Page order is the thing that goes wrong' },
      { type: 'p', html: 'Because CBZ has no page structure, the reader determines order by sorting filenames. Almost every broken CBZ is a sorting problem.' },
      { type: 'p', html: 'Files named <code>page1</code> to <code>page100</code> sort as 1, 10, 100, 11, 12 — so page 100 appears third. Correct conversion pads the numbers (<code>page001</code>, <code>page002</code>) so alphabetical order matches reading order. Check the first twenty pages after any conversion; if the order is wrong, it will be wrong in a predictable, obvious way.' },
      { type: 'h2', html: 'Quality settings' },
      { type: 'p', html: 'Conversion renders each PDF page to an image, so you choose the resolution:' },
      { type: 'ul', items: [
        '<strong>150 DPI</strong> — fine for phones and small tablets, smallest files.',
        '<strong>300 DPI</strong> — the sensible default for tablets and e-readers. Small lettering stays legible when you zoom.',
        '<strong>600 DPI</strong> — only for archival, or for detailed line art you intend to study closely. Files get very large.',
      ] },
      { type: 'p', html: 'Manga lettering is often small, so err upward — 300 rather than 150 — if you plan to reread it.' },
      { type: 'h2', html: 'Related formats' },
      { type: 'p', html: 'CBR is the same idea using RAR instead of ZIP. CBZ is preferable: ZIP is an open format supported everywhere, and RAR is proprietary. If you are creating a file, create CBZ.' },
      { type: 'p', html: 'If you want the images without the comic wrapper — for editing, or for a reader that takes a folder — <a href="/pdf-to-images">PDF to images</a> or <a href="/pdf-to-zip">PDF to ZIP</a> give you the same pages in a plainer package.' },
      { type: 'h2', html: 'A note on scanned collections' },
      { type: 'p', html: 'Personal comic archives are often self-scanned or otherwise not something people want to hand to an upload service. Conversion is also bandwidth-heavy — a 200MB comic uploaded and downloaded again is a slow round trip. <a href="/pdf-to-cbz">Converting locally</a> avoids both, and there is no upload wait at all: the work happens on your machine.' },
    ],
    faqs: [
      { question: 'What is a CBZ file?', answer: 'A ZIP archive containing the pages of a comic as image files, with a different extension. Comic readers display the images in filename order. There is no text layer, no layout and no annotations — just pages.' },
      { question: 'Is CBZ better than PDF for comics?', answer: 'For image-based comics read in a dedicated reader, yes: faster page turns, correct screen fitting, spread detection and right-to-left support for manga. For documents with real text, PDF is better because CBZ cannot store text at all.' },
      { question: 'Why are my CBZ pages in the wrong order?', answer: 'Readers sort by filename, and unpadded numbers sort alphabetically — page1, page10, page100, page11. Correct conversion zero-pads the numbers so alphabetical order matches reading order.' },
      { question: 'What resolution should I convert at?', answer: '300 DPI suits most tablets and e-readers and keeps small lettering legible. 150 DPI is fine for phones and produces much smaller files. 600 DPI is only worth it for archival copies.' },
      { question: 'What is the difference between CBZ and CBR?', answer: 'The archive format inside — ZIP for CBZ, RAR for CBR. Readers support both, but CBZ is preferable when creating files because ZIP is an open, universally supported format.' },
    ],
  },

  '/blog/print-multiple-pdf-pages-per-sheet': {
    route: '/blog/print-multiple-pdf-pages-per-sheet',
    title: 'Printing Multiple PDF Pages Per Sheet, Explained | FilePilot',
    description: 'N-up printing, booklet imposition and poster tiling are three different things that print dialogs handle badly. What each one does, when to use it, and how to get a predictable result.',
    h1: 'Printing Multiple PDF Pages Per Sheet, Explained',
    published: '2026-08-22T18:54:59+05:30',
    readTime: '6 min read',
    cluster: 'how-to',
    primaryTool: '/n-up-pdf',
    related: ['/n-up-pdf', '/pdf-booklet', '/posterize-pdf', '/fix-page-size', '/blog/edit-pdf-without-uploading'],
    blocks: [
      { type: 'p', html: 'Printing several pages onto one sheet sounds like a print-dialog setting, and sometimes it is. The trouble starts when you need the result to be a file rather than a printout — to email it, to hand it to a print shop, or to get the same output twice. Print dialogs are inconsistent between applications, drivers and operating systems, and they leave you nothing to check.' },
      { type: 'p', html: 'There are three distinct operations here that people routinely confuse.' },
      { type: 'h2', html: 'N-up: several pages on one sheet' },
      { type: 'p', html: 'N-up places 2, 4, 6 or 9 document pages onto a single sheet in a grid, scaled down. It is what you want for handouts, for proofing a long document, or simply for using less paper.' },
      { type: 'ul', items: [
        '<strong>2-up</strong> — two pages side by side on landscape A4. Text stays comfortably readable; this is the safe default.',
        '<strong>4-up</strong> — a 2×2 grid. Fine for reviewing layout and structure, marginal for reading body text.',
        '<strong>9-up</strong> — a contact-sheet view. Useful for seeing the shape of a document, not for reading it.',
      ] },
      { type: 'p', html: 'The practical limit is font size. Scaling to 4-up quarters the area, so 11pt body text renders around 5.5pt. Legible at arm\'s length in good light, tiring for anything longer than a few pages. <a href="/n-up-pdf">N-up PDF</a> produces a real file, so you can look at it before committing paper to it.' },
      { type: 'h2', html: 'Booklet: a folded, stapled document' },
      { type: 'p', html: 'A booklet is not 2-up. It looks similar — two pages per side of a sheet — but the page order is completely different, because the sheets get folded and nested.' },
      { type: 'p', html: 'In an eight-page booklet, the outer sheet carries pages 8 and 1 on one side and 2 and 7 on the other. That rearrangement is called imposition, and doing it by hand is exactly the kind of task people get wrong twice before giving up.' },
      { type: 'callout', html: 'If you fold and staple it, you need booklet imposition. If you just want less paper, you need N-up. Choosing the wrong one produces a stack that is unreadable when folded.' },
      { type: 'p', html: '<a href="/pdf-booklet">PDF booklet</a> does the imposition. Two things to know: page count is padded to a multiple of four with blanks, because that is how folded sheets work; and if your printer has no duplex mode you print odd sheets, flip the stack, then print even sheets — test with four pages before running eighty.' },
      { type: 'h2', html: 'Posterize: one page across several sheets' },
      { type: 'p', html: 'The opposite operation. Posterizing tiles a single page across a grid of sheets so you can assemble a large print from ordinary paper — a floor plan, a banner, a large diagram, a sewing or woodworking pattern.' },
      { type: 'p', html: '<a href="/posterize-pdf">Posterize PDF</a> splits the page into tiles with overlap margins so there is something to align and tape. Two things to check: that the source is high enough resolution — enlarging a low-resolution page magnifies every flaw — and that you keep the overlap, because butt-joining tiles with no margin is very hard to do neatly.' },
      { type: 'h2', html: 'Fix the page size first' },
      { type: 'p', html: 'All three break in the same way if the source pages are inconsistent. A document mixing A4 and Letter, or portrait and landscape, will produce a grid where some cells are scaled differently and nothing lines up.' },
      { type: 'p', html: '<a href="/fix-page-size">Fix page size</a> normalises everything before you impose. It takes seconds and removes the most common cause of a result that looks almost right.' },
      { type: 'h2', html: 'Why produce a file instead of using the print dialog' },
      { type: 'ul', items: [
        '<strong>You can inspect it.</strong> Open the result and look before printing eighty sheets.',
        '<strong>It is reproducible.</strong> The same file prints identically anywhere; a print dialog setting does not survive being sent to a colleague.',
        '<strong>Print shops want a file.</strong> "Please print this 2-up" is an instruction that gets misread. An imposed PDF is not.',
        '<strong>It is shareable.</strong> A booklet-imposed PDF can be emailed to whoever has the good printer.',
        '<strong>Applications disagree.</strong> Reader, Preview, Chrome and the OS print pane all implement these settings differently, or not at all.',
      ] },
      { type: 'p', html: 'All three tools <a href="/blog/edit-pdf-without-uploading">run in your browser</a>, which matters more than it might seem: documents heading to a print shop are frequently drafts, contracts or plans that have not been published yet.' },
    ],
    faqs: [
      { question: 'What does N-up printing mean?', answer: 'Placing several document pages onto one sheet in a grid — 2-up puts two pages side by side, 4-up a 2×2 grid, and so on. Pages are scaled down to fit, which is why readability sets the practical limit.' },
      { question: 'What is the difference between 2-up and booklet printing?', answer: 'Both put two pages on a side, but booklet imposition reorders the pages so they read correctly once the sheets are folded and nested. In an eight-page booklet the outer sheet carries pages 8 and 1. Use N-up to save paper, booklet imposition if you will fold and staple it.' },
      { question: 'How do I print a large poster across multiple pages?', answer: 'Posterizing tiles one page across a grid of sheets with overlap margins for alignment. Check the source resolution first — enlarging a low-resolution page magnifies every flaw — and keep the overlap so the tiles can be aligned and taped.' },
      { question: 'Why does my N-up output look misaligned?', answer: 'Usually because the source document mixes page sizes or orientations, so cells scale differently. Normalising every page to one size before imposing fixes it.' },
      { question: 'How small is too small for 4-up printing?', answer: '4-up quarters the page area, rendering 11pt body text at roughly 5.5pt. That is readable for review but tiring to read at length. For anything you will actually read, 2-up is the safer choice.' },
    ],
  },
};

export const blogRoutes = Object.keys(blogPosts);

/** Newest first — used by the blog index and the prerendered listing.
 *  Date-only and full-timestamp values share a `YYYY-MM-DD` prefix, so a string
 *  compare still orders a mixed archive correctly. */
export const blogPostsByDate = () =>
  Object.values(blogPosts).sort((a, b) => b.published.localeCompare(a.published));

/**
 * The one place a post date is turned into display text, so the React pages and
 * the prerendered HTML cannot drift apart. Accepts either accepted `published`
 * format and trims it to the day.
 *
 * Formatted in UTC deliberately: a date-only value carries no zone, and letting
 * it render in the reader's would show the previous day west of Greenwich.
 */
export const blogDateLabel = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

export const PILLAR_ROUTE = '/blog/edit-pdf-without-uploading';
