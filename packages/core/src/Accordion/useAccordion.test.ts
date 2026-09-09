import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useAccordion } from './useAccordion'

describe('useAccordion — state', () => {
  it('defaults to an unselected single accordion', () => {
    const accordion = useAccordion()

    expect(accordion.modelValue.value).toBeUndefined()
    expect(accordion.isSingle.value).toBe(true)
  })

  it('toggles a single selected value', () => {
    const accordion = useAccordion({ type: 'single' })

    accordion.changeModelValue('one')
    expect(accordion.modelValue.value).toBe('one')

    accordion.changeModelValue('one')
    expect(accordion.modelValue.value).toBeUndefined()
  })

  it('toggles values independently in a multiple accordion', () => {
    const accordion = useAccordion({ type: 'multiple' })

    expect(accordion.modelValue.value).toEqual([])
    accordion.changeModelValue('one')
    accordion.changeModelValue('two')
    expect(accordion.modelValue.value).toEqual(['one', 'two'])

    accordion.changeModelValue('one')
    expect(accordion.modelValue.value).toEqual(['two'])
  })

  it('preserves an existing scalar when explicit multiple mode normalizes it', () => {
    const accordion = useAccordion({ defaultValue: 'one', type: 'multiple' })

    accordion.changeModelValue('two')

    expect(accordion.modelValue.value).toEqual(['one', 'two'])
  })

  it('keeps inferred single/multiple mode reactive to an external model', () => {
    const modelValue = ref<string | string[] | undefined>('one')
    const accordion = useAccordion({ modelValue })

    expect(accordion.isSingle.value).toBe(true)
    modelValue.value = ['one']
    expect(accordion.isSingle.value).toBe(false)
  })

  it('writes back to a standalone model ref, including one initially undefined', () => {
    const modelValue = ref<string | string[]>()
    const accordion = useAccordion({ modelValue })

    expect(accordion.changeModelValue('one')).toBe(true)
    expect(modelValue.value).toBe('one')
    expect(accordion.lastChangeDetails.value.reason).toBe('imperative-action')
  })

  it('waits for the parent to accept controlled changes and stays controlled when cleared', () => {
    const modelValue = ref<string | string[] | undefined>('one')
    const onUpdate = vi.fn()
    const accordion = useAccordion({ modelValue: () => modelValue.value, defaultValue: 'fallback', onUpdate })

    accordion.changeModelValue('two')
    expect(modelValue.value).toBe('one')
    expect(accordion.modelValue.value).toBe('one')
    expect(onUpdate).toHaveBeenCalledWith('two', expect.objectContaining({ reason: 'imperative-action' }))
    modelValue.value = 'two'
    expect(accordion.modelValue.value).toBe('two')
    modelValue.value = undefined
    expect(accordion.modelValue.value).toBeUndefined()
    expect(accordion.isControlled.value).toBe(true)
  })

  it.each(['single', 'multiple'] as const)('cancels %s changes before mutating or notifying', (type) => {
    const onUpdate = vi.fn()
    const accordion = useAccordion({ type, onBeforeUpdate: (_, details) => details.cancel(), onUpdate })
    const initial = accordion.modelValue.value

    expect(accordion.changeModelValue('one')).toBe(false)
    expect(accordion.modelValue.value).toBe(initial)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(accordion.lastChangeDetails.value.isCanceled).toBe(true)
  })

  it('emits before and after a trigger change with the same native event details', () => {
    const emit = vi.fn()
    const accordion = useAccordion({ emit })
    const event = new MouseEvent('click')

    accordion.getItemSurface('one').trigger.attrs.value.onClick(event)

    expect(emit.mock.calls.map(call => call[0])).toEqual(['beforeUpdate:modelValue', 'update:modelValue'])
    expect(emit.mock.calls[0][1]).toBe('one')
    expect(emit.mock.calls[0][2]).toBe(emit.mock.calls[1][2])
    expect(accordion.lastChangeDetails.value).toMatchObject({ reason: 'trigger-press', event, isCanceled: false })
  })
})

describe('useAccordion — root context', () => {
  it('exposes resolved reactive root options to part builders', () => {
    const disabled = ref(false)
    const accordion = useAccordion({
      collapsible: true,
      dir: 'rtl',
      disabled,
      orientation: 'horizontal',
      unmountOnHide: false,
    })

    expect(accordion.context.direction.value).toBe('rtl')
    expect(accordion.context.orientation).toBe('horizontal')
    expect(accordion.context.collapsible).toBe(true)
    expect(accordion.context.unmountOnHide.value).toBe(false)
    expect(accordion.context.disabled.value).toBe(false)

    disabled.value = true
    expect(accordion.context.disabled.value).toBe(true)
  })

  it('keeps semantic orientation reactive after item surfaces are created', () => {
    const orientation = ref<'horizontal' | 'vertical'>('vertical')
    const accordion = useAccordion({ orientation })
    const item = accordion.getItemSurface('one')

    expect(item.item.state.value.orientation).toBe('vertical')
    orientation.value = 'horizontal'
    expect(item.item.state.value.orientation).toBe('horizontal')
  })

  it('keeps the active-item collapse guard reactive', () => {
    const collapsible = ref(false)
    const accordion = useAccordion({ collapsible, defaultValue: 'one' })
    const trigger = accordion.getItemSurface('one').trigger

    trigger.props.value.onClick()
    expect(accordion.modelValue.value).toBe('one')

    collapsible.value = true
    trigger.props.value.onClick()
    expect(accordion.modelValue.value).toBeUndefined()
  })
})

