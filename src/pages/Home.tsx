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
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { toolRegistry, type ToolCategory, type ToolDefinition } from '../data/toolRegistry';

const READY_TOOL_SLUGS = new Set([
  '/merge',
  '/split',
  '/organize-pdf',
  '/rotate-pdf',
  '/delete-pages',
  '/extract-pages',
  '/reverse-pdf',
  '/add-blank-page',
  '/alternate-merge',
  '/n-up-pdf',
  '/overlay-pdf',
  '/divide-pages',
  '/combine-single-page',
  '/grid-combine',
  '/posterize-pdf',
  '/add-page-labels',
  '/pdf-metadata',
  '/pdf-to-zip',
  '/compare-pdf',
  '/pdf-booklet',
  '/annotate-pdf',
  '/watermark-pdf',
  '/redact-pdf',
  '/sign-pdf',
  '/crop-pdf',
  '/bookmark',
  '/table-of-contents',
  '/page-numbers',
  '/header-footer',
  '/background-color',
  '/add-stamp',
  '/remove-annotations',
  '/form-filler',
  '/form-creator',
  '/images-to-pdf',
  '/jpg-to-pdf',
  '/png-to-pdf',
  '/webp-to-pdf',
  '/svg-to-pdf',
  '/bmp-to-pdf',
  '/text-to-pdf',
  '/json-to-pdf',
  '/markdown-to-pdf',
  '/pdf-to-images',
  '/pdf-to-jpg',
  '/pdf-to-png',
  '/pdf-to-webp',
  '/pdf-to-tiff',
  '/pdf-to-svg',
  '/pdf-to-greyscale',
  '/pdf-to-json',
  '/pdf-to-markdown',
  '/extract-text',
  '/extract-images',
  '/pdf-to-cbz',
  '/rasterize-pdf',
  '/compress',
  '/fix-page-size',
  '/page-dimensions',
  '/sanitize-pdf',
  '/find-and-redact',
  '/flatten-pdf',
  '/remove-metadata',
  '/image-requirements',
]);

const BETA_TOOL_SLUGS = new Set([
  '/remove-blank-pages',
  '/heic-to-pdf',
  '/tiff-to-pdf',
  '/repair-pdf',
  '/deskew-pdf',
]);

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

const CATEGORY_INFO: Record<ToolCategory, { label: string; intent: string; icon: LucideIcon }> = {
  'organize-manage': {
    label: 'Organize PDFs',
    intent: 'Merge, split, reorder, rotate, extract, and prepare pages.',
    icon: Layers3,
  },
  'edit-annotate': {
    label: 'Edit and Mark Up',
    intent: 'Add text, stamps, watermarks, signatures, forms, and redactions.',
    icon: PenLine,
  },
  'convert-to-pdf': {
    label: 'Create PDFs',
    intent: 'Turn images, text, JSON, and Markdown into clean PDF files.',
    icon: FileText,
  },
  'convert-from-pdf': {
    label: 'Export From PDF',
    intent: 'Extract text, images, pages, JSON, Markdown, and raster outputs.',
    icon: ImageIcon,
  },
  'optimize-repair': {
    label: 'Optimize and Inspect',
    intent: 'Compress, check dimensions, resize pages, and improve scans.',
    icon: Wrench,
  },
  'secure-pdf': {
    label: 'Clean and Protect',
    intent: 'Remove metadata, flatten forms, sanitize, and redact sensitive text.',
    icon: ShieldCheck,
  },
};

const QUICK_INTENTS = [
  { label: 'Combine files', query: 'merge' },
  { label: 'Split pages', query: 'split extract pages' },
  { label: 'Make smaller', query: 'compress' },
  { label: 'Images to PDF', query: 'images to pdf' },
  { label: 'PDF to images', query: 'pdf images' },
  { label: 'Extract text', query: 'extract text ocr' },
  { label: 'Add watermark', query: 'watermark' },
  { label: 'Hide sensitive text', query: 'redact' },
];

const getDiscoverableTools = () =>
  toolRegistry.filter((tool) => READY_TOOL_SLUGS.has(tool.slug) || BETA_TOOL_SLUGS.has(tool.slug));

const getToolSearchText = (tool: ToolDefinition) =>
  [
    tool.title,
    tool.shortTitle,
    tool.description,
    CATEGORY_INFO[tool.category].label,
    CATEGORY_INFO[tool.category].intent,
  ]
    .join(' ')
    .toLowerCase();

const getStatus = (tool: ToolDefinition) => (BETA_TOOL_SLUGS.has(tool.slug) ? 'Beta' : 'Ready');

