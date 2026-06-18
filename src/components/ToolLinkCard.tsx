import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getToolStatus, type ToolDefinition } from '../data/toolRegistry';

interface ToolLinkCardProps {
  tool: ToolDefinition;
  compact?: boolean;
}

export const ToolLinkCard = ({ tool, compact = false }: ToolLinkCardProps) => {
  const Icon = tool.icon;
  const status = getToolStatus(tool);

  return (
    <Link
      to={tool.slug}
      className={`group flex h-full min-h-[130px] flex-col rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-foreground/40 hover:bg-muted/60 ${compact ? 'min-h-[112px]' : ''}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground">
          <Icon className="h-5 w-5" />
        </div>
        {status === 'beta' ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Beta</span>
        ) : null}
      </div>
      <h3 className="line-clamp-1 text-sm font-bold text-foreground md:text-base">{tool.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      <div className="mt-auto flex items-center gap-1 pt-3 text-sm font-semibold text-foreground">
        Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};

