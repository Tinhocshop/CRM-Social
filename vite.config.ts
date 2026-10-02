import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const eeDir = existsSync(fileURLToPath(new URL('./src/_ee', import.meta.url)))
  ? './src/_ee'
  : './src/_ee-stubs';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@ee': fileURLToPath(new URL(eeDir, import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