const ToolCard = ({ tool, compact = false }: { tool: ToolDefinition; compact?: boolean }) => {
  const Icon = tool.icon;
  const status = getStatus(tool);

  return (
    <Link
      to={tool.slug}
      className="group flex h-full flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/70"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.gradientClassName} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === 'Ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {status}
        </span>
      </div>
      <h3 className="text-base font-bold text-foreground">{tool.title}</h3>
      <p className={`mt-1 text-sm leading-relaxed text-muted-foreground ${compact ? 'line-clamp-2' : ''}`}>
        {tool.description}
      </p>
      <div className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-foreground">
        Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};

export const Home = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');

  const tools = useMemo(() => getDiscoverableTools(), []);
  const popularTools = POPULAR_SLUGS
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool));

  const filteredTools = tools.filter((tool) => {
    const categoryMatches = activeCategory === 'all' || tool.category === activeCategory;
    const terms = search
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean);

    if (!categoryMatches) return false;
    if (terms.length === 0) return true;

    const haystack = getToolSearchText(tool);
    return terms.every((term) => haystack.includes(term));
  });

  const groupedTools = (Object.keys(CATEGORY_INFO) as ToolCategory[])
    .map((category) => ({
      category,
      tools: tools.filter((tool) => tool.category === category),
    }))
    .filter((group) => group.tools.length > 0);

  return (
    <div className="bg-background">
      <PageSeo
        title="Find the Right PDF Tool - Private Browser Tools"
        description="Quickly find trusted browser-based PDF and image tools for merging, splitting, compressing, converting, extracting, watermarking, and redacting files."
      />

      <section className="border-b border-border bg-card/40">
        <div className="container py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-foreground" />
                Fast local tools, shown by readiness
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight text-foreground md:text-5xl">
                Find the right PDF tool in seconds.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Search by what you want to do, then open a focused tool with local processing, clear settings, and a download you control.
              </p>
            </div>

            <div className="grid gap-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-emerald-600" />
                Files stay in your browser tab
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Working tools are separated from beta tools
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                Tool pages show settings before download
              </div>
            </div>
          </div>

          <div id="tools" className="mt-8 rounded-lg border border-border bg-background p-4 shadow-sm md:p-5">
            <label htmlFor="tool-search" className="mb-2 block text-sm font-semibold text-foreground">
              What do you need to do?
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="tool-search"
                type="search"
                placeholder="Try merge, compress, extract text, watermark, redact..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-border bg-card py-4 pl-12 pr-4 text-base text-foreground outline-none transition focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_INTENTS.map((intent) => (
                <button
                  key={intent.label}
                  type="button"
                  onClick={() => {
                    setSearch(intent.query);
                    setActiveCategory('all');
                  }}
                  className="rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {intent.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-10">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">Popular</p>
            <h2 className="text-2xl font-bold text-foreground">Start with a common task</h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            These are the clearest, most useful workflows to keep near the top.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} compact />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container py-8 md:py-10">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground">Workflows</p>
              <h2 className="text-2xl font-bold text-foreground">Browse by outcome</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="self-start rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted md:self-auto"
            >
              Show all
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(CATEGORY_INFO) as ToolCategory[]).map((category) => {
              const info = CATEGORY_INFO[category];
              const Icon = info.icon;
              const count = tools.filter((tool) => tool.category === category).length;
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? 'all' : category)}
                  className={`rounded-lg border p-4 text-left transition-colors ${isActive ? 'border-foreground bg-background' : 'border-border bg-background hover:bg-muted'}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-foreground">{info.label}</span>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{info.intent}</p>
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
              {search || activeCategory !== 'all' ? 'Results' : 'Ready tools'}
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              {filteredTools.length} tool{filteredTools.length === 1 ? '' : 's'} available
            </h2>
          </div>
          {(search || activeCategory !== 'all') ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveCategory('all');
              }}
              className="self-start rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted md:self-auto"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {filteredTools.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-bold text-foreground">No matching ready tool</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Try a simpler action like compress, split, image, text, watermark, or redact.
            </p>
          </div>
        ) : search || activeCategory !== 'all' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {groupedTools.map(({ category, tools: categoryTools }) => {
              const info = CATEGORY_INFO[category];
              const Icon = info.icon;

              return (
                <div key={category}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{info.label}</h3>
                      <p className="text-sm text-muted-foreground">{info.intent}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {categoryTools.map((tool) => (
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
        <div className="rounded-lg border border-border bg-card p-5 md:p-6">
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
