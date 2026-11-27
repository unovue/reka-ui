import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { computed, defineComponent, h, nextTick, ref } from 'vue'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompleteRoot, AutocompleteViewport } from '@/Autocomplete'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport } from '.'

const options = ['Apple', 'Banana', 'Cherry']

async function settle() {
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))
  await nextTick()
}

function mountInputOwnedListbox(kind: 'combobox' | 'autocomplete') {
  const selected = ref<string | string[]>(kind === 'combobox' ? [] : '')
  const shown = computed(() => {
    const values = Array.isArray(selected.value) ? selected.value : [selected.value]
    return options.filter(option => !values.includes(option))
  })

  const Fixture = defineComponent({
    setup() {
      const input = kind === 'combobox'
        ? h(ComboboxInput, { 'data-testid': 'input' })
        : h(AutocompleteInput, { 'data-testid': 'input' })
      const anchor = kind === 'combobox'
        ? h(ComboboxAnchor, null, () => input)
        : h(AutocompleteAnchor, null, () => input)
      const items = () => shown.value.map(option => kind === 'combobox'
        ? h(ComboboxItem, { key: option, value: option }, () => option)
        : h(AutocompleteItem, { key: option, value: option }, () => option))
      const content = kind === 'combobox'
        ? h(ComboboxContent, null, () => h(ComboboxViewport, null, items))
        : h(AutocompleteContent, null, () => h(AutocompleteViewport, null, items))

      return () => kind === 'combobox'
        ? h(ComboboxRoot, {
            'open': true,
            'filter': null,
            'multiple': true,
            'modelValue': selected.value,
            'onUpdate:modelValue': (value: unknown) => { selected.value = value as string[] },
          }, () => [anchor, content])
        : h(AutocompleteRoot, {
            'open': true,
            'filter': null,
            'modelValue': selected.value as string,
            'onUpdate:modelValue': (value: unknown) => { selected.value = value as string },
          }, () => [anchor, content])
    },
  })

  mount(Fixture, { attachTo: document.body })
  return { selected }
}

const input = () => document.querySelector<HTMLInputElement>('[data-testid="input"]')!
const highlighted = () => Array.from(document.querySelectorAll<HTMLElement>('[data-highlighted]'), element => element.textContent)

describe('given a filtered option selected through a shared Listbox wrapper', () => {
  it.each(['combobox', 'autocomplete'] as const)('keeps the %s input as the focus owner', async (kind) => {
    const { selected } = mountInputOwnedListbox(kind)
    await settle()
    await userEvent.click(input())
    await userEvent.fill(input(), 'a')
    await expect.poll(highlighted).toEqual(['Apple'])

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => selected.value).toEqual(kind === 'combobox' ? ['Apple'] : 'Apple')
    await expect.poll(() => document.activeElement).toBe(input())
    await expect.poll(() => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'), element => element.textContent)).not.toContain('Apple')
    expect(highlighted()).not.toContain('Apple')
  })
})
