import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { discoverableTools, type ToolDefinition } from '../data/toolRegistry';
import { ToolLinkCard } from './ToolLinkCard';

const relatedToolSlugs: Record<string, string[]> = {
  '/merge': ['/split', '/compress', '/organize-pdf'],
  '/split': ['/merge', '/extract-pages', '/delete-pages'],
  '/compress': ['/pdf-to-images', '/repair-pdf', '/page-dimensions'],
  '/pdf-to-images': ['/images-to-pdf', '/compress', '/extract-text'],
  '/images-to-pdf': ['/pdf-to-images', '/compress', '/merge'],
  '/extract-text': ['/pdf-to-images', '/pdf-to-docx', '/pdf-to-json'],
  '/watermark-pdf': ['/redact-pdf', '/sign-pdf', '/add-stamp'],
  '/redact-pdf': ['/find-and-redact', '/sanitize-pdf', '/remove-metadata'],
  '/sign-pdf': ['/annotate-pdf', '/watermark-pdf', '/flatten-pdf'],
  '/organize-pdf': ['/merge', '/split', '/rotate-pdf'],
  '/pdf-security': ['/sanitize-pdf', '/remove-metadata', '/redact-pdf'],
  '/image-requirements': ['/compress', '/images-to-pdf', '/pdf-to-images'],
};

const getRelatedTools = (currentTool: ToolDefinition) => {
  const explicitSlugs = relatedToolSlugs[currentTool.slug] ?? [];
  const explicitTools = explicitSlugs
    .map((slug) => discoverableTools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool));

  const fallbackTools = discoverableTools.filter(
    (tool) =>
      tool.slug !== currentTool.slug &&
      !explicitSlugs.includes(tool.slug) &&
      (tool.category === currentTool.category || tool.featured),
  );

  return [...explicitTools, ...fallbackTools].slice(0, 3);
};

export const RelatedTools = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/\/$/, '') || '/';
  const currentTool = discoverableTools.find((tool) => tool.slug === slug);

  const tools = useMemo(() => (currentTool ? getRelatedTools(currentTool) : []), [currentTool]);

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

