import { Link } from 'react-router-dom';
import { ArrowRight, Github, Lock, Mail, MapPin } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { siteContent, siteFaqs, siteSeo } from '../data/siteContent';
import { GITHUB_REPO_URL, aboutSections, maintainer, pressKit } from '../data/aboutContent';
import { toCanonicalPath } from '../lib/routes';

export const About = () => {
  const content = siteContent['/about'];

  return (
    <div>
      <PageSeo {...siteSeo('/about')} canonicalPath="/about" />

      <section className="border-b border-border bg-card/20">
        <div className="container py-10 md:py-14">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground md:text-sm">
              <Lock className="h-3.5 w-3.5 text-emerald-600" />
              Independently built · no ads, no trackers, no accounts
            </div>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {content.h1}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              {content.intro}
            </p>
          </div>
        </div>
      </section>

      <div className="container max-w-3xl py-10">
        {maintainer && (
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold text-foreground">Who builds FilePilot</h2>
            <div className="rounded-xl border border-border bg-card/60 p-6">
              <p className="text-lg font-bold text-foreground">{maintainer.name}</p>
              <p className="text-sm text-muted-foreground">{maintainer.role}</p>
              {maintainer.bio.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {maintainer.location && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {maintainer.location}
                  </span>
                )}
                {maintainer.email && (
                  <a
                    href={`mailto:${maintainer.email}`}
                    className="inline-flex items-center gap-1.5 font-medium text-foreground hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" /> {maintainer.email}
                  </a>
                )}
                {maintainer.profiles?.map((profile) => (
                  <a
                    key={profile.url}
                    href={profile.url}
                    rel="me noopener"
                    target="_blank"
                    className="font-medium text-foreground hover:underline"
                  >
                    {profile.label}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {aboutSections.map((section) => (
          <section key={section.heading} className="mb-10">
            <h2 className="mb-3 text-2xl font-bold text-foreground">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mb-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">Source code</h2>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            FilePilot is developed in the open. If you want to check how a tool handles your file, read it.
          </p>
          <a
            href={GITHUB_REPO_URL}
            rel="noopener"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
          >
            <Github className="h-4 w-4" /> View the repository <ArrowRight className="h-4 w-4" />
          </a>
        </section>

        {/* Press kit — so a writer covering FilePilot never has to ask for assets. */}
        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground">For press and reviewers</h2>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            Please use this description rather than paraphrasing — it is accurate about what the
            tool does and does not do.
          </p>
          <blockquote className="mb-5 rounded-xl border-l-4 border-emerald-600/60 bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground">
            {pressKit.boilerplate}
          </blockquote>

          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Assets</h3>
          <ul className="mb-5 space-y-1.5 text-sm">
            {pressKit.assets.map((asset) => (
              <li key={asset.url}>
                <a href={asset.url} className="font-medium text-foreground hover:underline">{asset.label}</a>
              </li>
            ))}
          </ul>

          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pages worth linking to
          </h3>
          <ul className="space-y-1.5 text-sm">
            {pressKit.linkablePages.map((page) => (
              <li key={page.route}>
                <Link to={toCanonicalPath(page.route)} className="font-medium text-foreground hover:underline">
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">Frequently asked questions</h2>
          <FAQSection items={siteFaqs('/about')} />
        </section>
      </div>
    </div>
  );
};
