import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import { AutocompleteEmpty, AutocompleteInput, AutocompleteRoot } from '@/Autocomplete'
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport } from '.'

describe.each([
  { name: 'ComboboxEmpty', Root: ComboboxRoot, Input: ComboboxInput, Empty: ComboboxEmpty },
  { name: 'AutocompleteEmpty', Root: AutocompleteRoot, Input: AutocompleteInput, Empty: AutocompleteEmpty },
])('given $name', ({ Root, Input, Empty }) => {
  let wrapper: VueWrapper

  afterEach(() => {
    wrapper?.unmount()
  })

  function mountEmpty({ initialOptions = ['Apple', 'Banana', 'Cherry'], ignoreFilter = false, asChild = false } = {}) {
    const options = ref(initialOptions)
    const onUpdateModelValue = vi.fn()
    wrapper = mount(defineComponent({
      setup: () => () => h(Root, {
        'defaultOpen': true,
        ignoreFilter,
        'onUpdate:modelValue': onUpdateModelValue,
      }, () => [
        h(ComboboxAnchor, null, () => h(Input, { 'aria-label': 'Fruit' })),
        h(ComboboxContent, { 'aria-label': 'Fruit suggestions' }, () => h(ComboboxViewport, null, () => [
          h(Empty, { asChild }, asChild ? () => h('p', 'Nothing found') : undefined),
          ...options.value.map(value => h(ComboboxItem, { key: value, value }, () => value)),
        ])),
      ]),
    }), { attachTo: document.body })
    return { options, onUpdateModelValue }
  }

  it('should keep an accessible empty option when filtering removes every match', async () => {
    mountEmpty()
    await flushPromises()
    expect(wrapper.findAll('[role="option"]')).toHaveLength(3)
    expect(wrapper.find('[aria-disabled="true"]').exists()).toBe(false)
    expect(await axe(wrapper.element)).toHaveNoViolations()

    await wrapper.get('input').setValue('zzz')
    await flushPromises()
    expect(await axe(wrapper.element)).toHaveNoViolations()

    const empty = wrapper.get('[role="option"]')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    expect(empty.text()).toBe('No options')
    expect(empty.attributes('aria-disabled')).toBe('true')

    await wrapper.get('input').setValue('App')
    await flushPromises()

    expect(wrapper.get('[role="option"]').text()).toBe('Apple')
    expect(wrapper.get('[role="option"]').attributes('aria-disabled')).not.toBe('true')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it.each([false, true])('should pass axe with no initial options and ignoreFilter=%s', async (ignoreFilter) => {
    mountEmpty({ initialOptions: [], ignoreFilter })
    await flushPromises()

    expect(wrapper.get('[role="option"]').text()).toBe('No options')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should remain accessible when externally filtered options become empty', async () => {
    const { options } = mountEmpty({ ignoreFilter: true })
    await flushPromises()

    options.value = []
    await flushPromises()

    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    expect(wrapper.get('[role="option"]').text()).toBe('No options')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should not highlight or select the empty option', async () => {
    const { onUpdateModelValue } = mountEmpty()
    await flushPromises()
    const input = wrapper.get('input')
    await input.setValue('zzz')
    await flushPromises()
    onUpdateModelValue.mockClear()

    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter']) {
      await input.trigger('keydown', { key })
    }
    await wrapper.get('[role="option"]').trigger('click')
    await flushPromises()

    expect(onUpdateModelValue).not.toHaveBeenCalled()
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[role="option"]').attributes('data-highlighted')).toBeUndefined()
  })

  it('should preserve empty option semantics when rendered as a child', async () => {
    mountEmpty({ initialOptions: [], asChild: true })
    await flushPromises()

    const empty = wrapper.get('p[role="option"]')
    expect(empty.text()).toBe('Nothing found')
    expect(empty.attributes('aria-disabled')).toBe('true')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})
