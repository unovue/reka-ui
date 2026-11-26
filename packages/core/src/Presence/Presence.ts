import type {
  Slots,
  SlotsType,
  VNode,
} from 'vue'
import type { BlockVNode } from '@/Primitive/stableSlot'
import { unrefElement } from '@vueuse/core'
import {
  defineComponent,
  Fragment,
  getCurrentInstance,
  h,
  ref,
  toRefs,
} from 'vue'
import { dynamicChildrenOf, FULL_PROPS, trackStableSlot } from '@/Primitive/stableSlot'
import { renderSlotFragments } from '@/shared'
import { usePresence } from './usePresence'

export interface PresenceProps {
  /**
   * Conditional to mount or unmount the child element. Similar to `v-if`
   *
   * @required true
   */
  present: boolean
  /**
   * Force the element to render all the time.
   *
   * Useful for programmatically render grandchild component with the exposed `present`
   *
   * @defaultValue false
   */
  forceMount?: boolean
}

export default defineComponent({
  name: 'Presence',
  props: {
    present: {
      type: Boolean,
      required: true,
    },
    forceMount: {
      type: Boolean,
    },
  },
  slots: {} as SlotsType<{
    default: (opts: { present: boolean }) => any
  }>,
  setup(props, { slots, expose }) {
    const { present, forceMount } = toRefs(props)

    const node = ref<HTMLElement>()
    // Mount composables once to prevent duplicated eventListener
    const { isPresent } = usePresence(present, node)
    expose({ present: isPresent })

    let children = slots.default({ present: isPresent.value })
    children = renderSlotFragments(children || [])
    const instance = getCurrentInstance()

    if (children && children?.length > 1) {
      const componentName = instance?.parent?.type.name
        ? `<${instance.parent.type.name} />`
        : 'component'

      throw new Error(
        [
          `Detected an invalid children for \`${componentName}\` for  \`Presence\` component.`,
          '',
          'Note: Presence works similarly to `v-if` directly, but it waits for animation/transition to finished before unmounting. So it expect only one direct child of valid VNode type.',
          'You can apply a few solutions:',
          [
            'Provide a single child element so that `presence` directive attach correctly.',
            'Ensure the first child is an actual element instead of a raw text node or comment node.',
          ]
            .map(line => `  - ${line}`)
            .join('\n'),
        ].join('\n'),
      )
    }

    // One function for every render, so that the child's props stay the same between renders
    function setNode(v: unknown) {
      const el = unrefElement(v as HTMLElement)
      if (!el) {
        node.value = undefined
        return el
      }
      if (typeof el?.hasAttribute === 'undefined')
        return el

      // special case to handle animation for PopperContent
      if (el?.hasAttribute('data-reka-popper-content-wrapper'))
        node.value = el.firstElementChild as HTMLElement
      else
        node.value = el

      return el
    }

    return () => {
      if (forceMount.value || present.value || isPresent.value) {
        const slotProps = { present: isPresent.value }
        // A compiler-stable slot is called with block tracking on, see `trackStableSlot`
        const tracked = trackStableSlot(slots as Slots, slotProps)
        const child = (tracked ? tracked.children : slots.default(slotProps))[0] as VNode
        const vnode: BlockVNode = h(child, { ref: setNode })
        // `h()` of a vnode marks the clone for a full diff. With the slot content tracked, the clone
        // can be patched like the node the compiler made: all of its props, and only what can
        // change below it. Otherwise Vue updates the child component on every render of Presence
        const dynamicChildren = tracked && child.type !== Fragment ? dynamicChildrenOf(tracked, child) : null
        if (dynamicChildren) {
          vnode.patchFlag = child.patchFlag > 0 ? child.patchFlag | FULL_PROPS : FULL_PROPS
          vnode.dynamicChildren ??= dynamicChildren
        }
        return vnode
      }
      else { return null }
    }
  },
})
