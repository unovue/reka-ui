// Regression (#3111 review): registering never serializes a value under `by`, in the families sharing the registry.
import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, shallowRef } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any
})

const make = () => [1, 2].map(id => ({ id, name: `N${id}`, blob: new Blob(['x']) }))

async function refetchErrors(render: (list: { value: ReturnType<typeof make> }) => unknown) {
  const list = shallowRef(make())
  const errors: unknown[] = []
  const wrapper = mount(defineComponent({ setup: () => () => render(list) }), {
    attachTo: document.body,
    global: { config: { errorHandler: error => errors.push(error) } },
  })
  await flushPromises()
  list.value = make()
  await flushPromises()
  wrapper.unmount()
  return errors
}

describe('a `Blob` field under `by`, refetched', () => {
  it('listbox raises nothing', async () => {
    expect(await refetchErrors(list => h(ListboxRoot, { by: 'id', modelValue: { id: 1 } } as any, () =>
      h(ListboxContent, () => list.value.map(o => h(ListboxItem, { key: o.id, value: o }, () => o.name)))))).toEqual([])
  })

  it('combobox raises nothing', async () => {
    expect(await refetchErrors(list => h(ComboboxRoot, { by: 'id', modelValue: { id: 1 }, open: true } as any, () => [
      h(ComboboxAnchor, () => h(ComboboxInput)),
      h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () => list.value.map(o => h(ComboboxItem, { key: o.id, value: o }, () => o.name))))),
    ]))).toEqual([])
  })
})
