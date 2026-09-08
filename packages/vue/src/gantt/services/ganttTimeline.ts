import type {
  GanttTaskChange,
  GanttDisplayTask,
  GanttDisplayRow,
  GanttShift,
  GanttDateSegment,
  GanttHourTick,
  GanttShiftSegment,
  GanttTimelineRange,
  GanttVisibleRow
} from '../types';
import type { GanttUnavailableRange } from '../types';

export const GANTT_HOUR_MS = 60 * 60 * 1000;
export const GANTT_MINUTE_MS = 60 * 1000;

/** 解析后端使用的无时区日期字符串，避免浏览器按 UTC 解释。 */
export function parseGanttDateTime(value: string): number {
  const match = String(value ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return Number.NaN;
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day) || date.getHours() !== Number(hour) || date.getMinutes() !== Number(minute) || date.getSeconds() !== Number(second)) return Number.NaN;
  return date.getTime();
}

/** 判断时间点是否落在任一不可用区间内；区间采用 [start, end)，结束时刻可操作。 */
export function isGanttTimestampUnavailable(
  timestamp: number,
  ranges: GanttUnavailableRange[] = []
): boolean {
  return ranges.some((item) => {
    const start = parseGanttDateTime(item.start);
    const end = parseGanttDateTime(item.end);
    return Number.isFinite(start) && Number.isFinite(end) && start < end && timestamp >= start && timestamp < end;
  });
}

/** 判断任务时间段是否与任一不可用区间相交；边界相接不视为相交。 */
export function isGanttTimeRangeUnavailable(
  start: number,
  end: number,
  ranges: GanttUnavailableRange[] = []
): boolean {
  return ranges.some((item) => {
    const rangeStart = parseGanttDateTime(item.start);
    const rangeEnd = parseGanttDateTime(item.end);
    return Number.isFinite(rangeStart) && Number.isFinite(rangeEnd) && rangeStart < rangeEnd && start < rangeEnd && end > rangeStart;
  });
}

