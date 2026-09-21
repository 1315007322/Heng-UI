import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ActionButton, CodeEditor, EmptyState, StatCard } from '../packages/vue/src'

describe.each(['ant', 'element'] as const)('%s engine', (ui) => {
  it('emits click and updates label', async () => {
    const wrapper = mount(ActionButton, { props: { ui, label: '保存' } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.setProps({ label: '已保存' })
    expect(wrapper.text()).toBe('已保存')
    wrapper.unmount()
  })
  it('blocks disabled and loading actions', async () => {
    const wrapper = mount(ActionButton, { props: { ui, disabled: true } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    await wrapper.setProps({ disabled: false, loading: true })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    wrapper.unmount()
  })
  it('emits empty action and allows hiding the action', async () => {
    const wrapper = mount(EmptyState, { props: { ui } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('action')).toHaveLength(1)
    await wrapper.setProps({ actionLabel: '' })
    expect(wrapper.find('button').exists()).toBe(false)
    wrapper.unmount()
  })
})
it('renders negative changes as a decline', () => {
  const wrapper = mount(StatCard, { props: { value: 42, change: -5 } })
  expect(wrapper.get('.ak-stat-value').text()).toBe('42')
  expect(wrapper.get('.ak-stat-change').classes()).toContain('negative')
  expect(wrapper.get('.ak-stat-change').text()).toContain('-5%')
  wrapper.unmount()
})

it('edits highlighted code and safely previews markdown', async () => {
  const wrapper = mount(CodeEditor, { props: { modelValue: '# Title\n\n<script>alert(1)</script>\n\n```ts\nconst ready = true\n```', language: 'markdown', mode: 'split' } })
  expect(wrapper.find('.cm-editor').exists()).toBe(true)
  expect(wrapper.get('.yc-code-editor__markdown').html()).toContain('&lt;script&gt;')
  expect(wrapper.get('.yc-code-editor__markdown').find('script').exists()).toBe(false)
  expect(wrapper.get('.yc-code-editor__markdown').text()).toContain('const ready = true')
  const view = wrapper.emitted('ready')![0][0] as { dispatch: (spec: unknown) => void; state: { doc: { length: number } } }
  view.dispatch({ changes: { from: view.state.doc.length, insert: '\nupdated' } })
  expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('updated')
  await wrapper.setProps({ readonly: true })
  expect(wrapper.find('.cm-content').attributes('contenteditable')).toBe('false')
  wrapper.unmount()
})
