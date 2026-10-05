import { useNavigate } from 'react-router-dom';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from './ui/command';
import { discoverableTools, type ToolDefinition } from '../data/toolRegistry';
import { toolPath } from '../lib/routes';

const CATEGORY_LABELS: Record<string, string> = {
    'organize-manage': 'Organize & Manage',
    'edit-annotate': 'Edit & Annotate',
    'convert-to-pdf': 'Convert to PDF',
    'convert-from-pdf': 'Convert from PDF',
    'optimize-repair': 'Optimize & Repair',
    'secure-pdf': 'Secure PDF',
    'ai-tools': 'AI Tools',
    'image-tools': 'Image Tools',
    'workflows': 'Workflows',
};

const grouped = discoverableTools.reduce<Record<string, ToolDefinition[]>>((acc, tool) => {
    const cat = tool.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
}, {});

interface ToolSearchPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** The search dialog itself. Split from ToolSearchDialog so cmdk and the Radix
 *  dialog load on first use instead of with every page. */
export const ToolSearchPanel = ({ open, onOpenChange }: ToolSearchPanelProps) => {
    const navigate = useNavigate();

    const selectTool = (slug: string) => {
        onOpenChange(false);
        navigate(toolPath(slug));
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search tools — merge, compress, image, AI..." />
            <CommandList>
                <CommandEmpty>No tools found.</CommandEmpty>
                {Object.entries(grouped).map(([category, tools]) => (
                    <CommandGroup key={category} heading={CATEGORY_LABELS[category] ?? category}>
                        {tools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <CommandItem
                                    key={tool.slug}
                                    value={`${tool.title} ${tool.shortTitle} ${tool.description} ${tool.searchAliases ?? ''}`}
                                    onSelect={() => selectTool(tool.slug)}
                                >
                                    <span className={`mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${tool.gradientClassName} text-white`}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium">{tool.title}</span>
                                        <span className="block truncate text-xs text-muted-foreground">{tool.description}</span>
                                    </span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                ))}
            </CommandList>
        </CommandDialog>
    );
};
