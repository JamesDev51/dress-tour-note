import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: '그드레스 - 드레스투어 노트',
        short_name: '그드레스',
        description: '사진 대신 모양으로 기록하는 드레스투어 노트',
        theme_color: '#fff8f5',
        background_color: '#fff8f5',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: [
          '**/assets/heic-to-*.js',
          '**/assets/exportPdf-*.js',
          '**/assets/noto-serif-*.woff2'
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(?:heic-to|exportPdf)-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gudress-optional-features',
              expiration: { maxEntries: 8, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          },
          {
            urlPattern: /\/assets\/noto-serif-.*\.woff2$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gudress-optional-fonts',
              expiration: { maxEntries: 4, maxAgeSeconds: 90 * 24 * 60 * 60 }
            }
          }
        ]
      }
    })
  ]
});
