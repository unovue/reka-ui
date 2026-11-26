import type { App } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '.'

// Optimisation-pinning: an item is its own collapsible root and its trigger renders its own
// element, so neither mounts a `CollapsibleRoot` or a `CollapsibleTrigger` in between.

function countComponents(items: number) {
  const created: string[] = []
  const wrapper = mount(defineComponent({
    components: { AccordionRoot, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent },
    setup: () => ({ items: Array.from({ length: items }, (_, index) => `item-${index}`) }),
    template: `
<AccordionRoot type="single" collapsible>
  <AccordionItem v-for="item in items" :key="item" :value="item">
    <AccordionHeader><AccordionTrigger>{{ item }}</AccordionTrigger></AccordionHeader>
    <AccordionContent>Panel {{ item }}</AccordionContent>
  </AccordionItem>
</AccordionRoot>`,
  }), {
    global: {
      plugins: [{
        install(app: App) {
          app.mixin({
            beforeCreate() {
              created.push(this.$options.name ?? this.$options.__name ?? 'anonymous')
            },
          })
        },
      }],
    },
  })
  wrapper.unmount()
  return created
}

describe('accordion component counts', () => {
  it('mounts ten components per item', () => {
    const five = countComponents(5)
    const ten = countComponents(10)
    expect((ten.length - five.length) / 5).toBe(10)
    expect(ten).not.toContain('CollapsibleRoot')
    expect(ten).not.toContain('CollapsibleTrigger')
  })
})

describe('accordion render counts', () => {
  it('re-renders only the item that opened among 300 items', async () => {
    let updates = 0
    const wrapper = mount(defineComponent({
      components: { AccordionRoot, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent },
      setup: () => ({ items: Array.from({ length: 300 }, (_, index) => `item-${index}`) }),
      template: `
<AccordionRoot type="single" collapsible>
  <AccordionItem v-for="item in items" :key="item" :value="item">
    <AccordionHeader><AccordionTrigger>{{ item }}</AccordionTrigger></AccordionHeader>
    <AccordionContent>Panel {{ item }}</AccordionContent>
  </AccordionItem>
</AccordionRoot>`,
    }), {
      attachTo: document.body,
      global: {
        plugins: [{
          install(app: App) {
            app.mixin({
              beforeUpdate() {
                updates++
              },
            })
          },
        }],
      },
    })
    await nextTick()
    await nextTick()
    updates = 0

    const triggers = wrapper.findAll('button')
    await triggers[150].trigger('click')
    await nextTick()
    await nextTick()

    expect(triggers[150].attributes('aria-expanded')).toBe('true')
    expect(triggers[0].attributes('aria-expanded')).toBe('false')
    // One item is ten components; before, all 300 items re-rendered.
    expect(updates).toBeLessThanOrEqual(30)
    wrapper.unmount()
  }, 30_000)

  it('still hands the current value to a default slot that reads it', async () => {
    const wrapper = mount(defineComponent({
      components: { AccordionRoot, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent },
      template: `
<AccordionRoot v-slot="{ modelValue }" type="single" collapsible>
  <output>{{ modelValue }}</output>
  <AccordionItem value="a">
    <AccordionHeader><AccordionTrigger>A</AccordionTrigger></AccordionHeader>
    <AccordionContent>Panel A</AccordionContent>
  </AccordionItem>
</AccordionRoot>`,
    }), { attachTo: document.body })
    expect(wrapper.find('output').text()).toBe('')
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(wrapper.find('output').text()).toBe('a')
    wrapper.unmount()
  })
})
