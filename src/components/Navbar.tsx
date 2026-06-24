import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { forwardRef, useState, type ComponentPropsWithoutRef, type MouseEventHandler } from 'react';
import {
    discoverableToolsByCategory,
    getToolStatus,
    type ToolCategory,
    type ToolDefinition,
} from '../data/toolRegistry';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from './ui/navigation-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const NAV_CATEGORIES: Array<{ category: ToolCategory; label: string; description: string }> = [
    {
        category: 'organize-manage',
        label: 'Organize',
        description: 'Merge, split, reorder, and prepare pages.',
    },
    {
        category: 'edit-annotate',
        label: 'Edit',
        description: 'Annotate, sign, stamp, and adjust PDF content.',
    },
    {
        category: 'convert-to-pdf',
        label: 'Convert to PDF',
        description: 'Turn images, text, and documents into PDFs.',
    },
    {
        category: 'convert-from-pdf',
        label: 'Convert from PDF',
        description: 'Export PDF pages, text, images, and data.',
    },
    {
        category: 'optimize-repair',
        label: 'Optimize',
        description: 'Compress, inspect, repair, and clean PDFs.',
    },
    {
        category: 'secure-pdf',
        label: 'Secure',
        description: 'Protect, sanitize, flatten, and redact files.',
    },
    {
        category: 'ai-tools',
        label: 'AI Tools',
        description: 'Summarize, translate, chat, and extract data with AI.',
    },
    {
        category: 'image-tools',
        label: 'Image Tools',
        description: 'Compress, resize, crop, convert, and edit images.',
    },
];

const CategoryHeader = ({ label, description }: { label: string; description: string }) => (
    <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
);

const BetaBadge = ({ tool }: { tool: ToolDefinition }) => {
    if (getToolStatus(tool) !== 'beta') return null;

    return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Beta
        </span>
    );
};

type ToolMenuLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'children' | 'to'> & {
    tool: ToolDefinition;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const ToolMenuLink = forwardRef<HTMLAnchorElement, ToolMenuLinkProps>(({ tool, onClick, className, ...props }, ref) => {
    const Icon = tool.icon;

    return (
        <Link
            ref={ref}
            to={tool.slug}
            onClick={onClick}
            className={`group flex min-h-16 gap-3 rounded-md p-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 ${className ?? ''}`}
            {...props}
        >
            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${tool.gradientClassName} text-white`}>
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold leading-tight text-foreground group-hover:text-foreground">
                        {tool.title}
                    </span>
                    <BetaBadge tool={tool} />
                </span>
                <span className="mt-1 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                    {tool.description}
                </span>
            </span>
        </Link>
    );
});

ToolMenuLink.displayName = 'ToolMenuLink';

export const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="container h-16 flex items-center justify-between">
                <Link to="/" className="flex shrink-0 items-center gap-2 font-bold text-lg">
                    <img src="/filepilot_logo.svg" alt="FilePilot" className="h-10 w-auto max-w-[200px] object-contain" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex min-w-0 flex-1 items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                    <NavigationMenu>
                        <NavigationMenuList className="space-x-0">
                            {NAV_CATEGORIES.map(({ category, label, description }) => {
                                const tools = discoverableToolsByCategory(category);

                                return (
                                    <NavigationMenuItem key={category}>
                                        <NavigationMenuTrigger className="h-9 bg-transparent px-2.5 text-muted-foreground hover:text-foreground data-[state=open]:text-foreground xl:px-3">
                                            {label}
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <div className="w-[min(88vw,760px)] overflow-hidden rounded-md bg-popover text-popover-foreground">
                                                <CategoryHeader label={label} description={description} />
                                                <div className="grid max-h-[70vh] gap-1 overflow-y-auto p-3 sm:grid-cols-2 xl:grid-cols-3">
                                                    {tools.map((tool) => (
                                                        <NavigationMenuLink key={tool.slug} asChild>
                                                            <ToolMenuLink tool={tool} />
                                                        </NavigationMenuLink>
                                                    ))}
                                                </div>
                                            </div>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                );
                            })}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="lg:hidden bg-background border-t border-border animate-fade-in">
                    <div className="container max-h-[calc(100vh-4rem)] overflow-y-auto py-4">
                        <Accordion type="multiple" className="w-full">
                            {NAV_CATEGORIES.map(({ category, label, description }) => {
                                const tools = discoverableToolsByCategory(category);

                                return (
                                    <AccordionItem key={category} value={category} className="border-border">
                                        <AccordionTrigger className="px-3 text-left hover:no-underline">
                                            <span>
                                                <span className="block text-sm font-semibold text-foreground">{label}</span>
                                                <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
                                                    {description}
                                                </span>
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-1 px-1">
                                            {tools.map((tool) => (
                                                <ToolMenuLink
                                                    key={tool.slug}
                                                    tool={tool}
                                                    onClick={() => setIsMenuOpen(false)}
                                                />
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </div>
                </div>
            )}
        </nav>
    );
};
