// Vapor-mode `Presence`. The VDOM Presence renders the slot's first VNode with an extra `ref` and the
// `data-starting-style` / `data-ending-style` attributes (`h(child, …)`). In Vapor the slot returns
// DOM blocks, so the node is read from the rendered block and the attributes are patched onto it.
// Vapor doesn't pass fallthrough attrs through a component whose root is a `<slot>` (dev warns
// "extraneous attrs"); VDOM fallthrough reaches the slotted child. Components rooted in Presence
// forward `$attrs` to the child themselves (`presenceRootAttrs` in plugins.mjs); attrs given to
// Presence itself are patched onto the node.
import type { PresenceState } from '@/Presence/usePresence'
import { computed, getCurrentScope, onScopeDispose, shallowRef, watch } from 'vue'
import { ENDING_STYLE_ATTR, PresenceController, STARTING_STYLE_ATTR } from '@/Presence/usePresence'
import { adoptRoot } from './Primitive'
import { createIf, createSlot, defineVaporComponent } from './shared/internals'

export interface PresenceProps {
  present: boolean
  forceMount?: boolean
  appear?: boolean
}

export const Presence = defineVaporComponent({
  name: 'Presence',
  // Its root is a slot, which Vapor fallthrough doesn't pass; attrs are patched onto the node below
  inheritAttrs: false,
  props: {
    present: { type: Boolean, required: true },
    forceMount: { type: Boolean },
    appear: { type: Boolean },
  },
  setup(props, { attrs, expose, emit }) {
    // The slot's first element, and the observed node (inside a popper wrapper, its content)
    const root = shallowRef<Element | null>(null)
    const toNode = (el: Element | null) => (el?.hasAttribute('data-reka-popper-content-wrapper') ? el.firstElementChild : el) as HTMLElement | null
    const node = computed(() => toNode(root.value) ?? undefined)

    const state = shallowRef<PresenceState>(props.present ? 'mounted' : 'unmounted')
    const isPresent = computed(() => state.value !== 'unmounted')
    expose({
      element: root,
      get $el() {
        return root.value
      },
      present: isPresent,
    })

    // Created the first time `present` is true, as in the VDOM version. Synchronous, so the state
    // has moved before the `createIf` below re-evaluates.
    let controller: PresenceController | undefined
    const scope = getCurrentScope()
    const appear = props.appear
    watch([() => props.present, node], ([present, el], [prevPresent, prevEl]) => {
      if (present !== prevPresent) {
        if (!controller && present) {
          controller = new PresenceController(state, node, {
            appear,
            onComplete: value => emit('complete', value),
          })
          const created = controller
          scope?.run(() => onScopeDispose(() => created.cancelPending()))
        }
        controller?.onPresentChange(present, prevPresent)
      }
      if (el !== prevEl)
        controller?.onNodeChange(el)
    }, { immediate: true, flush: 'sync' })

    return createIf(
      () => props.forceMount || props.present || isPresent.value,
      () => {
        const block = createSlot('default', { present: () => isPresent.value })
        // Patched before the block is inserted, so the starting style applies from the first frame
        const tracked = adoptRoot(block, () => {
          const status = controller?.transitionStatus.value
          return {
            ...attrs,
            ...(status === 'starting' && { [STARTING_STYLE_ATTR]: '' }),
            ...(status === 'ending' && { [ENDING_STYLE_ATTR]: '' }),
          }
        }, { override: true })
        watch(tracked, (el) => {
          root.value = el
        }, { immediate: true, flush: 'sync' })
        onScopeDispose(() => {
          if (root.value === tracked.value)
            root.value = null
        })
        return block
      },
    )
  },
})

export default Presence
