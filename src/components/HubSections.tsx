import type { SiteSection } from '../data/siteContent';

/** Long-form guidance for hub pages. prerender.js writes the same sections into the static HTML. */
export const HubSections = ({ sections }: { sections?: SiteSection[] }) => {
  if (!sections?.length) return null;

  return (
    <section className="container pb-12 md:pb-16">
      <div className="mx-auto max-w-3xl space-y-8">
        {sections.map(({ heading, paragraphs }) => (
          <div key={heading}>
            <h2 className="text-xl font-bold text-foreground">{heading}</h2>
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};
