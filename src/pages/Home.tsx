import { Link } from 'react-router-dom';
import { ArrowRight, Lock, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { toolRegistry } from '../data/toolRegistry';

export const Home = () => {
  return (
    <div className="hero-pattern">
      <PageSeo
        title="PDF & Image Tools – Resize, Compress & Convert Free Online"
        description="Free browser-only tools to organize, watermark, compare, redact, convert, OCR, and annotate PDFs or images. 100% private — files never leave your browser."
      />

      <div className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600">
            <Sparkles className="h-4 w-4" />
            <span>100% Free, Local, and Private</span>
          </div>

          <h1 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-[var(--text)] md:text-6xl">
            Browser-Only PDF & Image Tools That
            <span className="gradient-text"> Respect Your Privacy</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--text-secondary)] md:text-xl">
            Organize pages, watermark PDFs, extract OCR, compare revisions, convert files, and handle privacy-first PDF workflows without uploading anything.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/organize-pdf" className="btn btn-primary px-6 py-3 text-base md:px-8 md:py-4 md:text-lg">
              Start with PDF Tools
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#tools" className="btn btn-outline px-6 py-3 text-base md:px-8 md:py-4 md:text-lg">
              Explore All Tools
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm text-[var(--text-muted)] md:mt-16 md:gap-8">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-500 md:h-5 md:w-5" />
            <span>Files stay on your device</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500 md:h-5 md:w-5" />
            <span>Fast browser-based processing</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500 md:h-5 md:w-5" />
            <span>No accounts or uploads</span>
          </div>
        </div>
      </div>

      <div className="container pb-16 md:pb-20" id="tools">
        <div className="mb-8 text-center md:mb-12">
          <h2 className="mb-4 text-2xl font-bold md:text-4xl">Powerful PDF & Image Tools</h2>
          <p className="text-base text-[var(--text-secondary)] md:text-lg">Everything you need for privacy-first browser workflows.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {toolRegistry.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.slug}
                to={tool.slug}
                className="card group animate-fade-in"
                style={{ animationFillMode: 'backwards', animationDelay: `${(index % 6) * 100}ms` }}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.gradientClassName} text-white shadow-lg transition-transform group-hover:scale-110 md:mb-5 md:h-14 md:w-14`}>
                  <Icon className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold md:text-xl">{tool.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{tool.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  Try now <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="container pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-slate-700 to-cyan-600 p-6 text-white md:rounded-3xl md:p-12">
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08), transparent 30%)" }} />

          <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="mb-4 text-2xl font-bold md:text-4xl">Privacy First. Always.</h2>
              <p className="mb-6 text-base text-white/80 md:text-lg">
                The toolkit is built around the promise that your PDFs and images are processed locally in the browser. Sensitive workflows like OCR, redaction, compare, and annotation never need a server roundtrip.
              </p>
              <Link to="/privacy" className="inline-flex items-center gap-2 font-medium text-white hover:underline">
                Learn more about the privacy guarantee
                <ArrowRight className="h-4 w-4" />
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
