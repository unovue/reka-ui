// Vapor-mode `Presence`. v2's Presence renders the slot's first VNode with an extra `ref`
// (cloneVNode). In Vapor the slot returns DOM blocks, so the node is read from the rendered block.
// Vapor doesn't pass fallthrough attrs through a component whose root is a `<slot>` (dev warns
// "extraneous attrs"); VDOM fallthrough reaches the slotted child. Components rooted in Presence
// forward `$attrs` to the child themselves (`presenceRootAttrs` in plugins.mjs); attrs given to
// Presence itself are patched onto the node.
import { onScopeDispose, ref, toRefs } from 'vue'
import { usePresence } from '@/Presence/usePresence'
import { adopt } from './Primitive'
import { createIf, createSlot, defineVaporComponent, findElement } from './shared/internals'

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
        const el = findElement(block) as HTMLElement | null
        node.value = el?.hasAttribute('data-reka-popper-content-wrapper')
          ? el.firstElementChild as HTMLElement
          : el ?? undefined
        // VDOM fallthrough puts Presence's attrs on the slotted child: the listeners for the custom
        // `enter` / `after-leave` events usePresence dispatches on the node, mostly
        if (node.value && Object.keys(attrs).length)
          adopt(node.value, () => attrs, { override: true })
        onScopeDispose(() => {
          if (node.value === el || node.value === el?.firstElementChild)
            node.value = undefined
        })
        return block
      },
    )
  },
})

export default Presence
