/**
 * Downloads a processing engine once the page has finished loading.
 *
 * Tools import pdf-lib, pdf.js and JSZip with `await import()` where they use
 * them, so a tool page can render without waiting for several hundred KB of code
 * it does not call until a file is processed. Warming fetches that code as soon
 * as the browser is idle, which keeps the promise on the homepage: once a page
 * has loaded, its tools keep working if the connection drops.
 */
const engines = {
  'pdf-lib': () => import('pdf-lib'),
  'pdfjs-dist': () => import('pdfjs-dist'),
  jszip: () => import('jszip'),
};

const warmed = new Set<keyof typeof engines>();

export const warmEngine = (name: keyof typeof engines) => {
  if (typeof window === 'undefined' || warmed.has(name)) return;
  warmed.add(name);

  // A failed download is not an error yet: the tool retries when it needs the engine.
  const load = () => void engines[name]().catch(() => warmed.delete(name));
  const whenIdle = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 5000 });
    else setTimeout(load, 2000);
  };

  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
};
