# @yancraft/react

Typed React adapters around YanCraft UI Vue components. This is runtime interoperability, not Vue-to-React source conversion.

```tsx
'use client'
import { ActionButton } from '@yancraft/react'
import '@yancraft/vue/style.css'
import 'element-plus/dist/index.css'

export default function Example() {
  return <ActionButton ui="element" label="Save" onClick={() => console.log('save')} />
}
```

Requires React / React DOM 18.2 or 19, Vue ^3.5, ant-design-vue ^4.2.6 and element-plus ^2.9. The Vue package is a direct dependency. Install both local tarballs together when testing before publishing.

Exports ActionButton (onClick), StatCard, EmptyState (onAction). Props mirror the Vue package; className and style apply to the enclosing div. No React children, scoped slots, automatic context inheritance, or server-rendered Vue content. Each adapter owns a Vue app and cleans it up on React unmount. For Next.js, use within a client component.

Also exports GanttChart and applyGanttTaskChange. Gantt callbacks: onTaskChange, onChangeRejected, onTaskContextmenu, onAreaContextmenu. Supply controlled rows and replace them after your save succeeds. No toolbar slot or imperative Vue ref forwarding in the React adapter.
