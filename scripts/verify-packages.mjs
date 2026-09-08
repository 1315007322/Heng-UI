import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'

// Verify real npm tarballs from a consumer with no workspace source aliases.
// Temporary artifacts remain under the workspace for inspection, ignored by Git.
const workspace = process.cwd()
const fixture = mkdtempSync(join(workspace, '.package-check-'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run via npm run test:packages')
for (const name of ['vue', 'react']) {
  const packageDir = resolve('packages', name)
  const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
  const packed = JSON.parse(execFileSync(process.execPath, [npmCli, 'pack', '--json', '--ignore-scripts', '--pack-destination', fixture], { cwd: packageDir, encoding: 'utf8' }))[0]
  const destination = join(fixture, 'node_modules', manifest.name)
  mkdirSync(destination, { recursive: true })
  execFileSync('tar', ['-xzf', join(fixture, packed.filename), '-C', destination, '--strip-components=1'])
  if (!packed.files.some(file => file.path === 'dist/index.d.ts')) throw new Error(`${name}: missing type declarations`)
  console.log(`${manifest.name}: ${packed.files.length} published files, ${packed.size} bytes packed`)
}
writeFileSync(join(fixture, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
writeFileSync(join(fixture, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true, lib: ['ES2022', 'DOM'], types: ['react', 'react-dom'] }, include: ['main.tsx'] }))
writeFileSync(join(fixture, 'index.html'), '<div id="vue"></div><div id="react"></div><script type="module" src="/main.tsx"></script>')
writeFileSync(join(fixture, 'main.tsx'), `
import { createApp, h } from 'vue'
import { createRoot } from 'react-dom/client'
import { ActionButton, type ActionButtonProps } from '@yancraft/vue'
import { ActionButton as ReactButton } from '@yancraft/react'
import '@yancraft/vue/style.css'
import 'element-plus/dist/index.css'
const valid: ActionButtonProps = { label: 'Vue package', ui: 'element' }
// @ts-expect-error published types must reject an invalid variant
const invalid: ActionButtonProps = { variant: 'not-a-variant' }
void invalid
// @ts-expect-error React adapter types must reject an invalid variant
const invalidReact = <ReactButton variant="not-a-variant" />
void invalidReact
createApp({ render: () => h(ActionButton, valid) }).mount('#vue')
createRoot(document.getElementById('react')!).render(<ReactButton ui="ant" label="React package" />)
`)
execFileSync(process.execPath, [resolve(workspace, 'node_modules/typescript/bin/tsc'), '-p', fixture], { stdio: 'inherit' })
await build({ root: fixture, configFile: false, plugins: [vue()], logLevel: 'warn', build: { outDir: 'dist', chunkSizeWarningLimit: 1200 } })
console.log('PASS: Vue and React tarballs typecheck and bundle in an independent consumer.')
console.log(`Inspect artifacts: ${fixture}`)
