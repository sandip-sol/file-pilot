# Phase 2 — Authority / Backlinks Execution Kit

**Source:** `SEO_ROADMAP.md` → Phase 2. This is the front that actually moves you off
page 5. On-page work (Phases 0–1) is done; nothing more on-page will help until real
domain authority exists.

> ⚠️ **This phase is human work.** Creating accounts, launching, posting to forums, and
> emailing people cannot be automated — and faking it (bought links, bot posts, sock
> puppets) gets flagged and wastes your one first impression. Everything below is
> written so *you* can execute it fast. Do **2–4 items a week**, not all at once.

---

## Read this before you start (added 2026-08-22)

**Most of these links will be `nofollow`, and that is fine — but plan for it.**
Verified by fetching the pages:

| Target | Outbound links | Verified |
|---|---|---|
| GitHub (repo homepage + README) | **nofollow** | ✅ 2026-08-22 |
| Hacker News (front-page story link) | **dofollow** | ✅ 2026-08-22 |
| Product Hunt | nofollow | documented behaviour |
| Reddit | nofollow | documented behaviour |
| AlternativeTo, G2, Capterra, Slant | unknown — they block automated requests | verify by hand |

A nofollow link still earns you: discovery by real people, referral traffic, an
entity signal Google can use to tell filepilot.space apart from the other
"FilePilot" products, and — most importantly — **secondary coverage**. A Product
Hunt launch that a blogger notices produces the dofollow link; the PH link itself
does not. Judge Tier 1 by attention earned, not by link juice.

**Current baseline:** run `npm run seo:backlinks`. As of 2026-08-22 it reports
**1 referring domain, 0 authority-passing.** That is the honest starting line.

---

## Ready-to-paste copy

Keep these identical everywhere — consistent name + description is itself a trust signal.

**Name:** `FilePilot`

**Tagline (≤60 chars):**
> Private PDF & image tools that never upload your files

**One-liner (≤100 chars):**
> Free browser-based PDF & image tools. No uploads — everything runs locally on your device.

**Short (≤160 chars, meta-length):**
> Merge, convert, compress and edit PDFs & images free in your browser. Files never upload — 100% local, no signup, no watermarks.

**Medium (~300 chars):**
> FilePilot is a free toolkit of 90+ PDF and image tools that run entirely in your browser. Merge, split, convert, compress, redact, and organise files with zero uploads — your documents never leave your device. No signup, no watermarks, no ads. Ideal for contracts, IDs, and anything private.

**Long (elevator pitch):**
> Most online PDF tools upload your file to their servers, process it, and send a copy back. FilePilot doesn't upload anything. All 90+ PDF and image tools — merging, converting, compressing, redacting, editing — run locally in your browser using WebAssembly and the Canvas API. That makes it genuinely private: safe for contracts, financial statements, ID scans, and medical records. It's free, needs no signup, and adds no watermarks.

**Categories/tags:** PDF, PDF tools, image tools, privacy, productivity, file conversion, web app, developer tools, no-signup

**Social image:** `public/og-image.png` (1200×630)

**Pages worth linking to in outreach** (shipped since this kit was written):

| Page | Use it for |
|---|---|
| `/smallpdf-alternative/` | AlternativeTo listing, and any roundup that already covers Smallpdf |
| `/ilovepdf-alternative/` | Same, for iLovePDF |
| `/adobe-acrobat-online-alternative/` | Roundups about free Acrobat substitutes |
| `/pdf24-alternative/` | The most nuanced one — PDF24 already offers a local desktop app, so this page argues on installation, not privacy alone |
| `/image-requirements/` | "Resize image to exact size & KB" — the most distinctive single tool on the site; good hook for form/exam/visa audiences |

Each comparison page includes an honest "when *X* is the better choice" section.
Point reviewers at them: a comparison that concedes real limitations reads as
credible and is far more likely to get cited than a feature list.

