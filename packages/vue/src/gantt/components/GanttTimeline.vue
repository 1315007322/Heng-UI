<template>
  <div
    ref="viewport"
    class="yc-gantt-timeline"
    :class="{ 'yc-gantt-timeline--dragging': Boolean(activeBarId) }"
    @scroll.passive="onViewportScroll"
    @contextmenu="handleTimelineContextMenu"
  >
    <div class="yc-gantt-timeline__canvas" :style="canvasStyle">
      <GanttTimeHeader
        :label-width="labelWidth"
        :timeline-width="timelineWidth"
        :header-height="headerHeight"
        :date-segments="dateSegments"
        :shift-segments="shiftSegments"
        :hour-ticks="hourTicks"
      />

      <div class="yc-gantt-timeline__body" :style="bodyStyle">
        <div
          class="yc-gantt-timeline__row-label-backdrop"
          :style="{ width: `${labelWidth}px` }"
          aria-hidden="true"
        />
        <div
          v-for="visibleRow in visibleRows"
          :key="visibleRow.row.key"
          class="yc-gantt-timeline__row"
          :class="{
            'yc-gantt-timeline__row--alternate': visibleRow.index % 2 === 1,
            'yc-gantt-timeline__row--resource-available':
              Boolean(activeBarId) && isDragResourceAvailable(visibleRow.row),
            'yc-gantt-timeline__row--resource-unavailable':
              Boolean(activeBarId) && !isDragResourceAvailable(visibleRow.row),
            'yc-gantt-timeline__row--drag-target': activeTargetRowIndex === visibleRow.index
          }"
          :style="rowStyle(visibleRow.index)"
          :data-row-key="visibleRow.row.key"
          @contextmenu="handleAreaContextMenu($event, visibleRow.index, visibleRow.row)"
        >
          <div class="yc-gantt-timeline__row-label" :style="labelStyle" :title="visibleRow.row.label">
            <span class="yc-gantt-timeline__row-label-text">{{ visibleRow.row.label }}</span>
            <small
              v-if="activeBarId"
              class="yc-gantt-timeline__resource-state"
              :class="{
                'yc-gantt-timeline__resource-state--available': isDragResourceAvailable(visibleRow.row)
              }"
            >
              {{ isDragResourceAvailable(visibleRow.row) ? '✓ 可放置' : '× 不支持' }}
            </small>
          </div>
          <div class="yc-gantt-timeline__row-track" :style="trackStyle">
            <GanttTaskBar
              v-for="bar in visibleBars(visibleRow.row)"
              :key="bar.id"
              :bar="bar"
              :left="barLeft(bar)"
              :width="barWidth(bar)"
              :active="activeBarId === bar.id"
              :readonly="isBarReadonly(bar)"
              @drag-start="beginBarDrag($event, bar, visibleRow.index, visibleRow.row.key)"
              @hover-start="showTooltip(bar, $event)"
              @hover-move="moveTooltip($event)"
              @hover-end="hideTooltip"
              @context-menu="handleBarContextMenu($event, bar, visibleRow.index, visibleRow.row)"
            />
          </div>
        </div>

        <div v-if="!rows.length" class="yc-gantt-timeline__empty" :style="{ left: `${labelWidth}px` }">
          暂无可展示的资源数据
        </div>

        <div
          v-for="segment in unavailableSegments"
          :key="segment.key"
          class="yc-gantt-timeline__unavailable-segment"
          :style="{ left: `${labelWidth + segment.left}px`, width: `${segment.width}px` }"
          :title="segment.reason || '不可操作时间区间'"
          @pointerdown.prevent.stop
          @contextmenu.prevent.stop
          aria-hidden="true"
        >
          <span v-if="segment.reason">{{ segment.reason }}</span>
        </div>

        <div
          class="yc-gantt-timeline__drag-layer"
          :style="{ left: `${labelWidth}px`, width: `${timelineWidth}px` }"
          aria-hidden="true"
        >
          <div
            v-show="previewData"
            ref="previewElement"
            class="yc-gantt-timeline__drag-preview"
            :style="previewStyle"
          >
            <span>{{ previewData?.bar.label }}</span>
            <small ref="previewLabelElement" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="tooltipBar && !activeBarId" class="yc-gantt-timeline__tooltip" :style="tooltipStyle">
      <GanttTaskTooltip :bar="tooltipBar" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  toRef,
  type CSSProperties
} from 'vue';
import {
  buildVisibleDateSegments,
  buildVisibleHourTicks,
  buildVisibleShiftSegments,
  formatGanttDateTime,
  parseGanttDateTime,
  GANTT_HOUR_MS,
  ganttPixelToTime,
  ganttTimeToPixel,
  isGanttTimestampUnavailable,
  isGanttTimeRangeUnavailable,
  getVisibleGanttBars,
  getVisibleGanttRows,
  evaluateGanttResourceDrop,
  normalizeGanttTimelineRange,
  useGanttDragController
} from '../services';
import type {
  GanttAreaContextMenu,
  GanttTaskChange,
  GanttTaskContextMenu,
  GanttContext,
  GanttDisplayTask,
  GanttDisplayRow,
  GanttDragMode,
  GanttDragRejectedPayload
} from '../types';
import GanttTaskBar from './GanttTaskBar.vue';
import GanttTaskTooltip from './GanttTaskTooltip.vue';
import GanttTimeHeader from './GanttTimeHeader.vue';

