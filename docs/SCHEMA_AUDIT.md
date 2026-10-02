# FilePilot — Schema.org / JSON-LD Audit

Audited 2026-10-01 against the live site (all 110 sitemap URLs fetched) and the generator in `prerender.js`.

## 1. Current state (verified)

| Check | Result |
|---|---|
| Pages crawled | 110 / 110 return 200 |
| JSON-LD blocks per page | exactly 1 on every page (`#page-schema`) |
| JSON parse errors | 0 |
| Dangling `@id` references | 0 |
| Canonical ≠ URL | 0 |
| FAQ questions not visible in HTML | 0 |
| Node counts | Organization 110, WebSite 110, BreadcrumbList 109, WebPage 104, FAQPage 99, HowTo 84, SoftwareApplication/WebApplication 194, BlogPosting 12, Blog 13, CollectionPage 5, AboutPage 1, SoftwareSourceCode 1 |

**This is not a site with missing schema.** The graph is connected, `@id`s are stable and page-scoped, the logo is a PNG, no fake ratings or SearchAction are declared, and the FAQ content matches what's on the page. What remains is **entity weakness** (machines can't tell *which* FilePilot this is or *who* wrote it) and **low per-page differentiation** (84 tool nodes look nearly identical). Those limit how much search engines and LLMs can say about the site. Validation errors aren't the problem.

## 2. Findings, highest to lowest impact

### P1 — Entity disambiguation: `Organization.sameAs` has 1 URL (HIGH)
Live: `"sameAs":["https://github.com/sandip-sol/file-pilot"]`. The code's own threshold (`MIN_ORGANIZATION_PROFILES = 3`) isn't met.

**Why it hurts:** "FilePilot" collides with filepilot.tech (Windows file manager, the dominant entity), an iOS app, and filepilot.org / .online / filepilottools.top. Knowledge-graph and LLM entity resolution works by corroboration. With one link, the `disambiguatingDescription` is an unverified self-claim. Branded queries and AI answers can attribute your pages to the wrong product, or skip the site as an unresolved entity.

**Fix (off-site work first, then one line of code):** create profiles that name and link `https://www.filepilot.space/`, then add them to `ORGANIZATION_PROFILES` in `src/data/aboutContent.ts`:
- Wikidata item (instance of: web application; official website: filepilot.space; "different from" the File Pilot file manager item). This is the strongest single signal.
- Product Hunt, AlternativeTo, SaaSHub listing pages
- X / LinkedIn / Mastodon page for FilePilot (also unlocks `twitter:site`)

### P1 — No human author: all 12 `BlogPosting.author` → Organization (HIGH)
`maintainer` is `null` in `aboutContent.ts`, so no `Person` node is emitted and every post is authored by the brand.

**Why it hurts:** posts on privacy and security are YMYL-adjacent. Google's Article guidance and E-E-A-T evaluation favour a named, linkable author, and LLMs cite "who says so" when picking sources. An organization byline on a 4-month-old domain carries almost no authority.

