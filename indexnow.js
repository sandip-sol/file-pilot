import { readFile } from 'node:fs/promises';

const SITE_URL = 'https://www.filepilot.space';
const KEY = '43ba63aba5734768ba941ad72f08ead1';
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const SITEMAP_PATH = new URL('./public/sitemap.xml', import.meta.url);

const ENDPOINTS = [
  { name: 'IndexNow', url: 'https://api.indexnow.org/indexnow' },
  { name: 'Bing', url: 'https://www.bing.com/indexnow' },
  { name: 'Yandex', url: 'https://yandex.com/indexnow' },
];

async function loadUrlList() {
  const sitemap = await readFile(SITEMAP_PATH, 'utf8');
  const matches = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)];

  if (matches.length === 0) {
    throw new Error('No <loc> entries found in public/sitemap.xml');
  }

  return matches.map(([, url]) => url.trim());
}

async function submitToIndexNow() {
  const urlList = await loadUrlList();
  const payload = {
    host: new URL(SITE_URL).hostname,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  console.log(`Submitting ${urlList.length} URLs to IndexNow (Bing + Yandex)...`);

  const results = await Promise.allSettled(
    ENDPOINTS.map(async ({ name, url }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      console.log(`  ${name}: ${res.status} ${res.statusText}`);
      return { name, status: res.status };
    }),
  );

  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    for (const f of failures) console.error(`  Failed:`, f.reason);
    process.exitCode = 1;
  }
}

submitToIndexNow().catch((error) => {
  console.error('IndexNow submission failed:', error);
  process.exitCode = 1;
});