const BASE_HOUR_WIDTH = 23.3333;
const BAR_HEIGHT = 22;
const HORIZONTAL_OVERSCAN_HOURS = 3;

const props = withDefaults(
  defineProps<{
    rows: GanttDisplayRow[];
    start: string;
    end: string;
    zoomPercent?: number;
    snapMinutes?: number;
    minimumDurationMinutes?: number;
    allowOverlap?: boolean;
    rowHeight?: number;
    labelWidth?: number;
    headerHeight?: number;
    readonly?: boolean;
    disableBrowserContextMenu?: boolean;
    ganttContext?: GanttContext;
  }>(),
  {
    zoomPercent: 100,
    snapMinutes: 30,
    minimumDurationMinutes: 30,
    allowOverlap: false,
    rowHeight: 32,
    labelWidth: 240,
    // Keep this literal because Vue 3.2 hoists withDefaults() options
    // and cannot reference locally declared script-setup constants here.
    headerHeight: 108,
    readonly: false,
    disableBrowserContextMenu: true,
    ganttContext: () => ({ shifts: [], unavailableTimeRanges: [] })
  }
);

const emit = defineEmits<{
  (event: 'bar-change', change: GanttTaskChange): void;
  (event: 'bar-change-rejected', payload: GanttDragRejectedPayload): void;
  (event: 'bar-contextmenu', payload: GanttTaskContextMenu): void;
  (event: 'area-contextmenu', payload: GanttAreaContextMenu): void;
}>();

const viewport = ref<HTMLElement | null>(null);
const previewElement = ref<HTMLElement | null>(null);
const previewLabelElement = ref<HTMLElement | null>(null);
const viewportScrollLeft = ref(0);
const viewportScrollTop = ref(0);
const viewportWidth = ref(0);
const viewportHeight = ref(0);
const tooltipBar = shallowRef<GanttDisplayTask | null>(null);
const tooltipStyle = ref<CSSProperties>({});
const range = computed(() => normalizeGanttTimelineRange(props.start, props.end));
const totalHours = computed(() => (range.value.end - range.value.start) / GANTT_HOUR_MS);
const readonlyRef = computed(() => props.readonly);

/** 小范围时间轴至少铺满视口；放大后始终使用稳定的每小时像素宽度。 */
const hourWidth = computed(() => {
  const requested = (BASE_HOUR_WIDTH * props.zoomPercent) / 100;
  const available = Math.max(0, viewportWidth.value - props.labelWidth);
  return Math.max(requested, totalHours.value ? available / totalHours.value : requested);
});
const timelineWidth = computed(() => Math.max(1, totalHours.value * hourWidth.value));
const bodyHeight = computed(() =>
  Math.max(props.rows.length * props.rowHeight, viewportHeight.value - props.headerHeight, props.rowHeight)
);
const visibleTimeStart = computed(() =>
  Math.max(range.value.start, range.value.start + (viewportScrollLeft.value / hourWidth.value) * GANTT_HOUR_MS)
);
const visibleTimeEnd = computed(() =>
  Math.min(
    range.value.end,
    visibleTimeStart.value +
      (Math.max(hourWidth.value, viewportWidth.value - props.labelWidth) / hourWidth.value) * GANTT_HOUR_MS
  )
);
const renderTimeStart = computed(() => visibleTimeStart.value - HORIZONTAL_OVERSCAN_HOURS * GANTT_HOUR_MS);
const renderTimeEnd = computed(() => visibleTimeEnd.value + HORIZONTAL_OVERSCAN_HOURS * GANTT_HOUR_MS);
const dateSegments = computed(() =>
  buildVisibleDateSegments(range.value, visibleTimeStart.value, visibleTimeEnd.value, hourWidth.value)
);
const hourTicks = computed(() =>
  buildVisibleHourTicks(range.value, visibleTimeStart.value, visibleTimeEnd.value, hourWidth.value)
);
const shiftSegments = computed(() =>
  buildVisibleShiftSegments(
    range.value,
    visibleTimeStart.value,
    visibleTimeEnd.value,
    hourWidth.value,
    props.ganttContext?.shifts || []
  )
);
const visibleRows = computed(() =>
  getVisibleGanttRows(
    props.rows,
    viewportScrollTop.value,
    viewportHeight.value,
    props.headerHeight,
    props.rowHeight
  )
);

