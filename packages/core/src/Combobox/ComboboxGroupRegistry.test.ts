import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from '.'

// #3291: a removed item must not keep its group visible. v3 has no group id
// registry: each filter pass reads the groups from the items mounted right now.
describe('given a ComboboxGroup whose items change', () => {
  it('should hide the group when only removed items would match the search', async () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    const items = ref(['apple', 'avocado'])
    const wrapper = mount(defineComponent({
      setup: () => () => h(ComboboxRoot, { defaultOpen: true }, () => [
        h(ComboboxInput, { 'aria-label': 'Fruit' }),
        h(ComboboxPortal, null, () => h(ComboboxContent, null, () => h(ComboboxViewport, null, () => h(ComboboxGroup, null, () =>
          items.value.map(value => h(ComboboxItem, { key: value, value }, () => value)))))),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    await nextTick()

    const group = () => document.querySelector<HTMLElement>('[role=group]')!
    expect(group().hidden).toBe(false)

    items.value = ['cherry']
    await nextTick()
    await nextTick()

    await wrapper.find('input').setValue('a')
    await nextTick()
    expect(group().hidden).toBe(true)

    await wrapper.find('input').setValue('ch')
    await nextTick()
    expect(group().hidden).toBe(false)
    wrapper.unmount()
  })
})
