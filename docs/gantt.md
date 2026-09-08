# GanttChart：从业务甘特图提取的通用组件

来源是 mas-mahler 的 asTaskGantt 时间轴、任务条、班次表头、可见区域计算与拖拽控制器。原项目代码未修改，Oinone 查询、Widget 注册、场景存储、编辑会话和工单弹窗未搬入组件库。

工作台入口：侧栏 GanttChart 或组件总览中的甘特图入口，地址 `#gantt/button`。

## 数据契约与受控更新

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GanttChart, applyGanttTaskChange, type GanttRow, type GanttTaskChange } from '@yancraft/vue'
import '@yancraft/vue/style.css'

const rows = ref<GanttRow[]>([
  { id: 'line-a', label: '装配线 A', tasks: [
    { id: 'task-1', label: '装配任务', start: '2026-09-08 08:00', end: '2026-09-08 12:00',
      resizable: true, allowedRowIds: ['line-b'], data: { orderId: 'example' } }
  ] },
  { id: 'line-b', label: '装配线 B', tasks: [] }
])
const saving = ref(false)
async function save(change: GanttTaskChange) {
  saving.value = true
  try {
    // 在此 await 业务 API；失败时保留原 rows，并在业务层展示错误。
    rows.value = applyGanttTaskChange(rows.value, change)
  } finally { saving.value = false }
}
</script>
<template>
  <GanttChart :rows="rows" start="2026-09-08 00:00" end="2026-09-10 00:00"
    :readonly="saving" @task-change="save" />
