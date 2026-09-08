import type { GanttRow, GanttShift, GanttUnavailableRange } from '@yancraft/vue'
export const ganttStart = '2026-09-08 00:00'
export const ganttEnd = '2026-09-10 00:00'
export const ganttShifts: GanttShift[] = [
  { shiftCode: 'day', shiftName: '白班', startTime: '08:00', endTime: '20:00' },
  { shiftCode: 'night', shiftName: '晚班', startTime: '20:00', endTime: '08:00' }
]
export const ganttUnavailable: GanttUnavailableRange[] = [{ start: '2026-09-08 16:00', end: '2026-09-08 18:00', reason: '设备维护' }]
/** 合成数据，无客户信息；每次返回独立对象，便于重置和多实例验证。 */
export function createGanttDemoRows(count = 5): GanttRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `resource-${index + 1}`, label: `${['装配', '加工', '包装', '检测', '备用'][index % 5]}线 ${String(index + 1).padStart(2, '0')}`,
    tasks: [{ id: `task-${index + 1}`, label: `任务 ${String(index + 1).padStart(2, '0')}`, start: `2026-09-08 ${String(3 + index % 4 * 2).padStart(2, '0')}:00`, end: `2026-09-08 ${String(6 + index % 4 * 2).padStart(2, '0')}:00`, resizable: true,
      description: index === 0 ? '仅可跨到加工线 02' : index === 2 ? '已锁定' : '可拖动与调整边界',
      allowedRowIds: index === 0 ? ['resource-2'] : undefined,
      readonly: index === 2,
      style: index === 2 ? { background: '#f4ead7', color: '#805f29', border: '1px solid #d1ba91' } : undefined
    }]
  }))
}
