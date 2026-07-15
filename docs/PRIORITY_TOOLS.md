# Phase 1 Priority Tools — The Winnable Long Tail

**Source:** `SEO_ROADMAP.md` → Phase 0.4 / Phase 1.1
**Machine-readable list:** `PRIORITY_TAIL_ROUTES` in `seoRoutes.js`

These 12 tools target keywords the giants (Smallpdf, iLovePDF, PDF24, Adobe) barely
compete for. Each has low search volume but **low competition**, so they are realistically
winnable to page 1 in 2–4 months with focused on-page work + a handful of backlinks.
**Do not spread effort across all 90 tools — win these 12 first.**

Each of these routes is:
- Boosted to sitemap priority `0.85` (above the `0.8` tool default).
- Submittable to IndexNow as a set: `npm run indexnow:submit:tail`.

| # | Route | Primary keyword | Secondary keywords | Why winnable |
|---|-------|-----------------|--------------------|--------------|
| 1 | `/pdf-to-cbz` | pdf to cbz | convert pdf to comic book, pdf to cbz converter | Niche comics audience; giants don't offer it. |
| 2 | `/posterize-pdf` | posterize pdf | enlarge pdf to poster, split pdf into poster tiles, pdf poster print | Specialized print use case, thin SERP. |
| 3 | `/n-up-pdf` | n-up pdf | 2 pages per sheet pdf, multiple pages per sheet, 4 up pdf | Clear intent, weak incumbents. |
| 4 | `/add-page-labels` | add page labels to pdf | pdf roman numeral page numbers, pdf page labels | Very specific; almost no dedicated pages rank. |
| 5 | `/image-to-svg` | image to svg | png to svg, jpg to svg, raster to vector online | Volume + the "no upload" angle differentiates. |
| 6 | `/combine-single-page` | combine pdf into one page | merge pdf pages into single page, stack pdf pages | Unusual operation, sparse competition. |
| 7 | `/pdf-to-greyscale` | pdf to greyscale | convert pdf to black and white, grayscale pdf online | Common need, few dedicated tools. |
| 8 | `/remove-image-metadata` | remove image metadata | strip exif data online, remove exif from photo, clear image metadata | Privacy-aligned; strong "no upload" story. |
| 9 | `/flatten-pdf` | flatten pdf | flatten pdf form, flatten pdf layers, flatten pdf annotations | Real volume, beatable with depth + privacy angle. |
| 10 | `/json-to-pdf` | json to pdf | convert json to pdf, json file to pdf | Dev audience, low competition. |
| 11 | `/markdown-to-pdf` | markdown to pdf | md to pdf, convert markdown to pdf, readme to pdf | Dev/writer audience; privacy angle strong. |
| 12 | `/pdf-to-zip` | pdf to zip | split pdf into zip, pdf pages to zip, batch pdf to zip | Niche batch workflow, thin SERP. |

## What to do on each page (Phase 1.1)

For every route above:

1. **Title = exact primary keyword.** Currently auto-generated as
   `"<Tool> Online - Free and Private | FilePilot"`. Where the tool's registry title
   doesn't match the search term (e.g. registry says "PDF to CBZ"), confirm the primary
   keyword appears verbatim in the title and H1.
2. **Unique 150–200 word intro** in `src/data/toolContent.ts` answering what / why / how.
   (Most already have an `intro` — verify it leads with the primary keyword.)
3. **Real HowTo** — already emitted from `steps` (done in Phase 0.2). Keep steps specific.
4. **4–6 tool-specific FAQs** (Phase 1.2) — replace the shared boilerplate FAQs in
   `prerender.js` with questions unique to the tool
   (e.g. "Does converting PDF to CBZ preserve page/reading order?").
5. **"When to use this vs …" section** contrasting with the server-upload alternative,
   leaning on the no-upload privacy differentiator.

---

## Phase 0 manual checklist (can't be automated — do in the browser)

### 0.1 — Verify indexation (Google Search Console)
- GSC → **Indexing → Pages**. Confirm the count of "Indexed" pages ≈ 95 (sitemap total).
- For any **"Crawled – currently not indexed"** or **"Discovered – not indexed"**:
  - These are usually thin/duplicate. Prioritize the 12 tools above — improve their
    content (steps above), then use **URL Inspection → Request Indexing**.
- GSC → **Sitemaps**: confirm `https://www.filepilot.space/sitemap.xml` shows
  "Success" and the discovered-URL count matches.
- Repeat the same check in **Bing Webmaster Tools → Sitemaps / URL Inspection**.

### 0.3 — Submit after every deploy
After each production deploy (content or schema changes):
```bash
# One-time / after a site-wide change like the HowTo rollout:
npm run indexnow:submit:all       # pings Bing/Yandex/etc. for every route

# Routine, after editing the focus tools:
npm run indexnow:submit:tail      # just the 12 Phase 1 tools

# Add --dry-run first to preview without sending.
```
Requires `INDEXNOW_KEY` in your shell (and in Netlify env). IndexNow covers Bing,
Yandex, Seznam, Naver. **Google ignores IndexNow** — for Google, use GSC
**URL Inspection → Request Indexing** on changed priority pages, or just let the
sitemap (`changefreq`/`lastmod`) drive recrawl.
