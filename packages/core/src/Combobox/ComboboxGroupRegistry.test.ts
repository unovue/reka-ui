import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxContent, ComboboxGroup, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from '.'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

describe('given a ComboboxGroup whose items change', () => {
  it('should not keep the ids of removed items in the group', async () => {
    const items = ref(['a', 'b'])
    let rootContext!: ReturnType<typeof injectComboboxRootContext>
    const Probe = defineComponent({
      setup() {
        rootContext = injectComboboxRootContext()
        return () => null
      },
    })

    const wrapper = mount(defineComponent({
      setup: () => () => h(ComboboxRoot, { defaultOpen: true }, () => [
        h(Probe),
        h(ComboboxPortal, null, () => h(ComboboxContent, null, () => h(ComboboxViewport, null, () => h(ComboboxGroup, null, () =>
          items.value.map(value => h(ComboboxItem, { key: value, value }, () => value)))))),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    await nextTick()

    const groupIds = () => [...rootContext.allGroups.value.values()].flatMap(ids => [...ids])
    expect(groupIds()).toHaveLength(2)

    items.value = ['c']
    await nextTick()
    await nextTick()

    expect(rootContext.allItems.value.size).toBe(1)
    expect(groupIds()).toHaveLength(1)
    wrapper.unmount()
  })
})
