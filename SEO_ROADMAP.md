# FilePilot SEO Roadmap — Path to the Top

**Site:** https://www.filepilot.space
**Date:** 2026-08-22 (supersedes the 2026-07-15 revision)
**Author:** SEO strategy review

---

## 1. Where you actually stand (read this first)

| Signal | Google (3 mo, 2026-08-22) | Bing (3 mo, 2026-08-22) |
|---|---|---|
| Impressions | 1,030 | 422 |
| Clicks | 1 | 4 |
| Avg. position | **58.5** | — |
| CTR | 0.1% | 0.95% |

**Impressions tripled since July (344 → 1,030). Position did not move (55.8 → 58.5).**
That combination is diagnostic: Google is crawling and surfacing more of the site,
but nothing is climbing. More lottery tickets, same odds.

Bing still converts ~10x better than Google (0.95% vs 0.1% CTR) on 40% of the
impressions. Bing is the cheaper channel *and* it feeds ChatGPT search — weight it
accordingly.

### 1a. The brand-name problem is worse than "a Windows app"

Searching `filepilot` returns, in order: the **File Pilot** Windows Explorer
replacement (filepilot.tech — XDA and andrewlock.net coverage, MajorGeeks
downloads, YouTube reviews), a Python FilePilot on GitHub, a FilePilot iOS app —
and then **three other sites doing the same thing this one does**:

- `filepilot.org` — "FilePilot — Free Privacy-First Browser Utilities"
- `filepilot.online` — "FilePilot — Free Online File Converter | PDF, Image, Video, Audio Tools"
- `filepilottools.top` — "Free Online PDF and Image Tools | FilePilot Tools"

filepilot.space is the lowest-authority entrant in a name that is already
saturated — including by direct positioning clones. **Ranking #1 for "filepilot"
is not a realistic near-term goal, and it is not a goal worth pursuing:** brand
search volume for an unknown brand is ~0 anyway. Optimise for what people
actually type ("resize image to 50kb", "pdf to cbz") and let brand recognition
follow traffic, not precede it.

What *does* need fixing is entity disambiguation, so Google knows these are
different things: `sameAs` on the Organization schema (now shipped, pointing at
the GitHub repo) plus every additional profile you control. Add more as you
create them — Product Hunt, X, Reddit, LinkedIn, an About page with a real name.

### 1b. "Your technical foundation is already good" was wrong

The July claim that the tech was done did not survive an audit of what the
production site actually serves. Fixed in the 2026-08-22 pass:

| Issue | Impact |
|---|---|
| **Homepage prerendered as a 73-word generic fallback** — the same branch as `/privacy` and `/terms`. Thinnest page on the site, and the one a brand search lands on. | Now 562 words with the tool categories, the privacy mechanism, an FAQ, `ItemList` + `FAQPage` schema. |
| **All 3 blog posts served as ~80-word near-duplicate stubs.** The real ~1,000-word articles existed only inside React components, invisible to every non-rendering crawler (Bing, GPTBot, PerplexityBot, ClaudeBot). **Zero structured data on any of them.** | Article bodies are now extracted from the components at build time: 913 / 1,094 / 1,100 words, plus `BlogPosting` + `BreadcrumbList` schema with real dates. |
| **Client/prerender SEO drift on 8 routes.** The July rollout single-sourced the 83 tool pages but left the core routes behind. `/` , `/pdf-tools`, `/image-tools`, `/privacy`, `/terms`, `/image-requirements` and all 3 blog posts shipped one `<title>` in the HTML and a *different* one from `PageSeo` at runtime. Google renders JS, so the client copy won — and both hub pages were being indexed **with no brand in the title at all**. | `src/data/siteContent.ts` is now the single source for every non-tool route, consumed by the prerenderer *and* `PageSeo`. A new `seoValidate` gate fails the build if any routed page passes a literal title to `<PageSeo>`. |
| **`/image-requirements` returned 404 in production.** A complete "resize to exact size & KB" tool — one of the best long-tail keywords on the whole site — was routed in the app, referenced by `RelatedTools`, given sitemap priority 0.9 in `seoRoutes.js`, and never added to the registry. No static HTML, not in the sitemap, 404 for every crawler and every direct link. | Registered. Now prerendered, in the sitemap, with FAQ + HowTo schema. |
| **Sitemap `lastmod` frozen at June 2026** while the July rewrite changed every tool page's title, H1, FAQs and HowTo schema. A stale-but-old lastmod actively suppresses recrawls. | Derived from git commit dates of the files each route's copy comes from. Self-maintaining. |
| **Duplicate `<h1>` on all 95 pages** from the global `<noscript>` block, plus 13 identical boilerplate links site-wide. | Removed; exactly one H1 per page. |
| **The Puppeteer prerender pass was a no-op.** It launched Chrome and rendered 95 routes per build — then `withRouteSeo` overwrote `#root` with the static shell, discarding every render. Verified by diffing both outputs: the only difference was ~120 lines of runtime-injected component CSS. | Removed. Builds no longer need Chrome, so Netlify's `PUPPETEER_SKIP_DOWNLOAD=true` is no longer papering over a silently-degraded build. |

