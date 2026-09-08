<template>
  <header class="yc-gantt-time-header" :style="headerStyle">
    <div class="yc-gantt-time-header__corner" :style="cornerStyle">资源</div>
    <div class="yc-gantt-time-header__axis" :style="axisStyle">
      <div class="yc-gantt-time-header__dates">
        <div
          v-for="segment in dateSegments"
          :key="segment.key"
          class="yc-gantt-time-header__date"
          :style="{ left: `${segment.left}px`, width: `${segment.width}px` }"
        >
          {{ segment.label }}
        </div>
      </div>
      <div class="yc-gantt-time-header__shifts" aria-label="班次区间">
        <div
          v-for="segment in shiftSegments"
          :key="segment.key"
          class="yc-gantt-time-header__shift"
          :style="{ left: `${segment.left}px`, width: `${segment.width}px` }"
          :title="`${segment.label}（${segment.durationHours} 小时）`"
          :aria-label="segment.label"
        >
          {{ segment.label }}
        </div>
      </div>
      <div class="yc-gantt-time-header__hours">
        <div
          v-for="tick in hourTicks"
          :key="tick.key"
          class="yc-gantt-time-header__hour"
          :style="{ left: `${tick.left}px`, width: `${tick.width}px` }"
        >
          {{ tick.label }}
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import type { GanttDateSegment, GanttHourTick, GanttShiftSegment } from '../types';

const props = defineProps<{
  labelWidth: number;
  timelineWidth: number;
  headerHeight: number;
  dateSegments: GanttDateSegment[];
  shiftSegments: GanttShiftSegment[];
  hourTicks: GanttHourTick[];
}>();

const headerStyle = computed<CSSProperties>(() => ({
  width: `${props.labelWidth + props.timelineWidth}px`,
  height: `${props.headerHeight}px`
}));
const cornerStyle = computed<CSSProperties>(() => ({ width: `${props.labelWidth}px` }));
const axisStyle = computed<CSSProperties>(() => ({
  left: `${props.labelWidth}px`,
  width: `${props.timelineWidth}px`
}));
</script>
