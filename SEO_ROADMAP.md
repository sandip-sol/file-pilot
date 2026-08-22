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

### Phase 0 — Quick wins ✅ complete (2026-08-22)

| # | Task | Status |
|---|---|---|
| 0.1 | **Verify indexation.** | ✅ **Automated half done, GSC half still manual.** `npm run seo:crawl` fetches every sitemap URL from production and checks status, canonical, robots meta, `X-Robots-Tag`, H1 count, schema and prerendered word count. Current result: **96/96 live routes crawlable and indexable.** It caught `/privacy` and `/terms` shipping no JSON-LD at all (now fixed). A new `seoValidate` gate also fails the build on any route that is routed in `App.tsx` but has no HTML, no sitemap entry and no redirect — the exact defect that made `/image-requirements` a silent 404. The GSC/Bing coverage report still has to be read in the browser: [docs/PRIORITY_TOOLS.md](docs/PRIORITY_TOOLS.md#phase-0-manual-checklist--cant-be-automated--do-in-the-browser). |
| 0.2 | **Add HowTo schema** to every tool page. | ✅ **Done and now verified live** — `buildHowToSchema` in `prerender.js`, gated in `seoValidate.js` at build time and re-checked against production by `seo:crawl`. |
| 0.3 | **Submit to IndexNow + GSC** after every deploy. | ✅ **Now actually runs.** It never had: `INDEXNOW_KEY` was unset, so every build printed a quiet warning, published no key file and submitted nothing. The build now ends with `node indexnow.js --post-deploy` (production context only, never on previews, never fails the deploy), and a missing key produces a loud, actionable error instead of a warning. **Requires one manual step: set `INDEXNOW_KEY` in Netlify** (see [.env.example](.env.example)). Google ignores IndexNow — use GSC URL Inspection there. |
| 0.4 | **Pick your winnable tail tools and tag them as priority.** | ✅ **Done, now 13.** `PRIORITY_TAIL_ROUTES` in `seoRoutes.js` (sitemap priority 0.85); `/image-requirements` added — "resize image to 50kb" and its family are the highest-volume winnable terms on the site, and the page was 404ing until this pass. Keyword targets in [docs/PRIORITY_TOOLS.md](docs/PRIORITY_TOOLS.md). |
| 0.5 | **Fix the brand collision.** | ✅ **Done, scoped correctly.** The collision is not one Windows app — it is filepilot.tech *plus* filepilot.org, filepilot.online and filepilottools.top doing the same thing. Homepage `Organization` schema now carries `sameAs`, an explicit "website, not a desktop app, not affiliated with…" description, `knowsAbout`, and a `WebSite → publisher → Organization` edge. **`ORGANIZATION_PROFILES` in `prerender.js` is the single place to add every profile you create** — each is both a `sameAs` edge and a Phase 2 backlink. |

**Phase 0 exit check:** `npm run build && npm run seo:crawl` — both green.

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
| 1.1 | **Rewrite the priority tool pages for their exact keyword.** | ✅ **Done (13/13)** — keyword-first titles + `\| FilePilot` suffix, verified identical between client and prerender; H1s aligned; HowTo live; unique intros; "when to use this vs …" on every focus page. `/image-requirements` received the full treatment when it was rescued from its 404 in Phase 0. |
| 1.2 | **Unique FAQs per tool.** | ✅ **Done (13/13)** — 5–6 tool-specific FAQs each, single-sourced so the visible accordion and the FAQPage schema always match. |
| 1.3 | **Comparison/alternative pages.** | ✅ **Done — 4 pages shipped (2026-08-22).** `/smallpdf-alternative`, `/ilovepdf-alternative`, `/adobe-acrobat-online-alternative`, `/pdf24-alternative`. 773–916 crawlable words each, `WebPage` + `BreadcrumbList` + `FAQPage` schema, 17 internal links each, linked from the `/pdf-tools` hub and the homepage. Format chosen deliberately: **"alternative to X", not "FilePilot vs X"** — the vs-terms need brand recognition the site does not yet have, while "smallpdf alternative" already has volume from people looking to switch. Content lives in `src/data/comparisons.ts`. |
| 1.4 | **Internal-linking hubs.** Each tool should link to 3–5 *related* tools, not the generic footer. | ✅ **Done (84/84).** This had only ever covered the 12 focus tools. **61 of 84 tool pages were still falling back to a flat list of `/pdf-tools`, `/image-tools`, `/merge`, `/compress`, `/compress-image`** — funnelling the entire site's internal link equity into five head-term pages it cannot win. Worse, there were *two* competing graphs: `RELATED_ROUTES` in `seoRoutes.js` (23 entries, crawlable HTML) and `relatedToolSlugs` in `RelatedTools.tsx` (34 entries, rendered DOM), which **disagreed on 6 of the 10 routes they shared**. Both now resolve through `src/data/relatedTools.ts`: curated neighbours first, then same-category siblings picked by registry adjacency. Verified 0 mismatches, 0 head-term-only pages; the most-linked page now has 12 inbound internal links instead of ~305 across five. |

**Guardrails added so Phase 1 cannot silently regress** (all in `seoValidate.js`, all build-failing):

- Every routed page must spread `toolSeo()`/`siteSeo()` into `<PageSeo>` — no literal titles.
- Every route in `App.tsx` must have prerendered HTML, a sitemap entry or a redirect.
- Every tool page must carry ≥3 related links, none of them self, none head-term-only, all present in the prerendered HTML.
- **Every sitemap URL must be linked from some other page's prerendered HTML.** This one immediately caught `/support` and `/terms`, which were in the sitemap with zero crawlable inbound links because the footer only exists in the React render.
- `isToolRoute` now has one definition, exported from `seoRoutes.js`. `prerender.js` and `seoValidate.js` each kept their own hard-coded copy, so registering the comparison pages made both demand HowTo schema of them.

**Follow-ups still open:**
1. **45 of 100 titles exceed 60 characters** and truncate in SERPs (worst: `/extract-text` at 78). Deliberately deferred — this is a click-through cost, and click-through is irrelevant at average position 58. Revisit when tail terms reach page 2.
2. **15 dead page components** are never routed: `JpgToPdf`, `PdfToJpg`, `BmpToPdf`, `HeicToPdf`, `WebpToPdf`, `TiffToPdf`, `PdfToPng`, `PdfToTiff`, `PdfToWebp`, `PdfToDocx`, `PdfToExcel`, `PdfToPptx`, `EncryptDecryptPdf`, `TextColor`, `ConvertToPdfPages`, `SecureOptimizePages`. No SEO impact — they do not ship — but they carry stale `PageSeo` blocks. `PdfToBmp` was deleted in the 2026-08-22 pass.
3. **Thin hub pages**: `/ai-tools` (71 words) and `/image-workflows` (84) are thin because they hold few tools. Worth a paragraph each.

**Phase 1 exit check:** `npm run build && npm run seo:crawl` — 100 routes, both green.

### Phase 2 — Weeks 2–10: Authority / backlinks (the actual constraint)

> ⚠️ **This phase is human, off-platform work.** Creating accounts, launching,
> posting to forums and emailing people cannot be code-implemented, and faking it
> (bought links, bot posts, sock puppets) gets flagged and burns your one first
> impression. What *was* automated on 2026-08-22 is the preparation and the
> measurement — not the execution.
>
> **Execution kit:** [docs/PHASE2_BACKLINKS.md](docs/PHASE2_BACKLINKS.md).

**Baseline, measured rather than assumed:** `npm run seo:backlinks` reports
**1 referring domain, 0 authority-passing.** Everything below starts from zero.

| # | Task | Status |
|---|---|---|
| 2.1 | **Launch on Product Hunt.** | 📋 Kit ready — **human to execute.** Note the outbound link is nofollow: launch for attention and the secondary coverage it attracts, not for the link. |
| 2.2 | **List on tool directories.** | 📋 Kit ready — **human to execute.** Ranked target list with URLs; all verified reachable 2026-08-22 (several return 403 to scripts — that is bot-blocking, not a dead link). |
| 2.3 | **Blogger / roundup outreach.** | 📋 Kit ready — **human to execute.** Template now points recipients at the matching Phase 1.3 comparison page, which concedes real limitations and so reads as credible rather than promotional. **Blocker partly cleared:** `/about` now exists (pulled forward from 3.3) — 1,265 crawlable words covering who builds it, the actual libraries, how to verify the no-upload claim, funding, honest limitations, brand disambiguation, and a press kit with boilerplate and assets. **It still has no name on it** — `maintainer` in `src/data/aboutContent.ts` is deliberately `null` rather than invented. Fill it in before sending outreach; the build warns until you do. |
| 2.4 | **Reddit / HN / forums.** | 📋 Kit ready — **human to execute.** Verified 2026-08-22: **HN front-page story links are dofollow**, so a Show HN that gets traction is the single most valuable link on this list. Reddit is nofollow. |
| 2.5 | **GitHub presence.** | ⚠️ **Half done.** Repo is public and the README is rewritten — but `description`, `homepage` and `topics` are all **empty**, so the repo earns nothing and the sidebar has no link to the site. Two-minute fix, checklist in the kit. Also corrected: the kit claimed a repo + README link was "a durable, high-trust backlink". **It is `rel="nofollow"`** — verified by fetching the page. Real value is discovery, referral traffic and entity disambiguation, not authority. |
| 2.6 | **Digital PR angle.** | 📋 Covered by the outreach template and the comparison pages. |
| — | **Measurement.** | ✅ **New — `npm run seo:backlinks`.** The tracker was a markdown table of checkboxes, which cannot tell a live link from a rejected submission. The checker fetches every recorded listing and reports `LIVE` (with dofollow/nofollow), `MISSING` (with whether the site is at least mentioned — usually means the URL field was dropped), `BLOCKED` (host refused the request; **not** a missing link) or `NOT SUBMITTED`. Targets live in [backlinkTargets.js](backlinkTargets.js); paste a listing URL in as each goes live. |
| — | **Social preview image.** | ✅ Done — 1200×630 `og-image.png`. |

**Target: 15–30 referring domains by ~week 10**, tracking the dofollow count
separately since that is what moves average position. Re-run the checker monthly
and cross-check against Bing Webmaster Tools → Backlinks and GSC → Links, which
see links from places no local list covers.

### Phase 3 — Topical authority via content ✅ complete (2026-08-22)

The blog went from **3 posts to 12**, and from ~240 crawlable words total to
**11,952**. The three originals were migrated mechanically, so their wording is
byte-for-byte unchanged.

**Architectural fix landed first.** Posts were hand-written `.tsx` components
whose prose the prerenderer recovered with a regex over the JSX. That survived
three posts and would not have survived twelve. Content now lives in
`src/data/blogContent.ts` as blocks; one `BlogPost.tsx` renders them and the
prerenderer emits the same blocks as static HTML. `extractArticleHtml` is gone,
along with the three per-post components. Two drifts were found and closed on the
way: `Blog.tsx` had a hardcoded list of **3** posts while the prerendered index
listed **12**, and `seoCrawl.js` still classified routes with a list written
before `/about` and the comparison pages existed — it was reporting five healthy
pages as broken.

| # | Task | Status |
|---|---|---|
| 3.1 | **Privacy + how-to content cluster (hub-and-spoke).** | ✅ **Done.** Pillar: [`/blog/edit-pdf-without-uploading`](https://www.filepilot.space/blog/edit-pdf-without-uploading/) — 1,295 words, 34 internal links. **Pillar → all 11 spokes, all 11 spokes → pillar**, both enforced by a build gate. |
| 3.2 | **Publish 8–12 how-to articles targeting question keywords.** | ✅ **Done — 9 new posts, 773–1,295 words each**, every one with `BreadcrumbList` + `BlogPosting` + `FAQPage` schema and a link to the tool that performs the task. |
| 3.3 | **E-E-A-T signals.** | ✅ **Mostly done.** `/about` shipped (pulled forward in the Phase 2 pass). Author bylines and "last updated" dates now render on every post and feed `author` / `datePublished` / `dateModified`. **Still open: a real name.** `maintainer` in `src/data/aboutContent.ts` is `null`, so posts fall back to an Organization byline. The build warns. |

**The anti-cannibalisation rule — the important design decision.** A post must
never target the same keyword as a tool page. `/pdf-to-cbz` already owns "pdf to
cbz" with HowTo schema; a post aiming at that term would have split the signal
rather than added to it. So tool pages keep transactional intent ("pdf to cbz",
"resize image to 50kb") and posts take informational intent — "why online forms
reject your photo", "why blacking out text doesn't redact it", "PDF or CBZ for
comics?" — handing the reader to the tool at the point of action. Every post
declares a `primaryTool`, and a build gate fails on a title that duplicates a
tool page's.

**The nine new posts:**

| Post | Targets | Sends readers to |
|---|---|---|
| Edit a PDF without uploading it anywhere *(pillar)* | edit pdf without uploading, offline pdf editor | `/pdf-tools` |
| Is it safe to upload a PDF to an online tool? | is it safe to upload pdf, are online pdf tools safe | `/pdf-tools` |
| Why blacking out text doesn't redact it | pdf redaction failure, black box pdf not removed | `/redact-pdf` |
| Why online forms reject your photo | photo rejected online form, image too large for form | `/image-requirements` |
| What EXIF data reveals about your photos | does a photo contain my location, exif gps | `/remove-image-metadata` |
| How to combine scanned pages into one PDF | combine scanned pages, scan too large to email | `/merge` |
| Compress a PDF without wrecking the quality | why is my pdf so large, compress without quality loss | `/compress` |
| PDF or CBZ for comics and manga? | cbz vs pdf, what is a cbz file | `/pdf-to-cbz` |
| Printing multiple PDF pages per sheet | n-up vs booklet, print poster across pages | `/n-up-pdf` |

**Guardrails added** (`seoValidate.js`, build-failing, negative-tested):

- Pillar must link to every spoke; every spoke must link back to the pillar.
- Every post must declare a `primaryTool` that is an indexable route, and the
  prerendered HTML must actually contain that link.
- No post title may duplicate a tool page's title.

**Phase 3 exit check:** `npm run build` — 110 routes, green.

### Phase 4 — Performance, AI search, monitoring ✅ complete (2026-08-22)

| # | Task | Status |
|---|---|---|
| 4.1 | **Core Web Vitals.** | ✅ **Done — and the roadmap's hunch was right for the wrong reason.** The engines *were* code-split, but `manualChunks` had made the pdf-lib chunk the host for Rollup's shared CommonJS interop helpers, so **the entry chunk imported it — every page on the site downloaded and executed a PDF engine to get a few lines of interop shim.** Removing the config took the homepage from **401 KB to 224 KB gzipped, a 44% cut**. Four strategies were measured; three made it worse (534, 469, 422 KB) and the numbers are recorded in `vite.config.ts` so nobody re-adds it on intuition. New `npm run seo:budget` fails the build if a content page exceeds its budget or statically imports a heavy engine. |
| 4.2 | **GEO / AI search.** | ✅ **Done.** `llms.txt` was an index — titles and URLs, nothing quotable. Added **`llms-full.txt`: 34,000 words, 351 question-and-answer pairs**, generated from the same data the site renders from, so an assistant ingests one file instead of crawling 110 pages. Referenced from `llms.txt` and served as UTF-8. AI crawler access (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) was already verified in Phase 0, and since none of them execute JavaScript, the prerendered shell is what they read — which is why Phase 3's word counts mattered. |
| 4.3 | **Rank tracking.** | ✅ **Done, within what is possible without paid data.** Live SERP APIs cost money and scraping Google breaks its terms, so `npm run seo:ranks` reads the CSV Search Console already exports for free (Performance → Export → CSV → `Queries.csv`) and appends a dated snapshot to `seo-ranks.json`, reporting movement per term. The 48 tracked terms are machine-readable in `src/data/trackedKeywords.ts`. **It reports position, not clicks** — at position 58 the click count is noise, and judging this work by clicks for the first few months would mean concluding it failed while it was working. |
| 4.4 | **Drift monitoring.** | ✅ **Done — `npm run seo:drift`.** `seoValidate` enforces invariants and cannot detect *change*: every rule still passes when a refactor silently rewrites 40 titles. This snapshots title, description, canonical, robots, H1, schema types, word count and internal links for all 110 routes into a committed `seo-baseline.json`, so drift shows up in code review like any other diff. Intentional edits are accepted with `-- --save`. Every regression in this project's history would have surfaced here. |

**The tooling now in place**

| Command | What it catches |
|---|---|
| `npm run build` | Runs validate + budget. Fails on broken SEO or a payload regression. |
| `npm run seo:validate` | Invariants: titles, canonicals, schema, orphan routes, internal links, cluster integrity, client/prerender drift. |
| `npm run seo:budget` | A content page importing a processing engine, or exceeding its gzip budget. |
| `npm run seo:drift` | Unintended change to any SEO-critical field since the last accepted baseline. |
| `npm run seo:crawl` | What production actually serves — status, canonical, robots, schema, word count. |
| `npm run seo:backlinks` | Whether a submitted listing produced a real, live, dofollow link. |
| `npm run seo:ranks` | Position trend for the 48 tracked terms, from a GSC CSV export. |

---|---|
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
