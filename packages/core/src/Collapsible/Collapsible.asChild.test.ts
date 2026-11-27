import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CollapsibleContent, CollapsibleRoot } from '.'

// The content listens for `beforematch` (find-in-page) and `animationend` on its element. With
// `asChild` the element belongs to the child, which may be a component that takes those events for
// itself or does not pass its attributes on.

const frame = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)))

const DeclaresEvents = defineComponent({
  emits: ['animationend', 'beforematch'],
  setup: (_, { slots }) => () => h('section', { class: 'content' }, slots.default?.()),
})

const KeepsAttrs = defineComponent({
  inheritAttrs: false,
  setup: (_, { slots }) => () => h('section', { class: 'content' }, slots.default?.()),
})

describe('collapsible content rendered as a child component', () => {
  for (const [name, Child] of [['declares the events', DeclaresEvents], ['does not inherit attributes', KeepsAttrs]] as const) {
    it(`opens when its element is found in the page (child ${name})`, async () => {
      const open = ref(false)
      const found = ref(0)
      const wrapper = mount(defineComponent({
        components: { CollapsibleRoot, CollapsibleContent, Child },
        setup: () => ({ open, found }),
        template: `
<CollapsibleRoot v-model:open="open" :unmount-on-hide="false">
  <CollapsibleContent as-child @content-found="found++"><Child>Panel</Child></CollapsibleContent>
</CollapsibleRoot>`,
      }), { attachTo: document.body })
      await nextTick()
      await nextTick()

      wrapper.find('.content').element.dispatchEvent(new Event('beforematch', { bubbles: true }))
      await frame()
      await nextTick()

      expect(open.value).toBe(true)
      expect(found.value).toBe(1)
      wrapper.unmount()
    })
  }
})
