import type {
  SlotsType,
  VNode,
} from 'vue'
import {
  defineComponent,
  getCurrentInstance,
  h,
  ref,
  toRefs,
} from 'vue'
import { renderSlotFragments } from '@/shared'
import { mergeExpose, useForwardElement } from '@/shared/useForwardElement'
import { ENDING_STYLE_ATTR, STARTING_STYLE_ATTR, usePresence } from './usePresence'

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
   * Without it only a later change to `present` does.
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
    const { present, forceMount } = toRefs(props)

    const node = ref<HTMLElement>()
    // Mount composables once to prevent duplicated eventListener
    const { isPresent, transitionStatus } = usePresence(present, node, {
      appear: props.appear,
      onComplete: value => emit('complete', value),
    })
    // Element-first contract (#2808): a parent ref on `<Presence>` resolves the
    // child's element reactively (follows the child's own root swaps and the
    // unmount once presence ends).
    const { forwardRef, currentElement, expose: elementExpose } = useForwardElement()
    expose(mergeExpose(elementExpose, { present: isPresent }))

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

    return () => {
      if (forceMount.value || present.value || isPresent.value) {
        // Rendered as props (not set on the DOM node afterwards) so the starting
        // style is already applied when the element is inserted, before anything
        // (auto-focus, positioning) resolves its styles. Every part forwards its
        // attrs to the element Presence observes.
        const status = transitionStatus.value
        return h(slots.default({ present: isPresent.value })[0] as VNode, {
          ...(status === 'starting' && { [STARTING_STYLE_ATTR]: '' }),
          ...(status === 'ending' && { [ENDING_STYLE_ATTR]: '' }),
          ref: (v) => {
            forwardRef(v)
            const el = currentElement.value
            if (typeof el?.hasAttribute === 'undefined')
              return el

            // special case to handle animation for PopperContent
            if (el?.hasAttribute('data-reka-popper-content-wrapper'))
              node.value = el.firstElementChild as HTMLElement
            else
              node.value = el

            return el
          },
        })
      }
      else { return null }
    }
  },
})
