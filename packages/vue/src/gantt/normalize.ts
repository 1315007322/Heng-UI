import type { GanttRow, GanttDisplayRow, GanttTaskChange } from './types'
import { parseGanttDateTime } from './services/ganttTimeline'

/** 检查公开数据并创建渲染快照，不改变调用方对象。 */
export function normalizeGanttRows(rows: GanttRow[]): GanttDisplayRow[] {
  const rowIds = new Set<string>(), taskIds = new Set<string>()
  return rows.map(row => {
    if (!row.id || rowIds.has(row.id)) throw new Error('资源 ID 必须非空且唯一')
    rowIds.add(row.id)
    const bars = row.tasks.map(task => {
      if (!task.id || taskIds.has(task.id)) throw new Error('任务 ID 必须全图唯一')
      taskIds.add(task.id)
      const startTimestamp = parseGanttDateTime(task.start), endTimestamp = parseGanttDateTime(task.end)
      if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp) || endTimestamp <= startTimestamp) throw new Error(`任务「${task.label}」起止时间无效`)
      return { ...task, startTimestamp, endTimestamp, appearance: { id: task.id, label: task.label, immobile: !!task.readonly, resizable: !!task.resizable, style: { background: '#dcecdf', color: '#285a3a', border: '1px solid #8aaf91', borderRadius: '4px', ...task.style } } }
    }).sort((a, b) => a.startTimestamp - b.startTimestamp)
    return { key: row.id, label: row.label, data: row.data, bars }
  })
}

/** 由父级在保存成功后应用变更；目标不存在或原任务已更新时拒绝覆盖，防止过期提交丢数据。 */
export function applyGanttTaskChange(rows: GanttRow[], change: GanttTaskChange): GanttRow[] {
  const source = rows.find(row => row.id === change.sourceRowKey)
  const target = rows.find(row => row.id === change.targetRowKey)
  const task = source?.tasks.find(item => item.id === change.taskId)
  if (!task || !target) throw new Error('任务或目标资源已不存在')
  if (task.start !== change.previousStart || task.end !== change.previousEnd) throw new Error('任务时间已更新，请重新操作')
  const start = parseGanttDateTime(change.start), end = parseGanttDateTime(change.end)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('变更时间无效')
  return rows.map(row => {
    if (row.id !== source!.id && row.id !== target.id) return row
    const tasks = row.tasks.filter(item => item.id !== task.id)
    if (row.id === target.id) tasks.push({ ...task, start: change.start, end: change.end })
    return { ...row, tasks: tasks.sort((a, b) => parseGanttDateTime(a.start) - parseGanttDateTime(b.start)) }
  })
}
