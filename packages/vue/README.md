# @yancraft/vue

Vue 3 business components. Package name is a scaffold placeholder; replace the scope before publishing.

```vue
<script setup lang="ts">
import { ActionButton, StatCard, EmptyState } from '@yancraft/vue'
import '@yancraft/vue/style.css'
import 'element-plus/dist/index.css'
</script>
<template>
  <ActionButton ui="element" label="Save" @click="console.log('save')" />
  <StatCard title="Orders" :value="2048" :change="12.8" />
  <EmptyState ui="ant" @action="console.log('create')" />
</template>
```

Install Vue ^3.5, ant-design-vue ^4.2.6 and element-plus ^2.9 as peer dependencies. Both UI libraries are required by the current shared entry. ESM only. Import Element Plus CSS for the Element renderer. Ant Design Vue uses CSS-in-JS.

ActionButton props: label, ui (ant / element), variant (primary / default / danger), size (small / default / large), loading, disabled. Event: click(MouseEvent). Default slot supported.

StatCard props: title, value, change, description. Sparkline is decorative. Theme variables: --ak-surface, --ak-border, --ak-text, --ak-muted.

EmptyState props: title, description, actionLabel (empty string hides action), ui. Event: action().
