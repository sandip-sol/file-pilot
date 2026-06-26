import { Link, useLocation } from 'react-router-dom';
import { toolRegistry } from '../data/toolRegistry';
import { toolContent } from '../data/toolContent';
import { ShieldCheck, Zap, WifiOff, UserX } from 'lucide-react';

export const ToolContentSection = () => {
  const { pathname } = useLocation();
  const slug = pathname.replace(/\/$/, '') || '/';
  const content = toolContent[slug];
  const tool = toolRegistry.find((t) => t.slug === slug);

  if (!content || !tool) return null;

  return (
    <section className="border-t border-border bg-card/20">
      <div className="container max-w-4xl py-12 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="transition-colors hover:text-foreground">
                FilePilot
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                to={tool.category === 'image-tools' || tool.category === 'workflows' || tool.category === 'ai-tools' ? '/image-tools' : '/pdf-tools'}
                className="transition-colors hover:text-foreground"
              >
                {tool.category === 'image-tools' || tool.category === 'workflows' || tool.category === 'ai-tools' ? 'Image tools' : 'PDF tools'}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground" aria-current="page">
              {tool.title}
            </li>
          </ol>
        </nav>

        <h2 className="text-2xl font-bold text-foreground mb-4">
          What is {tool.title}?
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          {content.intro}
        </p>

        <h2 className="text-2xl font-bold text-foreground mb-4">
          How to {content.action} with FilePilot
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-8">
          {content.steps.map((step, i) => (
            <li key={i} className="leading-relaxed pl-1">{step}</li>
          ))}
        </ol>

        <h2 className="text-2xl font-bold text-foreground mb-6">
          Why choose FilePilot?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <ShieldCheck className="h-6 w-6 text-emerald-600 mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Complete privacy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every file you {content.action.toLowerCase()} stays on your device. FilePilot processes
              everything in your browser using WebAssembly and the Canvas API &mdash; nothing is
              uploaded to any server. Your documents are never stored, cached, or accessible to anyone
              but you.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <UserX className="h-6 w-6 text-blue-500 mb-2" />
            <h3 className="font-semibold text-foreground mb-1">No account required</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start working immediately &mdash; no sign-up, no email, no personal data collected.
              There are no usage limits, no watermarks on output files, and no premium tiers.
              FilePilot is completely free.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <WifiOff className="h-6 w-6 text-violet-500 mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Works offline</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              After the first page load, FilePilot works without an internet connection. This means
              you can {content.action.toLowerCase()} on a plane, in a coffee shop, or anywhere
              without worrying about connectivity or data leaks over public Wi-Fi.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <Zap className="h-6 w-6 text-amber-500 mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Instant results</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Because processing happens on your own hardware, there are no upload queues or
              server wait times. Most operations complete in seconds, even for large files.
              Your results are available immediately for download.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-4">
          Common use cases
        </h2>
        <ul className="space-y-2 text-muted-foreground mb-8">
          {content.useCases.map((uc, i) => (
            <li key={i} className="flex gap-2 leading-relaxed">
              <span className="text-foreground mt-0.5">•</span>
              <span>{uc}</span>
            </li>
          ))}
        </ul>

        <h2 className="text-2xl font-bold text-foreground mb-4">
          Your privacy matters
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Unlike most online {tool.category.includes('image') || tool.category === 'ai-tools' || tool.category === 'workflows' ? 'image' : 'PDF'} tools
          that upload your files to remote servers for processing, FilePilot never transmits
          your data. Every operation runs locally using modern browser APIs, including
          pdf-lib for PDF manipulation, the Canvas API for image rendering, and ONNX Runtime
          Web for AI features. Your files exist only in your browser&apos;s memory and are
          discarded when you close the tab.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          This architecture means FilePilot is safe for handling confidential contracts,
          medical records, financial statements, personal photos, and any other sensitive
          material. There is no server to breach, no database to hack, and no third-party
          access to your content &mdash; ever.
        </p>
      </div>
    </section>
  );
};
