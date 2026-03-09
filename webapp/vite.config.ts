import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import postcssPresetMantine from 'postcss-preset-mantine';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tanstackRouter(),
    react(),
    tsconfigPaths(),
    visualizer({
      filename: '../reports/webapp-vite-meta.json',
      json: true,
    }),
  ],
  root: '../webapp',
  envDir: '../',
  css: {
    postcss: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      plugins: [postcssPresetMantine()],
    },
  },
  // Server proxy is for development only (https://vite.dev/config/server-options#server-proxy)
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
