<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { createRoot, type Root } from 'react-dom/client'
import { createElement } from 'react'
import { GanttChart } from '@yancraft/react'
import type { GanttChartProps, GanttTaskChange, GanttDragRejectedPayload, GanttTaskContextMenu, GanttAreaContextMenu } from '@yancraft/vue'
const props = defineProps<{ options: GanttChartProps }>()
const emit = defineEmits<{ change: [change: GanttTaskChange]; reject: [event: GanttDragRejectedPayload]; context: [event: GanttTaskContextMenu | GanttAreaContextMenu] }>()
const host = ref<HTMLDivElement>()
let root: Root | undefined
function render() { root?.render(createElement(GanttChart, { ...props.options, onTaskChange: value => emit('change', value), onChangeRejected: value => emit('reject', value), onTaskContextmenu: value => emit('context', value), onAreaContextmenu: value => emit('context', value) })) }
onMounted(() => { root = createRoot(host.value!); render() })
watch(() => props.options, render, { deep: true })
onBeforeUnmount(() => root?.unmount())
</script>
<template><div ref="host"></div></template>
