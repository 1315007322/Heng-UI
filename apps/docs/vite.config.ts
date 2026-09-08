import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: {
    '@yancraft/vue': fileURLToPath(new URL('../../packages/vue/src/index.ts', import.meta.url)),
    '@yancraft/react': fileURLToPath(new URL('../../packages/react/src/index.tsx', import.meta.url))
  } },
  server: { port: 5173, strictPort: true },
  build: { chunkSizeWarningLimit: 1200 }
})
