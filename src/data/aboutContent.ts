/**
 * Content for /about (Phase 3.3, pulled forward because Phase 2.3 depends on it).
 *
 * Google discounts anonymous utility sites, and the blogger-outreach template in
 * docs/PHASE2_BACKLINKS.md opens with "I maintain FilePilot" — the first thing a
 * recipient does is look for who that is. An About page is the landing point for
 * that, and the press-kit block below is what saves them asking for assets.
 *
 * Every claim here is verifiable from the repository or from the running site.
 * Do not add anything that is not.
 */

export interface MaintainerProfile {
  label: string;
  url: string;
}

export interface Maintainer {
  /** Name to publish. A real name is the whole point — a handle is much weaker. */
  name: string;
  /** e.g. "Maintainer" or "Founder and maintainer". */
  role: string;
  /** Two or three sentences, first person: background, and why you built this. */
  bio: string[];
  location?: string;
  /** Published publicly — use an address you are happy to have scraped. */
  email?: string;
  profiles?: MaintainerProfile[];
}

/**
 * THIS IS DELIBERATELY NULL.
 *
 * The page renders without a named maintainer rather than inventing one — a
 * fabricated identity on an E-E-A-T page is worse than none. Fill this in and the
 * "Who builds FilePilot" section plus the `Person` / `Organization.founder`
 * schema appear automatically. `seoValidate` warns while it is unset.
 *
 * TO ACTIVATE: replace `null` with the block below, and put your real name in.
 * The bio is a draft in your voice — edit it so it is actually true of you. It
 * contains no biographical claims on purpose; add the ones that are yours
 * (what you do, how long you have been doing it, what prompted this).
 *
 *   export const maintainer: Maintainer | null = {
 *     name: 'YOUR REAL NAME',
 *     role: 'Maintainer',
 *     bio: [
 *       'I build and maintain FilePilot on my own. It started as a tool I wanted for '
 *         + 'myself: somewhere to merge or compress a document without handing a copy '
 *         + 'of it to a company I know nothing about.',
 *       'Everything here runs in your browser, which is a harder way to build these '
 *         + 'tools and the only way I could make the privacy claim something you can '
 *         + 'check rather than something you have to believe.',
 *     ],
 *     email: 'singh101vault@gmail.com',
 *     profiles: [{ label: 'GitHub', url: 'https://github.com/sandip-sol' }],
 *   };
 */
export const maintainer: Maintainer | null = null;

export const GITHUB_REPO_URL = 'https://github.com/sandip-sol/file-pilot';

