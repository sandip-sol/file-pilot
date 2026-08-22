import { CANONICAL_HOST, PRIORITY_SEO_ROUTES, PRIORITY_TAIL_ROUTES, SITE_URL, canonicalUrlForRoute, getSeoRoutes } from './seoRoutes.js';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const key = process.env.INDEXNOW_KEY?.trim();
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const usePriorityRoutes = args.includes('--priority');
const useTailRoutes = args.includes('--tail');
const useAllRoutes = args.includes('--all');
// Post-deploy mode: runs at the end of every build. It must never fail the
// build and must never fire from a deploy preview or branch deploy, which
// would submit preview URLs (or duplicate production URLs) to IndexNow.
const postDeploy = args.includes('--post-deploy');
const submittedArgs = args.filter((arg) => !arg.startsWith('--'));
const indexableRoutes = new Set(getSeoRoutes());
const canonicalUrls = new Map(getSeoRoutes().map((route) => [canonicalUrlForRoute(route), route]));

const usage = `Usage:
  npm run indexnow:submit -- --dry-run https://www.filepilot.space/merge/
  npm run indexnow:submit -- https://www.filepilot.space/merge/ https://www.filepilot.space/compress/
  npm run indexnow:submit:priority -- --dry-run   # launch/head set
  npm run indexnow:submit:tail -- --dry-run       # Phase 1 focus tools
  npm run indexnow:submit:all -- --dry-run        # every indexable route
  node indexnow.js --post-deploy                 # runs from the build; production-only, never fails`;

function fail(message) {
  console.error(message);
  console.error('');
  console.error(usage);
  process.exit(1);
}

function validateUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`Invalid URL: ${value}`);
  }

  if (parsed.protocol !== 'https:') fail(`IndexNow URL must use https: ${value}`);
  if (parsed.hostname !== CANONICAL_HOST) fail(`URL must belong to ${CANONICAL_HOST}: ${value}`);
  if (parsed.search || parsed.hash) fail(`IndexNow URL must not include query strings or fragments: ${value}`);

  const canonicalUrl = parsed.toString();
  const route = canonicalUrls.get(canonicalUrl);
  if (!route) fail(`URL is not a canonical indexable FilePilot route: ${value}`);
  if (!indexableRoutes.has(route)) fail(`Route is not indexable: ${value}`);
  if (canonicalUrl !== canonicalUrlForRoute(route)) fail(`URL is not canonical and may redirect: ${value}`);

  return canonicalUrl;
}

function getUrlList() {
  let urls;
  if (postDeploy || useAllRoutes) urls = getSeoRoutes().map(canonicalUrlForRoute);
  else if (useTailRoutes) urls = PRIORITY_TAIL_ROUTES.map(canonicalUrlForRoute);
  else if (usePriorityRoutes) urls = PRIORITY_SEO_ROUTES.map(canonicalUrlForRoute);
  else urls = submittedArgs;

  if (urls.length === 0) {
    fail('Provide one or more changed canonical URLs, or use --priority / --tail / --all for a predefined set.');
  }

  return [...new Set(urls.map(validateUrl))];
}

async function submit() {
  if (postDeploy) {
    if (process.env.CONTEXT !== 'production') {
      console.log(`IndexNow: skipped (CONTEXT=${process.env.CONTEXT ?? 'unset'}, not a production deploy).`);
      return;
    }
    if (!key) {
      console.log('IndexNow: skipped (INDEXNOW_KEY not set). See generateIndexNowKeyFile.js output above.');
      return;
    }
  }

  if (!key) fail('INDEXNOW_KEY is not set. Add it to Netlify and to your local shell before submitting.');

  const urlList = getUrlList();
  const payload = {
    host: CANONICAL_HOST,
    key,
    keyLocation: new URL(`/${key}.txt`, SITE_URL).toString(),
    urlList,
  };

  console.log(`${dryRun ? 'Dry run:' : 'Submitting'} ${urlList.length} URL${urlList.length === 1 ? '' : 's'} to IndexNow.`);
  for (const url of urlList) console.log(`  ${url}`);

  if (dryRun) {
    console.log('');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  console.log(`IndexNow response: ${response.status} ${response.statusText}`);
  if (!response.ok) {
    const body = await response.text();
    if (body) console.error(body.slice(0, 1000));
    process.exitCode = 1;
  }
}

submit().catch((error) => {
  console.error('IndexNow submission failed:', error.message);
  // A search-engine ping is not worth failing a deploy over.
  if (!postDeploy) process.exitCode = 1;
});
