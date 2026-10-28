import type {
  SlotsType,
  VNode,
} from 'vue'
import type { PresenceState } from './usePresence'
import {
  defineComponent,
  getCurrentInstance,
  getCurrentScope,
  h,
  onScopeDispose,
  shallowRef,
  watch,
} from 'vue'
import { getterRef, renderSlotFragments } from '@/shared'
import { mergeExpose, useForwardElement } from '@/shared/useForwardElement'
import { ENDING_STYLE_ATTR, PresenceController, STARTING_STYLE_ATTR } from './usePresence'

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
  /**
   * Treat an initial `present` of `true` as an open: render the child with
   * `data-starting-style` on its first frame, like Vue `<Transition appear>`.
   * Without it only a later change to `present` does. Read once, when the
   * component is set up; changing it later has no effect.
   *
   * @defaultValue false
   */
  appear?: boolean
}

export type PresenceEmits = {
  /**
   * Emitted once the enter (`true`) or exit (`false`) transitions and
   * animations of the child element have finished; on exit, right before the
   * element unmounts.
   */
  complete: [present: boolean]
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
    appear: {
      type: Boolean,
    },
  },
  emits: {
    complete: (_present: boolean) => true,
  },
  slots: {} as SlotsType<{
    default: (opts: { present: boolean }) => any
  }>,
  setup(props, { slots, expose, emit }) {
    // Element-first contract (#2808): a parent ref on `<Presence>` resolves the
    // child's element reactively (follows the child's own root swaps and the
    // unmount once presence ends).
    const { forwardRef, currentElement, expose: elementExpose } = useForwardElement()
    // The observed node, derived from the child's element (PopperContent
    // renders a positioning wrapper: its animated node is the first child).
    const node = getterRef(() => {
      const el = currentElement.value
      if (!el)
        return undefined
      return (el.hasAttribute('data-reka-popper-content-wrapper') ? el.firstElementChild : el) as HTMLElement | undefined
    })

    const state = shallowRef<PresenceState>(props.present ? 'mounted' : 'unmounted')
    expose(mergeExpose(elementExpose, { present: getterRef(() => state.value !== 'unmounted') }))

    // A Presence that has never been present (a closed popup, an unchecked
    // indicator) has nothing to animate: the transition machinery is created
    // the first time `present` is true, and until then this one watcher only
    // waits for it.
    let controller: PresenceController | undefined
    const scope = getCurrentScope()
    // `appear` is read once, at setup.
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
    }, { immediate: true })

    return () => {
      const isPresent = state.value !== 'unmounted'
      if (props.forceMount || props.present || isPresent) {
        const children = slots.default({ present: isPresent })
        // eslint-disable-next-line node/prefer-global/process
        if (process.env.NODE_ENV !== 'production')
          validateChildren(children)
        // Rendered as props (not set on the DOM node afterwards) so the starting
        // style is already applied when the element is inserted, before anything
        // (auto-focus, positioning) resolves its styles. Every part forwards its
        // attrs to the element Presence observes.
        const status = controller?.transitionStatus.value
        return h(children[0] as VNode, {
          ...(status === 'starting' && { [STARTING_STYLE_ATTR]: '' }),
          ...(status === 'ending' && { [ENDING_STYLE_ATTR]: '' }),
          // The owner's own `forwardRef` (not a wrapping callback), so a reka
          // part child links to it without an expose proxy (`useForwardElement`).
          ref: forwardRef,
        })
      }
      else { return null }
    }
  },
})

/** Dev-only: Presence wraps exactly one child (checked when it renders). */
function validateChildren(children: VNode[] | undefined) {
  if (renderSlotFragments(children || []).length <= 1)
    return
  const instance = getCurrentInstance()
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
