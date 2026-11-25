// Vapor-mode `Presence`. v2's Presence renders the slot's first VNode with an extra `ref`
// (cloneVNode). In Vapor the slot returns DOM blocks, so the node is read from the rendered block.
// Vapor doesn't pass fallthrough attrs through a component whose root is a `<slot>` (dev warns
// "extraneous attrs"); VDOM fallthrough reaches the slotted child. Components rooted in Presence
// forward `$attrs` to the child themselves (`presenceRootAttrs` in plugins.mjs); attrs given to
// Presence itself are patched onto the node.
import { ref, toRefs, watchEffect } from 'vue'
import { usePresence } from '@/Presence/usePresence'
import { adoptRoot } from './Primitive'
import { createIf, createSlot, defineVaporComponent, trackRootElement } from './shared/internals'

export interface PresenceProps {
  present: boolean
  forceMount?: boolean
}

export const Presence = defineVaporComponent({
  name: 'Presence',
  // Its root is a slot, which Vapor fallthrough doesn't pass; attrs are patched onto the node below
  inheritAttrs: false,
  props: {
    present: { type: Boolean, required: true },
    forceMount: { type: Boolean },
  },
  setup(props, { attrs, expose }) {
    const { present, forceMount } = toRefs(props)
    const node = ref<HTMLElement>()
    const { isPresent } = usePresence(present, node)
    expose({ present: isPresent })

    return createIf(
      () => forceMount.value || present.value || isPresent.value,
      () => {
        const block = createSlot('default', { present: () => isPresent.value })
        // The node is the slot's first element (inside a popper wrapper, its content), and follows
        // it when the slot replaces it while mounted (a dynamic `as`, a `v-if` root)
        const toNode = (el: Element | null) => (el?.hasAttribute('data-reka-popper-content-wrapper') ? el.firstElementChild : el) as HTMLElement | null
        // VDOM fallthrough puts Presence's attrs on the slotted child: the listeners for the custom
        // `enter` / `after-leave` events usePresence dispatches on the node, mostly
        const root = Object.keys(attrs).length
          ? adoptRoot(block, () => attrs, { override: true }, toNode)
          : trackRootElement(block)
        watchEffect((cleanup) => {
          const el = toNode(root.value) ?? undefined
          node.value = el
          cleanup(() => {
            if (node.value === el)
              node.value = undefined
          })
        }, { flush: 'sync' })
        return block
      },
    )
  },
})

export default Presence
