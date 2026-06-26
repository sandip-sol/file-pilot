import { Link, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ArrowRight, Home, Search, ShieldCheck } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { discoverableTools, getToolStatus, toolRegistry, type ToolDefinition } from '../data/toolRegistry';

const POPULAR_SLUGS = [
  '/merge',
  '/split',
  '/compress',
  '/images-to-pdf',
  '/pdf-to-images',
  '/extract-text',
];

const getStatusLabel = (tool: ToolDefinition) => {
  const status = getToolStatus(tool);
  if (status === 'coming-soon') return 'Coming soon';
  if (status === 'beta') return 'Beta';
  if (status === 'hidden') return 'Unavailable';
  return 'Ready';
};

const ToolLink = ({ tool }: { tool: ToolDefinition }) => {
  const Icon = tool.icon;
  const status = getStatusLabel(tool);

  return (
    <Link to={tool.slug} className="group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tool.gradientClassName} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === 'Ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {status}
        </span>
      </div>
      <h2 className="text-base font-bold text-foreground">{tool.title}</h2>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-foreground">
        Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};

export const NotFound = () => {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const requestedTool = toolRegistry.find((tool) => tool.slug === location.pathname);
  const requestedStatus = requestedTool ? getToolStatus(requestedTool) : null;

  const popularTools = POPULAR_SLUGS
    .map((slug) => discoverableTools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool));

  const results = useMemo(() => {
    const terms = search
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean);

    if (terms.length === 0) return popularTools;

    return discoverableTools.filter((tool) => {
      const haystack = `${tool.title} ${tool.shortTitle} ${tool.description} ${tool.searchAliases ?? ''}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [popularTools, search]);

  const isPlannedTool = requestedTool && requestedStatus === 'coming-soon';
  const isUnavailableTool = requestedTool && requestedStatus === 'hidden';

  return (
    <main className="bg-background">
      <PageSeo
        title={isPlannedTool ? `${requestedTool.title} - Coming Soon` : 'Tool Not Found - FilePilot'}
        description="Find a reliable FilePilot tool for merging, splitting, compressing, converting, extracting, watermarking, or redacting PDF files."
        canonicalPath="/"
        robots="noindex,follow"
      />

      <section className="border-b border-border bg-card/40">
        <div className="container py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-background">
              {isPlannedTool ? <ShieldCheck className="h-6 w-6" /> : <Search className="h-6 w-6" />}
            </div>
            <p className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
              {isPlannedTool ? 'Coming soon' : isUnavailableTool ? 'Not available' : 'Tool not found'}
            </p>
            <h1 className="text-3xl font-bold text-foreground md:text-5xl">
              {isPlannedTool
                ? `${requestedTool.title} is not ready yet.`
                : isUnavailableTool
                  ? `${requestedTool.title} is not published.`
                  : 'That tool is not available.'}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {isPlannedTool
                ? 'We hide planned tools from the main catalog until they are reliable enough to use. Try one of the ready tools below.'
                : 'Use search or start with one of the reliable tools below.'}
            </p>
            <div className="mt-6 flex justify-center">
              <Link to="/" className="btn btn-primary">
                <Home className="h-4 w-4" />
                Back to tool finder
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-10">
        <div className="mx-auto max-w-3xl">
          <label htmlFor="not-found-search" className="mb-2 block text-sm font-semibold text-foreground">
            Search ready tools
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="not-found-search"
              type="search"
              placeholder="Try merge, split, compress, watermark, extract text..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-border bg-card py-4 pl-12 pr-4 text-base text-foreground outline-none transition focus:ring-2 focus:ring-foreground/20"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((tool) => (
            <ToolLink key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </main>
  );
};
