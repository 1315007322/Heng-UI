<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CodeEditor, type CodeEditorProps, type EditorLanguage, type EditorMode, type EditorTheme } from '@yancraft/vue'
import { Copy, RotateCcw, SlidersHorizontal } from 'lucide-vue-next'
import CodeEditorReactPreview from './CodeEditorReactPreview.vue'
import { catalog } from './catalog'

const props = defineProps<{ tab: string; framework: 'Vue' | 'React' }>()
const entry = catalog.find(component => component.id === 'editor')!
const languages: { value: EditorLanguage; label: string }[] = [
  { value: 'typescript', label: 'TypeScript' }, { value: 'javascript', label: 'JavaScript' }, { value: 'tsx', label: 'TSX' }, { value: 'jsx', label: 'JSX' },
  { value: 'json', label: 'JSON' }, { value: 'html', label: 'HTML' }, { value: 'css', label: 'CSS' }, { value: 'markdown', label: 'Markdown' },
  { value: 'python', label: 'Python' }, { value: 'java', label: 'Java' }, { value: 'sql', label: 'SQL' }, { value: 'yaml', label: 'YAML' }, { value: 'shell', label: 'Shell' }
]
const samples: Record<EditorLanguage, string> = {
  javascript: "const craft = idea => ({ ...idea, ready: true })\nconsole.log(craft({ name: 'YanCraft UI' }))",
  typescript: "interface Component { name: string; stable: boolean }\n\nconst editor: Component = {\n  name: 'CodeEditor',\n  stable: true\n}",
  jsx: "export function Greeting() {\n  return <strong>Hello, YanCraft UI.</strong>\n}",
  tsx: "type Props = { name: string }\n\nexport function Greeting({ name }: Props) {\n  return <strong>Hello, {name}.</strong>\n}",
  json: '{\n  "name": "@yancraft/vue",\n  "component": "CodeEditor",\n  "ready": true\n}',
  html: '<article class="note">\n  <h1>YanCraft UI</h1>\n  <p>Thoughtfully written.</p>\n</article>',
  css: '.note {\n  color: #315d45;\n  border-left: 3px solid currentColor;\n  padding: 1rem;\n}',
  markdown: '# YanCraft UI\n\n> Thoughtfully written. Carefully built.\n\n## CodeEditor\n\n- 支持 **13 种**常用语言\n- 支持 `Markdown` 实时预览\n- 支持 Vue 与 React\n\n```ts\nconst ready = true\n```',
  python: "def craft(name: str) -> dict:\n    return {'name': name, 'ready': True}\n\nprint(craft('CodeEditor'))",
  java: 'public record Component(String name, boolean ready) {\n  public static void main(String[] args) {\n    System.out.println(new Component("CodeEditor", true));\n  }\n}',
  sql: "SELECT name, version\nFROM components\nWHERE framework IN ('Vue', 'React')\nORDER BY name;",
  yaml: 'name: CodeEditor\npackage: "@yancraft/vue"\nlanguages:\n  - typescript\n  - markdown\nready: true',
  shell: '#!/usr/bin/env sh\nnpm run typecheck\nnpm run build'
}
const language = ref<EditorLanguage>('markdown')
const content = ref(samples.markdown)
const mode = ref<EditorMode>('split')
const theme = ref<EditorTheme>('dark')
const readonly = ref(false)
const lineNumbers = ref(true)
const wordWrap = ref(false)
const message = ref('直接编辑左侧内容，Markdown 预览会实时更新。')
const options = computed<CodeEditorProps>(() => ({ modelValue: content.value, language: language.value, mode: mode.value, theme: theme.value, readonly: readonly.value, lineNumbers: lineNumbers.value, wordWrap: wordWrap.value, minHeight: 390 }))
watch(language, value => { content.value = samples[value]; if (value !== 'markdown') mode.value = 'edit'; else if (mode.value === 'edit') mode.value = 'split'; message.value = `已切换为 ${languages.find(item => item.value === value)?.label}` })
function update(value: string) { content.value = value; message.value = `${value.split('\n').length} 行 · ${value.length} 个字符` }
function reset() { language.value = 'markdown'; content.value = samples.markdown; mode.value = 'split'; theme.value = 'dark'; readonly.value = false; lineNumbers.value = true; wordWrap.value = false; message.value = '示例已重置' }
const code = computed(() => props.framework === 'Vue' ? `<script setup lang="ts">\nimport { ref } from 'vue'\nimport { CodeEditor } from '@yancraft/vue'\nimport '@yancraft/vue/style.css'\n\nconst content = ref(${JSON.stringify(content.value)})\n<` + `/script>\n\n<template>\n  <CodeEditor v-model="content" language="${language.value}" mode="${mode.value}" />\n</template>` : `'use client'\nimport { useState } from 'react'\nimport { CodeEditor } from '@yancraft/react'\nimport '@yancraft/vue/style.css'\n\nexport default function Example() {\n  const [content, setContent] = useState(${JSON.stringify(content.value)})\n  return <CodeEditor modelValue={content} language="${language.value}" mode="${mode.value}" onChange={setContent} />\n}`)
async function copy() { try { await navigator.clipboard.writeText(props.tab === '组件源码' ? entry.source : code.value); message.value = '代码已复制' } catch { message.value = '复制失败，请手动选择代码' } }
</script>

