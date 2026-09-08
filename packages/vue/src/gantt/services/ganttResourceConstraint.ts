import type { GanttDisplayTask, GanttDisplayRow } from '../types'

/** 通用资源约束由任务的行 ID 白名单控制，原行始终允许调整。 */
export function evaluateGanttResourceDrop(task: GanttDisplayTask, sourceRowKey: string, row?: GanttDisplayRow) {
  if (!row) return { allowed: false, reason: '目标资源不存在' }
  const allowed = row.key === sourceRowKey || task.allowedRowIds === undefined || task.allowedRowIds.includes(row.key)
  return { allowed, reason: allowed ? undefined : `任务不支持资源「${row.label}」` }
}
