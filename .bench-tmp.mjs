import puppeteer from 'puppeteer';
const [url, out, block] = process.argv.slice(2);
const b = await puppeteer.launch({ args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
const c = await p.target().createCDPSession(); await c.send('Network.enable');
await c.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8 * 5, uploadThroughput: 750e3 / 8 });
if (block) { await p.setRequestInterception(true); p.on('request', r => r.url().endsWith('.js') ? r.abort() : r.continue()); }
await p.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
const r = await p.evaluate(() => { const fcp = performance.getEntriesByName('first-contentful-paint')[0]; const js = performance.getEntriesByType('resource').filter(r => r.name.endsWith('.js')); return { fcp: fcp && fcp.startTime | 0, lastJsEnd: Math.max(...js.map(r => r.responseEnd)) | 0, appMounted: !document.querySelector('[data-static-seo]') }; });
console.log(url, JSON.stringify(r)); await p.screenshot({ path: out }); await b.close();
