/**
 * Phase 2 backlink verifier.
 *
 *   npm run seo:backlinks
 *
 * The roadmap's Phase 2 target is "15–30 referring domains by ~week 10", but the
 * tracker was a markdown table of checkboxes — there was no way to tell whether a
 * submission had actually produced a live link. Listings get rejected, held in
 * moderation, published without the URL, or published with the link stripped.
 *
 * This fetches every listing recorded in `backlinkTargets.js` and reports what is
 * really there. It distinguishes three outcomes that a checkbox cannot:
 *
 *   LIVE      a link to the site is present in the fetched HTML
 *   MISSING   the page loaded but contains no link to the site
 *   BLOCKED   the host refused an automated request — verify by hand, do NOT
 *             read this as a missing link
 *
 * It also reports dofollow vs nofollow, because only the former moves authority,
 * and checks the GitHub repository metadata that Phase 2.5 depends on.
 */

import { SITE_HOST, backlinkTargets } from './backlinkTargets.js';

const GITHUB_REPO = 'sandip-sol/file-pilot';
const TIMEOUT_MS = 20000;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const bold = (value) => `[1m${value}[0m`;
const dim = (value) => `[2m${value}[0m`;

async function checkListing(target) {
  if (!target.listingUrl) return { ...target, state: 'NOT SUBMITTED' };

  let response;
  let html;
  try {
    response = await fetch(target.listingUrl, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    html = await response.text();
  } catch (error) {
    return { ...target, state: 'BLOCKED', detail: error.message };
  }

  if (!response.ok) {
    return { ...target, state: 'BLOCKED', detail: `HTTP ${response.status}` };
  }

  // Any anchor pointing at the site, however it is spelled.
  const anchors = [...html.matchAll(new RegExp(`<a[^>]{0,400}?href="https?://(?:www\\.)?${SITE_HOST.replace('.', '\\.')}[^"]*"[^>]{0,400}?>`, 'gi'))]
    .map(([match]) => match);

  if (anchors.length === 0) {
    // A bare mention without an anchor is worth flagging separately: it usually
    // means the listing exists but the URL field was dropped.
    const mentioned = html.toLowerCase().includes(SITE_HOST);
    return { ...target, state: 'MISSING', detail: mentioned ? 'site mentioned but not linked' : 'no mention found' };
  }

  const anyDofollow = anchors.some((anchor) => !/rel="[^"]*nofollow/i.test(anchor));
  return {
    ...target,
    state: 'LIVE',
    detail: `${anchors.length} link${anchors.length === 1 ? '' : 's'}, ${anyDofollow ? 'dofollow' : 'nofollow'}`,
    observedFollow: anyDofollow ? 'dofollow' : 'nofollow',
  };
}

/**
 * Phase 2.5 is not "make the repo public" — it is making the repo carry the
 * metadata that turns it into a discoverable, linked entity. A public repo with
 * no description, no homepage URL and no topics earns nothing.
 */
async function checkGithubMetadata() {
  let repo;
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.log(`  could not read repo metadata (HTTP ${response.status})`);
      return;
    }
    repo = await response.json();
  } catch (error) {
    console.log(`  could not read repo metadata (${error.message})`);
    return;
  }

  const checks = [
    ['public', repo.private === false, 'repo must be public'],
    ['description', Boolean(repo.description), 'set a one-line description'],
    ['homepage', typeof repo.homepage === 'string' && repo.homepage.includes(SITE_HOST), `set the homepage field to https://www.${SITE_HOST}/`],
    ['topics', (repo.topics ?? []).length >= 4, 'add at least 4 topics (pdf, privacy, webassembly, image-tools)'],
    // Advisory only. A permissive licence on a live product's repo lets anyone
    // redeploy it — and "FilePilot" already collides with three same-category
    // clone domains. No licence (all rights reserved) is a legitimate choice here.
    ['license', Boolean(repo.license), 'no licence set — fine if deliberate; a few directories ask for one'],
  ];

  for (const [label, ok, hint] of checks) {
    console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(12)} ${ok ? '' : dim(hint)}`);
  }
  console.log(`  ${dim(`stars ${repo.stargazers_count} · forks ${repo.forks_count}`)}`);
}

async function run() {
  console.log(bold('\nGitHub repository (Phase 2.5)\n'));
  await checkGithubMetadata();

  console.log(bold('\nListings\n'));
  const results = [];
  for (const target of backlinkTargets) {
    results.push(await checkListing(target));
  }

  const icon = { LIVE: '✓', MISSING: '✗', BLOCKED: '?', 'NOT SUBMITTED': '·' };
  for (const tier of [1, 2, 3]) {
    const inTier = results.filter((result) => result.tier === tier);
    if (!inTier.length) continue;
    console.log(dim(`  Tier ${tier}`));
    for (const result of inTier) {
      const detail = result.detail ? dim(` — ${result.detail}`) : '';
      console.log(`  ${icon[result.state]} ${result.name.padEnd(26)} ${result.state.padEnd(14)}${detail}`);
    }
    console.log('');
  }

  const live = results.filter((result) => result.state === 'LIVE');
  const dofollow = live.filter((result) => result.observedFollow === 'dofollow');
  const blocked = results.filter((result) => result.state === 'BLOCKED');
  const missing = results.filter((result) => result.state === 'MISSING');

  console.log(bold('Summary'));
  console.log(`  ${live.length} live link${live.length === 1 ? '' : 's'} across ${new Set(live.map((r) => new URL(r.listingUrl).hostname)).size} referring domain(s)`);
  console.log(`  ${dofollow.length} authority-passing (dofollow), ${live.length - dofollow.length} nofollow`);
  if (missing.length) console.log(`  ${missing.length} submitted but no link found — check these`);
  if (blocked.length) console.log(`  ${blocked.length} could not be checked automatically — verify by hand`);
  console.log(dim(`\n  Phase 2 target: 15–30 referring domains. Blocked ≠ missing.\n`));
}

run().catch((error) => {
  console.error('Backlink check failed:', error.message);
  process.exitCode = 1;
});
