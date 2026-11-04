import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CheckboxGroupRoot, CheckboxRoot } from '@/Checkbox'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { FieldRoot } from '.'

// Chromium fires `focusout` for a focused element removed from the document,
// so a group's own `focusout` handling already blurs the field when its
// focused item unmounts. jsdom doesn't, which is why this runs in a browser.
const groups: Array<[string, Component, Component, Record<string, unknown>]> = [
  ['RadioGroup', RadioGroupRoot, RadioGroupItem, {}],
  ['ToggleGroup', ToggleGroupRoot, ToggleGroupItem, { type: 'single' }],
  ['CheckboxGroup', CheckboxGroupRoot, CheckboxRoot, {}],
]

describe.each(groups)('a Field-wrapped %s whose focused item is removed', (_, Root, Item, rootProps) => {
  let wrapper: ReturnType<typeof mount> | undefined
  const focusouts: Array<EventTarget | null> = []
  const recordFocusout = (event: FocusEvent) => focusouts.push(event.target)
  beforeEach(() => {
    focusouts.length = 0
    document.addEventListener('focusout', recordFocusout, true)
  })
  afterEach(() => {
    document.removeEventListener('focusout', recordFocusout, true)
    wrapper?.unmount()
    wrapper = undefined
  })

  it('is no longer focused, and is touched, while the group stays mounted', async () => {
    const items = ref(['a', 'b', 'c'])
    wrapper = mount(defineComponent(() => () =>
      h(FieldRoot, { 'name': 'choice', 'data-testid': 'field' }, () =>
        h(Root, rootProps, () => items.value.map(value =>
          h(Item, { 'key': value, value, 'data-testid': `item-${value}` }, () => value))))), { attachTo: document.body })
    const field = () => document.querySelector('[data-testid="field"]')!

    const item = document.querySelector<HTMLElement>('[data-testid="item-b"]')!
    await userEvent.click(item)
    await expect.poll(() => document.activeElement).toBe(item)
    expect(field().hasAttribute('data-focused')).toBe(true)

    items.value = ['a', 'c']
    await nextTick()
    await nextTick()
    expect(item.isConnected).toBe(false)
    expect(document.activeElement).toBe(document.body)
    // The browser reported the removal.
    expect(focusouts).toContain(item)
    expect(field().hasAttribute('data-focused')).toBe(false)
    expect(field().hasAttribute('data-touched')).toBe(true)
  })
})