**Median prerendered content is now 365 words/page, up from 350, with the two
worst categories — homepage and blog — up 8x and 12x.**

**Still open (deliberately not done):**

- **45 of 96 titles exceed 60 characters** and truncate in SERPs (worst:
  `/extract-text` at 78). Pure CTR cost, and CTR is irrelevant at position 58 —
  fix this when positions reach page 2, not before.
- **15 dead page components** (`JpgToPdf`, `PdfToJpg`, `BmpToPdf`, `HeicToPdf`,
  `WebpToPdf`, `TiffToPdf`, `PdfToPng`, `PdfToTiff`, `PdfToWebp`, `PdfToDocx`,
  `PdfToExcel`, `PdfToPptx`, `EncryptDecryptPdf`, `TextColor`,
  `ConvertToPdfPages`, `SecureOptimizePages`) are never routed. No SEO impact —
  they do not ship — but they carry stale `PageSeo` blocks that would drift if
  ever revived. `PdfToBmp` was deleted in this pass; the rest are a cleanup call.
- **Thin hub/legal pages**: `/ai-tools` (71 words), `/image-workflows` (84),
  `/terms`, `/support`, `/privacy`. The legal pages are fine thin. The two hubs
  are thin because they have few tools — worth a paragraph each.

## 2. The strategic bet

Unchanged, and the on-page work above does not replace it. Three winnable
fronts, in priority order:

1. **The long tail of niche tools.** ~90 tools, a dozen of which target keywords
   the giants ignore: `pdf to cbz`, `posterize pdf`, `n-up pdf`, `add page labels
   to pdf`, `image to svg`, `combine single page pdf`, `pdf to greyscale`,
   `remove image metadata`, `flatten pdf` — plus `/image-requirements`, newly
   rescued from a 404, which targets the "resize image to 50kb" family. Low
   volume each, low competition, winnable in 2–4 months.

2. **The privacy / no-upload angle.** Every giant uploads your file. You do not.
   That is a real differentiator and a keyword cluster nobody owns: `offline pdf
   tool`, `pdf tool no upload`, `private pdf editor`, `edit pdf without
   uploading`. The homepage now actually says this in crawlable HTML.

3. **Authority (backlinks).** Still the binding constraint for everything else.
   No amount of on-page work moves you off page 5 without links. Runs
   continuously in parallel. **Every row of the Phase 2 tracker is still
   unchecked** — that has not changed since July.

## 3. Phased roadmap

### Phase 0 — This week (quick wins, ~1 day total)

