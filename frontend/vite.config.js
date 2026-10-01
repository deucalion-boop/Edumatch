import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Vite treats source CSS link tags as eager imports, even for rel="preload".
// Remove those tags before bundling and restore preloads for emitted role
// assets, so the service worker can cache them without activating role CSS.
function preloadRoleStylesheets() {
  let base = '/'
  return {
    name: 'edumatch-preload-role-stylesheets',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/^[ \t]*<link\b(?=[^>]*\brel=["']preload["'])(?=[^>]*\bhref=["']\/src\/styles\/roles\/(?:teacher|secretary|headteacher)\.tailwind\.css["'])[^>]*>[ \t]*\r?\n?/gm, '')
      },
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const html = bundle['index.html']
        if (!html || html.type !== 'asset') this.error('Missing index.html for role stylesheet preloads')
        let source = typeof html.source === 'string' ? html.source : Buffer.from(html.source).toString('utf8')
        const tags = []
        for (const role of ['teacher', 'secretary', 'headteacher']) {
          const pattern = new RegExp(`(?:^|/)${role}\\.tailwind(?:-[^/]+)?\\.css$`)
          const asset = Object.values(bundle).find(entry => entry.type === 'asset' && pattern.test(entry.fileName))
          if (!asset) this.error(`Missing compiled ${role} stylesheet for offline preload`)
          const href = `${base.endsWith('/') ? base : base + '/'}${asset.fileName}`
          if (!source.includes(`href="${href}"`)) tags.push(`    <link rel="preload" href="${href}" as="style">`)
        }
        if (tags.length) {
          if (!source.includes('</head>')) this.error('Missing HTML head for role stylesheet preloads')
          source = source.replace(/([ \t]*)<\/head>/, (_match, indent) => tags.join('\n') + '\n' + indent + '</head>')
          html.source = source
        }
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), preloadRoleStylesheets()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
