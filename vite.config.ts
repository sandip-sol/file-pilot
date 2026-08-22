import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  /**
   * There is deliberately no `rollupOptions.output.manualChunks` here.
   *
   * It used to force `pdf-lib` and `pdfjs-dist` into named chunks, which looked
   * like good code-splitting and did the opposite: those chunks became the host
   * for Rollup's shared CommonJS interop helpers, so the entry chunk imported
   * pdf-lib to get them. Every page on the site — the homepage included —
   * downloaded and executed a PDF engine it never called.
   *
   * Measured homepage payload (transitive static imports, gzipped):
   *   manualChunks object form ......... 401 KB, pulls pdf-lib
   *   + hoistTransitiveImports: false ... 422 KB, still pulls pdf-lib
   *   manualChunks fn with vendor bucket  534 KB, one giant vendor blob
   *   manualChunks fn, split vendors ..... 469 KB, pulls onnx instead
   *   no manualChunks (this) ............. 224 KB, no engine chunks at all
   *
   * Vite's default chunking already splits per route and hoists genuinely shared
   * code. Re-introducing manualChunks needs a measurement, not an intuition —
   * `npm run seo:budget` will fail the build if the homepage regresses.
   */
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
})
