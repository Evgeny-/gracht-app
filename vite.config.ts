import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const appBase = '/projects/gracht.app/';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['gracht.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'gracht.app',
        short_name: 'gracht',
        description: 'Local-first Dutch A0-A1 flashcard trainer.',
        theme_color: '#0f766e',
        background_color: '#f7fbf8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: appBase,
        scope: appBase,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'gracht.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: `${appBase}index.html`,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  base: appBase
});
