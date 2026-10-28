import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import Child from './Child.vue'
import WrapperComputed from './WrapperComputed.vue'

it('consumer computed over `forwarded`: listener added after mount (wrapper DOES re-render)', async () => {
  const onSelect = vi.fn()
  const bound = ref(false)
  const Parent = defineComponent(() => () => h(WrapperComputed, { label: 'x', ...(bound.value ? { onSelect } : {}) }))
  const w = mount(Parent)
  bound.value = true
  await nextTick()
  ;(w.findComponent(Child).vm as any).emit('select', 1)
  expect(onSelect).toHaveBeenCalledWith(1)
})