</template>
```

组件不修改传入数据，不请求服务器，也不假定保存成功。`task-change` 提供 taskId、源/目标行 key 与 label、原始/新起止时间和 move/resize-start/resize-end 操作类型。调用方负责处理并替换 rows；不更新则任务保持原位。保存期间建议 readonly=true。

`applyGanttTaskChange` 是不可变更新辅助方法，不是服务端权限或业务规则校验器。它检查任务及目标行存在、变更时间有效，并拒绝覆盖起止时间已变化的任务；其他并发业务修改须在服务器通过版本号或编辑会话校验。

## Props

| 属性 | 默认值 | 含义 |
| --- | --- | --- |
| rows | 必填 | `{ id, label, tasks, data? }[]` |
| start / end | 必填 | 时间轴范围，建议整小时边界 |
| height | 420 | 视口高度 px |
| rowHeight / labelWidth | 36 / 160 | 行高与固定资源列宽 px |
| zoomPercent | 100 | 按每小时像素宽度缩放；时间轴至少填满视口 |
| readonly | false | 全图禁止拖动，右键事件仍可用于查看详情 |
| snapMinutes / minimumDurationMinutes | 30 / 30 | 拖动吸附与边界调整最短时长 |
| allowOverlap | false | 允许同一行任务重叠；不会自动堆叠到多条轨道 |
| shifts | [] | 每日班次 `{ shiftCode, shiftName, startTime, endTime }`，支持跨夜 |
| unavailableTimeRanges | [] | `{ start, end, reason? }[]`，采用闭开区间 `[start, end)` |
| disableBrowserContextMenu | true | 接管浏览器右键，业务菜单由调用方实现 |

任务：`{ id, label, start, end, description?, readonly?, resizable?, allowedRowIds?, style?, data? }`。

- 行 ID 唯一，任务 ID 全图唯一，不使用数组下标作为长期业务身份。
- 默认可移动，调整左右边界需显式设 resizable=true。
- allowedRowIds 未传允许所有目标行；空数组只允许原行；传数组按行 ID 限制。原行始终允许。
- style 支持 background、color、border、borderRadius；data 为不透明业务扩展数据。
- 时间按浏览器本地时间解析，格式 YYYY-MM-DD HH:mm[:ss]；拒绝无效日期和 UTC / 时区后缀。按实际时间计算宽度，跨时区部署应由业务统一转换；未提供时区选择器。
- 图表边界当前按完整小时对齐；请用整小时 start/end 定义严格的排程范围。任务与禁用时段可精确到分钟。
- 无效任务/重复 ID 会显示错误，不静默丢弃。源业务中尚未排产的 null 起止时间应先过滤或在独立未排产列表展示。

## Events 与扩展点

| Vue 事件 | React 回调 | 内容 |
| --- | --- | --- |
| task-change | onTaskChange | 提议的任务时间 / 资源变更 |
| change-rejected | onChangeRejected | taskId、目标行与拒绝原因 |
| task-contextmenu | onTaskContextmenu | event、bar（渲染快照，保留 data）、row、rowIndex、context |
| area-contextmenu | onAreaContextmenu | event、可选 row/rowIndex/timestamp/dateTime、context |

Vue 提供 toolbar 插槽及 `ref.scrollToTime(dateTime)`。React 可从 `@yancraft/react` 导入 GanttChart 和 applyGanttTaskChange，属性相同，事件采用上表回调；当前包装层不转发 Vue 插槽、ref 方法和外部 Provider，仍依赖 Vue 运行时。甘特图自身只使用 Vue 和独立样式，入口包目前仍沿用两套 UI 库的 peerDependencies。

## 接回原 Oinone 项目

保留原 Widget、API 文件和 scenarioDataAsTaskUpdate 业务组件。建议在原业务包内新增适配文件，将**现有预处理后的 displayRows** 转为 GanttRow：

```ts
// 以下函数放在原业务项目：displayRows 来自已有 buildAsTaskGanttRows。
// 先构建 resourceCode -> row.key 映射，不能直接把资源编码当作通用行 ID。
const rowIdsByResource = new Map(displayRows.map(row => [row.resourceCode, row.key]))
const rows = displayRows.map(row => ({
  id: row.key,
  label: row.label,
  data: row,
  tasks: row.bars.map(bar => ({
    id: bar.id,
    label: bar.productCode,
    description: bar.ganttBarConfig.label,
    start: bar.start,
    end: bar.end,
    readonly: bar.workOrderType !== 'NORMAL_PLAN' || !!bar.ganttBarConfig.immobile,
    resizable: !!bar.ganttBarConfig.resizable,
    allowedRowIds: (bar.availableResourceCodes || []).flatMap(code => {
      const id = rowIdsByResource.get(code)
      return id ? [id] : []
    }),
    style: { background: bar.ganttBarConfig.style?.background, color: bar.ganttBarConfig.style?.color,
      border: bar.ganttBarConfig.style?.border, borderRadius: bar.ganttBarConfig.style?.borderRadius },
    data: bar
  }))
}))
```

原始资源编码可能重复时，应改用 Map<string, string[]>，并按场景范围映射所有允许行。映射必须在查询结果的当前分页上下文内建立。

回调适配：通过 change.taskId 查找 tasks 的 data 原任务，将其 taskId、taskCode、supplyOrderCode 与变化合并，交给原 `onBarChange` / 工单更新适配流程。**原回调的 barId 对应新 change.taskId，原后端 taskId 则从 data 中取回，两者不能混用。** 右键事件的 row/bar 也需从 data 恢复原始业务上下文。

原组件仅正常计划可拖、跨行需资源白名单、无编辑会话禁止拖动、重叠交给后端校验：这些规则应分别通过任务 readonly、allowedRowIds、全局 readonly、allowOverlap=true 显式保留。场景锁定区间、额外日期、排程周期外时间仍由业务计算后传入 unavailableTimeRanges。

业务接口继续使用原 Oinone 标准封装，组件内没有 fetch/axios。此次只交付独立组件与接入说明，未替换原 Widget；业务项目回接与后端联调需要单独执行。

## 能力边界

保留双向可见区域渲染、帧合并拖动浮层、边缘自动滚动、资源行约束、禁用区间、左右边界调整、共享提示层、固定表头/资源列。新增默认重叠阻断、Escape / blur 取消、响应式数据和几何变化时取消拖动。

不包含依赖连线、树形资源、自动排程、任务堆叠、后端分页、业务弹窗、键盘移动任务或 React 侧 SSR 内容。1000 行演示用于检查 DOM 虚拟化，不代表正式性能基准。抽出的源码保留原有时间轴算法；跨 DST 地区的班次时长仍应做业务侧验证。
