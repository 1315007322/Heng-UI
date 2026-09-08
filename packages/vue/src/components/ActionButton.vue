<script setup lang="ts">
import { Button as AButton } from 'ant-design-vue'
import { ElButton } from 'element-plus'
import type { ActionButtonProps } from '../types'
withDefaults(defineProps<ActionButtonProps>(), { label: '创建项目', ui: 'ant', variant: 'primary', size: 'default', loading: false, disabled: false })
const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <AButton v-if="ui === 'ant'" :type="variant === 'primary' ? 'primary' : 'default'" :danger="variant === 'danger'" :size="size === 'default' ? 'middle' : size" :loading="loading" :disabled="disabled" @click="emit('click', $event)"><slot>{{ label }}</slot></AButton>
  <ElButton v-else :type="variant === 'default' ? undefined : variant" :size="size" :loading="loading" :disabled="disabled" @click="emit('click', $event)"><slot>{{ label }}</slot></ElButton>
</template>
