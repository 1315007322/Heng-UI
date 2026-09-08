import { createElement, useEffect, useRef, type CSSProperties } from 'react'
import { createApp, h, shallowReactive, type Component } from 'vue'
import { ActionButton as VueActionButton, StatCard as VueStatCard, EmptyState as VueEmptyState, GanttChart as VueGanttChart } from '@yancraft/vue'
import type { ActionButtonProps, StatCardProps, EmptyStateProps } from '@yancraft/vue'
import type { GanttChartProps, GanttTaskChange, GanttDragRejectedPayload, GanttTaskContextMenu, GanttAreaContextMenu } from '@yancraft/vue'

type HostProps = { className?: string; style?: CSSProperties }
/** One Vue app per React host. React owns the host; Vue exclusively owns its children. */
function bridge<P extends object>(component: Component, name: string) {
  function Adapter(props: P & HostProps) {
    const host = useRef<HTMLDivElement>(null)
    const state = useRef<Record<string, unknown> | null>(null)
    const { className, style, ...componentProps } = props
    useEffect(() => {
      const reactiveProps = shallowReactive<Record<string, unknown>>({})
      state.current = reactiveProps
      const app = createApp({ render: () => h(component, reactiveProps) })
      app.mount(host.current!)
      return () => { app.unmount(); state.current = null }
    }, [])
    useEffect(() => {
      if (!state.current) return
      for (const key of Object.keys(state.current)) if (!(key in componentProps)) delete state.current[key]
      Object.assign(state.current, componentProps)
    })
    return createElement('div', { ref: host, className, style, 'data-yancraft-react': name })
  }
  Adapter.displayName = name
  return Adapter
}

export const ActionButton = bridge<ActionButtonProps & { onClick?: (event: MouseEvent) => void }>(VueActionButton, 'ActionButton')
export const StatCard = bridge<StatCardProps>(VueStatCard, 'StatCard')
export const EmptyState = bridge<EmptyStateProps & { onAction?: () => void }>(VueEmptyState, 'EmptyState')
export const GanttChart = bridge<GanttChartProps & { onTaskChange?: (change: GanttTaskChange) => void; onChangeRejected?: (payload: GanttDragRejectedPayload) => void; onTaskContextmenu?: (payload: GanttTaskContextMenu) => void; onAreaContextmenu?: (payload: GanttAreaContextMenu) => void }>(VueGanttChart, 'GanttChart')
export { applyGanttTaskChange } from '@yancraft/vue'
export type { GanttChartProps, GanttTaskChange, GanttRow, GanttTask, GanttShift, GanttUnavailableRange, GanttTaskContextMenu, GanttAreaContextMenu, GanttDragRejectedPayload } from '@yancraft/vue'
export type { ActionButtonProps, StatCardProps, EmptyStateProps, UiLibrary } from '@yancraft/vue'
