import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { TabsList, TabsRoot, TabsTrigger } from '.'

// Optimisation-pinning: a tab change re-renders the old and the new trigger
// only (a keyed selector over `modelValue`), not every trigger.
describe('tabs render counts', () => {
  it('re-renders only the old and the new trigger on a tab change', async () => {
    const count = 20
    const renders: number[] = Array.from<number>({ length: count }).fill(0)
    // The triggers live in their own component: `TabsRoot` re-runs its slot on
    // a change (it passes `modelValue` as a slot prop), which must not reach
    // the triggers through their parent.
    const Triggers = defineComponent({
      setup: () => () => h(TabsList, null, () => Array.from({ length: count }, (_: unknown, i: number) =>
        h(TabsTrigger, { key: i, value: `tab-${i}` }, () => {
          renders[i]++
          return `Tab ${i}`
        }))),
    })
    const wrapper = mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: 'tab-2' }, () => h(Triggers)),
    }), { attachTo: document.body })
    await nextTick()
    renders.fill(0)

    await wrapper.findAll('[role=tab]')[11].trigger('mousedown', { button: 0 })
    await nextTick()
    expect(wrapper.find('[aria-selected=true]').text()).toBe('Tab 11')
    expect(renders.flatMap((n, i) => n ? [i] : [])).toEqual([2, 11])
    wrapper.unmount()
  })
})
