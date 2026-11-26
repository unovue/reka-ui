import type { App } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
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
