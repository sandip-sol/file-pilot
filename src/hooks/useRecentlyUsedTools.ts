import { useEffect, useState } from 'react';
import { getRecentTools } from '../utils/recentTools';
import type { ToolDefinition } from '../data/toolRegistry';

export const useRecentlyUsedTools = () => {
  const [tools, setTools] = useState<ToolDefinition[]>([]);

  useEffect(() => {
    const syncRecentTools = () => setTools(getRecentTools());

    syncRecentTools();
    window.addEventListener('storage', syncRecentTools);
    window.addEventListener('filepilot:recent-tools-changed', syncRecentTools);

    return () => {
      window.removeEventListener('storage', syncRecentTools);
      window.removeEventListener('filepilot:recent-tools-changed', syncRecentTools);
    };
  }, []);

  return tools;
};