**GitHub repo metadata — do this first, it takes two minutes** (Settings → General,
and the ⚙ next to "About" on the repo home):

- [ ] **Description:** `Free, privacy-first PDF and image tools that run entirely in your browser — no uploads.`
- [ ] **Website:** `https://www.filepilot.space/`  ← currently empty; this is the sidebar link
- [ ] **Topics:** `pdf`, `privacy`, `webassembly`, `image-tools`, `pdf-tools`, `client-side`, `no-upload`, `react`
- [ ] **Licence:** deliberately left unset. A permissive licence would let anyone
      redeploy FilePilot, and the name already collides with three same-category
      clone domains. Only add one if you intend that.

Verify with `npm run seo:backlinks`.

---

## Directory targets

Work top-down; the first block is highest ROI. Mark status in the tracker below.

### Tier 1 — do first
| Target | URL | Notes |
|---|---|---|
| **Product Hunt** | producthunt.com/posts/new | Biggest single hit. See launch kit below. Pick a Tue–Thu 00:01 PT. |
| **AlternativeTo** | alternativeto.net | List as an alternative to Smallpdf, iLovePDF, Adobe Acrobat online. High-DR, exact-intent traffic. |
| **SaaSHub** | saashub.com/submit | Free listing; also an "alternatives" network. |
| **Hacker News (Show HN)** | news.ycombinator.com/showhn.html | "Show HN: FilePilot – PDF/image tools that never upload your files". Post 08:00–10:00 ET weekday. High risk/reward; engage in comments. |
| **GitHub** | [github.com/sandip-sol/file-pilot](https://github.com/sandip-sol/file-pilot) | Repo is public ✅. **Metadata is not set** — see the checklist below. Note the links are `nofollow`, so treat this as discovery + entity signal, not authority. |

### Tier 2 — steady drip
| Target | URL | Notes |
|---|---|---|
| Slant | slant.co | Answer "best free PDF tools", "best online PDF editor" with FilePilot. |
| G2 | g2.com | Free product listing; high DR. |
| Capterra | capterra.com/vendors/sign-up | Free listing. |
| BetaList | betalist.com/submit | Good for newer products. |
| Uneed | uneed.best | PH-style launch platform. |
| Fazier | fazier.com | PH-style; free launch. |
| Tinylaunch / Startup Fame / MicroLaunch | — | Small but easy PH alternatives; each is a link. |
| dev.to / Hashnode | dev.to | Write a short "how I built browser-only PDF tools" post → dofollow-ish + audience. |

### Tier 3 — privacy angle (curated, higher bar, higher value)
| Target | URL | Notes |
|---|---|---|
| r/privacy, r/degoogle | reddit.com | Only post where genuinely relevant; lead with the no-upload architecture, not a pitch. |
| Privacy Guides forum | discuss.privacyguides.net | Community is strict — contribute first, mention the tool only when it answers a real question. |
| `awesome-privacy` (GitHub) | github.com/pluja/awesome-privacy | PR to add FilePilot under file tools, if it fits their criteria. |

---

## Product Hunt launch kit

**Name:** FilePilot
**Tagline:** Private PDF & image tools that never upload your files
**Topics:** Productivity, Privacy, Design Tools, PDF
**Gallery:** lead with `og-image.png`, then 3–4 tool screenshots (merge, compress, redact, image convert).
**Thumbnail:** the teal logo icon.

**First comment (post as maker, immediately after launch):**

> Hi Product Hunt 👋
>
> I built FilePilot because every "free online PDF tool" I used did the same unsettling thing: uploaded my file to a server I know nothing about, just to merge or compress it. For a contract or an ID scan, that's a lot of trust to hand over for a 5-second task.
>
> FilePilot runs **entirely in your browser**. Merging, converting, compressing, redacting, editing — 90+ PDF and image tools — all happen locally using WebAssembly and the Canvas API. Nothing is uploaded. Close the tab and it's gone.
>
> It's free, no signup, no watermarks, no ads. I'd love your feedback — especially on which tools you'd want next.

**Prep checklist:**
- [ ] Line up 5–10 people who'll genuinely try it and comment on launch morning (no vote-begging — PH penalises it).
- [ ] Have the maker comment ready to paste at 00:01 PT.
- [ ] Be available to reply to every comment for the first 4 hours.
- [ ] Cross-post the PH link to your own channels, not to unrelated communities.

---

## Show HN / Reddit template

> **Title:** Show HN: FilePilot – PDF and image tools that never upload your files
>
> I got tired of uploading sensitive PDFs to random web tools just to merge or compress them, so I built one that doesn't upload anything. All processing runs in the browser via WebAssembly and Canvas — merge, split, convert, compress, redact, plus image tools. Free, no signup, no watermarks.
>
> Tech notes: [pdf-lib + pdfjs-dist for PDF, onnxruntime-web for the AI image tools, prerendered for crawlability]. Happy to answer questions about the browser-only architecture and where it hits limits (e.g. true PDF encryption is hard client-side).

Lead with the engineering story and the honest limitations — HN rewards candor and punishes marketing.

---

## Blogger / roundup outreach template

Target: authors of existing "best free PDF tools" / "Smallpdf alternatives" posts.

> Subject: A no-upload PDF tool for your [POST TITLE] roundup
>
> Hi [NAME],
>
> I read your piece on [POST TITLE] — the section on [SPECIFIC TOOL] was useful.
>
> I maintain FilePilot (filepilot.space), a free PDF/image toolkit with one differentiator worth a mention: it processes files **entirely in the browser** — nothing is uploaded. For a privacy-focused roundup that's a real distinction from Smallpdf/iLovePDF, which upload to their servers.
>
> I've written up the comparison honestly, including where [SPECIFIC TOOL] is still the better choice: filepilot.space/[smallpdf|ilovepdf|pdf24]-alternative/
>
> No ask beyond: if it fits, it might be a useful addition for your readers. Happy to answer anything.
>
> Thanks,
> [YOU]

Send 5–10 a week, personalised. Generic blasts get ignored and can hurt reputation.

---

## Progress tracker

**The tracker is now code, not checkboxes.** A submitted listing is not an earned
link — listings get rejected, held in moderation, published without the URL, or
published with the link stripped out. A tick in a markdown table cannot tell you
which of those happened.

```bash
npm run seo:backlinks
```

It checks GitHub repo metadata, then fetches every listing recorded in
`backlinkTargets.js` and reports what is actually on the page:

| State | Meaning |
|---|---|
| `LIVE` | a link to filepilot.space is present — reports dofollow vs nofollow |
| `MISSING` | page loaded, no link found. Says whether the site is at least mentioned, which usually means the URL field got dropped |
| `BLOCKED` | the host refused an automated request. **Not a missing link** — verify by hand |
| `NOT SUBMITTED` | no listing URL recorded yet |

**Workflow:** when a submission goes live, open [`backlinkTargets.js`](../backlinkTargets.js),
paste the public listing URL into that target's `listingUrl`, and re-run. Adding a
new target is one object in the same array.

Re-run monthly. Cross-check against Bing Webmaster Tools → Backlinks and Search
Console → Links, which see links from places this script has no list for.

**Target:** 15–30 referring domains by ~week 10. Weight the dofollow count
separately — that is the number that moves average position.

---

## What NOT to do

- ❌ Don't buy backlinks or use PBNs — manual-action risk, permanent damage.
- ❌ Don't mass-post the same comment across subreddits — it's spam and gets you banned.
- ❌ Don't beg for upvotes on PH/HN — both detect and penalise it.
- ❌ Don't fake reviews on G2/Capterra — they verify, and it's a trust-killer.
- ❌ Don't submit to link-farm "500 directories for $5" services — toxic profile.
