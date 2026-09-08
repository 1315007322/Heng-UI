import { describe, expect, it } from 'vitest'
import { normalizeGanttRows, applyGanttTaskChange } from '../packages/vue/src/gantt/normalize'
import { parseGanttDateTime, isGanttTimeRangeUnavailable, buildVisibleShiftSegments, getVisibleGanttRows } from '../packages/vue/src/gantt/services/ganttTimeline'
import { evaluateGanttResourceDrop } from '../packages/vue/src/gantt/services/ganttResourceConstraint'
import type { GanttRow, GanttTaskChange } from '../packages/vue/src/gantt/types'
const rows: GanttRow[] = [{ id: 'a', label: 'A', tasks: [{ id: 't', label: '任务', start: '2026-09-08 08:00', end: '2026-09-08 10:00', data: { businessId: 7 } }] }, { id: 'b', label: 'B', tasks: [] }]
const change: GanttTaskChange = { taskId: 't', sourceRowKey: 'a', targetRowKey: 'b', sourceRowLabel: 'A', targetRowLabel: 'B', previousStart: rows[0].tasks[0].start, previousEnd: rows[0].tasks[0].end, start: '2026-09-08 12:00', end: '2026-09-08 14:00', mode: 'move' }
describe('extracted Gantt contract', () => {
  it('rejects duplicate IDs and invalid dates instead of losing tasks', () => {
    expect(() => normalizeGanttRows([...rows, { ...rows[0], id: 'c' }])).toThrow('全图唯一')
    expect(() => normalizeGanttRows([rows[0], rows[0]])).toThrow('资源 ID')
    expect(Number.isNaN(parseGanttDateTime('2026-02-30 08:00'))).toBe(true)
    expect(Number.isNaN(parseGanttDateTime('2026-09-08T08:00:00Z'))).toBe(true)
    expect(Number.isNaN(parseGanttDateTime('2026-09-08 25:00'))).toBe(true)
  })
  it('moves immutably, retains business payload and rejects a stale change', () => {
    const next = applyGanttTaskChange(rows, change)
    expect(rows[0].tasks).toHaveLength(1)
    expect(next[0].tasks).toHaveLength(0)
    expect(next[1].tasks[0].data).toEqual({ businessId: 7 })
    expect(() => applyGanttTaskChange(rows, { ...change, targetRowKey: 'missing' })).toThrow('不存在')
    expect(() => applyGanttTaskChange(rows, { ...change, previousStart: '2026-09-08 07:00' })).toThrow('已更新')
  })
  it('treats unavailable windows as half-open intervals', () => {
    const ranges = [{ start: '2026-09-08 10:00', end: '2026-09-08 12:00' }]
    expect(isGanttTimeRangeUnavailable(parseGanttDateTime('2026-09-08 08:00'), parseGanttDateTime('2026-09-08 10:00'), ranges)).toBe(false)
    expect(isGanttTimeRangeUnavailable(parseGanttDateTime('2026-09-08 09:00'), parseGanttDateTime('2026-09-08 11:00'), ranges)).toBe(true)
  })
  it('distinguishes unrestricted, empty and explicit row allowlists', () => {
    const normalized = normalizeGanttRows(rows), task = normalized[0].bars[0]
    expect(evaluateGanttResourceDrop(task, 'a', normalized[1]).allowed).toBe(true)
    expect(evaluateGanttResourceDrop({ ...task, allowedRowIds: [] }, 'a', normalized[1]).allowed).toBe(false)
    expect(evaluateGanttResourceDrop({ ...task, allowedRowIds: [] }, 'a', normalized[0]).allowed).toBe(true)
    expect(evaluateGanttResourceDrop({ ...task, allowedRowIds: ['b'] }, 'a', normalized[1]).allowed).toBe(true)
  })
  it('retains overnight shifts and bounds visible row count', () => {
    const range = { start: parseGanttDateTime('2026-09-08 00:00'), end: parseGanttDateTime('2026-09-10 00:00') }
    const shifts = buildVisibleShiftSegments(range, range.start, range.end, 20, [{ shiftCode: 'night', shiftName: '夜班', startTime: '20:00', endTime: '08:00' }])
    expect(shifts.some(shift => shift.durationHours === 12)).toBe(true)
    const many = Array.from({ length: 1000 }, (_, i) => ({ key: String(i), label: String(i), bars: [] }))
    expect(getVisibleGanttRows(many, 18000, 400, 108, 36).length).toBeLessThan(25)
  })
})
