// `ComboboxValue` inside a trigger, with the input inside the content (a
// searchable select): the trigger is the only control outside the popup, so it
// has to take Tab and to be named by the selected value.
import { mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxValue, ComboboxViewport, createComboboxItems } from '.'

const countries = [{ code: 'us', name: 'United States' }, { code: 'de', name: 'Germany' }]
const items = createComboboxItems(countries, { getValue: country => country.code, getLabel: country => country.name })

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

it('opens, searches and selects by keyboard from a trigger named by the selected value', async () => {
  const model = ref<string | null>('us')
  const wrapper = mount(defineComponent({
    setup: () => () => h(ComboboxRoot, {
      'modelValue': model.value,
      'onUpdate:modelValue': (value: any) => { model.value = value },
      items,
    }, () => [
      h(ComboboxTrigger, { 'tabindex': '0', 'aria-label': undefined }, () => h(ComboboxValue, { placeholder: 'Select a country' })),
      h(ComboboxPortal, () => h(ComboboxContent, () => [
        h(ComboboxInput, { 'aria-label': 'Search countries', 'displayValue': () => '' }),
        h(ComboboxViewport, () => countries.map(country => h(ComboboxItem, { key: country.code, value: country.code }, () => country.name))),
      ])),
    ]),
  }), { attachTo: document.body })
  unmount = () => wrapper.unmount()

  await userEvent.keyboard('{Tab}')
  const trigger = document.querySelector('button')!
  expect(document.activeElement).toBe(trigger)
  // No `aria-label` over the content: the selected value names the trigger.
  await expect.element(page.getByRole('button', { name: 'United States' })).toBeInTheDocument()

  await userEvent.keyboard('{Enter}')
  await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('combobox')
  expect((document.activeElement as HTMLInputElement).value).toBe('')

  await userEvent.keyboard('ger')
  await expect.poll(() => Array.from(document.querySelectorAll('[role=option]')).map(el => [el.textContent, el.hasAttribute('data-highlighted')])).toEqual([['Germany', true]])
  await userEvent.keyboard('{Enter}')
  await expect.poll(() => model.value).toBe('de')
  await expect.poll(() => trigger.textContent).toBe('Germany')
  // Closing returns focus to the trigger.
  await expect.poll(() => document.activeElement).toBe(trigger)
})
