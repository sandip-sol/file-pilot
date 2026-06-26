import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Images } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { discoverableTools, type ToolCategory, type ToolDefinition } from '../data/toolRegistry';

const IMAGE_CATEGORIES: { category: ToolCategory; label: string }[] = [
  { category: 'image-tools', label: 'Image Editing & Conversion' },
  { category: 'workflows', label: 'Image Workflows' },
  { category: 'ai-tools', label: 'AI-Powered Tools' },
];

const imageTools = discoverableTools.filter((t) =>
  IMAGE_CATEGORIES.some((c) => c.category === t.category),
);

const groupedImageTools = IMAGE_CATEGORIES.map(({ category, label }) => ({
  label,
  tools: imageTools.filter((t) => t.category === category),
})).filter((g) => g.tools.length > 0);

const ToolCard = ({ tool }: { tool: ToolDefinition }) => {
  const Icon = tool.icon;

  return (
    <Link
      to={tool.slug}
      className="group flex h-full flex-col rounded-xl border border-border bg-card/60 backdrop-blur-sm transition-all hover:border-foreground/30 hover:shadow-md"
    >
      <div className={`flex items-center gap-3 rounded-t-xl bg-gradient-to-r ${tool.gradientClassName} px-4 py-3`}>
        <Icon className="h-5 w-5 text-white" />
        <span className="text-sm font-bold text-white">{tool.shortTitle}</span>
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

export const ImageToolsHub = () => {
  return (
    <div>
      <PageSeo
        title="Free Online Image Tools — Edit, Convert & Optimize Images Privately"
        description="A complete suite of free, browser-based image tools. Compress, resize, crop, convert, watermark, remove backgrounds, and optimize your images — all processed privately on your device with no uploads required."
        canonicalPath="/image-tools"
      />

      {/* Hero */}
      <section className="border-b border-border bg-card/20">
        <div className="container py-10 md:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground md:text-sm">
              <Lock className="h-3.5 w-3.5 text-emerald-600" />
              100% private — files never leave your device
            </div>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
              Free Online Image Tools
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Everything you need to work with images — compress, resize, crop, convert, watermark, remove backgrounds, and enhance your photos. All tools run entirely in your browser so your files stay private and never get uploaded to any server.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong className="text-foreground">{imageTools.length}</strong> image tools available
            </p>
          </div>
        </div>
      </section>

      {/* Tool groups */}
      <section className="container py-10 md:py-14">
        <div className="space-y-14">
          {groupedImageTools.map(({ label, tools }) => (
            <div key={label}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground">
                    <Images className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{label}</h2>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {tools.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cross-link */}
      <section className="container pb-6">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Looking for PDF tools?
          </p>
          <Link
            to="/pdf-tools"
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-foreground/80"
          >
            Browse all PDF tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Privacy footer */}
      <section className="container pb-12 md:pb-16">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold text-foreground">Private by default</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Every image tool on FilePilot processes your files entirely in the browser. Nothing is uploaded, no data is collected, and your images remain on your device from start to finish.
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
