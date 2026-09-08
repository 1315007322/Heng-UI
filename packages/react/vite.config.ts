import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
export default defineConfig({
  plugins: [dts({ tsconfigPath: './tsconfig.json', include: ['src/**/*.tsx'], entryRoot: 'src', pathsToAliases: false })],
  build: {
    lib: { entry: 'src/index.tsx', formats: ['es'], fileName: 'index' },
    rollupOptions: { external: ['vue', 'react', 'react/jsx-runtime', '@yancraft/vue'], output: { banner: "'use client';" } }
  }
})
