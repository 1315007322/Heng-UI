<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CodeEditor } from '@yancraft/react'
import type { CodeEditorProps } from '@yancraft/vue'

const props = defineProps<{ options: CodeEditorProps }>()
const emit = defineEmits<{ change: [value: string] }>()
const host = ref<HTMLDivElement>()
let root: Root | undefined
function render() { root?.render(createElement(CodeEditor, { ...props.options, onChange: value => emit('change', value) })) }
onMounted(() => { root = createRoot(host.value!); render() })
watch(() => props.options, render, { deep: true })
onBeforeUnmount(() => root?.unmount())
</script>
<template><div ref="host" class="editor-react-host"></div></template>
