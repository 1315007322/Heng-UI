import { describe, it, expect, vi } from 'vitest'
import { act, createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { nextTick } from 'vue'
import { ActionButton } from '../packages/react/src/index'

describe('React bridge', () => {
  it('handles StrictMode, updated callbacks, removed props and unmounting', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const first = vi.fn()
    const second = vi.fn()
    await act(async () => { root.render(createElement(StrictMode, null, createElement(ActionButton, { label: '保存', ui: 'element', onClick: first }))) })
    await nextTick()
    expect(host.textContent).toContain('保存')
    host.querySelector('button')!.click()
    expect(first).toHaveBeenCalledTimes(1)
    await act(async () => { root.render(createElement(StrictMode, null, createElement(ActionButton, { ui: 'element', onClick: second }))) })
    await nextTick()
    expect(host.textContent).toContain('创建项目')
    host.querySelector('button')!.click()
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    await act(async () => root.unmount())
    await nextTick()
    expect(host.innerHTML).toBe('')
    host.remove()
  })
})
