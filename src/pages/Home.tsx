import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Images,
  Layers3,
  Lock,
  PenLine,
  Search,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { RecentlyUsedTools } from '../components/RecentlyUsedTools';
import { discoverableTools, getToolStatus, plannedTools, type ToolDefinition } from '../data/toolRegistry';
import heroImage from '../assets/hero.png';

const POPULAR_SLUGS = [
  '/merge',
  '/split',
  '/compress',
  '/images-to-pdf',
  '/pdf-to-images',
  '/extract-text',
  '/watermark-pdf',
  '/redact-pdf',
];

type WorkflowId =
  | 'organize-pdfs'
  | 'convert-files'
  | 'edit-annotate'
  | 'extract-content'
  | 'optimize-repair'
  | 'protect-clean'
  | 'ai-tools'
  | 'image-tools'
  | 'workflows';

const WORKFLOWS: Record<WorkflowId, { label: string; shortLabel: string; intent: string; icon: LucideIcon; keywords: string }> = {
  'organize-pdfs': {
    label: 'Organize PDFs',
    shortLabel: 'Organize',
    intent: 'Merge, split, reorder, rotate, extract, and prepare pages.',
    icon: Layers3,
    keywords: 'pages merge split reorder rotate delete organize booklet n-up overlay',
  },
  'convert-files': {
    label: 'Convert Files',
    shortLabel: 'Convert',
    intent: 'Create PDFs from images, documents, and web pages, or export PDFs into other formats.',
    icon: FileText,
    keywords: 'convert jpg jpeg png webp svg bmp heic tiff image text json markdown pdf html scan camera pdfa archive',
  },
  'edit-annotate': {
    label: 'Edit & Annotate',
    shortLabel: 'Edit',
    intent: 'Add text, stamps, watermarks, signatures, forms, and redactions.',
    icon: PenLine,
    keywords: 'edit annotate sign signature watermark redact stamp form fill crop header footer text color',
  },
  'extract-content': {
    label: 'Extract Content',
    shortLabel: 'Extract',
    intent: 'Pull out text, images, metadata, JSON, Markdown, and reusable page content.',
    icon: ImageIcon,
    keywords: 'extract text ocr images metadata json markdown word excel sheets slides docx pptx xlsx content',
  },
  'optimize-repair': {
    label: 'Optimize & Repair',
    shortLabel: 'Optimize',
    intent: 'Compress, check dimensions, resize pages, and improve scans.',
    icon: Wrench,
    keywords: 'compress smaller reduce optimize repair fix size dimensions deskew scan private',
  },
  'protect-clean': {
    label: 'Protect & Clean',
    shortLabel: 'Secure',
    intent: 'Remove metadata, flatten forms, sanitize, and redact sensitive text.',
    icon: ShieldCheck,
    keywords: 'protect clean private security sanitize flatten redact remove metadata safe sensitive',
  },
  'ai-tools': {
    label: 'AI Tools',
    shortLabel: 'AI',
    intent: 'Summarize, translate, chat with, and extract structured data from PDFs using AI.',
    icon: BrainCircuit,
    keywords: 'ai artificial intelligence summarize summary translate language chat ask question extract data rewrite simplify',
  },
  'image-tools': {
    label: 'Image Tools',
    shortLabel: 'Images',
    intent: 'Compress, resize, crop, convert, watermark, and edit images directly in your browser.',
    icon: Images,
    keywords: 'image photo compress resize crop rotate convert jpg png webp upscale background watermark blur meme editor',
  },
  'workflows': {
    label: 'Image Workflows',
    shortLabel: 'Workflows',
    intent: 'Format images for passports, social media, e-commerce, scan documents to PDF, and generate favicons.',
    icon: ImageIcon,
    keywords: 'workflow passport photo social media resize ecommerce product scan pdf favicon icon formatter batch',
  },
};

const QUICK_INTENTS = [
  { label: 'Combine files', query: 'merge' },
  { label: 'Split pages', query: 'pages split' },
  { label: 'Make smaller', query: 'compress' },
  { label: 'JPG tools', query: 'jpg' },
  { label: 'Signature', query: 'signature' },
  { label: 'Extract text', query: 'extract text' },
  { label: 'Add watermark', query: 'watermark' },
  { label: 'AI tools', query: 'ai' },
  { label: 'Image tools', query: 'image' },
];

