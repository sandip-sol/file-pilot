import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { forwardRef, useState, type ComponentPropsWithoutRef, type MouseEventHandler } from 'react';
import {
    discoverableTools,
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
import { ToolSearchDialog } from './ToolSearchDialog';

type NavCategoryGroup = {
    id: string;
    categories: ToolCategory[];
    label: string;
    description: string;
};

const DIRECT_NAV_TOOL_SLUGS = ['/qr-generator'];

const NAV_CATEGORIES: NavCategoryGroup[] = [
    {
        id: 'organize-manage',
        categories: ['organize-manage'],
        label: 'Organize',
        description: 'Merge, split, reorder, and prepare pages.',
    },
    {
        id: 'edit-annotate',
        categories: ['edit-annotate'],
        label: 'Edit',
        description: 'Annotate, sign, stamp, and adjust PDF content.',
    },
    {
        id: 'convert-pdf',
        categories: ['convert-to-pdf', 'convert-from-pdf'],
        label: 'Convert PDF',
        description: 'Convert files to PDF or export PDF pages, text, images, and data.',
    },
    {
        id: 'optimize-repair',
        categories: ['optimize-repair'],
        label: 'Optimize',
        description: 'Compress, inspect, repair, and clean PDFs.',
    },
    {
        id: 'secure-pdf',
        categories: ['secure-pdf'],
        label: 'Secure',
        description: 'Protect, sanitize, flatten, and redact files.',
    },
    {
        id: 'ai-tools',
        categories: ['ai-tools'],
        label: 'AI Tools',
        description: 'Summarize, translate, chat, and extract data with AI.',
    },
    {
        id: 'image-tools',
        categories: ['image-tools'],
        label: 'Image Tools',
        description: 'Compress, resize, crop, convert, and edit images.',
    },
];

const DIRECT_NAV_TOOLS = DIRECT_NAV_TOOL_SLUGS
    .map((slug) => discoverableTools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool));

const getNavCategoryTools = ({ categories }: NavCategoryGroup) =>
    categories.flatMap((category) => discoverableToolsByCategory(category));

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
                    <img src="/filepilot_logo.svg" alt="FilePilot logo" className="h-10 w-auto max-w-[200px] object-contain" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex min-w-0 flex-1 items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                    <NavigationMenu>
                        <NavigationMenuList className="space-x-0">
                            {NAV_CATEGORIES.map((navCategory) => {
                                const { id, label, description } = navCategory;
                                const tools = getNavCategoryTools(navCategory);

                                return (
                                    <NavigationMenuItem key={id}>
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
                            {DIRECT_NAV_TOOLS.map((tool) => (
                                <NavigationMenuItem key={tool.slug}>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            to={tool.slug}
                                            className="flex h-9 items-center rounded-md bg-transparent px-2.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 xl:px-3"
                                        >
                                            {tool.shortTitle}
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                <ToolSearchDialog />

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
                        {DIRECT_NAV_TOOLS.length > 0 && (
                            <div className="mb-3 space-y-1">
                                {DIRECT_NAV_TOOLS.map((tool) => (
                                    <ToolMenuLink
                                        key={tool.slug}
                                        tool={tool}
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                ))}
                            </div>
                        )}
                        <Accordion type="multiple" className="w-full">
                            {NAV_CATEGORIES.map((navCategory) => {
                                const { id, label, description } = navCategory;
                                const tools = getNavCategoryTools(navCategory);

                                return (
                                    <AccordionItem key={id} value={id} className="border-border">
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
