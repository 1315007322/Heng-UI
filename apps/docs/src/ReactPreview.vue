<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ComponentType } from 'react'
import { ActionButton, StatCard, EmptyState } from '@yancraft/react'
import type { ComponentId } from './catalog'
const props = defineProps<{ componentId: Exclude<ComponentId, 'gantt'>; componentProps: Record<string, unknown> }>()
const emit = defineEmits<{ action: [] }>()
const host = ref<HTMLDivElement>()
let root: Root | undefined
const components = { button: ActionButton, stat: StatCard, empty: EmptyState }
function render() {
  root?.render(createElement(components[props.componentId] as ComponentType<Record<string, unknown>>, { ...props.componentProps, onClick: () => emit('action'), onAction: () => emit('action') }))
}
onMounted(() => { root = createRoot(host.value!); render() })
watch(() => [props.componentId, props.componentProps], render, { deep: true })
onBeforeUnmount(() => root?.unmount())
</script>
<template><div ref="host" class="react-host"></div></template>