**Fix:** fill in the commented `maintainer` template in `aboutContent.ts` (it's already wired: `Person` node, `founder`, `article:author`, and `author` switch over automatically). Give it at least one `profiles` URL (GitHub, LinkedIn). Whether to publish a real name and email is your call.

### P2 — Every page uses the same image (MEDIUM-HIGH)
`primaryImageOfPage` is `#og` (`og-image.png`) on all 110 pages, and all 12 `BlogPosting.image` values point to it. No post sets `image` in `blogContent.ts`.

**Why it hurts:** Article rich results and Discover need a *representative* image, preferably ≥1200px wide and supplied in 16:9, 4:3 and 1:1. A shared brand card is "not representative", so posts are ineligible for image treatments. Image search gets 110 pages competing for one asset.

**Fix:** set `image` per post (the pipeline already emits a per-post `ImageObject`). For tool pages, generate per-tool OG cards with `generateOgImage.js` and add an optional `image` to `pageNode` (see §4.3).

### P2 — Tool nodes are nearly indistinguishable (MEDIUM)
`featureList` is authored on only **6 of ~85** tools. Every other tool node is just `name + description + subcategory + free offer`.

**Why it hurts:** `featureList` is the only machine-readable statement of what a tool can do: supported formats, limits, options. Without it, "compress PDF to under 100KB" or "merge PDFs with bookmarks" can only be matched from prose. That's the comparison AI answers and Google's software surfaces make.

**Fix:** add `features: string[]` to each entry in `src/data/toolContent.ts`, using concrete, checkable capabilities (formats in and out, batch support, size targets, options). Prioritise the 20 highest-traffic tools in `docs/PRIORITY_TOOLS.md`.

### P2 — Blog posts don't connect to the tools they promote (MEDIUM)
Each post has `primaryTool` and `related` in `blogContent.ts`, but `BlogPosting` has no `about` / `mentions`, `articleSection`, `keywords` or `wordCount`.

**Why it hurts:** the content-to-product link exists only in the HTML anchors. Declaring it lets machines attribute topical authority from the article cluster to the tool entity, which is exactly what the hub-and-spoke strategy is for.

**Fix:** see §4.2.

### P3 — Competitor nodes on `/…-alternative/` pages are bare strings (MEDIUM-LOW)
`{"@type":"SoftwareApplication","name":"Smallpdf",…}`: no `url`, no `sameAs`.

**Why it hurts:** "Smallpdf" in your graph can't be resolved to the known Smallpdf entity, so the comparison relationship (`mentions`) points at nothing. Identity links aren't claims about the competitor's product. The current code comment conflates the two.

**Fix:** add `url` (their homepage) and, where one exists, the Wikipedia/Wikidata URL as `sameAs`. Verify each ID by hand. Don't guess Q-numbers.

### P3 — Identical FAQ answers across pages (LOW-MEDIUM)
"No. All processing is done in your browser. Your file never leaves your device." appears verbatim on 11 tool pages (`toolContent.ts`).

**Why it hurts:** FAQ rich results are now limited to government and health sites (since Aug 2023), so the value of `FAQPage` here is AI and passage retrieval. Duplicated Q&A text dilutes it, because only one copy gets cited. Rewrite each answer to name what that specific tool reads, keeps in memory, or discards.

### P4 — `ContactPoint` has no `email` (LOW)
Only `url` is set. Google's Organization docs list `email` / `telephone` as the contact fields it reads. Add a support address if you're willing to publish one.

### P4 — Stale legacy graph in `index.html` (LOW, latent)
The source template still ships the old graph (SVG logo, `icon-512.png` as `screenshot`, an ItemList). Prerender replaces it on every route, but if prerender is ever skipped or fails partway, that graph goes live. Replace it with a comment placeholder or the minimal spine.

### P4 — `HowTo.tool` references a `SoftwareApplication` (LOW)
The schema.org range of `tool` is `HowToTool | Text`. Validators may warn. Google stopped showing HowTo rich results in Sept 2023, so this matters only for strict validators. Optional fix: add `"HowToTool"` to the tool node's `@type` array.

## 3. Types requested but deliberately NOT recommended

| Type | Verdict | Reason |
|---|---|---|
| **LocalBusiness** | ❌ Do not add | No physical premises, address or opening hours. A LocalBusiness without a real address violates Google's structured-data guidelines and risks a manual action. |
| **Product** | ❌ Do not add | A free web app is modelled correctly as `SoftwareApplication` (already present). Product snippets need genuine `review`/`aggregateRating`. Typing the app as Product as well adds a competing entity. |
| **Service** | ❌ Not needed | `SoftwareApplication` + `provider` already says "Org provides this software". A parallel Service node would duplicate the entity. |
| **AggregateRating / Review** | ❌ Not yet | Self-serving ratings have been ineligible since 2019. Add only when there's real third-party review data. |
| **WebSite SearchAction** | ❌ Not needed | No `/search` route, and Google retired the sitelinks search box in Nov 2024. |
| **Article** | ✅ Already covered | `BlogPosting` is a subtype of Article. |

## 4. Production JSON-LD by page archetype

These are the **target** graphs. They match what `prerender.js` emits today, with the fixes above added (marked `// NEW` in the notes after each block; JSON has no comments). Generate them from the build script; don't paste them into pages by hand, or they'll drift from the content.

### 4.1 Spine (every page), with Organization and Person upgrades

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.filepilot.space/#organization",
      "name": "FilePilot",
      "alternateName": ["FilePilot File Tools", "filepilot.space"],
      "url": "https://www.filepilot.space/",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://www.filepilot.space/#logo",
        "url": "https://www.filepilot.space/icon-512.png",
        "contentUrl": "https://www.filepilot.space/icon-512.png",
        "width": 512, "height": 512, "caption": "FilePilot"
      },
      "image": { "@id": "https://www.filepilot.space/#logo" },
      "description": "FilePilot is a free, privacy-first web app offering browser-based PDF, image, and file tools that process files locally on your device without uploads.",
      "disambiguatingDescription": "A free web app at filepilot.space for browser-based PDF and image editing. Not the File Pilot Windows file manager at filepilot.tech, not the FilePilot iOS app, and not affiliated with filepilot.org, filepilot.online or filepilottools.top.",
      "foundingDate": "2026-01-23",
      "founder": { "@id": "https://www.filepilot.space/#person" },
      "sameAs": [
        "https://github.com/sandip-sol/file-pilot",
        "https://www.wikidata.org/wiki/Q_FILEPILOT_ITEM",
        "https://www.producthunt.com/products/FILEPILOT_SLUG",
        "https://alternativeto.net/software/FILEPILOT_SLUG/about/"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "@id": "https://www.filepilot.space/#contact",
        "contactType": "customer support",
        "url": "https://www.filepilot.space/support/",
        "email": "SUPPORT_EMAIL",
        "availableLanguage": "en"
      },
      "termsOfService": "https://www.filepilot.space/terms/",
      "mainEntityOfPage": "https://www.filepilot.space/about/"
    },
    {
      "@type": "Person",
      "@id": "https://www.filepilot.space/#person",
      "name": "MAINTAINER_NAME",
      "jobTitle": "Maintainer",
      "url": "https://www.filepilot.space/about/",
      "sameAs": ["https://github.com/sandip-sol"],
      "knowsAbout": ["client-side document processing", "PDF file format internals", "WebAssembly", "browser privacy"],
      "worksFor": { "@id": "https://www.filepilot.space/#organization" }
    },
    {
      "@type": "WebSite",
      "@id": "https://www.filepilot.space/#website",
      "url": "https://www.filepilot.space/",
      "name": "FilePilot",
      "alternateName": "filepilot.space",
      "inLanguage": "en",
      "publisher": { "@id": "https://www.filepilot.space/#organization" }
    },
    {
      "@type": ["SoftwareApplication", "WebApplication"],
      "@id": "https://www.filepilot.space/#app",
      "name": "FilePilot",
      "url": "https://www.filepilot.space/",
      "applicationCategory": "UtilityApplication",
      "applicationSubCategory": "Document and image editing",
      "operatingSystem": "Web browser (Chrome, Edge, Firefox, Safari)",
      "browserRequirements": "Requires JavaScript and a browser with WebAssembly support.",
      "isAccessibleForFree": true,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
      "provider": { "@id": "https://www.filepilot.space/#organization" }
    }
  ]
}
```
New: three or more `sameAs` profiles, `contactPoint.email`, the `Person` node and `founder`. Replace every `UPPER_CASE` placeholder with a real value or delete the line. **Never publish a placeholder.**

### 4.2 Blog post (`/blog/{slug}/`): BlogPosting additions

```json
{
  "@type": "BlogPosting",
  "@id": "https://www.filepilot.space/blog/why-files-stay-in-browser/#article",
  "headline": "Why Your Files Should Never Leave Your Browser",
  "description": "Uploading files to remote servers introduces privacy risks, data breaches, and unclear retention policies. Learn how browser-based processing with WebAssembly and Web Workers keeps your documents private.",
  "url": "https://www.filepilot.space/blog/why-files-stay-in-browser/",
  "mainEntityOfPage": { "@id": "https://www.filepilot.space/blog/why-files-stay-in-browser/#webpage" },
  "isPartOf": { "@id": "https://www.filepilot.space/blog/#blog" },
  "image": { "@id": "https://www.filepilot.space/blog/why-files-stay-in-browser/#image" },
  "author": { "@id": "https://www.filepilot.space/#person" },
  "publisher": { "@id": "https://www.filepilot.space/#organization" },
  "datePublished": "2026-06-26T18:32:21+05:30",
  "dateModified": "2026-08-22T18:54:59+05:30",
  "inLanguage": "en",
  "timeRequired": "PT5M",
  "articleSection": "privacy",
  "wordCount": 1450,
  "about": {
    "@type": ["SoftwareApplication", "WebApplication"],
    "@id": "https://www.filepilot.space/remove-image-metadata/#app",
    "name": "Remove Image Metadata",
    "url": "https://www.filepilot.space/remove-image-metadata/"
  },
  "mentions": [
    { "@type": ["SoftwareApplication", "WebApplication"], "@id": "https://www.filepilot.space/merge/#app", "name": "Merge PDFs", "url": "https://www.filepilot.space/merge/" }
  ]
}
```
New: `articleSection` (from `cluster`), `wordCount` (counted from `blocks`), `about` (the `primaryTool` stub), `mentions` (the `related` stubs), per-post `image`. The `about`/`mentions` stubs carry `name` + `url` so they resolve on this page, as the graph invariant in `prerender.js` requires. `wordCount` and the tool values above are examples; generate them from the post data.

### 4.3 Tool page (`/merge/`): WebPage + app additions

```json
[
  {
    "@type": "WebPage",
    "@id": "https://www.filepilot.space/merge/#webpage",
    "url": "https://www.filepilot.space/merge/",
    "name": "Merge PDFs",
    "isPartOf": { "@id": "https://www.filepilot.space/#website" },
    "breadcrumb": { "@id": "https://www.filepilot.space/merge/#breadcrumb" },
    "mainEntity": { "@id": "https://www.filepilot.space/merge/#app" },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "@id": "https://www.filepilot.space/merge/#image",
      "url": "https://www.filepilot.space/og/merge.png",
      "width": 1200, "height": 630
    },
    "inLanguage": "en"
  },
  {
    "@type": ["SoftwareApplication", "WebApplication"],
    "@id": "https://www.filepilot.space/merge/#app",
    "name": "Merge PDFs",
    "url": "https://www.filepilot.space/merge/",
    "applicationCategory": "UtilityApplication",
    "applicationSubCategory": "PDF organiser",
    "operatingSystem": "Web browser (Chrome, Edge, Firefox, Safari)",
    "isAccessibleForFree": true,
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
    "featureList": [
      "Combine two or more PDF files into one document",
      "Reorder files before merging",
      "Works offline once the page has loaded",
      "No file size cap imposed by a server"
    ],
    "isPartOf": { "@id": "https://www.filepilot.space/#app" },
    "provider": { "@id": "https://www.filepilot.space/#organization" }
  },
  {
    "@type": "BreadcrumbList",
    "@id": "https://www.filepilot.space/merge/#breadcrumb",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "FilePilot", "item": "https://www.filepilot.space/" },
      { "@type": "ListItem", "position": 2, "name": "PDF Tools", "item": "https://www.filepilot.space/pdf-tools/" },
      { "@type": "ListItem", "position": 3, "name": "Merge PDFs" }
    ]
  }
]
```
New: per-tool `primaryImageOfPage` and an authored `featureList`. List only features the tool actually has. FAQPage and HowTo stay as they are.

### 4.4 Comparison page (`/smallpdf-alternative/`): competitor identity

```json
{
  "@type": "SoftwareApplication",
  "@id": "https://www.filepilot.space/smallpdf-alternative/#competitor",
  "name": "Smallpdf",
  "url": "https://smallpdf.com/",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Web browser"
}
```
Do the same for iLovePDF (`https://www.ilovepdf.com/`), Adobe Acrobat online (`https://www.adobe.com/acrobat/online.html`) and PDF24 (`https://tools.pdf24.org/`). Add `sameAs` only with Wikipedia/Wikidata URLs you've checked by hand.

