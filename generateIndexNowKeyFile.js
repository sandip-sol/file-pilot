import { mkdirSync, writeFileSync } from 'node:fs';

const PUBLIC_DIR = new URL('./public/', import.meta.url);
const key = process.env.INDEXNOW_KEY?.trim();
const keyPattern = /^[A-Za-z0-9_-]{8,128}$/;

if (!key) {
  console.warn('INDEXNOW_KEY is not set; skipping IndexNow key file generation.');
  process.exit(0);
}

if (!keyPattern.test(key)) {
  console.warn('INDEXNOW_KEY is present but invalid; expected 8-128 URL-safe characters. Skipping key file generation.');
  process.exit(0);
}

mkdirSync(PUBLIC_DIR, { recursive: true });
writeFileSync(new URL(`./${key}.txt`, PUBLIC_DIR), key, 'utf8');
console.log(`Generated public/${key}.txt for IndexNow ownership validation.`);
