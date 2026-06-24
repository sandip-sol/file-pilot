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
  '/image-requirements': ['/image-formatter', '/compress-image', '/resize-image'],
  '/image-formatter': ['/social-media-resizer', '/ecommerce-image-formatter', '/compress-image'],
  '/passport-photo-validator': ['/image-formatter', '/crop-image', '/remove-image-metadata'],
  '/social-media-resizer': ['/image-formatter', '/ecommerce-image-formatter', '/crop-image'],
  '/ecommerce-image-formatter': ['/image-formatter', '/social-media-resizer', '/remove-background'],
  '/scan-images-to-pdf': ['/images-to-pdf', '/compress', '/organize-pdf'],
  '/favicon-generator': ['/image-formatter', '/resize-image', '/crop-image'],
  '/crop-image': ['/resize-image', '/rotate-image', '/photo-editor'],
  '/rotate-image': ['/crop-image', '/photo-editor', '/watermark-image'],
  '/watermark-image': ['/photo-editor', '/crop-image', '/blur-face'],
  '/photo-editor': ['/crop-image', '/watermark-image', '/remove-image-metadata'],
  '/remove-image-metadata': ['/compress-image', '/blur-face', '/photo-editor'],
  '/blur-face': ['/remove-image-metadata', '/watermark-image', '/crop-image'],
  '/remove-background': ['/change-background', '/object-remover', '/crop-image'],
  '/change-background': ['/remove-background', '/ai-enhance-image', '/photo-editor'],
  '/upscale-image': ['/ai-enhance-image', '/resize-image', '/compress-image'],
  '/ai-enhance-image': ['/upscale-image', '/photo-editor', '/remove-background'],
  '/object-remover': ['/remove-background', '/blur-face', '/crop-image'],
  '/image-to-svg': ['/convert-image', '/compress-image', '/crop-image'],
  '/color-picker': ['/photo-editor', '/convert-image', '/image-formatter'],
  '/qr-generator': ['/image-to-svg', '/favicon-generator', '/image-formatter'],
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

