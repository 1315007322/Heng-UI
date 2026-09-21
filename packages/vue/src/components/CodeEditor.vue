<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, placeholder as editorPlaceholder } from '@codemirror/view'
import { StreamLanguage } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { sql } from '@codemirror/lang-sql'
import { yaml } from '@codemirror/lang-yaml'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import MarkdownIt from 'markdown-it'
import type { CodeEditorProps, EditorLanguage } from '../types'

const props = withDefaults(defineProps<CodeEditorProps>(), {
  modelValue: '', language: 'typescript', readonly: false, lineNumbers: true,
  minHeight: 300, placeholder: '开始输入…', tabSize: 2, mode: 'edit', theme: 'dark', wordWrap: false
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  focus: []
  blur: []
  ready: [view: EditorView]
}>()

const host = ref<HTMLDivElement>()
const languageConfig = new Compartment()
const settingsConfig = new Compartment()
let view: EditorView | undefined
let syncing = false

const languageNames: Record<EditorLanguage, string> = {
  javascript: 'JavaScript', typescript: 'TypeScript', jsx: 'JSX', tsx: 'TSX', json: 'JSON', html: 'HTML',
  css: 'CSS', markdown: 'Markdown', python: 'Python', java: 'Java', sql: 'SQL', yaml: 'YAML', shell: 'Shell'
}
const displayLanguage = computed(() => languageNames[props.language])
const effectiveMode = computed(() => props.language === 'markdown' ? props.mode : 'edit')

function languageExtension(language: EditorLanguage) {
  switch (language) {
    case 'javascript': return javascript()
    case 'typescript': return javascript({ typescript: true })
    case 'jsx': return javascript({ jsx: true })
    case 'tsx': return javascript({ jsx: true, typescript: true })
    case 'json': return json()
    case 'html': return html()
    case 'css': return css()
    case 'markdown': return markdown()
    case 'python': return python()
    case 'java': return java()
    case 'sql': return sql()
    case 'yaml': return yaml()
    case 'shell': return StreamLanguage.define(shell)
  }
}

const darkTheme = EditorView.theme({
  '&': { color: '#dce9df', backgroundColor: '#14251f' }, '.cm-content': { caretColor: '#d7efdc' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#d7efdc' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#365b49 !important' },
  '.cm-gutters': { backgroundColor: '#14251f', color: '#577365', border: 'none' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#1b3028' }
}, { dark: true })
const lightTheme = EditorView.theme({
  '&': { color: '#24342c', backgroundColor: '#fbfcf9' },
  '.cm-gutters': { backgroundColor: '#f2f5ef', color: '#8a9788', border: 'none' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#edf3e9' }
})

function settings() {
  return [EditorState.readOnly.of(props.readonly), EditorView.editable.of(!props.readonly), EditorState.tabSize.of(props.tabSize),
    editorPlaceholder(props.placeholder), props.wordWrap ? EditorView.lineWrapping : [], props.theme === 'dark' ? darkTheme : lightTheme,
    EditorView.theme({ '&': { minHeight: `${props.minHeight}px` }, '.cm-scroller': { minHeight: `${props.minHeight}px`, overflow: 'auto' }, '.cm-gutters': { display: props.lineNumbers ? 'flex' : 'none' } })]
}

const markdownRenderer = new MarkdownIt({ html: false, linkify: true, breaks: true, typographer: true })
const renderedMarkdown = computed(() => markdownRenderer.render(props.modelValue))

onMounted(() => {
  view = new EditorView({ parent: host.value, state: EditorState.create({ doc: props.modelValue, extensions: [basicSetup,
    languageConfig.of(languageExtension(props.language)), settingsConfig.of(settings()), EditorView.updateListener.of(update => {
      if (update.focusChanged) update.view.hasFocus ? emit('focus') : emit('blur')
      if (update.docChanged && !syncing) { const value = update.state.doc.toString(); emit('update:modelValue', value); emit('change', value) }
    })] }) })
  emit('ready', view)
})
onBeforeUnmount(() => view?.destroy())
watch(() => props.modelValue, value => { if (!view || value === view.state.doc.toString()) return; syncing = true; view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } }); syncing = false })
watch(() => props.language, value => view?.dispatch({ effects: languageConfig.reconfigure(languageExtension(value)) }))
watch(() => [props.readonly, props.lineNumbers, props.minHeight, props.placeholder, props.tabSize, props.theme, props.wordWrap], () => view?.dispatch({ effects: settingsConfig.reconfigure(settings()) }))
</script>

<template>
  <div :class="['yc-code-editor', `yc-code-editor--${theme}`, `yc-code-editor--${effectiveMode}`]" :data-language="language">
    <header class="yc-code-editor__bar"><span class="yc-code-editor__dots" aria-hidden="true"><i></i><i></i><i></i></span><strong>{{ displayLanguage }}</strong><span>{{ readonly ? '只读' : effectiveMode === 'preview' ? '预览' : '可编辑' }}</span></header>
    <div class="yc-code-editor__workspace"><div v-show="effectiveMode !== 'preview'" ref="host" class="yc-code-editor__input"></div><article v-if="effectiveMode !== 'edit'" class="yc-code-editor__markdown" :style="{ minHeight: `${minHeight}px` }" v-html="renderedMarkdown"></article></div>
  </div>
</template>

<style scoped>
.yc-code-editor{--yc-editor-border:#294239;overflow:hidden;border:1px solid var(--yc-editor-border);border-radius:9px;background:#14251f;box-shadow:0 14px 35px rgba(24,47,37,.12);text-align:left}.yc-code-editor--light{--yc-editor-border:#dce4d9;background:#fbfcf9}.yc-code-editor__bar{height:40px;display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid var(--yc-editor-border);background:#1b3128;color:#85a08e;font:11px/1 'DM Sans',sans-serif;letter-spacing:.35px}.yc-code-editor--light .yc-code-editor__bar{background:#eef3eb;color:#617361}.yc-code-editor__bar strong{color:#d7e6d9;font-weight:600}.yc-code-editor--light .yc-code-editor__bar strong{color:#30483a}.yc-code-editor__bar>span:last-child{margin-left:auto}.yc-code-editor__dots{display:flex;gap:5px}.yc-code-editor__dots i{width:7px;height:7px;border-radius:50%;background:#739980}.yc-code-editor__dots i:nth-child(2){background:#c1ab69}.yc-code-editor__dots i:nth-child(3){background:#a96f6b}.yc-code-editor__workspace{display:grid;grid-template-columns:1fr;min-width:0}.yc-code-editor--split .yc-code-editor__workspace{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.yc-code-editor__input{min-width:0}.yc-code-editor__input :deep(.cm-editor){font:13px/1.65 'JetBrains Mono','Cascadia Code',Consolas,monospace}.yc-code-editor__input :deep(.cm-editor.cm-focused){outline:none}.yc-code-editor__input :deep(.cm-content){padding:14px 0}.yc-code-editor__input :deep(.cm-gutterElement){padding:0 10px}.yc-code-editor__markdown{overflow:auto;padding:25px 28px;background:#fbfcf9;color:#344339;border-left:1px solid var(--yc-editor-border);font:14px/1.8 'DM Sans','Microsoft YaHei',sans-serif}.yc-code-editor__markdown :deep(h1),.yc-code-editor__markdown :deep(h2),.yc-code-editor__markdown :deep(h3){margin:0 0 14px;color:#20352a;line-height:1.3}.yc-code-editor__markdown :deep(h1){font-size:25px}.yc-code-editor__markdown :deep(h2){font-size:20px}.yc-code-editor__markdown :deep(h3){font-size:16px}.yc-code-editor__markdown :deep(p){margin:0 0 10px}.yc-code-editor__markdown :deep(ul),.yc-code-editor__markdown :deep(ol){margin:0 0 14px;padding-left:22px}.yc-code-editor__markdown :deep(a){color:#347553;text-decoration:underline}.yc-code-editor__markdown :deep(code){padding:2px 5px;border-radius:4px;background:#e8efe5;color:#315f46;font-family:'Cascadia Code',Consolas,monospace}.yc-code-editor__markdown :deep(pre){overflow:auto;padding:14px;border-radius:6px;background:#14251f}.yc-code-editor__markdown :deep(pre code){padding:0;background:none;color:#dce9df}.yc-code-editor__markdown :deep(blockquote){margin:14px 0;padding:4px 14px;border-left:3px solid #739980;color:#617361}.yc-code-editor__markdown :deep(table){width:100%;border-collapse:collapse;margin:14px 0}.yc-code-editor__markdown :deep(th),.yc-code-editor__markdown :deep(td){padding:7px 9px;border:1px solid #d8e2d5;text-align:left}@media(max-width:700px){.yc-code-editor--split .yc-code-editor__workspace{grid-template-columns:1fr}.yc-code-editor__markdown{border-left:0;border-top:1px solid var(--yc-editor-border)}}
</style>
