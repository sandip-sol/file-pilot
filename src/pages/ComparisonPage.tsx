import { Link } from 'react-router-dom';
import { ArrowRight, Check, Lock, X } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { comparisonContent } from '../data/comparisons';
import { siteSeo } from '../data/siteContent';
import { toCanonicalPath } from '../lib/routes';
import { toolRegistry } from '../data/toolRegistry';

const toolTitle = (route: string) =>
  toolRegistry.find((tool) => tool.slug === route)?.title ?? route;

export const ComparisonPage = ({ route }: { route: keyof typeof comparisonContent }) => {
  const entry = comparisonContent[route];

  return (
    <div>
      <PageSeo {...siteSeo(route)} canonicalPath={route} />

      <section className="border-b border-border bg-card/20">
        <div className="container py-10 md:py-14">
          <div className="mx-auto max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
              <Link to={toCanonicalPath('/')} className="hover:text-foreground">FilePilot</Link>
              <span className="mx-2">/</span>
              <Link to={toCanonicalPath('/pdf-tools')} className="hover:text-foreground">PDF tools</Link>
            </nav>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground md:text-sm">
              <Lock className="h-3.5 w-3.5 text-emerald-600" />
              Processed in your browser — never uploaded
            </div>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {entry.h1}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              {entry.intro}
            </p>
          </div>
        </div>
      </section>

      <div className="container max-w-3xl py-10">
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            Why people look for a {entry.competitor} alternative
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{entry.motivation}</p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            The difference: where your file is processed
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{entry.difference}</p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            {entry.competitor} vs FilePilot
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th scope="col" className="p-3 font-semibold text-foreground"> </th>
                  <th scope="col" className="p-3 font-semibold text-foreground">{entry.competitor}</th>
                  <th scope="col" className="p-3 font-semibold text-foreground">FilePilot</th>
                </tr>
              </thead>
              <tbody>
                {entry.table.map((row) => (
                  <tr key={row.aspect} className="border-t border-border align-top">
                    <th scope="row" className="p-3 text-left font-medium text-foreground">{row.aspect}</th>
                    <td className="p-3 text-muted-foreground">{row.competitor}</td>
                    <td className="p-3 text-muted-foreground">{row.filepilot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            When {entry.competitor} is the better choice
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            No tool wins on everything. These are the cases where {entry.competitor} genuinely does the job better.
          </p>
          <ul className="space-y-3">
            {entry.limitations.map((limitation) => (
              <li key={limitation} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            {entry.competitor} tasks and the FilePilot tool that replaces them
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {entry.toolMap.map((item) => (
              <li key={item.route}>
                <Link
                  to={toCanonicalPath(item.route)}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-3 py-2.5 text-sm transition-colors hover:border-foreground/30"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    {item.task}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {toolTitle(item.route)} <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Frequently asked questions</h2>
          <FAQSection items={entry.faqs} />
        </section>

        <section>
          <div className="rounded-xl border border-border bg-card/60 p-6">
            <h2 className="text-xl font-bold text-foreground">Try it on a file you would not upload</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              That is the honest test. Open a tool, pick the document you were hesitating over, and watch
              your browser&rsquo;s Network tab while it runs.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={toCanonicalPath('/pdf-tools')}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
              >
                Browse all PDF tools <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={toCanonicalPath('/privacy')}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
              >
                How FilePilot handles data
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
