import { Clock3 } from 'lucide-react';
import { useRecentlyUsedTools } from '../hooks/useRecentlyUsedTools';
import { ToolLinkCard } from './ToolLinkCard';

export const RecentlyUsedTools = () => {
  const recentTools = useRecentlyUsedTools();

  if (recentTools.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground">
          <Clock3 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">Recently used</p>
          <h2 className="text-xl font-bold text-foreground">Pick up where you left off</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {recentTools.slice(0, 3).map((tool) => (
          <ToolLinkCard key={tool.slug} tool={tool} compact />
        ))}
      </div>
    </section>
  );
};