export interface AboutSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export const aboutSections: AboutSection[] = [
  {
    heading: 'What FilePilot is',
    paragraphs: [
      'FilePilot is a free collection of more than 90 tools for PDFs and images — merging, splitting, compressing, converting, reordering, redacting, signing, watermarking, extracting text, stripping metadata, and a set of AI-assisted image tools. It runs as a web page. There is nothing to install, no account to create, and no paid tier.',
      'What makes it different from the other free PDF sites is not the tool list. It is that none of those tools upload your file.',
    ],
  },
  {
    heading: 'Why it exists',
    paragraphs: [
      'Almost every free online PDF tool works the same way: you upload your document, their server processes it, and you download the result. For a recipe or a holiday photo that is fine. For a signed contract, a payslip, a medical letter or a scan of your passport, it means handing a copy of that document to a company you know nothing about, to be handled by software you cannot inspect, under a retention policy you have to take on trust.',
      'Those companies are not doing anything underhand — they publish their deletion policies and most honour them. But a policy is a promise, and a promise is only as good as the organisation making it. The interesting question is whether the upload needs to happen at all.',
      'It does not. Browsers can now run compiled code fast enough to do this work locally. So FilePilot does the processing on your own device and never puts your document on the network. That turns a promise into a property of the architecture: there is no server-side copy to leak, to retain, to hand over, or to forget to delete, because one is never created.',
    ],
  },
  {
    heading: 'How it actually works',
    paragraphs: [
      'The PDF engine is compiled to WebAssembly and shipped to your browser along with the page. When you pick a file, it is read into memory in your tab, operated on there, and written back out as a download. The network is not involved after the page has loaded.',
    ],
    bullets: [
      'pdf-lib and @pdf-lib/fontkit — reading, writing and font embedding for PDFs.',
      'pdfjs-dist — Mozilla\'s PDF renderer, used for page previews and rasterisation.',
      'The Canvas API — pixel work for image conversion, cropping, compression and rendering pages to images.',
      'Web Workers — heavy jobs run off the main thread so the interface stays responsive.',
      'tesseract.js — optical character recognition, running locally rather than on a server.',
      'ONNX Runtime Web and @imgly/background-removal — the AI image tools. The models are served from this site and execute in your browser; the images are not sent anywhere.',
      'JSZip — building ZIP archives in the browser for tools that produce many files.',
    ],
  },
  {
    heading: 'How to check that claim yourself',
    paragraphs: [
      'You should not take this on trust either. It is a claim you can falsify in about thirty seconds, which is the main advantage of doing the work client-side.',
    ],
    bullets: [
      'Open your browser\'s developer tools, switch to the Network tab, and run any tool. You will see the page and its code load, and no request carrying your file.',
      'Or load the site, disconnect from the network, and keep working. Most tools continue to function because the code is already in your browser.',
      'The site also sends a Content-Security-Policy with connect-src \'self\', which instructs your browser to block any network request to another host — so even a mistake could not quietly send your file somewhere.',
    ],
  },
  {
    heading: 'How it is paid for',
    paragraphs: [
      'It mostly is not, which is the honest answer. Because the processing happens on your device, there are no per-file server costs to recover — that is why there is no paid tier and no usage meter.',
      'There are no ads, no trackers, no analytics, no affiliate links and no account system. Nothing about your usage is collected, because there is no server receiving anything to collect. There is an optional donation link; it opens a hosted payment page in a new tab, and no payment or donation code is embedded in this site.',
    ],
  },
  {
    heading: 'What FilePilot deliberately does not do',
    paragraphs: [
      'Running in a browser tab is what keeps your file private. It is also what sets the limits, and it would be dishonest to list only the upsides.',
    ],
    bullets: [
      'Very large documents can exhaust the memory a browser will give one tab. A server-based tool or a desktop application will handle those better.',
      'Local OCR is real but weaker than the server-side engines that Adobe, Smallpdf and PDF24 run. For large scanned archives, use one of those.',
      'Faithful conversion to Word, Excel or PowerPoint depends on engines that currently only run server-side. FilePilot extracts text and converts to Markdown, JSON or plain text instead.',
      'Signatures are visual. FilePilot does not issue or validate certificate-based digital signatures, so it is not a substitute for Acrobat or a dedicated e-signature provider where a validated certificate is required.',
      'There are no accounts, no cloud storage, no sync and no shared workspaces. Storing nothing is the design, not a missing feature.',
    ],
  },
  {
    heading: 'Not affiliated with other products called FilePilot',
    paragraphs: [
      'The name is unfortunately a busy one. FilePilot at filepilot.space is a website for working with PDFs and images in a browser. It is not connected to File Pilot, the Windows file-manager application at filepilot.tech, nor to the FilePilot iOS app, nor to any other site using a similar name. No affiliation is claimed or implied in either direction.',
    ],
  },
];

/** Ready-to-use boilerplate so a writer never has to ask for it (Phase 2.3/2.6). */
export const pressKit = {
  boilerplate:
    'FilePilot is a free collection of over 90 PDF and image tools that run entirely in the user\'s browser. Unlike server-based alternatives, it never uploads files: documents are processed locally using WebAssembly and the Canvas API, so they never leave the user\'s device. There is no account, no watermark and no paid tier.',
  oneLiner: 'Free browser-based PDF and image tools that never upload your files.',
  assets: [
    { label: 'Social preview image (1200×630 PNG)', url: '/og-image.png' },
    { label: 'Logo (SVG)', url: '/filepilot_logo.svg' },
  ],
  linkablePages: [
    { label: 'All PDF tools', route: '/pdf-tools' },
    { label: 'All image tools', route: '/image-tools' },
    { label: 'Smallpdf alternative — with an honest list of where Smallpdf wins', route: '/smallpdf-alternative' },
    { label: 'Why files should never leave your browser', route: '/blog/why-files-stay-in-browser' },
    { label: 'Privacy policy', route: '/privacy' },
  ],
};
