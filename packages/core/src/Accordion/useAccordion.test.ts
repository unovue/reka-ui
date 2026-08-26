import { describe, expect, it } from 'vitest'
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

    item.content.props.value.onContentFound()

    expect(accordion.modelValue.value).toBe('one')
  })
})
