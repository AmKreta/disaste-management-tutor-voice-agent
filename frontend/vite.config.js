/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react({
    jsxImportSource: '@emotion/react'
  })],
  server: {
    proxy: {
      // Proxy /api requests to the backend server
      '/connect': {
        target: 'http://0.0.0.0:7860',
        // Replace with your backend URL
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    restoreMocks: true
  }
});
