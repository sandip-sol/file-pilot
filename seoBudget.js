/**
 * Performance budget for the pages that carry the SEO load (Phase 4.1).
 *
 *   npm run seo:budget
 *
 * Core Web Vitals are field data — you cannot measure LCP or INP from a build.
 * What you *can* measure at build time is the thing that most often wrecks them
 * on a route-split React app: a landing page quietly acquiring a dependency it
 * never calls.
 *
 * That is not hypothetical here. A `manualChunks` config that looked like good
 * code-splitting made the pdf-lib chunk the host for Rollup's shared CommonJS
 * helpers, so the entry chunk imported it — and every page on the site
 * downloaded and executed a PDF engine to get a few lines of interop shim. The
 * homepage was carrying 401 KB gzipped; removing the config took it to 224 KB.
 *
 * This walks the static import graph from each entry, sums the transitive
 * chunks, and fails if a page exceeds its budget or touches a heavy engine.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const ASSETS = new URL('./dist/assets/', import.meta.url);
const ASSETS_PATH = join(process.cwd(), 'dist', 'assets');

/**
 * Engines that must never appear in a content page's static graph. They are
 * legitimate on the tool pages that call them — those load on demand.
 */
const HEAVY_ENGINES = [/^pdf-/, /^pdfjs/, /^pdf\./, /^ort\./, /onnxruntime/, /^tesseract/, /^index-.*worker/];

/**
 * Budgets are gzipped kilobytes of transitively-imported JavaScript, set a
 * little above today's measurement so ordinary growth does not trip them but a
 * regression does. Raise one only with a measurement explaining why.
 */
const BUDGETS = [
  { name: 'Homepage', chunk: /^Home-/, maxGzipKb: 280 },
  { name: 'Blog post', chunk: /^BlogPost-/, maxGzipKb: 280 },
  { name: 'Comparison page', chunk: /^ComparisonPage-/, maxGzipKb: 280 },
  { name: 'About', chunk: /^About-/, maxGzipKb: 280 },
  { name: 'PDF tools hub', chunk: /^PdfToolsHub-/, maxGzipKb: 300 },
];

if (!existsSync(ASSETS)) {
  console.error('dist/assets does not exist. Run npm run build first.');
  process.exit(1);
}

const files = readdirSync(ASSETS).filter((name) => name.endsWith('.js'));
const imports = new Map(
  files.map((name) => {
    const source = readFileSync(join(ASSETS_PATH, name), 'utf8');
    return [name, [...source.matchAll(/(?:from|import)"\.\/([A-Za-z0-9_.-]+\.js)"/g)].map(([, dep]) => dep)];
  }),
);

const entry = files.find((name) => /^index-[A-Za-z0-9_-]+\.js$/.test(name));

const closure = (roots) => {
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const file = stack.pop();
    if (!file || seen.has(file) || !imports.has(file)) continue;
    seen.add(file);
    stack.push(...imports.get(file));
  }
  return seen;
};

const sizeOf = (names) => {
  let gzip = 0;
  for (const name of names) gzip += gzipSync(readFileSync(join(ASSETS_PATH, name))).length;
  return gzip / 1024;
};

const failures = [];
console.log('');

for (const budget of BUDGETS) {
  const chunk = files.find((name) => budget.chunk.test(name));
  if (!chunk) {
    console.log(`  ?  ${budget.name.padEnd(18)} no chunk matched ${budget.chunk} — skipped`);
    continue;
  }

  const graph = closure([entry, chunk]);
  const gzipKb = sizeOf(graph);
  const engines = [...graph].filter((name) => HEAVY_ENGINES.some((pattern) => pattern.test(name)));

  const overBudget = gzipKb > budget.maxGzipKb;
  const ok = !overBudget && engines.length === 0;

  console.log(
    `  ${ok ? '✓' : '✗'}  ${budget.name.padEnd(18)} ${gzipKb.toFixed(0).padStart(4)} KB gzipped `
    + `(budget ${budget.maxGzipKb}) · ${graph.size} chunks`,
  );

  if (overBudget) {
    failures.push(`${budget.name} is ${gzipKb.toFixed(0)} KB gzipped, over its ${budget.maxGzipKb} KB budget.`);
  }
  if (engines.length) {
    failures.push(
      `${budget.name} statically imports heavy engine chunk(s): ${engines.join(', ')}. `
      + 'A content page must not download a processing engine it never calls.',
    );
  }
}

console.log('');

if (failures.length) {
  console.error('Performance budget failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error('');
  process.exit(1);
}

console.log('Performance budgets met.\n');
