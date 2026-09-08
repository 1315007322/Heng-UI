<script setup lang="ts">
import { computed, ref } from 'vue'
import GanttTimeline from './components/GanttTimeline.vue'
import { normalizeGanttRows } from './normalize'
import { parseGanttDateTime } from './services/ganttTimeline'
import type { GanttChartProps, GanttTaskChange, GanttDragRejectedPayload, GanttTaskContextMenu, GanttAreaContextMenu } from './types'
import './style.scss'

const props = withDefaults(defineProps<GanttChartProps>(), { height: 420, zoomPercent: 100, rowHeight: 36, labelWidth: 160, readonly: false, snapMinutes: 30, minimumDurationMinutes: 30, allowOverlap: false, shifts: () => [], unavailableTimeRanges: () => [], disableBrowserContextMenu: true })
const emit = defineEmits<{ 'task-change': [change: GanttTaskChange]; 'change-rejected': [payload: GanttDragRejectedPayload]; 'task-contextmenu': [payload: GanttTaskContextMenu]; 'area-contextmenu': [payload: GanttAreaContextMenu] }>()
const timeline = ref<InstanceType<typeof GanttTimeline>>()
const normalized = computed(() => {
  try {
    const start = parseGanttDateTime(props.start), end = parseGanttDateTime(props.end)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('甘特图起止时间无效')
    return { rows: normalizeGanttRows(props.rows), error: '' }
  } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '甘特图数据无效' } }
})
const context = computed(() => ({ shifts: props.shifts, unavailableTimeRanges: props.unavailableTimeRanges }))
const positive = (value: number, fallback: number, min: number, max: number) => Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
/** 将某个本地时间定位到视口中央。 */
function scrollToTime(dateTime: string) { const timestamp = parseGanttDateTime(dateTime); if (Number.isFinite(timestamp)) timeline.value?.scrollToTimestamp(timestamp) }
defineExpose({ scrollToTime })
</script>
<template>
  <section class="yc-gantt-chart" :style="{ height: `${positive(height, 420, 180, 3000)}px` }" aria-label="甘特图">
    <slot name="toolbar" />
    <p v-if="normalized.error" class="yc-gantt-error" role="alert">{{ normalized.error }}</p>
    <GanttTimeline v-else ref="timeline" :rows="normalized.rows" :start="start" :end="end" :zoom-percent="positive(zoomPercent, 100, 10, 1000)" :row-height="positive(rowHeight, 36, 28, 120)" :label-width="positive(labelWidth, 160, 80, 500)" :readonly="readonly" :gantt-context="context" :snap-minutes="positive(snapMinutes, 30, 1, 1440)" :minimum-duration-minutes="positive(minimumDurationMinutes, 30, 1, 1440)" :allow-overlap="allowOverlap" :disable-browser-context-menu="disableBrowserContextMenu" @bar-change="emit('task-change', $event)" @bar-change-rejected="emit('change-rejected', $event)" @bar-contextmenu="emit('task-contextmenu', $event)" @area-contextmenu="emit('area-contextmenu', $event)" />
  </section>
</template>
<style>
.yc-gantt-chart{display:flex;flex-direction:column;min-width:0;width:100%;border:1px solid #dce4dd;border-radius:8px;overflow:hidden;background:#fff;font-family:inherit}.yc-gantt-error{padding:24px;color:#a53d35;font-size:13px}.yc-gantt-task-bar{top:50%;margin-top:-11px}.yc-gantt-task-tooltip{padding:12px;max-width:min(320px,calc(100vw - 16px));overflow-wrap:anywhere;font-size:12px}.yc-gantt-timeline__drag-preview{background:#dcecdf;color:#285a3a;border:1px solid #8aaf91}.yc-gantt-timeline--dragging{user-select:none}
</style>