/** 将配置区间裁剪到当前时间轴并转换为像素，供甘特图绘制禁用遮罩。 */
const unavailableSegments = computed(() => {
  const result: Array<{ key: string; left: number; width: number; reason?: string }> = [];
  for (const [index, item] of (props.ganttContext?.unavailableTimeRanges || []).entries()) {
    const start = parseGanttDateTime(item.start);
    const end = parseGanttDateTime(item.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    const clippedStart = Math.max(range.value.start, start);
    const clippedEnd = Math.min(range.value.end, end);
    if (clippedEnd < clippedStart) continue;
    result.push({
      key: `${index}-${start}-${end}`,
      left: ganttTimeToPixel(clippedStart, range.value.start, hourWidth.value),
      width: Math.max(1, ganttTimeToPixel(clippedEnd, clippedStart, hourWidth.value)),
      reason: item.reason
    });
  }
  return result;
});

/** 判断甘特条当前时间段是否与不可用区间相交，决定该条自身是否允许拖拽。 */
const isBarUnavailable = (bar: GanttDisplayTask): boolean =>
  isGanttTimeRangeUnavailable(bar.startTimestamp, bar.endTimestamp, props.ganttContext?.unavailableTimeRanges || []);

/** 仅正常计划允许拖拽；全局只读、业务锁定和禁用时间段继续沿用原限制。 */
const isBarReadonly = (bar: GanttDisplayTask): boolean =>
  props.readonly || bar.startTimestamp < range.value.start || bar.endTimestamp > range.value.end ||
  Boolean(bar.appearance.immobile) ||
  isBarUnavailable(bar);

const canvasStyle = computed<CSSProperties>(() => ({
  width: `${props.labelWidth + timelineWidth.value}px`,
  height: `${props.headerHeight + bodyHeight.value}px`
}));
const bodyStyle = computed<CSSProperties>(() => ({
  width: `${props.labelWidth + timelineWidth.value}px`,
  height: `${bodyHeight.value}px`
}));
const labelStyle = computed<CSSProperties>(() => ({
  width: `${props.labelWidth}px`,
  height: `${props.rowHeight}px`
}));
const trackStyle = computed<CSSProperties>(() => ({
  left: `${props.labelWidth}px`,
  width: `${timelineWidth.value}px`,
  height: `${props.rowHeight}px`,
  '--gantt-hour-width': `${hourWidth.value}px`,
  '--gantt-day-width': `${hourWidth.value * 24}px`
}));
const {
  activeBarId,
  previewData,
  activeSourceRowKey,
  activeTargetRowIndex,
  beginDrag,
  clearDrag
} = useGanttDragController({
  rows: toRef(props, 'rows'),
  viewport,
  previewElement,
  previewLabelElement,
  range,
  hourWidth,
  rowHeight: toRef(props, "rowHeight"),
  headerHeight: toRef(props, "headerHeight"),
  labelWidth: toRef(props, "labelWidth"),
  barHeight: BAR_HEIGHT,
  snapMinutes: toRef(props, "snapMinutes"),
  minimumDurationMinutes: toRef(props, "minimumDurationMinutes"),
  allowOverlap: toRef(props, "allowOverlap"),
  readonly: readonlyRef,
  unavailableTimeRanges: computed(() => props.ganttContext?.unavailableTimeRanges || []),
  onCommit: async (change) => emit('bar-change', change),
  onReject: (payload) => emit('bar-change-rejected', payload)
});

/** 拖动开始时一次性计算各产线是否支持当前工单，目标行变化时直接复用结果。 */
const dragResourceAvailability = computed(() => {
  const availability = new Map<string, boolean>();
  const bar = previewData.value?.bar;
  const sourceRowKey = activeSourceRowKey.value;
  if (!bar || !sourceRowKey) return availability;
  props.rows.forEach((row) => {
    availability.set(row.key, evaluateGanttResourceDrop(bar, sourceRowKey, row).allowed);
  });
  return availability;
});

const isDragResourceAvailable = (row: GanttDisplayRow): boolean =>
  dragResourceAvailability.value.get(row.key) === true;

const previewStyle = computed<CSSProperties>(() => ({
  width: `${previewData.value?.width || 0}px`,
  height: `${BAR_HEIGHT}px`,
  background: previewData.value?.bar.appearance.style?.background,
  border: previewData.value?.bar.appearance.style?.border,
  color: previewData.value?.bar.appearance.style?.color
}));

let resizeObserver: ResizeObserver | null = null;
let scrollFrame: number | null = null;
let tooltipFrame: number | null = null;

/**
 * 将纵向位置对齐到资源行边界；原生滚动仍保持逐像素顺滑，Vue 虚拟行只在跨行时更新。
 * 头部范围内无需切换资源行，因此统一返回零以避免无意义渲染。
 */
const getVirtualScrollTop = (scrollTop: number): number => {
  const bodyScrollTop = Math.max(0, scrollTop - props.headerHeight);
  return bodyScrollTop === 0
    ? 0
    : props.headerHeight + Math.floor(bodyScrollTop / props.rowHeight) * props.rowHeight;
};

/** 同步视口尺寸；该方法只在挂载或 ResizeObserver 回调中执行，避免滚动时强制布局。 */
const measureViewport = (): void => {
  const element = viewport.value;
  if (!element) return;
  viewportScrollLeft.value = element.scrollLeft;
  viewportScrollTop.value = getVirtualScrollTop(element.scrollTop);
  viewportWidth.value = element.clientWidth;
  viewportHeight.value = element.clientHeight;
};

/**
 * 将高频滚动事件合并到浏览器绘制帧中，并仅同步滚动坐标。
 * 不读取视口尺寸，避免纵向滚动连带触发时间刻度重算与同步布局。
 */
const onViewportScroll = (): void => {
  hideTooltip();
  if (scrollFrame !== null) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null;
    const element = viewport.value;
    if (!element) return;
    viewportScrollLeft.value = element.scrollLeft;
    viewportScrollTop.value = getVirtualScrollTop(element.scrollTop);
  });
};

