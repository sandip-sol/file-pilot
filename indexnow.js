import { readFile } from 'node:fs/promises';

const SITE_URL = 'https://www.filepilot.space';
const KEY = '43ba63aba5734768ba941ad72f08ead1';
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const SITEMAP_PATH = new URL('./public/sitemap.xml', import.meta.url);

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

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE_URL).hostname,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  const body = await response.text();

  console.log(`Submitted ${urlList.length} URLs to IndexNow.`);
  console.log(`Status: ${response.status}`);
  console.log(`Response: ${body || '(empty - this is normal on success)'}`);

  if (!response.ok) {
    process.exitCode = 1;
  }
}

submitToIndexNow().catch((error) => {
  console.error('IndexNow submission failed:', error);
  process.exitCode = 1;
});
