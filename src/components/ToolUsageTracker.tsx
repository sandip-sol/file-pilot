import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { discoverableTools } from '../data/toolRegistry';
import { saveRecentTool } from '../utils/recentTools';

export const ToolUsageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const slug = location.pathname.replace(/\/$/, '') || '/';
    const isToolRoute = discoverableTools.some((tool) => tool.slug === slug);

    if (isToolRoute) {
      saveRecentTool(slug);
    }
  }, [location.pathname]);

  return null;
};