const rowStyle = (index: number): CSSProperties => ({
  top: `${index * props.rowHeight}px`,
  width: `${props.labelWidth + timelineWidth.value}px`,
  height: `${props.rowHeight}px`
});
const visibleBars = (row: GanttDisplayRow): GanttDisplayTask[] =>
  getVisibleGanttBars(row.bars, renderTimeStart.value, renderTimeEnd.value);
const barLeft = (bar: GanttDisplayTask): number =>
  ganttTimeToPixel(bar.startTimestamp, range.value.start, hourWidth.value);
const barWidth = (bar: GanttDisplayTask): number =>
  ganttTimeToPixel(bar.endTimestamp, bar.startTimestamp, hourWidth.value);

/** 将甘特条组件事件补全为拖拽控制器需要的资源上下文。 */
const beginBarDrag = (
  payload: { event: PointerEvent; mode: GanttDragMode },
  bar: GanttDisplayTask,
  rowIndex: number,
  rowKey: string
): void => {
  if (isBarReadonly(bar)) return;
  hideTooltip();
  beginDrag({ ...payload, bar, rowIndex, rowKey });
};

/** 根据配置拦截整个时间轴范围内的浏览器默认菜单。 */
/** 创建右键事件使用的上下文快照，避免事件处理期间受到后续状态切换影响。 */
const createContextSnapshot = (): GanttContext => ({
  shifts: props.ganttContext.shifts.map((shift) => ({ ...shift })),
  unavailableTimeRanges: props.ganttContext.unavailableTimeRanges.map((item) => ({ ...item }))
});

