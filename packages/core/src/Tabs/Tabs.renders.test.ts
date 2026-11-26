import type { App } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '.'

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

    await wrapper.findAll('[role=tab]')[11].trigger('click')
    await nextTick()
    expect(wrapper.find('[aria-selected=true]').text()).toBe('Tab 11')
    expect(renders.flatMap((n, i) => n ? [i] : [])).toEqual([2, 11])
    wrapper.unmount()
  })
})

// Optimisation-pinning: a tab change re-renders the parts of the tab that was left and of the tab
// that was entered, never every trigger and content of the list.

const COUNT = 1000
/** Components a single trigger or content is made of, with room for the list around them. */
const MAX_UPDATES = 20

function mountTabs(template: string) {
  const updates = { count: 0, names: new Map<string, number>(), created: 0 }
  const Fixture = defineComponent({
    components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
    setup() {
      const tabs = Array.from({ length: COUNT }, (_, index) => `tab-${index}`)
      return { tabs, value: ref('tab-0') }
    },
    template,
  })
  const wrapper = mount(Fixture, {
    attachTo: document.body,
    global: {
      plugins: [{
        install(app: App) {
          app.mixin({
            beforeCreate() {
              updates.created++
            },
            beforeUpdate() {
              updates.count++
              const name = this.$options.name ?? this.$options.__name ?? 'anonymous'
              updates.names.set(name, (updates.names.get(name) ?? 0) + 1)
            },
          })
        },
      }],
    },
  })
  return { wrapper, updates }
}

const UNCONTROLLED = `
<TabsRoot default-value="tab-0" activation-mode="automatic">
  <TabsList>
    <TabsTrigger v-for="tab in tabs" :key="tab" :value="tab">{{ tab }}</TabsTrigger>
  </TabsList>
  <TabsContent v-for="tab in tabs" :key="tab" :value="tab">Panel {{ tab }}</TabsContent>
</TabsRoot>`

describe('tabs render counts, parts in the root slot', () => {
  let unmount: (() => void) | undefined
  afterEach(() => {
    unmount?.()
    unmount = undefined
  })

  it(`re-renders only the tabs that changed when an arrow key moves through ${COUNT} tabs`, async () => {
    const { wrapper, updates } = mountTabs(UNCONTROLLED)
    unmount = () => wrapper.unmount()
    await nextTick()
    await nextTick()
    const triggers = wrapper.findAll('[role=tab]')
    expect(triggers).toHaveLength(COUNT)
    const first = triggers[0].element as HTMLElement
    first.focus()
    await nextTick()
    updates.count = 0
    updates.names.clear()

    await triggers[0].trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    await nextTick()

    expect(document.activeElement).toBe(triggers[1].element)
    expect(triggers[1].attributes('aria-selected')).toBe('true')
    expect(triggers[1].attributes('tabindex')).toBe('0')
    expect(triggers[0].attributes('aria-selected')).toBe('false')
    expect(triggers[0].attributes('tabindex')).toBe('-1')
    expect(updates.count, JSON.stringify([...updates.names])).toBeLessThanOrEqual(MAX_UPDATES)
  }, 30_000)

  it(`re-renders only the tabs that changed when one of ${COUNT} tabs is selected`, async () => {
    const { wrapper, updates } = mountTabs(UNCONTROLLED)
    unmount = () => wrapper.unmount()
    await nextTick()
    await nextTick()
    const triggers = wrapper.findAll('[role=tab]')
    updates.count = 0
    updates.names.clear()

    await triggers[500].trigger('click')
    await nextTick()

    expect(triggers[500].attributes('data-state')).toBe('checked')
    expect(triggers[0].attributes('data-state')).toBe('unchecked')
    // v3 renders the active panel only
    const panels = wrapper.findAll('[role=tabpanel]')
    expect(panels).toHaveLength(1)
    expect(panels[0].text()).toBe('Panel tab-500')
    expect(updates.count, JSON.stringify([...updates.names])).toBeLessThanOrEqual(MAX_UPDATES)
  }, 30_000)

  it('mounts a trigger as one component', async () => {
    const { wrapper, updates } = mountTabs(`
<TabsRoot default-value="tab-0">
  <TabsList>
    <TabsTrigger v-for="tab in tabs.slice(0, 10)" :key="tab" :value="tab">{{ tab }}</TabsTrigger>
  </TabsList>
</TabsRoot>`)
    unmount = () => wrapper.unmount()
    const withTen = updates.created
    wrapper.unmount()
    const { wrapper: other, updates: fewer } = mountTabs(`
<TabsRoot default-value="tab-0">
  <TabsList>
    <TabsTrigger v-for="tab in tabs.slice(0, 5)" :key="tab" :value="tab">{{ tab }}</TabsTrigger>
  </TabsList>
</TabsRoot>`)
    unmount = () => other.unmount()
    // v3's trigger renders its element itself: no roving-focus or collection wrapper per trigger.
    expect((withTen - fewer.created) / 5).toBe(1)
  })

  it('still hands the current value to a default slot that reads it', async () => {
    const { wrapper } = mountTabs(`
<TabsRoot v-slot="{ modelValue }" v-model="value">
  <TabsList>
    <TabsTrigger v-for="tab in tabs.slice(0, 3)" :key="tab" :value="tab">{{ tab }}</TabsTrigger>
  </TabsList>
  <output>{{ modelValue }}</output>
</TabsRoot>`)
    unmount = () => wrapper.unmount()
    await nextTick()
    expect(wrapper.find('output').text()).toBe('tab-0')

    await wrapper.findAll('[role=tab]')[2].trigger('click')
    await nextTick()
    expect(wrapper.find('output').text()).toBe('tab-2')
  })
})
