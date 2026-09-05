import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import * as Reka from '../index'
import { useTabs } from './useTabs'
import { makeContentId, makeTriggerId } from './utils'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

describe('useTabs — state & selection', () => {
  it('defaults modelValue to the provided defaultValue', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    expect(t.modelValue.value).toBe('a')
    expect(t.isControlled.value).toBe(false)
    expect(t.lastChangeDetails.value.reason).toBe('none')
  })

  it('selectTab updates the model and records imperative-action details', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    expect(t.selectTab('b')).toBe(true)
    expect(t.modelValue.value).toBe('b')
    expect(t.lastChangeDetails.value.reason).toBe('imperative-action')
    // Unchanged → false, no new details.
    expect(t.selectTab('b')).toBe(false)
  })

  it('ref-owned mode: writes through an externally-owned model ref', () => {
    const model = ref<string | undefined>('a')
    const t = useTabs({ modelValue: model, baseId: 'x' })
    expect(t.isControlled.value).toBe(true)
    t.selectTab('b')
    expect(model.value).toBe('b')
    expect(t.modelValue.value).toBe('b')
  })

  it('controlled getter + emit: emits beforeUpdate/update with details and does not write locally', () => {
    const emit = vi.fn()
    const t = useTabs({ modelValue: () => 'a', emit, baseId: 'x' })
    expect(t.isControlled.value).toBe(true)
    t.selectTab('b')
    expect(t.modelValue.value).toBe('a')
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', 'b', expect.objectContaining({ reason: 'imperative-action' }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', 'b', expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('cancel in onBeforeUpdate leaves the selection unchanged', () => {
    const onUpdate = vi.fn()
    const t = useTabs({
      defaultValue: 'a',
      baseId: 'x',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    expect(t.selectTab('b')).toBe(false)
    expect(t.modelValue.value).toBe('a')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(t.lastChangeDetails.value.isCanceled).toBe(true)
  })

  it('two standalone calls without a baseId get different ids', () => {
    const a = useTabs()
    const b = useTabs()
    expect(a.context.baseId).toMatch(/^reka-tabs-\d+$/)
    expect(b.context.baseId).toMatch(/^reka-tabs-\d+$/)
    expect(a.context.baseId).not.toBe(b.context.baseId)
    expect(a.getTriggerSurface('t').props.value.id).not.toBe(b.getTriggerSurface('t').props.value.id)
  })
})

describe('useTabs — trigger surface', () => {
  it('builds id/role/aria from (baseId, value) with NO data-*', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    const trig = t.getTriggerSurface('a')
    expect(trig.props.value.id).toBe(makeTriggerId('x', 'a'))
    expect(trig.props.value.role).toBe('tab')
    expect(trig.props.value['aria-selected']).toBe('true')
    expect(noDataAttrs(trig.props.value)).toBe(true)
  })

  it('attrs merges props with the data-* derived from state', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x', orientation: 'vertical' })
    const trig = t.getTriggerSurface('a', () => true)
    expect(trig.attrs.value).toMatchObject({
      'id': makeTriggerId('x', 'a'),
      'role': 'tab',
      'aria-selected': 'true',
      'data-state': 'checked',
      'data-disabled': '',
      'data-orientation': 'vertical',
    })
    expect(typeof trig.attrs.value.onMousedown).toBe('function')
  })

  it('omits aria-controls until the matching content registers', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    const trig = t.getTriggerSurface('a')
    expect(trig.props.value['aria-controls']).toBeUndefined()
    t.registerContent('a')
    expect(trig.props.value['aria-controls']).toBe(makeContentId('x', 'a'))
  })

  it('carries semantic state (active/inactive, disabled, orientation)', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x', orientation: 'vertical' })
    const trig = t.getTriggerSurface('b', () => true)
    expect(trig.state.value).toEqual({ state: 'unchecked', disabled: true, orientation: 'vertical' })
    t.selectTab('b')
    expect(trig.state.value.state).toBe('checked')
  })

  it('a reactive value passed as a getter keeps id and state live', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    const value = ref('a')
    const trig = t.getTriggerSurface(() => value.value)
    expect(trig.props.value.id).toBe(makeTriggerId('x', 'a'))
    expect(trig.state.value.state).toBe('checked')
    value.value = 'b'
    expect(trig.props.value.id).toBe(makeTriggerId('x', 'b'))
    expect(trig.props.value['aria-selected']).toBe('false')
    expect(trig.state.value.state).toBe('unchecked')
    expect(trig.attrs.value['data-state']).toBe('unchecked')
  })

  it('onMousedown (left) selects the tab; right button and ctrl+click do not', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    const trig = t.getTriggerSurface('b')
    trig.props.value.onMousedown(new MouseEvent('mousedown', { button: 2 }))
    expect(t.modelValue.value).toBe('a')
    trig.props.value.onMousedown(new MouseEvent('mousedown', { button: 0, ctrlKey: true }))
    expect(t.modelValue.value).toBe('a')
    trig.props.value.onMousedown(new MouseEvent('mousedown', { button: 0 }))
    expect(t.modelValue.value).toBe('b')
  })

  it('onMousedown reports reason trigger-press with the original event to onUpdate', () => {
    const onUpdate = vi.fn()
    const t = useTabs({ defaultValue: 'a', baseId: 'x', onUpdate })
    const event = new MouseEvent('mousedown', { button: 0 })
    t.getTriggerSurface('b').props.value.onMousedown(event)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'trigger-press', event, isCanceled: false }))
    expect(t.lastChangeDetails.value.reason).toBe('trigger-press')
  })

  it('onMousedown: a cancelled trigger-press prevents default so the browser does not move focus', () => {
    // Without preventDefault the browser focuses the trigger and, in automatic
    // activation, `onFocus` would re-attempt the change as `trigger-focus`.
    const onUpdate = vi.fn()
    const t = useTabs({
      defaultValue: 'a',
      baseId: 'x',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    const event = new MouseEvent('mousedown', { button: 0, cancelable: true })
    t.getTriggerSurface('b').props.value.onMousedown(event)
    expect(event.defaultPrevented).toBe(true)
    expect(t.modelValue.value).toBe('a')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(t.lastChangeDetails.value).toMatchObject({ reason: 'trigger-press', isCanceled: true })
  })

  it('onMousedown on the already-selected trigger attempts no change and keeps the default (focus)', () => {
    const onBeforeUpdate = vi.fn()
    const t = useTabs({ defaultValue: 'a', baseId: 'x', onBeforeUpdate })
    const event = new MouseEvent('mousedown', { button: 0, cancelable: true })
    t.getTriggerSurface('a').props.value.onMousedown(event)
    expect(event.defaultPrevented).toBe(false)
    expect(onBeforeUpdate).not.toHaveBeenCalled()
    expect(t.modelValue.value).toBe('a')
  })

  it('onMousedown does not select a disabled trigger', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    const trig = t.getTriggerSurface('b', true)
    trig.props.value.onMousedown(new MouseEvent('mousedown', { button: 0 }))
    expect(t.modelValue.value).toBe('a')
  })

  it('onKeydown selects on Enter and Space with reason trigger-keydown', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    const trig = t.getTriggerSurface('b')
    trig.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(t.modelValue.value).toBe('b')
    expect(t.lastChangeDetails.value.reason).toBe('trigger-keydown')
    t.selectTab('a')
    trig.props.value.onKeydown(new KeyboardEvent('keydown', { key: ' ' }))
    expect(t.modelValue.value).toBe('b')
  })

  it('onFocus activates in automatic mode (reason trigger-focus) but not in manual mode', () => {
    const auto = useTabs({ defaultValue: 'a', baseId: 'x' })
    auto.getTriggerSurface('b').props.value.onFocus()
    expect(auto.modelValue.value).toBe('b')
    expect(auto.lastChangeDetails.value.reason).toBe('trigger-focus')

    const manual = useTabs({ defaultValue: 'a', baseId: 'x', activationMode: 'manual' })
    manual.getTriggerSurface('b').props.value.onFocus()
    expect(manual.modelValue.value).toBe('a')
  })
})

