import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/balloon-visualizer/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