const TOOL_ALIASES: Record<string, string> = {
  '/merge': 'combine join append bundle files',
  '/split': 'separate pages page ranges extract',
  '/compress': 'smaller reduce filesize size optimize private',
  '/pdf-to-images': 'jpg jpeg png export convert pages image',
  '/images-to-pdf': 'jpg jpeg png webp photo image combine convert',
  '/extract-text': 'ocr copy words scanned private',
  '/watermark-pdf': 'brand stamp draft confidential overlay',
  '/redact-pdf': 'hide sensitive private black out remove',
  '/sign-pdf': 'signature signing draw initials',
  '/pdf-to-docx': 'word doc docx text extract copy',
  '/pdf-to-excel': 'excel sheets xlsx table text extract',
  '/pdf-to-pptx': 'powerpoint slides pptx text extract',
  '/page-dimensions': 'size inspect measure width height',
  '/remove-metadata': 'private privacy clean author title hidden data',
  '/sanitize-pdf': 'private privacy clean hidden data scripts',
};

const getWorkflowId = (tool: ToolDefinition): WorkflowId => {
  if (tool.category === 'organize-manage') return 'organize-pdfs';
  if (tool.category === 'edit-annotate') return 'edit-annotate';
  if (tool.category === 'optimize-repair') return 'optimize-repair';
  if (tool.category === 'secure-pdf') return 'protect-clean';
  if (tool.category === 'ai-tools') return 'ai-tools';
  if (tool.category === 'image-tools') return 'image-tools';
  if (tool.category === 'workflows') return 'workflows';
  if (tool.category === 'convert-to-pdf') return 'convert-files';

  if ([
    '/extract-text',
    '/extract-images',
    '/pdf-to-json',
    '/pdf-to-markdown',
    '/pdf-to-docx',
    '/pdf-to-excel',
    '/pdf-to-pptx',
  ].includes(tool.slug)) {
    return 'extract-content';
  }

  return 'convert-files';
};

const getToolSearchText = (tool: ToolDefinition) =>
  [
    tool.title,
    tool.shortTitle,
    tool.description,
    tool.searchAliases ?? '',
    WORKFLOWS[getWorkflowId(tool)].label,
    WORKFLOWS[getWorkflowId(tool)].intent,
    WORKFLOWS[getWorkflowId(tool)].keywords,
    TOOL_ALIASES[tool.slug] ?? '',
    'private local browser no upload secure',
  ]
    .join(' ')
    .toLowerCase();

const getStatusLabel = (tool: ToolDefinition) => {
  const status = getToolStatus(tool);
  if (status === 'coming-soon') return 'Coming soon';
  if (status === 'beta') return 'Beta';
  return 'Ready';
};

