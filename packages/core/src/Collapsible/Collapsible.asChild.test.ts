import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
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

  it('opens when found after switching from its own element to a child component', async () => {
    const open = ref(false)
    const asChild = ref(false)
    const wrapper = mount(defineComponent({
      components: { CollapsibleRoot, CollapsibleContent, DeclaresEvents },
      setup: () => ({ open, asChild }),
      template: `
<CollapsibleRoot v-model:open="open" :unmount-on-hide="false">
  <CollapsibleContent :as-child="asChild" class="content"><DeclaresEvents v-if="asChild">Panel</DeclaresEvents><template v-else>Panel</template></CollapsibleContent>
</CollapsibleRoot>`,
    }), { attachTo: document.body })
    await nextTick()
    asChild.value = true
    await nextTick()
    await nextTick()

    wrapper.find('.content').element.dispatchEvent(new Event('beforematch', { bubbles: true }))
    await frame()
    await nextTick()

    expect(open.value).toBe(true)
    wrapper.unmount()
  })

  describe('a child that renders a positioning wrapper', () => {
    afterEach(() => {
      // @ts-expect-error restoring jsdom's missing implementation
      delete Element.prototype.getAnimations
    })

    // A popper content root is a positioning wrapper; the animated node is its first child, so
    // closing waits for that child's exit animation, not the wrapper's.
    const Positioned = defineComponent({
      setup: (_, { slots }) => () => h('div', { 'data-reka-popper-content-wrapper': '' }, [
        h('div', { 'data-testid': 'animated' }, slots.default?.()),
      ]),
    })

    it('waits for the exit animation of the wrapper\'s first child', async () => {
      let finish!: () => void
      const finished = new Promise<void>((resolve) => { finish = resolve })
      let animating = false
      Element.prototype.getAnimations = function (this: Element) {
        return animating && this.getAttribute('data-testid') === 'animated'
          ? [{ playState: 'running', finished } as unknown as Animation]
          : []
      }
      const open = ref(true)
      const wrapper = mount(defineComponent({
        components: { CollapsibleRoot, CollapsibleContent, Positioned },
        setup: () => ({ open }),
        template: `
          <CollapsibleRoot v-model:open="open">
            <CollapsibleContent as-child><Positioned>Panel</Positioned></CollapsibleContent>
          </CollapsibleRoot>`,
      }), { attachTo: document.body })
      await frame()

      animating = true
      open.value = false
      await frame()
      await frame()
      expect(wrapper.text()).toContain('Panel')

      animating = false
      finish()
      await frame()
      await frame()
      expect(wrapper.text()).not.toContain('Panel')
      wrapper.unmount()
    })
  })
})
