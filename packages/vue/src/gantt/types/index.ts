import type { CSSProperties } from 'vue'
export type GanttDragMode = 'move' | 'resize-start' | 'resize-end'
export interface GanttTask {
  /** 全图唯一的任务 ID。 */
  id: string
  label: string
  /** 本地时间 YYYY-MM-DD HH:mm[:ss]，不接受时区后缀。 */
  start: string
  end: string
  description?: string
  readonly?: boolean
  resizable?: boolean
  /** 未传时可跨任意行；空数组仅允许留在原行。 */
  allowedRowIds?: string[]
  style?: Pick<CSSProperties, 'background' | 'color' | 'border' | 'borderRadius'>
  data?: unknown
}
export interface GanttRow { id: string; label: string; tasks: GanttTask[]; data?: unknown }
export interface GanttShift { shiftCode: string; shiftName: string; startTime: string; endTime: string }
/** 闭开区间 [start, end)，相邻边界允许衔接。 */
export interface GanttUnavailableRange { start: string; end: string; reason?: string }
export interface GanttChartProps {
  rows: GanttRow[]
  start: string
  end: string
  height?: number
  zoomPercent?: number
  rowHeight?: number
  labelWidth?: number
  readonly?: boolean
  snapMinutes?: number
  minimumDurationMinutes?: number
  allowOverlap?: boolean
  shifts?: GanttShift[]
  unavailableTimeRanges?: GanttUnavailableRange[]
  disableBrowserContextMenu?: boolean
}
export interface GanttTaskChange {
  taskId: string
  mode: GanttDragMode
  sourceRowKey: string
  sourceRowLabel: string
  targetRowKey: string
  targetRowLabel: string
  previousStart: string
  previousEnd: string
  start: string
  end: string
}
export interface GanttContext { shifts: GanttShift[]; unavailableTimeRanges: GanttUnavailableRange[] }
/** 渲染内部类型，应用通常仅使用 GanttRow / GanttTask。 */
export interface GanttDisplayTask extends GanttTask {
  startTimestamp: number
  endTimestamp: number
  appearance: { id: string; label: string; immobile: boolean; resizable: boolean; style: CSSProperties }
}
export interface GanttDisplayRow { key: string; label: string; bars: GanttDisplayTask[]; data?: unknown }
export interface GanttTaskContextMenu { event: MouseEvent; bar: GanttDisplayTask; row: GanttDisplayRow; rowIndex: number; context: GanttContext }
export interface GanttAreaContextMenu { event: MouseEvent; row?: GanttDisplayRow; rowIndex?: number; timestamp?: number; dateTime?: string; context: GanttContext }
export * from './timeline'
