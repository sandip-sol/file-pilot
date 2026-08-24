import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageSeo } from '../components/PageSeo';
import { PILLAR_ROUTE, blogDateLabel, blogPosts, blogPostsByDate } from '../data/blogContent';
import { siteContent, siteSeo } from '../data/siteContent';
import { toCanonicalPath } from '../lib/routes';

export const Blog = () => {
  // The post list used to be a hardcoded array here, which had drifted to three
  // entries while the prerendered index listed twelve. Both now read the same data.
  const pillar = blogPosts[PILLAR_ROUTE];
  const posts = blogPostsByDate().filter((post) => post.route !== PILLAR_ROUTE);

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <PageSeo {...siteSeo('/blog')} canonicalPath="/blog" />

      <div className="page-header">
        <div className="container">
          <h1>{siteContent['/blog'].h1}</h1>
          <p>Privacy-first file processing, explained</p>
        </div>
      </div>

      <div className="container pb-16">
        <div className="mx-auto max-w-5xl">
          {/* Cluster pillar — the page every other post links back to. */}
          {pillar && (
            <Link
              to={toCanonicalPath(pillar.route)}
              className="group mb-8 flex flex-col rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:bg-muted md:p-8"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Start here
              </p>
              <h2 className="mb-3 text-2xl font-bold text-foreground transition-colors group-hover:text-primary">
                {pillar.h1}
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Read the guide
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.route}
                to={toCanonicalPath(post.route)}
                className="group flex flex-col rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:bg-muted"
              >
                <p className="mb-3 text-xs text-muted-foreground">
                  {blogDateLabel(post.published)} &middot; {post.readTime}
                </p>
                <h2 className="mb-3 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                  {post.h1}
                </h2>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
