import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

function mountSelect(initiallyDisabled: boolean) {
  document.body.innerHTML = ''
  const disabled = ref(initiallyDisabled)
  const modelValue = ref('apple')
  const Fixture = defineComponent({
    setup() {
      return () => h('form', [
        h(SelectRoot, {
          'name': 'fruit',
          'disabled': disabled.value,
          'modelValue': modelValue.value,
          'onUpdate:modelValue': (value: string) => modelValue.value = value,
        }, () => [
          h(SelectTrigger, { 'data-testid': 'trigger' }, () => h(SelectValue)),
          h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () =>
            h(SelectViewport, () => ['apple', 'orange'].map(value =>
              h(SelectItem, { value, 'data-testid': value }, () => h(SelectItemText, () => value)),
            )))),
        ]),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return {
    disabled,
    modelValue,
    get: (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`),
    formEntries: () => Array.from(new FormData(document.querySelector('form')!).entries()),
  }
}

describe('given a Select whose root is disabled, in a real browser', () => {
  // A browser leaves a selected `<option disabled>` out of the form data; jsdom does not, so only this catches it.
  it('submits its value once enabled, without ever being opened', async () => {
    const { disabled, formEntries } = mountSelect(true)
    await expect.poll(() => document.querySelector('select option[value="apple"]')).not.toBeNull()
    expect(formEntries()).toEqual([])

    disabled.value = false

    await expect.poll(() => document.querySelector('select')?.disabled).toBe(false)
    expect(document.querySelector<HTMLOptionElement>('select option[value="apple"]')?.disabled).toBe(false)
    expect(formEntries()).toEqual([['fruit', 'apple']])
  })

  it('blocks selection when disabled while open, and selects again once enabled', async () => {
    const { disabled, modelValue, get } = mountSelect(false)

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('orange')).not.toBeNull()

    disabled.value = true
    await expect.poll(() => get('orange')?.getAttribute('aria-disabled')).toBe('true')
    expect(get('orange')?.hasAttribute('data-disabled')).toBe(true)

    // `force` skips the actionability check, which would otherwise wait on the `aria-disabled` item.
    await userEvent.click(get('orange')!, { force: true })
    await userEvent.keyboard('{Enter}')
    expect(modelValue.value).toBe('apple')
    expect(get('orange')).not.toBeNull()

    disabled.value = false
    await expect.poll(() => get('orange')?.getAttribute('aria-disabled')).toBeNull()
    await userEvent.click(get('orange')!)
    await expect.poll(() => modelValue.value).toBe('orange')
  })
})
