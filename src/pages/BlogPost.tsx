import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { FAQSection } from '../components/FAQSection';
import { type BlogBlock, blogDateLabel, blogPosts } from '../data/blogContent';
import { siteSeo } from '../data/siteContent';
import { maintainer } from '../data/aboutContent';
import { toCanonicalPath } from '../lib/routes';
import { toolRegistry } from '../data/toolRegistry';

const routeLabel = (route: string) =>
  toolRegistry.find((tool) => tool.slug === route)?.title
  ?? blogPosts[route]?.h1
  ?? route;

/**
 * Block HTML is authored in blogContent.ts, not user input, so
 * dangerouslySetInnerHTML is safe here and is what lets a paragraph carry inline
 * links and emphasis without modelling every inline node as data.
 */
const Block = ({ block }: { block: BlogBlock }) => {
  switch (block.type) {
    case 'h2':
      return <h2 className="mt-8 mb-3 text-2xl font-bold text-foreground" dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'h3':
      return <h3 className="mt-6 mb-2 text-lg font-bold text-foreground" dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'callout':
      return (
        <p
          className="my-6 rounded-xl border-l-4 border-emerald-600/60 bg-card/60 p-4 text-sm leading-relaxed text-foreground md:text-base"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case 'ul':
      return (
        <ul className="my-4 space-y-2">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="my-4 space-y-2">
          {block.items.map((item, index) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {index + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ol>
      );
    default:
      return <p className="my-3 text-sm leading-relaxed text-muted-foreground md:text-base" dangerouslySetInnerHTML={{ __html: block.html }} />;
  }
};

export const BlogPost = ({ route }: { route: keyof typeof blogPosts }) => {
  const post = blogPosts[route];

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo {...siteSeo(route)} canonicalPath={route} ogType="article" />

      <div className="container max-w-3xl py-10 pb-16">
        <Link
          to={toCanonicalPath('/blog')}
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <article>
          <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">{post.h1}</h1>

          {/* Byline and dates — Phase 3.3 E-E-A-T signals. The author line only
              appears once a real maintainer is configured; it is never invented. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-5 text-xs text-muted-foreground">
            {maintainer && (
              <span>
                By{' '}
                <Link to={toCanonicalPath('/about')} className="font-medium text-foreground hover:underline">
                  {maintainer.name}
                </Link>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <time dateTime={post.published}>{blogDateLabel(post.published)}</time>
            </span>
            {post.updated && post.updated !== post.published && (
              <span>
                Updated <time dateTime={post.updated}>{blogDateLabel(post.updated)}</time>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {post.readTime}
            </span>
          </div>

          <div className="mt-6">
            {post.blocks.map((block, index) => (
              <Block key={`${block.type}-${index}`} block={block} />
            ))}
          </div>
        </article>

        <section className="mt-10 rounded-xl border border-border bg-card/60 p-6">
          <h2 className="text-lg font-bold text-foreground">Try it yourself</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Everything described here runs in your browser — your files are never uploaded.
          </p>
          <Link
            to={toCanonicalPath(post.primaryTool)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
          >
            {routeLabel(post.primaryTool)} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {post.faqs && post.faqs.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-2xl font-bold text-foreground">Frequently asked questions</h2>
            <FAQSection items={post.faqs} />
          </section>
        )}

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Keep reading
          </h2>
          <ul className="space-y-1.5 text-sm">
            {post.related.map((related) => (
              <li key={related}>
                <Link to={toCanonicalPath(related)} className="font-medium text-foreground hover:underline">
                  {routeLabel(related)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
