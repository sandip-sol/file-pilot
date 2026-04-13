import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import vitePrerender from 'vite-plugin-prerender'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vitePrerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: [
        '/',
        '/merge',
        '/split',
        '/images-to-pdf',
        '/compress',
        '/image-requirements',
        '/privacy',
        '/terms',
      ],
      renderer: new vitePrerender.PuppeteerRenderer({
        renderAfterTime: 3000,
        headless: true,
      }),
      postProcess(renderedRoute) {
        renderedRoute.route = renderedRoute.originalRoute;
        return renderedRoute;
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
