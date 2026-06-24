import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from './ui/command';
import { discoverableTools, type ToolDefinition } from '../data/toolRegistry';

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

export const ToolSearchDialog = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setOpen((prev) => !prev);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const selectTool = (slug: string) => {
        setOpen(false);
        navigate(slug);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search tools</span>
                <kbd className="pointer-events-none hidden select-none rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                    ⌘K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
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
        </>
    );
};
