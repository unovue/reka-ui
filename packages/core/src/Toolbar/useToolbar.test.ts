import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import { RovingFocusGroup, RovingFocusItem } from '@/RovingFocus'
import { ToolbarRoot, ToolbarToggleGroup, ToolbarToggleItem } from '.'
import { useToolbar } from './useToolbar'

describe('useToolbar — surfaces', () => {
  it('root is role="toolbar" with aria-orientation and no data-*', () => {
    const t = useToolbar()
    expect(t.root.attrs.value).toEqual({ 'role': 'toolbar', 'aria-orientation': 'horizontal' })
    expect(t.context.orientation.value).toBe('horizontal')
    expect(t.context.dir.value).toBe('ltr')
  })

  it('orientation and dir are reactive through getters', () => {
    const orientation = ref<'horizontal' | 'vertical'>('horizontal')
    const t = useToolbar({ orientation: () => orientation.value, dir: 'rtl' })
    orientation.value = 'vertical'
    expect(t.root.attrs.value['aria-orientation']).toBe('vertical')
    expect(t.context.dir.value).toBe('rtl')
  })

  it('buttons carry the native disabled only', () => {
    const t = useToolbar()
    expect(t.getButtonSurface(true).attrs.value).toEqual({ disabled: true })
    expect(t.getButtonSurface(true).state.value).toEqual({ disabled: true })
    expect(t.getButtonSurface().attrs.value).toEqual({ disabled: false })
  })

  it('the link clicks itself on Space', () => {
    const t = useToolbar()
    const link = document.createElement('a')
    const click = vi.spyOn(link, 'click')
    link.addEventListener('keydown', t.link.props.value.onKeydown)
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(click).not.toHaveBeenCalled()
    link.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    expect(click).toHaveBeenCalledTimes(1)
  })
})

describe('useToolbar — standalone render', () => {
  const Standalone = defineComponent({
    setup() {
      const t = useToolbar({ orientation: 'horizontal' })
      return () => h(RovingFocusGroup, { asChild: true, orientation: 'horizontal' }, () =>
        h('div', { 'aria-label': 'Formatting', ...t.root.attrs.value }, [
          h(RovingFocusItem, { asChild: true }, () => h('button', { type: 'button', ...t.getButtonSurface().attrs.value }, 'Bold')),
          h(RovingFocusItem, { asChild: true }, () => h('a', { href: '#', ...t.link.attrs.value }, 'Help')),
        ]))
    },
  })

  it('renders and passes axe', async () => {
    const { container, getByRole } = render(Standalone)
    expect(getByRole('toolbar')).toHaveAttribute('aria-orientation', 'horizontal')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('toolbarToggleGroup — the ToggleGroup details contract passes through', () => {
  function mountGroup(groupProps: Record<string, any>) {
    return render(defineComponent({
      setup: () => () => h(ToolbarRoot, { 'aria-label': 'Toolbar' }, () =>
        h(ToolbarToggleGroup, { 'type': 'single', 'aria-label': 'Align', ...groupProps }, () => [
          h(ToolbarToggleItem, { 'value': 'left', 'aria-label': 'Left' }, () => 'L'),
          h(ToolbarToggleItem, { 'value': 'right', 'aria-label': 'Right' }, () => 'R'),
        ])),
    }))
  }

  it('forwards update:modelValue with item-press details, and nothing when unchanged', async () => {
    const onUpdate = vi.fn()
    const { getByLabelText } = mountGroup({ 'modelValue': 'left', 'onUpdate:modelValue': onUpdate })
    await fireEvent.click(getByLabelText('Right'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith('right', expect.objectContaining({ reason: 'item-press' }))
  })

  it('beforeUpdate:modelValue cancels through the wrapper (uncontrolled)', async () => {
    const onUpdate = vi.fn()
    const { getByLabelText } = mountGroup({
      'defaultValue': 'left',
      'onBeforeUpdate:modelValue': (_v: unknown, details: any) => details.cancel(),
      'onUpdate:modelValue': onUpdate,
    })
    await fireEvent.click(getByLabelText('Right'))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(getByLabelText('Left')).toHaveAttribute('data-state', 'checked')
    expect(getByLabelText('Right')).toHaveAttribute('data-state', 'unchecked')
  })

  it('uncontrolled: updates its own state', async () => {
    const { getByLabelText } = mountGroup({ defaultValue: 'left' })
    await fireEvent.click(getByLabelText('Right'))
    expect(getByLabelText('Right')).toHaveAttribute('data-state', 'checked')
  })
})
