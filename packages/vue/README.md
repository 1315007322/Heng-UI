# @yancraft/vue

Vue 3 business components. Package name is a scaffold placeholder; replace the scope before publishing.

```vue
<script setup lang="ts">
import { ActionButton, StatCard, EmptyState, CodeEditor } from '@yancraft/vue'
import '@yancraft/vue/style.css'
import 'element-plus/dist/index.css'
</script>
<template>
  <ActionButton ui="element" label="Save" @click="console.log('save')" />
  <StatCard title="Orders" :value="2048" :change="12.8" />
  <EmptyState ui="ant" @action="console.log('create')" />
  <CodeEditor v-model="content" language="markdown" mode="split" />
</template>
```

Install Vue ^3.5, ant-design-vue ^4.2.6 and element-plus ^2.9 as peer dependencies. Both UI libraries are required by the current shared entry. ESM only. Import Element Plus CSS for the Element renderer. Ant Design Vue uses CSS-in-JS.

ActionButton props: label, ui (ant / element), variant (primary / default / danger), size (small / default / large), loading, disabled. Event: click(MouseEvent). Default slot supported.

StatCard props: title, value, change, description. Sparkline is decorative. Theme variables: --ak-surface, --ak-border, --ak-text, --ak-muted.

EmptyState props: title, description, actionLabel (empty string hides action), ui. Event: action().

CodeEditor is based on CodeMirror 6. It supports JavaScript, TypeScript, JSX, TSX, JSON, HTML, CSS, Markdown, Python, Java, SQL, YAML and Shell syntax. Props include modelValue, language, mode (edit / split / preview for Markdown), theme, readonly, lineNumbers, minHeight, tabSize and wordWrap. Events: update:modelValue, change, focus, blur and ready. Markdown preview escapes raw HTML.

GanttChart props: rows (`{ id, label, tasks }[]`), start, end, height, zoomPercent, readonly, rowHeight, labelWidth, snapMinutes, minimumDurationMinutes, allowOverlap, shifts, unavailableTimeRanges. Tasks require globally unique id, label, start and end; optional readonly, resizable, allowedRowIds, style and data. Uses browser-local time, no timezone suffix. Events: task-change, change-rejected, task-contextmenu, area-contextmenu. The parent owns data and persistence; applyGanttTaskChange(rows, change) performs an immutable update after saving. No Oinone or business API dependencies. Vue toolbar slot and scrollToTime(dateTime) ref method are supported. Import the package CSS for styles.
