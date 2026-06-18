import { discoverableTools, type ToolDefinition } from '../data/toolRegistry';

const STORAGE_KEY = 'pdf-solver:recent-tools';
const MAX_RECENT_TOOLS = 6;

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getRecentToolSlugs = () => {
  if (!isBrowser()) return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((slug): slug is string => typeof slug === 'string');
  } catch {
    return [];
  }
};

export const saveRecentTool = (slug: string) => {
  if (!isBrowser()) return [];

  const toolExists = discoverableTools.some((tool) => tool.slug === slug);
  if (!toolExists) return getRecentToolSlugs();

  const next = [slug, ...getRecentToolSlugs().filter((item) => item !== slug)].slice(0, MAX_RECENT_TOOLS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('pdf-solver:recent-tools-changed'));
  return next;
};

export const getRecentTools = (): ToolDefinition[] => {
  const slugs = getRecentToolSlugs();
  return slugs
    .map((slug) => discoverableTools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool));
};