const ToolCard = ({ tool }: { tool: ToolDefinition }) => {
  const Icon = tool.icon;
  const status = getStatusLabel(tool);
  const showStatus = status !== 'Ready';

  return (
    <Link
      to={tool.slug}
      className="group flex h-full flex-col rounded-xl border border-border bg-card/60 backdrop-blur-sm transition-all hover:border-foreground/30 hover:shadow-md"
    >
      <div className={`flex items-center gap-3 rounded-t-xl bg-gradient-to-r ${tool.gradientClassName} px-4 py-3`}>
        <Icon className="h-5 w-5 text-white" />
        <span className="text-sm font-bold text-white">{tool.shortTitle}</span>
        {showStatus ? (
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${status === 'Beta' ? 'bg-white/20 text-white' : 'bg-white/20 text-white'}`}>
            {status}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-bold text-foreground">{tool.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
        <div className="mt-auto flex items-center gap-1 pt-3 text-sm font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
          Open <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
};

const PopularToolCard = ({ tool }: { tool: ToolDefinition }) => {
  const Icon = tool.icon;

  return (
    <Link
      to={tool.slug}
      className="group relative flex flex-col items-center gap-3 rounded-xl border border-border bg-card/60 p-5 text-center backdrop-blur-sm transition-all hover:border-foreground/30 hover:shadow-md"
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.gradientClassName} text-white shadow-sm`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">{tool.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
};

export const Home = () => {
  const [search, setSearch] = useState('');
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowId | 'all'>('all');

  const tools = useMemo(() => discoverableTools, []);
  const popularTools = POPULAR_SLUGS
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool));

  const filteredTools = tools.filter((tool) => {
    const workflowMatches = activeWorkflow === 'all' || getWorkflowId(tool) === activeWorkflow;
    const terms = search
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean);

    if (!workflowMatches) return false;
    if (terms.length === 0) return true;

    const haystack = getToolSearchText(tool);
    return terms.every((term) => haystack.includes(term));
  });

  const groupedTools = (Object.keys(WORKFLOWS) as WorkflowId[])
    .map((workflow) => ({
      workflow,
      tools: tools.filter((tool) => getWorkflowId(tool) === workflow),
    }))
    .filter((group) => group.tools.length > 0);

  const isFiltering = search.length > 0 || activeWorkflow !== 'all';

  return (
    <div>
      <PageSeo
        title="FilePilot — PDF, Image and File Tools"
        description="Edit, convert, compress, organise and optimise PDFs, images and files with FilePilot. Your files are processed privately in your browser."
      />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-card/20">
        <div className="container py-6 md:py-8">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,500px)] xl:gap-10">
            <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground md:text-sm">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                100% private — files never leave your device
              </div>

              <h1 className="hero-color-shift text-2xl font-bold leading-tight md:text-4xl lg:text-[2.75rem]">
                Your complete workspace for PDFs, images, conversions and AI-powered file tasks.
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base lg:mx-0">
                One place for every file task — from PDFs and images to smart AI tools. Process everything securely and privately, right in your browser.
              </p>

              <div className="mx-auto mt-5 max-w-2xl lg:mx-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="tool-search"
                    type="search"
                    placeholder="Search tools — merge, compress, JPG, signature, AI, image..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      if (event.target.value) setActiveWorkflow('all');
                    }}
                    className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 md:text-base"
                  />
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5 lg:justify-start">
                  {QUICK_INTENTS.map((intent) => (
                    <button
                      key={intent.label}
                      type="button"
                      onClick={() => {
                        setSearch(intent.query);
                        setActiveWorkflow('all');
                      }}
                      className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground md:text-sm"
                    >
                      {intent.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[190px] sm:max-w-[260px] md:max-w-sm lg:mx-0 lg:max-w-none">
              <img
                src={heroImage}
                alt="FilePilot PDF, image and file tools preview"
                className="h-auto max-h-[180px] w-full select-none object-contain sm:max-h-[240px] md:max-h-[390px]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Category tabs ───────────────────────────────────────────── */}
      <section className="sticky top-16 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container">
          <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 py-2 md:mx-0 md:gap-1.5 md:px-0">
            <button
              type="button"
              onClick={() => { setActiveWorkflow('all'); setSearch(''); }}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeWorkflow === 'all' && !search ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
            >
              All Tools
            </button>
            {(Object.keys(WORKFLOWS) as WorkflowId[]).map((workflow) => {
              const info = WORKFLOWS[workflow];
              const Icon = info.icon;
              const isActive = activeWorkflow === workflow;

              return (
                <button
                  key={workflow}
                  type="button"
                  onClick={() => { setActiveWorkflow(isActive ? 'all' : workflow); setSearch(''); }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {info.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Popular tools ───────────────────────────────────────────── */}
      {!isFiltering && (
        <section className="border-b border-border bg-card/10">
          <div className="container py-10 md:py-12">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Most popular</p>
                </div>
                <h2 className="text-2xl font-bold text-foreground">Start with a common task</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {plannedTools.length} more tools are planned and will appear here when ready.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {popularTools.map((tool) => (
                <PopularToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
            <RecentlyUsedTools />
          </div>
        </section>
      )}

      {/* ── Tool listing ────────────────────────────────────────────── */}
      <section className="container py-10 md:py-12">
        {/* Filter status header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {isFiltering ? 'Results' : 'All tools'}
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              {filteredTools.length} tool{filteredTools.length === 1 ? '' : 's'}{isFiltering ? ' found' : ' available'}
            </h2>
          </div>
          {isFiltering && (
            <button
              type="button"
              onClick={() => { setSearch(''); setActiveWorkflow('all'); }}
              className="self-start rounded-lg border border-border bg-card/60 px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/60 md:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Empty state */}
        {filteredTools.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-10 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-bold text-foreground">No matching tool</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Try a different search like compress, split, image, text, watermark, or AI.
            </p>
          </div>
        ) : isFiltering ? (
          /* Flat filtered grid */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          /* Grouped by category */
          <div className="space-y-12">
            {groupedTools.map(({ workflow, tools: workflowTools }) => {
              const info = WORKFLOWS[workflow];
              const Icon = info.icon;

              return (
                <div key={workflow}>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{info.label}</h3>
                        <p className="text-sm text-muted-foreground">{info.intent}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {workflowTools.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {workflowTools.map((tool) => (
                      <ToolCard key={tool.slug} tool={tool} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Privacy footer ──────────────────────────────────────────── */}
      <section className="container pb-12 md:pb-16">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold text-foreground">Private by default</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                FilePilot is a private, browser-based toolkit to edit, convert, optimise and organise PDFs, images and files. No uploads, no server-side processing, no data collection.
              </p>
            </div>
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              Privacy details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
