// An object value mutated in place keeps its reference and its text, but its
// registry key changes (its serialized form without `by`, `value[by]` with a
// key `by`). The item skips unchanged re-registrations, so the skip has to
// compare (and track) the key, or `labels.get(value)` would miss.
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'
import { injectListboxRootContext } from './ListboxRoot.vue'

describe('label registry after an in-place value mutation', () => {
  it('still resolves the label of the mutated value', async () => {
    const items = reactive([{ id: 1, name: 'Apple', stock: 1 }, { id: 2, name: 'Banana', stock: 1 }])
    let ctx: ReturnType<typeof injectListboxRootContext> | undefined
    const Probe = defineComponent({
      setup() {
        ctx = injectListboxRootContext()
        return () => null
      },
    })
    mount(defineComponent({
      setup: () => () => h(ListboxRoot, null, {
        default: () => [
          h(Probe),
          h(ListboxContent, null, {
            default: () => items.map((item, index) => h(ListboxItem, { key: index, value: item }, { default: () => item.name })),
          }),
        ],
      }),
    }), { attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(ctx!.labels.get(items[0])).toBe('Apple')

    items[0].stock = 2 // in place: same reference, same text
    await nextTick()
    await nextTick()
    expect(ctx!.labels.get(items[0])).toBe('Apple')
  })

  it('by id: resolves the label after the key changes in place', async () => {
    const items = reactive([{ id: 1, name: 'Apple', stock: 1 }, { id: 2, name: 'Banana', stock: 1 }])
    let ctx: ReturnType<typeof injectListboxRootContext> | undefined
    const Probe = defineComponent({
      setup() {
        ctx = injectListboxRootContext()
        return () => null
      },
    })
    mount(defineComponent({
      setup: () => () => h(ListboxRoot, { by: 'id' }, {
        default: () => [
          h(Probe),
          h(ListboxContent, null, {
            default: () => items.map((item, index) => h(ListboxItem, { key: index, value: item }, { default: () => item.name })),
          }),
        ],
      }),
    }), { attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(ctx!.labels.get(items[0])).toBe('Apple')

    items[0].id = 3 // in place: same reference, same text, new `by` key
    await nextTick()
    await nextTick()
    expect(ctx!.labels.get(items[0])).toBe('Apple')
  })
})