describe('useTabs — content, root & list surfaces', () => {
  it('content surface: id/role/aria-labelledby/tabindex + state, no data-*', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    const content = t.getContentSurface('a')
    expect(content.props.value).toMatchObject({
      'id': makeContentId('x', 'a'),
      'role': 'tabpanel',
      'aria-labelledby': makeTriggerId('x', 'a'),
      'tabindex': 0,
    })
    expect(noDataAttrs(content.props.value)).toBe(true)
    expect(content.state.value.state).toBe('checked')
    expect(content.attrs.value['data-state']).toBe('checked')
    expect(content.attrs.value['data-orientation']).toBe('horizontal')
  })

  it('root surface carries dir + orientation state', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x', dir: 'rtl', orientation: 'vertical' })
    expect(t.root.props.value.dir).toBe('rtl')
    expect(t.root.state.value).toEqual({ orientation: 'vertical' })
    expect(t.root.attrs.value).toEqual({ 'dir': 'rtl', 'data-orientation': 'vertical' })
  })

  it('list surface is a tablist with aria-orientation', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x', orientation: 'vertical' })
    expect(t.list.props.value).toEqual({ 'role': 'tablist', 'aria-orientation': 'vertical' })
    expect(t.list.attrs.value).toEqual({ 'role': 'tablist', 'aria-orientation': 'vertical' })
  })
})

describe('useTabs — context', () => {
  it('exposes a frozen-shape context with registration + control', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    expect(t.context.baseId).toBe('x')
    expect(typeof t.context.changeModelValue).toBe('function')
    expect(typeof t.context.registerContent).toBe('function')
    expect(typeof t.context.unregisterContent).toBe('function')
    t.context.registerContent('a')
    expect(t.context.contentIds.value.has('a')).toBe(true)
    t.context.unregisterContent('a')
    expect(t.context.contentIds.value.has('a')).toBe(false)
    expect(t.context.changeModelValue('b')).toBe(true)
    expect(t.modelValue.value).toBe('b')
    // Unchanged → false, so a trigger can tell "nothing to do" from "cancelled".
    expect(t.context.changeModelValue('b')).toBe(false)
  })
})

describe('useTabs — public export', () => {
  it('is exported from the package barrel; the surface builders are internal', () => {
    expect(typeof Reka.useTabs).toBe('function')
    expect('getTabsTriggerSurface' in Reka).toBe(false)
    expect('getTabsContentSurface' in Reka).toBe(false)
  })
})
