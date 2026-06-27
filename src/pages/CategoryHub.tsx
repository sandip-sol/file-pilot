import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Images, Lock } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { discoverableTools, type ToolCategory, type ToolDefinition } from '../data/toolRegistry';

const HUBS = {
  '/image-workflows': {
    title: 'Image Workflow Tools - Format, Validate and Prepare Images | FilePilot',
    description:
      'Prepare images for social media, ecommerce, passport photos, favicons, QR codes, and PDF workflows with private browser-based tools.',
    h1: 'Image Workflow Tools',
    intro:
      'Format, validate, and prepare images for real publishing requirements. These tools help with social media sizes, ecommerce output, passport photo checks, favicons, QR codes, and image-to-PDF workflows without uploading your files.',
    categories: ['workflows'] as ToolCategory[],
    icon: Images,
    relatedHref: '/image-tools',
    relatedLabel: 'Browse all image tools',
  },
  '/ai-tools': {
    title: 'AI Image Tools - Private Browser-Based Editing | FilePilot',
    description:
      'Remove backgrounds, enhance images, upscale photos, and clean edits with AI-assisted tools that run in your browser where supported.',
    h1: 'AI Image Tools',
    intro:
      'Use AI-assisted image tools for background removal, cleanup, enhancement, upscaling, and object removal. FilePilot keeps privacy clear by running supported processing in your browser instead of collecting your images on a server.',
    categories: ['ai-tools'] as ToolCategory[],
    icon: Bot,
    relatedHref: '/image-tools',
    relatedLabel: 'Browse all image tools',
  },
};

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

export const CategoryHub = ({ hubPath }: { hubPath: keyof typeof HUBS }) => {
  const hub = HUBS[hubPath];
  const HubIcon = hub.icon;
  const tools = discoverableTools.filter((tool) => hub.categories.includes(tool.category));

  return (
    <div>
      <PageSeo title={hub.title} description={hub.description} canonicalPath={hubPath} />

      <section className="border-b border-border bg-card/20">
        <div className="container py-10 md:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground md:text-sm">
              <Lock className="h-3.5 w-3.5 text-emerald-600" />
              Private browser-based processing
            </div>
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground">
                <HubIcon className="h-6 w-6" />
              </div>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
              {hub.h1}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {hub.intro}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong className="text-foreground">{tools.length}</strong> tools available
            </p>
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="container pb-12 md:pb-16">
        <div className="rounded-xl border border-border bg-card/60 p-6 text-center backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Need more options?</p>
          <Link
            to={hub.relatedHref}
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-foreground/80"
          >
            {hub.relatedLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
