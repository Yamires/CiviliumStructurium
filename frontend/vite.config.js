import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: './',
  worker: { format: 'es' },
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Civilium Structurium', short_name: 'CS', start_url: './', scope: './',
      display: 'standalone', background_color: '#ffffff', theme_color: '#3367D6',
      icons: [192, 512].map(size => ({ src: `images/web-app-manifest-${size}x${size}.png`, sizes: `${size}x${size}`, type: 'image/png' })),
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,webp,svg,ico,json}'], maximumFileSizeToCacheInBytes: 4000000 },
  })],
  build: { outDir: mode === 'demo' ? 'dist-demo' : 'dist' },
  server: { host: '127.0.0.1', port: 4173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:5050' } },
}));
