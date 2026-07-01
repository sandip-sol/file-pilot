import { Link } from 'react-router-dom';
import { ArrowLeft, Gauge, Globe2, Hammer, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { SupportFilePilot } from '../components/SupportFilePilot';

const faqItems = [
  {
    question: 'Are my files uploaded when I use FilePilot?',
    answer: 'No. File processing happens locally in your browser. Your files are not uploaded to FilePilot servers.',
  },
  {
    question: 'Does FilePilot show advertisements?',
    answer: 'No. FilePilot is designed to stay ad-free.',
  },
  {
    question: 'Where does my donation go?',
    answer: 'Donations help fund tool development, browser compatibility improvements, performance work, hosting and ongoing maintenance.',
  },
  {
    question: 'Does FilePilot store my card or payment information?',
    answer: 'No. Donations are handled by the external payment provider. FilePilot does not receive or store payment details.',
  },
];

const supportAreas = [
  {
    title: 'New tools',
    description: 'More browser-based PDF, image and file workflows for everyday tasks.',
    icon: Hammer,
  },
  {
    title: 'Faster processing',
    description: 'Performance work that makes large files and batch jobs feel smoother.',
    icon: Gauge,
  },
  {
    title: 'Better browser compatibility',
    description: 'Testing and fixes across modern browsers, devices and file formats.',
    icon: Globe2,
  },
  {
    title: 'Privacy-first maintenance',
    description: 'Ongoing upkeep that keeps local processing, security and ad-free UX central.',
    icon: ShieldCheck,
  },
];

export const Support = () => {
  return (
    <div>
      <PageSeo
        title="Support FilePilot | Keep private file tools free"
        description="Support FilePilot and help keep private, browser-based file tools free, ad-free and improving."
        canonicalPath="/support"
        faqItems={faqItems}
      />

      <section className="border-b border-border bg-card/20">
        <div className="container py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to FilePilot
          </Link>

          <div className="mt-8 max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <HeartHandshake className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
              Support FilePilot
            </div>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">
              Help keep private file tools free and ad-free.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              FilePilot is built for useful browser-based file work without ads, invasive analytics or unnecessary uploads. Support helps fund new tools, performance improvements and privacy-first maintenance.
            </p>
          </div>
        </div>
      </section>

      <main className="container py-10 md:py-12">
        <SupportFilePilot />

        <section aria-labelledby="support-helps-heading" className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
              <Sparkles className="h-5 w-5 text-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">What your support helps with</p>
              <h2 id="support-helps-heading" className="text-2xl font-bold text-foreground">Steady improvements, not distractions</h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {supportAreas.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-lg border border-border bg-card/60 p-5 backdrop-blur-sm">
                <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="support-faq-heading" className="mt-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">FAQ</p>
            <h2 id="support-faq-heading" className="mt-1 text-2xl font-bold text-foreground">Support and privacy questions</h2>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-lg border border-border bg-card/60 p-5 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-foreground">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