<template>
  <div v-if="tab === '交互预览'" class="lab-body editor-lab-body"><div class="preview-column editor-preview-column"><div class="editor-canvas"><span class="editor-preview-label">{{ framework.toUpperCase() }} PREVIEW <span>CodeMirror 6 · {{ language }}</span></span><CodeEditor v-if="framework === 'Vue'" v-bind="options" @update:model-value="update" /><CodeEditorReactPreview v-else :options="options" @change="update" /></div><div class="preview-footer editor-feedback" role="status">{{ message }}</div></div>
    <aside class="controls"><div class="controls-heading"><SlidersHorizontal :size="14" /><strong>编辑器配置</strong><button class="icon-button" aria-label="重置编辑器参数" @click="reset"><RotateCcw :size="13" /></button></div>
      <label class="control-label" for="editor-language">编程语言<span>language</span></label><select id="editor-language" v-model="language" class="control-input"><option v-for="item in languages" :key="item.value" :value="item.value">{{ item.label }}</option></select>
      <template v-if="language === 'markdown'"><label class="control-label" for="editor-mode">展示模式<span>mode</span></label><select id="editor-mode" v-model="mode" class="control-input"><option value="edit">仅编辑</option><option value="split">编辑 / 预览</option><option value="preview">仅预览</option></select></template>
      <label class="control-label" for="editor-theme">编辑器主题<span>theme</span></label><select id="editor-theme" v-model="theme" class="control-input"><option value="dark">深色</option><option value="light">浅色</option></select>
      <label class="toggle-row">只读<input v-model="readonly" type="checkbox" role="switch" aria-label="编辑器只读" /></label><label class="toggle-row">显示行号<input v-model="lineNumbers" type="checkbox" role="switch" aria-label="显示行号" /></label><label class="toggle-row">自动换行<input v-model="wordWrap" type="checkbox" role="switch" aria-label="自动换行" /></label><p class="editor-hint">内置语法高亮、括号匹配、搜索、撤销重做和 Tab 缩进。Markdown 预览会转义原始 HTML。</p>
    </aside></div>
  <div v-else-if="tab === 'API 文档'" class="api-panel"><h4>Props 属性</h4><div class="table-scroll"><table><thead><tr><th>参数</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead><tbody><tr v-for="row in entry.props" :key="row[0]"><td v-for="(cell, index) in row" :key="index"><code v-if="index < 2">{{ cell }}</code><span v-else>{{ cell }}</span></td></tr></tbody></table></div><h4>Events 事件</h4><p><code>{{ entry.event }}</code> · {{ entry.eventDesc }}</p><p>还提供 <code>focus</code>、<code>blur</code> 和 <code>ready(EditorView)</code>。非 Markdown 语言会自动使用编辑模式。</p></div>
  <div v-else class="code-panel"><div class="code-toolbar"><span>{{ tab === '组件源码' ? 'CodeEditor.vue' : framework === 'Vue' ? 'EditorExample.vue' : 'EditorExample.tsx' }}</span><button @click="copy"><Copy :size="14" />复制代码</button></div><pre><code>{{ tab === '组件源码' ? entry.source : code }}</code></pre></div>
</template>

<style scoped>
.editor-preview-column{min-width:0}.editor-canvas{min-width:0;padding:25px;background:#f5f7f2}.editor-preview-label{display:flex;justify-content:space-between;margin-bottom:16px;color:#82907c;font-size:10px;letter-spacing:1px}.editor-preview-label span{letter-spacing:0}.editor-feedback{min-height:48px}.editor-hint{margin-top:24px;color:#7b8b77;font-size:11px;line-height:1.8}@media(max-width:760px){.editor-canvas{padding:12px}.editor-preview-label{font-size:9px}}
</style>
