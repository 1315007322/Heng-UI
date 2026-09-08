import { nextTick, ref, shallowRef, watch, type Ref } from 'vue';
import type {
  GanttTaskChange,
  GanttDisplayRow,
  GanttDragPreviewData,
  GanttDragRejectedPayload,
  GanttPointerDragStart,
  GanttTimelineRange
} from '../types';
import {
  formatGanttDateTime,
  GANTT_HOUR_MS,
  ganttTimeToPixel,
  hasGanttBarOverlap,
  isGanttTimeRangeUnavailable,
  snapGanttTimestamp
} from './ganttTimeline';
import { evaluateGanttResourceDrop } from './ganttResourceConstraint';

interface GanttDragControllerOptions {
  rows: Readonly<Ref<GanttDisplayRow[]>>;
  viewport: Ref<HTMLElement | null>;
  previewElement: Ref<HTMLElement | null>;
  previewLabelElement: Ref<HTMLElement | null>;
  range: Readonly<Ref<GanttTimelineRange>>;
  hourWidth: Readonly<Ref<number>>;
  rowHeight: Readonly<Ref<number>>;
  headerHeight: Readonly<Ref<number>>;
  labelWidth: Readonly<Ref<number>>;
  barHeight: number;
  snapMinutes?: Readonly<Ref<number>>;
  minimumDurationMinutes?: Readonly<Ref<number>>;
  readonly?: Readonly<Ref<boolean>>;
  allowOverlap?: Readonly<Ref<boolean>>;
  unavailableTimeRanges?: Readonly<Ref<import('../types').GanttUnavailableRange[]>>;
  onCommit: (change: GanttTaskChange) => void | Promise<void>;
  onReject?: (payload: GanttDragRejectedPayload) => void;
}

interface ActiveDragState extends GanttPointerDragStart {
  initialScrollLeft: number;
  latestClientX: number;
  latestClientY: number;
  nextStart: number;
  nextEnd: number;
  targetRowIndex: number;
  allowed: boolean;
  rejectionReason: string;
  animationFrame: number | null;
}

/**
 * 管理甘特条的移动、缩放和跨资源行拖放。
 * 高频 pointermove 只修改一个浮层 DOM，Vue 数据仅在松手后提交一次。
 */
