/**
 * Phase 2 backlink tracker (see docs/PHASE2_BACKLINKS.md).
 *
 * Submitting a listing is not the same as earning a link. Listings get rejected,
 * held in moderation, published without the URL, or published with the link
 * stripped. This file is the record of what was submitted; `npm run seo:backlinks`
 * fetches each live listing and reports whether a link to filepilot.space is
 * actually present, and whether it is dofollow.
 *
 * WORKFLOW: after you submit somewhere and it goes live, paste the public URL of
 * the listing into `listingUrl` and re-run the checker. Leave it null until then.
 *
 * `follow` records what the destination does with outbound links, so the count
 * that matters — authority-passing referring domains — stays honest:
 *   'dofollow'   verified to pass authority
 *   'nofollow'   link exists but is rel="nofollow" — good for discovery,
 *                referral traffic and entity corroboration, not for authority
 *   'unknown'    not yet verified (the site blocks bots, or nothing is live yet)
 */

export const SITE_HOST = 'filepilot.space';

export const backlinkTargets = [
  // ── Tier 1 ────────────────────────────────────────────────────────────────
  {
    name: 'GitHub repository',
    tier: 1,
    submitUrl: 'https://github.com/sandip-sol/file-pilot',
    listingUrl: 'https://github.com/sandip-sol/file-pilot',
    follow: 'nofollow',
    notes: 'Verified 2026-08-22: GitHub renders the repo homepage field and README links with rel="nofollow". Still worth doing for discovery, referral traffic and as a sameAs entity signal — but it does not count toward authority-passing referring domains.',
  },
  {
    name: 'Product Hunt',
    tier: 1,
    submitUrl: 'https://www.producthunt.com/posts/new',
    listingUrl: null,
    follow: 'nofollow',
    notes: 'Outbound product links are nofollow. Launch for the traffic, the social proof and the secondary coverage it attracts — not for the link itself.',
  },
  {
    name: 'AlternativeTo',
    tier: 1,
    submitUrl: 'https://alternativeto.net',
    listingUrl: null,
    follow: 'unknown',
    notes: 'Blocks automated requests, so the checker cannot verify it — confirm the link manually once live. List as an alternative to Smallpdf, iLovePDF and Adobe Acrobat online; the matching comparison pages give reviewers something concrete to read.',
  },
  {
    name: 'SaaSHub',
    tier: 1,
    submitUrl: 'https://www.saashub.com/submit',
    listingUrl: null,
    follow: 'unknown',
    notes: 'Free listing, also an alternatives network.',
  },
  {
    name: 'Show HN',
    tier: 1,
    submitUrl: 'https://news.ycombinator.com/showhn.html',
    listingUrl: null,
    follow: 'dofollow',
    notes: 'Verified 2026-08-22: front-page story links carry no rel="nofollow". High variance — the link only has value if the post gets traction. Lead with the engineering story and the honest limitations.',
  },

  // ── Tier 2 ────────────────────────────────────────────────────────────────
  { name: 'Slant', tier: 2, submitUrl: 'https://www.slant.co', listingUrl: null, follow: 'unknown', notes: 'Answer "best free PDF tools" / "best online PDF editor". Blocks bots.' },
  { name: 'G2', tier: 2, submitUrl: 'https://www.g2.com', listingUrl: null, follow: 'unknown', notes: 'Free product listing, high DR. Blocks bots.' },
  { name: 'Capterra', tier: 2, submitUrl: 'https://www.capterra.com/vendors/sign-up', listingUrl: null, follow: 'unknown', notes: 'Free listing. Blocks bots.' },
  { name: 'BetaList', tier: 2, submitUrl: 'https://betalist.com/submit', listingUrl: null, follow: 'unknown', notes: 'Good for newer products.' },
  { name: 'Uneed', tier: 2, submitUrl: 'https://uneed.best', listingUrl: null, follow: 'unknown', notes: 'Product Hunt-style launch platform.' },
  { name: 'Fazier', tier: 2, submitUrl: 'https://fazier.com', listingUrl: null, follow: 'unknown', notes: 'Product Hunt-style, free launch.' },
  { name: 'dev.to build post', tier: 2, submitUrl: 'https://dev.to', listingUrl: null, follow: 'unknown', notes: '"How I built browser-only PDF tools" — the WebAssembly architecture is the story.' },

  // ── Tier 3 — privacy angle ────────────────────────────────────────────────
  { name: 'Privacy Guides forum', tier: 3, submitUrl: 'https://discuss.privacyguides.net', listingUrl: null, follow: 'unknown', notes: 'Strict community. Contribute first; mention the tool only where it answers a real question.' },
  { name: 'awesome-privacy (GitHub)', tier: 3, submitUrl: 'https://github.com/pluja/awesome-privacy', listingUrl: null, follow: 'nofollow', notes: 'PR to add FilePilot under file tools if it meets their criteria. GitHub links are nofollow, but the list is widely mirrored and scraped, and the mirrors are not.' },
  { name: 'r/privacy / r/degoogle', tier: 3, submitUrl: 'https://reddit.com', listingUrl: null, follow: 'nofollow', notes: 'Reddit outbound links are nofollow. Post only where genuinely relevant; lead with the no-upload architecture, never a pitch.' },
];
