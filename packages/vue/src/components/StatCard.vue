<script setup lang="ts">
import type { StatCardProps } from '../types'
withDefaults(defineProps<StatCardProps>(), { title: '总访问量', value: '128,640', change: 12.8, description: '较上一个周期' })
</script>
<template>
  <article class="ak-stat">
    <div class="ak-stat-heading"><span>{{ title }}</span><span class="ak-stat-icon" aria-hidden="true">↗</span></div>
    <strong class="ak-stat-value">{{ value }}</strong>
    <div class="ak-stat-footer"><span :class="['ak-stat-change', { negative: change < 0 }]">{{ change >= 0 ? '↗ +' : '↘ ' }}{{ change }}%</span><span>{{ description }}</span></div>
    <svg class="ak-stat-spark" viewBox="0 0 270 36" fill="none" aria-hidden="true"><path d="M0 32L25 25L48 29L76 18L100 22L128 11L154 16L181 7L206 12L239 2L270 5" stroke="currentColor" stroke-width="2"/></svg>
  </article>
</template>
<style>
.ak-stat{width:310px;max-width:100%;box-sizing:border-box;background:var(--ak-surface,#fff);border:1px solid var(--ak-border,#e5e8e6);border-radius:12px;padding:22px;color:var(--ak-text,#252c29);font-family:inherit}.ak-stat-heading{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--ak-muted,#69766e)}.ak-stat-icon{display:grid;place-items:center;width:28px;height:28px;background:#eff6f2;border-radius:8px;color:#327855}.ak-stat-value{display:block;font-size:34px;letter-spacing:-1px;margin:16px 0}.ak-stat-footer{display:flex;gap:9px;align-items:center;font-size:12px;color:var(--ak-muted,#69766e)}.ak-stat-change{color:#26724b;font-weight:600}.ak-stat-change.negative{color:#b43636}.ak-stat-spark{display:block;width:100%;height:36px;margin-top:20px;color:#418a65}
</style>
