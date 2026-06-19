import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Layers3,
  Lock,
  PenLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { RecentlyUsedTools } from '../components/RecentlyUsedTools';
import { discoverableTools, getToolStatus, plannedTools, type ToolDefinition } from '../data/toolRegistry';

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
  | 'protect-clean';

const WORKFLOWS: Record<WorkflowId, { label: string; intent: string; icon: LucideIcon; keywords: string }> = {
  'organize-pdfs': {
    label: 'Organize PDFs',
    intent: 'Merge, split, reorder, rotate, extract, and prepare pages.',
    icon: Layers3,
    keywords: 'pages merge split reorder rotate delete organize booklet n-up overlay',
  },
  'convert-files': {
    label: 'Convert Files',
    intent: 'Create PDFs from images and documents, or export PDFs into image formats.',
    icon: FileText,
    keywords: 'convert jpg jpeg png webp svg bmp heic tiff image text json markdown pdf',
  },
  'edit-annotate': {
    label: 'Edit & Annotate',
    intent: 'Add text, stamps, watermarks, signatures, forms, and redactions.',
    icon: PenLine,
    keywords: 'edit annotate sign signature watermark redact stamp form fill crop header footer text color',
  },
  'extract-content': {
    label: 'Extract Content',
    intent: 'Pull out text, images, metadata, JSON, Markdown, and reusable page content.',
    icon: ImageIcon,
    keywords: 'extract text ocr images metadata json markdown word excel sheets slides docx pptx xlsx content',
  },
  'optimize-repair': {
    label: 'Optimize & Repair',
    intent: 'Compress, check dimensions, resize pages, and improve scans.',
    icon: Wrench,
    keywords: 'compress smaller reduce optimize repair fix size dimensions deskew scan private',
  },
  'protect-clean': {
    label: 'Protect & Clean',
    intent: 'Remove metadata, flatten forms, sanitize, and redact sensitive text.',
    icon: ShieldCheck,
    keywords: 'protect clean private security sanitize flatten redact remove metadata safe sensitive',
  },
};

