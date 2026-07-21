import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isDesktop = mode === 'desktop';

  return {
    base: process.env.BASE_PATH ?? '/',
    plugins: [
      react(),
      VitePWA({
        disable: isDesktop,
        registerType: 'prompt',
        includeAssets: ['icons/transformer.svg'],
        manifest: {
          name: 'Transformer',
          short_name: 'Transformer',
          description: 'Local-only DJ audio preparation and conversion.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          start_url: '.',
          scope: '.',
          icons: [
            {
              src: 'icons/transformer-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/transformer-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/transformer-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{css,html,ico,js,png,svg,wasm}'],
          maximumFileSizeToCacheInBytes: 40 * 1024 * 1024,
          navigateFallback: 'index.html',
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.test.{ts,tsx}', 'desktop/**/*.test.ts'],
      setupFiles: './vitest.setup.ts',
    },
  };
});
