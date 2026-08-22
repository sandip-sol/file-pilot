/**
 * Position tracking for the priority terms (Phase 4.3).
 *
 *   npm run seo:ranks -- path/to/Queries.csv
 *   npm run seo:ranks                        show the history already recorded
 *
 * Rank data has to come from somewhere. Live SERP APIs cost money and scraping
 * Google breaks its terms, so this reads the CSV that Search Console already
 * exports for free: Performance → Export → CSV → `Queries.csv`. Drop the file
 * in, and each run appends a dated snapshot to `seo-ranks.json`.
 *
 * It reports POSITION, not clicks. At an average position in the 50s the click
 * count is noise — page 5 is mathematically unclickable — while position is the
 * thing that actually moves first. Judging this work by clicks for the first few
 * months would mean concluding it had failed while it was working.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { trackedKeywords } from './src/data/trackedKeywords.ts';

const HISTORY = new URL('./seo-ranks.json', import.meta.url);
const csvPath = process.argv.slice(2).find((arg) => !arg.startsWith('--'));

/** Minimal CSV reader — GSC exports are quoted, comma-separated, one header row. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (char !== '\r') field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((entry) => entry.some((cell) => cell.trim()));
}

const number = (value) => {
  const parsed = Number.parseFloat(String(value).replace(/[%,]/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const history = existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, 'utf8')) : { snapshots: [] };

if (csvPath) {
  if (!existsSync(csvPath)) {
    console.error(`No such file: ${csvPath}`);
    console.error('Export it from Search Console: Performance → Export → CSV, then use Queries.csv.');
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, 'utf8'));
  const header = rows[0].map((cell) => cell.toLowerCase().trim());
  const col = (...names) => header.findIndex((cell) => names.some((name) => cell.includes(name)));

  const queryCol = col('query', 'top queries');
  const positionCol = col('position');
  const impressionsCol = col('impression');
  const clicksCol = col('click');

  if (queryCol === -1 || positionCol === -1) {
    console.error('That CSV has no query/position columns. Use the Queries.csv from a Search Console Performance export.');
    console.error(`Columns found: ${header.join(', ')}`);
    process.exit(1);
  }

  const byQuery = new Map();
  for (const row of rows.slice(1)) {
    byQuery.set(row[queryCol].toLowerCase().trim(), {
      position: number(row[positionCol]),
      impressions: impressionsCol === -1 ? null : number(row[impressionsCol]),
      clicks: clicksCol === -1 ? null : number(row[clicksCol]),
    });
  }

  const snapshot = { date: new Date().toISOString().slice(0, 10), terms: {} };
  let matched = 0;
  for (const entry of trackedKeywords) {
    for (const term of [entry.primary, ...entry.secondary]) {
      const found = byQuery.get(term.toLowerCase());
      if (found) { snapshot.terms[term] = { route: entry.route, ...found }; matched += 1; }
    }
  }

  history.snapshots = history.snapshots.filter((entry) => entry.date !== snapshot.date);
  history.snapshots.push(snapshot);
  history.snapshots.sort((a, b) => a.date.localeCompare(b.date));
  writeFileSync(HISTORY, `${JSON.stringify(history, null, 2)}\n`, 'utf8');

  const tracked = trackedKeywords.reduce((sum, entry) => sum + 1 + entry.secondary.length, 0);
  console.log(`\nRecorded ${snapshot.date}: ${matched} of ${tracked} tracked terms appear in this export.`);
  if (matched === 0) {
    console.log('None matched. That is normal early on — a term only appears once it has had an impression.');
  }
}

if (!history.snapshots.length) {
  console.log('\nNo snapshots yet.');
  console.log('Export Search Console → Performance → Export → CSV, then:');
  console.log('  npm run seo:ranks -- ~/Downloads/Queries.csv\n');
  process.exit(0);
}

const latest = history.snapshots[history.snapshots.length - 1];
const previous = history.snapshots.length > 1 ? history.snapshots[history.snapshots.length - 2] : null;

console.log(`\nPosition trend — ${latest.date}${previous ? ` vs ${previous.date}` : ' (first snapshot)'}\n`);

const rows = Object.entries(latest.terms)
  .map(([term, data]) => {
    const before = previous?.terms?.[term]?.position ?? null;
    // Position improves as it falls, so a negative delta is good.
    const delta = before != null && data.position != null ? data.position - before : null;
    return { term, ...data, before, delta };
  })
  .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

for (const row of rows) {
  const move = row.delta == null ? '     ' : row.delta < 0 ? `▲${Math.abs(row.delta).toFixed(0).padStart(3)}` : row.delta > 0 ? `▼${row.delta.toFixed(0).padStart(3)}` : '   ='.padStart(4);
  console.log(
    `  ${String(row.position?.toFixed(1) ?? '—').padStart(6)}  ${move}  `
    + `${String(row.impressions ?? '—').padStart(5)} impr  ${row.term}`,
  );
}

const positions = rows.map((row) => row.position).filter((value) => value != null);
if (positions.length) {
  const average = positions.reduce((sum, value) => sum + value, 0) / positions.length;
  console.log(`\n  Average position across tracked terms: ${average.toFixed(1)}`);
  if (average > 30) console.log('  Still below page 3 — keep judging this by position, not clicks.');
}
console.log('');
