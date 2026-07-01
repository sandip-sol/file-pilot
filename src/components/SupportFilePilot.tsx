import { useEffect } from 'react';
import { Coffee, ExternalLink, Heart, ShieldCheck, Sparkles, Zap } from 'lucide-react';

let hasWarnedAboutSupportUrl = false;

const getSupportUrl = () => {
  const value = import.meta.env.VITE_SUPPORT_URL?.trim() ?? '';
  if (!value) return '';

  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

const SUPPORT_POINTS = [
  { label: 'No ads. No file uploads.', icon: ShieldCheck },
  { label: 'More tools and better performance.', icon: Zap },
  { label: 'Built for privacy-first file work.', icon: Sparkles },
];

interface SupportFilePilotProps {
  className?: string;
}

export const SupportFilePilot = ({ className = '' }: SupportFilePilotProps) => {
  const supportUrl = getSupportUrl();

  useEffect(() => {
    if (supportUrl || !import.meta.env.DEV || hasWarnedAboutSupportUrl) return;

    hasWarnedAboutSupportUrl = true;
    console.warn('FilePilot support link is not configured. Set VITE_SUPPORT_URL to enable the donation CTA.');
  }, [supportUrl]);

  return (
    <section
      aria-labelledby="support-filepilot-heading"
      className={`relative overflow-hidden rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm md:p-6 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle,hsl(var(--foreground))_1px,transparent_1px)] [background-size:10px_10px]" />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Support FilePilot
          </p>
          <h2 id="support-filepilot-heading" className="mt-2 text-xl font-bold leading-tight text-foreground md:text-2xl">
            Keep FilePilot free, private and ad-free.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            FilePilot runs directly in your browser, so your files stay on your device. Your support helps us build more useful tools, improve performance and keep the platform free from ads.
          </p>

          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            {SUPPORT_POINTS.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start gap-3 lg:w-64 lg:items-stretch">
          {supportUrl ? (
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buy us a coffee on our payment partner site. Opens in a new tab."
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Coffee className="h-4 w-4" aria-hidden="true" />
              Buy us a coffee
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}

          <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden="true" />
            <span>
              Donations are processed securely by our payment partner. FilePilot never receives or stores payment details.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};