describe('useAccordion — item surface', () => {
  it('derives wrapper props and semantic state from root context and item value', () => {
    const accordion = useAccordion({
      defaultValue: 'one',
      orientation: 'horizontal',
    })
    const item = accordion.getItemSurface('one')

    expect(item.open.value).toBe(true)
    expect(item.disabled.value).toBe(false)
    expect(item.item.props.value).toMatchObject({
      disabled: false,
      open: true,
      unmountOnHide: true,
    })
    expect(Object.keys(item.item.props.value).some(key => key.startsWith('data-'))).toBe(false)
    expect(item.item.state.value).toEqual({
      state: 'open',
      disabled: false,
      orientation: 'horizontal',
    })
  })

  it('moves focus between collection triggers on arrow keys', () => {
    const parentElement = document.createElement('div')
    const first = document.createElement('button')
    const second = document.createElement('button')
    first.setAttribute('data-reka-collection-item', '')
    second.setAttribute('data-reka-collection-item', '')
    parentElement.append(first, second)
    document.body.append(parentElement)

    const accordion = useAccordion({ parentElement: ref(parentElement) })
    const item = accordion.getItemSurface('one')
    first.addEventListener('keydown', item.item.props.value.onKeydown)
    first.focus()
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

    expect(document.activeElement).toBe(second)
    parentElement.remove()
  })

  it('builds trigger aria, functional selectors, and semantic state without data attributes in props', () => {
    const accordion = useAccordion({ defaultValue: 'one' })
    const item = accordion.getItemSurface('one', { triggerId: 'trigger-one' })

    expect(item.trigger.props.value).toMatchObject({
      'id': 'trigger-one',
      'aria-disabled': undefined,
      'aria-expanded': true,
      'data-reka-collection-item': '',
      'disabled': false,
    })
    expect(Object.keys(item.trigger.props.value).filter(key => key.startsWith('data-'))).toEqual(['data-reka-collection-item'])
    expect(item.trigger.state.value).toEqual({
      state: 'open',
      disabled: false,
      orientation: 'vertical',
    })
  })

  it('builds non-empty reactive trigger/content ids for standalone use', () => {
    const value = ref('one')
    const accordion = useAccordion({ baseId: 'reka-accordion' })
    const item = accordion.getItemSurface(value)

    expect(item.trigger.props.value.id).toBe('reka-accordion-trigger-one')
    expect(item.content.props.value['aria-labelledby']).toBe('reka-accordion-trigger-one')

    value.value = 'two'
    expect(item.trigger.props.value.id).toBe('reka-accordion-trigger-two')
    expect(item.content.props.value['aria-labelledby']).toBe('reka-accordion-trigger-two')
  })

  it('keeps an active single item open unless the root is collapsible', () => {
    const locked = useAccordion({ defaultValue: 'one' })
    locked.getItemSurface('one').trigger.props.value.onClick()
    expect(locked.modelValue.value).toBe('one')

    const collapsible = useAccordion({ collapsible: true, defaultValue: 'one' })
    collapsible.getItemSurface('one').trigger.props.value.onClick()
    expect(collapsible.modelValue.value).toBeUndefined()
  })

  it('builds header and content surfaces from the same item state', () => {
    const accordion = useAccordion({ defaultValue: 'one', orientation: 'horizontal' })
    const item = accordion.getItemSurface('one', { triggerId: 'trigger-one' })

    expect(item.header.props.value).toEqual({})
    expect(item.header.state).toBe(item.item.state)
    expect(item.content.props.value).toMatchObject({
      'role': 'region',
      'aria-labelledby': 'trigger-one',
    })
    expect(item.content.props.value.style).toContain('--reka-accordion-content-width')
    expect(item.content.state).toBe(item.item.state)
  })

  it('opens an item when hidden content is found by the browser', () => {
    const accordion = useAccordion()
    const item = accordion.getItemSurface('one')

    const event = new Event('beforematch')
    item.content.attrs.value.onContentFound(event)

    expect(accordion.modelValue.value).toBe('one')
    expect(accordion.lastChangeDetails.value).toMatchObject({ reason: 'content-found', event })
  })
})

describe('useAccordion — attrs', () => {
  it('keeps all four bound parts reactive to disclosure, disabled, and orientation', () => {
    const disabled = ref(false)
    const orientation = ref<'horizontal' | 'vertical'>('vertical')
    const accordion = useAccordion({ disabled, orientation })
    const { item, header, trigger, content } = accordion.getItemSurface('one')

    for (const part of [item, header, trigger, content]) {
      expect(part.attrs.value).toMatchObject({ 'data-state': 'closed', 'data-orientation': 'vertical' })
      expect(part.attrs.value['data-disabled']).toBeUndefined()
    }
    trigger.attrs.value.onClick()
    disabled.value = true
    orientation.value = 'horizontal'
    for (const part of [item, header, trigger, content])
      expect(part.attrs.value).toMatchObject({ 'data-state': 'open', 'data-disabled': '', 'data-orientation': 'horizontal' })
    expect(trigger.attrs.value['aria-expanded']).toBe(true)
    expect(trigger.attrs.value.onClick).toBe(trigger.props.value.onClick)
  })

  it('allocates distinct ids for standalone roots and tracks explicit trigger overrides', () => {
    const first = useAccordion().getItemSurface('one')
    const second = useAccordion().getItemSurface('one')
    expect(first.trigger.attrs.value.id).not.toBe(second.trigger.attrs.value.id)
    expect(first.content.attrs.value['aria-labelledby']).toBe(first.trigger.attrs.value.id)

    const triggerId = ref('custom-one')
    const item = useAccordion().getItemSurface('one', { triggerId })
    expect(item.content.attrs.value['aria-labelledby']).toBe('custom-one')
    triggerId.value = 'custom-two'
    expect(item.trigger.attrs.value.id).toBe('custom-two')
    expect(item.content.attrs.value['aria-labelledby']).toBe('custom-two')
  })
})
