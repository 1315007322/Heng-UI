import type { GanttDisplayTask, GanttDisplayRow, GanttDragMode } from './index';

/** 时间轴内部使用的闭开区间，end 表示不可见的右边界。 */
export interface GanttTimelineRange {
  start: number;
  end: number;
}

/** 可视区内的日期分组，用于日期层表头。 */
export interface GanttDateSegment {
  key: string;
  label: string;
  left: number;
  width: number;
}

/** 可视区内的班次区间，用于在日期与小时刻度之间展示每日班次长度。 */
export interface GanttShiftSegment {
  key: string;
  shiftCode: string;
  label: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  left: number;
  width: number;
}

/** 可视区内的小时刻度。 */
export interface GanttHourTick {
  key: string;
  label: string;
  left: number;
  width: number;
}

/** 虚拟列表中保留原始下标的可见资源行。 */
export interface GanttVisibleRow {
  index: number;
  row: GanttDisplayRow;
}

/** 甘特条发起移动或缩放时传给拖拽控制器的上下文。 */
export interface GanttPointerDragStart {
  event: PointerEvent;
  bar: GanttDisplayTask;
  rowIndex: number;
  rowKey: string;
  mode: GanttDragMode;
}

/** 拖动浮层只在开始时响应式创建，逐帧位置由 DOM transform 更新。 */
export interface GanttDragPreviewData {
  bar: GanttDisplayTask;
  width: number;
}

/** 松手时因产线或时间约束被拒绝的拖拽结果。 */
export interface GanttDragRejectedPayload {
  taskId: string;
  targetRowKey: string;
  targetRowLabel: string;
  reason: string;
}
