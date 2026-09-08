<template>
  <div
    class="yc-gantt-task-bar"
    :class="{
      'yc-gantt-task-bar--active': active,
      'yc-gantt-task-bar--readonly': readonly || bar.appearance.immobile
    }"
    :style="[positionStyle, bar.appearance.style]"
    :aria-label="bar.appearance.label"
    :aria-disabled="readonly || bar.appearance.immobile"
    tabindex="0"
    @pointerdown="startDrag($event, 'move')"
    @mouseenter="$emit('hover-start', $event)"
    @mousemove="$emit('hover-move', $event)"
    @mouseleave="$emit('hover-end')"
    @blur="$emit('hover-end')"
    @contextmenu="$emit('context-menu', $event)"
  >
    <span
      v-if="resizeEnabled"
      class="yc-gantt-task-bar__resize-handle yc-gantt-task-bar__resize-handle--start"
      aria-hidden="true"
      @pointerdown.stop="startDrag($event, 'resize-start')"
    />
    <span class="yc-gantt-task-bar__content">
      <strong>{{ bar.label }}</strong>
    </span>
    <span
      v-if="resizeEnabled"
      class="yc-gantt-task-bar__resize-handle yc-gantt-task-bar__resize-handle--end"
      aria-hidden="true"
      @pointerdown.stop="startDrag($event, 'resize-end')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import type { GanttDisplayTask, GanttDragMode } from '../types';

const props = withDefaults(
  defineProps<{
    bar: GanttDisplayTask;
    left: number;
    width: number;
    active?: boolean;
    readonly?: boolean;
  }>(),
  {
    active: false,
    readonly: false
  }
);

const emit = defineEmits<{
  (event: 'drag-start', payload: { event: PointerEvent; mode: GanttDragMode }): void;
  (event: 'hover-start', payload: MouseEvent): void;
  (event: 'hover-move', payload: MouseEvent): void;
  (event: 'hover-end'): void;
  (event: 'context-menu', payload: MouseEvent): void;
}>();

/** 左右调整必须由任务条显式开启，并受只读和不可移动状态约束。 */
const resizeEnabled = computed(
  () => !props.readonly && !props.bar.appearance.immobile && props.bar.appearance.resizable === true
);
const positionStyle = computed<CSSProperties>(() => ({
  left: `${props.left}px`,
  width: `${Math.max(3, props.width)}px`
}));

/** 将移动和两端缩放统一转换为拖拽控制器能够识别的操作。 */
const startDrag = (event: PointerEvent, mode: GanttDragMode): void => {
  if (props.readonly || props.bar.appearance.immobile) return;
  emit('drag-start', { event, mode });
};
</script>