/** 将时间戳格式化为后端和甘特组件共同使用的本地日期时间格式。 */
export function formatGanttDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}${date.getSeconds() ? `:${pad(date.getSeconds())}` : ''}`;
}

/** 将时间轴边界对齐到完整小时，确保小时标签、网格和甘特条使用同一坐标原点。 */
export function normalizeGanttTimelineRange(startText: string, endText: string): GanttTimelineRange {
  const parsedStart = parseGanttDateTime(startText);
  const parsedEnd = parseGanttDateTime(endText);
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const fallbackStart = now.getTime();
  const start = Number.isFinite(parsedStart) ? Math.floor(parsedStart / GANTT_HOUR_MS) * GANTT_HOUR_MS : fallbackStart;
  const rawEnd = Number.isFinite(parsedEnd) && parsedEnd > start ? parsedEnd : start + 24 * GANTT_HOUR_MS;
  const end = Math.ceil(rawEnd / GANTT_HOUR_MS) * GANTT_HOUR_MS;
  return { start, end: Math.max(end, start + GANTT_HOUR_MS) };
}

/** 将时间戳转换为相对时间轴起点的横坐标。 */
export function ganttTimeToPixel(timestamp: number, rangeStart: number, hourWidth: number): number {
  return ((timestamp - rangeStart) / GANTT_HOUR_MS) * hourWidth;
}

/** 将时间轴横坐标转换为时间戳。 */
export function ganttPixelToTime(pixel: number, rangeStart: number, hourWidth: number): number {
  return rangeStart + (pixel / hourWidth) * GANTT_HOUR_MS;
}

/** 按指定分钟粒度吸附时间，避免拖动产生不可读的秒和毫秒。 */
export function snapGanttTimestamp(timestamp: number, snapMinutes: number): number {
  const step = Math.max(1, snapMinutes) * GANTT_MINUTE_MS;
  return Math.round(timestamp / step) * step;
}

/** 计算可视区资源行，滚动时只让少量行进入 Vue 渲染树。 */
export function getVisibleGanttRows(
  rows: GanttDisplayRow[],
  scrollTop: number,
  viewportHeight: number,
  headerHeight: number,
  rowHeight: number,
  overscan = 4
): GanttVisibleRow[] {
  if (!rows.length) return [];
  const bodyScrollTop = Math.max(0, scrollTop - headerHeight);
  const visibleHeight = Math.max(rowHeight, viewportHeight - headerHeight);
  const start = Math.max(0, Math.floor(bodyScrollTop / rowHeight) - overscan);
  const end = Math.min(rows.length, Math.ceil((bodyScrollTop + visibleHeight) / rowHeight) + overscan);
  const result: GanttVisibleRow[] = [];
  for (let index = start; index < end; index += 1) result.push({ index, row: rows[index] });
  return result;
}

/** 从已按开始时间排序的资源任务中筛选横向可视区。 */
export function getVisibleGanttBars(
  bars: GanttDisplayTask[],
  visibleStart: number,
  visibleEnd: number
): GanttDisplayTask[] {
  const result: GanttDisplayTask[] = [];
  for (const bar of bars) {
    if (bar.startTimestamp >= visibleEnd) break;
    if (bar.endTimestamp > visibleStart) result.push(bar);
  }
  return result;
}

/** 构建可视区小时刻度；长时间范围不会一次创建全部小时 DOM。 */
export function buildVisibleHourTicks(
  range: GanttTimelineRange,
  visibleStart: number,
  visibleEnd: number,
  hourWidth: number,
  overscanHours = 2
): GanttHourTick[] {
  const start = Math.max(range.start, Math.floor(visibleStart / GANTT_HOUR_MS) * GANTT_HOUR_MS - overscanHours * GANTT_HOUR_MS);
  const end = Math.min(range.end, Math.ceil(visibleEnd / GANTT_HOUR_MS) * GANTT_HOUR_MS + overscanHours * GANTT_HOUR_MS);
  const ticks: GanttHourTick[] = [];
  for (let timestamp = start; timestamp < end; timestamp += GANTT_HOUR_MS) {
    const date = new Date(timestamp);
    ticks.push({
      key: String(timestamp),
      label: String(date.getHours()).padStart(2, '0'),
      left: ganttTimeToPixel(timestamp, range.start, hourWidth),
      width: hourWidth
    });
  }
  return ticks;
}

const parseShiftMinutes = (value: string): number | null => {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 ? hours * 60 + minutes : null;
};

const formatShiftClock = (value: string): string => {
  const minutes = parseShiftMinutes(value);
  if (minutes == null) return '--:--';
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

const formatShiftDuration = (durationMs: number): string => {
  const hours = durationMs / GANTT_HOUR_MS;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
};

/** 按每日重复班次生成顶部区间，跨天班次会自然延伸到次日并按实际时长绘制。 */
export function buildVisibleShiftSegments(
  range: GanttTimelineRange,
  visibleStart: number,
  visibleEnd: number,
  hourWidth: number,
  shifts: GanttShift[],
  overscanDays = 1
): GanttShiftSegment[] {
  if (!shifts.length || !Number.isFinite(hourWidth) || hourWidth <= 0) return [];

  const visibleWindowStart = Math.max(range.start, visibleStart - overscanDays * 24 * GANTT_HOUR_MS);
  const visibleWindowEnd = Math.min(range.end, visibleEnd + overscanDays * 24 * GANTT_HOUR_MS);
  const cursor = new Date(visibleWindowStart);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);
  const segments: GanttShiftSegment[] = [];
  const seenShifts = new Set<string>();
  const normalizedShifts = shifts.filter((shift) => {
    const start = parseShiftMinutes(shift.startTime);
    const end = parseShiftMinutes(shift.endTime);
    if (start == null || end == null || start === end) return false;
    const key = `${shift.shiftCode}|${start}|${end}`;
    if (seenShifts.has(key)) return false;
    seenShifts.add(key);
    return true;
  });

  while (cursor.getTime() < visibleWindowEnd) {
    const dayStart = cursor.getTime();
    for (const shift of normalizedShifts) {
      const startMinutes = parseShiftMinutes(shift.startTime) as number;
      const endMinutes = parseShiftMinutes(shift.endTime) as number;
      const start = dayStart + startMinutes * 60 * 1000;
      const end = dayStart + (endMinutes > startMinutes ? endMinutes : endMinutes + 24 * 60) * 60 * 1000;
      if (end <= range.start || start >= range.end || end <= visibleWindowStart || start >= visibleWindowEnd) continue;

      const segmentStart = Math.max(range.start, visibleWindowStart, start);
      const segmentEnd = Math.min(range.end, visibleWindowEnd, end);
      if (segmentEnd <= segmentStart) continue;

      const durationHours = (end - start) / GANTT_HOUR_MS;
      const shiftName = String(shift.shiftName || shift.shiftCode || '班次').trim();
      segments.push({
        key: `${shift.shiftCode || shiftName}-${start}`,
        shiftCode: shift.shiftCode,
        label: `${shiftName} ${formatShiftClock(shift.startTime)}–${formatShiftClock(shift.endTime)} · ${formatShiftDuration(
          end - start
        )}`,
        startTime: formatShiftClock(shift.startTime),
        endTime: formatShiftClock(shift.endTime),
        durationHours,
        left: ganttTimeToPixel(segmentStart, range.start, hourWidth),
        width: ganttTimeToPixel(segmentEnd, range.start, hourWidth) - ganttTimeToPixel(segmentStart, range.start, hourWidth)
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return segments;
}

/** 构建日期层表头，并正确处理首尾不是零点的部分日期。 */
export function buildVisibleDateSegments(
  range: GanttTimelineRange,
  visibleStart: number,
  visibleEnd: number,
  hourWidth: number
): GanttDateSegment[] {
  const cursor = new Date(Math.max(range.start, visibleStart - 24 * GANTT_HOUR_MS));
  cursor.setHours(0, 0, 0, 0);
  const limit = Math.min(range.end, visibleEnd + 24 * GANTT_HOUR_MS);
  const segments: GanttDateSegment[] = [];

  while (cursor.getTime() < limit) {
    const dayStart = cursor.getTime();
    const nextDay = new Date(dayStart);
    nextDay.setDate(nextDay.getDate() + 1);
    const segmentStart = Math.max(range.start, dayStart);
    const segmentEnd = Math.min(range.end, nextDay.getTime());
    if (segmentEnd > segmentStart) {
      segments.push({
        key: String(dayStart),
        label: `${cursor.getMonth() + 1}.${cursor.getDate()}日`,
        left: ganttTimeToPixel(segmentStart, range.start, hourWidth),
        width: ganttTimeToPixel(segmentEnd, range.start, hourWidth) - ganttTimeToPixel(segmentStart, range.start, hourWidth)
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return segments;
}

/** 检查目标资源在给定时间区间内是否已有其他任务。 */
export function hasGanttBarOverlap(
  row: GanttDisplayRow | undefined,
  start: number,
  end: number,
  excludedBarId: string
): boolean {
  if (!row) return true;
  return row.bars.some((bar) => bar.id !== excludedBarId && bar.startTimestamp < end && bar.endTimestamp > start);
}
