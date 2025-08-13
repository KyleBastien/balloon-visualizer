/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/balloon-visualizer/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'src/test/',
        'src/main.tsx',
        'src/types/',
        'tools/',
        '**/*.d.ts',
        '**/*.types.ts',
        '**/*.config.*',
        'dist/',
      ],
    },
  },
});
