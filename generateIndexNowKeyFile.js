import { mkdirSync, writeFileSync } from 'node:fs';

const PUBLIC_DIR = new URL('./public/', import.meta.url);
const key = process.env.INDEXNOW_KEY?.trim();
const keyPattern = /^[A-Za-z0-9_-]{8,128}$/;

// Netlify sets CONTEXT=production for builds of the published branch.
const isProductionBuild = process.env.CONTEXT === 'production';

if (!key) {
  if (isProductionBuild) {
    // This used to be a quiet console.warn, so every production build skipped
    // IndexNow without anyone noticing — the key was never set, the key file
    // was never published, and no URL was ever submitted to Bing/Yandex.
    console.error('');
    console.error('  ⚠  INDEXNOW_KEY is not set on this production build.');
    console.error('     IndexNow is inactive: no URLs are being submitted to Bing, Yandex, Seznam or Naver.');
    console.error('     Bing is currently this site\'s better-converting channel — activate it:');
    console.error('       1. Generate a key:  node -e "console.log(crypto.randomUUID().replaceAll(\'-\',\'\'))"');
    console.error('       2. Netlify → Site configuration → Environment variables → INDEXNOW_KEY');
    console.error('       3. Redeploy. The key file publishes automatically and submission runs on every build.');
    console.error('');
  } else {
    console.warn('INDEXNOW_KEY is not set; skipping IndexNow key file generation.');
  }
  process.exit(0);
}

if (!keyPattern.test(key)) {
  console.warn('INDEXNOW_KEY is present but invalid; expected 8-128 URL-safe characters. Skipping key file generation.');
  process.exit(0);
}

mkdirSync(PUBLIC_DIR, { recursive: true });
writeFileSync(new URL(`./${key}.txt`, PUBLIC_DIR), key, 'utf8');
console.log(`Generated public/${key}.txt for IndexNow ownership validation.`);