export function useGanttDragController(options: GanttDragControllerOptions) {
  const activeBarId = ref<string | null>(null);
  const previewData = shallowRef<GanttDragPreviewData | null>(null);
  const activeSourceRowKey = ref<string | null>(null);
  const activeTargetRowIndex = ref<number | null>(null);
  let state: ActiveDragState | null = null;

  const removeWindowListeners = (): void => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    window.removeEventListener('blur', clearDrag);
    window.removeEventListener('keydown', onKeyDown);
  };

  /** 清理当前拖动状态以及全局选择抑制样式。 */
  const clearDrag = (): void => {
    if (state?.animationFrame !== null && state?.animationFrame !== undefined) {
      cancelAnimationFrame(state.animationFrame);
    }
    state = null;
    activeBarId.value = null;
    previewData.value = null;
    activeSourceRowKey.value = null;
    activeTargetRowIndex.value = null;

    removeWindowListeners();
  };

  /** 根据指针位置计算滚动速度，让用户能够拖到当前可视区之外。 */
  const autoScrollViewport = (dragState: ActiveDragState): boolean => {
    const viewport = options.viewport.value;
    if (!viewport) return false;
    const rect = viewport.getBoundingClientRect();
    const edge = 42;
    const maxSpeed = 18;
    let horizontal = 0;
    let vertical = 0;

    const timelineLeft = rect.left + options.labelWidth.value;
    if (dragState.latestClientX < timelineLeft + edge) horizontal = -maxSpeed;
    else if (dragState.latestClientX > rect.right - edge) horizontal = maxSpeed;

    const bodyTop = rect.top + options.headerHeight.value;
    if (dragState.latestClientY < bodyTop + edge) vertical = -maxSpeed;
    else if (dragState.latestClientY > rect.bottom - edge) vertical = maxSpeed;

    const previousLeft = viewport.scrollLeft;
    const previousTop = viewport.scrollTop;
    if (horizontal) viewport.scrollLeft += horizontal;
    if (vertical) viewport.scrollTop += vertical;
    return previousLeft !== viewport.scrollLeft || previousTop !== viewport.scrollTop;
  };

  /** 计算当前拖动结果，并直接更新浮层的 transform、宽度和校验状态。 */
  const renderDragFrame = (allowAutoScroll = true): void => {
    if (!state) return;
    state.animationFrame = null;
    const viewport = options.viewport.value;
    const preview = options.previewElement.value;
    const previewLabel = options.previewLabelElement.value;
    if (!viewport || !preview) return;

    const range = options.range.value;
    const rows = options.rows.value;
    const deltaPixel =
      state.latestClientX - state.event.clientX + (viewport.scrollLeft - state.initialScrollLeft);
    const deltaTime = (deltaPixel / options.hourWidth.value) * GANTT_HOUR_MS;
    const minimumDuration = (options.minimumDurationMinutes?.value ?? 30) * 60 * 1000;
    const originalDuration = state.bar.endTimestamp - state.bar.startTimestamp;
    let nextStart = state.bar.startTimestamp;
    let nextEnd = state.bar.endTimestamp;
    let targetRowIndex = state.rowIndex;

    if (state.mode === 'move') {
      nextStart = snapGanttTimestamp(state.bar.startTimestamp + deltaTime, options.snapMinutes?.value ?? 30);
      nextStart = Math.min(range.end - originalDuration, Math.max(range.start, nextStart));
      nextEnd = nextStart + originalDuration;
      const viewportRect = viewport.getBoundingClientRect();
      const rowPosition =
        state.latestClientY - viewportRect.top + viewport.scrollTop - options.headerHeight.value;
      targetRowIndex = Math.min(rows.length - 1, Math.max(0, Math.floor(rowPosition / options.rowHeight.value)));
    } else if (state.mode === 'resize-start') {
      nextStart = snapGanttTimestamp(state.bar.startTimestamp + deltaTime, options.snapMinutes?.value ?? 30);
      nextStart = Math.max(range.start, Math.min(state.bar.endTimestamp - minimumDuration, nextStart));
    } else {
      nextEnd = snapGanttTimestamp(state.bar.endTimestamp + deltaTime, options.snapMinutes?.value ?? 30);
      nextEnd = Math.min(range.end, Math.max(state.bar.startTimestamp + minimumDuration, nextEnd));
    }

    const targetRow = rows[targetRowIndex];
    const overlaps = hasGanttBarOverlap(targetRow, nextStart, nextEnd, state.bar.id);
    const resourceDrop = evaluateGanttResourceDrop(state.bar, state.rowKey, targetRow);
    const timeAllowed = !isGanttTimeRangeUnavailable(
      nextStart,
      nextEnd,
      options.unavailableTimeRanges?.value || []
    );
    // Default to preventing overlaps; business applications may explicitly allow them.
    const allowed = resourceDrop.allowed && timeAllowed && (!overlaps || options.allowOverlap?.value === true);
    const rejectionReason = !timeAllowed ? '目标时间处于不可用区间' : resourceDrop.reason || (overlaps && !options.allowOverlap?.value ? '目标资源存在时间冲突' : '');
    const left = ganttTimeToPixel(nextStart, range.start, options.hourWidth.value);
    const top = targetRowIndex * options.rowHeight.value + (options.rowHeight.value - options.barHeight) / 2;
    const width = Math.max(3, ganttTimeToPixel(nextEnd, nextStart, options.hourWidth.value));

    state.nextStart = nextStart;
    state.nextEnd = nextEnd;
    state.targetRowIndex = targetRowIndex;
    state.allowed = allowed;
    state.rejectionReason = rejectionReason;
    if (activeTargetRowIndex.value !== targetRowIndex) activeTargetRowIndex.value = targetRowIndex;
    preview.style.width = `${width}px`;
    preview.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    preview.dataset.allowed = String(allowed);
    if (previewLabel) {
      previewLabel.textContent = `${formatGanttDateTime(nextStart)} ～ ${formatGanttDateTime(nextEnd)} · ${
        targetRow?.label || ''
      }${!allowed ? `（${rejectionReason || '不可放置'}）` : overlaps ? '（存在时间冲突）' : '（可放置）'}`;
    }

    if (allowAutoScroll && autoScrollViewport(state)) scheduleDragFrame();
  };

  /** 将同一绘制帧内的多次 pointermove 合并成一次浮层更新。 */
  const scheduleDragFrame = (): void => {
    if (!state || state.animationFrame !== null) return;
    state.animationFrame = requestAnimationFrame(() => renderDragFrame(true));
  };

  function onPointerMove(event: PointerEvent): void {
    if (!state || event.pointerId !== state.event.pointerId) return;
    state.latestClientX = event.clientX;
    state.latestClientY = event.clientY;
    scheduleDragFrame();
  }

  function onKeyDown(event: KeyboardEvent): void { if (event.key === "Escape") clearDrag(); }

  function onPointerUp(event: PointerEvent): void {
    if (!state || event.pointerId !== state.event.pointerId) return;
    if (state.animationFrame !== null) cancelAnimationFrame(state.animationFrame);
    state.latestClientX = event.clientX;
    state.latestClientY = event.clientY;
    renderDragFrame(false);
    const completedState = state;
    const sourceRow = options.rows.value.find((row) => row.key === completedState.rowKey);
    const targetRow = options.rows.value[completedState.targetRowIndex];
    const changed =
      completedState.nextStart !== completedState.bar.startTimestamp ||
      completedState.nextEnd !== completedState.bar.endTimestamp ||
      sourceRow?.key !== targetRow?.key;

    const rejectedPayload: GanttDragRejectedPayload | null =
      !completedState.allowed && targetRow
        ? {
            taskId: completedState.bar.id,
            targetRowKey: targetRow.key,
            targetRowLabel: targetRow.label,
            reason: completedState.rejectionReason || '目标位置不可放置当前任务'
          }
        : null;

    clearDrag();
    if (rejectedPayload) {
      options.onReject?.(rejectedPayload);
      return;
    }
    if (!changed || !sourceRow || !targetRow) return;

    void options.onCommit({
      taskId: completedState.bar.id,
      mode: completedState.mode,
      sourceRowKey: sourceRow.key,
      sourceRowLabel: sourceRow.label,
      targetRowKey: targetRow.key,
      targetRowLabel: targetRow.label,
      previousStart: completedState.bar.start,
      previousEnd: completedState.bar.end,
      start: formatGanttDateTime(completedState.nextStart),
      end: formatGanttDateTime(completedState.nextEnd),

    });
  }

  function onPointerCancel(event: PointerEvent): void {
    if (!state || event.pointerId !== state.event.pointerId) return;
    clearDrag();
  }

  /** 接收甘特条或缩放手柄的 pointerdown，建立一次新的拖动会话。 */
  const beginDrag = (payload: GanttPointerDragStart): void => {
    const isResize = payload.mode === 'resize-start' || payload.mode === 'resize-end';
    if (
      options.readonly?.value ||
      payload.bar.appearance.immobile ||
      (isResize && payload.bar.appearance.resizable !== true) ||
      isGanttTimeRangeUnavailable(
        payload.bar.startTimestamp,
        payload.bar.endTimestamp,
        options.unavailableTimeRanges?.value || []
      ) ||
      payload.event.button !== 0
    ) {
      return;
    }
    const viewport = options.viewport.value;
    if (!viewport) return;
    payload.event.preventDefault();
    clearDrag();
    const width = Math.max(
      3,
      ganttTimeToPixel(payload.bar.endTimestamp, payload.bar.startTimestamp, options.hourWidth.value)
    );
    state = {
      ...payload,
      initialScrollLeft: viewport.scrollLeft,
      latestClientX: payload.event.clientX,
      latestClientY: payload.event.clientY,
      nextStart: payload.bar.startTimestamp,
      nextEnd: payload.bar.endTimestamp,
      targetRowIndex: payload.rowIndex,
      allowed: true,
      rejectionReason: '',
      animationFrame: null
    };
    activeBarId.value = payload.bar.id;
    previewData.value = { bar: payload.bar, width };
    activeSourceRowKey.value = payload.rowKey;
    activeTargetRowIndex.value = payload.rowIndex;

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('blur', clearDrag);
    window.addEventListener('keydown', onKeyDown);
    void nextTick(scheduleDragFrame);
  };

  // Cancel stale gestures when parent data, permissions or geometry change.
  watch([options.rows, options.range, options.hourWidth, options.rowHeight, options.labelWidth, () => options.readonly?.value, () => options.allowOverlap?.value, () => options.unavailableTimeRanges?.value, () => options.snapMinutes?.value, () => options.minimumDurationMinutes?.value], clearDrag);

  return {
    activeBarId,
    previewData,
    activeSourceRowKey,
    activeTargetRowIndex,
    beginDrag,
    clearDrag
  };
}