### 4.5 Unchanged archetypes (already correct)
- **Home**: `WebPage` (mainEntity = `#app`) + `ItemList` of the four hubs + FAQPage. Keep.
- **Hubs** (`/pdf-tools/` …): `CollectionPage` + `ItemList` of tool `#app` nodes + BreadcrumbList. Keep.
- **About**: `AboutPage` (mainEntity = Organization) + `SoftwareSourceCode`. Once the maintainer is set, add `"mentions": {"@id": "…/#person"}`.
- **Support / Privacy / Terms**: `WebPage` + BreadcrumbList (+ `DonateAction` on Support). Keep.

## 5. Implementation steps (in order)

1. **Off-site entity work** (P1): create the Wikidata item and 2–3 directory or social profiles, then append the URLs to `ORGANIZATION_PROFILES` in `src/data/aboutContent.ts`.
2. **Maintainer** (P1): uncomment and fill `maintainer` in `src/data/aboutContent.ts`. No `prerender.js` change is needed.
3. **Contact email** (P4): in `organizationNode()` (`prerender.js`), add `email` to `contactPoint`.
4. **Blog enrichment** (P2): in the `route.startsWith('/blog/')` branch of `buildJsonLd()`, add:
   ```js
   articleSection: post.cluster,
   wordCount: countWords(post.blocks),           // strip HTML from block.html / block.items
   about: toolStub(post.primaryTool),
   ...(post.related?.length ? { mentions: post.related.filter(isToolRoute).map(toolStub) } : {}),
   ```
   Define `toolStub = (r) => ({ '@type': ['SoftwareApplication','WebApplication'], '@id': nodeId(r,'app'), name: routeLabel(r), url: canonicalUrlForRoute(r) })`. Then set `image` per post in `blogContent.ts`.
