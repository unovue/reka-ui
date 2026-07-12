import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTabs } from './useTabs'
import { makeContentId, makeTriggerId } from './utils'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

describe('useTabs — state & selection', () => {
  it('defaults modelValue to the provided defaultValue', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    expect(t.modelValue.value).toBe('a')
  })

  it('selectTab updates the model', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    t.selectTab('b')
    expect(t.modelValue.value).toBe('b')
  })

  it('writes through an externally-owned model ref', () => {
    const model = ref<string | undefined>('a')
    const t = useTabs({ modelValue: model, baseId: 'x' })
    t.selectTab('b')
    expect(model.value).toBe('b')
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
    expect(trig.state.value).toEqual({ state: 'inactive', disabled: true, orientation: 'vertical' })
    t.selectTab('b')
    expect(trig.state.value.state).toBe('active')
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

  it('onMousedown does not select a disabled trigger', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    const trig = t.getTriggerSurface('b', true)
    trig.props.value.onMousedown(new MouseEvent('mousedown', { button: 0 }))
    expect(t.modelValue.value).toBe('a')
  })

  it('onKeydown selects on Enter and Space', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x' })
    const trig = t.getTriggerSurface('b')
    trig.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(t.modelValue.value).toBe('b')
    t.selectTab('a')
    trig.props.value.onKeydown(new KeyboardEvent('keydown', { key: ' ' }))
    expect(t.modelValue.value).toBe('b')
  })

  it('onFocus activates in automatic mode but not in manual mode', () => {
    const auto = useTabs({ defaultValue: 'a', baseId: 'x' })
    auto.getTriggerSurface('b').props.value.onFocus()
    expect(auto.modelValue.value).toBe('b')

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
    expect(content.state.value.state).toBe('active')
  })

  it('root surface carries dir + orientation state', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x', dir: 'rtl', orientation: 'vertical' })
    expect(t.root.props.value.dir).toBe('rtl')
    expect(t.root.state.value).toEqual({ orientation: 'vertical' })
  })

  it('list surface is a tablist with aria-orientation', () => {
    const t = useTabs({ defaultValue: 'a', baseId: 'x', orientation: 'vertical' })
    expect(t.list.props.value).toEqual({ 'role': 'tablist', 'aria-orientation': 'vertical' })
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
    t.context.changeModelValue('b')
    expect(t.modelValue.value).toBe('b')
  })
})
