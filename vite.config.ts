import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const appBase = process.env.NODE_ENV === 'production' ? '/projects/gracht.app/' : '/';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'app-icon.png',
        'apple-touch-icon.png',
        'favicon-32.png',
        'icon-192.png',
        'icon-512.png',
        'maskable-192.png',
        'maskable-512.png'
      ],
      manifest: {
        name: 'gracht.app',
        short_name: 'gracht',
        description: 'Local-first Dutch A0-A1 flashcard trainer.',
        theme_color: '#07162f',
        background_color: '#07162f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: appBase,
        scope: appBase,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
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