const QUICK_INTENTS = [
  { label: 'Combine files', query: 'merge' },
  { label: 'Split pages', query: 'pages split' },
  { label: 'Make smaller', query: 'compress' },
  { label: 'JPG tools', query: 'jpg' },
  { label: 'Word text', query: 'word' },
  { label: 'Signature', query: 'signature' },
  { label: 'Images to PDF', query: 'images to pdf' },
  { label: 'PDF to images', query: 'pdf images' },
  { label: 'Extract text', query: 'extract text' },
  { label: 'Add watermark', query: 'watermark' },
  { label: 'Private cleanup', query: 'private' },
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

const ToolCard = ({ tool, compact = false }: { tool: ToolDefinition; compact?: boolean }) => {
  const Icon = tool.icon;
  const status = getStatusLabel(tool);
  const showStatus = status !== 'Ready';

  return (
    <Link
      to={tool.slug}
      className={`group flex h-full min-h-[150px] flex-col rounded-lg border border-border bg-card/60 backdrop-blur-sm p-3.5 transition-colors hover:border-foreground/40 hover:bg-muted/60 ${compact ? 'md:min-h-[140px]' : ''}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground">
          <Icon className="h-5 w-5" />
        </div>
        {showStatus ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === 'Beta' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
            {status}
          </span>
        ) : null}
      </div>
      <h3 className="line-clamp-1 text-sm font-bold text-foreground md:text-base">{tool.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {tool.description}
      </p>
      <div className="mt-auto flex items-center gap-1 pt-3 text-sm font-semibold text-foreground">
        Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
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

  return (
    <div>
      <PageSeo
        title="Find the Right PDF Tool - Private Browser Tools"
        description="Quickly find trusted browser-based PDF and image tools for merging, splitting, compressing, converting, extracting, watermarking, and redacting files."
      />

      <section className="border-b border-border bg-card/20">
        <div className="container py-10 md:py-14">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] xl:gap-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {tools.length} ready or beta tools. {plannedTools.length} planned tools hidden until reliable.
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight text-foreground md:text-5xl">
                Find the right PDF tool in seconds.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Search by what you want to do, then open a focused tool with local processing, clear settings, and a download you control.
              </p>

              <div id="tools" className="mt-6 rounded-lg border border-border bg-background/70 backdrop-blur-sm p-4 shadow-sm md:p-5">
                <label htmlFor="tool-search" className="mb-2 block text-sm font-semibold text-foreground">
                  What do you need to do?
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="tool-search"
                    type="search"
                    placeholder="Try jpg, word, signature, pages, compress, private, extract..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-lg border border-border bg-card py-4 pl-12 pr-4 text-base text-foreground outline-none transition focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
                <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible md:pb-0">
                  {QUICK_INTENTS.map((intent) => (
                    <button
                      key={intent.label}
                      type="button"
                      onClick={() => {
                        setSearch(intent.query);
                        setActiveWorkflow('all');
                      }}
                      className="shrink-0 rounded-full border border-border bg-card/60 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    >
                      {intent.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="grid min-w-0 max-w-full gap-3">
              <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-background/70 p-4 backdrop-blur-sm shadow-sm">
                <p className="text-sm font-semibold text-foreground">Private by design</p>
                <div className="mt-4 grid gap-3">
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Files stay in your browser tab</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Ready tools are separated from beta tools</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Tool pages show settings before download</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-background/70 p-4 backdrop-blur-sm shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Popular now</p>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Quick access
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  {popularTools.slice(0, 5).map((tool) => {
                    const Icon = tool.icon;

                    return (
                      <Link
                        key={tool.slug}
                        to={tool.slug}
                        className="group flex min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-border bg-card/50 p-3 text-sm transition-colors hover:bg-muted/60"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-foreground">{tool.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{tool.description}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
          <RecentlyUsedTools />
          <div className="mt-8">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-muted-foreground">Popular tools</p>
                <h2 className="text-2xl font-bold text-foreground">Start with a common task</h2>
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">
                Highest-confidence tools stay above the fold.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {popularTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} compact />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/20">
        <div className="container py-8 md:py-10">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground">Workflows</p>
              <h2 className="text-2xl font-bold text-foreground">Browse by outcome</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveWorkflow('all')}
              className="self-start rounded-lg border border-border bg-background/70 px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/60 md:self-auto"
            >
              Show all
            </button>
          </div>

          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
            {(Object.keys(WORKFLOWS) as WorkflowId[]).map((workflow) => {
              const info = WORKFLOWS[workflow];
              const Icon = info.icon;
              const count = tools.filter((tool) => getWorkflowId(tool) === workflow).length;
              const isActive = activeWorkflow === workflow;

              return (
                <button
                  key={workflow}
                  type="button"
                  onClick={() => setActiveWorkflow(isActive ? 'all' : workflow)}
                  className={`min-w-[230px] rounded-lg border p-3 text-left transition-colors md:min-w-0 ${isActive ? 'border-foreground bg-background/70 backdrop-blur-sm' : 'border-border bg-background/50 hover:bg-muted/60'}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-foreground">{info.label}</span>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{info.intent}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-10">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              {search || activeWorkflow !== 'all' ? 'Results' : 'Ready tools'}
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              {filteredTools.length} tool{filteredTools.length === 1 ? '' : 's'} available
            </h2>
          </div>
          {(search || activeWorkflow !== 'all') ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveWorkflow('all');
              }}
              className="self-start rounded-lg border border-border bg-card/60 px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/60 md:self-auto"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {filteredTools.length === 0 ? (
          <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-8 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-bold text-foreground">No matching ready tool</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Try a simpler action like compress, split, image, text, watermark, or redact.
            </p>
          </div>
        ) : search || activeWorkflow !== 'all' ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {groupedTools.map(({ workflow, tools: workflowTools }) => {
              const info = WORKFLOWS[workflow];
              const Icon = info.icon;

              return (
                <div key={workflow} className="border-t border-border pt-6 first:border-t-0 first:pt-0">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{info.label}</h3>
                      <p className="text-sm text-muted-foreground">{info.intent}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {workflowTools.map((tool) => (
                      <ToolCard key={tool.slug} tool={tool} compact />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="container pb-12 md:pb-16">
        <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold text-foreground">Confidence before download</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Tool pages now lead with local-processing cues at upload time. The next UX pass should add richer previews and file details to each high-traffic tool.
              </p>
            </div>
            <Link to="/privacy" className="btn btn-outline">
              Privacy details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