| # | Task | Status |
|---|---|---|
| 0.1 | **Verify indexation.** In GSC → Pages, confirm all 95 sitemap URLs are "Indexed." Fix any "Crawled – not indexed" (usually thin/duplicate). | ⏳ **Manual** — checklist in [docs/PRIORITY_TOOLS.md](docs/PRIORITY_TOOLS.md#phase-0-manual-checklist--cant-be-automated--do-in-the-browser). |
| 0.2 | **Add HowTo schema** to every tool page. Each tool is literally a how-to. | ✅ **Done** — `buildHowToSchema` in `prerender.js`, live on 83 tool pages, gated in `seoValidate.js`. |
| 0.3 | **Submit to IndexNow + GSC** after every deploy. | ✅ **Tooling done** — `npm run indexnow:submit:tail` / `:all` added. GSC request-indexing is manual (see checklist). |
| 0.4 | **Pick your 12 "winnable tail" tools and tag them as priority.** | ✅ **Done** — `PRIORITY_TAIL_ROUTES` in `seoRoutes.js` (sitemap priority 0.85); keyword targets in [docs/PRIORITY_TOOLS.md](docs/PRIORITY_TOOLS.md). |
| 0.5 | **Fix the brand collision** with the *File Pilot* Windows file manager. | ✅ **Done** — enriched homepage `Organization` schema (`alternateName` + disambiguating `description`). Titles already use one-word "FilePilot". |

### Phase 1 — Weeks 1–4: Win the long tail

> **Architectural fix landed first (unplanned but blocking).** The site ran *two*
> competing SEO systems: the prerenderer (`seoRoutes.js`) and client-side `PageSeo`,
> which overwrote `document.title` and injected a second, different FAQ schema on
> every page. Because Google renders JS, the client won — so tool pages were indexed
> with the brand stripped from the title and two conflicting FAQPage blocks. A third
> copy of the FAQs lived in each page's visible `<FAQSection>`, which *differed* from
> the schema FAQs — a structured-data guideline violation.
> `src/data/toolContent.ts` is now the single source of truth for the 12 focus tools
> (title, description, H1, FAQs, comparison), consumed by the prerenderer *and*
> `PageSeo` *and* `FAQSection` via `toolSeo()` / `toolFaqs()`.

| # | Task | Status |
|---|---|---|
| 1.1 | **Rewrite the 12 priority tool pages for their exact keyword.** | ✅ **Done (12/12)** — keyword-first titles + `\| FilePilot` suffix, verified identical between client and prerender; H1s aligned; HowTo already live; unique intros; new "when to use this vs …" section on every focus page. |
| 1.2 | **Unique FAQs per tool.** | ✅ **Done (12/12)** — 5–6 tool-specific FAQs each (was 4 generic boilerplate), now single-sourced so the visible accordion and FAQPage schema always match. |
| 1.3 | **Comparison/alternative pages** ("FilePilot vs Smallpdf", "iLovePDF alternative that doesn't upload"). | ⏳ **Not started** — needs a decision: these pages make public claims about named competitors. Partly mitigated by the per-tool "when to use this vs …" sections shipped in 1.1. |
| 1.4 | **Internal-linking hubs.** Each tool should link to 3–5 *related* tools, not the generic footer. | ✅ **Done for the 12** — curated `RELATED_ROUTES` siblings replace the `/merge`, `/compress` fallback. Hub → spoke anchors still to review. |

**Rollout: ✅ complete — all 83 tool routes.** The reconciliation was extended from the
12 focus tools to every tool page. `toolContent.ts` is now the single source of truth
site-wide, consumed by the prerenderer, `PageSeo`, and `FAQSection`.

- **Title parity: 83/83** client-vs-prerender (was 12/83). Every tool page now keeps
  its `| FilePilot` brand suffix in the DOM Google actually indexes.
- **FAQ single-sourcing: 83/83** — one FAQ set per tool, so the visible accordion and
  the FAQPage schema can no longer drift apart.
- Route-aware components (`ImagesToPdf`, `PdfToImages`, `ExtractText`, `PdfSecurity`,
  `PdfMetadata`) keep their dynamic `canonicalPath`/`robots` logic; non-indexable
  variants (`/png-to-pdf`, `/rasterize-pdf`, …) still canonicalise to their hub.

**Follow-ups surfaced by the rollout:**
1. **14 of 83 titles now exceed ~65 chars** and will truncate in SERPs (worst:
   `/extract-text` at 78). Pre-existing length + the 12-char brand suffix. Worth trimming.
2. **Dead page components** are never routed and should probably be deleted:
   `JpgToPdf`, `PdfToJpg`, `BmpToPdf`, `HeicToPdf`, `WebpToPdf`, `TiffToPdf`,
   `PdfToPng`, `PdfToTiff`, `PdfToWebp`, `PdfToDocx`, `PdfToExcel`, `PdfToPptx`,
   `EncryptDecryptPdf`, `TextColor`, `ConvertToPdfPages`, `SecureOptimizePages`
   (superseded by the route-aware components above).

### Phase 2 — Weeks 2–10: Authority / backlinks (runs in parallel, highest leverage)

This is the front that actually moves position 55 → page 1. Do it continuously.

> **This phase is human, off-platform work** — launching, listing, posting, emailing.
> It can't be code-implemented, and faking it (bought links, bot posts) backfires.
> **Execution kit prepared:** [docs/PHASE2_BACKLINKS.md](docs/PHASE2_BACKLINKS.md) —
> paste-ready copy in every length, a ranked directory target list with URLs, a
> Product Hunt launch kit + maker comment, Show HN / outreach templates, and a tracker.

| # | Task | Status |
|---|---|---|
| 2.1 | **Launch on Product Hunt** with the privacy angle. | 📋 Kit ready — launch copy, gallery plan, maker comment, prep checklist in the doc. Human to execute. |
| 2.2 | **List on tool directories** (AlternativeTo, SaaSHub, Slant, G2, Capterra, BetaList…). | 📋 Kit ready — ranked target list + URLs + copy. Human to execute. |
| 2.3 | **Blogger / roundup outreach.** | 📋 Kit ready — personalised email template. Human to execute. |
| 2.4 | **Reddit / HN / forums.** | 📋 Kit ready — Show HN + Reddit templates, subreddit list, etiquette rules. Human to execute. |
| 2.5 | **GitHub presence.** | ✅ **README rewritten** to be link-worthy (privacy-first framing, tool list, architecture). Make the repo public + add topics to earn the backlink. |
| 2.6 | **Digital PR angle.** | 📋 Covered by the outreach template + the "why no-upload matters" framing. Human to execute. |
| — | **Social preview image** (supports every earned link). | ✅ **Done** — replaced the 512² square logo with a proper 1200×630 `og-image.png` (generator: `node generateOgImage.js`); wired into OG + Twitter meta and `PageSeo`. |

**Target: 15–30 referring domains by week 10.** That alone should pull average position from ~55 into the 20s for tail terms.

### Phase 3 — Weeks 4–12: Topical authority via content

You have only **3 blog posts** — too thin to signal topical authority.

| # | Task |
|---|---|
| 3.1 | Build a **privacy + how-to content cluster** (hub-and-spoke). Pillar: "Private, offline file processing." Spokes: one deep how-to per tool category + privacy explainers. Use the `seo-cluster` skill to design it. |
| 3.2 | Publish **8–12 how-to articles** targeting question keywords ("how to combine scanned pages into one PDF without uploading", "how to convert PDF to CBZ for comics"). Each links to the matching tool. |
| 3.3 | Add **E-E-A-T signals**: an About page with who's behind FilePilot, a real author byline on the blog, "last updated" dates. Google trusts anonymous utility sites less. |

### Phase 4 — Ongoing: Performance, AI search, monitoring

| # | Task |
|---|---|
| 4.1 | **Core Web Vitals.** Your bundles are heavy (index 499K + pdf-lib 428K + pdfjs 402K + ONNX 387K). Confirm these are lazy-loaded per-tool (they appear code-split — verify tool JS doesn't load on the homepage). Check field data in GSC → Core Web Vitals + PageSpeed. Aim LCP < 2.5s, INP < 200ms on the prerendered shell. |
| 4.2 | **GEO / AI search.** You already have llms.txt — good. Add HowTo schema (0.2) + concise, quotable answer paragraphs so ChatGPT/Perplexity/AI Overviews cite you. This is a growing traffic source the giants under-optimize. |
| 4.3 | **Rank tracking.** Track your 12 priority terms weekly. Watch GSC position trend, not clicks (clicks lag position by weeks). |
| 4.4 | **Drift monitoring.** Use the `seo-drift` skill to baseline SEO-critical elements so a deploy never silently breaks titles/canonicals/schema. |

---

## 4. Realistic targets

| Milestone | Metric | Timeframe |
|---|---|---|
| Impressions doubling | 344 → 700+/mo | ~6 weeks |
| First real clicks | 10–30 clicks/mo | ~8–10 weeks (tail terms hitting page 1–2) |
| Avg position | 55 → high 20s | ~10–12 weeks |
| Referring domains | 0 → 20–30 | ~10 weeks |
| Meaningful traffic | 300–800 clicks/mo | ~4–6 months |

Head terms ("merge pdf", "compress pdf") are a **12–24 month** fight and only after real authority exists. Don't measure success by them yet.

---

## 5. What NOT to do

- ❌ Don't chase "merge pdf" / "pdf converter" head terms now — guaranteed zero ROI at DR 0.
- ❌ Don't add fake `aggregateRating` / review schema (you have none) — it's a manual-action risk.
- ❌ Don't spin up 500 thin programmatic pages — index bloat will *lower* your average quality signal.
- ❌ Don't buy backlinks — earn them with the privacy angle.
- ❌ Don't obsess over CTR at position 55; it is mathematically ~0 there. Fix position first.

---

## 6. The one-sentence version

Your tech is done — now **win a dozen niche tool keywords, own the "no-upload privacy" angle, and grind 20–30 real backlinks**; that combination is what drags you from page 5 to page 1, and nothing else will.
