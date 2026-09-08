<script setup lang="ts">
import ActionButton from './ActionButton.vue'
import type { EmptyStateProps } from '../types'
withDefaults(defineProps<EmptyStateProps>(), { title: '这里还没有内容', description: '从第一个项目开始，让想法发生。', actionLabel: '创建项目', ui: 'ant' })
const emit = defineEmits<{ action: [] }>()
</script>
<template>
  <section class="ak-empty">
    <svg width="74" height="70" viewBox="0 0 74 70" fill="none" aria-hidden="true"><rect x="17" y="10" width="40" height="48" rx="6" fill="#f2f6f3" stroke="#acbdb2"/><path d="M27 25h20M27 33h15" stroke="#91aa9a" stroke-width="2" stroke-linecap="round"/><circle cx="53" cy="51" r="13" fill="#e3eee7" stroke="#91aa9a"/><path d="M53 46v10m-5-5h10" stroke="#507e61" stroke-width="2"/></svg>
    <h3>{{ title }}</h3><p>{{ description }}</p>
    <ActionButton v-if="actionLabel" :ui="ui" :label="actionLabel" @click="emit('action')" />
  </section>
</template>
<style>
.ak-empty{text-align:center;padding:28px 18px;font-family:inherit;color:var(--ak-text,#252c29)}.ak-empty h3{font-size:16px;font-weight:600;margin:14px 0 8px}.ak-empty p{font-size:13px;color:var(--ak-muted,#69766e);margin:0 0 22px}
</style>
