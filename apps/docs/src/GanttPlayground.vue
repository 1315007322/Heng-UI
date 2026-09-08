<script setup lang="ts">
import { computed, ref } from 'vue'
import { GanttChart, applyGanttTaskChange, type GanttTaskChange, type GanttTaskContextMenu, type GanttAreaContextMenu } from '@yancraft/vue'
import { Copy, RotateCcw, SlidersHorizontal } from 'lucide-vue-next'
import GanttReactPreview from './GanttReactPreview.vue'
import { createGanttDemoRows, ganttStart, ganttEnd, ganttShifts, ganttUnavailable } from './ganttDemo'
import { catalog } from './catalog'
const props = defineProps<{ tab: string; framework: 'Vue' | 'React' }>()
const entry = catalog.find(c => c.id === 'gantt')!
const rows = ref(createGanttDemoRows())

const zoom = ref(100), readonly = ref(false), allowOverlap = ref(false), showUnavailable = ref(true), large = ref(false)
const copyMessage = ref('')
const message = ref('拖动任务调整时间，或拖到其他资源行；左右手柄可调整时长。')
const options = computed(() => ({ rows: rows.value, start: ganttStart, end: ganttEnd, height: 400, zoomPercent: zoom.value, readonly: readonly.value, allowOverlap: allowOverlap.value, shifts: ganttShifts, unavailableTimeRanges: showUnavailable.value ? ganttUnavailable : [], labelWidth: 130 }))
function change(change: GanttTaskChange) {
  // Production callers should await their own API before replacing rows.
  rows.value = applyGanttTaskChange(rows.value, change)
  message.value = `已应用 ${change.taskId} → ${change.targetRowLabel}，${change.start} ～ ${change.end}`
}
function reset() { rows.value = createGanttDemoRows(large.value ? 1000 : 5); message.value = '示例数据已重置' }
function context(event: GanttTaskContextMenu | GanttAreaContextMenu) { message.value = 'bar' in event ? `任务右键：${event.bar.label}，可由业务方在此打开菜单` : `空白右键：${event.row?.label || '无资源'} ${event.dateTime || ''}` }
const code = computed(() => props.framework === 'Vue' ? `<script setup lang="ts">\nimport { ref } from 'vue'\nimport { GanttChart, applyGanttTaskChange, type GanttTaskChange } from '@yancraft/vue'\nimport '@yancraft/vue/style.css'\nconst rows = ref([{ id: 'line-a', label: '装配线', tasks: [\n  { id: 'task-1', label: '装配任务', start: '2026-09-08 08:00', end: '2026-09-08 12:00', resizable: true }\n] }])\nfunction onChange(change: GanttTaskChange) {\n  // 实际项目在业务 API 保存成功后更新 rows\n  rows.value = applyGanttTaskChange(rows.value, change)\n}\n<` + `/script>\n<template>\n  <GanttChart :rows="rows" start="2026-09-08 00:00"\n    end="2026-09-10 00:00" @task-change="onChange" />\n</template>` : `'use client'\nimport { useState } from 'react'\nimport { GanttChart, applyGanttTaskChange, type GanttRow } from '@yancraft/react'\nimport '@yancraft/vue/style.css'\nexport default function Example() {\n  const [rows, setRows] = useState<GanttRow[]>([{ id: 'line-a', label: '装配线', tasks: [\n    { id: 'task-1', label: '装配任务', start: '2026-09-08 08:00', end: '2026-09-08 12:00', resizable: true }\n  ] }])\n  return <GanttChart rows={rows} start="2026-09-08 00:00" end="2026-09-10 00:00"\n    onTaskChange={change => setRows(current => applyGanttTaskChange(current, change))} />\n}`)
async function copy() { try { await navigator.clipboard.writeText(props.tab === '组件源码' ? entry.source : code.value); copyMessage.value = '代码已复制' } catch { copyMessage.value = '复制失败，请手动选择代码' } }
</script>
<template>
  <div v-if="tab === '交互预览'" class="lab-body gantt-lab-body">
    <div class="preview-column gantt-preview">
      <div class="gantt-canvas"><span class="gantt-preview-label">{{ framework.toUpperCase() }} PREVIEW <span>独立样式 · 资源排程</span></span>
        <GanttChart v-if="framework === 'Vue'" v-bind="options" @task-change="change" @change-rejected="message = $event.reason" @task-contextmenu="context" @area-contextmenu="context" />
        <GanttReactPreview v-else :options="options" @change="change" @reject="message = $event.reason" @context="context" />
      </div>
      <div class="preview-footer gantt-feedback" role="status">{{ message }}</div>
    </div>
    <aside class="controls">
      <div class="controls-heading"><SlidersHorizontal :size="14" /><strong>组件配置</strong><button class="icon-button" aria-label="重置组件参数" title="重置参数" @click="zoom = 100; readonly = false; allowOverlap = false; showUnavailable = true; large = false; reset()"><RotateCcw :size="13" /></button></div>
      <label class="control-label" for="gantt-zoom">时间轴缩放<span>zoomPercent</span></label>
      <select id="gantt-zoom" v-model.number="zoom" class="control-input" aria-label="甘特图缩放"><option :value="50">50%</option><option :value="100">100%</option><option :value="200">200%</option></select>
      <label class="toggle-row">只读<input v-model="readonly" type="checkbox" role="switch" aria-label="只读" /></label>
      <label class="toggle-row">允许重叠<input v-model="allowOverlap" type="checkbox" role="switch" aria-label="允许重叠" /></label>
      <label class="toggle-row">禁用时段<input v-model="showUnavailable" type="checkbox" role="switch" aria-label="禁用时段" /></label>
      <label class="toggle-row">1000 行<input v-model="large" type="checkbox" role="switch" aria-label="1000 行" @change="reset" /></label>
      <button class="light-button gantt-reset" @click="reset"><RotateCcw :size="13" />重置数据</button>
      <p class="gantt-hint">拖动任务或两侧手柄调整排程，Esc 取消操作。任务 01 可跨到资源 02；任务 03 为锁定示例。</p>
    </aside>
  </div>
  <template v-else-if="tab === 'API 文档'">
  <div class="gantt-explanation"><article><h2>组件负责什么</h2><p>日期 / 班次 / 小时表头、横纵虚拟渲染、缩放、拖动、边界调整、目标资源与禁用时段校验。按 Esc 可取消拖动，数据更新和只读状态变化也会取消当前操作。</p></article><article><h2>业务负责什么</h2><p>数据查询、分页、编辑会话、工单表单、保存接口和权限策略。组件只发出变更，由父级决定何时应用。任务 01 仅允许跨到资源 02；任务 03 演示锁定状态。</p></article></div>
  <section class="api-panel gantt-api"><h4>Props 属性</h4><div class="table-scroll"><table><thead><tr><th>参数</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead><tbody><tr v-for="row in entry.props" :key="row[0]"><td v-for="(cell, i) in row" :key="i">{{ cell }}</td></tr></tbody></table></div><h4>事件与高级用法</h4><div class="table-scroll"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody><tr><td>rows / start / end</td><td>资源与任务数据、时间轴起止范围（必填）。任务 ID 全图唯一。</td></tr><tr><td>readonly / resizable</td><td>全图只读由 props 控制；单任务 readonly / resizable 控制锁定与调整边界。</td></tr><tr><td>height / zoomPercent / rowHeight / labelWidth</td><td>视口高度与布局；默认 420px / 100 / 36px / 160px。</td></tr><tr><td>snapMinutes / minimumDurationMinutes</td><td>吸附粒度和最短时长，均默认 30 分钟。</td></tr><tr><td>allowOverlap / unavailableTimeRanges / shifts</td><td>默认禁止重叠；不可用区间采用 [start, end)；班次可跨夜。</td></tr><tr><td>task.allowedRowIds</td><td>未传时允许跨任意行，空数组仅允许原行；业务可传资源白名单。</td></tr><tr><td>task-change / change-rejected</td><td>提交变更 / 约束拒绝。React 对应 onTaskChange / onChangeRejected。</td></tr><tr><td>task-contextmenu / area-contextmenu</td><td>自定义右键菜单入口，包含鼠标位置与行、任务或时间。</td></tr><tr><td>toolbar / scrollToTime(dateTime)</td><td>Vue 工具栏插槽与 ref 定位方法，React 包装层暂不转发。</td></tr></tbody></table></div><p>时间采用浏览器本地时间，不接受 UTC / 时区后缀。拖动仅支持指针操作；不含键盘移动、依赖连线、树形分组或任务堆叠。详见项目 docs/gantt.md。</p></section>
  </template>
  <div v-else class="code-panel"><div class="code-toolbar"><span>{{ tab === '组件源码' ? 'GanttChart.vue · 入口源码' : framework === 'Vue' ? 'GanttExample.vue · 基础用法' : 'GanttExample.tsx · 基础用法' }}</span><button @click="copy"><Copy :size="14" />复制代码</button></div><pre><code>{{ tab === '组件源码' ? entry.source : code }}</code></pre><p v-if="copyMessage" class="gantt-copy-feedback" role="status">{{ copyMessage }}</p></div>
</template>
<style scoped>
.gantt-preview{min-width:0}.gantt-canvas{padding:24px;min-width:0;background:#f9faf7}.gantt-preview-label{display:flex;justify-content:space-between;gap:12px;margin-bottom:20px;font-size:10px;letter-spacing:1px;color:#82907c}.gantt-preview-label span{letter-spacing:0}.gantt-feedback{line-height:1.7;overflow-wrap:anywhere;min-height:48px}.gantt-reset{margin-top:22px;width:100%;justify-content:center}.gantt-hint{font-size:11px;line-height:1.9;color:#819078;margin-top:18px}.gantt-explanation{display:grid;grid-template-columns:1fr 1fr;gap:28px;padding:24px 28px 0}.gantt-explanation h2{font-size:14px}.gantt-explanation p{font-size:12px;color:#65785b;line-height:1.9}.gantt-copy-feedback{margin:0;padding:0 24px 16px;font-size:12px;color:#a8c4ac}.gantt-canvas :deep(.yc-gantt-chart){border-radius:5px}@media(max-width:760px){.gantt-explanation{grid-template-columns:1fr;gap:8px;padding:20px 18px 0}.gantt-canvas{padding:16px 12px}.gantt-preview-label{font-size:9px}}
</style>
