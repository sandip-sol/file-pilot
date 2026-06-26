import { readFile } from 'node:fs/promises';

const SITE_URL = 'https://www.filepilot.space';
const KEY = '43ba63aba5734768ba941ad72f08ead1';
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;

const ENDPOINTS = [
  { name: 'IndexNow', url: 'https://api.indexnow.org/indexnow' },
  { name: 'Bing', url: 'https://www.bing.com/indexnow' },
  { name: 'Yandex', url: 'https://yandex.com/indexnow' },
];

export const onSuccess = async ({ utils }) => {
  let urlList;
  try {
    const sitemap = await readFile('dist/sitemap.xml', 'utf8');
    const matches = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)];
    urlList = matches.map(([, u]) => u.trim());
  } catch {
    utils.build.failPlugin('Could not read dist/sitemap.xml');
    return;
  }

  if (urlList.length === 0) {
    console.log('No URLs found in sitemap — skipping IndexNow.');
    return;
  }

  const payload = {
    host: new URL(SITE_URL).hostname,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  console.log(`Submitting ${urlList.length} URLs to IndexNow...`);

  for (const { name, url } of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      console.log(`  ${name}: ${res.status} ${res.statusText}`);
    } catch (err) {
      console.log(`  ${name}: failed — ${err.message}`);
    }
  }
};
