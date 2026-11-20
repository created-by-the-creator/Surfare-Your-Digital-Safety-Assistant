import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8790',
    },
  },
  plugins: [
    react(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'prompt',
      includeAssets: ['assets/**/*', 'tessdata/**/*', 'tesseract/**/*'],
      manifest: {
        name: 'Surfare',
        short_name: 'Surfare',
        theme_color: '#0B2A6F',
        background_color: '#FAF3E8',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'assets/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'assets/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'assets/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'assets/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,gz,wasm}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },
    }),
  ],
});
