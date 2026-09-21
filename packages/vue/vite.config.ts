import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
export default defineConfig({
  plugins: [vue(), dts({ tsconfigPath: '../../tsconfig.json', include: ['src/**/*.ts', 'src/**/*.vue'], entryRoot: 'src' })],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index', cssFileName: 'style' },
    rollupOptions: { external: id => ['vue', 'ant-design-vue', 'element-plus', 'codemirror', 'markdown-it'].includes(id) || id.startsWith('@codemirror/') }
  }
})
