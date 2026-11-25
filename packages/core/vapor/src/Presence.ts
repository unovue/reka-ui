// SPIKE: Vapor-mode `Presence`. v2's Presence renders the slot's first VNode with an extra `ref`
// (cloneVNode). In Vapor the slot returns DOM blocks, so the node is read from the rendered block.
// Vapor doesn't pass fallthrough attrs through a component whose root is a `<slot>` (dev warns
// "extraneous attrs"); VDOM fallthrough reaches the slotted child. Components rooted in Presence must
// forward `$attrs` themselves (see PATCHES in vite.config.mjs).
import { createIf, createSlot, defineVaporComponent, onScopeDispose, ref, toRefs } from 'vue'
import { usePresence } from '@/Presence/usePresence'
import { findElement } from './Primitive'

export interface PresenceProps {
  present: boolean
  forceMount?: boolean
}

export const Presence = defineVaporComponent({
  name: 'Presence',
  props: {
    present: { type: Boolean, required: true },
    forceMount: { type: Boolean },
  },
  setup(props, { expose }) {
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
