import type { App } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '.'

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
<TabsRoot default-value="tab-0">
  <TabsList>
    <TabsTrigger v-for="tab in tabs" :key="tab" :value="tab">{{ tab }}</TabsTrigger>
  </TabsList>
  <TabsContent v-for="tab in tabs" :key="tab" :value="tab">Panel {{ tab }}</TabsContent>
</TabsRoot>`

describe('tabs render counts', () => {
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
    triggers[0].element.focus()
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

    await triggers[500].trigger('mousedown', { button: 0, ctrlKey: false })
    await nextTick()

    expect(triggers[500].attributes('data-state')).toBe('active')
    expect(triggers[0].attributes('data-state')).toBe('inactive')
    const panels = wrapper.findAll('[role=tabpanel]')
    expect(panels[500].attributes('data-state')).toBe('active')
    expect(panels[0].attributes('data-state')).toBe('inactive')
    expect(updates.count, JSON.stringify([...updates.names])).toBeLessThanOrEqual(MAX_UPDATES)
  }, 30_000)

  it('mounts a trigger as two components', async () => {
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
    // The trigger and the element it renders: no roving-focus or collection wrapper per trigger.
    expect((withTen - fewer.created) / 5).toBe(2)
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

    await wrapper.findAll('[role=tab]')[2].trigger('mousedown', { button: 0, ctrlKey: false })
    await nextTick()
    expect(wrapper.find('output').text()).toBe('tab-2')
  })
})