5. **Tool featureList** (P2): add `features` to `toolContent.ts` entries. `toolAppNode()` already emits them.
6. **Per-tool images** (P2): extend `generateOgImage.js` to write `public/og/{slug}.png`, then add an `image` override to `pageNode()` and to the `og:image` / `twitter:image` replacement in `withRouteSeo()` so OG and JSON-LD stay in agreement.
7. **Competitor identity** (P3): add `url` (and optional `sameAs`) fields to `src/data/comparisons.ts` and spread them into the `#competitor` node.
8. **FAQ rewrite** (P3): de-duplicate the 11 identical answers in `toolContent.ts`.
9. **Template cleanup** (P4): replace the legacy graph in `index.html` with a minimal spine.
10. **Verify**: `npm run build` (which runs `seoValidate.js`), then test a home, tool, blog and comparison URL in Google's Rich Results Test and validator.schema.org. Submit changed URLs with `npm run indexnow:submit:priority` and request indexing in GSC for the home and about pages.

## 6. What to expect

- **Rich results:** Breadcrumbs and Article (once images and author are fixed) are the only eligible SERP features. FAQ and HowTo rich results won't appear on this site whatever the markup is (Google policy since 2023).
- **The real gain** is entity resolution (P1). It decides whether "FilePilot" queries and AI answers resolve to filepilot.space or to filepilot.tech. That depends more on off-site profiles than on anything in this repo.
