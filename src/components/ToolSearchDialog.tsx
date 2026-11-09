import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

// cmdk, the Radix dialog and the grouped tool list are only needed once the
// search is opened, so they stay out of the bundle every page loads. Hovering
// or focusing the button starts the download so the dialog still opens at once.
const loadPanel = () => import('./ToolSearchPanel');
const ToolSearchPanel = lazy(() => loadPanel().then((m) => ({ default: m.ToolSearchPanel })));

export const ToolSearchDialog = () => {
    const [open, setOpen] = useState(false);
    // Stay mounted after the first open so the close animation can play.
    const [mounted, setMounted] = useState(false);

    const openSearch = useCallback((next: boolean) => {
        if (next) setMounted(true);
        setOpen(next);
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setMounted(true);
            setOpen((prev) => !prev);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            <button
                type="button"
                onClick={() => openSearch(true)}
                onPointerEnter={loadPanel}
                onFocus={loadPanel}
                aria-label="Search tools"
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search tools</span>
                <kbd className="pointer-events-none hidden select-none rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                    ⌘K
                </kbd>
            </button>

            {mounted && (
                <Suspense fallback={null}>
                    <ToolSearchPanel open={open} onOpenChange={openSearch} />
                </Suspense>
            )}
        </>
    );
};
