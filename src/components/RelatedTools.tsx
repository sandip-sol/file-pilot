import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { discoverableTools, toolRegistry, type ToolDefinition } from '../data/toolRegistry';
import { ToolLinkCard } from './ToolLinkCard';
import { resolveRelatedTools } from '../data/relatedTools';

/**
 * The related-tool graph lives in `src/data/relatedTools.ts` and is shared with
 * the prerenderer via `seoRoutes.js`. This component used to keep its own
 * 34-entry map which disagreed with the prerenderer's on 6 of the 10 routes
 * they had in common — so the internal link graph in the crawlable HTML and the
 * one Google saw after rendering JS described two different sites.
 */
const graphInput = discoverableTools.map((tool) => ({ route: tool.slug, category: tool.category }));

const getRelatedTools = (currentTool: ToolDefinition, limit: number) =>
  resolveRelatedTools(currentTool.slug, graphInput, limit)
    .map((route) => discoverableTools.find((tool) => tool.slug === route))
    .filter((tool): tool is ToolDefinition => Boolean(tool));

export const RelatedTools = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/\/$/, '') || '/';
  const currentTool = toolRegistry.find((tool) => tool.slug === slug);

  const tools = useMemo(() => (currentTool ? getRelatedTools(currentTool, 3) : []), [currentTool]);

  if (!currentTool || tools.length === 0) return null;

  return (
    <section className="container pb-12">
      <div className="border-t border-border pt-8">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase text-muted-foreground">Related tools</p>
          <h2 className="text-xl font-bold text-foreground">Next useful options</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {tools.map((tool) => (
            <ToolLinkCard key={tool.slug} tool={tool} compact />
          ))}
        </div>
      </div>
    </section>
  );
};
