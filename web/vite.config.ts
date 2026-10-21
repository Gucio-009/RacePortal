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

/** Prod: CSS jako preload (nie blokuje pierwszego paint); criticalAssets → stylesheet. */
function deferCssPlugin() {
  return {
    name: 'defer-css',
    apply: 'build' as const,
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      return html.replace(
        /<link\s+([^>]*rel="stylesheet"[^>]*)>/gi,
        (match, attrs: string) => {
          if (attrs.includes('fonts.googleapis.com') || attrs.includes('id="google-fonts"')) {
            return match
          }
          const rest = attrs.replace(/\s*rel="stylesheet"/, '').trim()
          return `<link rel="preload" as="style" ${rest}>\n    <noscript><link rel="stylesheet" ${rest}></noscript>`
        },
      )
    },
  }
}

export default defineConfig({
  plugins: [
    // React Fast Refresh + Tailwind v4 (wymagane oba w tym setupie)
    react(),
    tailwindcss(),
    deferCssPlugin(),
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

  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        /** Osobne chunki vendorów — mniej unused JS na pierwszej ścieżce (/). */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'leaflet'
          if (id.includes('recharts')) return 'recharts'
          if (id.includes('date-fns') || id.includes('react-day-picker')) return 'date'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('lucide-react')) return 'lucide'
          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('/react/') ||
            id.includes('\\react\\')
          ) {
            return 'react-vendor'
          }
        },
      },
    },
  },

  // Surowy import assetów (nie dodawać .css/.ts/.tsx).
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
