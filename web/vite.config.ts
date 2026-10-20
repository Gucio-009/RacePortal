/**
 * vite.config.ts — bundler frontu RacePortal (Vite 6 + React + Tailwind v4).
 *
 * Plugin `@tailwindcss/vite` = Tailwind v4 bez klasycznego postcss tailwind.
 * Alias `@raceportal/api-types` → packages/api-types (współdzielone typy/logika z mobile).
 * Dev proxy `/api` → :4000 — ten sam origin względny co w prod (nginx proxy).
 *
 * Pomysł (alt): Next.js (SSR/SEO); Rsbuild; osobny package build api-types do dist/.
 */
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // React Fast Refresh + Tailwind v4 (wymagane oba w tym setupie)
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@raceportal/api-types': path.resolve(__dirname, '../packages/api-types/src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
  },

  // Surowy import assetów (nie dodawać .css/.ts/.tsx).
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
