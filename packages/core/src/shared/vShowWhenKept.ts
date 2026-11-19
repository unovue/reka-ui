import type { ObjectDirective, VNode } from 'vue'
import { vShow } from 'vue'

const KEPT = 'kept'

type VShowElement = Parameters<NonNullable<typeof vShow.beforeMount>>[0]

const isKept = (binding: { arg?: string | null }) => binding.arg === KEPT

/** The vnode without the transition hooks, so that `vShow` only toggles the display. */
const withoutTransition = <T extends VNode<any, any>>(vnode: T): T => ({ ...vnode, transition: null })

/**
 * On mount, the renderer runs the enter (or appear) hooks of a transition itself unless it is
 * `persisted`, which a `<Transition>` only sets for a `v-show` child of its own. `vShow` must not
 * run them a second time.
 */
const forMount = <T extends VNode<any, any>>(vnode: T): T => vnode.transition?.persisted ? vnode : withoutTransition(vnode)

/**
 * `v-show` that only acts while its argument is `'kept'`, for content that a root keeps mounted
 * while closed (`unmountOnHide: false`): `v-show-when-kept:[kept ? 'kept' : null]="present"`.
 *
 * Otherwise it does nothing at all. A plain `v-show`, even always `true`, runs the enter hook of a
 * wrapping `<Transition>` on mount, on top of the one the Transition runs itself. Switching between
 * a `v-show` branch and a branch without it would remount the content and lose its state instead.
 *
 * Named `show` like `vShow`, so that hydration expects the `display: none` it renders on the server.
 * @internal
 */
export const vShowWhenKept: ObjectDirective<VShowElement, boolean> & { name: string } = {
  name: 'show',
  beforeMount(el, binding, vnode, prevVNode) {
    if (isKept(binding))
      vShow.beforeMount!(el, binding, forMount(vnode), prevVNode)
  },
  mounted(el, binding, vnode, prevVNode) {
    if (isKept(binding))
      vShow.mounted!(el, binding, forMount(vnode), prevVNode)
  },
  updated(el, binding, vnode, prevVNode) {
    const wasKept = prevVNode.dirs?.some(dir => dir.dir === vShowWhenKept && isKept(dir)) ?? false
    if (isKept(binding)) {
      // Starts acting now: record the display to restore and apply the value, without transition
      if (!wasKept)
        vShow.beforeMount!(el, binding, withoutTransition(vnode), null)
      else
        vShow.updated!(el, binding, vnode, prevVNode)
    }
    else if (wasKept) {
      // Stops acting: leave the content shown. With the transition, so that showing it again
      // first cancels a leave still running from when it was hidden, whose end would hide it.
      vShow.updated!(el, { ...binding, value: true }, vnode, prevVNode)
    }
  },
  beforeUnmount(el, binding, vnode, prevVNode) {
    if (isKept(binding))
      vShow.beforeUnmount!(el, binding, vnode, prevVNode)
  },
  getSSRProps(binding) {
    return isKept(binding) && !binding.value ? { style: { display: 'none' } } : {}
  },
}
