<template>
  <div class="yc-gantt-task-tooltip">
    <strong>{{ bar.appearance.label }}</strong>
    <span>{{ bar.description }}</span>
    <small>{{ bar.start }} ～ {{ bar.end }}</small>
  </div>
</template>

<script setup lang="ts">
import type { GanttDisplayTask } from '../types';

const props = defineProps<{
  bar: GanttDisplayTask;
}>();

</script>
