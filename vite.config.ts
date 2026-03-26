import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  /** GitHub Pages: set VITE_BASE=/repo-name/ in CI (see .github/workflows) */
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: false,
    include: ['tests/unit/**/*.spec.ts'],
    exclude: ['tests/e2e/**'],
  },
})