/** 将时间轴右键位置转换为时间戳，供不可用区间拦截复用。 */
const resolveContextTimestamp = (event: MouseEvent): number | undefined => {
  const element = viewport.value;
  if (!element) return undefined;
  const timelineLeft = element.getBoundingClientRect().left + props.labelWidth;
  if (event.clientX < timelineLeft) return undefined;
  const pixel = event.clientX - timelineLeft + element.scrollLeft;
  return Math.min(range.value.end, Math.max(range.value.start, ganttPixelToTime(pixel, range.value.start, hourWidth.value)));
};

/** 根据配置拦截浏览器默认菜单，并处理资源行之外的甘特图空白区域右键事件。 */
const handleTimelineContextMenu = (event: MouseEvent): void => {
  if (props.disableBrowserContextMenu) event.preventDefault();
  const target = event.target as Element | null;
  if (target?.closest('.yc-gantt-task-bar, .yc-gantt-timeline__row')) return;
  const timestamp = resolveContextTimestamp(event);
  if (timestamp != null && isGanttTimestampUnavailable(timestamp, props.ganttContext?.unavailableTimeRanges || [])) return;
  hideTooltip();
  emit('area-contextmenu', { event, context: createContextSnapshot() });
};

/** 将资源行空白位置换算成时间点，供新建任务表单自动回填。 */
const handleAreaContextMenu = (event: MouseEvent, rowIndex: number, row: GanttDisplayRow): void => {
  const target = event.target as Element | null;
  if (target?.closest('.yc-gantt-task-bar')) return;
  if (props.disableBrowserContextMenu) event.preventDefault();

  const element = viewport.value;
  let timestamp: number | undefined;
  if (element) {
    const timelineLeft = element.getBoundingClientRect().left + props.labelWidth;
    if (event.clientX >= timelineLeft) {
      const pixel = event.clientX - timelineLeft + element.scrollLeft;
      timestamp = Math.min(
        range.value.end,
        Math.max(range.value.start, ganttPixelToTime(pixel, range.value.start, hourWidth.value))
      );
    }
  }

  if (timestamp != null && isGanttTimestampUnavailable(timestamp, props.ganttContext?.unavailableTimeRanges || [])) return;

  hideTooltip();
  emit('area-contextmenu', {
    event,
    row,
    rowIndex,
    timestamp,
    dateTime: timestamp == null ? undefined : formatGanttDateTime(timestamp),
    context: createContextSnapshot()
  });
};

/** 向上提供自定义右键菜单所需的甘特条、资源行和鼠标坐标上下文。 */
const handleBarContextMenu = (
  event: MouseEvent,
  bar: GanttDisplayTask,
  rowIndex: number,
  row: GanttDisplayRow
): void => {
  if (props.disableBrowserContextMenu) event.preventDefault();
  hideTooltip();
  emit('bar-contextmenu', { event, bar, row, rowIndex, context: createContextSnapshot() });
};

const updateTooltipPosition = (event: MouseEvent): void => {
  tooltipStyle.value = {
    left: `${Math.max(8, Math.min(window.innerWidth - 300, event.clientX + 14))}px`,
    top: `${Math.max(8, Math.min(window.innerHeight - 150, event.clientY + 16))}px`
  };
};

/** 全图复用一个 Tooltip，避免每个甘特条创建弹层实例。 */
const showTooltip = (bar: GanttDisplayTask, event: MouseEvent): void => {
  if (activeBarId.value) return;
  tooltipBar.value = bar;
  updateTooltipPosition(event);
};

const moveTooltip = (event: MouseEvent): void => {
  if (!tooltipBar.value || tooltipFrame !== null) return;
  tooltipFrame = requestAnimationFrame(() => {
    tooltipFrame = null;
    updateTooltipPosition(event);
  });
};

const hideTooltip = (): void => {
  tooltipBar.value = null;
};

/** 将指定时间滚动到可视区域中部，供页面后续实现“定位到任务”复用。 */
const scrollToTimestamp = (timestamp: number): void => {
  if (!viewport.value) return;
  const target = ganttTimeToPixel(timestamp, range.value.start, hourWidth.value);
  viewport.value.scrollLeft = Math.max(0, target - (viewport.value.clientWidth - props.labelWidth) / 2);
  measureViewport();
};

onMounted(async () => {
  await nextTick();
  measureViewport();
  if (viewport.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measureViewport);
    resizeObserver.observe(viewport.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
  if (tooltipFrame !== null) cancelAnimationFrame(tooltipFrame);
  clearDrag();
});

defineExpose({
  measureViewport,
  scrollToTimestamp
});
</script>
