import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, Lock, ShieldCheck, Sparkles, Zap, Search } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { toolRegistry, toolsByCategory, type ToolCategory } from '../data/toolRegistry';

const CATEGORIES: { id: ToolCategory; label: string; emoji: string }[] = [
  { id: 'organize-manage', label: 'Organize & Manage', emoji: '📂' },
  { id: 'edit-annotate', label: 'Edit & Annotate', emoji: '✏️' },
  { id: 'convert-to-pdf', label: 'Convert to PDF', emoji: '⬆️' },
  { id: 'convert-from-pdf', label: 'Convert from PDF', emoji: '⬇️' },
  { id: 'optimize-repair', label: 'Optimize & Repair', emoji: '⚙️' },
  { id: 'secure-pdf', label: 'Secure PDF', emoji: '🔒' },
];

export const Home = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');

  const filtered = toolRegistry.filter(t => {
    const matchesCat = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="hero-pattern">
      <PageSeo
        title="PDF & Image Tools – Free, Private, Browser-Only"
        description="90+ free browser-only PDF tools: merge, split, compress, convert, sign, redact, OCR, annotate and more. Files never leave your device."
      />

      {/* Hero */}
      <div className="container py-16 md:py-20">
        <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600">
            <Sparkles className="h-4 w-4" />
            <span>90+ Tools – 100% Free & Private</span>
          </div>

          <h1 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-[var(--text)] md:text-6xl">
            Professional PDF Tools That
            <span className="gradient-text"> Respect Your Privacy</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--text-secondary)] md:text-xl">
            Merge, split, compress, convert, sign, encrypt, redact, OCR — all processed locally in your browser. No uploads, no accounts.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a href="#tools" className="btn btn-primary px-6 py-3 text-base md:px-8 md:py-4 md:text-lg">
              Explore All Tools
              <ArrowRight className="h-5 w-5" />
            </a>
            <Link to="/merge" className="btn btn-outline px-6 py-3 text-base md:px-8 md:py-4 md:text-lg">
              Start with Merge PDF
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm text-[var(--text-muted)] md:mt-16 md:gap-8">
          <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-500" /><span>Files stay on your device</span></div>
          <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /><span>Fast browser-based processing</span></div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-500" /><span>No accounts or uploads</span></div>
        </div>
      </div>

      {/* Tools */}
      <div className="container pb-20" id="tools">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-2xl font-bold md:text-4xl">All {toolRegistry.length}+ PDF & Image Tools</h2>
          <p className="text-base text-[var(--text-secondary)] md:text-lg">Everything you need for privacy-first browser workflows.</p>
        </div>

        {/* Search */}
        <div className="relative mx-auto mb-8 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search tools…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-card border border-border text-[var(--text-muted)] hover:bg-muted'}`}
          >
            All Tools ({toolRegistry.length})
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeCategory === c.id ? 'bg-indigo-600 text-white' : 'bg-card border border-border text-[var(--text-muted)] hover:bg-muted'}`}
            >
              {c.emoji} {c.label} ({toolsByCategory(c.id).length})
            </button>
          ))}
        </div>

        {/* Tool Grid */}
        {filtered.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-12">No tools match your search.</p>
        ) : (
          activeCategory === 'all' && !search ? (
            // Show by category sections
            CATEGORIES.map(cat => (
              <div key={cat.id} className="mb-12">
                <h3 className="mb-5 flex items-center gap-2 text-xl font-bold">
                  <span>{cat.emoji}</span>{cat.label}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {toolsByCategory(cat.id).map((tool, index) => {
                    const Icon = tool.icon;
                    return (
                      <Link
                        key={tool.slug}
                        to={tool.slug}
                        className="card group animate-fade-in"
                        style={{ animationFillMode: 'backwards', animationDelay: `${(index % 6) * 60}ms` }}
                      >
                        <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.gradientClassName} text-white shadow-md transition-transform group-hover:scale-110 md:h-12 md:w-12`}>
                          <Icon className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <h4 className="mb-1 text-base font-bold md:text-lg">{tool.title}</h4>
                        <p className="text-sm leading-relaxed text-[var(--text-muted)]">{tool.description}</p>
                        <div className="mt-3 flex items-center gap-1 text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          Use tool <ArrowRight className="h-4 w-4" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            // Flat filtered grid
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.slug}
                    to={tool.slug}
                    className="card group animate-fade-in"
                    style={{ animationFillMode: 'backwards', animationDelay: `${(index % 8) * 50}ms` }}
                  >
                    <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.gradientClassName} text-white shadow-md transition-transform group-hover:scale-110`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="mb-1 text-base font-bold">{tool.title}</h4>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">{tool.description}</p>
                    <div className="mt-3 flex items-center gap-1 text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      Use tool <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Privacy CTA */}
      <div className="container pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-slate-700 to-cyan-600 p-6 text-white md:rounded-3xl md:p-12">
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08), transparent 30%)' }} />
          <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="mb-4 text-2xl font-bold md:text-4xl">Privacy First. Always.</h2>
              <p className="mb-6 text-base text-white/80 md:text-lg">
                All {toolRegistry.length}+ tools process your PDFs locally in the browser using WebAssembly and JavaScript. Your files never leave your device.
              </p>
              <Link to="/privacy" className="inline-flex items-center gap-2 font-medium text-white hover:underline">
                Read our privacy guarantee <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm md:h-32 md:w-32">
              <ShieldCheck className="h-12 w-12 text-white md:h-16 md:w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
